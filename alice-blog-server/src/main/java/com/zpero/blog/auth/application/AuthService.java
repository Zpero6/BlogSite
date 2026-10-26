package com.zpero.blog.auth.application;

import com.zpero.blog.auth.api.AuthRequests.LoginRequest;
import com.zpero.blog.auth.api.AuthRequests.RegisterRequest;
import com.zpero.blog.auth.api.CurrentUserResponse;
import com.zpero.blog.common.ApiException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private final SecureRandom random = new SecureRandom();
    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;
    private final VerificationCodeHasher hasher;
    private final boolean registrationEnabled;

    public AuthService(JdbcTemplate jdbc, PasswordEncoder passwordEncoder, VerificationCodeHasher hasher,
        @Value("${blog.registration-enabled}") boolean registrationEnabled) {
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
        this.hasher = hasher;
        this.registrationEnabled = registrationEnabled;
    }

    @Transactional
    public void sendCode(String rawEmail) {
        requireRegistration();
        String email = normalize(rawEmail);
        if (!jdbc.queryForList("SELECT id FROM blog_user WHERE email=?", Long.class, email).isEmpty())
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_REGISTERED", "该邮箱已注册");
        Integer recent = jdbc.queryForObject("""
            SELECT COUNT(*) FROM email_verification
            WHERE email=? AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)
            """, Integer.class, email);
        if (recent != null && recent > 0)
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "CODE_TOO_FREQUENT", "请 60 秒后再获取验证码");

        String code = "%06d".formatted(random.nextInt(1_000_000));
        jdbc.update("""
            INSERT INTO email_verification(email,code_hash,expires_at)
            VALUES(?,?,DATE_ADD(NOW(), INTERVAL 5 MINUTE))
            """, email, hasher.hash(email, code));
        log.info("DEV EMAIL CODE email={} code={} expiresIn=5m", email, code);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public CurrentUserResponse register(RegisterRequest request) {
        requireRegistration();
        String email = normalize(request.email());
        if (!jdbc.queryForList("SELECT id FROM blog_user WHERE email=?", Long.class, email).isEmpty())
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_REGISTERED", "该邮箱已注册");
        Verification verification = jdbc.query("""
            SELECT id,code_hash,expires_at,attempts FROM email_verification
            WHERE email=? AND verified=FALSE ORDER BY created_at DESC LIMIT 1 FOR UPDATE
            """, (rs, row) -> new Verification(rs.getLong("id"), rs.getString("code_hash"),
                rs.getTimestamp("expires_at").toLocalDateTime(), rs.getInt("attempts")), email)
            .stream().findFirst().orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "CODE_REQUIRED", "请先获取验证码"));
        if (verification.expiresAt().isBefore(LocalDateTime.now()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "CODE_EXPIRED", "验证码已过期");
        if (verification.attempts() >= 5)
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "CODE_ATTEMPTS_EXCEEDED", "验证码尝试次数已用完");
        if (!hasher.matches(email, request.code(), verification.hash())) {
            jdbc.update("UPDATE email_verification SET attempts=attempts+1 WHERE id=?", verification.id());
            throw new ApiException(HttpStatus.BAD_REQUEST, "CODE_INVALID", "验证码错误");
        }
        jdbc.update("UPDATE email_verification SET verified=TRUE WHERE id=?", verification.id());
        jdbc.update("""
            INSERT INTO blog_user(email,password_hash,display_name,role,status)
            VALUES(?,?,?,'USER','ACTIVE')
            """, email, passwordEncoder.encode(request.password()), request.displayName().trim());
        return findByEmail(email);
    }

    public CurrentUserResponse login(LoginRequest request) {
        String email = normalize(request.email());
        UserCredentials user = jdbc.query("""
            SELECT id,email,password_hash,display_name,role,status FROM blog_user WHERE email=?
            """, (rs, row) -> new UserCredentials(rs.getLong("id"), rs.getString("email"), rs.getString("password_hash"),
                rs.getString("display_name"), rs.getString("role"), rs.getString("status")), email)
            .stream().findFirst().orElseThrow(this::badCredentials);
        if (!"ACTIVE".equals(user.status()) || !passwordEncoder.matches(request.password(), user.passwordHash()))
            throw badCredentials();
        return new CurrentUserResponse(user.id(), user.email(), user.displayName(), user.role());
    }

    public CurrentUserResponse findByEmail(String email) {
        return jdbc.query("""
            SELECT id,email,display_name,role FROM blog_user WHERE email=? AND status='ACTIVE'
            """, (rs, row) -> new CurrentUserResponse(rs.getLong("id"), rs.getString("email"),
                rs.getString("display_name"), rs.getString("role")), normalize(email))
            .stream().findFirst().orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "SESSION_INVALID", "登录状态已失效"));
    }

    private void requireRegistration() {
        if (!registrationEnabled)
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "REGISTRATION_DISABLED", "注册功能暂未开放");
    }
    private String normalize(String email) { return email.trim().toLowerCase(); }
    private ApiException badCredentials() { return new ApiException(HttpStatus.UNAUTHORIZED, "BAD_CREDENTIALS", "邮箱或密码错误"); }
    private record Verification(long id, String hash, LocalDateTime expiresAt, int attempts) {}
    private record UserCredentials(long id, String email, String passwordHash, String displayName, String role, String status) {}
}

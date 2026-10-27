package com.zpero.blog.auth.application;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Creates the first administrator on startup when ADMIN_EMAIL and ADMIN_PASSWORD
 * are configured. An existing regular account with the same email is promoted;
 * its password is never rewritten implicitly.
 */
@Component
class AdminBootstrap implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;
    private final String displayName;

    AdminBootstrap(
        JdbcTemplate jdbc,
        PasswordEncoder passwordEncoder,
        @Value("${blog.admin-email}") String email,
        @Value("${blog.admin-password}") String password,
        @Value("${blog.admin-display-name}") String displayName
    ) {
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
        this.password = password;
        this.displayName = displayName;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            log.info("ADMIN_EMAIL / ADMIN_PASSWORD 未配置，跳过管理员初始化");
            return;
        }
        String normalizedEmail = email.trim().toLowerCase();
        if (password.length() < 8 || password.length() > 72) {
            log.warn("ADMIN_PASSWORD 长度须为 8-72，跳过管理员初始化");
            return;
        }

        List<AdminState> existing = jdbc.query(
            "SELECT id,role FROM blog_user WHERE email=?",
            (rs, row) -> new AdminState(rs.getLong("id"), rs.getString("role")),
            normalizedEmail
        );
        if (existing.isEmpty()) {
            String name = displayName == null || displayName.isBlank() ? "Zpero" : displayName.trim();
            jdbc.update("""
                INSERT INTO blog_user(email,password_hash,display_name,role,status)
                VALUES(?,?,?,'ADMIN','ACTIVE')
                """, normalizedEmail, passwordEncoder.encode(password), name);
            log.info("已创建管理员账号：{}", normalizedEmail);
            return;
        }
        if ("ADMIN".equals(existing.getFirst().role())) {
            log.info("管理员账号已存在：{}", normalizedEmail);
            return;
        }
        jdbc.update("UPDATE blog_user SET role='ADMIN' WHERE id=?", existing.getFirst().id());
        log.warn("已将现有账号提升为管理员：{}（密码未修改）", normalizedEmail);
    }

    private record AdminState(long id, String role) {}
}

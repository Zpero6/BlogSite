package com.zpero.blog.auth.api;

import com.zpero.blog.auth.api.AuthRequests.EmailCodeRequest;
import com.zpero.blog.auth.api.AuthRequests.LoginRequest;
import com.zpero.blog.auth.api.AuthRequests.RegisterRequest;
import com.zpero.blog.auth.application.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.Map;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService service;
    private final HttpSessionSecurityContextRepository repository = new HttpSessionSecurityContextRepository();

    public AuthController(AuthService service) { this.service = service; }

    @PostMapping("/email-code")
    Map<String, String> sendCode(@Valid @RequestBody EmailCodeRequest request) {
        service.sendCode(request.email());
        return Map.of("message", "验证码已发送；开发环境请查看后端日志");
    }

    @PostMapping("/register")
    CurrentUserResponse register(@Valid @RequestBody RegisterRequest request, HttpServletRequest servletRequest, HttpServletResponse response) {
        CurrentUserResponse user = service.register(request);
        authenticate(user, servletRequest, response);
        return user;
    }

    @PostMapping("/login")
    CurrentUserResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest, HttpServletResponse response) {
        CurrentUserResponse user = service.login(request);
        authenticate(user, servletRequest, response);
        return user;
    }

    @PostMapping("/logout")
    Map<String, String> logout(HttpServletRequest request) {
        if (request.getSession(false) != null) request.getSession(false).invalidate();
        SecurityContextHolder.clearContext();
        return Map.of("message", "已退出登录");
    }

    @GetMapping("/me")
    CurrentUserResponse me(Principal principal) { return service.findByEmail(principal.getName()); }

    private void authenticate(CurrentUserResponse user, HttpServletRequest request, HttpServletResponse response) {
        var authentication = UsernamePasswordAuthenticationToken.authenticated(
            user.email(), null, java.util.List.of(new SimpleGrantedAuthority("ROLE_" + user.role())));
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        // Rotate the session identifier after registration/login to prevent session fixation.
        request.getSession(true);
        request.changeSessionId();
        repository.saveContext(context, request, response);
    }
}

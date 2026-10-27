package com.zpero.blog.common;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.InvalidCsrfTokenException;
import org.springframework.security.web.csrf.MissingCsrfTokenException;

@Configuration
public class SecurityConfiguration {
    @Bean
    SecurityFilterChain security(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/v1/health",
                    "/api/v1/auth/csrf",
                    "/api/v1/auth/email-code",
                    "/api/v1/auth/register",
                    "/api/v1/auth/login",
                    "/error",
                    "/v3/api-docs/**",
                    "/swagger-ui/**"
                ).permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/articles/**", "/api/v1/categories", "/api/v1/tags").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/articles/*/view").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/auth/**").authenticated()
                .requestMatchers(
                    "/api/v1/articles/**",
                    "/api/v1/favorites",
                    "/api/v1/comments/**",
                    "/api/v1/subscriptions/**",
                    "/api/v1/notifications/**"
                ).authenticated()
                .anyRequest().denyAll())
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .exceptionHandling(errors -> errors
                .authenticationEntryPoint((request, response, error) ->
                    writeJson(response, HttpServletResponse.SC_UNAUTHORIZED, "UNAUTHORIZED", "请先登录"))
                .accessDeniedHandler(SecurityConfiguration::handleDenied))
            .build();
    }

    @Bean
    BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private static void handleDenied(
        HttpServletRequest request, HttpServletResponse response, AccessDeniedException error
    ) throws IOException {
        if (error instanceof InvalidCsrfTokenException || error instanceof MissingCsrfTokenException) {
            writeJson(response, HttpServletResponse.SC_FORBIDDEN, "CSRF_TOKEN_INVALID", "CSRF 令牌无效，请刷新页面后重试");
        } else {
            writeJson(response, HttpServletResponse.SC_FORBIDDEN, "FORBIDDEN", "没有权限执行此操作");
        }
    }

    private static void writeJson(HttpServletResponse response, int status, String code, String message)
        throws IOException {
        response.setStatus(status);
        response.setCharacterEncoding("UTF-8");
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"code\":\"" + code + "\",\"message\":\"" + message + "\"}");
    }
}

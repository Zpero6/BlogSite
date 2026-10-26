package com.zpero.blog.common;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
@Configuration
public class SecurityConfiguration {
 @Bean SecurityFilterChain security(HttpSecurity http) throws Exception {
  return http.csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()).csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
   .authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/v1/health","/api/v1/auth/csrf","/api/v1/auth/email-code","/api/v1/auth/register","/api/v1/auth/login","/api/v1/articles/**","/api/v1/categories","/api/v1/tags","/v3/api-docs/**","/swagger-ui/**").permitAll()
    .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
    .requestMatchers("/api/v1/auth/**").authenticated()
    .anyRequest().denyAll())
   .formLogin(form -> form.disable()).httpBasic(basic -> basic.disable())
   .exceptionHandling(errors -> errors.authenticationEntryPoint((request,response,error)->response.sendError(401)).accessDeniedHandler((request,response,error)->response.sendError(403)))
   .build();
 }
 @Bean BCryptPasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
}

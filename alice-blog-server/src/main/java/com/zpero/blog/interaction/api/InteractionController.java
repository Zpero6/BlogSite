package com.zpero.blog.interaction.api;

import com.zpero.blog.article.api.ArticleSummaryResponse;
import com.zpero.blog.interaction.application.InteractionService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.security.Principal;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class InteractionController {
    private static final String DEVICE_COOKIE = "ZPERO_DEVICE";

    private final InteractionService service;
    private final boolean secureCookie;

    public InteractionController(
        InteractionService service,
        @Value("${server.servlet.session.cookie.secure:false}") boolean secureCookie
    ) {
        this.service = service;
        this.secureCookie = secureCookie;
    }

    @PostMapping("/articles/{id}/view")
    ViewResult view(
        @PathVariable long id,
        Principal principal,
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        String email = principal == null ? null : principal.getName();
        String deviceId = null;
        if (email == null) {
            deviceId = validDeviceId(readCookie(request));
            if (deviceId == null) {
                deviceId = UUID.randomUUID().toString();
                ResponseCookie cookie = ResponseCookie.from(DEVICE_COOKIE, deviceId)
                    .httpOnly(true)
                    .sameSite("Lax")
                    .path("/")
                    .maxAge(Duration.ofDays(365))
                    .secure(secureCookie)
                    .build();
                response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            }
        }
        return service.recordView(id, email, deviceId);
    }

    @GetMapping("/articles/{id}/interactions")
    InteractionState state(@PathVariable long id, Principal principal) {
        return service.state(id, principal == null ? null : principal.getName());
    }

    @PutMapping("/articles/{id}/like")
    InteractionState like(@PathVariable long id, Principal principal) {
        return service.like(id, principal.getName());
    }

    @DeleteMapping("/articles/{id}/like")
    InteractionState unlike(@PathVariable long id, Principal principal) {
        return service.unlike(id, principal.getName());
    }

    @PutMapping("/articles/{id}/favorite")
    InteractionState favorite(@PathVariable long id, Principal principal) {
        return service.favorite(id, principal.getName());
    }

    @DeleteMapping("/articles/{id}/favorite")
    InteractionState unfavorite(@PathVariable long id, Principal principal) {
        return service.unfavorite(id, principal.getName());
    }

    @GetMapping("/favorites")
    List<ArticleSummaryResponse> favorites(Principal principal) {
        return service.favorites(principal.getName());
    }

    private String readCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie cookie : cookies) {
            if (DEVICE_COOKIE.equals(cookie.getName())) return cookie.getValue();
        }
        return null;
    }

    private String validDeviceId(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            UUID.fromString(value);
            return value;
        } catch (IllegalArgumentException error) {
            return null;
        }
    }
}

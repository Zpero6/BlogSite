package com.zpero.blog.auth.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthRequests {
    private AuthRequests() {}

    public record EmailCodeRequest(@NotBlank @Email @Size(max=254) String email) {}

    public record RegisterRequest(
        @NotBlank @Email @Size(max=254) String email,
        @NotBlank @Pattern(regexp="\\d{6}", message="必须是 6 位数字") String code,
        @NotBlank @Size(min=8, max=72) String password,
        @NotBlank @Size(min=2, max=60) String displayName
    ) {}

    public record LoginRequest(
        @NotBlank @Email @Size(max=254) String email,
        @NotBlank @Size(max=72) String password
    ) {}
}

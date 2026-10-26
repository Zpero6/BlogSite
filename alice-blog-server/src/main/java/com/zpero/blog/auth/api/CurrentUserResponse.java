package com.zpero.blog.auth.api;

public record CurrentUserResponse(Long id, String email, String displayName, String role) {}

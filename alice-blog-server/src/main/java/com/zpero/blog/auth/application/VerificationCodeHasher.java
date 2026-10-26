package com.zpero.blog.auth.application;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
class VerificationCodeHasher {
    private final String pepper;
    VerificationCodeHasher(@Value("${blog.verification-pepper}") String pepper) { this.pepper = pepper; }

    String hash(String email, String code) {
        try {
            byte[] value = (email.toLowerCase() + ":" + code + ":" + pepper).getBytes(StandardCharsets.UTF_8);
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value));
        } catch (Exception impossible) {
            throw new IllegalStateException(impossible);
        }
    }

    boolean matches(String email, String code, String expected) {
        return MessageDigest.isEqual(hash(email, code).getBytes(StandardCharsets.UTF_8), expected.getBytes(StandardCharsets.UTF_8));
    }
}

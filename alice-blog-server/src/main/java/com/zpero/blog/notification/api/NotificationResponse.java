package com.zpero.blog.notification.api;

import java.time.LocalDateTime;

public record NotificationResponse(
    long id,
    long articleId,
    String articleSlug,
    String articleTitle,
    boolean read,
    LocalDateTime createdAt
) {}

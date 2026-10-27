package com.zpero.blog.comment.api;

import java.time.LocalDateTime;

public record AdminCommentResponse(
    long id,
    long articleId,
    String articleTitle,
    String articleSlug,
    long authorId,
    String authorName,
    String authorEmail,
    String content,
    String status,
    boolean deleted,
    Long replyToId,
    LocalDateTime createdAt
) {}

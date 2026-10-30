package com.zpero.blog.comment.api;

import java.time.LocalDateTime;
import java.util.List;

public record CommentResponse(
    long id,
    long articleId,
    long authorId,
    String authorName,
    String content,
    boolean deleted,
    Long replyToId,
    String replyToName,
    LocalDateTime createdAt,
    List<CommentResponse> replies
) {}

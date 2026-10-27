package com.zpero.blog.comment.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentRequest(@NotBlank @Size(max = 2000, message = "评论不能超过 2000 个字符") String content) {}

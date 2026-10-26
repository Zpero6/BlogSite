package com.zpero.blog.article.api;

import java.time.LocalDateTime;
import java.util.List;

public record ArticleResponse(
    Long id, String slug, String title, String summary, String markdown,
    String category, List<String> tags, LocalDateTime publishedAt
) {}

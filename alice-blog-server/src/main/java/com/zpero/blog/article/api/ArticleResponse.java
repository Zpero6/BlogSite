package com.zpero.blog.article.api;

import java.time.LocalDate;
import java.util.List;

public record ArticleResponse(
    Long id, String slug, String title, String summary, String cover, String markdown,
    String category, List<String> tags, LocalDate publishedAt,
    long viewCount, long likeCount, long favoriteCount
) {}

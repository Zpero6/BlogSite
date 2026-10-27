package com.zpero.blog.article.api;

import java.time.LocalDate;
import java.util.List;

public record ArticleSummaryResponse(
    Long id, String slug, String title, String summary, String cover,
    String category, List<String> tags, LocalDate publishedAt
) {}

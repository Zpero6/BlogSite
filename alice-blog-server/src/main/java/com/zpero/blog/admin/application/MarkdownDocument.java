package com.zpero.blog.admin.application;

import java.time.LocalDateTime;
import java.util.List;

record MarkdownDocument(
    String title, String slug, String summary, String category, String cover, List<String> tags,
    LocalDateTime publishedAt, String status, String markdown, String hash
) {}

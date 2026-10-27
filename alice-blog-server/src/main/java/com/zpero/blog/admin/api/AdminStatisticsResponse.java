package com.zpero.blog.admin.api;

import java.time.LocalDateTime;

public record AdminStatisticsResponse(
    long users,
    long articles,
    long publishedArticles,
    long views,
    long likes,
    long favorites,
    long comments,
    long subscriptions,
    long notifications,
    LocalDateTime lastSyncAt
) {}

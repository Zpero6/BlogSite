package com.zpero.blog.admin.application;

import com.zpero.blog.admin.api.AdminStatisticsResponse;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class AdminStatisticsService {
    private final JdbcTemplate jdbc;

    public AdminStatisticsService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public AdminStatisticsResponse statistics() {
        String sql = """
            SELECT
              (SELECT COUNT(*) FROM blog_user) users,
              (SELECT COUNT(*) FROM article) articles,
              (SELECT COUNT(*) FROM article WHERE status='published') published_articles,
              (SELECT COUNT(*) FROM article_view) views,
              (SELECT COUNT(*) FROM article_like) likes,
              (SELECT COUNT(*) FROM article_favorite) favorites,
              (SELECT COUNT(*) FROM comment) comments,
              (SELECT COUNT(*) FROM subscription) subscriptions,
              (SELECT COUNT(*) FROM notification) notifications
            """;
        return jdbc.queryForObject(sql, (rs, index) -> new AdminStatisticsResponse(
            rs.getLong("users"),
            rs.getLong("articles"),
            rs.getLong("published_articles"),
            rs.getLong("views"),
            rs.getLong("likes"),
            rs.getLong("favorites"),
            rs.getLong("comments"),
            rs.getLong("subscriptions"),
            rs.getLong("notifications"),
            lastSyncAt()
        ));
    }

    private LocalDateTime lastSyncAt() {
        Timestamp timestamp = jdbc.queryForObject(
            "SELECT MAX(finished_at) FROM markdown_sync_log",
            Timestamp.class
        );
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }
}

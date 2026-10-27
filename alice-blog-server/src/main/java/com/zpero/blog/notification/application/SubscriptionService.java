package com.zpero.blog.notification.application;

import com.zpero.blog.auth.application.AuthService;
import com.zpero.blog.common.ApiException;
import com.zpero.blog.notification.api.NotificationResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class SubscriptionService {
    private final JdbcTemplate jdbc;
    private final AuthService authService;

    public SubscriptionService(JdbcTemplate jdbc, AuthService authService) {
        this.jdbc = jdbc;
        this.authService = authService;
    }

    public boolean subscribed(String email) {
        long userId = userId(email);
        Long count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM subscription WHERE user_id=?",
            Long.class, userId
        );
        return count != null && count > 0;
    }

    public boolean subscribe(String email) {
        jdbc.update("INSERT IGNORE INTO subscription(user_id) VALUES(?)", userId(email));
        return true;
    }

    public boolean unsubscribe(String email) {
        jdbc.update("DELETE FROM subscription WHERE user_id=?", userId(email));
        return false;
    }

    public List<NotificationResponse> notifications(String email) {
        String sql = """
            SELECT n.id,n.article_id,a.slug article_slug,a.title article_title,n.is_read,n.created_at
            FROM notification n
            JOIN article a ON a.id=n.article_id
            WHERE n.user_id=?
            ORDER BY n.created_at DESC,n.id DESC
            LIMIT 100
            """;
        return jdbc.query(sql, (rs, index) -> new NotificationResponse(
            rs.getLong("id"),
            rs.getLong("article_id"),
            rs.getString("article_slug"),
            rs.getString("article_title"),
            rs.getBoolean("is_read"),
            rs.getTimestamp("created_at").toLocalDateTime()
        ), userId(email));
    }

    public void markRead(String email, long notificationId) {
        int updated = jdbc.update(
            "UPDATE notification SET is_read=TRUE WHERE id=? AND user_id=?",
            notificationId, userId(email)
        );
        if (updated == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "NOTIFICATION_NOT_FOUND", "通知不存在");
        }
    }

    public void markAllRead(String email) {
        jdbc.update("UPDATE notification SET is_read=TRUE WHERE user_id=? AND is_read=FALSE", userId(email));
    }

    private long userId(String email) {
        return authService.findByEmail(email).id();
    }
}

package com.zpero.blog.interaction.application;

import com.zpero.blog.article.api.ArticleSummaryResponse;
import com.zpero.blog.article.application.ArticleQueryService;
import com.zpero.blog.auth.application.AuthService;
import com.zpero.blog.common.ApiException;
import com.zpero.blog.interaction.api.InteractionState;
import com.zpero.blog.interaction.api.ViewResult;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class InteractionService {
    private final JdbcTemplate jdbc;
    private final AuthService authService;
    private final ArticleQueryService articleQueryService;

    public InteractionService(JdbcTemplate jdbc, AuthService authService, ArticleQueryService articleQueryService) {
        this.jdbc = jdbc;
        this.authService = authService;
        this.articleQueryService = articleQueryService;
    }

    public ViewResult recordView(long articleId, String email, String deviceId) {
        ensurePublished(articleId);
        String viewerKey;
        if (email != null) {
            viewerKey = "U:" + userId(email);
        } else {
            if (deviceId == null || deviceId.isBlank()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "DEVICE_ID_REQUIRED", "缺少浏览设备标识");
            }
            viewerKey = "D:" + deviceId;
        }
        int inserted = jdbc.update(
            "INSERT IGNORE INTO article_view(article_id,viewer_key) VALUES(?,?)",
            articleId, viewerKey
        );
        return new ViewResult(inserted == 1, count("article_view", articleId));
    }

    public InteractionState state(long articleId, String email) {
        ensurePublished(articleId);
        long likeCount = count("article_like", articleId);
        long favoriteCount = count("article_favorite", articleId);
        if (email == null) {
            return new InteractionState(false, false, false, likeCount, favoriteCount);
        }
        long userId = userId(email);
        return new InteractionState(
            true,
            exists("article_like", userId, articleId),
            exists("article_favorite", userId, articleId),
            likeCount,
            favoriteCount
        );
    }

    public InteractionState like(long articleId, String email) {
        long userId = userId(email);
        ensurePublished(articleId);
        jdbc.update("INSERT IGNORE INTO article_like(user_id,article_id) VALUES(?,?)", userId, articleId);
        return stateForUser(articleId, userId);
    }

    public InteractionState unlike(long articleId, String email) {
        long userId = userId(email);
        ensurePublished(articleId);
        jdbc.update("DELETE FROM article_like WHERE user_id=? AND article_id=?", userId, articleId);
        return stateForUser(articleId, userId);
    }

    public InteractionState favorite(long articleId, String email) {
        long userId = userId(email);
        ensurePublished(articleId);
        jdbc.update("INSERT IGNORE INTO article_favorite(user_id,article_id) VALUES(?,?)", userId, articleId);
        return stateForUser(articleId, userId);
    }

    public InteractionState unfavorite(long articleId, String email) {
        long userId = userId(email);
        ensurePublished(articleId);
        jdbc.update("DELETE FROM article_favorite WHERE user_id=? AND article_id=?", userId, articleId);
        return stateForUser(articleId, userId);
    }

    public List<ArticleSummaryResponse> favorites(String email) {
        return articleQueryService.findFavorites(userId(email));
    }

    private InteractionState stateForUser(long articleId, long userId) {
        return new InteractionState(
            true,
            exists("article_like", userId, articleId),
            exists("article_favorite", userId, articleId),
            count("article_like", articleId),
            count("article_favorite", articleId)
        );
    }

    private long userId(String email) {
        return authService.findByEmail(email).id();
    }

    private void ensurePublished(long articleId) {
        Long count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM article WHERE id=? AND status='published'",
            Long.class, articleId
        );
        if (count == null || count == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "ARTICLE_NOT_FOUND", "文章不存在");
        }
    }

    private long count(String table, long articleId) {
        if (!"article_view".equals(table) && !"article_like".equals(table) && !"article_favorite".equals(table)) {
            throw new IllegalArgumentException("非法互动表名");
        }
        Long count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM " + table + " WHERE article_id=?",
            Long.class, articleId
        );
        return count == null ? 0 : count;
    }

    private boolean exists(String table, long userId, long articleId) {
        if (!"article_like".equals(table) && !"article_favorite".equals(table)) {
            throw new IllegalArgumentException("非法互动表名");
        }
        Long count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM " + table + " WHERE user_id=? AND article_id=?",
            Long.class, userId, articleId
        );
        return count != null && count > 0;
    }
}

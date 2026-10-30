package com.zpero.blog.article.application;

import com.zpero.blog.article.api.ArticleResponse;
import com.zpero.blog.article.api.ArticleSummaryResponse;
import com.zpero.blog.common.ApiException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class ArticleQueryService {
    private static final String SUMMARY_COLUMNS = """
        a.id,a.slug,a.title,a.summary,a.cover,a.published_at,c.name category,
        COALESCE(GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ','),'') tags
        """;

    private final JdbcTemplate jdbc;

    public ArticleQueryService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public List<ArticleSummaryResponse> findPublished(String category, String tag) {
        String categoryFilter = blankToNull(category);
        String tagFilter = blankToNull(tag);
        String sql = """
            SELECT %s
            FROM article a
            LEFT JOIN category c ON c.id=a.category_id
            LEFT JOIN article_tag atg ON atg.article_id=a.id
            LEFT JOIN tag t ON t.id=atg.tag_id
            WHERE a.status='published'
              AND (? IS NULL OR c.name=?)
              AND (? IS NULL OR EXISTS (
                SELECT 1 FROM article_tag x JOIN tag xt ON xt.id=x.tag_id
                WHERE x.article_id=a.id AND xt.name=?
              ))
            GROUP BY a.id,c.name
            ORDER BY a.published_at DESC,a.id DESC
            """.formatted(SUMMARY_COLUMNS);
        return jdbc.query(sql, this::mapSummary, categoryFilter, categoryFilter, tagFilter, tagFilter);
    }

    public ArticleResponse findBySlug(String slug) {
        String sql = """
            SELECT %s,a.markdown,
              (SELECT COUNT(*) FROM article_view av WHERE av.article_id=a.id) view_count,
              (SELECT COUNT(*) FROM article_like al WHERE al.article_id=a.id) like_count,
              (SELECT COUNT(*) FROM article_favorite af WHERE af.article_id=a.id) favorite_count
            FROM article a
            LEFT JOIN category c ON c.id=a.category_id
            LEFT JOIN article_tag atg ON atg.article_id=a.id
            LEFT JOIN tag t ON t.id=atg.tag_id
            WHERE a.status='published' AND a.slug=?
            GROUP BY a.id,c.name
            """.formatted(SUMMARY_COLUMNS);
        return jdbc.query(sql, this::mapDetail, slug).stream().findFirst()
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ARTICLE_NOT_FOUND", "文章不存在"));
    }

    public List<ArticleSummaryResponse> findFavorites(long userId) {
        String sql = """
            SELECT %s
            FROM article_favorite af
            JOIN article a ON a.id=af.article_id
            LEFT JOIN category c ON c.id=a.category_id
            LEFT JOIN article_tag atg ON atg.article_id=a.id
            LEFT JOIN tag t ON t.id=atg.tag_id
            WHERE af.user_id=? AND a.status='published'
            GROUP BY a.id,c.name
            ORDER BY af.created_at DESC,a.id DESC
            """.formatted(SUMMARY_COLUMNS);
        return jdbc.query(sql, this::mapSummary, userId);
    }

    public List<String> categories() {
        return jdbc.queryForList("""
            SELECT DISTINCT c.name FROM category c JOIN article a ON a.category_id=c.id
            WHERE a.status='published' ORDER BY c.name
            """, String.class);
    }

    public List<String> tags() {
        return jdbc.queryForList("""
            SELECT DISTINCT t.name FROM tag t
            JOIN article_tag atg ON atg.tag_id=t.id
            JOIN article a ON a.id=atg.article_id
            WHERE a.status='published' ORDER BY t.name
            """, String.class);
    }

    private ArticleSummaryResponse mapSummary(ResultSet rs, int row) throws SQLException {
        return new ArticleSummaryResponse(
            rs.getLong("id"), rs.getString("slug"), rs.getString("title"),
            rs.getString("summary"), rs.getString("cover"), rs.getString("category"),
            splitTags(rs.getString("tags")), publishedDate(rs.getTimestamp("published_at"))
        );
    }

    private ArticleResponse mapDetail(ResultSet rs, int row) throws SQLException {
        return new ArticleResponse(
            rs.getLong("id"), rs.getString("slug"), rs.getString("title"),
            rs.getString("summary"), rs.getString("cover"), rs.getString("markdown"), rs.getString("category"),
            splitTags(rs.getString("tags")), publishedDate(rs.getTimestamp("published_at")),
            rs.getLong("view_count"), rs.getLong("like_count"), rs.getLong("favorite_count")
        );
    }

    private List<String> splitTags(String rawTags) {
        return rawTags == null || rawTags.isBlank() ? List.of() : List.of(rawTags.split(","));
    }

    private LocalDate publishedDate(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toLocalDateTime().toLocalDate();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}

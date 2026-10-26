package com.zpero.blog.article.application;

import com.zpero.blog.article.api.ArticleResponse;
import com.zpero.blog.common.ApiException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class ArticleQueryService {
    private final JdbcTemplate jdbc;

    public ArticleQueryService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public List<ArticleResponse> findPublished(String category, String tag) {
        String sql = """
            SELECT a.id,a.slug,a.title,a.summary,a.markdown,a.published_at,c.name category,
              COALESCE(GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ','),'') tags
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
            """;
        return jdbc.query(sql, this::map, category, category, tag, tag);
    }

    public ArticleResponse findBySlug(String slug) {
        String sql = """
            SELECT a.id,a.slug,a.title,a.summary,a.markdown,a.published_at,c.name category,
              COALESCE(GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ','),'') tags
            FROM article a
            LEFT JOIN category c ON c.id=a.category_id
            LEFT JOIN article_tag atg ON atg.article_id=a.id
            LEFT JOIN tag t ON t.id=atg.tag_id
            WHERE a.status='published' AND a.slug=?
            GROUP BY a.id,c.name
            """;
        return jdbc.query(sql, this::map, slug).stream().findFirst()
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ARTICLE_NOT_FOUND", "文章不存在"));
    }

    public List<String> categories() {
        return jdbc.queryForList("SELECT DISTINCT c.name FROM category c JOIN article a ON a.category_id=c.id WHERE a.status='published' ORDER BY c.name", String.class);
    }

    public List<String> tags() {
        return jdbc.queryForList("SELECT DISTINCT t.name FROM tag t JOIN article_tag atg ON atg.tag_id=t.id JOIN article a ON a.id=atg.article_id WHERE a.status='published' ORDER BY t.name", String.class);
    }

    private ArticleResponse map(ResultSet rs, int row) throws SQLException {
        String rawTags = rs.getString("tags");
        return new ArticleResponse(
            rs.getLong("id"), rs.getString("slug"), rs.getString("title"),
            rs.getString("summary"), rs.getString("markdown"), rs.getString("category"),
            rawTags == null || rawTags.isBlank() ? List.of() : List.of(rawTags.split(",")),
            rs.getTimestamp("published_at").toLocalDateTime()
        );
    }
}

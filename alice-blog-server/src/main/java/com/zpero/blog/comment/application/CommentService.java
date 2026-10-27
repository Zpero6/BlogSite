package com.zpero.blog.comment.application;

import com.zpero.blog.auth.application.AuthService;
import com.zpero.blog.comment.api.AdminCommentResponse;
import com.zpero.blog.comment.api.CommentResponse;
import com.zpero.blog.common.ApiException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommentService {
    private static final int MAX_COMMENTS_PER_MINUTE = 5;

    private final JdbcTemplate jdbc;
    private final AuthService authService;

    public CommentService(JdbcTemplate jdbc, AuthService authService) {
        this.jdbc = jdbc;
        this.authService = authService;
    }

    public List<CommentResponse> list(long articleId) {
        ensurePublished(articleId);
        String sql = """
            SELECT c.id,c.article_id,c.user_id,c.root_id,c.reply_to_id,c.reply_to_user_id,
              c.content,c.status,c.deleted_at,c.created_at,
              u.display_name author_name,r.display_name reply_to_name
            FROM comment c
            JOIN blog_user u ON u.id=c.user_id
            LEFT JOIN blog_user r ON r.id=c.reply_to_user_id
            WHERE c.article_id=? AND c.status='VISIBLE'
            ORDER BY c.created_at ASC,c.id ASC
            """;
        List<Row> rows = jdbc.query(sql, (rs, index) -> new Row(
            rs.getLong("id"),
            rs.getLong("article_id"),
            rs.getLong("user_id"),
            (Long) rs.getObject("root_id", Long.class),
            (Long) rs.getObject("reply_to_id", Long.class),
            rs.getString("author_name"),
            rs.getString("reply_to_name"),
            rs.getString("content"),
            rs.getTimestamp("deleted_at"),
            rs.getTimestamp("created_at")
        ), articleId);

        Map<Long, Node> roots = new LinkedHashMap<>();
        for (Row row : rows) {
            if (row.rootId() == null) {
                roots.put(row.id(), new Node(row));
            }
        }
        for (Row row : rows) {
            if (row.rootId() == null) continue;
            Node root = roots.get(row.rootId());
            if (root != null) root.replies.add(new Node(row));
        }
        return roots.values().stream().map(Node::toResponse).toList();
    }

    @Transactional
    public CommentResponse create(long articleId, String email, String rawContent) {
        ensurePublished(articleId);
        long userId = userId(email);
        enforceRateLimit(userId);
        long id = insert(articleId, userId, null, null, null, normalize(rawContent));
        return findOne(id);
    }

    @Transactional
    public CommentResponse reply(long targetId, String email, String rawContent) {
        long userId = userId(email);
        Target target = findTarget(targetId);
        ensurePublished(target.articleId());
        if ("HIDDEN".equals(target.status()) || target.deletedAt() != null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "COMMENT_UNAVAILABLE", "该评论已不可回复");
        }
        enforceRateLimit(userId);
        long rootId = target.rootId() == null ? target.id() : target.rootId();
        long id = insert(target.articleId(), userId, rootId, target.id(), target.userId(), normalize(rawContent));
        return findOne(id);
    }

    @Transactional
    public void deleteOwn(long commentId, String email) {
        long userId = userId(email);
        List<Long> owners = jdbc.queryForList("SELECT user_id FROM comment WHERE id=?", Long.class, commentId);
        if (owners.isEmpty()) throw commentNotFound();
        if (owners.getFirst() != userId) {
            throw new ApiException(HttpStatus.FORBIDDEN, "COMMENT_FORBIDDEN", "只能删除自己的评论");
        }
        jdbc.update("UPDATE comment SET deleted_at=NOW() WHERE id=? AND deleted_at IS NULL", commentId);
    }

    public List<AdminCommentResponse> adminList() {
        String sql = """
            SELECT c.id,c.article_id,a.title article_title,a.slug article_slug,c.user_id,u.display_name author_name,
              u.email author_email,c.content,c.status,c.deleted_at,c.reply_to_id,c.created_at
            FROM comment c
            JOIN article a ON a.id=c.article_id
            JOIN blog_user u ON u.id=c.user_id
            ORDER BY c.created_at DESC,c.id DESC
            LIMIT 200
            """;
        return jdbc.query(sql, (rs, index) -> new AdminCommentResponse(
            rs.getLong("id"),
            rs.getLong("article_id"),
            rs.getString("article_title"),
            rs.getString("article_slug"),
            rs.getLong("user_id"),
            rs.getString("author_name"),
            rs.getString("author_email"),
            rs.getString("content"),
            rs.getString("status"),
            rs.getTimestamp("deleted_at") != null,
            (Long) rs.getObject("reply_to_id", Long.class),
            rs.getTimestamp("created_at").toLocalDateTime()
        ));
    }

    public void hide(long commentId) {
        int updated = jdbc.update("UPDATE comment SET status='HIDDEN' WHERE id=?", commentId);
        if (updated == 0) throw commentNotFound();
    }

    public void adminDelete(long commentId) {
        int updated = jdbc.update("UPDATE comment SET deleted_at=NOW() WHERE id=?", commentId);
        if (updated == 0) throw commentNotFound();
    }

    private long insert(long articleId, long userId, Long rootId, Long replyToId, Long replyToUserId, String content) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            var statement = connection.prepareStatement("""
                INSERT INTO comment(article_id,user_id,root_id,reply_to_id,reply_to_user_id,content)
                VALUES(?,?,?,?,?,?)
                """, new String[]{"id"});
            statement.setLong(1, articleId);
            statement.setLong(2, userId);
            setNullableLong(statement, 3, rootId);
            setNullableLong(statement, 4, replyToId);
            setNullableLong(statement, 5, replyToUserId);
            statement.setString(6, content);
            return statement;
        }, keys);
        Number key = keys.getKey();
        if (key == null) throw new IllegalStateException("无法获取评论 ID");
        return key.longValue();
    }

    private CommentResponse findOne(long commentId) {
        String sql = """
            SELECT c.id,c.article_id,c.user_id,c.reply_to_id,c.content,c.deleted_at,c.created_at,
              u.display_name author_name,r.display_name reply_to_name
            FROM comment c
            JOIN blog_user u ON u.id=c.user_id
            LEFT JOIN blog_user r ON r.id=c.reply_to_user_id
            WHERE c.id=?
            """;
        List<CommentResponse> found = jdbc.query(sql, (rs, index) -> {
            Timestamp deletedAt = rs.getTimestamp("deleted_at");
            boolean deleted = deletedAt != null;
            return new CommentResponse(
                rs.getLong("id"),
                rs.getLong("article_id"),
                rs.getLong("user_id"),
                deleted ? "已删除" : rs.getString("author_name"),
                deleted ? "" : rs.getString("content"),
                deleted,
                (Long) rs.getObject("reply_to_id", Long.class),
                rs.getString("reply_to_name"),
                rs.getTimestamp("created_at").toLocalDateTime(),
                List.of()
            );
        }, commentId);
        if (found.isEmpty()) throw commentNotFound();
        return found.getFirst();
    }

    private Target findTarget(long commentId) {
        String sql = """
            SELECT id,article_id,user_id,root_id,reply_to_id,status,deleted_at
            FROM comment WHERE id=?
            """;
        List<Target> found = jdbc.query(sql, (rs, index) -> new Target(
            rs.getLong("id"),
            rs.getLong("article_id"),
            rs.getLong("user_id"),
            (Long) rs.getObject("root_id", Long.class),
            (Long) rs.getObject("reply_to_id", Long.class),
            rs.getString("status"),
            rs.getTimestamp("deleted_at")
        ), commentId);
        if (found.isEmpty()) throw commentNotFound();
        return found.getFirst();
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

    private void enforceRateLimit(long userId) {
        Long recent = jdbc.queryForObject("""
            SELECT COUNT(*) FROM comment
            WHERE user_id=? AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)
            """, Long.class, userId);
        if (recent != null && recent >= MAX_COMMENTS_PER_MINUTE) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "COMMENT_TOO_FREQUENT", "评论过于频繁，请稍后再试");
        }
    }

    private long userId(String email) {
        return authService.findByEmail(email).id();
    }

    private String normalize(String content) {
        String normalized = content == null ? "" : content.trim();
        if (normalized.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "COMMENT_EMPTY", "评论内容不能为空");
        }
        if (normalized.length() > 2000) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "COMMENT_TOO_LONG", "评论不能超过 2000 个字符");
        }
        return normalized;
    }

    private void setNullableLong(java.sql.PreparedStatement statement, int index, Long value) throws java.sql.SQLException {
        if (value == null) statement.setNull(index, java.sql.Types.BIGINT);
        else statement.setLong(index, value);
    }

    private ApiException commentNotFound() {
        return new ApiException(HttpStatus.NOT_FOUND, "COMMENT_NOT_FOUND", "评论不存在");
    }

    private record Row(
        long id, long articleId, long authorId, Long rootId, Long replyToId,
        String authorName, String replyToName, String content, Timestamp deletedAt, Timestamp createdAt
    ) {}

    private record Target(
        long id, long articleId, long userId, Long rootId, Long replyToId, String status, Timestamp deletedAt
    ) {}

    private static final class Node {
        private final long id;
        private final long articleId;
        private final long authorId;
        private final String authorName;
        private final String content;
        private final boolean deleted;
        private final Long replyToId;
        private final String replyToName;
        private final LocalDateTime createdAt;
        private final List<Node> replies = new ArrayList<>();

        private Node(Row row) {
            this.id = row.id();
            this.articleId = row.articleId();
            this.authorId = row.authorId();
            this.deleted = row.deletedAt() != null;
            this.authorName = deleted ? "已删除" : row.authorName();
            this.content = deleted ? "" : row.content();
            this.replyToId = row.replyToId();
            this.replyToName = row.replyToName();
            this.createdAt = row.createdAt().toLocalDateTime();
        }

        private CommentResponse toResponse() {
            return new CommentResponse(
                id, articleId, authorId, authorName, content, deleted,
                replyToId, replyToName, createdAt,
                replies.stream().map(Node::toResponse).toList()
            );
        }
    }
}

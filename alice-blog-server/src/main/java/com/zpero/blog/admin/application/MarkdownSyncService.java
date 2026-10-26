package com.zpero.blog.admin.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zpero.blog.admin.api.SyncResponse;
import com.zpero.blog.common.ApiException;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class MarkdownSyncService {
    private final Path contentDirectory;
    private final MarkdownParser parser;
    private final JdbcTemplate jdbc;
    private final TransactionTemplate transactions;
    private final ObjectMapper objectMapper;

    public MarkdownSyncService(
        @Value("${blog.content-directory}") String contentDirectory,
        MarkdownParser parser, JdbcTemplate jdbc, TransactionTemplate transactions, ObjectMapper objectMapper
    ) {
        this.contentDirectory = Path.of(contentDirectory).toAbsolutePath().normalize();
        this.parser = parser;
        this.jdbc = jdbc;
        this.transactions = transactions;
        this.objectMapper = objectMapper;
    }

    public SyncResponse synchronize(String operatorEmail) {
        long operatorId = operatorId(operatorEmail);
        long logId = createLog(operatorId);
        List<SyncResponse.Item> items = new ArrayList<>();
        try {
            List<Path> files;
            try (var paths = Files.list(contentDirectory)) {
                files = paths.filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().endsWith(".md"))
                    .sorted().toList();
            }
            for (Path file : files) {
                try {
                    String source = Files.readString(file, StandardCharsets.UTF_8);
                    MarkdownDocument document = parser.parse(source, file.getFileName().toString());
                    SyncResponse.Item item = transactions.execute(status -> upsert(file, document));
                    items.add(item);
                } catch (Exception error) {
                    items.add(new SyncResponse.Item(file.getFileName().toString(), null, "FAILED", rootMessage(error)));
                }
            }
            SyncResponse response = summarize(items);
            finishLog(logId, response);
            return response;
        } catch (IOException error) {
            SyncResponse response = new SyncResponse(0, 0, 0, 0, 1,
                List.of(new SyncResponse.Item(contentDirectory.toString(), null, "FAILED", rootMessage(error))));
            finishLog(logId, response);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "CONTENT_DIRECTORY_UNAVAILABLE", "无法读取内容目录");
        }
    }

    private SyncResponse.Item upsert(Path file, MarkdownDocument doc) {
        List<ArticleState> existing = jdbc.query(
            "SELECT id,status,content_hash,first_published_at FROM article WHERE slug=? FOR UPDATE",
            (rs, row) -> new ArticleState(rs.getLong("id"), rs.getString("status"), rs.getString("content_hash"), rs.getTimestamp("first_published_at")),
            doc.slug()
        );
        if (!existing.isEmpty() && existing.getFirst().hash().equals(doc.hash()))
            return new SyncResponse.Item(file.getFileName().toString(), doc.slug(), "UNCHANGED", "内容无变化");

        long categoryId = findOrCreate("category", doc.category());
        boolean firstPublish = "published".equals(doc.status())
            && (existing.isEmpty() || existing.getFirst().firstPublishedAt() == null);
        if (existing.isEmpty()) {
            jdbc.update("""
                INSERT INTO article(slug,title,summary,markdown,category_id,status,content_hash,published_at,first_published_at)
                VALUES(?,?,?,?,?,?,?,?,?)
                """, doc.slug(), doc.title(), doc.summary(), doc.markdown(), categoryId, doc.status(), doc.hash(),
                doc.publishedAt(), firstPublish ? doc.publishedAt() : null);
        } else {
            jdbc.update("""
                UPDATE article SET title=?,summary=?,markdown=?,category_id=?,status=?,content_hash=?,published_at=?,
                  first_published_at=CASE WHEN first_published_at IS NULL AND ? THEN ? ELSE first_published_at END
                WHERE id=?
                """, doc.title(), doc.summary(), doc.markdown(), categoryId, doc.status(), doc.hash(), doc.publishedAt(),
                firstPublish, doc.publishedAt(), existing.getFirst().id());
        }
        long articleId = existing.isEmpty()
            ? jdbc.queryForObject("SELECT id FROM article WHERE slug=?", Long.class, doc.slug())
            : existing.getFirst().id();
        jdbc.update("DELETE FROM article_tag WHERE article_id=?", articleId);
        for (String tag : doc.tags()) {
            long tagId = findOrCreate("tag", tag);
            jdbc.update("INSERT INTO article_tag(article_id,tag_id) VALUES(?,?)", articleId, tagId);
        }
        if (firstPublish) {
            jdbc.update("""
                INSERT IGNORE INTO notification(user_id,article_id)
                SELECT user_id,? FROM subscription
                """, articleId);
        }
        return new SyncResponse.Item(file.getFileName().toString(), doc.slug(), existing.isEmpty() ? "CREATED" : "UPDATED",
            firstPublish ? "已同步并生成发布通知" : "已同步");
    }

    private long findOrCreate(String table, String name) {
        if (!table.equals("category") && !table.equals("tag")) throw new IllegalArgumentException("非法表名");
        jdbc.update("INSERT IGNORE INTO " + table + "(name) VALUES(?)", name);
        return jdbc.queryForObject("SELECT id FROM " + table + " WHERE name=?", Long.class, name);
    }

    private long operatorId(String email) {
        List<Long> ids = jdbc.queryForList("SELECT id FROM blog_user WHERE email=? AND role='ADMIN' AND status='ACTIVE'", Long.class, email);
        if (ids.isEmpty()) throw new ApiException(HttpStatus.FORBIDDEN, "ADMIN_REQUIRED", "当前管理员账号无效");
        return ids.getFirst();
    }

    private long createLog(long operatorId) {
        jdbc.update("INSERT INTO markdown_sync_log(operator_id) VALUES(?)", operatorId);
        return jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
    }

    private void finishLog(long logId, SyncResponse response) {
        try {
            jdbc.update("UPDATE markdown_sync_log SET finished_at=NOW(),result_json=? WHERE id=?",
                objectMapper.writeValueAsString(response), logId);
        } catch (JsonProcessingException error) {
            throw new IllegalStateException("同步日志序列化失败", error);
        }
    }

    private SyncResponse summarize(List<SyncResponse.Item> items) {
        return new SyncResponse(items.size(), count(items, "CREATED"), count(items, "UPDATED"),
            count(items, "UNCHANGED"), count(items, "FAILED"), List.copyOf(items));
    }

    private int count(List<SyncResponse.Item> items, String result) {
        return (int) items.stream().filter(item -> result.equals(item.result())).count();
    }

    private String rootMessage(Throwable error) {
        Throwable current = error;
        while (current.getCause() != null) current = current.getCause();
        return current.getMessage() == null ? current.getClass().getSimpleName() : current.getMessage();
    }

    private record ArticleState(long id, String status, String hash, java.sql.Timestamp firstPublishedAt) {}
}

package com.zpero.blog.admin.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;

class MarkdownParserTest {
    private final MarkdownParser parser = new MarkdownParser();

    @Test
    void parsesValidDocument() {
        MarkdownDocument document = parser.parse("""
            ---
            title: Redis 热点 Key
            slug: redis-hot-key
            summary: 定位并处理热点
            category: Redis
            tags: [Redis, 性能优化]
            publishedAt: 2026-10-26
            status: published
            ---

            ## 正文
            """, "redis.md");
        assertThat(document.slug()).isEqualTo("redis-hot-key");
        assertThat(document.tags()).containsExactly("Redis", "性能优化");
        assertThat(document.publishedAt()).isEqualTo(LocalDateTime.of(2026, 10, 26, 0, 0));
    }

    @Test
    void rejectsUnsafeSlug() {
        assertThatThrownBy(() -> parser.parse("""
            ---
            title: T
            slug: ../outside
            summary: S
            category: Java
            publishedAt: 2026-10-26
            status: published
            ---
            body
            """, "bad.md")).hasMessageContaining("slug");
    }
}

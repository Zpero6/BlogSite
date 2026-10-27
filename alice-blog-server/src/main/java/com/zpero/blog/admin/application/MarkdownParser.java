package com.zpero.blog.admin.application;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;
import org.yaml.snakeyaml.Yaml;

@Component
class MarkdownParser {
    private static final Pattern SLUG = Pattern.compile("[a-z0-9]+(?:-[a-z0-9]+)*");
    private static final Set<String> STATUSES = Set.of("draft", "published");
    private final Yaml yaml = new Yaml();

    MarkdownDocument parse(String source, String filename) {
        String normalized = source.replace("\r\n", "\n");
        if (!normalized.startsWith("---\n")) throw invalid(filename, "缺少 Front Matter");
        int end = normalized.indexOf("\n---\n", 4);
        if (end < 0) throw invalid(filename, "Front Matter 未闭合");
        Map<String, Object> data = yaml.load(normalized.substring(4, end));
        if (data == null) throw invalid(filename, "Front Matter 为空");

        String title = required(data, "title", filename);
        String slug = required(data, "slug", filename);
        String summary = required(data, "summary", filename);
        String category = required(data, "category", filename);
        String status = required(data, "status", filename).toLowerCase();
        String cover = optional(data, "cover");
        if (!SLUG.matcher(slug).matches()) throw invalid(filename, "slug 只能包含小写字母、数字和连字符");
        if (!STATUSES.contains(status)) throw invalid(filename, "status 只能是 draft 或 published");
        if (title.length() > 200 || summary.length() > 600 || category.length() > 100)
            throw invalid(filename, "title、summary 或 category 超出长度限制");
        if (cover != null && cover.length() > 500) throw invalid(filename, "cover 不能超过 500 个字符");

        Object tagValue = data.get("tags");
        List<String> tags = tagValue instanceof List<?> list
            ? list.stream().map(String::valueOf).map(String::trim).filter(value -> !value.isBlank()).distinct().toList()
            : List.of();
        if (tags.stream().anyMatch(tag -> tag.length() > 80)) throw invalid(filename, "标签长度不能超过 80");

        LocalDateTime publishedAt = parseDate(data.get("publishedAt"), filename, status);
        String markdown = normalized.substring(end + 5).strip();
        if (markdown.isBlank()) throw invalid(filename, "正文为空");
        return new MarkdownDocument(title, slug, summary, category, cover, tags, publishedAt, status, markdown, sha256(normalized));
    }

    private LocalDateTime parseDate(Object value, String filename, String status) {
        if (value == null) {
            if ("published".equals(status)) throw invalid(filename, "published 文章必须提供 publishedAt");
            return null;
        }
        if (value instanceof java.util.Date date) {
            return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate().atStartOfDay();
        }
        if (value instanceof LocalDate date) return date.atStartOfDay();
        try {
            return LocalDate.parse(String.valueOf(value)).atStartOfDay();
        } catch (DateTimeParseException error) {
            throw invalid(filename, "publishedAt 必须是 yyyy-MM-dd");
        }
    }

    private String required(Map<String, Object> data, String key, String filename) {
        Object value = data.get(key);
        if (value == null || String.valueOf(value).isBlank()) throw invalid(filename, "缺少 " + key);
        return String.valueOf(value).trim();
    }

    private String optional(Map<String, Object> data, String key) {
        Object value = data.get(key);
        if (value == null) return null;
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? null : text;
    }

    private String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception impossible) {
            throw new IllegalStateException(impossible);
        }
    }

    private IllegalArgumentException invalid(String filename, String message) {
        return new IllegalArgumentException(filename + ": " + message);
    }
}

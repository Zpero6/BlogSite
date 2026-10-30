package com.zpero.blog;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

/**
 * Integration coverage for views, likes, favorites, comments, subscriptions and notifications.
 * Requires RUN_MYSQL_IT=true and a disposable database (Flyway clean runs before each test).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("integration")
@EnabledIfEnvironmentVariable(named = "RUN_MYSQL_IT", matches = "true")
class InteractionFlowIntegrationTest {
    private static final Path CONTENT_DIRECTORY = Path.of("target/integration-content");
    private static final String PASSWORD = "Password123!";

    @Autowired TestRestTemplate rest;
    @Autowired JdbcTemplate jdbc;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired Flyway flyway;

    private String adminEmail;
    private String userEmail;
    private Client admin;
    private Client user;

    @BeforeEach
    void setUp() throws IOException {
        flyway.clean();
        flyway.migrate();
        recreateContentDirectory();

        adminEmail = uniqueEmail("admin");
        userEmail = uniqueEmail("user");
        jdbc.update("""
            INSERT INTO blog_user(email,password_hash,display_name,role,status)
            VALUES(?,?,?,'ADMIN','ACTIVE')
            """, adminEmail, passwordEncoder.encode(PASSWORD), "Integration Admin");
        jdbc.update("""
            INSERT INTO blog_user(email,password_hash,display_name,role,status)
            VALUES(?,?,?,'USER','ACTIVE')
            """, userEmail, passwordEncoder.encode(PASSWORD), "Integration User");

        admin = new Client();
        admin.login(adminEmail, PASSWORD);
        user = new Client();
        user.login(userEmail, PASSWORD);
    }

    @Test
    void interactionsCommentsSubscriptionsAndNotificationsWork() {
        String firstSlug = "it-first-" + UUID.randomUUID();
        writeArticle(firstSlug, "Integration First Article");
        assertThat(admin.post("/api/v1/admin/markdown/sync", null).getStatusCode()).isEqualTo(HttpStatus.OK);

        long articleId = jdbc.queryForObject("SELECT id FROM article WHERE slug=?", Long.class, firstSlug);

        assertThat(user.put("/api/v1/subscriptions/blog", null).getBody()).containsEntry("subscribed", true);

        ResponseEntity<Map> firstView = user.post("/api/v1/articles/" + articleId + "/view", null);
        ResponseEntity<Map> secondView = user.post("/api/v1/articles/" + articleId + "/view", null);
        assertThat(firstView.getBody()).containsEntry("counted", true);
        assertThat(secondView.getBody()).containsEntry("counted", false);
        assertThat(number(secondView, "viewCount")).isEqualTo(1);

        ResponseEntity<Map> firstLike = user.put("/api/v1/articles/" + articleId + "/like", null);
        ResponseEntity<Map> secondLike = user.put("/api/v1/articles/" + articleId + "/like", null);
        assertThat(firstLike.getBody()).containsEntry("liked", true);
        assertThat(number(secondLike, "likeCount")).isEqualTo(1);

        ResponseEntity<Map> favorite = user.put("/api/v1/articles/" + articleId + "/favorite", null);
        assertThat(favorite.getBody()).containsEntry("favorited", true);
        assertThat(user.getList("/api/v1/favorites").getBody())
            .extracting(item -> ((Map<?, ?>) item).get("slug"))
            .containsExactly(firstSlug);

        long topId = id(user.post("/api/v1/articles/" + articleId + "/comments", Map.of("content", "Top comment")));
        long replyId = id(user.post("/api/v1/comments/" + topId + "/replies", Map.of("content", "First reply")));
        long nestedId = id(user.post("/api/v1/comments/" + replyId + "/replies", Map.of("content", "Nested reply")));

        List<Map<String, Object>> tree = commentTree(articleId);
        assertThat(tree).hasSize(1);
        List<Map<String, Object>> replies = replies(tree.getFirst());
        assertThat(replies).hasSize(2);
        assertThat(((Number) replies.get(1).get("replyToId")).longValue()).isEqualTo(replyId);
        assertThat(((Number) replies.get(1).get("id")).longValue()).isEqualTo(nestedId);

        assertThat(user.delete("/api/v1/comments/" + replyId).getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> deletedReply = replies(commentTree(articleId).getFirst()).stream()
            .filter(reply -> ((Number) reply.get("id")).longValue() == replyId)
            .findFirst().orElseThrow();
        assertThat(deletedReply).containsEntry("deleted", true);
        assertThat(deletedReply).containsEntry("content", "");

        String secondSlug = "it-second-" + UUID.randomUUID();
        writeArticle(secondSlug, "Integration Second Article");
        assertThat(admin.post("/api/v1/admin/markdown/sync", null).getStatusCode()).isEqualTo(HttpStatus.OK);

        List<Map<String, Object>> notifications = notifications();
        Map<String, Object> unpublishedNotification = notifications.stream()
            .filter(item -> secondSlug.equals(item.get("articleSlug")))
            .findFirst().orElseThrow();
        assertThat(unpublishedNotification).containsEntry("read", false);
        long notificationId = ((Number) unpublishedNotification.get("id")).longValue();
        assertThat(user.patch("/api/v1/notifications/" + notificationId + "/read", null).getStatusCode())
            .isEqualTo(HttpStatus.OK);
        assertThat(notifications().stream()
            .filter(item -> ((Number) item.get("id")).longValue() == notificationId)
            .findFirst().orElseThrow()).containsEntry("read", true);

        assertThat(admin.patch("/api/v1/admin/comments/" + topId + "/hide", null).getStatusCode())
            .isEqualTo(HttpStatus.OK);
        assertThat(commentTree(articleId)).isEmpty();

        ResponseEntity<Map> statistics = admin.get("/api/v1/admin/statistics");
        assertThat(statistics.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(number(statistics, "users")).isEqualTo(2);
        assertThat(number(statistics, "publishedArticles")).isEqualTo(2);
        assertThat(number(statistics, "views")).isEqualTo(1);
        assertThat(number(statistics, "likes")).isEqualTo(1);
        assertThat(number(statistics, "favorites")).isEqualTo(1);
        assertThat(number(statistics, "comments")).isEqualTo(3);
        assertThat(number(statistics, "subscriptions")).isEqualTo(1);
        assertThat(number(statistics, "notifications")).isEqualTo(1);
    }

    private List<Map<String, Object>> commentTree(long articleId) {
        ResponseEntity<List> response = user.getList("/api/v1/articles/" + articleId + "/comments");
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return castList(response.getBody());
    }

    private List<Map<String, Object>> notifications() {
        ResponseEntity<List> response = user.getList("/api/v1/notifications");
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return castList(response.getBody());
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> replies(Map<String, Object> comment) {
        return (List<Map<String, Object>>) comment.get("replies");
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> castList(List<?> list) {
        return (List<Map<String, Object>>) list;
    }

    private long id(ResponseEntity<Map> response) {
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return number(response, "id");
    }

    private long number(ResponseEntity<Map> response, String key) {
        return ((Number) response.getBody().get(key)).longValue();
    }

    private String uniqueEmail(String prefix) {
        return prefix + "-" + UUID.randomUUID() + "@example.com";
    }

    private void recreateContentDirectory() throws IOException {
        if (Files.exists(CONTENT_DIRECTORY)) {
            try (Stream<Path> paths = Files.walk(CONTENT_DIRECTORY)) {
                paths.sorted(Comparator.reverseOrder()).forEach(path -> {
                    try {
                        Files.delete(path);
                    } catch (IOException error) {
                        throw new IllegalStateException(error);
                    }
                });
            }
        }
        Files.createDirectories(CONTENT_DIRECTORY);
    }

    private void writeArticle(String slug, String title) {
        String source = """
            ---
            title: %s
            slug: %s
            summary: Integration summary
            category: Integration
            tags: [Integration, Test]
            publishedAt: 2026-10-26
            status: published
            ---

            # Integration body

            This file is generated by an integration test.
            """.formatted(title, slug);
        try {
            Files.writeString(CONTENT_DIRECTORY.resolve(slug + ".md"), source);
        } catch (IOException error) {
            throw new IllegalStateException(error);
        }
    }

    private final class Client {
        private final Map<String, String> cookies = new LinkedHashMap<>();
        private String csrfToken;
        private String csrfHeader = "X-XSRF-TOKEN";

        private void login(String email, String password) {
            csrf();
            ResponseEntity<Map> response = post("/api/v1/auth/login", Map.of("email", email, "password", password));
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        private void csrf() {
            ResponseEntity<Map> response = exchange(HttpMethod.GET, "/api/v1/auth/csrf", null, false, false);
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            csrfToken = (String) response.getBody().get("token");
            csrfHeader = (String) response.getBody().get("headerName");
        }

        private ResponseEntity<Map> get(String path) {
            return exchange(HttpMethod.GET, path, null, true, false);
        }

        private ResponseEntity<List> getList(String path) {
            HttpHeaders headers = new HttpHeaders();
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            if (!cookies.isEmpty()) headers.set(HttpHeaders.COOKIE, cookieHeader());
            ResponseEntity<List> response = rest.exchange(path, HttpMethod.GET, new HttpEntity<>(headers), List.class);
            storeCookies(response.getHeaders());
            return response;
        }

        private ResponseEntity<Map> post(String path, Object body) {
            return exchange(HttpMethod.POST, path, body, true, true);
        }

        private ResponseEntity<Map> put(String path, Object body) {
            return exchange(HttpMethod.PUT, path, body, true, true);
        }

        private ResponseEntity<Map> patch(String path, Object body) {
            return exchange(HttpMethod.PATCH, path, body, true, true);
        }

        private ResponseEntity<Map> delete(String path) {
            return exchange(HttpMethod.DELETE, path, null, true, true);
        }

        private ResponseEntity<Map> exchange(
            HttpMethod method, String path, Object body, boolean sendCookies, boolean sendCsrf
        ) {
            HttpHeaders headers = new HttpHeaders();
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            if (sendCookies && !cookies.isEmpty()) headers.set(HttpHeaders.COOKIE, cookieHeader());
            if (sendCsrf && csrfToken != null) headers.set(csrfHeader, csrfToken);
            if (body != null) headers.setContentType(MediaType.APPLICATION_JSON);
            ResponseEntity<Map> response = rest.exchange(path, method, new HttpEntity<>(body, headers), Map.class);
            storeCookies(response.getHeaders());
            return response;
        }

        private void storeCookies(HttpHeaders headers) {
            for (String setCookie : headers.getOrEmpty(HttpHeaders.SET_COOKIE)) {
                String pair = setCookie.split(";", 2)[0];
                int separator = pair.indexOf('=');
                if (separator <= 0) continue;
                cookies.put(pair.substring(0, separator), pair.substring(separator + 1));
            }
        }

        private String cookieHeader() {
            return cookies.entrySet().stream()
                .map(entry -> entry.getKey() + "=" + entry.getValue())
                .reduce((left, right) -> left + "; " + right)
                .orElse("");
        }
    }
}

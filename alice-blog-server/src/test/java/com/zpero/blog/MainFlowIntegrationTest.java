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
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
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
 * End-to-end checks against a real MySQL database. Run with:
 *
 * <pre>
 * RUN_MYSQL_IT=true DB_USER=... DB_PASSWORD=... mvn test -Dtest=MainFlowIntegrationTest
 * </pre>
 *
 * The test database is wiped by Flyway clean, so never point it at zpero_blog.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("integration")
@ExtendWith(OutputCaptureExtension.class)
@EnabledIfEnvironmentVariable(named = "RUN_MYSQL_IT", matches = "true")
class MainFlowIntegrationTest {
    private static final Path CONTENT_DIRECTORY = Path.of("target/integration-content");
    private static final String PASSWORD = "Password123!";

    @Autowired TestRestTemplate rest;
    @Autowired JdbcTemplate jdbc;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired Flyway flyway;

    private final Map<String, String> cookies = new LinkedHashMap<>();
    private String csrfToken;
    private String csrfHeader = "X-XSRF-TOKEN";

    @BeforeEach
    void reset() throws IOException {
        flyway.clean();
        flyway.migrate();
        cookies.clear();
        csrfToken = null;
        recreateContentDirectory();
    }

    @Test
    void registrationCreatesSessionAndLogoutInvalidatesIt(CapturedOutput output) {
        csrf();
        String email = uniqueEmail("register");
        assertThat(post("/api/v1/auth/email-code", Map.of("email", email), true).getStatusCode())
            .isEqualTo(HttpStatus.OK);

        String code = codeFromLog(output, email);
        ResponseEntity<Map> registered = post("/api/v1/auth/register", Map.of(
            "email", email,
            "code", code,
            "password", PASSWORD,
            "displayName", "Integration User"
        ), true);
        assertThat(registered.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(registered.getBody()).containsEntry("email", email);
        assertThat(cookies).containsKey("SESSION");

        ResponseEntity<Map> me = get("/api/v1/auth/me", true);
        assertThat(me.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(me.getBody()).containsEntry("email", email);
        assertThat(me.getBody()).containsEntry("role", "USER");

        assertThat(post("/api/v1/auth/logout", null, true).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(get("/api/v1/auth/me", true).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void stateChangingRequestWithoutCsrfTokenIsRejected() {
        csrf();
        ResponseEntity<Map> response = post("/api/v1/auth/login", Map.of(
            "email", uniqueEmail("csrf"),
            "password", PASSWORD
        ), false);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).containsEntry("code", "CSRF_TOKEN_INVALID");
    }

    @Test
    void adminSyncIsIdempotentAndDraftsStayPrivate(CapturedOutput output) {
        String adminEmail = uniqueEmail("admin");
        jdbc.update("""
            INSERT INTO blog_user(email,password_hash,display_name,role,status)
            VALUES(?,?,?,'ADMIN','ACTIVE')
            """, adminEmail, passwordEncoder.encode(PASSWORD), "Integration Admin");

        String slug = "it-published-" + UUID.randomUUID();
        String draftSlug = "it-draft-" + UUID.randomUUID();
        writeArticle(slug, "published", "Integration Published", "2026-10-26");
        writeArticle(draftSlug, "draft", "Integration Draft", null);

        csrf();
        ResponseEntity<Map> login = post("/api/v1/auth/login", Map.of(
            "email", adminEmail,
            "password", PASSWORD
        ), true);
        assertThat(login.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(login.getBody()).containsEntry("role", "ADMIN");

        ResponseEntity<Map> firstSync = post("/api/v1/admin/markdown/sync", null, true);
        assertThat(firstSync.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(firstSync.getBody()).containsEntry("created", 2);
        assertThat(firstSync.getBody()).containsEntry("failed", 0);

        ResponseEntity<List> articles = getList("/api/v1/articles");
        assertThat(articles.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(articles.getBody()).extracting(item -> ((Map<?, ?>) item).get("slug"))
            .containsExactly(slug);

        ResponseEntity<Map> detail = get("/api/v1/articles/" + slug, true);
        assertThat(detail.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(detail.getBody()).containsEntry("title", "Integration Published");
        assertThat((String) detail.getBody().get("markdown")).contains("Integration body");
        assertThat(get("/api/v1/articles/" + draftSlug, true).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        ResponseEntity<Map> secondSync = post("/api/v1/admin/markdown/sync", null, true);
        assertThat(secondSync.getBody()).containsEntry("unchanged", 2);
        assertThat(secondSync.getBody()).containsEntry("created", 0);

        appendToArticle(slug);
        ResponseEntity<Map> thirdSync = post("/api/v1/admin/markdown/sync", null, true);
        assertThat(thirdSync.getBody()).containsEntry("updated", 1);
        assertThat(thirdSync.getBody()).containsEntry("created", 0);

        long notifications = jdbc.queryForObject("SELECT COUNT(*) FROM notification", Long.class);
        assertThat(notifications).isZero();
    }

    @Test
    void normalUserCannotCallAdminSync(CapturedOutput output) {
        String email = uniqueEmail("user");
        csrf();
        post("/api/v1/auth/email-code", Map.of("email", email), true);
        String code = codeFromLog(output, email);
        assertThat(post("/api/v1/auth/register", Map.of(
            "email", email,
            "code", code,
            "password", PASSWORD,
            "displayName", "Normal User"
        ), true).getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<Map> response = post("/api/v1/admin/markdown/sync", null, true);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).containsEntry("code", "FORBIDDEN");
    }

    private void csrf() {
        ResponseEntity<Map> response = get("/api/v1/auth/csrf", false);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        csrfToken = (String) response.getBody().get("token");
        csrfHeader = (String) response.getBody().get("headerName");
    }

    private ResponseEntity<Map> get(String path, boolean sendCookies) {
        return exchange(HttpMethod.GET, path, null, sendCookies, false);
    }

    private ResponseEntity<List> getList(String path) {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        ResponseEntity<List> response = rest.exchange(path, HttpMethod.GET, new HttpEntity<>(headers), List.class);
        storeCookies(response.getHeaders());
        return response;
    }

    private ResponseEntity<Map> post(String path, Object body, boolean sendCsrf) {
        return exchange(HttpMethod.POST, path, body, true, sendCsrf);
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

    private String codeFromLog(CapturedOutput output, String email) {
        Matcher matcher = Pattern.compile(
            "DEV EMAIL CODE email=" + Pattern.quote(email) + " code=(\\d{6})"
        ).matcher(output.getOut());
        assertThat(matcher.find()).as("verification code log for %s", email).isTrue();
        return matcher.group(1);
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

    private void writeArticle(String slug, String status, String title, String publishedAt) {
        String dateLine = publishedAt == null ? "" : "publishedAt: " + publishedAt + "\n";
        String source = """
            ---
            title: %s
            slug: %s
            summary: Integration summary
            category: Integration
            tags: [Integration, Test]
            %sstatus: %s
            ---

            # Integration body

            This file is generated by an integration test.
            """.formatted(title, slug, dateLine, status);
        try {
            Files.writeString(CONTENT_DIRECTORY.resolve(slug + ".md"), source);
        } catch (IOException error) {
            throw new IllegalStateException(error);
        }
    }

    private void appendToArticle(String slug) {
        try {
            Path file = CONTENT_DIRECTORY.resolve(slug + ".md");
            Files.writeString(file, Files.readString(file) + "\nUpdated by integration test.\n");
        } catch (IOException error) {
            throw new IllegalStateException(error);
        }
    }
}

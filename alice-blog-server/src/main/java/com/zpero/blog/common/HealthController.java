package com.zpero.blog.common;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class HealthController {
    private static final Logger log = LoggerFactory.getLogger(HealthController.class);

    private final JdbcTemplate jdbc;

    public HealthController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("service", "zpero-blog");
        try {
            jdbc.queryForObject("SELECT 1", Integer.class);
            body.put("database", "UP");
            body.put("flyway", latestMigration());
            body.put("status", "UP");
            return ResponseEntity.ok(body);
        } catch (DataAccessException error) {
            log.warn("健康检查无法访问数据库：{}", error.getMostSpecificCause().getMessage());
            body.put("database", "DOWN");
            body.put("status", "DOWN");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(body);
        }
    }

    @GetMapping("/auth/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken(), "headerName", token.getHeaderName());
    }

    private String latestMigration() {
        try {
            List<String> versions = jdbc.queryForList("""
                SELECT version FROM flyway_schema_history
                WHERE success=1 ORDER BY installed_rank DESC LIMIT 1
                """, String.class);
            return versions.isEmpty() ? "none" : versions.getFirst();
        } catch (DataAccessException error) {
            return "unknown";
        }
    }
}

package com.zpero.blog.article.api;

import com.zpero.blog.article.application.ArticleQueryService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class ArticleController {
    private final ArticleQueryService service;
    public ArticleController(ArticleQueryService service) { this.service = service; }

    @GetMapping("/articles")
    List<ArticleSummaryResponse> articles(
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String tag
    ) {
        return service.findPublished(category, tag);
    }

    @GetMapping("/articles/{slug}")
    ArticleResponse article(@PathVariable String slug) {
        return service.findBySlug(slug);
    }

    @GetMapping("/categories")
    List<String> categories() { return service.categories(); }

    @GetMapping("/tags")
    List<String> tags() { return service.tags(); }
}

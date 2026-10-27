package com.zpero.blog.comment.api;

import com.zpero.blog.comment.application.CommentService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class CommentController {
    private final CommentService service;

    public CommentController(CommentService service) {
        this.service = service;
    }

    @GetMapping("/articles/{articleId}/comments")
    List<CommentResponse> list(@PathVariable long articleId) {
        return service.list(articleId);
    }

    @PostMapping("/articles/{articleId}/comments")
    CommentResponse create(
        @PathVariable long articleId,
        @Valid @RequestBody CommentRequest request,
        Principal principal
    ) {
        return service.create(articleId, principal.getName(), request.content());
    }

    @PostMapping("/comments/{commentId}/replies")
    CommentResponse reply(
        @PathVariable long commentId,
        @Valid @RequestBody CommentRequest request,
        Principal principal
    ) {
        return service.reply(commentId, principal.getName(), request.content());
    }

    @DeleteMapping("/comments/{commentId}")
    Map<String, String> delete(@PathVariable long commentId, Principal principal) {
        service.deleteOwn(commentId, principal.getName());
        return Map.of("message", "评论已删除");
    }
}

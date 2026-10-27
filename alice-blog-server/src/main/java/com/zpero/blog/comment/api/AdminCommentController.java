package com.zpero.blog.comment.api;

import com.zpero.blog.comment.application.CommentService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/comments")
public class AdminCommentController {
    private final CommentService service;

    public AdminCommentController(CommentService service) {
        this.service = service;
    }

    @GetMapping
    List<AdminCommentResponse> list() {
        return service.adminList();
    }

    @PatchMapping("/{commentId}/hide")
    Map<String, String> hide(@PathVariable long commentId) {
        service.hide(commentId);
        return Map.of("message", "评论已隐藏");
    }

    @DeleteMapping("/{commentId}")
    Map<String, String> delete(@PathVariable long commentId) {
        service.adminDelete(commentId);
        return Map.of("message", "评论已删除");
    }
}

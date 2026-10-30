package com.zpero.blog.notification.api;

import com.zpero.blog.notification.application.SubscriptionService;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class SubscriptionController {
    private final SubscriptionService service;

    public SubscriptionController(SubscriptionService service) {
        this.service = service;
    }

    @GetMapping("/subscriptions/blog")
    Map<String, Boolean> state(Principal principal) {
        return Map.of("subscribed", service.subscribed(principal.getName()));
    }

    @PutMapping("/subscriptions/blog")
    Map<String, Boolean> subscribe(Principal principal) {
        return Map.of("subscribed", service.subscribe(principal.getName()));
    }

    @DeleteMapping("/subscriptions/blog")
    Map<String, Boolean> unsubscribe(Principal principal) {
        return Map.of("subscribed", service.unsubscribe(principal.getName()));
    }

    @GetMapping("/notifications")
    List<NotificationResponse> notifications(Principal principal) {
        return service.notifications(principal.getName());
    }

    @PatchMapping("/notifications/{notificationId}/read")
    Map<String, String> read(@PathVariable long notificationId, Principal principal) {
        service.markRead(principal.getName(), notificationId);
        return Map.of("message", "已标记为已读");
    }

    @PatchMapping("/notifications/read-all")
    Map<String, String> readAll(Principal principal) {
        service.markAllRead(principal.getName());
        return Map.of("message", "全部标记为已读");
    }
}

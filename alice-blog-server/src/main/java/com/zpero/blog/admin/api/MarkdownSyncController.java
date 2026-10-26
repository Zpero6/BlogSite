package com.zpero.blog.admin.api;

import com.zpero.blog.admin.application.MarkdownSyncService;
import java.security.Principal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/markdown")
public class MarkdownSyncController {
    private final MarkdownSyncService service;
    public MarkdownSyncController(MarkdownSyncService service) { this.service = service; }

    @PostMapping("/sync")
    SyncResponse synchronize(Principal principal) {
        return service.synchronize(principal.getName());
    }
}

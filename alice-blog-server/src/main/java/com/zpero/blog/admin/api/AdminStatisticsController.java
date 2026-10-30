package com.zpero.blog.admin.api;

import com.zpero.blog.admin.application.AdminStatisticsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminStatisticsController {
    private final AdminStatisticsService service;

    public AdminStatisticsController(AdminStatisticsService service) {
        this.service = service;
    }

    @GetMapping("/statistics")
    AdminStatisticsResponse statistics() {
        return service.statistics();
    }
}

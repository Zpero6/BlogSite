package com.zpero.blog.admin.api;

import java.util.List;

public record SyncResponse(int total, int created, int updated, int unchanged, int failed, List<Item> items) {
    public record Item(String file, String slug, String result, String message) {}
}

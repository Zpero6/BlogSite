package com.zpero.blog.interaction.api;

public record InteractionState(
    boolean authenticated,
    boolean liked,
    boolean favorited,
    long likeCount,
    long favoriteCount
) {}

# Zpero adaptation

This frontend is based directly on XinghuisamaBlogs:

- https://github.com/heiehiehi/XinghuisamaBlogs
- Upstream commit: 8633e983371acc3b627b88b911143ff0fd31ea23
- License: CC BY-NC 4.0 (see LICENSE)

Changes include Zpero branding, optimized local wallpaper assets, local avatar
placeholder, Java-oriented sample posts, reduced navigation, removal of upstream
personal content, a rewrite for the Spring Boot /api/v1 backend, a new
acrylic menu dashboard homepage, removal of upstream global background effects
and the scroll-driven navbar, and a GitHub contribution heatmap sourced from the
public contribution calendar.

Second visual pass: the single enclosing homepage panel was split into separated
acrylic islands, a shared pre-blurred wallpaper backdrop now lives in the root
layout, all public inner pages use `InnerPageShell`, and the site cards use
locally generated cat-sticker artwork with configurable right-side images.

The original author's avatars, wallpapers, articles, contact details and music
IDs are not used.


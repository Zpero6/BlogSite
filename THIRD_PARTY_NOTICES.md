# Third-party design reference

The visual layout and glassmorphism direction of this project are adapted from:

- Project: XinghuisamaBlogs
- Source: https://github.com/heiehiehi/XinghuisamaBlogs
- Upstream commit used: 8633e983371acc3b627b88b911143ff0fd31ea23
- Author / licensor: heiehiehi and project contributors
- License: Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)
- Changes: The upstream XHBlogs frontend source is used as the base. Branding, profile, wallpaper assets, articles, navigation, music panel, content modules and backend integration were changed for Zpero.

No avatar, wallpaper, article, personal profile, music configuration, or other personalized asset from the reference project is included.

## Wallpaper assets

The five homepage wallpapers under `alice-blog-web/public/wallpapers/` were
supplied by the site owner and are included with explicit permission for public
repository and website display (confirmed 2026-10-26). They are not derived
from the reference project and are not covered by its CC BY-NC 4.0 license.
See `alice-blog-web/public/wallpapers/README.md` for the source mapping.

## GitHub contribution calendar

The homepage contribution heatmap reads the public contribution calendar HTML
from `https://github.com/users/<username>/contributions` on the server, caches
it for six hours, and does not require or store a GitHub token.


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

## Menu illustrations

The 11 semantic glyph SVGs under `alice-blog-web/public/images/nav/` are generated
locally by `alice-blog-web/scripts/generate-nav-art.mjs`. They are original
placeholder artwork, not copied from the reference site, and can be replaced
per the instructions in that directory's README.

## Technology brand icons

The skills strip uses SVG marks from the `simple-icons` package (CC0-1.0).
The technology names and logos are trademarks of their respective owners and
are used only to identify the technologies the site owner uses.

## Webmaster avatar

The avatar files `alice-blog-web/public/images/zpero-avatar.webp` and
`zpero-avatar.png` were generated from `站长头像.jpeg`, supplied by the site
owner. They are not from the reference project.

## GitHub contribution calendar

The homepage contribution heatmap reads the public contribution calendar HTML
from `https://github.com/users/<username>/contributions` on the server, caches
it for six hours, and does not require or store a GitHub token.


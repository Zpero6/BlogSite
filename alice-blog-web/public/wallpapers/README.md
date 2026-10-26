# Wallpaper assets

These are the optimized web variants used by the homepage wallpaper layer.
The original high-resolution files stay outside the repository and are only
read by `scripts/optimize-wallpapers.mjs`.

| Generated name | Original file (user-provided) |
| --- | --- |
| `chibi-characters` | `【哲风壁纸】Q版-动漫角色.jpg` |
| `ultraman-underwater` | `【哲风壁纸】奥特曼-气泡-水下.jpg` |
| `anime-girl-illustration` | `【哲风壁纸】二次元少女-动漫插画.jpg` |
| `hoshino-swimsuit` | `【哲风壁纸】少女-星野-泳装.jpg` |
| `elaina-window` | `【哲风壁纸】云朵-伊蕾娜-窗边.jpg` |

The site owner supplied these images and explicitly authorized their public
commit and display on 2026-10-26. They are not part of the upstream
XinghuisamaBlogs project and are not covered by that project's CC BY-NC 4.0
license. Replace or remove them if the distribution rights change.

Each image is generated at two long-edge sizes (1920 desktop, 1080 mobile) in
AVIF and WebP. Only the first wallpaper is preloaded; the next one is loaded
when the rotation is about to start.

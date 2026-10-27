# Wallpaper assets

These are the optimized web variants used by the shared site backdrop.
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
AVIF and WebP. The backdrop uses the `-blur-v2` variants: 16px desktop / 12px
mobile blur with 0.96 brightness and 0.94 saturation, so the wallpaper keeps its
daylight colours. No full-screen runtime `filter: blur()` is needed.

The carousel uses two permanent picture slots: the base remains fully opaque,
while the decoded top picture fades in over 2.6 seconds using the Web Animations
API. The slots exchange roles only after that animation finishes; only the
hidden picture is changed to prepare the next wallpaper. Each picture is held
for 10 seconds before the next fade. Hidden tabs pause an active animation and
do not start new rotations.

The footer offers Soft fade (the owner's requested default), Still background,
and Follow system. Follow system stops rotation when reduced motion is requested.
An explicitly selected fade is independent of global CSS transition overrides.
The choice is saved locally in the browser. The sharp variants are kept for
future non-background uses.

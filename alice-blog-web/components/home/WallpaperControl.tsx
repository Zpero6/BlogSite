"use client";

import {
  setWallpaperMotion,
  useWallpaperMotion,
  type WallpaperMotion,
} from "@/lib/wallpaperPreferences";

export default function WallpaperControl() {
  const mode = useWallpaperMotion();

  return (
    <label className="inline-flex items-center gap-2 text-white/75">
      <span>背景切换</span>
      <select
        value={mode}
        onChange={(event) => setWallpaperMotion(event.target.value as WallpaperMotion)}
        className="cursor-pointer rounded-md border border-white/15 bg-slate-900/35 px-2 py-1 text-[11px] text-white/90 focus-visible:outline-2 focus-visible:outline-white"
      >
        <option value="fade">柔和渐变</option>
        <option value="still">静态背景</option>
        <option value="system">跟随系统</option>
      </select>
    </label>
  );
}

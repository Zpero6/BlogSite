"use client";

import { useSyncExternalStore } from "react";

export type WallpaperMotion = "fade" | "still" | "system";

const STORAGE_KEY = "zpero.wallpaper-motion";
const CHANGE_EVENT = "zpero:wallpaper-motion";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
let memoryMotion: WallpaperMotion = "fade";

function readMotion(): WallpaperMotion {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === "fade" || value === "still" || value === "system") return value;
  } catch {
    // Storage may be disabled. The explicit site default remains usable.
  }
  return memoryMotion;
}

function subscribeMotion(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function subscribeReducedMotion(callback: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

export function useWallpaperMotion() {
  return useSyncExternalStore(subscribeMotion, readMotion, () => "fade" as const);
}

export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

export function setWallpaperMotion(mode: WallpaperMotion) {
  memoryMotion = mode;
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // The select remains safe to use when browser storage is unavailable.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

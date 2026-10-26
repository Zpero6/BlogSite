"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { siteConfig } from "@/siteConfig";

type Wallpaper = (typeof siteConfig.wallpapers)[number];

const ROTATE_MS = 12_000;
const FADE_MS = 800;

function WallpaperPicture({
  wallpaper,
  priority,
  onLoad,
  onError,
  className = "",
}: {
  wallpaper: Wallpaper;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
}) {
  return (
    <picture className={`absolute inset-0 block ${className}`}>
      <source
        media="(max-width: 767px)"
        type="image/avif"
        srcSet={`${wallpaper.mobileBlur}.avif`}
      />
      <source
        media="(max-width: 767px)"
        type="image/webp"
        srcSet={`${wallpaper.mobileBlur}.webp`}
      />
      <source type="image/avif" srcSet={`${wallpaper.desktopBlur}.avif`} />
      <img
        src={`${wallpaper.desktopBlur}.webp`}
        alt=""
        aria-hidden="true"
        className="h-full w-full object-cover"
        style={{ objectPosition: wallpaper.position }}
        loading="eager"
        decoding="async"
        fetchPriority={priority ? "high" : "low"}
        onLoad={onLoad}
        onError={onError}
      />
    </picture>
  );
}

/**
 * Full-screen wallpaper layer. It keeps at most two wallpapers in the DOM,
 * loads the next one only when a rotation is about to happen, pauses while the
 * tab is hidden, and does nothing when reduced motion is requested.
 */
export default function WallpaperLayer() {
  const count = siteConfig.wallpapers.length;
  const [front, setFront] = useState(0);
  const [pending, setPending] = useState<number | null>(null);
  const [isFading, setIsFading] = useState(false);

  const frontRef = useRef(0);
  const pendingRef = useRef<number | null>(null);
  const switchingRef = useRef(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRef = useRef<(delay?: number) => void>(() => {});

  const finishSwitch = useCallback((next: number) => {
    setFront(next);
    frontRef.current = next;
    pendingRef.current = null;
    setPending(null);
    setIsFading(false);
    switchingRef.current = false;
    scheduleRef.current();
  }, []);

  const handlePendingReady = useCallback(() => {
    if (pendingRef.current === null || isFading) return;

    setIsFading(true);
    fadeTimerRef.current = setTimeout(() => {
      if (pendingRef.current !== null) {
        finishSwitch(pendingRef.current);
      }
    }, FADE_MS);
  }, [finishSwitch, isFading]);

  const handlePendingError = useCallback(() => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    pendingRef.current = null;
    setPending(null);
    setIsFading(false);
    switchingRef.current = false;
    scheduleRef.current(5_000);
  }, []);

  useEffect(() => {
    if (count <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;

    const schedule = (delay = ROTATE_MS) => {
      if (cancelled || switchingRef.current) return;

      const timer = setTimeout(() => {
        if (cancelled || switchingRef.current) return;
        const next = (frontRef.current + 1) % count;
        switchingRef.current = true;
        pendingRef.current = next;
        setPending(next);
      }, delay);

      scheduleRef.current = (nextDelay = ROTATE_MS) => {
        if (cancelled) return;
        clearTimeout(timer);
        schedule(nextDelay);
      };
    };

    schedule();

    const handleVisibility = () => {
      if (!document.hidden && !switchingRef.current) {
        schedule(2_500);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [count]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#07111f]" aria-hidden="true">
      <WallpaperPicture
        wallpaper={siteConfig.wallpapers[front]}
        priority
        className="z-0"
      />

      {pending !== null && (
        <WallpaperPicture
          wallpaper={siteConfig.wallpapers[pending]}
          className={`z-10 transition-opacity duration-700 ease-out ${
            isFading ? "opacity-100" : "opacity-0"
          }`}
          onLoad={handlePendingReady}
          onError={handlePendingError}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/45 via-slate-950/25 to-slate-950/65" />
    </div>
  );
}

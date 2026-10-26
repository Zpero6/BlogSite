"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { siteConfig } from "@/siteConfig";

type Wallpaper = (typeof siteConfig.wallpapers)[number];

const ROTATE_MS = 12_000;
const FADE_MS = 800;
const RETRY_MS = 5_000;

function WallpaperPicture({
  wallpaper,
  priority,
  className = "",
  onLoad,
  onError,
}: {
  wallpaper: Wallpaper;
  priority?: boolean;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
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
 * Three-phase wallpaper carousel:
 *   1. every 12s insert the next image at opacity 0,
 *   2. wait for the real picture's onLoad before starting the fade,
 *   3. promote it to the current layer after 800ms and drop the old one.
 *
 * Loading failures keep the current wallpaper and retry. Reduced-motion users
 * still get the rotation, but the swap is instant instead of animated.
 */
export default function WallpaperLayer() {
  const count = siteConfig.wallpapers.length;
  const [current, setCurrent] = useState(0);
  const [pending, setPending] = useState<number | null>(null);
  const [isFading, setIsFading] = useState(false);

  const currentRef = useRef(0);
  const pendingRef = useRef<number | null>(null);
  const switchingRef = useRef(false);
  const fadeStartedRef = useRef(false);
  const reduceMotionRef = useRef(false);
  const mountedRef = useRef(true);
  const rotateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRef = useRef<(delay?: number) => void>(() => {});

  const clearRotateTimer = useCallback(() => {
    if (rotateTimerRef.current) {
      clearTimeout(rotateTimerRef.current);
      rotateTimerRef.current = null;
    }
  }, []);

  const clearFadeTimer = useCallback(() => {
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  const scheduleNext = useCallback(
    (delay = ROTATE_MS) => {
      clearRotateTimer();
      if (!mountedRef.current || switchingRef.current) return;

      rotateTimerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;

        // Do not start a transition in a hidden tab. The visibility handler
        // schedules a short catch-up delay when the tab returns.
        if (document.hidden) return;

        if (switchingRef.current) {
          scheduleRef.current(1_000);
          return;
        }

        const next = (currentRef.current + 1) % count;
        switchingRef.current = true;
        pendingRef.current = next;
        fadeStartedRef.current = false;
        setIsFading(false);
        setPending(next);
      }, delay);
    },
    [clearRotateTimer, count]
  );

  const promotePending = useCallback(() => {
    const next = pendingRef.current;
    if (next === null) return;

    setCurrent(next);
    currentRef.current = next;
    pendingRef.current = null;
    setPending(null);
    setIsFading(false);
    switchingRef.current = false;
    fadeStartedRef.current = false;
    clearFadeTimer();

    if (mountedRef.current) {
      scheduleRef.current();
    }
  }, [clearFadeTimer]);

  const handlePendingLoad = useCallback(() => {
    if (!mountedRef.current || pendingRef.current === null) return;
    if (fadeStartedRef.current) return;
    fadeStartedRef.current = true;

    if (reduceMotionRef.current) {
      promotePending();
      return;
    }

    // Let the browser paint the opacity-0 layer before flipping the class.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (mountedRef.current && pendingRef.current !== null) {
          setIsFading(true);
        }
      });
    });

    clearFadeTimer();
    fadeTimerRef.current = setTimeout(promotePending, FADE_MS + 100);
  }, [clearFadeTimer, promotePending]);

  const handlePendingError = useCallback(() => {
    if (!mountedRef.current) return;

    clearFadeTimer();
    pendingRef.current = null;
    setPending(null);
    setIsFading(false);
    switchingRef.current = false;
    fadeStartedRef.current = false;

    if (mountedRef.current) {
      scheduleRef.current(RETRY_MS);
    }
  }, [clearFadeTimer]);

  useEffect(() => {
    mountedRef.current = true;
    scheduleRef.current = scheduleNext;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotionRef.current = media.matches;
    const handleMediaChange = () => {
      reduceMotionRef.current = media.matches;
    };
    media.addEventListener("change", handleMediaChange);

    const handleVisibility = () => {
      if (document.hidden) {
        clearRotateTimer();
        return;
      }

      if (!switchingRef.current) {
        scheduleRef.current(2_500);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    scheduleNext();

    return () => {
      mountedRef.current = false;
      clearRotateTimer();
      clearFadeTimer();
      media.removeEventListener("change", handleMediaChange);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [clearFadeTimer, clearRotateTimer, scheduleNext]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#07111f]" aria-hidden="true">
      <WallpaperPicture
        wallpaper={siteConfig.wallpapers[current]}
        priority
        className="z-0"
      />

      {pending !== null && (
        <WallpaperPicture
          wallpaper={siteConfig.wallpapers[pending]}
          className={`z-10 transition-opacity duration-700 ease-out ${
            isFading ? "opacity-100" : "opacity-0"
          }`}
          onLoad={handlePendingLoad}
          onError={handlePendingError}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/45 via-slate-950/25 to-slate-950/65" />
    </div>
  );
}

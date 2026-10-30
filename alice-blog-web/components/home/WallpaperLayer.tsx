"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion, useWallpaperMotion } from "@/lib/wallpaperPreferences";
import { siteConfig } from "@/siteConfig";

const HOLD_MS = 10_000;
const FADE_MS = 2_600;

/** Resolve only after the browser has decoded the actual picture source. */
function waitForImage(image: HTMLImageElement, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanUp = () => {
      clearTimeout(timeout);
      image.removeEventListener("load", onLoad);
      image.removeEventListener("error", onError);
      signal.removeEventListener("abort", onAbort);
    };
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      cleanUp();
      if (error) reject(error);
      else resolve();
    };
    const onLoad = () => {
      image.decode().then(() => finish(), () => finish(new Error("Wallpaper decode failed")));
    };
    const onError = () => finish(new Error("Wallpaper load failed"));
    const onAbort = () => finish(new Error("Wallpaper load cancelled"));
    const timeout = setTimeout(() => finish(new Error("Wallpaper load timed out")), 15_000);

    image.addEventListener("load", onLoad);
    image.addEventListener("error", onError);
    signal.addEventListener("abort", onAbort, { once: true });

    if (signal.aborted) onAbort();
    else if (image.complete) {
      if (image.naturalWidth > 0) onLoad();
      else onError();
    }
  });
}

/**
 * Two permanent slots. The base stays opaque while the decoded top picture
 * dissolves over it. Web Animations owns opacity, so the site's global
 * reduced-motion CSS cannot silently shorten an explicitly selected fade.
 * "Follow system" and "Still" stop rotation instead of producing hard cuts.
 */
export default function WallpaperLayer() {
  const wallpapers = siteConfig.wallpapers;
  const count = wallpapers.length;
  const mode = useWallpaperMotion();
  const reducedMotion = useReducedMotion();
  const enabled = mode === "fade" || (mode === "system" && !reducedMotion);
  const [slots, setSlots] = useState<[number, number]>([0, count > 1 ? 1 : 0]);
  const picturesRef = useRef<Array<HTMLPictureElement | null>>([]);
  const imagesRef = useRef<Array<HTMLImageElement | null>>([]);
  const frontSlotRef = useRef(0);
  const currentIndexRef = useRef(0);
  const nextIndexRef = useRef(count > 1 ? 1 : 0);

  useEffect(() => {
    if (!enabled || count <= 1) return;

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | null = null;
    let animation: Animation | null = null;
    let busy = false;

    const schedule = (delay = HOLD_MS) => {
      if (timer) clearTimeout(timer);
      if (controller.signal.aborted || document.hidden) return;
      timer = setTimeout(() => { void rotate(); }, delay);
    };

    const rotate = async () => {
      if (busy || controller.signal.aborted || document.hidden) return;
      busy = true;
      const frontSlot = frontSlotRef.current;
      const backSlot = 1 - frontSlot;
      const front = picturesRef.current[frontSlot];
      const back = picturesRef.current[backSlot];
      const image = imagesRef.current[backSlot];

      try {
        if (!front || !back || !image) throw new Error("Wallpaper slot unavailable");
        await waitForImage(image, controller.signal);
        if (controller.signal.aborted || document.hidden) return;

        front.style.opacity = "1";
        front.style.zIndex = "1";
        back.style.opacity = "0";
        back.style.zIndex = "2";

        animation = back.animate(
          [{ opacity: 0 }, { opacity: 1 }],
          { duration: FADE_MS, easing: "ease-in-out", fill: "forwards" },
        );
        await animation.finished;
        if (controller.signal.aborted) return;

        // Commit the fully visible slot before removing the animation effect.
        // Neither image is remounted or changed while it is visible.
        back.style.opacity = "1";
        animation.cancel();
        animation = null;
        front.style.opacity = "0";
        front.style.zIndex = "0";
        back.style.zIndex = "1";
        frontSlotRef.current = backSlot;
        currentIndexRef.current = nextIndexRef.current;

        const next = (currentIndexRef.current + 1) % count;
        nextIndexRef.current = next;
        setSlots((previous) => {
          const updated: [number, number] = [...previous];
          updated[frontSlot] = next;
          return updated;
        });
      } catch {
        if (!controller.signal.aborted) {
          // A failed next image never removes the visible current wallpaper.
          const next = (nextIndexRef.current + 1) % count;
          nextIndexRef.current = next;
          setSlots((previous) => {
            const updated: [number, number] = [...previous];
            updated[backSlot] = next;
            return updated;
          });
        }
      } finally {
        busy = false;
        schedule();
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (timer) clearTimeout(timer);
        animation?.pause();
      } else if (animation?.playState === "paused") {
        animation.play();
      } else if (!busy) {
        schedule(1_500);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    schedule();

    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
      animation?.cancel();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [count, enabled]);

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden bg-[#0a141c]"
      data-wallpaper-motion={mode}
      aria-hidden="true"
    >
      {slots.map((wallpaperIndex, slot) => {
        const wallpaper = wallpapers[wallpaperIndex];
        return (
          <picture
            key={slot}
            ref={(element) => { picturesRef.current[slot] = element; }}
            className="absolute inset-0 block will-change-[opacity]"
            // These initial values stay constant in React. The animation
            // controller owns subsequent opacity and stacking changes.
            style={{ opacity: slot === 0 ? 1 : 0, zIndex: slot === 0 ? 1 : 0 }}
          >
            <source media="(max-width: 767px)" type="image/avif" srcSet={`${wallpaper.mobileBlur}.avif`} />
            <source media="(max-width: 767px)" type="image/webp" srcSet={`${wallpaper.mobileBlur}.webp`} />
            <source type="image/avif" srcSet={`${wallpaper.desktopBlur}.avif`} />
            <img
              ref={(element) => { imagesRef.current[slot] = element; }}
              src={`${wallpaper.desktopBlur}.webp`}
              alt=""
              className="h-full w-full object-cover"
              style={{ objectPosition: wallpaper.position }}
              loading="eager"
              decoding="async"
              fetchPriority={slot === 0 ? "high" : "auto"}
            />
          </picture>
        );
      })}
      <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-b from-[#07111f]/8 via-transparent to-[#07111f]/24" />
    </div>
  );
}

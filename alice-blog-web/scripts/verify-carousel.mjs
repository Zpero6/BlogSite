/**
 * Samples the two-slot wallpaper carousel through one fade and one
 * reduced-motion cycle. Start Chrome with --remote-debugging-port=9223 first.
 */
import fs from "node:fs/promises";
import path from "node:path";

const debugBase = process.env.CHROME_DEBUG || "http://127.0.0.1:9223";
const siteUrl = process.env.SITE_URL || "http://localhost:3000/";
const outputDir = process.env.OUT_DIR || path.join(process.cwd(), "screenshots");

const targets = await (await fetch(`${debugBase}/json/list`)).json();
const page = targets.find((target) => target.type === "page");
if (!page?.webSocketDebuggerUrl) throw new Error("No Chrome page target on 9223.");

const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
let nextId = 1;

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  }
});

function send(method, params = {}) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function readState() {
  const result = await send("Runtime.evaluate", {
    expression: `(() => {
      const pictures = [...document.querySelectorAll('picture')].slice(0, 2);
      return {
        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        pictures: pictures.map((picture) => ({
          src: (picture.querySelector('img')?.currentSrc || '').split('/').pop(),
          opacity: Number(getComputedStyle(picture).opacity),
          transition: getComputedStyle(picture).transitionDuration,
        })),
      };
    })()`,
    returnByValue: true,
  });
  return result.result.value;
}

async function sample(label, screenshot = false) {
  const state = await readState();
  console.log(label, JSON.stringify(state));

  if (screenshot) {
    const shot = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    const file = path.join(outputDir, `carousel-${label}.png`);
    await fs.writeFile(file, Buffer.from(shot.data, "base64"));
    console.log("  screenshot", file);
  }

  return state;
}

async function waitFor(predicate, timeout = 16_000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const state = await readState();
    if (predicate(state)) return state;
    await wait(120);
  }
  return readState();
}

await send("Page.enable");
await fs.mkdir(outputDir, { recursive: true });
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});

// Normal motion: wait for the fade to actually start, then sample its phases.
await send("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
});
await send("Page.navigate", { url: siteUrl });
await wait(2_000);
await sample("before");

const fadeStarted = await waitFor(
  (state) => parseFloat(state.pictures[1]?.transition) > 0
);
if (parseFloat(fadeStarted.pictures[1]?.transition) > 0) {
  await sample("fade-0", true);

  await waitFor((state) => (state.pictures[1]?.opacity ?? 0) >= 0.25);
  await sample("fade-25", true);

  await waitFor((state) => (state.pictures[1]?.opacity ?? 0) >= 0.5);
  await sample("fade-50", true);

  await waitFor((state) => (state.pictures[1]?.opacity ?? 0) >= 0.75);
  await sample("fade-75", true);

  await waitFor((state) => state.pictures[1]?.opacity !== undefined && state.pictures[1].opacity === 0);
  await sample("fade-100", true);
} else {
  console.log("fade did not start", JSON.stringify(fadeStarted));
}

// Reduced motion: the base should change without any opacity transition.
await send("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-reduced-motion", value: "reduce" }],
});
await send("Page.navigate", { url: siteUrl });
await wait(2_000);
const reducedBefore = await sample("reduced-before");
const initialBase = reducedBefore.pictures[0]?.src;
await waitFor((state) => state.pictures[0]?.src !== initialBase);
await sample("reduced-after", true);

socket.close();

/**
 * Captures each of the five wallpapers with reduced-motion instant swaps.
 * Start Chrome with --remote-debugging-port=9223 first.
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

await send("Page.enable");
await fs.mkdir(outputDir, { recursive: true });
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-reduced-motion", value: "reduce" }],
});
await send("Page.navigate", { url: siteUrl });
await wait(2_200);

for (let cycle = 0; cycle < 5; cycle += 1) {
  if (cycle > 0) await wait(10_300);

  const state = await send("Runtime.evaluate", {
    expression: `(() => {
      const picture = document.querySelectorAll('picture')[0];
      const image = picture?.querySelector('img');
      return {
        src: (image?.currentSrc || '').split('/').pop(),
        width: image?.naturalWidth,
        height: image?.naturalHeight,
      };
    })()`,
    returnByValue: true,
  });

  const shot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  const file = path.join(outputDir, `wallpaper-${cycle + 1}.png`);
  await fs.writeFile(file, Buffer.from(shot.data, "base64"));
  console.log(cycle + 1, JSON.stringify(state.result.value), file);
}

socket.close();

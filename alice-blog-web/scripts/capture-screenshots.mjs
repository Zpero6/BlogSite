/**
 * Small Chrome DevTools Protocol screenshot helper used for responsive QA.
 *
 * Start Chrome first, for example:
 *   chrome --headless=new --remote-debugging-port=9222 --user-data-dir=/tmp/zpero-cdp about:blank
 * Then:
 *   node scripts/capture-screenshots.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";

const debugBase = process.env.CHROME_DEBUG || "http://127.0.0.1:9222";
const siteBase = process.env.BASE_URL || "http://localhost:3000";
const outputDir = process.env.OUT_DIR || path.join(process.cwd(), "screenshots");

const viewports = [
  { name: "1440x900", width: 1440, height: 900, mobile: false },
  { name: "1024x768", width: 1024, height: 768, mobile: false },
  { name: "768x1024", width: 768, height: 1024, mobile: true },
  { name: "390x844", width: 390, height: 844, mobile: true },
];

const pages = process.env.PAGES
  ? process.env.PAGES.split(",").map((item) => item.trim())
  : ["/", "/timeline", "/posts/building-zpero-site", "/about", "/projects"];

const targets = await (await fetch(`${debugBase}/json/list`)).json();
const page = targets.find((target) => target.type === "page");

if (!page?.webSocketDebuggerUrl) {
  throw new Error("No Chrome page target found. Start Chrome with --remote-debugging-port=9222.");
}

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

await send("Page.enable");
await fs.mkdir(outputDir, { recursive: true });

for (const viewport of viewports) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
  });

  for (const pagePath of pages) {
    const loaded = new Promise((resolve) => {
      const timer = setTimeout(resolve, 8_000);
      const handler = (event) => {
        const message = JSON.parse(event.data);
        if (message.method === "Page.loadEventFired") {
          clearTimeout(timer);
          socket.removeEventListener("message", handler);
          resolve();
        }
      };
      socket.addEventListener("message", handler);
    });

    const targetUrl = `${siteBase}${pagePath}`;
    console.log(`navigate ${targetUrl}`);
    await send("Page.navigate", { url: targetUrl });
    await loaded;
    await new Promise((resolve) => setTimeout(resolve, 1_800));

    const screenshot = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });

    const slug = pagePath === "/" ? "home" : pagePath.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
    const file = path.join(outputDir, `${slug}-${viewport.name}.png`);
    await fs.writeFile(file, Buffer.from(screenshot.data, "base64"));
    console.log(file);
  }
}

socket.close();

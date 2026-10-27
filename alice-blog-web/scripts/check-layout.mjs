const debugBase = process.env.CHROME_DEBUG || "http://127.0.0.1:9223";
const baseUrl = process.env.BASE_URL || "http://localhost:3001";
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
for (const viewport of [
  { name: "1920x1080", width: 1920, height: 1080, mobile: false },
  { name: "1440x900", width: 1440, height: 900, mobile: false },
  { name: "1024x768", width: 1024, height: 768, mobile: false },
  { name: "768x1024", width: 768, height: 1024, mobile: true },
  { name: "390x844", width: 390, height: 844, mobile: true },
]) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
  });
  await send("Page.navigate", { url: `${baseUrl}/` });
  await wait(1_500);
  const result = await send("Runtime.evaluate", {
    expression: `(() => {
      const heatmap = document.querySelector('[role="list"]')?.parentElement;
      return {
        viewport: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        heatmapClient: heatmap?.clientWidth,
        heatmapScroll: heatmap?.scrollWidth,
      };
    })()`,
    returnByValue: true,
  });
  console.log(viewport.name, JSON.stringify(result.result.value));
}
socket.close();

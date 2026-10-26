const base = process.env.CHROME_DEBUG || "http://127.0.0.1:9223";
const targets = await (await fetch(`${base}/json/list`)).json();
const page = targets.find((target) => target.type === "page");
const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
let id = 1;

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    message.error ? reject(new Error(message.error.message)) : resolve(message.result);
  }
});

function send(method, params = {}) {
  const requestId = id++;
  socket.send(JSON.stringify({ id: requestId, method, params }));
  return new Promise((resolve, reject) => pending.set(requestId, { resolve, reject }));
}

await send("Page.enable");
await send("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
});
await send("Page.navigate", { url: "http://localhost:3000/" });
await new Promise((resolve) => setTimeout(resolve, 3_000));

const before = await send("Runtime.evaluate", {
  expression: `[...document.querySelectorAll('img[src*="-blur.webp"]')].map((img) => img.currentSrc || img.src)`,
  returnByValue: true,
});
console.log("before", before.result.value);

await new Promise((resolve) => setTimeout(resolve, 20_000));

const after = await send("Runtime.evaluate", {
  expression: `[...document.querySelectorAll('img[src*="-blur.webp"]')].map((img) => img.currentSrc || img.src)`,
  returnByValue: true,
});
console.log("after", after.result.value);

socket.close();

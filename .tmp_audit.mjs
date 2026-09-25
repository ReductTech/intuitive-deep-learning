import { writeFileSync } from "node:fs";
const CDP = Number(process.env.CDP_PORT || 9223);
const BASE = process.env.APP_URL || "http://localhost:5174";
const DECK = process.env.DECK || "convolution-kernel-intro";
const slides = (process.env.SLIDES || "grayscale-kernel").split(",");
const expr = process.env.EXPR || "";
const prefix = process.env.SHOT || "audit";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function openTab(url) {
  const res = await fetch(`http://127.0.0.1:${CDP}/json/new?${encodeURIComponent(url)}`, { method: "PUT" });
  if (!res.ok) throw new Error(`open tab failed ${res.status}`);
  return res.json();
}
async function connect(wsUrl) {
  const socket = new WebSocket(wsUrl);
  await new Promise((res, rej) => { socket.onopen = res; socket.onerror = rej; });
  let seq = 0; const pending = new Map(); const errors = [];
  socket.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.method === "Runtime.exceptionThrown") errors.push(String(m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text).slice(0, 240));
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(String(m.params.args?.map((a) => a.value ?? a.description).join(" ")).slice(0, 200));
    const r = pending.get(m.id); if (r) { pending.delete(m.id); r(m); }
  };
  const send = (method, params = {}) => new Promise((res) => { const id = ++seq; pending.set(id, res); socket.send(JSON.stringify({ id, method, params })); });
  return { send, errors, close: () => socket.close() };
}
const audit = `(() => {
  const surface = document.querySelector("[data-ppt-canvas] .ppt-slide-surface");
  if (!surface) return { error: "missing surface" };
  const rect = surface.getBoundingClientRect();
  const overflow = [];
  for (const el of surface.querySelectorAll("*")) {
    const b = el.getBoundingClientRect();
    if (b.width === 0 && b.height === 0) continue;
    if (b.left < rect.left - 0.5 || b.top < rect.top - 0.5 || b.right > rect.right + 0.5 || b.bottom > rect.bottom + 0.5) {
      overflow.push({ c: String(el.className?.baseVal ?? el.className).slice(0, 60), or: +(b.right - rect.right).toFixed(1), ob: +(b.bottom - rect.bottom).toFixed(1) });
    }
  }
  return { overflowCount: overflow.length, overflow: overflow.slice(0, 6), text: surface.innerText.replace(/\\s+/g, " ").slice(0, 300) };
})()`;
for (const id of slides) {
  const tab = await openTab(`${BASE}/scenedeck/?deck=${DECK}&slide=${id}`);
  const c = await connect(tab.webSocketDebuggerUrl);
  await c.send("Runtime.enable");
  await c.send("Page.enable");
  await c.send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
  await sleep(3600);
  if (expr) {
    const r = await c.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    console.log(JSON.stringify({ id, exprResult: r.result?.result?.value ?? r.result?.exceptionDetails?.text ?? null }));
    await sleep(400);
  }
  const r = await c.send("Runtime.evaluate", { expression: audit, returnByValue: true });
  console.log(JSON.stringify({ id, ...(r.result?.result?.value ?? {}), errors: c.errors }));
  const shot = await c.send("Page.captureScreenshot", { format: "png" });
  if (shot.result?.data) writeFileSync(`.tmp_${prefix}_${id}.png`, Buffer.from(shot.result.data, "base64"));
  c.close();
  await fetch(`http://127.0.0.1:${CDP}/json/close/${tab.id}`);
}

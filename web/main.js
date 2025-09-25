import init, { count_tokens, tokenize_to_ids } from "./pkg/count_tokens.js";

const input = document.getElementById("input");
const encoding = document.getElementById("encoding");
const countEl = document.getElementById("count");
const statusEl = document.getElementById("status");

// Create a module worker (modern browsers)
const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });

let ready = false;
let lastReqId = 0;

function debounce(fn, ms = 100) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function setDisabled(disabled) {
  input.disabled = disabled;
  encoding.disabled = disabled;
}

setDisabled(true);
statusEl.textContent = "Loading…";

worker.onmessage = (e) => {
  const msg = e.data || {};
  if (msg.type === "ready") {
    ready = true;
    setDisabled(false);
    statusEl.textContent = "Ready";
    recalc(); // initial count if textarea has default value
    return;
  }
  if (msg.type === "count") {
    // Ignore stale responses
    if (msg.reqId !== lastReqId) return;
    countEl.textContent = String(msg.count);
    statusEl.textContent = "Ready";
    return;
  }
  if (msg.type === "error") {
    console.error("Worker error:", msg.error);
    if (typeof msg.reqId === "number" && msg.reqId !== lastReqId) return;
    statusEl.textContent = "Error (see console)";
    return;
  }
};

worker.onerror = (e) => {
  console.error("Worker uncaught error:", e);
  statusEl.textContent = "Error (see console)";
  setDisabled(false);
};

const recalc = debounce(() => {
  if (!ready) return; // will run after 'ready' anyway
  const reqId = ++lastReqId;
  statusEl.textContent = "Counting…";
  worker.postMessage({
    type: "count",
    reqId,
    encoding: encoding.value,
    text: input.value,
  });
}, 100);

input.addEventListener("input", recalc);
encoding.addEventListener("change", recalc);
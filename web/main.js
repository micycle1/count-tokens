const input = document.getElementById("input");
const encoding = document.getElementById("encoding");
const countEl = document.getElementById("count");
const statusEl = document.getElementById("status");
const clearBtn = document.getElementById("clear");
const infoEl = document.getElementById("info");
const showPreview = document.getElementById("showPreview");
const previewEl = document.getElementById("preview");

// Threshold to switch to "large mode" (tuneable)
const LARGE_THRESHOLD = 50_000; // characters
const PREVIEW_CHARS = 2_000;

const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });

let ready = false;
let lastReqId = 0;
let largeMode = false;
let largeText = ""; // holds content when largeMode = true

function debounce(fn, ms = 100) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function setDisabled(disabled) {
  input.disabled = disabled;
  encoding.disabled = disabled;
  clearBtn.disabled = disabled;
  showPreview.disabled = disabled;
}

function updateInfo() {
  if (largeMode) {
    const size = largeText.length;
    infoEl.textContent = `Large paste loaded (${size.toLocaleString()} chars). Text hidden to keep UI fast.`;
  } else {
    infoEl.textContent = "";
  }
  const show = showPreview.checked && largeMode;
  previewEl.style.display = show ? "block" : "none";
  if (show) {
    previewEl.textContent = largeText.slice(0, PREVIEW_CHARS);
  } else {
    previewEl.textContent = "";
  }
}

worker.onmessage = (e) => {
  const msg = e.data || {};
  if (msg.type === "ready") {
    ready = true;
    setDisabled(false);
    statusEl.textContent = "Ready";
    recalc(); // initial count
    return;
  }
  if (msg.type === "count") {
    if (msg.reqId !== lastReqId) return; // ignore stale response
    countEl.textContent = String(msg.count);
    statusEl.textContent = "Ready";
    return;
  }
  if (msg.type === "error") {
    console.error("Worker error:", msg.error);
    if (typeof msg.reqId === "number" && msg.reqId !== lastReqId) return;
    statusEl.textContent = "Error (see console)";
  }
};

worker.onerror = (e) => {
  console.error("Worker uncaught error:", e);
  statusEl.textContent = "Error (see console)";
  setDisabled(false);
};

setDisabled(true);
statusEl.textContent = "Loading…";

const recalc = debounce(() => {
  if (!ready) return;
  const reqId = ++lastReqId;
  statusEl.textContent = "Counting…";
  worker.postMessage({
    type: "count",
    reqId,
    encoding: encoding.value,
    text: largeMode ? largeText : input.value,
  });
}, 60);

// Paste handler to avoid rendering huge content
input.addEventListener("paste", (e) => {
  const data = e.clipboardData?.getData("text") ?? "";
  if (data.length >= LARGE_THRESHOLD) {
    e.preventDefault(); // don’t insert into textarea
    largeMode = true;
    largeText = data;
    input.value = ""; // keep UI light
    updateInfo();
    recalc();
  }
});

input.addEventListener("input", () => {
  if (largeMode) {
    // In large mode we ignore the textarea content to keep it empty/light.
    // If the user types, switch back to normal mode.
    largeMode = false;
    largeText = "";
    updateInfo();
  }
  recalc();
});

encoding.addEventListener("change", recalc);
clearBtn.addEventListener("click", () => {
  largeMode = false;
  largeText = "";
  input.value = "";
  updateInfo();
  recalc();
});
showPreview.addEventListener("change", updateInfo);

worker.postMessage({ type: "init" });
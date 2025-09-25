import init, { count_tokens, tokenize_to_ids } from "./pkg/count_tokens.js";

const input = document.getElementById("input");
const encoding = document.getElementById("encoding");
const countEl = document.getElementById("count");
const idsEl = document.getElementById("ids");
const statusEl = document.getElementById("status");

let wasmReady;

function debounce(fn, ms = 80) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

async function loadWasmOnce() {
  if (!wasmReady) {
    // New signature: pass a single object
    wasmReady = init({ module_or_path: new URL("./pkg/count_tokens_bg.wasm", import.meta.url) })
      .catch(async (e) => {
        console.warn("Explicit URL init failed, retrying default init()", e);
        // Fallback for environments where the URL form is blocked
        await init();
      });
  }
  return wasmReady;
}

async function boot() {
  input.disabled = true;
  encoding.disabled = true;
  statusEl.textContent = "Loading…";

  try {
    await loadWasmOnce();
    statusEl.textContent = "Ready";
  } catch (e) {
    console.error("WASM init failed", e);
    statusEl.textContent = "Failed to load tokenizer";
    // Allow typing even if counting won’t work
  } finally {
    input.disabled = false;
    encoding.disabled = false;
  }

  recalc(); // first calculation after init
}

const recalc = debounce(() => {
  try {
    const enc = encoding.value;
    const text = input.value;
    const count = count_tokens(enc, text);
    countEl.textContent = String(count);

    if (text.length < 50000) {
      const ids = tokenize_to_ids(enc, text);
      idsEl.textContent = `IDs: ${Array.from(ids).join(", ")}`;
    } else {
      idsEl.textContent = "";
    }
  } catch (e) {
    // If user types while WASM still initializing, this keeps UI responsive
    console.debug("Recalc before WASM ready or other issue:", e);
  }
}, 80);

input.addEventListener("input", recalc);
encoding.addEventListener("change", recalc);

boot();
import init, { count_tokens, tokenize_to_ids } from "./pkg/count_tokens.js";

const input = document.getElementById("input");
const encoding = document.getElementById("encoding");
const countEl = document.getElementById("count");
const idsEl = document.getElementById("ids");
const statusEl = document.getElementById("status");

// Disable UI until WASM is ready
input.disabled = true;
encoding.disabled = true;
statusEl.textContent = "Loading…";

// Top-level await ensures we init exactly once before anything else runs
await init(new URL("./pkg/count_tokens_bg.wasm", import.meta.url));

statusEl.textContent = "Ready";
input.disabled = false;
encoding.disabled = false;

function debounce(fn, ms = 80) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

const recalc = debounce(() => {
  try {
    const enc = encoding.value;
    const text = input.value;

    // WASM is guaranteed initialized at this point
    const count = count_tokens(enc, text);
    countEl.textContent = String(count);

    if (text.length < 50000) {
      const ids = tokenize_to_ids(enc, text);
      idsEl.textContent = `IDs: ${Array.from(ids).join(", ")}`;
    } else {
      idsEl.textContent = "";
    }
  } catch (e) {
    console.error(e);
    statusEl.textContent = "Error (see console)";
  }
}, 80);

input.addEventListener("input", recalc);
encoding.addEventListener("change", recalc);
recalc();

import init, { count_tokens } from "./pkg/count_tokens.js";

let ready = false;
let initPromise = null;

async function ensureInit() {
    if (ready) return;
    if (!initPromise) {
        initPromise = (async () => {
            await init({ module_or_path: new URL("./pkg/count_tokens_bg.wasm", import.meta.url) });
            ready = true;
            postMessage({ type: "ready" });
        })().catch(e => {
            postMessage({ type: "error", error: String(e) });
            throw e;
        });
    }
    return initPromise;
}

onmessage = async (e) => {
    const msg = e.data || {};
    if (msg.type === "init") {
        try { await ensureInit(); } catch { }
        return;
    }
    if (msg.type === "count") {
        const { reqId, encoding, text } = msg;
        try {
            await ensureInit();
            const count = count_tokens(encoding, text);
            postMessage({ type: "count", reqId, count });
        } catch (err) {
            postMessage({ type: "error", reqId, error: String(err) });
        }
    }
};
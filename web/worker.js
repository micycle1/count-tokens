import init, { count_tokens } from "./pkg/count_tokens.js";

let readyPromise = (async () => {
    try {
        await init({ module_or_path: new URL("./pkg/count_tokens_bg.wasm", import.meta.url) });
        self.postMessage({ type: "ready" });
    } catch (e) {
        self.postMessage({ type: "error", error: String(e) });
    }
})();

self.onmessage = async (e) => {
    const msg = e.data || {};
    if (msg.type !== "count") return;

    const { reqId, encoding, text } = msg;
    try {
        await readyPromise; // ensure WASM is initialized
        const count = count_tokens(encoding, text);
        self.postMessage({ type: "count", reqId, count });
    } catch (e2) {
        self.postMessage({ type: "error", reqId, error: String(e2) });
    }
};
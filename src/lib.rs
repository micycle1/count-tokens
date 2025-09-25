use wasm_bindgen::prelude::*;

fn get_tok(enc: &str) -> &'static bpe_openai::Tokenizer {
    match enc.to_lowercase().as_str() {
        "o200k" | "o200k_base" => bpe_openai::o200k_base(),
        "voyage3" | "voyage3_base" => bpe_openai::voyage3_base(),
        // default
        _ => bpe_openai::cl100k_base(),
    }
}

#[cfg(feature = "console_error_panic_hook")]
#[wasm_bindgen(start)]
pub fn set_panic_hook() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn count_tokens(encoding: &str, text: &str) -> u32 {
    get_tok(encoding).count(text) as u32
}

#[wasm_bindgen]
pub fn tokenize_to_ids(encoding: &str, text: &str) -> Vec<u32> {
    get_tok(encoding).encode(text).into_iter().map(|x| x as u32).collect()
}

// Optional but handy: count with an upper bound, faster for small limits
#[wasm_bindgen]
pub fn count_till_limit(encoding: &str, text: &str, limit: u32) -> Option<u32> {
    let tok = get_tok(encoding);
    let norm = tok.normalize(text);
    tok.count_till_limit(&norm, limit as usize).map(|n| n as u32)
}

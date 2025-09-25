use wasm_bindgen::prelude::*;
use std::cell::RefCell;
use bpe_openai::{cl100k, p50k, r50k, Bpe};

thread_local! {
    static CL100K: RefCell<Option<Bpe>> = RefCell::new(None);
    static P50K: RefCell<Option<Bpe>> = RefCell::new(None);
    static R50K: RefCell<Option<Bpe>> = RefCell::new(None);
}

#[cfg(feature = "console_error_panic_hook")]
#[wasm_bindgen(start)]
pub fn set_panic_hook() {
    console_error_panic_hook::set_once();
}

fn with_bpe<R>(encoding: &str, f: impl FnOnce(&Bpe) -> R) -> R {
    let e = encoding.to_lowercase();
    match e.as_str() {
        "cl100k_base" | "gpt-4" | "gpt-3.5-turbo" | "text-embedding-ada-002" => {
            CL100K.with(|cell| {
                if cell.borrow().is_none() {
                    cell.replace(Some(cl100k()));
                }
                f(cell.borrow().as_ref().unwrap())
            })
        }
        "p50k_base" | "text-davinci-003" | "text-davinci-002" | "code-davinci" => {
            P50K.with(|cell| {
                if cell.borrow().is_none() {
                    cell.replace(Some(p50k()));
                }
                f(cell.borrow().as_ref().unwrap())
            })
        }
        "r50k_base" | "gpt2" => {
            R50K.with(|cell| {
                if cell.borrow().is_none() {
                    cell.replace(Some(r50k()));
                }
                f(cell.borrow().as_ref().unwrap())
            })
        }
        _ => {
            // default to cl100k_base
            CL100K.with(|cell| {
                if cell.borrow().is_none() {
                    cell.replace(Some(cl100k()));
                }
                f(cell.borrow().as_ref().unwrap())
            })
        }
    }
}

#[wasm_bindgen]
pub fn count_tokens(encoding: &str, text: &str) -> u32 {
    with_bpe(encoding, |bpe| bpe.count(text) as u32)
}

#[wasm_bindgen]
pub fn tokenize_to_ids(encoding: &str, text: &str) -> Vec<u32> {
    with_bpe(encoding, |bpe| bpe.encode(text).into_iter().map(|id| id as u32).collect())
}
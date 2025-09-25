# count-tokens

Ultra-fast, client-side token counter for large text blobs using OpenAI-style BPEs.

## What this is
- Static site (GitHub Pages) that counts tokens entirely in your browser
- Built with [bpe-openai](https://crates.io/crates/bpe-openai) compiled to WebAssembly
- Optimised for huge pastes (even repo-level): avoids per-token highlighting that makes other sites hang
- Zero backend; no data leaves your machine

## Supported encodings
- cl100k_base
- o200k_base
- voyage3_base

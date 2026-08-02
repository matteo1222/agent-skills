---
name: pdf-inspector
description: Inspect local PDFs with Firecrawl pdf-inspector. Use when Codex needs fast PDF classification, OCR routing, structured Markdown extraction, page or layout analysis, or positioned text JSON without sending the document to an external service.
---

# PDF Inspector

Use Firecrawl's local `pdf2md` and `detect-pdf` CLIs. They classify native-text, scanned, image-based, and mixed PDFs, extract native text to Markdown, and identify pages that need OCR. Their role ends at native-text extraction; route listed pages to an OCR tool when complete text is required.

## Setup

Check both binaries:

```bash
command -v pdf2md
command -v detect-pdf
```

If either is absent, install the maintained Rust package:

```bash
cargo install pdf-inspector
```

Continue when both commands resolve. Upstream source: <https://github.com/firecrawl/pdf-inspector>.

## Inspect and route

1. Resolve the input to a local `.pdf` path. Download URL inputs to a temporary PDF first.
2. Classify it with machine-readable output:

   ```bash
   detect-pdf "/path/to/document.pdf" --json
   ```

3. Read `pdf_type`, `confidence`, `ocr_recommended`, and `pages_needing_ocr`. For table or column routing, add layout analysis:

   ```bash
   detect-pdf "/path/to/document.pdf" --analyze --json
   ```

4. Take the matching branch:

   - `text_based`: extract locally.
   - `mixed`: keep the native-text result and route every page in `pages_needing_ocr` through OCR when full coverage matters.
   - `scanned` or `image_based`: route the document through OCR.

Classification is complete when the response records the PDF type, confidence, page count, and exact OCR page set.

## Extract Markdown

Write compact Markdown with page markers for agent reading:

```bash
pdf2md "/path/to/document.pdf" "/path/to/document.md" --compact --pages
```

Useful variants:

```bash
# Structured result, including Markdown and encoding/layout signals
pdf2md "/path/to/document.pdf" --json

# Plain Markdown on stdout
pdf2md "/path/to/document.pdf" --raw --compact --pages

# A 1-indexed page selection
pdf2md "/path/to/document.pdf" --raw --compact --select-pages 1,3,5-10

# Positioned text items with font and coordinate metadata
pdf2md "/path/to/document.pdf" --items-json

# Password-protected input
pdf2md "/path/to/document.pdf" --json --password 'PASSWORD'
```

Use standard Markdown output when source fidelity matters; add `--compact` when token economy matters. Add `--pages` when citations, review, or later OCR merging needs page boundaries.

Extraction is complete when the command succeeds, expected native-text pages contain non-empty Markdown, `has_encoding_issues` is false in JSON output, and every `pages_needing_ocr` entry is either routed to OCR or reported to the user.

## Handle failures

- Exit code `2` means the PDF requires OCR; use the classification result to choose document-level or page-level OCR.
- `has_encoding_issues: true` means the embedded font mapping is unreliable; route affected content through OCR.
- For an encrypted PDF, obtain the password from the user and pass it with `--password`.
- For a suspicious reading order, run `--analyze --json`, inspect `pages_with_tables` and `pages_with_columns`, then spot-check those pages against the rendered PDF.

# Pop-Up Book Generator Skill

Generate printable pop-up book templates from photos or AI-generated images.

## Prerequisites

```bash
# Install rembg for background removal
pip install rembg[gpu]  # or just: pip install rembg

# Install pdf generation
npm install puppeteer pdf-lib
```

## Usage

### From existing photo
```bash
node popup.js create --image photo.jpg --output page1.pdf
```

### From AI prompt (uses nano-banana-pro)
```bash
node popup.js create --prompt "samoyed dog with birthday cake" --output page1.pdf
```

### Batch mode (multiple pages)
```bash
node popup.js batch --dir ./photos --output birthday-book.pdf
```

## Options

| Option | Description |
|--------|-------------|
| `--image <path>` | Input image path |
| `--prompt <text>` | AI prompt for image generation |
| `--style <type>` | Pop-up style: `v-fold` (default), `box`, `parallel` |
| `--size <format>` | Paper size: `a4` (default), `letter` |
| `--output <path>` | Output PDF path |
| `--no-bg-remove` | Skip background removal |

## Pop-Up Styles

### V-Fold (Default, Easiest)
```
    ┌─────┐
    │ IMG │  ← Your image here
    │  ▲  │
   ─┴──┴──┴─  ← Fold line (valley)
   │       │
   └───────┘  ← Glue tabs
```

### Box/Platform
```
   ┌───────┐
   │ ┌───┐ │  ← Image on front face
   │ │   │ │
   └─┴───┴─┘
```

### Parallel Fold
```
   ═══════════  ← Stays parallel to page
       IMG
```

## Output

PDF includes:
- **Solid lines** = Cut here
- **Dashed lines** = Fold here
- **Gray areas** = Glue tabs
- **Assembly instructions** on last page

## Example Workflow

1. Generate images with prompts:
   ```bash
   node popup.js create --prompt "couple holding hands sunset" --output p1.pdf
   node popup.js create --prompt "birthday cake with candles" --output p2.pdf
   ```

2. Print on cardstock (200-300gsm recommended)

3. Cut along solid lines

4. Fold along dashed lines (valley = fold toward you)

5. Glue tabs to base page

## Integration with nano-banana-pro

Uses the nano-banana-pro skill for AI image generation:
```javascript
const { generate } = require('../nano-banana-pro/generate');
const image = await generate(prompt);
```

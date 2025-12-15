---
name: nano-banana-pro
description: Generate images using Google's Nano Banana Pro model via Replicate
tools: [generate]
---

# Nano Banana Pro Image Generation

Generate and edit images using Google's state-of-the-art Nano Banana Pro model.

## Setup

Set your Replicate API token:
```bash
export REPLICATE_API_TOKEN="your-token-here"
```

Get token at: https://replicate.com/account/api-tokens

## Usage

```bash
# Text to image
./generate "a cat wearing a top hat, photorealistic"

# Image editing (with reference image)
./generate "transform to watercolor painting" ./photo.jpg
./generate "add sunglasses" https://example.com/face.jpg
```

## Output

Prints the URL of the generated image to stdout. Status messages go to stderr.

## Pricing

- 1K/2K: $0.15 per image
- 4K: $0.30 per image

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

## Prompting Best Practices

Nano Banana Pro is a "Thinking" model - it reasons through prompts before generating.

### Stop Using Tag Soups
```
BAD:  dog, park, sunny, 4k, realistic, highly detailed
GOOD: A golden retriever running through a sun-dappled park, captured at eye-level
      with an 85mm lens at f/2.8, soft afternoon light filtering through oak trees
```

### Structured Prompt Format
```
[Subject + Adjectives] doing [Action] in [Location/Context],
[Composition/Camera Angle], [Lighting/Atmosphere], [Style/Media]
```

### 6 Key Factors
1. **Subject** - who/what
2. **Composition** - camera angle, framing (low angle, close-up, wide shot)
3. **Action** - what's happening
4. **Environment** - location with layered details
5. **Lighting** - direction, quality, mood
6. **Style** - aesthetic, era, medium

### Be Technically Precise
- Instead of "zoom" → "85mm lens at f/8"
- Instead of "good lighting" → "three-point lighting with key at 45°"
- Instead of "realistic" → "visible pores, individual fabric threads"
- Instead of "vintage" → "Kodak Portra 400 film grain, 1990s flash photography"

### Special Strengths
- **Text rendering** - pixel-perfect accuracy for long sentences/logos
- **Code visualization** - reads and renders code accurately
- **Character consistency** - use up to 14 reference images
- **Edit don't re-roll** - if 80% correct, ask for specific changes

### Example Prompts
```bash
# Portrait with technical precision
./generate "A woman in her 30s, soft diffused window light from the left,
shot on Sony A7III with 85mm f/1.4 lens, shallow depth of field with
creamy bokeh, visible skin texture, catchlights in eyes"

# Product photography
./generate "Minimalist product shot of a ceramic coffee mug on marble surface,
three-point lighting setup, soft shadows, clean white background,
commercial photography style"

# Maintaining face consistency when editing
./generate "Transform to oil painting style, keep facial features exactly consistent" ./portrait.jpg
```

## Output

Prints the URL of the generated image to stdout. Status messages go to stderr.

## Pricing

- 1K/2K: $0.15 per image
- 4K: $0.30 per image

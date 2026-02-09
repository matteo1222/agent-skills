---
name: kling-video
description: Generate videos using Kling v2.1 via Replicate
tools: [generate]
---

# Kling v2.1 Video Generation

Generate smooth video animations from images using Kling AI.

## Setup

Set your Replicate API token:
```bash
export REPLICATE_API_TOKEN="your-token-here"
```

## Usage

```bash
# Image-to-video (standard mode, 720p)
./generate "cat walks forward gracefully" ./cat.png

# Image-to-image video (pro mode, 1080p) - morphs between two frames
./generate "smooth transition with confetti" ./start.png ./end.png
```

## Prompting Best Practices

### Structure
```
[Camera movement] + [Subject action] + [Environmental details] + [Style reference]
```

### Good Prompts
```bash
# Cinematic character animation
./generate "Soft 3D character smoothly transitions from standing to jumping pose.
Arms raise naturally, expression shifts to joy. Camera holds static with subtle
3% push-in. Warm glow intensifies. Style: Pixar-quality, smooth 24fps" start.png end.png

# Product reveal
./generate "Static camera with slow zoom toward product center. Surface shifts
from matte to glossy with subtle reflections. Soft particles catch backlight.
Shallow depth of field. Style: Apple product reveal aesthetic" locked.png unlocked.png
```

### Key Tips
1. **Camera movement must be motivated** - don't add movement just to be interesting
2. **Be specific about motion** - "glides smoothly" vs "jerks to halt"
3. **Include lighting/mood** - "warm golden hour" or "dramatic side lighting"
4. **Reference styles** - "Pixar quality", "Apple aesthetic", "TV commercial"
5. **Layer details** - foreground, background, lighting separately

### Avoid
- Vague descriptions ("sparkles appear")
- Multiple simultaneous complex actions
- Conflicting style terms ("golden hour" + "studio lighting")

## Output

Prints path to downloaded .mp4 file. Videos are 5 seconds at 24fps.

## Pricing

- Standard (720p): ~$0.25 per video
- Pro (1080p): ~$0.45 per video

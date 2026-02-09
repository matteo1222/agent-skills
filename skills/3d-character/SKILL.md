---
name: 3d-character
description: Generate and animate 3D characters from text or images in under 5 minutes using AI pipeline
tools: [generate]
---

# 3D Character Generator

Generate and animate custom 3D characters using AI — from text prompt to animated 3D model in <5 minutes.

## Pipeline Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Nano Banana Pro │ ──▶ │  Hunyuan3D 3.1  │ ──▶ │     Mixamo      │ ──▶ │ Claude+three.js │
│   (T-pose img)  │     │  (img → 3D)     │     │   (rigging)     │     │   (render)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
      Text/Image              .obj/.fbx            Rigged model           Animated scene
```

## Prerequisites

```bash
# Replicate API token (for Nano Banana Pro & Hunyuan3D)
export REPLICATE_API_TOKEN="your-token"

# Mixamo account (free)
# https://www.mixamo.com/

# Node.js for three.js rendering
npm install three puppeteer
```

## Step 1: Generate T-Pose Image

Use Nano Banana Pro (Google Imagen 3) to generate a character in T-pose:

```bash
# Via Replicate API
curl -s -X POST \
  -H "Authorization: Token $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "google/imagen-3",
    "input": {
      "prompt": "A T-pose character reference sheet of a cute robot warrior, front view, arms extended horizontally, legs slightly apart, white background, full body visible, game character design",
      "aspect_ratio": "1:1"
    }
  }' \
  https://api.replicate.com/v1/predictions
```

**T-Pose Prompt Tips:**
- Always include "T-pose" or "A-pose"
- Specify "front view" or "reference sheet"
- Use "white background" for cleaner extraction
- Include "full body visible"
- Add "arms extended horizontally"

**Example prompts:**
```
"T-pose character sheet of a medieval knight, front view, white background, full body"
"A-pose reference of a cartoon cat character, arms out, game asset style"
"T-pose of a cyberpunk samurai, front facing, clean white background"
```

## Step 2: Convert Image to 3D Model

Use Hunyuan3D 3.1 to convert the T-pose image to a 3D model:

```bash
# Via Replicate
curl -s -X POST \
  -H "Authorization: Token $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "tencent/hunyuan3d-2",
    "input": {
      "image": "https://your-tpose-image-url.jpg",
      "output_format": "glb"
    }
  }' \
  https://api.replicate.com/v1/predictions
```

**Output formats:**
- `.glb` — Binary glTF (recommended, smaller)
- `.obj` — Wavefront OBJ
- `.fbx` — Autodesk FBX (best for Mixamo)

## Step 3: Rig with Mixamo

1. Go to https://www.mixamo.com/ (free Adobe account)
2. Click "Upload Character"
3. Upload your .fbx or .obj file
4. Auto-rigger will detect humanoid structure
5. Adjust bone placements if needed
6. Browse animations library
7. Download rigged model with animation

**Mixamo Settings:**
- Format: FBX Binary
- Skin: With Skin
- Frames per Second: 30
- Keyframe Reduction: none

## Step 4: Render with Three.js

Use Claude to generate three.js code for rendering:

```javascript
// Basic three.js setup for animated character
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// Load model
const loader = new FBXLoader();
loader.load('character.fbx', (fbx) => {
  // Setup animation mixer
  const mixer = new THREE.AnimationMixer(fbx);
  const action = mixer.clipAction(fbx.animations[0]);
  action.play();
  
  scene.add(fbx);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  mixer.update(clock.getDelta());
  renderer.render(scene, camera);
}
animate();
```

## Quick Script

```bash
#!/bin/bash
# 3d-character.sh - Full pipeline

PROMPT="$1"
OUTPUT_DIR="${2:-.}"

echo "🎨 Step 1: Generating T-pose image..."
# Generate with Nano Banana Pro
IMAGE_URL=$(node generate-tpose.js "$PROMPT")

echo "🧊 Step 2: Converting to 3D..."
# Convert with Hunyuan3D
MODEL_URL=$(node image-to-3d.js "$IMAGE_URL")

echo "📥 Step 3: Downloading model..."
curl -sL "$MODEL_URL" -o "$OUTPUT_DIR/character.glb"

echo "✅ Done! Model saved to $OUTPUT_DIR/character.glb"
echo "📌 Step 4: Upload to Mixamo for rigging"
echo "   https://www.mixamo.com/"
```

## From Your Own Photo

Upload your photo and generate a 3D character of yourself:

1. Use a front-facing photo (or take one in T-pose!)
2. Skip Step 1, go directly to Hunyuan3D with your photo
3. Continue with Mixamo rigging

## Resources

- **Nano Banana Pro:** https://replicate.com/google/imagen-3
- **Hunyuan3D 3.1:** https://replicate.com/tencent/hunyuan3d-2
- **Mixamo:** https://www.mixamo.com/
- **Three.js:** https://threejs.org/
- **Original Tweet:** https://x.com/deedydas/status/2009096113853538419

## Cost Estimate

| Step | Service | Cost |
|------|---------|------|
| T-pose generation | Replicate (Imagen 3) | ~$0.15 |
| Image to 3D | Replicate (Hunyuan3D) | ~$0.10-0.30 |
| Rigging | Mixamo | FREE |
| Rendering | Local | FREE |
| **Total** | | **~$0.25-0.45** |


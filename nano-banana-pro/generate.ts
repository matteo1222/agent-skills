#!/usr/bin/env bun

const prompt = process.argv[2];
const imageInput = process.argv[3]; // optional image path or URL

if (!prompt) {
  console.error('Usage: generate.ts <prompt> [image-input]');
  console.error('Example: generate.ts "a cat wearing a hat"');
  console.error('Example: generate.ts "transform to cartoon style" ./photo.jpg');
  process.exit(1);
}

const apiKey = process.env.REPLICATE_API_TOKEN;
if (!apiKey) {
  console.error('Error: REPLICATE_API_TOKEN not set');
  console.error('Get your token at https://replicate.com/account/api-tokens');
  process.exit(1);
}

interface PredictionInput {
  prompt: string;
  resolution?: string;
  aspect_ratio?: string;
  output_format?: string;
  image_input?: string[];
}

interface Prediction {
  id: string;
  status: string;
  output?: string;
  error?: string;
}

async function createPrediction(input: PredictionInput): Promise<Prediction> {
  const res = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: 'b48b194183021abdb3e82f3e7b5686f9fd76e20b1d9360e90bd9e19c2d7c6fa1',
      input,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create prediction: ${err}`);
  }

  return res.json();
}

async function getPrediction(id: string): Promise<Prediction> {
  const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to get prediction: ${res.statusText}`);
  }

  return res.json();
}

async function waitForPrediction(id: string): Promise<Prediction> {
  while (true) {
    const prediction = await getPrediction(id);

    if (prediction.status === 'succeeded') {
      return prediction;
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(prediction.error || `Prediction ${prediction.status}`);
    }

    await new Promise(r => setTimeout(r, 1000));
  }
}

// Build input
const input: PredictionInput = {
  prompt,
  resolution: '2K',
  output_format: 'png',
};

// Handle image input if provided
if (imageInput) {
  if (imageInput.startsWith('http')) {
    input.image_input = [imageInput];
  } else {
    // Read local file and convert to data URI
    const file = Bun.file(imageInput);
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = file.type || 'image/png';
    input.image_input = [`data:${mimeType};base64,${base64}`];
  }
}

async function downloadImage(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download: ${res.statusText}`);

  const buffer = await res.arrayBuffer();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = `/tmp/nano-banana-${timestamp}.png`;

  await Bun.write(outPath, buffer);
  return outPath;
}

try {
  console.error('Creating prediction...');
  const prediction = await createPrediction(input);

  console.error(`Waiting for prediction ${prediction.id}...`);
  const result = await waitForPrediction(prediction.id);

  if (result.output) {
    console.error('Downloading image...');
    const localPath = await downloadImage(result.output);
    console.log(localPath);
  }
} catch (error) {
  console.error('Error:', (error as Error).message);
  process.exit(1);
}

#!/usr/bin/env node

const https = require('https');

const TOKEN = process.env.REPLICATE_API_TOKEN;
const args = process.argv.slice(2);
const command = args[0];

// Helper to make API calls
async function replicate(version, input) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ version, input });
    
    const options = {
      hostname: 'api.replicate.com',
      path: '/v1/predictions',
      method: 'POST',
      headers: {
        'Authorization': `Token ${TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const result = JSON.parse(body);
        resolve(result);
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function generateTpose(prompt) {
  console.error('🎨 Generating T-pose image...');
  
  const fullPrompt = `T-pose character reference sheet of ${prompt}, front view, arms extended horizontally, legs slightly apart, white background, full body visible, game character design style`;
  
  const result = await replicate(
    'f01b3b9332c7b6ca2c6193268faff77052d4a13ed024ee18f85ec577e2b0da69',
    { prompt: fullPrompt, aspect_ratio: '1:1' }
  );
  
  if (result.output) {
    console.error('✅ T-pose generated!');
    console.log(result.output);
    return result.output;
  } else {
    console.error('❌ Error:', result.error || result);
    process.exit(1);
  }
}

async function imageTo3D(imageUrl) {
  console.error('🧊 Converting to 3D model...');
  
  // Using Hunyuan3D
  const result = await replicate(
    'tencent/hunyuan3d-2',
    { image: imageUrl, output_format: 'glb' }
  );
  
  if (result.output) {
    console.error('✅ 3D model created!');
    console.log(result.output);
    return result.output;
  } else {
    console.error('❌ Error:', result.error || result);
    process.exit(1);
  }
}

async function main() {
  if (!TOKEN) {
    console.error('❌ Set REPLICATE_API_TOKEN environment variable');
    process.exit(1);
  }

  if (command === 'tpose') {
    const prompt = args.slice(1).join(' ');
    if (!prompt) {
      console.error('Usage: generate.js tpose <character description>');
      process.exit(1);
    }
    await generateTpose(prompt);
    
  } else if (command === '3d') {
    const imageUrl = args[1];
    if (!imageUrl) {
      console.error('Usage: generate.js 3d <image-url>');
      process.exit(1);
    }
    await imageTo3D(imageUrl);
    
  } else if (command === 'full') {
    const prompt = args.slice(1).join(' ');
    if (!prompt) {
      console.error('Usage: generate.js full <character description>');
      process.exit(1);
    }
    
    // Full pipeline
    const imageUrl = await generateTpose(prompt);
    console.error('');
    const modelUrl = await imageTo3D(imageUrl);
    
    console.error('\n📌 Next steps:');
    console.error('1. Download the .glb file');
    console.error('2. Upload to https://www.mixamo.com/ for rigging');
    console.error('3. Add animations and download');
    console.error('4. Render with three.js');
    
  } else {
    console.log(`
3D Character Generator

Usage:
  node generate.js tpose <description>   Generate T-pose image
  node generate.js 3d <image-url>        Convert image to 3D model
  node generate.js full <description>    Full pipeline (T-pose → 3D)

Examples:
  node generate.js tpose "a cute robot warrior"
  node generate.js 3d "https://example.com/tpose.jpg"
  node generate.js full "medieval knight with sword"

Environment:
  REPLICATE_API_TOKEN  Your Replicate API token
    `);
  }
}

main().catch(console.error);

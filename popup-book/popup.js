#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Parse arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
};
const hasFlag = (name) => args.includes(`--${name}`);

const command = args[0];
const image = getArg('image');
const prompt = getArg('prompt');
const output = getArg('output') || 'popup-page.pdf';
const style = getArg('style') || 'v-fold';
const size = getArg('size') || 'a4';
const noBgRemove = hasFlag('no-bg-remove');

// Paper dimensions (in mm)
const SIZES = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 }
};

// Generate SVG template for V-fold popup
function generateVFoldSVG(imagePath, paperSize) {
  const { width, height } = SIZES[paperSize];
  const centerX = width / 2;
  const centerY = height / 2;
  
  // V-fold dimensions
  const foldWidth = 80;  // mm
  const foldHeight = 100; // mm
  const tabWidth = 10;   // mm for glue tabs
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${width}mm" height="${height}mm" 
     viewBox="0 0 ${width} ${height}">
  
  <!-- Title -->
  <text x="${centerX}" y="15" text-anchor="middle" font-family="Arial" font-size="8" fill="#666">
    Pop-Up Template - V-Fold Style
  </text>
  
  <!-- Instructions -->
  <text x="10" y="25" font-family="Arial" font-size="4" fill="#999">
    ━━ Cut (solid)  ┅┅ Fold (dashed)  ▒ Glue tab
  </text>
  
  <!-- Main V-Fold shape -->
  <g transform="translate(${centerX - foldWidth/2}, ${centerY - foldHeight/2})">
    
    <!-- Cut outline (solid) -->
    <path d="M 0 ${foldHeight}
             L 0 ${tabWidth}
             L ${tabWidth} 0
             L ${foldWidth - tabWidth} 0
             L ${foldWidth} ${tabWidth}
             L ${foldWidth} ${foldHeight}"
          fill="none" stroke="#000" stroke-width="0.5"/>
    
    <!-- Fold line (dashed) - center valley fold -->
    <line x1="0" y1="${foldHeight}" 
          x2="${foldWidth}" y2="${foldHeight}"
          stroke="#000" stroke-width="0.3" stroke-dasharray="2,2"/>
    
    <!-- Center fold line -->
    <line x1="${foldWidth/2}" y1="0" 
          x2="${foldWidth/2}" y2="${foldHeight}"
          stroke="#666" stroke-width="0.3" stroke-dasharray="1,1"/>
    
    <!-- Glue tabs (gray) -->
    <polygon points="0,${tabWidth} ${tabWidth},0 ${tabWidth},${tabWidth}"
             fill="#ddd" stroke="#999" stroke-width="0.3"/>
    <polygon points="${foldWidth},${tabWidth} ${foldWidth - tabWidth},0 ${foldWidth - tabWidth},${tabWidth}"
             fill="#ddd" stroke="#999" stroke-width="0.3"/>
    
    <!-- Image placeholder -->
    <rect x="5" y="10" width="${foldWidth - 10}" height="${foldHeight - 20}"
          fill="#f5f5f5" stroke="#ccc" stroke-width="0.3"/>
    
    ${imagePath ? `
    <!-- Embedded image -->
    <image x="5" y="10" width="${foldWidth - 10}" height="${foldHeight - 20}"
           href="${imagePath}" preserveAspectRatio="xMidYMid meet"/>
    ` : `
    <text x="${foldWidth/2}" y="${foldHeight/2}" text-anchor="middle" 
          font-family="Arial" font-size="6" fill="#999">
      [Your Image Here]
    </text>
    `}
    
  </g>
  
  <!-- Base page outline (for reference) -->
  <rect x="${centerX - foldWidth/2 - 20}" y="${centerY + foldHeight/2 + 5}"
        width="${foldWidth + 40}" height="60"
        fill="none" stroke="#ccc" stroke-width="0.3" stroke-dasharray="3,3"/>
  <text x="${centerX}" y="${centerY + foldHeight/2 + 35}" 
        text-anchor="middle" font-family="Arial" font-size="4" fill="#999">
    Base page (glue tabs attach here)
  </text>
  
  <!-- Assembly instructions -->
  <g transform="translate(10, ${height - 50})">
    <text font-family="Arial" font-size="4" fill="#666">
      <tspan x="0" dy="0">Assembly Instructions:</tspan>
      <tspan x="0" dy="6">1. Cut along solid lines</tspan>
      <tspan x="0" dy="5">2. Fold along center dashed line (mountain fold)</tspan>
      <tspan x="0" dy="5">3. Fold along bottom dashed line (valley fold)</tspan>
      <tspan x="0" dy="5">4. Apply glue to gray tabs</tspan>
      <tspan x="0" dy="5">5. Attach to base page at the fold line</tspan>
      <tspan x="0" dy="5">6. When page opens to 90°, image pops up!</tspan>
    </text>
  </g>
  
</svg>`;
}

// Remove background using rembg
async function removeBackground(inputPath) {
  const outputPath = inputPath.replace(/\.[^.]+$/, '-nobg.png');
  
  console.log('🎨 Removing background...');
  try {
    execSync(`/home/matthewlutw/.local/bin/rembg i "${inputPath}" "${outputPath}"`, { stdio: 'pipe' });
    console.log('✅ Background removed');
    return outputPath;
  } catch (e) {
    console.log('⚠️  rembg not available, using original image');
    return inputPath;
  }
}

// Generate image using nano-banana-pro
async function generateImage(prompt) {
  console.log('🖼️  Generating image with AI...');
  
  const outputPath = `/tmp/popup-generated-${Date.now()}.webp`;
  
  try {
    // Use the nano-banana-pro skill
    const skillPath = path.join(__dirname, '..', '..', '.clawdbot', 'skills', 'nano-banana-pro');
    const result = execSync(
      `node ${skillPath}/generate.js "${prompt}" --output "${outputPath}"`,
      { stdio: 'pipe', encoding: 'utf8' }
    );
    console.log('✅ Image generated');
    return outputPath;
  } catch (e) {
    // Fallback: try replicate CLI directly
    try {
      execSync(
        `replicate run google/image-fx --input prompt="${prompt}" > "${outputPath}"`,
        { stdio: 'pipe' }
      );
      return outputPath;
    } catch (e2) {
      console.error('❌ Failed to generate image. Please provide --image instead.');
      process.exit(1);
    }
  }
}

// Convert SVG to PDF using puppeteer
async function svgToPDF(svgContent, outputPath) {
  console.log('📄 Converting to PDF...');
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; }
        svg { width: 100%; height: 100%; }
      </style>
    </head>
    <body>${svgContent}</body>
    </html>
  `;
  
  const htmlPath = `/tmp/popup-${Date.now()}.html`;
  fs.writeFileSync(htmlPath, htmlContent);
  
  try {
    // Try using puppeteer
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true
    });
    await browser.close();
    console.log(`✅ PDF saved: ${outputPath}`);
  } catch (e) {
    // Fallback: just save the SVG
    const svgPath = outputPath.replace('.pdf', '.svg');
    fs.writeFileSync(svgPath, svgContent);
    console.log(`✅ SVG saved: ${svgPath}`);
    console.log('   (Install puppeteer for PDF output: npm install puppeteer)');
  }
  
  // Cleanup
  fs.unlinkSync(htmlPath);
}

// Convert image to base64 data URI
function imageToDataURI(imagePath) {
  const ext = path.extname(imagePath).slice(1);
  const mimeType = ext === 'png' ? 'image/png' : 
                   ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const data = fs.readFileSync(imagePath);
  return `data:${mimeType};base64,${data.toString('base64')}`;
}

// Main
async function main() {
  if (command === 'create') {
    let imagePath = image;
    
    // Generate image if prompt provided
    if (prompt && !image) {
      imagePath = await generateImage(prompt);
    }
    
    // Remove background
    if (imagePath && !noBgRemove) {
      imagePath = await removeBackground(imagePath);
    }
    
    // Convert to data URI for embedding
    let imageDataURI = null;
    if (imagePath && fs.existsSync(imagePath)) {
      imageDataURI = imageToDataURI(imagePath);
    }
    
    // Generate SVG
    console.log('📐 Generating template...');
    const svg = generateVFoldSVG(imageDataURI, size);
    
    // Convert to PDF
    await svgToPDF(svg, output);
    
  } else if (command === 'batch') {
    const dir = getArg('dir');
    if (!dir) {
      console.error('❌ Please specify --dir');
      process.exit(1);
    }
    
    const files = fs.readdirSync(dir)
      .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    
    console.log(`📚 Processing ${files.length} images...`);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`\n[${i + 1}/${files.length}] ${file}`);
      
      const imgPath = path.join(dir, file);
      const outPath = output.replace('.pdf', `-${i + 1}.pdf`);
      
      // Process each image
      const processed = noBgRemove ? imgPath : await removeBackground(imgPath);
      const dataURI = imageToDataURI(processed);
      const svg = generateVFoldSVG(dataURI, size);
      await svgToPDF(svg, outPath);
    }
    
    console.log(`\n✅ Created ${files.length} pages!`);
    
  } else {
    console.log(`
Pop-Up Book Generator

Usage:
  node popup.js create --image <path> [--output <pdf>]
  node popup.js create --prompt "description" [--output <pdf>]
  node popup.js batch --dir <folder> --output <pdf>

Options:
  --image <path>     Input image
  --prompt <text>    AI prompt for image generation
  --output <path>    Output PDF (default: popup-page.pdf)
  --style <type>     v-fold (default), box, parallel
  --size <format>    a4 (default), letter
  --no-bg-remove     Skip background removal

Examples:
  node popup.js create --image photo.jpg
  node popup.js create --prompt "samoyed dog birthday" --output page1.pdf
  node popup.js batch --dir ./photos --output book.pdf
    `);
  }
}

main().catch(console.error);

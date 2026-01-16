#!/usr/bin/env node

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Parse arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
};

const url = getArg('url');
const file = getArg('file');
const lang = getArg('lang') || 'en';
const mode = getArg('mode') || 'concepts';
const output = getArg('output') || `anki-cards-${Date.now()}.txt`;

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Step 1: Download audio
async function downloadAudio(sourceUrl) {
  console.log('📥 Downloading audio...');
  
  const outputFile = `/tmp/podcast-${Date.now()}.mp3`;
  
  if (sourceUrl.includes('youtube.com') || sourceUrl.includes('youtu.be')) {
    execSync(`yt-dlp -x --audio-format mp3 -o "${outputFile}" "${sourceUrl}"`, { stdio: 'inherit' });
  } else if (sourceUrl.includes('spotify.com')) {
    execSync(`spotdl "${sourceUrl}" -o "${outputFile}"`, { stdio: 'inherit' });
  } else {
    // Direct download
    execSync(`curl -L "${sourceUrl}" -o "${outputFile}"`, { stdio: 'inherit' });
  }
  
  return outputFile;
}

// Step 2: Transcribe with Groq Whisper
async function transcribe(audioPath, language) {
  console.log('🎤 Transcribing with Whisper...');
  
  if (!GROQ_API_KEY) {
    console.error('❌ Set GROQ_API_KEY environment variable');
    console.log('   Get key at: https://console.groq.com/');
    process.exit(1);
  }
  
  // Use the transcribe skill if available
  const transcribeSkill = '/home/matthewlutw/.clawdbot/skills/transcribe';
  if (fs.existsSync(transcribeSkill)) {
    const result = execSync(
      `node ${transcribeSkill}/transcribe.js "${audioPath}"`,
      { encoding: 'utf8' }
    );
    return result;
  }
  
  // Fallback: Direct Groq API call
  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', fs.createReadStream(audioPath));
  form.append('model', 'whisper-large-v3');
  form.append('language', language);
  
  // ... API call implementation
  console.log('⚠️ Using transcribe skill is recommended');
  return '';
}

// Step 3: Generate Anki cards with Claude
async function generateCards(transcript, cardMode, language) {
  console.log('🃏 Generating Anki cards...');
  
  const prompts = {
    concepts: `Analyze this transcript and create Anki flashcards for the key concepts.
For each important concept, create a card with:
- Front: A clear question about the concept
- Back: A concise answer (2-3 sentences max)

Focus on:
- Main ideas and theories
- Definitions of technical terms
- Cause-effect relationships
- Key facts and statistics

Format as tab-separated:
Question<TAB>Answer

Transcript:
${transcript}`,

    vocab: `Extract vocabulary from this transcript and create Anki flashcards.
For each important term:
- Front: The term
- Back: Definition + context from the transcript

Format as tab-separated:
Term<TAB>Definition: ... | Context: "..."

Transcript:
${transcript}`,

    japanese: `This is a Japanese transcript. Create Anki cards for Japanese learners.

Create two types of cards:

1. Sentence cards (for grammar & comprehension):
Front: [Japanese sentence]
Back: Reading: [with furigana] | Meaning: [English] | Grammar: [key point]

2. Vocabulary cards:
Front: [word in kanji]
Back: 読み: [hiragana] | 意味: [English meaning] | 例文: [example]

Focus on:
- N3-N1 level vocabulary
- Useful expressions
- Grammar patterns

Format as tab-separated. 
Transcript:
${transcript}`,

    qa: `Create question-answer Anki cards from this transcript.
Generate diverse questions:
- What/Why/How questions
- True/False (answer explains why)
- Fill in the blank

Format as tab-separated:
Question<TAB>Answer

Transcript:
${transcript}`
  };

  const prompt = prompts[cardMode] || prompts.concepts;
  
  // Call Claude API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();
  return data.content[0].text;
}

// Step 4: Export cards
function exportCards(cards, outputPath) {
  console.log(`💾 Saving to ${outputPath}...`);
  fs.writeFileSync(outputPath, cards);
  console.log(`✅ Created ${cards.split('\n').length} cards!`);
}

// Main
async function main() {
  if (!url && !file) {
    console.log(`
Podcast to Anki - Convert podcasts into flashcards

Usage:
  node podcast-anki.js --url <podcast-url> [options]
  node podcast-anki.js --file <audio-file> [options]

Options:
  --url <url>      Podcast URL (YouTube, Spotify, direct link)
  --file <path>    Local audio file
  --lang <code>    Language code (en, ja, zh, etc.) [default: en]
  --mode <type>    Card type: concepts, vocab, japanese, qa [default: concepts]
  --output <path>  Output file path [default: anki-cards-<timestamp>.txt]

Examples:
  node podcast-anki.js --url "https://youtube.com/watch?v=xxx" --mode concepts
  node podcast-anki.js --file "japanese-podcast.mp3" --lang ja --mode japanese
  node podcast-anki.js --url "https://spotify.com/episode/xxx" --mode vocab

Environment:
  GROQ_API_KEY       Groq API key for Whisper transcription
  ANTHROPIC_API_KEY  Anthropic API key for card generation
    `);
    return;
  }

  try {
    // Get audio file
    let audioPath = file;
    if (url) {
      audioPath = await downloadAudio(url);
    }

    // Transcribe
    const transcript = await transcribe(audioPath, lang);
    
    // Save transcript
    const transcriptPath = output.replace(/\.[^.]+$/, '-transcript.txt');
    fs.writeFileSync(transcriptPath, transcript);
    console.log(`📝 Transcript saved to ${transcriptPath}`);

    // Generate cards
    const cards = await generateCards(transcript, mode, lang);

    // Export
    exportCards(cards, output);

    console.log(`
✅ Done!

Files created:
  📝 ${transcriptPath} (transcript)
  🃏 ${output} (Anki cards)

To import into Anki:
  1. Open Anki
  2. File → Import
  3. Select ${output}
  4. Set field separator to Tab
  5. Import!
    `);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

#!/usr/bin/env node
// Parse Claude Code sessions and extract meaningful content for indexing
// Usage: node parse-sessions.js [source_dir] [output_dir]

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = process.argv[2] || path.join(process.env.HOME, '.claude/projects');
const OUTPUT_DIR = process.argv[3] || path.join(process.env.HOME, '.cache/claude-sessions-md');

function findJsonlFiles(dir, files = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            findJsonlFiles(fullPath, files);
        } else if (entry.name.endsWith('.jsonl')) {
            files.push(fullPath);
        }
    }
    return files;
}

function parseSession(jsonlPath) {
    const content = fs.readFileSync(jsonlPath, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l);

    let meta = {};
    let summary = '';
    const messages = [];

    for (const line of lines) {
        let entry;
        try {
            entry = JSON.parse(line);
        } catch {
            continue;
        }

        // Extract summary
        if (entry.type === 'summary' && entry.summary) {
            summary = entry.summary;
        }

        // Extract user messages (string content, not tool results, not meta)
        if (entry.type === 'user' &&
            typeof entry.message?.content === 'string' &&
            !entry.isMeta) {

            // Get metadata from first user message
            if (!meta.sessionId) {
                meta = {
                    sessionId: entry.sessionId,
                    cwd: entry.cwd,
                    gitBranch: entry.gitBranch,
                    timestamp: entry.timestamp
                };
            }

            // Skip system-reminder and command messages
            const content = entry.message.content;
            if (content.includes('<system-reminder>') ||
                content.includes('<command-name>') ||
                content.startsWith('Caveat:')) {
                continue;
            }

            messages.push({ role: 'user', content });
        }

        // Extract assistant text and thinking
        if (entry.type === 'assistant' && Array.isArray(entry.message?.content)) {
            const parts = [];

            for (const c of entry.message.content) {
                if (c.type === 'text' && c.text) {
                    parts.push(c.text);
                } else if (c.type === 'thinking' && c.thinking) {
                    parts.push(`<thinking>\n${c.thinking}\n</thinking>`);
                }
            }

            if (parts.length > 0) {
                messages.push({ role: 'assistant', content: parts.join('\n\n') });
            }
        }
    }

    return { meta, summary, messages };
}

function formatMarkdown({ meta, summary, messages }) {
    const lines = [];

    // Header
    lines.push(`# Session: ${meta.sessionId || 'unknown'}`);
    lines.push(`**Project:** ${meta.cwd || 'unknown'}`);
    if (meta.gitBranch) lines.push(`**Branch:** ${meta.gitBranch}`);
    if (meta.timestamp) lines.push(`**Date:** ${meta.timestamp.split('T')[0]}`);
    lines.push('');

    // Summary
    if (summary) {
        lines.push(`## Summary`);
        lines.push(summary);
        lines.push('');
    }

    lines.push('---');
    lines.push('');

    // Messages
    for (const msg of messages) {
        lines.push(`### ${msg.role === 'user' ? 'User' : 'Assistant'}`);
        lines.push(msg.content);
        lines.push('');
    }

    return lines.join('\n');
}

// Main
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const jsonlFiles = findJsonlFiles(SOURCE_DIR);
let parsed = 0;
let skipped = 0;

for (const jsonlPath of jsonlFiles) {
    const relPath = path.relative(SOURCE_DIR, jsonlPath);
    const outputPath = path.join(OUTPUT_DIR, relPath.replace(/\.jsonl$/, '.md'));
    const outputDir = path.dirname(outputPath);

    // Skip if output is newer
    if (fs.existsSync(outputPath)) {
        const srcStat = fs.statSync(jsonlPath);
        const outStat = fs.statSync(outputPath);
        if (outStat.mtime > srcStat.mtime) {
            skipped++;
            continue;
        }
    }

    const session = parseSession(jsonlPath);

    // Skip empty sessions
    if (session.messages.length === 0) {
        continue;
    }

    fs.mkdirSync(outputDir, { recursive: true });
    const markdown = formatMarkdown(session);
    fs.writeFileSync(outputPath, markdown);
    parsed++;
}

console.log(`Parsed: ${parsed}, Skipped: ${skipped}, Total: ${jsonlFiles.length}`);
console.log(`Output: ${OUTPUT_DIR}`);

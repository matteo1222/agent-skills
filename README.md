# pi-skills

A collection of skills for [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent), compatible with Claude Code, Codex CLI, Amp, and Droid.

## Installation

### pi-coding-agent

```bash
# User-level (available in all projects)
git clone https://github.com/badlogic/pi-skills ~/.pi/agent/skills/pi-skills

# Or project-level
git clone https://github.com/badlogic/pi-skills .pi/skills/pi-skills
```

### Codex CLI

```bash
git clone https://github.com/badlogic/pi-skills ~/.codex/skills/pi-skills
```

### Amp

Amp finds skills recursively in toolboxes:

```bash
git clone https://github.com/badlogic/pi-skills ~/.config/amp/tools/pi-skills
```

### Droid (Factory)

```bash
# User-level
git clone https://github.com/badlogic/pi-skills ~/.factory/skills/pi-skills

# Or project-level
git clone https://github.com/badlogic/pi-skills .factory/skills/pi-skills
```

### Claude Code

Claude Code only looks one level deep for `SKILL.md` files, so each skill folder must be directly under the skills directory. Clone the repo somewhere, then symlink individual skills:

```bash
# Clone to a convenient location
git clone https://github.com/badlogic/pi-skills ~/pi-skills

# Symlink individual skills (user-level)
mkdir -p ~/.claude/skills
ln -s ~/pi-skills/brave-search ~/.claude/skills/brave-search
ln -s ~/pi-skills/browser-tools ~/.claude/skills/browser-tools
ln -s ~/pi-skills/gccli ~/.claude/skills/gccli
ln -s ~/pi-skills/gdcli ~/.claude/skills/gdcli
ln -s ~/pi-skills/gmcli ~/.claude/skills/gmcli
ln -s ~/pi-skills/transcribe ~/.claude/skills/transcribe
ln -s ~/pi-skills/vscode ~/.claude/skills/vscode
ln -s ~/pi-skills/youtube-transcript ~/.claude/skills/youtube-transcript
ln -s ~/pi-skills/nano-banana-pro ~/.claude/skills/nano-banana-pro
ln -s ~/pi-skills/twitter-tools ~/.claude/skills/twitter-tools
ln -s ~/pi-skills/create-cli ~/.claude/skills/create-cli
ln -s ~/pi-skills/delightful-ui ~/.claude/skills/delightful-ui

# Or project-level
mkdir -p .claude/skills
ln -s ~/pi-skills/brave-search .claude/skills/brave-search
ln -s ~/pi-skills/browser-tools .claude/skills/browser-tools
ln -s ~/pi-skills/gccli .claude/skills/gccli
ln -s ~/pi-skills/gdcli .claude/skills/gdcli
ln -s ~/pi-skills/gmcli .claude/skills/gmcli
ln -s ~/pi-skills/transcribe .claude/skills/transcribe
ln -s ~/pi-skills/vscode .claude/skills/vscode
ln -s ~/pi-skills/youtube-transcript .claude/skills/youtube-transcript
ln -s ~/pi-skills/nano-banana-pro .claude/skills/nano-banana-pro
ln -s ~/pi-skills/twitter-tools .claude/skills/twitter-tools
ln -s ~/pi-skills/create-cli .claude/skills/create-cli
ln -s ~/pi-skills/delightful-ui .claude/skills/delightful-ui
```

## Available Skills

| Skill | Description |
|-------|-------------|
| [brave-search](brave-search/SKILL.md) | Web search and content extraction via Brave Search |
| [browser-tools](browser-tools/SKILL.md) | Interactive browser automation via Chrome DevTools Protocol |
| [gccli](gccli/SKILL.md) | Google Calendar CLI for events and availability |
| [gdcli](gdcli/SKILL.md) | Google Drive CLI for file management and sharing |
| [gmcli](gmcli/SKILL.md) | Gmail CLI for email, drafts, and labels |
| [transcribe](transcribe/SKILL.md) | Speech-to-text transcription via Groq Whisper API |
| [vscode](vscode/SKILL.md) | VS Code integration for diffs and file comparison |
| [youtube-transcript](youtube-transcript/SKILL.md) | Fetch YouTube video transcripts |
| [nano-banana-pro](nano-banana-pro/SKILL.md) | Generate images using Google's Nano Banana Pro via Replicate |
| [twitter-tools](twitter-tools/SKILL.md) | Fetch tweets and download Twitter/X videos (no API key) |
| [create-cli](create-cli/SKILL.md) | Design CLI parameters and UX (from [steipete/agent-scripts](https://github.com/steipete/agent-scripts)) |
| [delightful-ui](delightful-ui/SKILL.md) | Add micro-animations, haptics, and polish to make apps stand out |

## Skill Format

Each skill follows the pi/Claude Code format:

```markdown
---
name: skill-name
description: Short description shown to agent
---

# Instructions

Detailed instructions here...
Helper files available at: {baseDir}/
```

The `{baseDir}` placeholder is replaced with the skill's directory path at runtime.

## Requirements

Some skills require additional setup. Generally, the agent will walk you through that. But if not, here you go:

- **brave-search**: Requires Node.js. Run `npm install` in the skill directory.
- **browser-tools**: Requires Chrome and Node.js. Run `npm install` in the skill directory.
- **gccli**: Requires Node.js. Install globally with `npm install -g @mariozechner/gccli`.
- **gdcli**: Requires Node.js. Install globally with `npm install -g @mariozechner/gdcli`.
- **gmcli**: Requires Node.js. Install globally with `npm install -g @mariozechner/gmcli`.
- **transcribe**: Requires curl and a Groq API key.
- **vscode**: Requires VS Code with `code` CLI in PATH.
- **youtube-transcript**: Requires Node.js. Run `npm install` in the skill directory.
- **nano-banana-pro**: Standalone binary. Requires `REPLICATE_API_TOKEN` env var.
- **twitter-tools**: Requires Node.js. Run `npm install` in the skill directory.
- **create-cli**: No dependencies (documentation-only skill).
- **delightful-ui**: No dependencies (documentation/patterns skill).

## License

MIT

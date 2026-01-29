# agent-skills

A collection of skills for [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent), compatible with Claude Code, Codex CLI, Amp, and Droid.

> **Attribution:** Forked from [badlogic/pi-skills](https://github.com/badlogic/pi-skills)

## Installation

### pi-coding-agent

```bash
# User-level (available in all projects)
git clone https://github.com/matteo1222/agent-skills ~/.pi/agent/skills/agent-skills

# Or project-level
git clone https://github.com/matteo1222/agent-skills .pi/skills/agent-skills
```

### Codex CLI

```bash
git clone https://github.com/matteo1222/agent-skills ~/.codex/skills/agent-skills
```

### Amp

Amp finds skills recursively in toolboxes:

```bash
git clone https://github.com/matteo1222/agent-skills ~/.config/amp/tools/agent-skills
```

### Droid (Factory)

```bash
# User-level
git clone https://github.com/matteo1222/agent-skills ~/.factory/skills/agent-skills

# Or project-level
git clone https://github.com/matteo1222/agent-skills .factory/skills/agent-skills
```

### Claude Code

Claude Code only looks one level deep for `SKILL.md` files, so each skill folder must be directly under the skills directory. Clone the repo somewhere, then symlink individual skills:

```bash
# Clone to a convenient location
git clone https://github.com/matteo1222/agent-skills ~/agent-skills

# Symlink individual skills (user-level)
mkdir -p ~/.claude/skills
ln -s ~/agent-skills/brave-search ~/.claude/skills/brave-search
ln -s ~/agent-skills/browser-tools ~/.claude/skills/browser-tools
ln -s ~/agent-skills/gccli ~/.claude/skills/gccli
ln -s ~/agent-skills/gdcli ~/.claude/skills/gdcli
ln -s ~/agent-skills/gmcli ~/.claude/skills/gmcli
ln -s ~/agent-skills/transcribe ~/.claude/skills/transcribe
ln -s ~/agent-skills/vscode ~/.claude/skills/vscode
ln -s ~/agent-skills/youtube-transcript ~/.claude/skills/youtube-transcript
ln -s ~/agent-skills/nano-banana-pro ~/.claude/skills/nano-banana-pro
ln -s ~/agent-skills/twitter-tools ~/.claude/skills/twitter-tools
ln -s ~/agent-skills/create-cli ~/.claude/skills/create-cli
ln -s ~/agent-skills/app-polish ~/.claude/skills/app-polish
ln -s ~/agent-skills/context-efficient ~/.claude/skills/context-efficient
ln -s ~/agent-skills/agent-browser ~/.claude/skills/agent-browser
ln -s ~/agent-skills/trellocli ~/.claude/skills/trellocli
ln -s ~/agent-skills/sec-context ~/.claude/skills/sec-context
ln -s ~/agent-skills/fly-logs ~/.claude/skills/fly-logs
ln -s ~/agent-skills/search-past-sessions ~/.claude/skills/search-past-sessions

# Or project-level
mkdir -p .claude/skills
ln -s ~/agent-skills/brave-search .claude/skills/brave-search
ln -s ~/agent-skills/browser-tools .claude/skills/browser-tools
ln -s ~/agent-skills/gccli .claude/skills/gccli
ln -s ~/agent-skills/gdcli .claude/skills/gdcli
ln -s ~/agent-skills/gmcli .claude/skills/gmcli
ln -s ~/agent-skills/transcribe .claude/skills/transcribe
ln -s ~/agent-skills/vscode .claude/skills/vscode
ln -s ~/agent-skills/youtube-transcript .claude/skills/youtube-transcript
ln -s ~/agent-skills/nano-banana-pro .claude/skills/nano-banana-pro
ln -s ~/agent-skills/twitter-tools .claude/skills/twitter-tools
ln -s ~/agent-skills/create-cli .claude/skills/create-cli
ln -s ~/agent-skills/app-polish .claude/skills/app-polish
ln -s ~/agent-skills/context-efficient .claude/skills/context-efficient
ln -s ~/agent-skills/agent-browser .claude/skills/agent-browser
ln -s ~/agent-skills/trellocli .claude/skills/trellocli
ln -s ~/agent-skills/sec-context .claude/skills/sec-context
ln -s ~/agent-skills/fly-logs .claude/skills/fly-logs
ln -s ~/agent-skills/search-past-sessions .claude/skills/search-past-sessions
```

**Optional: UI/UX Pro Max skill**

For UI/UX design assistance (styles, colors, fonts, charts, UX guidelines):

```bash
npm install -g uipro-cli
uipro init --ai claude
```

Requires Python 3.x. [More info](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)

## Available Skills

| Skill | Description |
|-------|-------------|
| [agent-browser](agent-browser/SKILL.md) | Headless browser automation CLI optimized for AI agents |
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
| [app-polish](app-polish/SKILL.md) | Add micro-animations, haptics, and polish to make apps stand out |
| [context-efficient](context-efficient/SKILL.md) | Context-efficient backpressure patterns for AI agents running tests, builds, and linting |
| [trellocli](trellocli/SKILL.md) | Trello CLI for managing boards, lists, cards, and downloading attachments for AI image analysis |
| [sec-context](sec-context/SKILL.md) | Security anti-patterns reference for AI-generated code (25+ vulnerabilities with BAD/GOOD examples) |
| [fly-logs](fly-logs/SKILL.md) | Stream and search Fly.io application logs with filtering |
| [search-past-sessions](search-past-sessions/SKILL.md) | Search and retrieve past Claude Code conversations using qmd |

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

- **agent-browser**: Requires Node.js. Install globally with `npm install -g agent-browser && agent-browser install`.
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
- **app-polish**: No dependencies (documentation/patterns skill).
- **context-efficient**: No dependencies (bash utilities included).
- **trellocli**: Requires Node.js. Run `npm link` in the skill directory. Needs Trello API key and token.
- **sec-context**: No dependencies (documentation/reference skill).
- **fly-logs**: Requires `flyctl` CLI (`brew install flyctl`).
- **search-past-sessions**: Requires Node.js and [qmd](https://github.com/badlogic/qmd) CLI for indexing/search.

## License

MIT

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
ln -s ~/agent-skills/skills/brave-search ~/.claude/skills/brave-search
ln -s ~/agent-skills/skills/browser-tools ~/.claude/skills/browser-tools
ln -s ~/agent-skills/skills/gccli ~/.claude/skills/gccli
ln -s ~/agent-skills/skills/gdcli ~/.claude/skills/gdcli
ln -s ~/agent-skills/skills/gmcli ~/.claude/skills/gmcli
ln -s ~/agent-skills/skills/transcribe ~/.claude/skills/transcribe
ln -s ~/agent-skills/skills/vscode ~/.claude/skills/vscode
ln -s ~/agent-skills/skills/youtube-transcript ~/.claude/skills/youtube-transcript
ln -s ~/agent-skills/skills/nano-banana-pro ~/.claude/skills/nano-banana-pro
ln -s ~/agent-skills/skills/twitter-tools ~/.claude/skills/twitter-tools
ln -s ~/agent-skills/skills/create-cli ~/.claude/skills/create-cli
ln -s ~/agent-skills/skills/app-polish ~/.claude/skills/app-polish
ln -s ~/agent-skills/skills/context-efficient ~/.claude/skills/context-efficient
ln -s ~/agent-skills/skills/agent-browser ~/.claude/skills/agent-browser
ln -s ~/agent-skills/skills/trellocli ~/.claude/skills/trellocli
ln -s ~/agent-skills/skills/sec-context ~/.claude/skills/sec-context
ln -s ~/agent-skills/skills/fly-logs ~/.claude/skills/fly-logs
ln -s ~/agent-skills/skills/search-past-sessions ~/.claude/skills/search-past-sessions
ln -s ~/agent-skills/skills/logging-best-practices ~/.claude/skills/logging-best-practices
ln -s ~/agent-skills/skills/systematic-debugging ~/.claude/skills/systematic-debugging
ln -s ~/agent-skills/skills/test-driven-development ~/.claude/skills/test-driven-development
ln -s ~/agent-skills/skills/agent-device ~/.claude/skills/agent-device
ln -s ~/agent-skills/skills/dogfood-device ~/.claude/skills/dogfood-device
ln -s ~/agent-skills/skills/showboat-walkthrough ~/.claude/skills/showboat-walkthrough
ln -s ~/agent-skills/skills/ghidra ~/.claude/skills/ghidra
ln -s ~/agent-skills/skills/sentry ~/.claude/skills/sentry
ln -s ~/agent-skills/skills/summarize ~/.claude/skills/summarize
ln -s ~/agent-skills/skills/tmux ~/.claude/skills/tmux
ln -s ~/agent-skills/skills/visual-explainer ~/.claude/skills/visual-explainer
ln -s ~/agent-skills/skills/triad ~/.claude/skills/triad
ln -s ~/agent-skills/skills/triad-review ~/.claude/skills/triad-review
ln -s ~/agent-skills/skills/trycycle ~/.claude/skills/trycycle
ln -s ~/agent-skills/skills/babysit-pr ~/.claude/skills/babysit-pr
ln -s ~/agent-skills/skills/design-an-interface ~/.claude/skills/design-an-interface
ln -s ~/agent-skills/skills/edit-article ~/.claude/skills/edit-article
ln -s ~/agent-skills/skills/git-guardrails-claude-code ~/.claude/skills/git-guardrails-claude-code
ln -s ~/agent-skills/skills/grill-me ~/.claude/skills/grill-me
ln -s ~/agent-skills/skills/improve-codebase-architecture ~/.claude/skills/improve-codebase-architecture
ln -s ~/agent-skills/skills/migrate-to-shoehorn ~/.claude/skills/migrate-to-shoehorn
ln -s ~/agent-skills/skills/obsidian-vault ~/.claude/skills/obsidian-vault
ln -s ~/agent-skills/skills/prd-to-issues ~/.claude/skills/prd-to-issues
ln -s ~/agent-skills/skills/prd-to-plan ~/.claude/skills/prd-to-plan
ln -s ~/agent-skills/skills/qa ~/.claude/skills/qa
ln -s ~/agent-skills/skills/request-refactor-plan ~/.claude/skills/request-refactor-plan
ln -s ~/agent-skills/skills/scaffold-exercises ~/.claude/skills/scaffold-exercises
ln -s ~/agent-skills/skills/setup-pre-commit ~/.claude/skills/setup-pre-commit
ln -s ~/agent-skills/skills/tdd ~/.claude/skills/tdd
ln -s ~/agent-skills/skills/triage-issue ~/.claude/skills/triage-issue
ln -s ~/agent-skills/skills/ubiquitous-language ~/.claude/skills/ubiquitous-language
ln -s ~/agent-skills/skills/write-a-prd ~/.claude/skills/write-a-prd
ln -s ~/agent-skills/skills/write-a-skill ~/.claude/skills/write-a-skill
ln -s ~/agent-skills/skills/no-use-effect ~/.claude/skills/no-use-effect
ln -s ~/agent-skills/skills/harness-engineering ~/.claude/skills/harness-engineering
ln -s ~/agent-skills/skills/frontend-slides ~/.claude/skills/frontend-slides

# Or project-level
mkdir -p .claude/skills
ln -s ~/agent-skills/skills/brave-search .claude/skills/brave-search
ln -s ~/agent-skills/skills/browser-tools .claude/skills/browser-tools
ln -s ~/agent-skills/skills/gccli .claude/skills/gccli
ln -s ~/agent-skills/skills/gdcli .claude/skills/gdcli
ln -s ~/agent-skills/skills/gmcli .claude/skills/gmcli
ln -s ~/agent-skills/skills/transcribe .claude/skills/transcribe
ln -s ~/agent-skills/skills/vscode .claude/skills/vscode
ln -s ~/agent-skills/skills/youtube-transcript .claude/skills/youtube-transcript
ln -s ~/agent-skills/skills/nano-banana-pro .claude/skills/nano-banana-pro
ln -s ~/agent-skills/skills/twitter-tools .claude/skills/twitter-tools
ln -s ~/agent-skills/skills/create-cli .claude/skills/create-cli
ln -s ~/agent-skills/skills/app-polish .claude/skills/app-polish
ln -s ~/agent-skills/skills/context-efficient .claude/skills/context-efficient
ln -s ~/agent-skills/skills/agent-browser .claude/skills/agent-browser
ln -s ~/agent-skills/skills/trellocli .claude/skills/trellocli
ln -s ~/agent-skills/skills/sec-context .claude/skills/sec-context
ln -s ~/agent-skills/skills/fly-logs .claude/skills/fly-logs
ln -s ~/agent-skills/skills/search-past-sessions .claude/skills/search-past-sessions
ln -s ~/agent-skills/skills/logging-best-practices .claude/skills/logging-best-practices
ln -s ~/agent-skills/skills/systematic-debugging .claude/skills/systematic-debugging
ln -s ~/agent-skills/skills/test-driven-development .claude/skills/test-driven-development
ln -s ~/agent-skills/skills/agent-device .claude/skills/agent-device
ln -s ~/agent-skills/skills/dogfood-device .claude/skills/dogfood-device
ln -s ~/agent-skills/skills/showboat-walkthrough .claude/skills/showboat-walkthrough
ln -s ~/agent-skills/skills/ghidra .claude/skills/ghidra
ln -s ~/agent-skills/skills/sentry .claude/skills/sentry
ln -s ~/agent-skills/skills/summarize .claude/skills/summarize
ln -s ~/agent-skills/skills/tmux .claude/skills/tmux
ln -s ~/agent-skills/skills/visual-explainer .claude/skills/visual-explainer
ln -s ~/agent-skills/skills/triad .claude/skills/triad
ln -s ~/agent-skills/skills/triad-review .claude/skills/triad-review
ln -s ~/agent-skills/skills/trycycle .claude/skills/trycycle
ln -s ~/agent-skills/skills/babysit-pr .claude/skills/babysit-pr
ln -s ~/agent-skills/skills/design-an-interface .claude/skills/design-an-interface
ln -s ~/agent-skills/skills/edit-article .claude/skills/edit-article
ln -s ~/agent-skills/skills/git-guardrails-claude-code .claude/skills/git-guardrails-claude-code
ln -s ~/agent-skills/skills/grill-me .claude/skills/grill-me
ln -s ~/agent-skills/skills/improve-codebase-architecture .claude/skills/improve-codebase-architecture
ln -s ~/agent-skills/skills/migrate-to-shoehorn .claude/skills/migrate-to-shoehorn
ln -s ~/agent-skills/skills/obsidian-vault .claude/skills/obsidian-vault
ln -s ~/agent-skills/skills/prd-to-issues .claude/skills/prd-to-issues
ln -s ~/agent-skills/skills/prd-to-plan .claude/skills/prd-to-plan
ln -s ~/agent-skills/skills/qa .claude/skills/qa
ln -s ~/agent-skills/skills/request-refactor-plan .claude/skills/request-refactor-plan
ln -s ~/agent-skills/skills/scaffold-exercises .claude/skills/scaffold-exercises
ln -s ~/agent-skills/skills/setup-pre-commit .claude/skills/setup-pre-commit
ln -s ~/agent-skills/skills/tdd .claude/skills/tdd
ln -s ~/agent-skills/skills/triage-issue .claude/skills/triage-issue
ln -s ~/agent-skills/skills/ubiquitous-language .claude/skills/ubiquitous-language
ln -s ~/agent-skills/skills/write-a-prd .claude/skills/write-a-prd
ln -s ~/agent-skills/skills/write-a-skill .claude/skills/write-a-skill
ln -s ~/agent-skills/skills/no-use-effect .claude/skills/no-use-effect
ln -s ~/agent-skills/skills/harness-engineering .claude/skills/harness-engineering
ln -s ~/agent-skills/skills/frontend-slides .claude/skills/frontend-slides
```

**Optional: visual-explainer skill (external repo)**

Generates beautiful, self-contained HTML pages for diagrams, diff reviews, visual plans, slide decks, and data tables. Includes 7 slash commands.

```bash
# Clone into skills directory
git clone https://github.com/nicobailon/visual-explainer ~/agent-skills/skills/visual-explainer

# Copy slash commands to Claude Code commands directory
mkdir -p ~/.claude/commands
cp ~/agent-skills/skills/visual-explainer/prompts/*.md ~/.claude/commands/
```

Commands: `/generate-web-diagram`, `/generate-visual-plan`, `/generate-slides`, `/diff-review`, `/plan-review`, `/project-recap`, `/fact-check`. [More info](https://github.com/nicobailon/visual-explainer)

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
| [babysit-pr](babysit-pr/SKILL.md) | Babysit a GitHub PR by polling review comments, CI checks, and mergeability until merged/closed ([openai/codex](https://github.com/openai/codex)) |
| [agent-browser](agent-browser/SKILL.md) | Headless browser automation CLI optimized for AI agents |
| [agent-device](agent-device/SKILL.md) | Mobile automation for iOS simulators/devices and Android emulators/devices |
| [dogfood-device](dogfood-device/SKILL.md) | Systematically QA test mobile apps on iOS/Android with structured reports, screenshots, and repro videos |
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
| [logging-best-practices](logging-best-practices/SKILL.md) | Wide events and canonical log lines for debuggable systems |
| [systematic-debugging](systematic-debugging/SKILL.md) | 4-phase root cause debugging: investigation, pattern analysis, hypothesis, implementation |
| [test-driven-development](test-driven-development/SKILL.md) | Red-green-refactor TDD methodology with anti-pattern reference |
| [showboat-walkthrough](showboat-walkthrough/SKILL.md) | Build linear, executable code walkthroughs using showboat |
| [triad](triad/SKILL.md) | Three-agent adversarial analysis (Finder/Adversary/Referee) for any code dimension |
| [triad-review](triad-review/SKILL.md) | Multi-dimensional code review running triad across bugs, security, performance, maintainability, and simplicity |
| [trycycle](trycycle/SKILL.md) | Iterative plan-build-review workflow with hill-climbing refinement ([danshapiro/trycycle](https://github.com/danshapiro/trycycle)) |
| [visual-explainer](https://github.com/nicobailon/visual-explainer) | Generate beautiful HTML pages for diagrams, diff reviews, visual plans, slide decks, and data tables (external) |
| [design-an-interface](design-an-interface/SKILL.md) | Generate multiple distinct interface designs using parallel sub-agents ([mattpocock/skills](https://github.com/mattpocock/skills)) |
| [edit-article](edit-article/SKILL.md) | Enhance articles through restructuring and clarity improvements ([mattpocock/skills](https://github.com/mattpocock/skills)) |
| [git-guardrails-claude-code](git-guardrails-claude-code/SKILL.md) | Set up Claude Code hooks to block dangerous git commands ([mattpocock/skills](https://github.com/mattpocock/skills)) |
| [grill-me](grill-me/SKILL.md) | Relentless interview about a plan or design until every decision is resolved ([mattpocock/skills](https://github.com/mattpocock/skills)) |
| [improve-codebase-architecture](improve-codebase-architecture/SKILL.md) | Analyze projects for architectural enhancements focusing on module depth and testability ([mattpocock/skills](https://github.com/mattpocock/skills)) |
| [migrate-to-shoehorn](migrate-to-shoehorn/SKILL.md) | Convert test files from `as` assertions to @total-typescript/shoehorn ([mattpocock/skills](https://github.com/mattpocock/skills)) |
| [obsidian-vault](obsidian-vault/SKILL.md) | Manage Obsidian vault notes with wikilinks support ([mattpocock/skills](https://github.com/mattpocock/skills)) |
| [prd-to-issues](prd-to-issues/SKILL.md) | Break product requirements into independently-assignable GitHub issues ([mattpocock/skills](https://github.com/mattpocock/skills)) |
| [prd-to-plan](prd-to-plan/SKILL.md) | Transform product requirements into phased implementation strategies ([mattpocock/skills](https://github.com/mattpocock/skills)) |
| [qa](qa/SKILL.md) | Quality assurance testing skill ([mattpocock/skills](https://github.com/mattpocock/skills)) |
| [request-refactor-plan](request-refactor-plan/SKILL.md) | Create detailed refactoring strategies with granular commit steps ([mattpocock/skills](https://github.com/mattpocock/skills)) |
| [scaffold-exercises](scaffold-exercises/SKILL.md) | Create exercise directory structures with sections, problems, solutions, and explainers ([mattpocock/skills](https://github.com/mattpocock/skills)) |
| [setup-pre-commit](setup-pre-commit/SKILL.md) | Configure Husky hooks with linting, formatting, type checking, and testing ([mattpocock/skills](https://github.com/mattpocock/skills)) |
| [tdd](tdd/SKILL.md) | Test-driven development with red-green-refactor loop and vertical slices ([mattpocock/skills](https://github.com/mattpocock/skills)) |
| [triage-issue](triage-issue/SKILL.md) | Investigate bugs by exploring codebases, identifying root causes, and creating fix plans ([mattpocock/skills](https://github.com/mattpocock/skills)) |
| [ubiquitous-language](ubiquitous-language/SKILL.md) | Extract a DDD-style ubiquitous language glossary from the current conversation ([mattpocock/skills](https://github.com/mattpocock/skills)) |
| [write-a-prd](write-a-prd/SKILL.md) | Create a PRD through interactive interview and codebase exploration ([mattpocock/skills](https://github.com/mattpocock/skills)) |
| [write-a-skill](write-a-skill/SKILL.md) | Create new skills with proper structure and bundled resources ([mattpocock/skills](https://github.com/mattpocock/skills)) |
| [no-use-effect](no-use-effect/skill.md) | Enforce no-useEffect rule in React code with 5 replacement patterns and useMountEffect escape hatch ([alvinsng](https://x.com/alvinsng/status/2033969062834045089)) |
| [frontend-slides](frontend-slides/SKILL.md) | Create stunning, animation-rich HTML presentations from scratch or by converting PowerPoint files ([zarazhangrui/frontend-slides](https://github.com/zarazhangrui/frontend-slides)) |
| [harness-engineering](harness-engineering/SKILL.md) | Design environments so AI agents build reliable software — context management, mechanical enforcement, and feedback loops (Ryan Lopopolo, OpenAI) |
>>>>>>> 2e32f5d (Fix harness-engineering skill filename)

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

- **babysit-pr**: Requires Python 3 and `gh` CLI authenticated. From [openai/codex](https://github.com/openai/codex).
- **agent-browser**: Requires Node.js. Install globally with `npm install -g agent-browser && agent-browser install`.
- **agent-device**: Requires Node.js. Install globally with `npm install -g agent-device`. Needs Xcode (iOS) or Android SDK (Android).
- **dogfood-device**: Requires `agent-device` CLI installed. See agent-device requirements above.
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
- **logging-best-practices**: No dependencies (documentation/patterns skill).
- **systematic-debugging**: No dependencies (methodology/patterns skill). Includes supporting techniques and shell scripts.
- **test-driven-development**: No dependencies (methodology/patterns skill). Includes testing anti-patterns reference.
- **showboat-walkthrough**: Requires Python 3.x and `uvx` (from [uv](https://docs.astral.sh/uv/)). Showboat is auto-installed via `uvx`.
- **triad**: Requires `claude` CLI in PATH. Runs 3 separate `claude -p` processes per analysis (Finder → Adversary → Referee).
- **triad-review**: Requires `claude` CLI in PATH. Wrapper that runs triad across multiple lenses.
- **trycycle**: Requires Python 3. Iterative plan-build-review workflow from [danshapiro/trycycle](https://github.com/danshapiro/trycycle) (MIT, by Dan Shapiro; adapted from Jesse Vincent's "superpowers").
- **visual-explainer**: No build dependencies (generates self-contained HTML). Optional: `surf` CLI for AI-generated images. Clone separately from [nicobailon/visual-explainer](https://github.com/nicobailon/visual-explainer).
- **design-an-interface**: No dependencies (methodology/patterns skill). From [mattpocock/skills](https://github.com/mattpocock/skills).
- **edit-article**: No dependencies (methodology/patterns skill). From [mattpocock/skills](https://github.com/mattpocock/skills).
- **git-guardrails-claude-code**: No dependencies (hooks configuration skill). From [mattpocock/skills](https://github.com/mattpocock/skills).
- **grill-me**: No dependencies (interview/planning skill). From [mattpocock/skills](https://github.com/mattpocock/skills).
- **improve-codebase-architecture**: No dependencies (methodology/patterns skill). From [mattpocock/skills](https://github.com/mattpocock/skills).
- **migrate-to-shoehorn**: Requires `@total-typescript/shoehorn` package. From [mattpocock/skills](https://github.com/mattpocock/skills).
- **obsidian-vault**: Requires an Obsidian vault directory. From [mattpocock/skills](https://github.com/mattpocock/skills).
- **prd-to-issues**: No dependencies (planning skill). From [mattpocock/skills](https://github.com/mattpocock/skills).
- **prd-to-plan**: No dependencies (planning skill). From [mattpocock/skills](https://github.com/mattpocock/skills).
- **qa**: No dependencies (quality assurance skill). From [mattpocock/skills](https://github.com/mattpocock/skills).
- **request-refactor-plan**: No dependencies (planning skill). From [mattpocock/skills](https://github.com/mattpocock/skills).
- **scaffold-exercises**: No dependencies (scaffolding skill). From [mattpocock/skills](https://github.com/mattpocock/skills).
- **setup-pre-commit**: Requires Node.js and Husky. From [mattpocock/skills](https://github.com/mattpocock/skills).
- **tdd**: No dependencies (methodology/patterns skill). From [mattpocock/skills](https://github.com/mattpocock/skills).
- **triage-issue**: No dependencies (debugging/investigation skill). From [mattpocock/skills](https://github.com/mattpocock/skills).
- **ubiquitous-language**: No dependencies (documentation skill). From [mattpocock/skills](https://github.com/mattpocock/skills).
- **write-a-prd**: No dependencies (planning skill). From [mattpocock/skills](https://github.com/mattpocock/skills).
- **write-a-skill**: No dependencies (meta skill for creating skills). From [mattpocock/skills](https://github.com/mattpocock/skills).
- **no-use-effect**: No dependencies (documentation/patterns skill). From [alvinsng](https://gist.github.com/alvinsng/5dd68c6ece355dbdbd65340ec2927b1d).
- **frontend-slides**: For PPT conversion: Python with `python-pptx`. For deployment: Node.js + Vercel account (free). For PDF export: Node.js (Playwright installs automatically). From [zarazhangrui/frontend-slides](https://github.com/zarazhangrui/frontend-slides).
- **harness-engineering**: No dependencies (methodology/patterns skill). Based on Ryan Lopopolo's "Harnessing Engineering" (OpenAI, Feb 2025).

## License

MIT

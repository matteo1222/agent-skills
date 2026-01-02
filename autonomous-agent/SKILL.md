---
name: autonomous-agent
description: Proactive autonomous agent system that researches trends, finds opportunities, and takes action to improve your codebase or business
tools: [research, act, loop]
---

# Autonomous Agent System

A simple, powerful system for running Claude proactively and autonomously. Inspired by the Ralph Wiggum technique: "Ralph is a Bash loop."

## Philosophy

> "Me fail English? That's unpossible!" - Ralph Wiggum

The system embraces deterministic iteration in an unpredictable world. It keeps researching, learning, and improving until goals are achieved.

## Core Components

### 1. The Loop (`ralph`)
The heart of the system - a simple bash loop that runs missions until complete.

```bash
{baseDir}/ralph <mission-file>
```

### 2. Missions
YAML files that define what the agent should research and improve.

### 3. Research Phase
The agent searches the web, reads documentation, finds trends and opportunities.

### 4. Action Phase
The agent makes improvements - directly editing code, creating PRs, or generating reports.

## Quick Start

### Run a Mission
```bash
# Run the UX improvement mission
{baseDir}/ralph {baseDir}/missions/ux-improver.yaml

# Run the SEO trend finder
{baseDir}/ralph {baseDir}/missions/seo-trends.yaml

# Run the agentic coding researcher
{baseDir}/ralph {baseDir}/missions/agentic-coding.yaml
```

### Create Your Own Mission
```yaml
# my-mission.yaml
name: "My Custom Mission"
description: "What this mission accomplishes"
schedule: continuous  # or: daily, weekly, once

research:
  topics:
    - "topic to research"
    - "another topic"
  sources:
    - web        # Search the web
    - github     # Search GitHub repos
    - hackernews # Check Hacker News

actions:
  - type: report          # Generate a findings report
  - type: prototype       # Build a prototype
  - type: pr              # Create a pull request
  - type: direct_edit     # Edit files directly

target:
  repo: "."              # Current directory
  branch: "improvements" # Branch for changes

limits:
  max_iterations: 10
  max_cost: 5.00
  timeout_hours: 2
```

## Available Missions

| Mission | Description |
|---------|-------------|
| `ux-improver.yaml` | Continuously researches UX best practices and improves your UI |
| `seo-trends.yaml` | Finds latest SEO trends and optimizes your site |
| `agentic-coding.yaml` | Researches latest in AI coding tools and improves your dev workflow |
| `marketing-ideas.yaml` | Discovers marketing trends and generates campaign ideas |
| `prototype-builder.yaml` | Researches new tech and builds quick prototypes |

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    RALPH LOOP                            │
│  ┌─────────┐    ┌──────────┐    ┌─────────┐             │
│  │ RESEARCH │───▶│ ANALYZE  │───▶│  ACT    │────┐       │
│  └─────────┘    └──────────┘    └─────────┘    │       │
│       ▲                                          │       │
│       └──────────────────────────────────────────┘       │
│                    (until complete)                      │
└─────────────────────────────────────────────────────────┘
```

### Research Phase
- Searches web for latest trends in your topic
- Reads documentation and best practices
- Checks GitHub for new tools and patterns
- Monitors Hacker News for discussions

### Analysis Phase
- Compares findings with your current codebase
- Identifies gaps and opportunities
- Prioritizes by impact and effort

### Action Phase
- Generates reports with recommendations
- Builds prototypes of new features
- Creates PRs with improvements
- Directly edits files (if configured)

## Environment Variables

```bash
# Optional: Set your preferences
export RALPH_AGENT="claude"           # Agent to use: claude, gemini, q
export RALPH_MAX_COST="10.00"         # Maximum cost per run
export RALPH_AUTO_APPROVE="false"     # Auto-approve changes
```

## Integration with Other Skills

The autonomous agent can use other skills in this repository:

- **brave-search**: For web research
- **browser-tools**: For interactive research and testing
- **youtube-transcript**: For learning from videos
- **nano-banana-pro**: For generating UI mockups
- **vscode**: For reviewing changes

## Safety Features

1. **Cost Limits**: Stops when cost threshold reached
2. **Iteration Limits**: Maximum loops before stopping
3. **Human Approval**: Can require approval before acting
4. **Git Checkpoints**: All changes are committed for easy rollback
5. **Dry Run Mode**: Preview actions without executing

## Examples

### Continuous UX Improvement
```bash
# Run in background, improving UX every day
nohup {baseDir}/ralph {baseDir}/missions/ux-improver.yaml --schedule daily &
```

### One-time Research Report
```bash
# Generate a report on latest AI coding trends
{baseDir}/ralph {baseDir}/missions/agentic-coding.yaml --once --output report.md
```

### Prototype Builder
```bash
# Research and build a prototype of trending features
{baseDir}/ralph {baseDir}/missions/prototype-builder.yaml --target ./prototypes/
```

## Files

- `{baseDir}/ralph` - Main loop script
- `{baseDir}/research.js` - Research engine
- `{baseDir}/act.js` - Action executor
- `{baseDir}/missions/` - Mission configurations
- `{baseDir}/.state/` - Persistent state and logs

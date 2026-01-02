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

### 2. The Director (`director.yaml`)
Your general direction - goals, seed sources, principles, and constraints.

```bash
# View/edit your director configuration
{baseDir}/ralph --director
```

### 3. Memory System
Persistent memory that tracks experiments, discovered sources, and insights.

```bash
# View memory summary
{baseDir}/ralph --memory

# Add an experiment
{baseDir}/ralph --memory add-experiment "name" "hypothesis" "focus_area"

# View what worked/failed
{baseDir}/ralph --memory get-successes
{baseDir}/ralph --memory get-failures
```

### 4. Missions
YAML files that define what the agent should research and improve.

### 5. Research & Action Phases
The agent searches the web, reads documentation, finds trends, and takes action.

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
┌─────────────────────────────────────────────────────────────────┐
│                         RALPH LOOP                               │
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐      │
│  │ DIRECTOR │──▶│ RESEARCH │──▶│ ANALYZE  │──▶│   ACT    │──┐   │
│  │ (goals)  │   │ (learn)  │   │ (plan)   │   │ (do)     │  │   │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘  │   │
│       │                                              │        │   │
│       │              ┌──────────┐                    │        │   │
│       └─────────────▶│  MEMORY  │◀───────────────────┘        │   │
│                      │ (learn)  │                             │   │
│                      └──────────┘                             │   │
│       ▲                                                       │   │
│       └───────────────────────────────────────────────────────┘   │
│                        (until complete)                           │
└─────────────────────────────────────────────────────────────────┘
```

### Director Phase
- Loads your general direction from `director.yaml`
- Considers focus areas and their weights
- Respects principles and constraints

### Research Phase (with Memory)
- **Checks memory first** - don't repeat failures
- Uses **seed sources** as starting points
- **Discovers similar sources** - expands your research network
- Searches web for latest trends

### Analysis Phase
- Compares findings with your current codebase
- Prioritizes based on **north star metrics**
- Identifies gaps and opportunities

### Action Phase
- Generates reports with recommendations
- Builds prototypes of new features
- Creates PRs with improvements
- **Records experiments** - what worked, what didn't

## The Director

Edit `{baseDir}/director.yaml` to set your general direction:

```yaml
# Your north star - ultimate goal
north_star:
  primary: "Build the best product"
  metrics: ["User satisfaction", "Code quality"]

# Where to focus
focus_areas:
  code_quality:
    weight: high
    goals: ["Reduce tech debt", "Better tests"]
  ux_design:
    weight: medium
    goals: ["Improve UX", "Mobile-first"]

# Seed sources - agent will find similar ones
seed_sources:
  blogs:
    - url: "https://blog.pragmaticengineer.com"
      why: "Engineering best practices"
  github:
    - repo: "anthropics/claude-code"
      why: "Stay updated on Claude Code"

# Principles for decision-making
principles:
  - "Prefer simple solutions over complex ones"
  - "Test ideas quickly with prototypes"

# What to avoid
constraints:
  avoid:
    - "Major rewrites without clear benefit"
```

## Memory System

The agent remembers what it tried and learned:

```bash
# View memory summary
{baseDir}/ralph --memory

# What worked (do more of)
{baseDir}/ralph --memory get-successes

# What failed (don't repeat)
{baseDir}/ralph --memory get-failures

# All discovered sources
{baseDir}/ralph --memory list-sources

# Key insights
{baseDir}/ralph --memory get-insights

# Reset memory (start fresh)
{baseDir}/ralph --memory reset
```

Memory files are stored in `{baseDir}/memory/`:
- `experiments.json` - What was tried and outcomes
- `sources.json` - Discovered sources (expanded from seeds)
- `insights.json` - Key learnings and patterns
- `context.json` - Understanding of codebase/business

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
- `{baseDir}/quick-start` - Interactive mission launcher
- `{baseDir}/director.yaml` - Your general direction and seed sources
- `{baseDir}/memory.sh` - Memory management script
- `{baseDir}/memory/` - Persistent memory (experiments, sources, insights)
- `{baseDir}/missions/` - Mission configurations
- `{baseDir}/.state/` - Runtime state and logs

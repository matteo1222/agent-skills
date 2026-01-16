---
name: lenny-podcast
description: Search and query 269 Lenny's Podcast transcripts for product, growth, and leadership insights.
---

# Lenny Podcast Skill

Query the complete archive of Lenny's Podcast transcripts - 269 episodes of world-class product wisdom.

## Setup

Clone the transcripts archive:

```bash
git clone --depth 1 https://github.com/ChatPRD/lennys-podcast-transcripts.git ~/resources/lenny-transcripts
```

## Repository Structure

```
lenny-transcripts/
├── episodes/
│   └── {guest-name}/
│       └── transcript.md    # YAML frontmatter + full transcript
├── index/
│   ├── README.md            # Topic overview
│   └── {topic}.md           # 50+ topic indexes
└── scripts/
    └── build-index.sh       # Regenerate index with Claude
```

## Transcript Format

Each `transcript.md` contains:

```yaml
---
guest: Brian Chesky
title: "Building Airbnb..."
youtube_url: https://youtube.com/...
video_id: abc123
description: "Episode description"
duration_seconds: 3600
duration: "1:00:00"
view_count: 150000
channel: Lenny's Podcast
---

[Full transcript text...]
```

## Workflows

### 1. Search by Keyword

```bash
# Find episodes mentioning a topic
grep -r "product-market fit" ~/resources/lenny-transcripts/episodes/ -l

# With context
grep -r "habit formation" ~/resources/lenny-transcripts/episodes/ -B2 -A5
```

### 2. Browse by Topic

Check the pre-built topic indexes:

```bash
# List all topics
ls ~/resources/lenny-transcripts/index/

# Read a specific topic
cat ~/resources/lenny-transcripts/index/product-management.md
cat ~/resources/lenny-transcripts/index/growth-strategy.md
```

Available topics (50+):
- product-management (57+ episodes)
- leadership
- growth-strategy
- product-market-fit
- hiring
- pricing
- metrics
- And many more...

### 3. Read Specific Episode

```bash
# List all guests
ls ~/resources/lenny-transcripts/episodes/

# Read a specific transcript
cat ~/resources/lenny-transcripts/episodes/brian-chesky/transcript.md
```

### 4. Semantic Search (with qmd)

```bash
# Index for semantic search
qmd index ~/resources/lenny-transcripts/

# Query
qmd query "how to find product-market fit in B2B SaaS"
```

### 5. Extract Insights

When user asks about a topic:

1. Search transcripts for relevant mentions
2. Identify the most relevant episodes
3. Extract key quotes and insights
4. Synthesize into actionable advice
5. Cite the guest and episode

Example response format:

```
**On [Topic]:**

Brian Chesky (Airbnb founder):
> "Quote from transcript"

Shreyas Doshi (ex-Stripe PM):
> "Another relevant quote"

**Key takeaways:**
1. Point one
2. Point two
```

## Notable Guests

- Brian Chesky (Airbnb)
- Shreyas Doshi (Stripe, Twitter)
- Lenny Rachitsky (host)
- Gibson Biddle (Netflix)
- Gokul Rajaram (DoorDash)
- Julie Zhuo (Facebook)
- And 260+ more...

## Use Cases

- "What does Lenny's podcast say about pricing strategies?"
- "Find insights on building habits in consumer apps"
- "What do product leaders say about saying no?"
- "How did Airbnb find product-market fit?"

## Tips

1. **Start with topic index** — faster than grep for discovery
2. **Transcripts are large** — read frontmatter first (first 15 lines)
3. **Cite your sources** — always mention guest name
4. **Synthesize, don't dump** — extract insights, not raw text

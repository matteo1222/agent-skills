---
name: living-code-guide
description: Build and maintain a living guide for a codebase - an interactive explainer whose slides, demos and numbers read the real code, kept in step as agents edit it, optionally with an embedded tutor agent that can drive the running app. Use when someone wants to understand agent-written code, teach a codebase (to kids, new contributors, themselves), add interactive docs next to a project, or when editing code that carries `learn:` markers.
metadata:
  source: "Techniques from Armin Ronacher's 'Teaching Kids Programming with Pi' (https://youtu.be/_35OxmSp5EM) and its repo https://github.com/mitsuhiko/dungeon-crawler (learn/), restated in our own words"
---

# Living code guide

When an agent writes the code, nobody learns by watching it fly by. A **living guide** is the fix: a set of interactive pages, built alongside the project, that explain it from the big idea down to the real code, where every code excerpt, number and demo is read from or runs the project's own source. It never goes stale silently, because each slide is tied to the definitions it explains and a check flags the slide when that code changes. Optionally an embedded **tutor** agent knows which slide the reader is on, can read the code, move the reader around, and drive the running app to show things.

It pays off beyond kids: it is how you understand dense agent-written code at a level the code itself never states (why a "juice" effect or "coyote time" exists, how a seed always gives the same world). It costs extra tokens per change, so keep it to ideas worth the upkeep.

Leading words used throughout: **real code** (shown or run from source, never copied), **drift** (code changed under a slide), **level** (Lv 1 big idea, Lv 2 how it works, Lv 3 the real code), **room** (one page, one topic), **ladder** (the tutor's escalating help).

## Branches

- **Building a guide from scratch** - do every step below.
- **Editing code that already has `learn:` markers** - only step 5's maintenance loop: finish the code change, run the drift check, fix or defer the slides it names.
- **Adding the tutor to an existing guide** - steps 6 and 7.

## Steps

### 1. Pick the audience and the rooms

Name the reader (age, whether they have programmed) and the languages. Then list the **rooms**: one per durable idea the project embodies, ordered so each builds on the last - e.g. "a program is instructions; a game loop listens, thinks, draws", "the world is made from a seed", "a monster is a list of numbers plus a state machine", "loot is rolled in fixed steps", "what makes it feel good". Teach ideas that would survive a rewrite, using this project's code as the example; leave one-off workarounds and tuning tricks to the grown-up design docs.

Done when: every major module of the project is the example for at least one room, and no room's topic is a project-specific hack.

### 2. Scaffold the guide inside the repo

A `learn/` (or `guide/`) folder next to the code, served by the same dev server so pages can `fetch` and `import` the project's source. No build step if the project has none. One shared engine script handles slides, level filter, navigation, glossary hovers, live code/values and lazy demo loading; each room is a plain HTML file of slide sections. A map page lists the rooms and lets the reader pick a detail level.

Done when: the map and one room load from the dev server and a slide can `import` a project module.

### 3. Write the rooms

Follow [`AUTHORING.md`](AUTHORING.md) for slide anatomy, levels, live code and values, demos, glossary, translations and voice. Each room climbs Lv 1 -> 3 and ends on a Lv 1 takeaway. Every slide declares the source it explains.

Done when: every room has slides at all three levels, every slide that explains code declares its references, and every demo that can import the project's pure modules does so instead of copying logic.

### 4. Ground every claim in the code

Specific numbers and code come live from source, never typed into prose. Where prose states a fact (a range, an order of steps), check it against the code before writing it.

Done when: grepping the guide for literal numbers that also exist as constants in the code finds only live-value fallbacks.

### 5. Wire drift tracking

Follow [`DRIFT.md`](DRIFT.md): references -> fingerprints file -> `learn:` markers above each explained definition -> a check that runs in the test suite and names the slides to review -> `--stamp` / `--defer`. Then add one line to the project's `AGENTS.md` / `CLAUDE.md` so every agent that edits marked code runs the loop:

> Code with a `// learn: ...` marker is explained by the guide. After changing it, run the guide check, update the named slides (or defer them), then stamp.

Done when: changing a marked function makes the test suite fail with the slide names, and `--stamp` / `--defer` makes it pass again.

### 6. (Optional) Embed the tutor

Follow [`TUTOR.md`](TUTOR.md): an agent in a side panel, running in the browser, told automatically where the reader is and what they just did, with tools to look, show, move, point and run code. It teaches by asking (the **ladder**), quizzes on request, and keeps notes on what the reader understood.

Done when: on any slide, "I don't get this" yields a question back that references that slide without the tutor having to search for it, and "show me in the code" puts real code in front of the reader.

### 7. (Optional) Let the tutor drive the running app

Add a teaching API to the app (overlays, rule-drawing lenses, pause/step/slow, tune-with-undo, reset) and a way for the tutor to open the app in a window next to the guide. See the "Driving the app" section of [`TUTOR.md`](TUTOR.md).

Done when: the tutor can, from a chat request, put a scenario on screen (e.g. spawn an enemy next to the player, slow time, draw its sight range) and fully undo it.

### 8. Verify end to end

Tests: every text has its translation pair, links and anchors resolve, demo imports still exist in the project, references resolve, fingerprints match. Then open the guide in a browser and walk one room at each level; if the tutor exists, run it against a scripted model in tests and once for real.

Done when: the test suite is green and a fresh reader can go from the map to Lv 3 code in one room without a dead link or an empty demo.

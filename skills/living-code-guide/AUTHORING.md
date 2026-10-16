# Authoring rooms

Reference for step 3 of [`SKILL.md`](SKILL.md). Attribute names are suggestions; keep whatever names the project's guide already uses.

## Slide anatomy

A room is one HTML page whose main element holds slide sections. Each slide carries:

- an `id` (stable anchor; other rooms and the tutor link to it),
- a **level**: `data-lv="1"` big idea, `2` how it works, `3` the real code,
- the source it explains: `data-src="src/core/enemies.js#SPIDER src/game/ai.js#decide,act"`. A reference is `path#name`, `path#a,b`, or a bare `path` for the whole file; a name is a top-level function, class, const, method, Python def, or `header` (the file's opening comment).

The reader picks a level on the map; slides above it hide. Within a room, climb 1 -> 3; the last slide is a Lv 1 takeaway where the engine adds the way on to the next room. Link down a level with a "deeper" link to a slide id, across rooms with a portal link (`room.html#slide`), and terms with a glossary link.

## Real code and live values

- **Live code**: an empty `<pre data-code="path#name">` the engine fills by fetching the file and extracting the definition (plus the comment above it) when the page opens. Prefer this to pasting code; it cannot drift.
- **Shortened excerpt**: `<pre data-src="path#name"><code>...</code></pre>` when the full definition is too long; it is still tracked for drift.
- **Live value**: `<b data-val="src/core/constants.js#RUN_SPEED">2.8</b>` shows the exported value, formatted for the language (`data-fmt="pct"` turns 0.17 into 17%). The written text is the offline fallback, rewritten by `--stamp`.
- Mark the exact lines that matter when showing code to a beginner; at Lv 3 show the whole definition.

## Demos

A demo is a module exporting `mount(el)` (optionally returning a stop function), requested by `<div class="demo" data-demo="name">` and loaded when it scrolls into view. Rules:

- **Run the real code.** Import the project's pure modules (rules, data, generators) rather than reimplementing them, and label such demos "real code" so readers know what they are playing with. When a demo must copy logic (it needs live app state, or it is a 2D view of a 3D thing), say where it comes from in its first comment.
- **Make the reader the input.** Drag the hero past a wall to see line of sight; set a seed and watch the same layer come out; toggle each "juice" effect (screen shake, hit pause) off to feel the difference; draw marbles from a bag to see a weighted random pick.
- Show internal state as it changes: the state machine's current state highlighted in a row of states, the last few states, health.
- Demos that show structure (which file imports which) crawl the import graph live instead of listing it.
- Give the engine `canvas`, `loop` (runs only while visible, stops when the page is left) and a translate helper so demos stay small. A demo that takes keys claims them so arrow keys do not turn the slide.

## Explaining ideas

- One idea per paragraph, short sentences, the reader's words. Define a term the first time or link it to the glossary page (hover shows the entry anywhere).
- Start each room with a framing the reader can hold: "a game does three things over and over: listen, think, draw"; "to the game, a monster is a short list of numbers (a profile)"; "every cube is 16 by 16 squares".
- Use a familiar anchor for abstract ideas: a Minecraft-style seed for deterministic randomness, sub-seeds for each part of the map, drawing marbles from a bag for a seeded PRNG or a loot roll.
- Explain why order matters where it does (roll rarity before affixes, because a common item has none).
- Put a "journey" slide per room that lights up which part (folder) of the source each step lives in, and an early slide listing the files and how they fit.
- Screenshots of the real app beside Lv 1 slides.

## Two languages in one file

When the guide is bilingual, every text block is a pair, first language first (`<p lang="en">` then `<p lang="de">`); shared elements (code, demos, images) exist once. Attributes get a twin (`data-de-alt`). Names the app shows in one language stay as-is in the other; code and its comments are never translated. Tests fail on any text without its partner.

## What stays out

- Prompting tips: the guide teaches the project's ideas, not how it was generated.
- Numbers typed into prose (use live values).
- Project-specific workarounds; they belong in the design notes (`docs/`), which the tutor can still read.

## One long-lived page

Make navigation swap the main element instead of reloading, so the tutor panel and the app window persist across rooms. Each page type gets an `enter()` / `leave()` in the engine that sets up and tears down its bars, listeners and demos; deep links and reloads still load normally.

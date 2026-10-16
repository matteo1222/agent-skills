# The embedded tutor

Reference for steps 6 and 7 of [`SKILL.md`](SKILL.md): an agent in a side panel of the guide that teaches the project one question at a time and can drive the running app.

## Runtime

- Runs entirely in the reader's browser on a small agent harness (the original uses Pi's `pi-durable`, vendored as one bundle). The agent bundle loads only when the panel opens.
- One conversation spans the whole guide; navigation must not reload the page (see "One long-lived page" in `AUTHORING.md`).
- **Durable**: persist every question, answer and tool call (IndexedDB) before showing it, so a reload mid-answer resumes and finishes it. Tools that only read are safe to replay after a reload; tools that change things come back as interrupted instead of re-running. Allow one active tab (a Web Lock) and offer takeover in others.
- **No key at all, inside Claude**: published as a claude.ai Artifact with the `sample` capability, the page calls Claude on the viewer's own subscription, passing its tools as page functions. Calls are memoryless, so the page keeps the turns and sends the teaching rules as a leading user turn plus the `<page>` block with each message; the viewer consents once, and the `quick` tier keeps tool rounds snappy.
- **Keys**: elsewhere, either the dev server injects a provider key from its environment (the browser never sees it), or the reader pastes one into settings, stored only in that browser and sent straight to the provider. Settings also pick the model, show spend, start over, and forget everything.
- The tutor needs no update when slides change or rooms are added: it reads pages and code live. Only its teaching prompt is maintained by hand.

## Context it gets without asking

Prepend a `<page>` block, written by the guide, to every reader message so the tutor never has to discover where the reader is:

- room (index/count, title), slide (position, id, title, level), the reader's chosen level, language, slide vs scroll mode;
- what the reader did since the last message, with how long ago: slides and rooms visited, demo buttons clicked, sliders and toggles set (repeat events collapsed with a count, list capped);
- text the reader selected (often what the question is about);
- the state of each demo on the current slide;
- the app window, if open: what is paused, which overlays are on, what is tuned;
- the room's slide outline only when entering a room, and the slide's text only when it changed (keep a hash of the last snapshot with the message so this survives reloads).

Keep the system prompt stable (so it caches); everything that varies travels in the `<page>` block.

## Tools

Group them by what they do, and tell the tutor which results the reader can see:

- **Look** (only the tutor sees the result): read a slide or a whole room; read a demo's state; screenshot the app; read and search the project's code and design notes; search the guide; look up a glossary word.
- **Show**: put a short piece of real code (a few dozen lines, the important ones marked) in the panel above the answer; prefer this to typing code.
- **Move and point**: navigate the reader to a room, slide or level (sparingly, saying why); highlight anything on screen or in the app with a glowing frame and a short note.
- **Act**: open, restart and steer the app window (teleport the player, press keys); run JavaScript in the guide or the app with full access to the page, demos, the project's modules and the app's debug handle, optionally showing the code to the reader when the code itself teaches.
- **Remember**: write a short note when the reader shows understanding or a misconception; notes survive "start over" and are injected into the prompt so the tutor can connect ideas across rooms.

Because the reader never sees tool results, the tutor must put a thing on screen (show code, navigate, highlight) before talking about it.

## How it teaches

Write the teaching prompt around these behaviours (in your own words, for your audience):

- **Ask first**: when the reader asks how or why, ask what they guess or noticed, then build on it.
- **Small steps**: a few short sentences, then exactly one question.
- **The ladder**: a pointing question -> a hint about where to look (highlighted) -> part of the answer -> the whole answer. Jump to the whole answer when the reader asked twice, seems stuck or frustrated, or it is a plain fact; then ask a question that uses it.
- **Predict, then watch**: set up an experiment in a demo or the app, have the reader predict ("guess what happens if the sword reaches twice as far"), then run it. Let the reader do what they can do themselves.
- **Right**: confirm plainly and push one step further (why, or what if). **Wrong**: never say "wrong"; ask a question or run an experiment that exposes the problem.
- **Explain back and quiz**: when a topic is done, have the reader explain it or apply it elsewhere. On "quiz me", ask predict-first questions about the current slide one at a time ("don't click yet"), with a hint pointing at the relevant step, and confirm the reasoning not just the answer.
- **Match the level** the reader picked: Lv 1 no code unless asked, Lv 3 real code.
- **Truthful**: check the code before any specific claim; never invent code, numbers or names; when slides and code disagree, the code wins and the tutor says so kindly.
- **Language and scope**: answer in the page's language (or the reader's, if they switch); stay on the project, programming and maths; for a child audience, never ask for personal information and point to a trusted adult on anything upsetting or unsafe.
- Offer starter chips in the empty panel: "What is this slide about?", "Quiz me on this slide", "I don't get this part", "How does the real code do this?", "Show me in the real app".

## Driving the app

Give the app a teaching handle (e.g. `window.__app.teach`) so the tutor shows ideas in the real thing, not a mock-up:

- **Draw over the world**: pins, labels, arrows, rings, sectors (a weapon's arc), grid cells, paths; anchored to a place, the player or an enemy (following it, gone when it dies); each with id, color, time-to-live.
- **Lenses**: switchable overlays that draw the app's own rules every frame from real state with real functions - a weapon's reach, what each enemy sees and hears and its current state, the paths enemies plan, the grid with coordinates, routes. Prefer a lens to a hand drawing: it is the real rule.
- **Time**: pause, resume, step N frames, slow motion - for fast events (a swing, the moment an enemy notices you), with the reader predicting before resuming.
- **Tune with a way back**: change any number in the app's tables or objects while it runs, remembering the old value, and `untune()` restores exactly. Keep tunable data in plain objects. Document which copies a tune does not reach (per-instance copies, worker-side modules, exported primitives).
- **Spawn and set up**: debug hooks to spawn or clear enemies, move the player, give items; the app window is a sandbox and restart restores the same seeded world, so the tutor should do what the reader asks rather than refuse.
- **reset()** undoes every drawing, lens, pause and tune; `status()` describes what is on (feeds the `<page>` block).
- Open the app in a same-origin iframe next to the guide, in its dev mode, persisting across rooms; keyboard goes to it only while it has focus, and the window shows which side has focus.

## Testing the tutor

Run it against a scripted fake model in unit tests (storage, every tool, finishing an answer after a reload), and in a real browser room with every tool, the app window and room changes.

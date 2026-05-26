# Simplification Principles

This note distills the principles behind the review-swarm simplicity reviewer. Use it as background when tuning that sub-agent's prompt or when explaining why a simplification finding matters.

## Core Doctrine

Prefer code that is easy to understand, change, test, replace, and delete. Simplicity is not the same as fewer lines or familiar syntax; it is lower entanglement. A simpler design has fewer concepts that must be understood together, clearer ownership of knowledge, smaller blast radius, less speculative machinery, fewer inactive or redundant paths, and fewer ways for callers to misuse it.

The reviewer should not be anti-abstraction or anti-duplication. It should ask whether the chosen structure reduces total complexity for the current codebase. A good abstraction clarifies intent, hides meaningful detail, protects important invariants, and lets callers ignore implementation concerns. A bad abstraction creates accidental coupling, adds indirection, and makes slightly different use cases squeeze through one shared path.

## Practical Rules

1. Apply KISS first: choose the smallest design that satisfies the current behavior.
2. Treat DRY as "do not duplicate knowledge," not "never repeat text." A business rule, schema, constant, or invariant that must stay in sync needs one authoritative home.
3. Allow WET code while the model is still moving. Two similar snippets may represent different concepts that only look alike today.
4. Use AHA: avoid hasty abstractions. Wait until real use cases reveal the stable boundary, then extract the abstraction that is now obvious.
5. Prefer duplication over the wrong abstraction. If shared code is accumulating flags, modes, callbacks, and case-specific branches, inline it back into callers, trim each caller to what it needs, then re-extract only the true common concept.
6. Apply YAGNI to future-proofing. Do not add extension points, configuration knobs, generic frameworks, or alternate implementations for imagined future requirements when they increase current complexity.
7. Distinguish simple from easy. Easy means familiar, close at hand, or fast to type. Simple means not interleaved. Favor designs that de-complect state, time, policy, effects, data representation, and control flow.
8. Prefer deep, orthogonal modules. A module should hide meaningful complexity behind a small interface; a thin wrapper that exposes the same decisions to callers usually adds ceremony without reducing complexity.
9. Refactor in small behavior-preserving steps. Simplification findings should recommend deletions, inlining, splitting, naming, co-location, interface narrowing, or source-of-truth consolidation before broad rewrites.
10. Delete code that no longer carries behavior or confidence. Dead branches, unreachable fallbacks, pass-through wrappers, stale compatibility paths, duplicate guards, and no-op transformations impose reading and testing cost even when they do nothing.
11. Create agent-safe invariants and abstractions. As AI agents write more code, APIs should make correct usage obvious and invalid usage hard or impossible. Put business rules, safety checks, lifecycle ordering, permissions, and data-shape constraints into types, schemas, constructors, validators, framework defaults, and tests instead of relying on comments, conventions, or prompt discipline.

## Review Heuristics

Report a simplification issue only when it has concrete maintenance impact. Good signals include:

- The change adds an abstraction with one call site or no clear current requirement.
- A shared helper now contains case-specific branches for unrelated callers.
- A new interface, base class, or generic component pushes implementation details onto callers.
- The same business rule, validation rule, schema field, default, or constant is now represented in multiple places.
- Similar-looking code was consolidated even though the callers have different reasons to change.
- The diff adds mutable shared state, hidden ordering constraints, or cross-module coordination that makes behavior harder to reason about.
- Tests target an abstraction's internals instead of concrete behavior, making future inlining or splitting harder.
- A smaller direct change would satisfy the current intent with less blast radius.
- The change leaves behind old paths, wrappers, flags, options, imports, constants, tests, or docs that no longer have a caller or supported behavior.
- The diff adds redundant validation, conversion, caching, memoization, branching, logging, or fallback code that duplicates an existing guarantee without improving correctness or diagnosis.
- A new API is easy for an agent to call incorrectly because it accepts raw strings, loose maps, boolean flags, nullable option bags, or unconstrained mode switches.
- Important invariants are enforced only by call-site discipline, comments, naming conventions, documentation, or prompt instructions.
- Callers must manually remember ordering, cleanup, permission checks, rollout checks, validation, or data normalization that a narrower abstraction could own.
- A small type, schema, enum, builder, factory, validator, or capability-scoped helper would remove a likely misuse path without hiding useful behavior.

Prefer not to report:

- Mere style preferences.
- Small duplication that is local, obvious, and likely to diverge.
- A longer implementation that is more explicit and easier to reason about.
- A well-named abstraction that hides real complexity behind a small stable interface.
- Redundant-looking code that is intentionally defensive at a trust boundary, preserves backward compatibility, improves observability, or documents a non-obvious invariant.
- Low-level APIs that are intentionally internal, well-tested, and wrapped by safer entry points for normal callers.
- Refactoring opportunities unrelated to the reviewed diff.

## Source Map

- KISS: ["Keep It Simple Stupid"](https://principles.dev/p/keep-it-simple-stupid-kiss/) treats a simple solution as better than a complex one when it satisfies the same goal.
- DRY: [The Pragmatic Programmer's DRY formulation](https://aipatternbook.com/dry) frames DRY as a single authoritative representation for each piece of knowledge.
- WET: Dan Abramov's ["The WET Codebase"](https://www.deconstructconf.com/2019/dan-abramov-the-wet-codebase) emphasizes the tradeoff between duplication and abstraction costs.
- AHA: Kent C. Dodds' ["Avoid Hasty Abstractions"](https://kentcdodds.com/blog/aha-programming) argues for pragmatic timing instead of dogmatic DRY or WET.
- Wrong abstraction: Sandi Metz's ["The Wrong Abstraction"](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction) recommends re-introducing duplication when an abstraction has become condition-laden and misleading.
- Simple vs. easy: Rich Hickey's ["Simple Made Easy"](https://www.infoq.com/presentations/Simple-Made-Easy/) distinguishes familiar/easy constructs from simple artifacts with fewer intertwined concerns.
- YAGNI: Martin Fowler's ["Yagni"](https://martinfowler.com/bliki/Yagni.html) argues against presumptive features and abstractions that add complexity before they are needed, while preserving refactoring and tests that keep code malleable.
- Refactoring: Martin Fowler's [refactoring definition](https://www.refactoring.com/) describes behavior-preserving restructuring that makes code easier to understand and cheaper to modify.
- Deep modules: John Ousterhout's ["Managing Complexity"](https://web.stanford.edu/~ouster/cgi-bin/cs190-spring15/lecture.php?topic=complexity) emphasizes interfaces that hide substantial complexity and minimize the information a caller must carry.
- Agent-safe abstractions: Adam Bender's "Software Engineering at the Tipping Point" framing from this session argues that agentic ecosystems need strong abstractions, documented practices, and good defaults because agents will amplify existing choices and can misuse exposed internal APIs.

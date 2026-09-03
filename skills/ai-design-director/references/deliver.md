# Deliver: subtract and prove

Use this branch for final polish, release readiness, and read-only visual audits. The aim is **restraint**: preserve the selected identity while removing elements that dilute function or feel machine-default.

## 1. Run the subtraction pass

Inspect every visible element, container, label, effect, and motion. Keep it only when it serves at least one named purpose:

- completes or clarifies a user task;
- establishes hierarchy or orientation;
- communicates state, consequence, trust, or proof;
- expresses a system invariant or signature moment from the brief.

Remove or merge redundant labels, nested containers, decorative cards, unexplained badges, repeated calls to action, competing accents, surplus helper text, and custom controls weaker than the platform's established component. Tighten empty space that has no compositional job while preserving deliberate breathing room.

**Completion criterion:** every remaining element has a named job and removing any one would measurably weaken function, hierarchy, or identity.

## 2. Sweep for machine-default tells

Treat these as diagnostic clusters, not universal bans. For every tell found, remove it, replace it with a concept-specific choice, or explain why the selected direction genuinely requires it.

| Cluster | Inspect for |
| --- | --- |
| Structure | interchangeable split heroes; a repeated heading–three cards–CTA rhythm; decorative dashboard grids; identical section alignment; floating panels with no information role |
| Surface | purple/blue gradients by reflex; glow everywhere; indiscriminate glass; excessive rounded containers and pills; arbitrary icon badges; shadows without a depth system |
| Typography | one display trick repeated at every level; weak body hierarchy; oversized wrapping headlines; accent styles used as decoration rather than meaning |
| Copy | generic superlatives; unsupported metrics; over-explanation; duplicate headings and body text; labels that narrate the layout instead of the product |
| Motion | every element animating; generic fade-up sequences; parallax or marquees without narrative value; long easing that delays tasks; motion with no reduced-motion path |
| Imagery | generic abstract hero art; unrelated stock imagery; generated text artifacts; inconsistent people or objects; crops that fail responsively; media that competes with the primary action |

The strongest cure is a specific product idea carried consistently, not a longer prohibition list.

## 3. Verify the product

### Purpose and content

- The primary job and next action are clear at first use.
- Content order matches the user's decision path.
- Claims, metrics, logos, and testimonials are real or visibly marked as placeholders.
- Present-tense product promises are backed by supplied facts or behavior verified in this build; proposed requirements remain labeled as proposals.
- Consequential actions match the agreed integration depth. A local or simulated action is visibly a prototype and never claims a live external outcome.
- Empty, loading, error, success, permission, and destructive states exist where relevant.

### Visual system

- Type, color, spacing, radius, border, shadow, iconography, and motion use a small intentional token set.
- Hierarchy survives without relying on color alone.
- Repeated elements behave as a family; signature elements remain rare enough to be memorable.
- The selected direction is visible beyond the hero or first screen.

### Interaction and accessibility

- Semantic controls work with keyboard and assistive technology.
- Focus is visible; targets are usable; contrast meets the project's standard.
- Hover, focus, active, disabled, loading, error, and success behavior exists when applicable.
- Motion respects reduced-motion settings and never blocks the task.

### Responsive and content stress

- Verify required breakpoints plus the narrowest supported width.
- Test long titles, translated-length copy, empty data, dense data, and zoom.
- Check overflow, clipping, overlap, fixed-position elements, safe areas, and input occlusion.
- Important content and actions retain sensible order when columns collapse.

### Runtime and resilience

- No new console errors, broken assets, dead interactions, or avoidable layout shifts.
- Fonts and media have appropriate formats, sizes, loading behavior, and fallbacks.
- Animation stays smooth on the target class of device and does not monopolize the main thread.
- The core flow remains usable when optional media or an external request fails.

## 4. Prove the final render

Capture the same key states and viewports used for the baseline. Compare them against the buildable brief and, for substantial changes, run the independent critic contract in [critic-loop.md](critic-loop.md). Verify fixes in the interface after each material change rather than assuming code correctness implies visual correctness.

For an audit, rank findings by user impact and visual leverage:

```markdown
## Verdict
<one sentence>

## Highest-leverage findings
1. <visible evidence> → <desired outcome>
2. ...

## Preserve
- <distinctive element that should survive>

## Verification gaps
- <state or viewport not available for inspection>
```

For implementation, fix in-scope high-impact findings before handoff.

**Branch completion criterion:** the requested flow is functional and legible in its real states, every machine-default tell is removed or deliberately justified, the selected identity survives subtraction, and the proof covers each required viewport and critical interaction.

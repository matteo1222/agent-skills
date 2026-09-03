# Discover: escape the average

Use this branch for concept exploration and at the start of substantial creation or redesign. The goal is **separation**: directions should differ in underlying composition and interaction logic, not merely in styling.

## 1. Establish the opportunity space

Translate the frame into four statements:

1. **Function:** what the user must understand or accomplish.
2. **Feeling:** the emotional response that helps that function.
3. **Permission:** which conventions may bend and which must remain familiar.
4. **Proof:** what a screenshot or interaction would show if the idea works.

List the obvious category conventions. They are a baseline to challenge selectively, not a checklist to reproduce.

**Completion criterion:** each convention is marked keep, reinterpret, or discard, with a product reason.

## 2. Inject entropy

Models tend to produce biased pseudo-variety. For an open creative task, obtain one long non-sensitive working seed from an external random source when a shell or equivalent tool is available, for example:

```bash
openssl rand -hex 24
```

If no external source exists, generate a complex random string first and manipulate its complete contents before choosing any creative direction. This is the String Seed of Thought fallback.

The seed may appear in the agent's tool transcript. Never derive it from a secret, store it in the product, render it in the interface, or repeat it in the handoff. Interpret it rather than turning it into visible copy or a literal motif:

- segment lengths → rhythm, scale, or grid ratios;
- character classes → hard/soft, mechanical/organic, dense/airy tensions;
- repetitions → recurring shapes, cadence, or interaction motifs;
- numeric clusters → palette position, alignment, or motion timing;
- anomalies → one controlled break from the system.

Product evidence can veto a seeded choice. The seed creates a provocation; it does not outrank usability or the brief.

**Completion criterion:** the seed has changed at least three independent design dimensions without appearing in the product.

## 3. Sweep broadly

Default to eight one-line provocations, then shortlist three. Draw inspiration from different source domains—architecture, editorial systems, tools, games, film language, physical materials, scientific instruments, performance, or public spaces—rather than eight neighboring web trends.

Each provocation must state:

- the central metaphor or design thesis;
- the composition or navigation behavior it changes;
- the emotional response it seeks;
- one way it could fail.

Reject a set when several candidates share the same hero structure, section rhythm, card system, typography hierarchy, or interaction model. Palette swaps are one direction.

**Completion criterion:** every shortlisted direction differs from the others on at least four of these axes: composition, hierarchy, typography, palette behavior, material/imagery, interaction, motion, content rhythm.

## 4. Add human taste

Visualize the shortlist with the cheapest artifact that exposes the decision: a rough screenshot, static comp, key screen, coded spike, or storyboard. Ask for reaction rather than abstract approval:

- What feels magnetic?
- What feels cheap, awkward, or too familiar?
- What should become quieter or more intense?
- Which detail feels specific to this product?

Convert every reaction into a constraint. “I dislike it” becomes a concrete exclusion; “this one” becomes a named relationship worth preserving. If the user is unavailable and autonomous execution is in scope, use the scorecard below.

## 5. Select without averaging

Score each finalist from 1–5:

| Axis | Question |
| --- | --- |
| Product fit | Does the concept make the primary job clearer or more compelling? |
| Distinctiveness | Would the silhouette and interaction still be recognizable without the logo? |
| Coherence | Can the idea govern an entire flow rather than one dramatic screen? |
| Feasibility | Can the team implement and maintain it within the actual constraints? |
| Inclusion | Can it remain legible, operable, responsive, and motion-safe? |
| Performance | Can its media and effects meet the product's runtime budget? |

Weight product fit twice. Select one direction; preserve useful details from other candidates as notes rather than blending them into a committee design.

## Buildable brief

Record the selected direction in this compact form:

```markdown
# Direction: <name>

Product job: <what this helps the user do>
Intended feeling: <specific emotional response>
Thesis: <one decisive design idea>

Layout grammar: <hierarchy, alignment, density, rhythm>
Typography: <role and contrast, not merely font names>
Color behavior: <where color appears and what it means>
Material and imagery: <surface or media logic>
Interaction and motion: <how actions feel and why>
Signature moments: <one to three memorable moments>
System invariants: <relationships repeated across the flow>
Exclusions: <defaults or effects that would dilute this direction>
Primary risk: <hardest design or implementation uncertainty>
Proof: <screens/states that demonstrate success>
```

**Branch completion criterion:** the brief is specific enough that another capable implementer could make consistent decisions without inventing a second visual identity.

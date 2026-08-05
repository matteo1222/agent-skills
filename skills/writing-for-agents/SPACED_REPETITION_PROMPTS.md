# Writing spaced-repetition prompts

Use this reference when a skill creates or evaluates retrieval-practice prompts for Anki or another spaced repetition system (SRS). A prompt gives the learner's future self a recurring task. Design that task for the change it should produce: durable recall, conceptual understanding, procedural fluency, creative application, or timely action.

This reference adapts Andy Matuschak's 2020 essay, [“How to write good prompts: using spaced repetition to create understanding”](https://andymatuschak.org/prompts), licensed [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). The organization and wording below are condensed for skill authors.

## Contents

- [The retrieval target](#the-retrieval-target)
- [Five properties](#five-properties)
- [Knowledge patterns](#knowledge-patterns)
- [Drafting prompts](#drafting-prompts)
- [Litmus tests](#litmus-tests)
- [Iterative practice](#iterative-practice)
- [Completion criterion](#completion-criterion)

## The retrieval target

Begin by characterizing what it would mean for this learner to know or use the material. Separate the source's claims from the learner's own connections and intended behaviors.

For each candidate, name:

- the knowledge or behavior to reinforce;
- why it matters to this learner;
- the cue or situation in which it should become available;
- the expected answer or action;
- whether the mechanism is retrieval, creative generation, or salience.

Write prompts only for material with enough value to justify repeated attention. Prior knowledge changes the right granularity: a novice may need individual components where an expert can retrieve a familiar chunk as one unit.

## Five properties

Every retrieval prompt should be:

1. **Focused.** Retrieve one detail, relationship, distinction, condition, or decision. Split a prompt whose answer contains independently forgettable parts.
2. **Precise.** Make the requested answer unambiguous. Include the minimum context that excludes other reasonable answers.
3. **Consistent.** Cause substantially the same knowledge to be retrieved on each review. Variable-answer prompts belong to the creative or salience branches instead.
4. **Tractable.** Make correct retrieval likely. Decompose the task or add a cue when failures would recur.
5. **Effortful.** Leave real memory work for the learner. A cue should narrow the search space without revealing the answer.

Tightly scoped questions usually produce all five properties. The answer can be short even when the surrounding understanding is rich; use several connected prompts to load the whole idea.

## Knowledge patterns

Choose patterns by knowledge type. A source may require several types.

### Facts

- Ask for one fact at a time.
- Add an explanation prompt when the reason is useful or helps connect an otherwise arbitrary fact.
- Add a reverse prompt only when recalling the term from its meaning is independently useful.
- Put optional mnemonics, imagery, or elaborative associations in the answer so they support retrieval without giving it away.
- Mark subjective, provisional, or source-specific claims in the answer or source metadata.

Example:

```text
Q. Which HTTP status indicates that a resource was created?
A. 201 Created.

Q. Why does a successful POST often return 201 instead of 200?
A. It tells the client that the request created a new resource.
```

### Closed lists

A closed list has a fixed membership that must be reproduced.

- Group members by function before memorizing arbitrary order.
- Use one cloze deletion per missing member while preserving a stable order.
- Practice components before adding an integrative whole-list prompt.
- Add explanations for members when those relationships make the list easier to reconstruct.

A cloze card should hide only one target at a time. Sibling cards should not reveal that target during the same review.

### Procedures

Extract the load-bearing pieces rather than copying the prose:

- verbs or actions;
- order and transition conditions;
- key subjects and objects;
- non-obvious adjectives and adverbs;
- branches, predicates, exceptions, and stopping rules;
- rationales and diagnostic “heads-up” information.

Ask focused questions about those pieces. Use a flowchart or state diagram when branches are the knowledge. Omit steps already implied by the learner's fluency.

Example:

```text
Q. When should an exponential-backoff retry loop stop retrying?
A. After a non-retryable error or the configured attempt/deadline limit.

Q. Why add jitter to exponential backoff?
A. To keep many clients from retrying in synchronized bursts.
```

### Concepts

A memorized definition rarely constitutes conceptual understanding. Trace the concept's edges with whichever lenses reveal useful relationships:

- **Attributes and tendencies:** what is always, sometimes, or never true?
- **Similarities and differences:** what adjacent concepts must be distinguished?
- **Parts and wholes:** what are its components, instances, categories, or counterexamples?
- **Causes and effects:** what produces it, and what does it produce?
- **Significance and implications:** why does it matter, what follows from it, and when should it alter a decision?

Use several small prompts rather than one “explain everything” prompt. Include a concrete application or personal implication when transfer matters.

### Open lists

An open list is an evolving category of examples, not a fixed sequence.

Represent it with three complementary links:

1. instance to category;
2. a pattern or implication of the category;
3. category to a few examples.

Support an example-generating prompt with prompts about individual instances; otherwise the learner may repeat the same examples and forget the rest.

### Creative prompts

A creative prompt asks for a new answer or application on each review. State that novelty explicitly, for example: “give an answer you have not used before.”

Creative prompts do not reinforce a stable answer. Use them deliberately to exercise the knowledge required to generate answers and to form new associations. Keep them separate from retrieval prompts when evaluating consistency.

### Salience and transfer prompts

A salience prompt keeps an idea available until it can connect to real life or trigger behavior. Phrase it around the context in which the idea should occur.

```text
Q. Before running a command that deletes production data, what should I inspect?
A. The resolved target set and a dry-run/preview.
```

Factual recall does not guarantee that knowledge will surface when useful. Context-laden prompts bridge that transfer gap. Treat salience as a distinct objective rather than pretending the answer is a fact to memorize.

## Drafting prompts

For each retrieval target:

1. Write the shortest natural question that isolates it.
2. Write the exact answer the learner should retrieve.
3. Add only enough context to exclude reasonable alternatives.
4. Add a cue when the target is otherwise intractable.
5. Move mnemonic associations and optional elaboration into the answer.
6. Link or tag the source when provenance or provisionality matters.

Prefer multiple atomic prompts to one coarse prompt. The amount of knowledge is fixed; combining it into fewer cards makes review harder rather than making the knowledge smaller. Balance this with relevance: prompts are cheap, yet repeated attention and boredom have real cost.

Default to clean `Q.` / `A.` pairs in output. Include target, type, source, or rationale metadata only when the user or downstream format needs it.

## Litmus tests

Run every prompt through both directions.

### False-positive test

Ask: “How could someone give the expected answer without retrieving the intended knowledge?”

Repair prompts that permit:

- clues which disclose the answer;
- yes/no or this/that guessing;
- memorizing a long question's verbal shape;
- solving a cloze from copied surrounding prose;
- inference from wording alone.

Replace binary prompts with open questions about mechanism, comparison, implication, or example.

### False-negative test

Ask: “How could someone know the intended knowledge yet reasonably give a different answer?”

Repair prompts with:

- multiple valid interpretations;
- missing time, scope, actor, source, or situation;
- a provincial source-specific framing for general knowledge;
- answers that require remembering what the writer meant rather than the subject.

Add the smallest discriminating context or find a better angle. Context should resolve ambiguity without turning the question into a pattern-matching key.

### Retrieval test

Confirm that:

- one target is active;
- the expected answer is checkable;
- the same target will be retrieved months later;
- the learner can usually succeed;
- success still requires memory effort;
- the set collectively covers the intended understanding.

## Iterative practice

Write prompts in passes:

1. On first exposure, select roughly five to ten important, meaningful, or useful targets.
2. For unfamiliar material, begin with facts, terms, notation, and other components that later understanding depends on.
3. Revisit rich material as experience reveals patterns, connections, applications, and personal questions.
4. Stop when curiosity and expected value fall below the cost of repeated attention. Completionism is not a learning objective.

Review supplies the long feedback loop. Treat friction as evidence:

- recurring failure → split the target or add a non-revealing cue;
- correct answer without understanding → add mechanism, comparison, or application prompts;
- ambiguous grading → add context or reframe;
- stale understanding → revise the whole connected prompt set;
- repeated internal “sigh” or lost relevance → recover the motivation or delete the prompt.

Revise across card boundaries when understanding changes: merge duplicates, split coarse prompts, replace definitions with relationship prompts, and update source claims. A prompt library is a living model of the learner's understanding.

## Completion criterion

A prompt set is ready when:

- every card has a named retrieval, creative, or salience objective;
- every retrieval card passes all five properties and both litmus tests;
- factual, procedural, conceptual, list, and transfer needs are represented with the appropriate patterns;
- the set is calibrated to the learner's prior knowledge and intended use;
- provenance is retained where claims are subjective or provisional;
- the set contains only material worth revisiting.

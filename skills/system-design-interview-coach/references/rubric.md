# System Design Interview Rubric

Use this after mocks, transcript reviews, or answer critiques. Calibrate against the user's target level.

## Scorecard

Score each dimension from 1 to 5.

| Dimension | 1-2 Signal | 3 Signal | 4-5 Signal |
| --- | --- | --- | --- |
| Problem framing | Assumes prompt, skips requirements, designs wrong product | Gets core requirements after some prompting | Identifies objects, access patterns, mutability, and NFR priorities with good judgment |
| Scale and access patterns | No read/write shape, no pagination, no traffic intuition | Basic API and scale, somewhat disconnected from design | Access patterns drive storage, indexing, caching, and fanout decisions |
| Architecture | Box drawing is vague, overcomplicated, or missing storage model | Plausible high-level design with gaps | Simple baseline, clear data flow, and focused improvements based on bottlenecks |
| Tradeoffs and correctness | Names buzzwords, cannot explain failure modes | Explains some pros/cons | Makes decisions, states downsides, handles concurrency/consistency/failure where relevant |
| Communication | Monologue, silence, evasion, or constant check-ins | Understandable but uneven | Collaborative, concise, decisive, adapts to interviewer and manages time |
| Product/user judgment | Purely technical, ignores user impact | Mentions users occasionally | Connects technical choices to experience, business cost, privacy, and operability |

## Verdicts

- `Strong Hire`: Clear senior+ signal. Candidate sets agenda, makes justified decisions, finds the hard part, and handles pushback.
- `Hire`: Solid for target level. Some gaps, but design is coherent and communication is coachable.
- `Mixed`: Reasonable fragments but uneven signal. Needs one or two targeted improvements before real interviews.
- `No Hire`: Misses core requirements, cannot reason through tradeoffs, or needs interviewer to supply the design.

## Seniority Calibration

Mid-level:

- Expected to know common components and follow interviewer direction.
- Can spend more time on API/schema details.
- Should be honest about gaps and show teachability.

Senior:

- Expected to lead the flow, prioritize requirements, and choose depth.
- Should discuss tradeoffs without needing constant prompting.
- Should show ownership of reliability, scale, and user impact.

Staff+:

- Expected to identify ambiguous problem framing, organizational/operational constraints, and long-term evolution.
- Should discuss failure domains, migration paths, observability, cost, and team ownership where relevant.
- Should know when a simpler non-distributed design is sufficient.

## Green Flags

- Starts by clarifying product scope and users.
- Turns objects into access patterns before selecting storage.
- States assumptions and validates them at milestones.
- Makes a decision after comparing options.
- Explains the downside of their own choice.
- Uses first principles when they do not know a specific technology.
- Calls out hard parts instead of avoiding them.
- Keeps broad progress while leaving room for interviewer-directed deep dives.

## Red Flags

- Assumes the product is a famous app without checking scope.
- Jumps straight to microservices, queues, caches, and brand names.
- Lists every possible database or component without choosing.
- Uses "high availability", "scalable", or "eventual consistency" as slogans.
- Writes too much low-level API/schema detail before proving the architecture.
- Ignores interviewer nudges or pushes back defensively.
- Avoids questions they cannot answer instead of reasoning from constraints.
- Adds a distributed system when one machine or one database would satisfy the requirements.

## Feedback Template

```markdown
Verdict: [Strong Hire/Hire/Mixed/No Hire] for [target level]

Scorecard:
| Dimension | Score | Evidence |
| --- | ---: | --- |
| Problem framing |  |  |
| Scale/access patterns |  |  |
| Architecture |  |  |
| Tradeoffs/correctness |  |  |
| Communication |  |  |
| Product/user judgment |  |  |

What landed:
- [strongest hire signal]

What hurt:
- [highest-impact issue]

Rewrite:
[short replacement phrasing or structure]

Next drill:
[one concrete exercise]
```

## Transcript Review Method

When reviewing a transcript:

1. Mark the first point where the answer drifted from the prompt.
2. Identify missed requirements and missed access patterns.
3. Identify unsupported technology choices.
4. Identify the strongest moment to preserve.
5. Rewrite only the highest-leverage 1-2 minutes.
6. Give a drill that tests the same failure mode on a new problem.

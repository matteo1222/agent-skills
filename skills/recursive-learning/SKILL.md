---
name: recursive-learning
description: AI-powered top-down learning using the Recursive Descent Method. Learn by building, not by curriculum.
---

# Recursive Learning Skill

A framework for using AI as a learning mentor (not labor replacement) to master any technical topic efficiently.

> Based on [@Hesamation's thread](https://x.com/hesamation/status/2013044418228498468) and the Gabriel Petersson approach (HS dropout → OpenAI Sora team via 100 AI questions/day).

## Core Philosophy

**Top-down, not bottom-up:**
- Traditional: fundamentals → theory → finally apply
- Recursive descent: real problem → hit wall → learn just what you need → repeat

**AI as mentor, not laborer:**
- Bad: "write me code that does X" (makes you dumber over time)
- Good: "explain why X works, I think it's because Y, am I right?" (produces outliers)

## The Meta-Skill

The critical ability is **knowing what you don't know**:
- Sit comfortably with confusion
- Identify precisely what you don't understand
- Formulate specific questions

Most people either pretend they understand (move on) or get frustrated (give up). The skill is staying in the discomfort until clarity emerges.

## The Recursive Descent Method

### Step 0: Understand WHY It Exists

Before any explanation or definition, understand the origin story:

```
User prompt template:
"I want to learn [TOPIC]. Before explaining anything, tell me:
- Why does [TOPIC] exist?
- What problem does it solve?
- What was the alternative before it?
- Where is it practically used today?"
```

### Step 1: Start With a Problem, Not a Curriculum

Don't ask "what should I learn?" — ask for a project:

```
User prompt template:
"What's a small but complete project I could build that uses [TOPIC]?
Give me something I can finish in 2-4 hours that demonstrates the core concepts."
```

Then: "Write the code for me."

### Step 2: Make It Work

- Run the code
- See the visualization / play with the result
- Experience it working before understanding it

### Step 3: Explain Back (Feynman Technique)

This is critical. Don't just read — explain back and verify:

```
User prompt template:
"I'm looking at this code:
[paste code section]

My understanding is that [YOUR EXPLANATION].
Is that correct? What am I missing or getting wrong?"
```

Repeat for each part you're unsure about.

### Step 4: Recursively Descend

After building understanding, go deeper:

```
User prompt template:
"I now understand [CONCEPT] at a practical level.
What foundational concepts does this depend on that I should understand more deeply?
Pick the most important one and explain it."
```

Repeat the entire process for that foundational concept.

### Step 5: Generalize

Once you understand deeply, expand:

```
User prompt template:
"Now that I understand [CONCEPT]:
- What other problems can this solve?
- What are its limitations?
- What would I do differently in [DIFFERENT SITUATION]?
- What's the state of the art? What are people working on improving?"
```

## Prompt Patterns

### Bad Prompt (Generic)
> "Explain Reinforcement Learning in simple words"

### Good Prompt (Specific + Controlled)
> "I want to study Reinforcement Learning. Tell me why it exists. What problem does it solve? What was the alternative before it? I know the agent takes actions and gets rewards, but I don't understand how it actually learns which actions are good. How does it know which of those 10 actions caused the reward? Walk me through the math intuitively, explain like I'm 12, and give me a solid example."

### Confusion Prompt
> "I'm confused about [SPECIFIC THING]. I expected [X] but I'm seeing [Y]. What am I misunderstanding?"

### Verification Prompt
> "Let me explain my understanding back to you: [EXPLANATION]. Grade my understanding — what's right, what's wrong, what's missing?"

## When Agent Is Learning Coach

If user wants to learn something, guide them through the method:

1. **Don't just explain** — ask what project they want to build
2. **Don't give full code** — give skeleton, let them fill gaps
3. **Force explanation** — ask "what do you think this does?" before explaining
4. **Celebrate confusion** — "Good, that confusion means you're about to learn something"
5. **Recursive prompt** — after each section: "What foundational concept here do you want to go deeper on?"

Example coaching flow:
```
User: "Teach me how neural networks work"

Agent: "What problem do you want to solve with a neural network? 
Give me something specific — image classification, text prediction, game playing?"

User: "Image classification"

Agent: "Perfect. Here's a minimal image classifier in 50 lines of PyTorch. 
Run it first, watch it train, see the accuracy improve. 
Then pick any line you don't understand and we'll dig in."
```

## Limitations to Acknowledge

When learning with AI, remember:

- **AI can't give you agency** — you must want to learn; no amount of prompting fixes lack of motivation
- **AI can't teach taste** — which problems matter, what's elegant, what's maintainable
- **AI can be confidently wrong** — verify with YouTube, papers, books, Stack Overflow
- **You still do the work** — AI removes friction, not effort

## Integration

Combine with other learning resources:
- **YouTube** — for visual intuition
- **Papers** — for authoritative source
- **Textbooks** — for systematic coverage
- **Study partners** — for accountability and different perspectives

AI is the glue that lets you move between these faster, not the replacement for them.

## Key Insight

> "The people who train themselves to learn in recursive descent mode will be the only people able to learn efficiently and keep up with the crazy fast pace of evolving tech."

The divide is coming. Choose your side.

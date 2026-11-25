---
name: first-principles
description: Musk's first-principles thinking for problems where the accepted answer may be wrong. Use when asked to reason from first principles, challenge a "that's just how it's done" assumption, find why something costs so much, or estimate the floor on cost, time, or effort.
---

Reason from first principles, not by **analogy**. Analogy copies the answer from what others did, with small changes; it is fast, and it is how most thinking works, so the conventional answer is always the default to beat. First principles boils the problem down to the fundamental truths in that domain and reasons up from there. In Musk's words (Kevin Rose, 2012): "boil things down to the most fundamental truths you can imagine and then reason up from there." The method earns its cost on a problem where the conventional answer is suspect; for everyday choices, analogy is fine and this skill is overkill.

Keep one **truth ledger** for the run: a row per claim the conventional answer rests on, with columns for the claim, its tag (below), the evidence, and what it implies. Every step writes to it.

## 1. State the analogy

Write down the conventional answer and the analogy holding it up: "batteries cost $600/kWh, so they always will", "rockets cost what rockets cost", "a feature like this takes a quarter". Then list every claim that answer depends on as a ledger row. Include the claims the user brought, since those are the ones nobody has checked.

Done when the conventional answer is stated in one sentence with a number where one exists, and every claim it rests on is a row.

## 2. Boil down to fundamental truths

Tag each row with what kind of thing it is:

- **physics**: a law of nature or a hard constraint (energy, mass, the speed of light, a strength limit, a deadline set in a contract).
- **measured**: a fact you can look up or measure today, with its source (a commodity price, a benchmark, a log).
- **convention**: how it is usually done, a supplier's quote, an industry norm, "best practice".
- **assumption**: believed but unchecked.

Only physics and measured rows are fundamental truths. Musk's rule of thumb: the laws of physics are the only rules; everything else is a recommendation. Push each convention and assumption down by asking "what is this made of?" or "why must this be true?" until it lands on a physics or measured row, or falls apart. The battery case: asked what a battery is made of (cobalt, nickel, aluminum, carbon, polymers, a steel can) and priced each on the London Metal Exchange, the pack came to about $80/kWh against the $600 everyone quoted.

Done when every row is tagged, and every convention or assumption has either been reduced to physics or measured rows beneath it or been marked _unsupported_.

## 3. Find the floor

From the fundamental truths alone, compute the **floor**: the best result physics and measured facts allow. For cost it is raw materials; for time it is the irreducible work; for performance it is the physical limit. The rocket case (Wired, 2012): aerospace-grade aluminum, titanium, copper, and carbon fiber came to about 2% of a rocket's price.

Then compute the **idiot index**, Isaacson's name for Musk's ratio: current value divided by the floor. A high index points to where the convention is hiding waste or unexamined choices, and ranks where to dig. Compute it per part or per stage, not just for the whole, so the worst offenders surface.

Done when the floor is a number with its derivation, and the idiot index is computed for the whole and for each major part or stage.

## 4. Reason up

Build a new answer using only the tagged truths, ignoring how it is done today. Start from the floor and add back only what a truth requires: process steps, tolerances, margin, labor. Each addition cites the ledger row that justifies it. Where the answer still lands far from the floor, name the specific thing between them (a process, a tool, a missing supplier) as the target to change.

Done when the new answer is stated with its own number, every component traces to a ledger row, and the gap to the floor is itemised.

## 5. Test against reality

The rebuild is a hypothesis. Find the cheapest test that could break it: a quote from a second supplier, a prototype, a spike, a back-of-envelope check against an independent figure. Check what the gap between floor and convention actually buys. Non-material cost is real when it pays for safety, reliability, certification, or skilled labor; the idiot index treats all of it as waste, and that is its known blind spot. A gap that buys something you need stays, with its reason in the ledger.

Done when the rebuild has survived at least one test that could have failed it, or the ledger records which row broke and why.

## Reporting

Lead with the conventional answer, the floor, and the new answer, each as a number. Then show the ledger and the idiot-index breakdown. Say which conclusions rest on assumption rows still unverified. When the target is an existing process or system to cut, hand the surviving requirements to [`five-step`](../five-step/SKILL.md): first principles finds what is possible; the five-step algorithm removes what stands in the way.

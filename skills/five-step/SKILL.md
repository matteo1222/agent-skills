---
name: five-step
description: Musk's five-step algorithm (question, delete, simplify, accelerate, automate) for improving any process, system, codebase, or plan. Use when asked to optimize, speed up, streamline, cut, or automate something, or to review requirements before building.
---

Run the five steps **in order** on the target: a process, a system, a codebase, a workflow, a plan. Each step works on what survived the step before it, so the order is the method. The most common mistake is to _optimize something that should not exist_; the order exists to catch it before any effort is spent making it better.

Keep one **ledger** for the whole run: a table with a row per requirement, part, or process step, and columns for owner, verdict (keep / delete / simplify), and reason. Every step below writes to it.

## 1. Question

Make the requirements less dumb. Every requirement is presumed dumb until it survives questioning, and a requirement from a smart or senior source gets _more_ scrutiny, because it is the one least likely to be challenged. That includes requirements the user gave you.

- Trace each requirement to a **named owner**: one person, never a team or department. A team cannot be asked; a person can, and owns the answer.
- Record the owner and the reason the requirement exists. A requirement whose owner is gone, unknown, or no longer agrees with it is a deletion candidate in step 2.
- Ask the owner, or the user on their behalf, when the reason cannot be found in the code, docs, or history.

Done when every row in the ledger has a named owner (or is marked _ownerless_) and a reason you could defend to that owner.

## 2. Delete

Delete every part or process step you can. Deletion is the step people skip, so do it deliberately and aggressively: anything kept "just in case" is a deletion, because almost anything can be justified that way.

- Mark each row keep or delete. Ownerless rows and rows whose reason did not survive step 1 default to delete.
- Over-correct: delete more than feels safe. The bar is that **at least 10% of what you delete gets added back** later. An add-back rate of zero means the deleting was too timid and things that should not exist are still there.
- Count the knock-on cost of what stays. Every kept part makes others heavier (more code to test, more steps to coordinate, more surface to maintain), so a part costs roughly twice its own weight.

Done when every row has a keep or delete verdict, and the deletions are bold enough that you expect to add some back.

## 3. Simplify

Simplify or optimize **only what survived deletion**. This is where engineering skill usually goes first; here it goes third, so no effort lands on a part that step 2 would have removed.

Done when each kept row has either a simpler form or a stated reason it is already as simple as it gets.

## 4. Accelerate

Shorten the cycle time of the simplified process: the time from start to a result you can act on. It can always go faster. Accelerating earlier digs the hole faster, so this comes only after steps 1 to 3.

Done when the cycle time is measured (or estimated) before and after, and the slowest remaining stage is named.

## 5. Automate

Automate last, once the process has been questioned, cut, simplified, and sped up. Automating early freezes the dumb requirements and the extra steps into tooling that then has to be torn out.

Done when each automated stage is one that survived steps 1 to 4, and anything left manual has a reason in the ledger.

## Reporting

Present the ledger, then the changes step by step. For anything ambiguous or irreversible (deleting production code, dropping a stakeholder's requirement), propose the deletion and confirm it with the user before acting. When the user only asked for one step, such as "automate this", still run steps 1 to 4 first and say what they changed, since that is where this method earns its keep.

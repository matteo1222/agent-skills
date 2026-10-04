---
name: swarm
description: "Fan out N parallel workers, drain them, and return one report. Use for $pstack swarm, 'swarm this', or parallel coverage, races, gauntlets, and exploration."
disable-model-invocation: true
---

# Swarm

Fan out N Codex workers. They may cover separate slices, race the same brief, or mix both. The parent waits, aggregates, and returns one report.

## Start

Create a Codex task plan with one entry per phase before launching anything.

1. Frame
2. Fan out
3. Aggregate
4. Report

## Phase A: Frame

1. State the done predicate and the artifact or report the swarm must return.
2. Choose the shape. Partition into slices, race N workers on identical briefs, or mix both. For a race or mixed shape, declare `first pass`, `rank all`, or `best-of` before spawning.
3. Set N from the user or derive it from the shape. N is total workers, not simultaneous workers; excess work waits in the rolling queue.
4. Pick the worker pair from `swarm workers` in `~/.codex/pstack-models.md` when present. Otherwise use `gpt-5.6-luna @ max`. For a model race, name each arm's pair up front.
5. Give each worker its own writable output when it writes. Use an explicit worktree or branch; otherwise create one unique scratch root with `mktemp -d` and a separate `worker-<n>/` below it. Codex subagents share the local filesystem and do not receive automatic branches or worktrees.
6. For any worker asked to verify or measure commits, name the exact commit SHAs in its brief. A measurement brief also states the method: sample count, what one sample is, and sample order. Require the result to record the same SHAs and method.

## Phase B: Fan out

Spawn workers promptly up to available Codex slots with `spawn_agent`; use a rolling window and `wait_agent` for the rest. Give each a standalone brief with `fork_turns: "none"`, the configured `model` and `reasoning_effort` as separate fields, and its absolute worktree or output path. For `auto` or `inherit-parent`, omit both overrides. If Codex rejects a configured pair, use the closest model-effort pair it currently advertises for this role and report the fallback. Do not infer support from a model family name. If no compatible advertised pair is available, leave that worker unfilled and report it.

Every brief stands alone. Include the goal, scope, exact slice or race arm, how to verify, and what to report. Reports use `PASS`, `ISSUES`, or `BLOCKED` with evidence. A worker that can prove a defect reports `ISSUES` and lists every issue it can prove, not only the first.

If a worker drops out, proceed with N-1 and note it.

## Phase C: Aggregate

Read every subagent's final result. If a result that verifies or measures commits omits the exact SHAs or method named in its brief, reject it and respawn that worker once with the same evidence requirement. After a second miss, record a gap; a gap does not count as a pass. For coverage, every required slice needs a result. For a race, apply the selection rule declared up front. Use first pass, rank all, or best-of. Do not paste raw worker dumps.

Keep a compact result table, one-line evidenced issues, and explicit gaps or dropouts.

## Phase D: Report

Return one consolidated in-chat report with the table, issue one-liners, gaps or dropouts, and the race rule when used.

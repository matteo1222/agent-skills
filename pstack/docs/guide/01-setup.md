# Set up pstack

In this page you install the global Codex skill, pick which model and reasoning profiles pstack uses, and run your first task. Setup is one command plus a short conversation.

## Install the global skill

The Codex port uses a split global layout:

```text
$HOME/.agents/skills/pstack/  # the one discoverable $pstack shim
$HOME/.agents/pstack/         # the inert, fidelity-preserving payload
```

The split prevents the payload's leaf `SKILL.md` files from registering as unrelated global skills or colliding with skills you already have. Invoke every bundled workflow through `$pstack`; a leaf uses `$pstack <leaf>`.

## Pick your models

Run:

```text
$pstack setup
```

[`$pstack setup`](../../skills/setup-pstack/SKILL.md) shows you each role (code delegates, judgment, and review panels) and asks what you want. Answer the questions. It writes `$HOME/.codex/pstack-models.md`, a small configuration file every pstack invocation reads.

You only override what you care about. A role with no line in the rule keeps the skill's default. To restore a default later, delete that role's line, or just run `$pstack setup` again.

Model and reasoning effort are separate spawn settings. The defaults are `gpt-5.6-luna @ max` for simple or mechanical work, `gpt-5.6-terra @ max` for prose and synthesis, `gpt-5.6-sol @ max` for hard code and review, and `gpt-5.6-sol @ xhigh` for the hardest judgment. Set a role to `inherit-parent` or `auto` to omit both overrides and let Codex resolve its configured subagent defaults; neither value is a model slug, and the historical name does not force literal parent inheritance. For a panel role the value is a list, and one subagent runs per entry, so the list length sets the panel size. Setup also configures `swarm workers`, the default profile for every `$pstack swarm` worker unless a race names a profile for each arm.

## Accept the verification offer, or don't

At the end of setup, `$pstack setup` looks for a way to prove app behavior in your project, either a `verify-*` skill or an existing harness. If it finds neither, it offers once to generate one with [`$pstack create-verification-skill`](../../skills/create-verification-skill/SKILL.md).

Say yes and it writes `.agents/skills/verify-<app>/`, a project-local Codex skill that teaches agents to drive your app the way a user does. It proves the skill works once before handing it over. Say no and setup moves on. You can run `$pstack create-verification-skill` yourself any time. [Verify and ship](./06-verify-and-ship.md#create-a-project-verification-skill) covers when it earns its place.

After setup, invoke `$pstack` again. The configuration is read on each invocation.

## Run your first task

Pick something real but small, and describe it the way you'd describe it to a colleague:

```text
$pstack add a --json flag to this command. text output stays byte-identical. verify both.
```

Watch the Codex plan. The first item is always "read the Principles section". The rest are the matched playbook's steps copied in, the Feature playbook for this prompt. If `$pstack` skips a step, the step stays in the plan with `skip: <reason>`, so you can see what it chose not to do.

Codex selects skills per turn, so `$pstack` is not sticky. Invoke it again on every follow-up where you want the mode to apply, for example `$pstack continue`.

Next: [Route work through `$pstack`](./02-poteto-mode.md).

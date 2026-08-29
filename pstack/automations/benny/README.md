# benny

benny gives you two codex desktop scheduled-task prompt packs for slack issue reports. one triages reports. the other reproduces confirmed bugs and may prepare a small draft fix.

the files in this directory are dormant setup and task sources. they do not appear as discovered skills and do not create tasks or send messages by themselves.

## set it up

1. point codex at [`FOR_AGENTS.md`](./FOR_AGENTS.md) and name the target repository.
2. let setup merge this whole directory into the target at `.codex/pstack/benny/pack/`. it must preserve destination-only files and review conflicts instead of overwriting local edits.
3. keep user-owned configuration outside the copied pack, for example in `.codex/pstack/benny/`. adapt [`configuration.example.yaml`](./templates/configuration.example.yaml) and [`feature-map.example.md`](./skills/reproduce-and-fix-issues/references/feature-map.example.md).
4. pstack remains installed globally; do not add project plugin settings or copy its skill tree into the repository.
5. commit `.codex/pstack/benny/pack/` and any secret-free configuration before enabling either task. do not commit unless the user asks.
6. verify that the required live slack, tracker, github, control, and scheduled-task tools are actually available. follow their exposed schemas and fail closed when any required capability is missing.
7. create, update, enable, or test tasks only after an explicit user request. then review each task draft or update it in the codex desktop scheduled-task editor, send a harmless test report only with explicit approval, and verify every source-channel post stays in the original thread.

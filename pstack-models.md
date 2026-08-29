# pstack model configuration. One line per role. Delete a line to fall back to the skill default.
# `inherit-parent` or `auto` omits both spawn overrides. Alias entries still count toward panel fan-out.
feature, refactoring: gpt-5.6-luna @ max
bug-fix: gpt-5.6-sol @ max
perf-issue: gpt-5.6-sol @ max
hillclimb: gpt-5.6-sol @ max
judgment: gpt-5.6-sol @ xhigh
prose: gpt-5.6-terra @ max
hardest tasks: gpt-5.6-sol @ xhigh
how explorer: gpt-5.6-luna @ max
how explainer: gpt-5.6-terra @ max
how critics: gpt-5.6-sol @ max, gpt-5.6-terra @ max, gpt-5.6-luna @ max
why investigators: gpt-5.6-luna @ max
why synthesizer: gpt-5.6-terra @ max
reflect tooling: gpt-5.6-sol @ max
reflect judgment: gpt-5.6-sol @ xhigh
reflect divergent, synthesizer: gpt-5.6-terra @ max
arena runners: gpt-5.6-sol @ max, gpt-5.6-terra @ max, gpt-5.6-luna @ max
arena cross-judge pool: gpt-5.6-sol @ max, gpt-5.6-terra @ max, gpt-5.6-luna @ max
swarm workers: gpt-5.6-luna @ max
architect runners: gpt-5.6-sol @ max, gpt-5.6-terra @ max, gpt-5.6-luna @ max
interrogate reviewers: gpt-5.6-sol @ max, gpt-5.6-terra @ max, gpt-5.6-luna @ max

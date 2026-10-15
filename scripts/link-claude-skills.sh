#!/usr/bin/env bash
# Link this repo's skills into Claude Code's skills directory.
#
# Claude Code only looks one level deep for SKILL.md, so each skill needs its
# own entry directly under the skills directory. This symlinks them all.
#
#   ./scripts/link-claude-skills.sh                 # user-level (~/.claude/skills)
#   ./scripts/link-claude-skills.sh --project       # project-level (./.claude/skills)
#   ./scripts/link-claude-skills.sh --dry-run       # show what would happen
#   ./scripts/link-claude-skills.sh code-review tmux   # link only these skills
#   ./scripts/link-claude-skills.sh --force         # replace conflicting entries
#   ./scripts/link-claude-skills.sh --prune         # remove links to skills that no longer exist
#
set -euo pipefail

REPO_ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
SKILLS_SRC="$REPO_ROOT/skills"

target_dir="$HOME/.claude/skills"
dry_run=0
force=0
prune=0
declare -a wanted=()

die() { printf 'error: %s\n' "$1" >&2; exit 1; }

while [ $# -gt 0 ]; do
    case "$1" in
        --project) target_dir="$PWD/.claude/skills" ;;
        --target)
            [ $# -ge 2 ] || die "--target needs a directory"
            target_dir="$2"; shift ;;
        --dry-run|-n) dry_run=1 ;;
        --force|-f) force=1 ;;
        --prune) prune=1 ;;
        -h|--help) sed -n '2,13p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
        -*) die "unknown option: $1" ;;
        *) wanted+=("$1") ;;
    esac
    shift
done

[ -d "$SKILLS_SRC" ] || die "no skills directory at $SKILLS_SRC"

run() { if [ "$dry_run" -eq 1 ]; then printf '  would: %s\n' "$*"; else "$@"; fi; }

# A loadable skill is a directory with a SKILL.md carrying name+description
# frontmatter. Anything else Claude Code either ignores or logs as invalid.
is_loadable() {
    local dir="$1"
    [ -f "$dir/SKILL.md" ] || return 1
    head -1 "$dir/SKILL.md" | grep -q '^---[[:space:]]*$' || return 1
    # A key counts as filled when its value is on the same line, or folded onto
    # the indented lines that follow it.
    awk '
        NR == 1 { next }
        /^---[[:space:]]*$/ { exit }
        pending && /^[[:space:]]+[^[:space:]]/ { seen[pending] = 1 }
        /^[^[:space:]]/ { pending = "" }
        /^name:/ { if ($0 ~ /^name:[[:space:]]*[^[:space:]]/) seen["name"] = 1; else pending = "name"; next }
        /^description:/ { if ($0 ~ /^description:[[:space:]]*[^[:space:]]/) seen["description"] = 1; else pending = "description"; next }
        END { exit !(seen["name"] && seen["description"]) }
    ' "$dir/SKILL.md"
}

wants() {
    [ "${#wanted[@]}" -eq 0 ] && return 0
    local name="$1" w
    for w in "${wanted[@]}"; do [ "$w" = "$name" ] && return 0; done
    return 1
}

if [ ! -d "$target_dir" ]; then
    printf 'creating %s\n' "$target_dir"
    run mkdir -p "$target_dir"
fi

linked=0; already=0; skipped=0; conflicts=0; pruned=0
declare -a skipped_names=() conflict_names=()

for src in "$SKILLS_SRC"/*/; do
    name=$(basename "$src")
    wants "$name" || continue

    if ! is_loadable "${src%/}"; then
        skipped=$((skipped + 1)); skipped_names+=("$name"); continue
    fi

    link="$target_dir/$name"
    src_abs="${src%/}"

    if [ -L "$link" ]; then
        current=$(readlink "$link")
        if [ "$current" = "$src_abs" ]; then
            already=$((already + 1)); continue
        fi
        if [ "$force" -eq 1 ]; then
            run rm "$link"
        else
            conflicts=$((conflicts + 1)); conflict_names+=("$name -> $current")
            continue
        fi
    elif [ -e "$link" ]; then
        if [ "$force" -eq 1 ]; then
            run rm -rf "$link"
        else
            conflicts=$((conflicts + 1)); conflict_names+=("$name (real directory, not a link)")
            continue
        fi
    fi

    run ln -s "$src_abs" "$link"
    linked=$((linked + 1))
done

if [ "$prune" -eq 1 ]; then
    for link in "$target_dir"/*; do
        [ -L "$link" ] || continue
        dest=$(readlink "$link")
        case "$dest" in
            "$SKILLS_SRC"/*) [ -d "$dest" ] || { run rm "$link"; pruned=$((pruned + 1)); } ;;
        esac
    done
fi

printf '\n%s\n' "$target_dir"
printf '  linked:  %d\n' "$linked"
printf '  already: %d\n' "$already"
[ "$pruned" -gt 0 ] && printf '  pruned:  %d (source skill gone)\n' "$pruned"

if [ "$skipped" -gt 0 ]; then
    printf '  skipped: %d (no SKILL.md with name+description frontmatter)\n' "$skipped"
    printf '    %s\n' "${skipped_names[@]}"
fi

if [ "$conflicts" -gt 0 ]; then
    printf '  conflicts: %d (left alone; re-run with --force to replace)\n' "$conflicts"
    printf '    %s\n' "${conflict_names[@]}"
fi

[ "$dry_run" -eq 1 ] && printf '\n(dry run: nothing changed)\n'
exit 0

#!/bin/bash
#
# Ralph Memory Management
# Simple file-based memory for the autonomous agent
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MEMORY_DIR="${SCRIPT_DIR}/memory"

# Ensure memory directory exists
mkdir -p "$MEMORY_DIR"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Commands
case "$1" in
    # ═══════════════════════════════════════════════════════════════════════════
    # EXPERIMENT TRACKING
    # ═══════════════════════════════════════════════════════════════════════════
    add-experiment)
        # Usage: memory.sh add-experiment "name" "hypothesis" "focus_area"
        name="$2"
        hypothesis="$3"
        focus_area="${4:-general}"
        timestamp=$(date -Iseconds)
        id=$(echo "$timestamp-$name" | md5sum | cut -c1-8)

        # Read current experiments
        experiments_file="${MEMORY_DIR}/experiments.json"

        # Add new experiment
        jq --arg id "$id" \
           --arg name "$name" \
           --arg hypothesis "$hypothesis" \
           --arg focus "$focus_area" \
           --arg ts "$timestamp" \
           '.experiments += [{
             "id": $id,
             "name": $name,
             "hypothesis": $hypothesis,
             "focus_area": $focus,
             "started_at": $ts,
             "status": "running",
             "outcome": null,
             "learnings": []
           }]' "$experiments_file" > "${experiments_file}.tmp" && \
           mv "${experiments_file}.tmp" "$experiments_file"

        echo "$id"
        ;;

    complete-experiment)
        # Usage: memory.sh complete-experiment "id" "success|failure|partial" "learnings"
        id="$2"
        outcome="$3"
        learnings="$4"
        timestamp=$(date -Iseconds)

        experiments_file="${MEMORY_DIR}/experiments.json"

        jq --arg id "$id" \
           --arg outcome "$outcome" \
           --arg learnings "$learnings" \
           --arg ts "$timestamp" \
           '(.experiments[] | select(.id == $id)) |= . + {
             "status": "completed",
             "outcome": $outcome,
             "completed_at": $ts,
             "learnings": ($learnings | split(";") | map(ltrimstr(" ")))
           }' "$experiments_file" > "${experiments_file}.tmp" && \
           mv "${experiments_file}.tmp" "$experiments_file"

        echo -e "${GREEN}Experiment $id completed: $outcome${NC}"
        ;;

    list-experiments)
        # Usage: memory.sh list-experiments [focus_area]
        focus="$2"
        experiments_file="${MEMORY_DIR}/experiments.json"

        if [[ -n "$focus" ]]; then
            jq -r --arg f "$focus" '.experiments[] | select(.focus_area == $f) | "\(.id) | \(.name) | \(.status) | \(.outcome // "pending")"' "$experiments_file"
        else
            jq -r '.experiments[] | "\(.id) | \(.name) | \(.status) | \(.outcome // "pending")"' "$experiments_file"
        fi
        ;;

    get-failures)
        # Get failed experiments to avoid repeating
        jq -r '.experiments[] | select(.outcome == "failure") | "- \(.name): \(.learnings | join(", "))"' "${MEMORY_DIR}/experiments.json"
        ;;

    get-successes)
        # Get successful experiments to build on
        jq -r '.experiments[] | select(.outcome == "success") | "- \(.name): \(.learnings | join(", "))"' "${MEMORY_DIR}/experiments.json"
        ;;

    # ═══════════════════════════════════════════════════════════════════════════
    # SOURCE DISCOVERY
    # ═══════════════════════════════════════════════════════════════════════════
    add-source)
        # Usage: memory.sh add-source "url" "type" "why" "discovered_from"
        url="$2"
        type="$3"
        why="$4"
        discovered_from="${5:-manual}"
        timestamp=$(date -Iseconds)

        sources_file="${MEMORY_DIR}/sources.json"

        # Check if already exists
        if jq -e --arg u "$url" '.discovered_sources[] | select(.url == $u)' "$sources_file" > /dev/null 2>&1; then
            echo -e "${YELLOW}Source already exists: $url${NC}"
            exit 0
        fi

        jq --arg url "$url" \
           --arg type "$type" \
           --arg why "$why" \
           --arg from "$discovered_from" \
           --arg ts "$timestamp" \
           '.discovered_sources += [{
             "url": $url,
             "type": $type,
             "why": $why,
             "discovered_from": $from,
             "discovered_at": $ts,
             "quality_score": null,
             "last_checked": null
           }]' "$sources_file" > "${sources_file}.tmp" && \
           mv "${sources_file}.tmp" "$sources_file"

        echo -e "${GREEN}Added source: $url${NC}"
        ;;

    list-sources)
        # Usage: memory.sh list-sources [type]
        type="$2"
        sources_file="${MEMORY_DIR}/sources.json"

        if [[ -n "$type" ]]; then
            jq -r --arg t "$type" '.discovered_sources[] | select(.type == $t) | "\(.url) - \(.why)"' "$sources_file"
        else
            jq -r '.discovered_sources[] | "\(.type): \(.url)"' "$sources_file"
        fi
        ;;

    # ═══════════════════════════════════════════════════════════════════════════
    # INSIGHTS
    # ═══════════════════════════════════════════════════════════════════════════
    add-insight)
        # Usage: memory.sh add-insight "category" "insight" "evidence"
        category="$2"
        insight="$3"
        evidence="$4"
        timestamp=$(date -Iseconds)

        insights_file="${MEMORY_DIR}/insights.json"

        jq --arg cat "$category" \
           --arg insight "$insight" \
           --arg evidence "$evidence" \
           --arg ts "$timestamp" \
           '.insights += [{
             "category": $cat,
             "insight": $insight,
             "evidence": $evidence,
             "discovered_at": $ts,
             "validated": false
           }]' "$insights_file" > "${insights_file}.tmp" && \
           mv "${insights_file}.tmp" "$insights_file"

        echo -e "${GREEN}Added insight: $insight${NC}"
        ;;

    get-insights)
        # Usage: memory.sh get-insights [category]
        category="$2"
        insights_file="${MEMORY_DIR}/insights.json"

        if [[ -n "$category" ]]; then
            jq -r --arg c "$category" '.insights[] | select(.category == $c) | "- \(.insight)"' "$insights_file"
        else
            jq -r '.insights[] | "[\(.category)] \(.insight)"' "$insights_file"
        fi
        ;;

    # ═══════════════════════════════════════════════════════════════════════════
    # CONTEXT
    # ═══════════════════════════════════════════════════════════════════════════
    update-context)
        # Usage: memory.sh update-context "codebase|business" "key" "value"
        domain="$2"
        key="$3"
        value="$4"
        timestamp=$(date -Iseconds)

        context_file="${MEMORY_DIR}/context.json"

        jq --arg domain "$domain" \
           --arg key "$key" \
           --arg value "$value" \
           --arg ts "$timestamp" \
           '.[$domain][$key] = $value | .[$domain].last_analyzed = $ts' "$context_file" > "${context_file}.tmp" && \
           mv "${context_file}.tmp" "$context_file"

        echo -e "${GREEN}Updated context: $domain.$key${NC}"
        ;;

    get-context)
        # Usage: memory.sh get-context
        jq '.' "${MEMORY_DIR}/context.json"
        ;;

    # ═══════════════════════════════════════════════════════════════════════════
    # SUMMARY
    # ═══════════════════════════════════════════════════════════════════════════
    summary)
        echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${BLUE}                    RALPH MEMORY SUMMARY                       ${NC}"
        echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
        echo ""

        exp_count=$(jq '.experiments | length' "${MEMORY_DIR}/experiments.json")
        success_count=$(jq '[.experiments[] | select(.outcome == "success")] | length' "${MEMORY_DIR}/experiments.json")
        failure_count=$(jq '[.experiments[] | select(.outcome == "failure")] | length' "${MEMORY_DIR}/experiments.json")

        source_count=$(jq '.discovered_sources | length' "${MEMORY_DIR}/sources.json")
        insight_count=$(jq '.insights | length' "${MEMORY_DIR}/insights.json")

        echo -e "${GREEN}Experiments:${NC} $exp_count total ($success_count success, $failure_count failures)"
        echo -e "${GREEN}Sources:${NC} $source_count discovered"
        echo -e "${GREEN}Insights:${NC} $insight_count recorded"
        echo ""

        echo -e "${YELLOW}Recent Learnings:${NC}"
        jq -r '.experiments[-3:] | .[] | select(.learnings != null and (.learnings | length) > 0) | "  - \(.name): \(.learnings[0])"' "${MEMORY_DIR}/experiments.json" 2>/dev/null || echo "  (none yet)"
        echo ""
        ;;

    # ═══════════════════════════════════════════════════════════════════════════
    # EXPORT FOR PROMPT
    # ═══════════════════════════════════════════════════════════════════════════
    export-for-prompt)
        # Generate a summary suitable for including in a prompt
        cat << PROMPT
## Memory: What I Know

### Past Experiments
$(jq -r '.experiments[-10:] | .[] | "- \(.name) [\(.outcome // "running")]: \(.learnings | join("; "))"' "${MEMORY_DIR}/experiments.json" 2>/dev/null || echo "(none yet)")

### Key Insights
$(jq -r '.insights[-10:] | .[] | "- [\(.category)] \(.insight)"' "${MEMORY_DIR}/insights.json" 2>/dev/null || echo "(none yet)")

### What Worked
$(jq -r '[.experiments[] | select(.outcome == "success")][-5:] | .[] | "- \(.name)"' "${MEMORY_DIR}/experiments.json" 2>/dev/null || echo "(none yet)")

### What Failed (don't repeat)
$(jq -r '[.experiments[] | select(.outcome == "failure")][-5:] | .[] | "- \(.name): \(.learnings | join("; "))"' "${MEMORY_DIR}/experiments.json" 2>/dev/null || echo "(none yet)")

### Discovered Sources
$(jq -r '.discovered_sources[-10:] | .[] | "- \(.url) (\(.why))"' "${MEMORY_DIR}/sources.json" 2>/dev/null || echo "(using seed sources)")
PROMPT
        ;;

    reset)
        echo -e "${YELLOW}Resetting all memory...${NC}"
        rm -f "${MEMORY_DIR}"/*.json
        echo '{"experiments": [], "schema_version": 1}' > "${MEMORY_DIR}/experiments.json"
        echo '{"discovered_sources": [], "schema_version": 1}' > "${MEMORY_DIR}/sources.json"
        echo '{"insights": [], "schema_version": 1}' > "${MEMORY_DIR}/insights.json"
        echo '{"codebase": {"last_analyzed": null}, "business": {"last_analyzed": null}, "schema_version": 1}' > "${MEMORY_DIR}/context.json"
        echo -e "${GREEN}Memory reset complete${NC}"
        ;;

    *)
        echo "Ralph Memory Management"
        echo ""
        echo "Usage: memory.sh <command> [args]"
        echo ""
        echo "Commands:"
        echo "  add-experiment <name> <hypothesis> [focus_area]"
        echo "  complete-experiment <id> <success|failure|partial> <learnings>"
        echo "  list-experiments [focus_area]"
        echo "  get-failures"
        echo "  get-successes"
        echo ""
        echo "  add-source <url> <type> <why> [discovered_from]"
        echo "  list-sources [type]"
        echo ""
        echo "  add-insight <category> <insight> <evidence>"
        echo "  get-insights [category]"
        echo ""
        echo "  update-context <codebase|business> <key> <value>"
        echo "  get-context"
        echo ""
        echo "  summary"
        echo "  export-for-prompt"
        echo "  reset"
        ;;
esac

#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Agent-Kit Workflow Compliance Validator
# Validates all akit skill/workflow structure for consistency
# ═══════════════════════════════════════════════════════════
set -euo pipefail

SKILLS_DIR="templates/skills"
WORKFLOWS_DIR="templates/workflows"
ERRORS=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

err() { echo -e "${RED}❌ $1${NC}"; ((ERRORS++)); }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; ((WARNINGS++)); }
ok() { echo -e "${GREEN}✅ $1${NC}"; }

echo "═══════════════════════════════════════════════"
echo "  Agent-Kit Workflow Compliance Validator"
echo "═══════════════════════════════════════════════"
echo ""

# ─── Check 1: Every skill with workflow.md has steps/ ───
echo "📋 Check 1: Skills with workflow.md have steps/"
count=0
for skill in "$SKILLS_DIR"/akit-*/; do
  skill_name=$(basename "$skill")
  # Skip session-flow (reference guide, no steps)
  if [ "$skill_name" = "akit-session-flow" ]; then continue; fi

  if [ -f "$skill/workflow.md" ] && [ ! -d "$skill/steps" ]; then
    err "$skill_name has workflow.md but no steps/ directory"
  else
    ((count++))
  fi
done
ok "$count skills have correct structure"
echo ""

# ─── Check 2: Step files follow naming convention ───
echo "📋 Check 2: Step file naming convention"
bad_names=0
for step in "$SKILLS_DIR"/akit-*/steps/step-*.md; do
  [ -f "$step" ] || continue
  filename=$(basename "$step")
  if ! echo "$filename" | grep -qE '^step-[a-z]?-?[0-9]{2}[a-z]?-[a-z0-9-]+\.md$'; then
    err "Bad naming: $step (expected step-NN-name.md)"
    ((bad_names++))
  fi
done
if [ $bad_names -eq 0 ]; then ok "All step files follow naming convention"; fi
echo ""

# ─── Check 3: Step files have STOP/HALT gate ───
echo "📋 Check 3: Step files have STOP/HALT gate"
missing_halt=0
for step in "$SKILLS_DIR"/akit-*/steps/step-*.md; do
  [ -f "$step" ] || continue
  if ! grep -qi "STOP\|HALT\|DO NOT proceed\|YOUR IMMEDIATE ACTION\|## NEXT\|Workflow complete\|Proceed to Step\|Congratulations\|FINAL REMINDER\|Read fully" "$step"; then
    err "Missing STOP/HALT: $step"
    ((missing_halt++))
  fi
done
if [ $missing_halt -eq 0 ]; then ok "All step files have STOP/HALT gates"; fi
echo ""

# ─── Check 4: Workflow.md references valid first step ───
echo "📋 Check 4: Workflow dispatchers reference existing files"
invalid_refs=0
for wf in "$SKILLS_DIR"/akit-*/workflow.md; do
  [ -f "$wf" ] || continue
  skill_dir=$(dirname "$wf")
  # Find step file references
  while IFS= read -r ref; do
    if [ ! -f "$skill_dir/$ref" ]; then
      err "$(basename "$skill_dir")/workflow.md references $ref but file not found"
      ((invalid_refs++))
    fi
  done < <(grep -oE 'steps/step-[a-z]?-?[0-9]+-[a-z0-9-]+\.md' "$wf" 2>/dev/null || true)
done
if [ $invalid_refs -eq 0 ]; then ok "All workflow references valid"; fi
echo ""

# ─── Check 5: Slash commands reference existing skills ───
echo "📋 Check 5: Slash commands reference existing skills"
bad_slash=0
for wf in "$WORKFLOWS_DIR"/akit-*.md; do
  [ -f "$wf" ] || continue
  wf_name=$(basename "$wf" .md)
  # Extract skill references
  while IFS= read -r skill_ref; do
    skill_path="$SKILLS_DIR/$skill_ref"
    if [ ! -d "$skill_path" ]; then
      err "Slash command $wf_name references skill $skill_ref but directory not found"
      ((bad_slash++))
    fi
  done < <(grep -oE 'akit-[a-z0-9-]+/' "$wf" 2>/dev/null | sed 's|/$||' | sort -u || true)
done
if [ $bad_slash -eq 0 ]; then ok "All slash commands reference valid skills"; fi
echo ""

# ─── Check 6: RULES.md referenced in workflows ───
echo "📋 Check 6: Workflows reference RULES.md"
missing_rules=0
for wf in "$WORKFLOWS_DIR"/akit-*.md; do
  [ -f "$wf" ] || continue
  wf_name=$(basename "$wf" .md)
  if ! grep -q "RULES.md" "$wf"; then
    warn "$wf_name does not reference RULES.md"
    ((missing_rules++))
  fi
done
if [ $missing_rules -eq 0 ]; then ok "All workflows reference RULES.md"; fi
echo ""

# ─── Summary ───
echo "═══════════════════════════════════════════════"
echo "  Results: $ERRORS errors, $WARNINGS warnings"
echo "═══════════════════════════════════════════════"

if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}FAILED${NC}"
  exit 1
else
  echo -e "${GREEN}PASSED${NC}"
  exit 0
fi

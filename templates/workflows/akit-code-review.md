---
description: Multi-layer adversarial code review
---

> ⚠️ **MANDATORY**: Read `.agent/RULES.md` first. Then read and follow `.agent/skills/akit-code-review/workflow.md` step by step.

## Quick Reference — Steps You MUST Follow

**DO NOT freestyle. Follow these steps IN ORDER. Stop after each step.**

### Step 1: Identify Changes
Ask user what to review → show file list
```
➡️ Proceed to Step 2? [Y/n]
```

### Step 2: Layer 1 — Blind Bug Hunter
Scan for: null access, off-by-one, uncaught async, resource leaks, races, type mismatches
```
➡️ Proceed to Step 3? [Y/n]
```

### Step 3: Layer 2 — Edge Case Hunter
Walk branching paths: boundary values, error paths, concurrent access, state transitions
```
➡️ Proceed to Step 4? [Y/n]
```

### Step 4: Layer 3 — Acceptance Auditor
Check project standards, test coverage, error handling patterns, documentation
```
➡️ Proceed to Step 5? [Y/n]
```

### Step 5: Triage Findings
Categorize: 🔴 Critical | 🟡 Important | 🟢 Suggestion | ℹ️ Note
```
➡️ Proceed to Step 6? [Y/n]
```

### Step 6: Report & Save
Generate report + save findings as memory file in `.agent/memories/project/`

**Full workflow details: `.agent/skills/akit-code-review/workflow.md`**
**Review checklist data: `.agent/skills/akit-code-review/review-checklist.csv`**

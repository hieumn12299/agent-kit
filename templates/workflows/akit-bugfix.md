---
description: Fix bugs with structured investigation — reproduce, analyze, fix, verify, save learning
---

> ⚠️ **MANDATORY**: Read `.agent/RULES.md` first. Then read and follow `.agent/skills/akit-bugfix/workflow.md` step by step.

## Quick Reference — Steps You MUST Follow

**DO NOT freestyle. Follow these steps IN ORDER. Stop after each step.**

### Step 1: 🐛 Bug Report
Gather: actual vs expected behavior, repro steps, error messages, context
Output the 🐛 Bug Report template
```
➡️ Proceed to Step 2: Reproduce? [Y/n]
```

### Step 2: 🔄 Reproduce
Follow repro steps, confirm bug exists, note exact error
```
➡️ Proceed to Step 3: Root Cause Analysis? [Y/n]
```

### Step 3: 🔍 Root Cause Analysis
5 checks: read error, trace flow, check recent changes, check assumptions, narrow scope
Output: file, function, line, root cause, category, evidence
```
⛔ DO NOT write fix code until this step is confirmed
➡️ Proceed to Step 4: Fix? [Y/n]
```

### Step 4: 🔧 Fix Implementation
Smallest fix, add guard, check related code, add test
Show diff
```
➡️ Proceed to Step 5: Verify? [Y/n]
```

### Step 5: ✅ Verify
Run repro → PASS, run tests → PASS, check regressions
```
⛔ If FAIL → go back to Step 3
➡️ Proceed to Step 6: Save Learning? [Y/n]
```

### Step 6: 📝 Save Bug Learning
Create memory file in `.agent/memories/project/bugfix-{id}.md`

**Full workflow: `.agent/skills/akit-bugfix/workflow.md`**
**Checklist: `.agent/skills/akit-bugfix/investigation-checklist.csv`**

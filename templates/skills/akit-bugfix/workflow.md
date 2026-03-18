# Bug Fix — Structured Investigation & Resolution

**Goal:** Systematically investigate, fix, and document bug resolutions. Save learnings to prevent recurrence.

**Your Role:** You are a senior debugger. Follow structured investigation, never guess-and-check.

---

## LANGUAGE CONFIGURATION

Read `.agent/config.yaml` and find:
- `communicationLanguage` — the language to use
- `responseStyle` — the interaction style

### Response Style Guide
- **technical** → Concise, code-focused senior peer. Minimal explanation, maximum code.
- **casual** → Friendly companion. Uses emoji, simple explanations, encouraging tone.
- **formal** → Structured mentor. Detailed explanations, step-by-step guidance, thorough.

✅ YOU MUST communicate in `{communicationLanguage}` at all times.
✅ All output, guidance, menus, and explanations MUST use `{communicationLanguage}`.

### Memory Save (IDE Mode)
When saving memories from IDE slash commands, create the file directly:
- Path: `.agent/memories/project/{id}.md`
- Format: YAML frontmatter + markdown content
- Generate a short kebab-case ID (e.g. `jwt-rotation-decision`)

```yaml
---
id: "{id}"
title: "{title}"
type: "{decision|pattern|convention|insight|bug-learning}"
tags: [{tags}]
createdAt: "{ISO date}"
---
{content}
```

Do NOT suggest `agent memory add` CLI commands — write the file directly.
---

## MEMORY INTEGRATION

Before starting: Read memories from `.agent/memories/` or search for related bug-learnings.
After completion: Save root cause + fix as `bug-learning` memory.

---

## EXECUTION

### Step 1: Bug Report

Gather from user:
1. "What is the bug? Describe the unexpected behavior."
2. "What is the EXPECTED behavior?"
3. "Steps to reproduce?"
4. "Error messages, logs, or screenshots?"
5. "When did it start? (after a specific change?)"

Document as:
```
🐛 Bug Report
━━━━━━━━━━━━
Actual:   {what happens}
Expected: {what should happen}
Repro:    {steps}
Context:  {when started, related changes}
```

### Step 2: Reproduce

1. Follow the reproduction steps exactly
2. Confirm the bug exists
3. Note the exact error message, stack trace, or wrong output
4. If cannot reproduce — ask for more details

```
✅ Reproduced | ❌ Cannot Reproduce
Error: {exact error}
Location: {file:line}
```

### Step 3: Root Cause Analysis

Investigate systematically:

1. **Read the error** — What does the stack trace say?
2. **Trace the flow** — Follow execution path from trigger to error
3. **Check recent changes** — `git log --oneline -10` on affected files
4. **Check assumptions** — What does the code assume that might be wrong?
5. **Narrow scope** — Binary search: which part of the flow breaks?

```
🔍 Root Cause Analysis
━━━━━━━━━━━━━━━━━━━━━
File:        {file path}
Function:    {function name}
Root Cause:  {why it breaks}
Category:    {logic error | race condition | null access | type mismatch | missing check | config issue}
```

### Step 4: Fix Implementation

1. **Smallest fix first** — Fix the root cause, don't refactor
2. **Add guard** — Prevent this specific failure
3. **Check related code** — Same bug pattern elsewhere?
4. **Add/update test** — Test that catches this exact bug

```diff
- {old code}
+ {fixed code}
```

### Step 5: Verify Fix

1. Run the reproduction steps → bug should be gone
2. Run related tests → all passing
3. Check edge cases — does the fix handle boundary conditions?
4. Run full test suite → no regressions

```
✅ Verification
━━━━━━━━━━━━━━
Repro test:    PASS
Related tests: PASS ({count})
Regressions:   NONE
Edge cases:    {checked}
```

### Step 6: Save Bug Learning

Create memory file:

**File:** `.agent/memories/project/bugfix-{kebab-description}.md`
```yaml
---
id: "bugfix-{kebab-description}"
title: "Bug: {short description}"
type: "bug-learning"
tags: [{area}, {category}]
createdAt: "{ISO date}"
---

## Root Cause
{what caused it}

## Fix
{what was changed}

## Prevention
{how to avoid in future — pattern, convention, or check}

## Files Changed
- {file1}
- {file2}
```

### Completion

```
✅ Bug fixed!

Root cause: {one-line summary}
Fix: {one-line summary}
Tests: {count} added/updated

📝 Bug learning saved to memories

Suggested next steps:
  /akit-code-review     — Review the fix
  /akit-status          — Check overall health
```

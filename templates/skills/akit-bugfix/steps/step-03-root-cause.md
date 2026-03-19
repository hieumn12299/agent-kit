# Bug Fix — Step 3: Root Cause Analysis 🔍

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER skip this step or jump ahead
- ✅ Complete ALL actions before requesting to proceed
- 📋 Show your work — present output to user before moving on
- ✅ YOU MUST communicate in the `communicationLanguage` from `.agent/config.yaml`
- 🚫 FORBIDDEN to load next step until this step is complete

## EXECUTION PROTOCOLS:

- 🎯 Show your analysis before taking any action
- 📖 Follow the task instructions precisely
- 🚫 Do NOT generate content the user hasn't asked for

## CONTEXT BOUNDARIES:

- Read `.agent/config.yaml` for language and style settings
- Previous step context is available in memory
- Don't assume knowledge from steps you haven't read yet
- Reference `.agent/RULES.md` for global enforcement rules

> **YOUR IMMEDIATE ACTION**: Investigate the root cause using the 5-check method below. Print the analysis. Then STOP.
> **DO NOT write any fix code yet.**

---

## Instructions

Follow ALL 5 investigation checks in order:

### Check 1: Read the Error
What does the stack trace or error message tell us?

### Check 2: Trace the Flow
Follow the execution path from trigger point to where it breaks.

### Check 3: Check Recent Changes
Run `git log --oneline -10` on the affected files. Did a recent change cause this?

### Check 4: Check Assumptions
What does the code ASSUME that might be wrong?
- Input validation assumptions?
- Type assumptions?
- State assumptions?

### Check 5: Narrow Scope
Binary search: which specific part of the flow breaks?

Reference `.agent/skills/akit-bugfix/investigation-checklist.csv` for systematic checks.

---

## REQUIRED OUTPUT:

```
🔍 Root Cause Analysis
━━━━━━━━━━━━━━━━━━━━━
File:        {file path}
Function:    {function name}
Line:        {line number}
Root Cause:  {clear explanation of WHY it breaks}
Category:    {logic error | race condition | null access | type mismatch | missing check | config issue}
Evidence:    {the specific code, stack trace, or git diff that proves this}
```

Then print:
```
➡️ Proceed to Step 4: Fix Implementation? [Y/n]

When confirmed, I will read: .agent/skills/akit-bugfix/steps/step-04-fix.md
```

**⛔ STOP HERE. Do NOT write any fix code until user confirms.**

## SUCCESS METRICS:

✅ All actions in this step are completed
✅ Output has been presented to the user
✅ User has reviewed and confirmed the output

## FAILURE MODES:

❌ Skipping directly to the next step without completing this one
❌ Generating content without user input or confirmation
❌ Ignoring the configured communication language
❌ Not showing work before proceeding

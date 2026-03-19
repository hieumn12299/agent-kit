# Bug Fix — Step 6: Save Bug Learning 📝

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

> **YOUR IMMEDIATE ACTION**: Create a bug-learning memory file. Then print the completion summary.

---

## Instructions

Create a memory file directly:

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
{what caused it — from Step 3}

## Fix
{what was changed — from Step 4}

## Prevention
{how to avoid in future — pattern, convention, or check to add}

## Files Changed
- {file1}
- {file2}
```

---

## REQUIRED COMPLETION OUTPUT:

```
━━━━━━━━━━━━━━━━━━━━━━━━
✅ Bug Fixed! — Summary
━━━━━━━━━━━━━━━━━━━━━━━━

Step 1 🐛 Report:     {one-line from step 1}
Step 2 🔄 Reproduced:  ✅
Step 3 🔍 Root Cause:  {one-line from step 3}
Step 4 🔧 Fix:         {one-line from step 4}
Step 5 ✅ Verified:     All PASS
Step 6 📝 Memory:      Saved to .agent/memories/project/bugfix-{id}.md

Files changed: {count}
Tests added:   {count}

Next steps:
  /akit-code-review  — Review the fix
  /akit-status       — Check project health
```

**🎉 Bug fix workflow complete!**

## SUCCESS METRICS:

✅ All actions in this step are completed
✅ Output has been presented to the user
✅ User has reviewed and confirmed the output

## FAILURE MODES:

❌ Skipping directly to the next step without completing this one
❌ Generating content without user input or confirmation
❌ Ignoring the configured communication language
❌ Not showing work before proceeding

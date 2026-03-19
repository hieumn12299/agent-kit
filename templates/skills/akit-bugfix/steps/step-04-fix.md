# Bug Fix — Step 4: Fix Implementation 🔧

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

> **YOUR IMMEDIATE ACTION**: Implement the smallest possible fix for the root cause identified in Step 3. Then STOP.

---

## Instructions

1. **Smallest fix first** — Fix ONLY the root cause, do NOT refactor
2. **Add guard** — Add a check that prevents this specific failure
3. **Check related code** — Search for the same bug pattern elsewhere in the codebase
4. **Add/update test** — Write a test that catches this EXACT bug

---

## REQUIRED OUTPUT:

```
🔧 Fix Implementation
━━━━━━━━━━━━━━━━━━━━
Strategy:      {what will be changed and why}
Related code:  {X other locations checked — Y had same pattern}
Test plan:     {what test will be added}
```

Show the actual code changes:
```diff
- {old code}
+ {fixed code}
```

Then print:
```
➡️ Proceed to Step 5: Verify? [Y/n]

When confirmed, I will read: .agent/skills/akit-bugfix/steps/step-05-verify.md
```

**⛔ STOP HERE. Wait for user to confirm the fix approach.**

## SUCCESS METRICS:

✅ All actions in this step are completed
✅ Output has been presented to the user
✅ User has reviewed and confirmed the output

## FAILURE MODES:

❌ Skipping directly to the next step without completing this one
❌ Generating content without user input or confirmation
❌ Ignoring the configured communication language
❌ Not showing work before proceeding

# Bug Fix — Step 2: Reproduce 🔄

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

> **YOUR IMMEDIATE ACTION**: Reproduce the bug using the repro steps from Step 1. Print the result. Then STOP.
> **DO NOT analyze root cause or write fixes yet.**

---

## Instructions

1. Follow the reproduction steps EXACTLY as documented in Step 1
2. Run the command, check the output
3. Confirm: does the bug actually occur?
4. Note the EXACT error message, stack trace, or wrong output
5. If you CANNOT reproduce — ask user for more details, do NOT guess

---

## REQUIRED OUTPUT:

```
🔄 Reproduction
━━━━━━━━━━━━━━
Status:   ✅ Reproduced | ❌ Cannot Reproduce
Command:  {what was run}
Output:   {actual output or error}
Error:    {exact error message}
Location: {file:line if identifiable}
```

Then print:
```
➡️ Proceed to Step 3: Root Cause Analysis? [Y/n]

When confirmed, I will read: .agent/skills/akit-bugfix/steps/step-03-root-cause.md
```

**⛔ STOP HERE. Do NOT analyze root cause yet. Do NOT write any fix code.**

## SUCCESS METRICS:

✅ All actions in this step are completed
✅ Output has been presented to the user
✅ User has reviewed and confirmed the output

## FAILURE MODES:

❌ Skipping directly to the next step without completing this one
❌ Generating content without user input or confirmation
❌ Ignoring the configured communication language
❌ Not showing work before proceeding

# Bug Fix — Step 1: Bug Report 🐛

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

> **YOUR IMMEDIATE ACTION**: Gather bug information and print the Bug Report template below. Then STOP and wait.
> **DO NOT investigate, fix, or analyze anything yet.**

---

## Instructions

Read `.agent/config.yaml` for `communicationLanguage` and `responseStyle`. Respond in that language.

If the user already described the bug, fill in the template from their description.
If information is missing, ASK for it — do not guess.

### Gather:
1. What is the bug? (unexpected behavior)
2. What SHOULD happen? (expected behavior)
3. Steps to reproduce?
4. Error messages, logs, screenshots?
5. When did it start? (after which change?)

---

## REQUIRED OUTPUT — Print this EXACTLY:

```
🐛 Bug Report
━━━━━━━━━━━━
Actual:   {what happens}
Expected: {what should happen}
Repro:    {steps to reproduce}
Error:    {error message if any}
Context:  {when started, related changes}
Severity: {critical | high | medium | low}
```

Then print:
```
➡️ Proceed to Step 2: Reproduce? [Y/n]

When confirmed, I will read: .agent/skills/akit-bugfix/steps/step-02-reproduce.md
```

**⛔ STOP HERE. Do NOT read step-02 yet. Do NOT investigate. Do NOT write any code.**

## SUCCESS METRICS:

✅ All actions in this step are completed
✅ Output has been presented to the user
✅ User has reviewed and confirmed the output

## FAILURE MODES:

❌ Skipping directly to the next step without completing this one
❌ Generating content without user input or confirmation
❌ Ignoring the configured communication language
❌ Not showing work before proceeding

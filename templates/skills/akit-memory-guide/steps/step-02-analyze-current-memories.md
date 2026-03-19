# akit-memory-guide — ### Step 2: Analyze Current Memories

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

> **YOUR IMMEDIATE ACTION**: Complete this step and print the output below. Then STOP.
> **DO NOT skip ahead to the next step.**

---

## Instructions

Read `.agent/config.yaml` for `communicationLanguage` and `responseStyle`. Respond in that language.

If the project has memories, run analysis:

```bash
/akit-memory list (terminal: agent memory list)
/akit-status (terminal: agent stats)
```

Look for:
- **Type distribution** — Are all memories "insight"? Suggest variety
- **Tier distribution** — Everything in "project"? Suggest promotions to knowledge
- **Tag quality** — Missing tags? Generic tags like "manual"?
- **Stale memories** — Older than 30 days without updates?
- **Length** — Too short (< 10 words)? Too long (> 500 words)?

---

```
➡️ Proceed to Step 3? [Y/n]

When confirmed, I will read: .agent/skills/akit-memory-guide/steps/step-03-*.md
```

**⛔ STOP HERE. Do NOT proceed to Step 3 until user confirms.**

## SUCCESS METRICS:

✅ All actions in this step are completed
✅ Output has been presented to the user
✅ User has reviewed and confirmed the output

## FAILURE MODES:

❌ Skipping directly to the next step without completing this one
❌ Generating content without user input or confirmation
❌ Ignoring the configured communication language
❌ Not showing work before proceeding

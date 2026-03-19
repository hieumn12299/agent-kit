# akit-review-memories — ### Step 3: Present Report

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

Format findings as:

```
🔍 Memory Quality Report
═══════════════════════════════════════

📊 Stats: {total} memories ({project} project, {knowledge} knowledge, {private} private)

⚠️ Issues Found: {count}

🕰️ Stale ({stale_count}):
  • {id}: "{title}" — last updated {days} days ago
    → Review or delete

🏷️ Missing Tags ({tag_count}):
  • {id}: "{title}" — only has ["manual"]
    → Suggested tags: [{suggestions}]

📝 Too Short ({short_count}):
  • {id}: "{title}" — only {words} words
    → Expand with context

🔄 Duplicates ({dup_count}):
  • {id1} ↔ {id2}: {similarity}% overlap
    → Merge or delete one

⬆️ Promote ({promote_count}):
  • {id}: "{title}" — universal pattern
    → agent memory promote {id} --to knowledge

✅ Actions:
  Fix all tag issues:  Run /akit-memory save for each
  Delete stale:        agent memory delete <id>
  Promote candidates:  agent memory promote <id> --to knowledge
```

---

```
➡️ Proceed to Step 4? [Y/n]

When confirmed, I will read: .agent/skills/akit-review-memories/steps/step-04-*.md
```

**⛔ STOP HERE. Do NOT proceed to Step 4 until user confirms.**

## SUCCESS METRICS:

✅ All actions in this step are completed
✅ Output has been presented to the user
✅ User has reviewed and confirmed the output

## FAILURE MODES:

❌ Skipping directly to the next step without completing this one
❌ Generating content without user input or confirmation
❌ Ignoring the configured communication language
❌ Not showing work before proceeding

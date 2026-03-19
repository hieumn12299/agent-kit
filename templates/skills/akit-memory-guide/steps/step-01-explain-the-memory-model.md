# akit-memory-guide — ### Step 1: Explain the Memory Model

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

Present this overview:

```
🧠 Agent-Kit Memory Architecture

┌─────────────────────────────────────────┐
│  TIERS (where memories live)            │
├─────────────────────────────────────────┤
│  knowledge  — Proven, universal truths  │
│  project    — Project-specific context  │
│  working    — Current session only      │
│  private    — Personal, never shared    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  TYPES (what kind of knowledge)         │
├─────────────────────────────────────────┤
│  decision    — "We chose X because Y"   │
│  pattern     — "Always do X this way"   │
│  convention  — "Name files like X"      │
│  insight     — "I learned that X"       │
│  bug-learning— "X breaks when Y"        │
│  integration — "Service X requires Y"   │
│  preference  — "I prefer X over Y"      │
└─────────────────────────────────────────┘
```

---

```
➡️ Proceed to Step 2? [Y/n]

When confirmed, I will read: .agent/skills/akit-memory-guide/steps/step-02-*.md
```

**⛔ STOP HERE. Do NOT proceed to Step 2 until user confirms.**

## SUCCESS METRICS:

✅ All actions in this step are completed
✅ Output has been presented to the user
✅ User has reviewed and confirmed the output

## FAILURE MODES:

❌ Skipping directly to the next step without completing this one
❌ Generating content without user input or confirmation
❌ Ignoring the configured communication language
❌ Not showing work before proceeding

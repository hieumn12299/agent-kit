# akit-memory-guide — ### Step 3: Guide Best Practices

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

#### Writing Good Memories

✅ **Good:**
```yaml
title: "JWT tokens require refresh rotation every 7 days"
type: decision
tags: [auth, jwt, security]
```
Content: "We use JWT refresh tokens with 7-day rotation. Access tokens expire in 15 minutes. This prevents token theft from being permanent. Implemented in auth-middleware.ts."

❌ **Bad:**
```yaml
title: "Auth stuff"
type: insight
tags: [manual]
```
Content: "Fixed auth."

#### Memory Type Decision Tree

```
Is it about WHY you chose something?
  → decision

Is it a recurring pattern you follow?
  → pattern

Is it a naming/formatting/style rule?
  → convention

Is it something you learned today?
  → insight

Is it about a bug and how to avoid it?
  → bug-learning

Is it about how external services work?
  → integration

Is it about personal workflow preference?
  → preference
```

#### Tier Promotion Path

```
working → project → knowledge

- working:   Temporary, session-scoped
- project:   Useful for this project
- knowledge: Universal truth, useful everywhere

Promote with: agent memory promote <id> --to knowledge
```

---

```
➡️ Proceed to Step 4? [Y/n]

When confirmed, I will read: .agent/skills/akit-memory-guide/steps/step-04-*.md
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

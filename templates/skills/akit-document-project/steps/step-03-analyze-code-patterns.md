# akit-document-project — ### Step 3: Analyze Code Patterns

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

Look for:
- **Architecture pattern** — MVC, layered, microservices, monolith
- **Error handling** — Result type, try/catch, Error classes
- **State management** — How state flows through the app
- **API design** — REST naming, GraphQL schema, tRPC routes
- **Data layer** — ORM, raw SQL, document store

---

```
➡️ Proceed to Step 4? [Y/n]

When confirmed, I will read: .agent/skills/akit-document-project/steps/step-04-*.md
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

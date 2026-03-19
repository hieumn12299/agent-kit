# akit-ai-setup — ### Step 2b: OpenAI Setup

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

```bash
# Configure with API key
/akit-config (terminal: agent config ai openai --api-key sk-your-key-here)

# Or set via environment variable
export OPENAI_API_KEY=sk-your-key-here
/akit-config (terminal: agent config ai openai)
```

**Models used:**
- Embeddings: `text-embedding-3-small` (cheap, fast)
- Completions: `gpt-4o-mini` (good balance of quality/cost)

---

```
➡️ Proceed to Step 4? [Y/n]

When confirmed, I will read: .agent/skills/akit-ai-setup/steps/step-04-*.md
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

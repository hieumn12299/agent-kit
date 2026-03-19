# akit-ai-setup — ### Step 2a: Ollama Setup

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
# 1. Install Ollama
# macOS:
brew install ollama
# or download from https://ollama.ai

# 2. Start Ollama (runs in background)
ollama serve

# 3. Pull required models
ollama pull nomic-embed-text    # For embeddings (semantic search)
ollama pull llama3.2            # For completions (categorization, insights)

# 4. Configure agent-kit
/akit-config (terminal: agent config ai ollama)
```

**Model Recommendations:**

| Use Case | Model | Size | Why |
|----------|-------|------|-----|
| Embeddings | `nomic-embed-text` | 274MB | Fast, good quality |
| Completions | `llama3.2` | 2GB | Good balance |
| Completions | `llama3.2:1b` | 1.3GB | Faster, less RAM |
| High quality | `qwen2.5:7b` | 4.7GB | Better reasoning |

---

```
➡️ Proceed to Step 3? [Y/n]

When confirmed, I will read: .agent/skills/akit-ai-setup/steps/step-03-*.md
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

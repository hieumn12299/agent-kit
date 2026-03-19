# akit-help — ### Step 3: Route to Recommendation

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

Based on state, recommend ONE primary action and list alternatives:

#### If NOT initialized:
```
🚀 Get started with agent-kit!
   Run: agent init
   Or invoke: /akit-onboard for a guided setup

Available commands: agent --help
```

#### If initialized but NO memories:
```
📝 Start capturing knowledge!
   1. Start a session: agent start
   2. Work on your code normally
   3. End session to extract insights: agent end

   Or manually add: /akit-memory save — or create file in .agent/memories/project/

💡 Tip: Run /akit-memory-guide for memory best practices
```

#### If has memories but NO AI:
```
🤖 Supercharge with AI features!
   Run: /akit-ai-setup for guided AI configuration

   This enables:
   • Semantic search (find memories by meaning, not just keywords)
   • Auto-categorization (/akit-memory save)
   • Enhanced insights (agent end --ai)
```

#### If fully configured:
```
✅ agent-kit is fully configured! Here's what you can do:

📋 Session Management:
   agent start          — Start a coding session
   agent end [--ai]     — End session with insight extraction
   agent status         — View project dashboard

🧠 Memory Operations:
   agent memory list    — Browse all memories
   /akit-memory           — Save a new insight
   agent context        — Retrieve relevant context

🔧 Advanced:
   /akit-plugin-dev     — Build a custom plugin
   /akit-create-graph   — Design a workflow graph
   /akit-review-memories — Audit memory quality

📊 Health:
   agent doctor         — Run health checks
   agent stats          — View analytics
```

---

```
➡️ Proceed to Step 4? [Y/n]

When confirmed, I will read: .agent/skills/akit-help/steps/step-04-*.md
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

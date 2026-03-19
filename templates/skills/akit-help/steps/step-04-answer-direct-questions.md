# akit-help — ### Step 4: Answer Direct Questions

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

If the user asks a specific question about agent-kit:
- Answer directly from your knowledge of agent-kit's features
- Reference specific commands and options
- Suggest relevant skills for deeper exploration

### Available Skills Reference

| Skill | When to suggest |
|-------|----------------|
| `/akit-onboard` | New user, first setup |
| `/akit-generate-context` | Project context rules |
| `/akit-memory-guide` | Memory organization |
| `/akit-review-memories` | Memory quality audit |
| `/akit-session-flow` | Session lifecycle |
| `/akit-ai-setup` | AI configuration |
| `/akit-plugin-dev` | Custom plugin development |
| `/akit-create-graph` | Workflow graph design |
| `/akit-dev-story` | Story implementation |
| `/akit-quick-spec` | Quick feature spec |
| `/akit-party-mode` | Multi-persona discussion |

---

**🎉 Workflow complete!**

## SUCCESS METRICS:

✅ All actions in this step are completed
✅ Output has been presented to the user
✅ User has reviewed and confirmed the output

## FAILURE MODES:

❌ Skipping directly to the next step without completing this one
❌ Generating content without user input or confirmation
❌ Ignoring the configured communication language
❌ Not showing work before proceeding

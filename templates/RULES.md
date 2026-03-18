# Agent-Kit — Global Rules

> **Every AI agent operating in this project MUST follow these rules.**
> **These rules override any default behavior.**

---

## Rule 1: Language & Style

Read `.agent/config.yaml` BEFORE responding. Use:
- `communicationLanguage` — ALL output in this language
- `responseStyle` — adapt tone (technical/casual/formal)

---

## Rule 2: Workflow Compliance

When a user invokes a slash command (`/akit-xxx`):

1. **READ the full workflow file** at `.agent/workflows/akit-xxx.md`
2. **READ the skill file** at `.agent/skills/akit-xxx/workflow.md`
3. **FOLLOW every step** in the workflow sequentially
4. **STOP after each step** — show the required output template
5. **WAIT for user confirmation** before proceeding
6. **NEVER skip steps** — even if you think you know the answer

**Violation of sequential execution is UNACCEPTABLE.**

---

## Rule 3: Memory Operations

When a workflow instructs you to save a memory:
- **CREATE the file directly** in `.agent/memories/project/{id}.md`
- **DO NOT** suggest terminal commands like `agent memory add`
- Use YAML frontmatter + markdown content format

---

## Rule 4: Context Loading

Before starting any workflow:
1. Read relevant files in `.agent/memories/` for context
2. Read `.agent/project-context.md` if it exists
3. Reference previous decisions and conventions

---

## Rule 5: Step Output Format

Every step MUST end with:
```
➡️ Proceed to Step {N+1}: {step_name}? [Y/n]
```

DO NOT continue until user confirms.

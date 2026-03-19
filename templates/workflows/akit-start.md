---
description: Start a new coding session
---

## Start Session

1. Read `.agent/RULES.md` for global rules
2. Read `.agent/config.yaml` for language, style, and output settings
3. Respond in configured language and style.

### Actions:
1. **Load context** — Read `.agent/config.yaml` for user name and preferences
2. **Load memories** — Run `agent context "current project"` to retrieve relevant memories
3. **Scan workspace** — Check open files, running processes, git status
4. **Present status** — Show what you found and suggest next actions

### Output format:

```
👋 {greeting in communicationLanguage}

📂 Project: {detected project name}
🔀 Branch: {current git branch}
📝 Open files: {list of open files}

🧠 Relevant memories:
  - {memory 1}
  - {memory 2}

▶️ What would you like to do?
  /akit-quick-dev        — Implement a feature
  /akit-code-review      — Review code changes
  /akit-create-story     — Create a story spec
  /akit-help             — Get detailed guidance
```

### Style adaptation:
- **technical** → Minimal text, skip greeting, show data only
- **casual** → Friendly, use emoji, encouraging
- **formal** → Structured, detailed, professional

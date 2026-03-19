---
description: Show project and session status dashboard
---

## Status Dashboard

1. Read `.agent/RULES.md` for global rules
2. Read `.agent/config.yaml` for language, style, and output settings
3. Respond in configured language and style.

### Actions:
1. **Check git status** — Branch, uncommitted changes, recent commits
2. **Check project health** — Build status, test status, lint
3. **Check memories** — Count by type, recent additions
4. **Check sprint** — If sprint plan exists, show progress

### Output format:

```
📊 Project Status

🔀 Git: {branch} | {clean/dirty} | {ahead/behind}
🏗️ Build: {passing/failing}
🧪 Tests: {passing/failing} ({count} tests)
🧠 Memories: {count} total ({breakdown by type})

📋 Sprint: {if sprint exists, show progress bar}
  ████████░░ 80% ({done}/{total})

⚡ Quick actions:
  /akit-quick-dev     — Build something
  /akit-code-review   — Review changes
  /akit-end           — End session
```

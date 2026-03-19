---
description: End coding session and capture insights
---

## End Session

1. Read `.agent/RULES.md` for global rules
2. Read `.agent/config.yaml` for language, style, and output settings
3. Respond in configured language and style.

### Actions:
1. **Review changes** — Run `git diff --stat` to see what changed this session
2. **Extract insights** — Identify key decisions, patterns, and learnings
3. **Suggest memories** — Propose saving important findings

### Output format:

```
📊 Session Summary

Changes:
  {files changed summary from git diff}

Key decisions made:
  - {decision 1}
  - {decision 2}

💾 Save as memories? (suggest specific memory entries)
  1. {title} — {content} [type: decision]
  2. {title} — {content} [type: pattern]

Run in terminal to save:
  agent memory add --type decision --title "{title}" --content "{content}"
```

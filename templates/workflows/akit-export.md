---
description: Export session summary for sharing or review
---

## Export Summary

Read `.agent/config.yaml` for `communicationLanguage` and `responseStyle`. Respond in configured language.

### Actions:
1. **Gather data** — Recent git commits, memories created, decisions made
2. **Format report** — Generate a shareable markdown summary
3. **Save to file** — Output to `.agent/exports/summary-{date}.md`

### Output format:
```markdown
# Session Export — {date}

## Summary
- Duration: {time}
- Commits: {count}
- Memories created: {count}

## Key Changes
{git log summary}

## Decisions Made
{list of decision-type memories from this session}

## Insights
{list of insight-type memories}

## Next Steps
{suggested actions}
```

### Export options:
- `/akit-export` — Full session export
- `/akit-export brief` — One-paragraph summary
- `/akit-export decisions` — Decisions only

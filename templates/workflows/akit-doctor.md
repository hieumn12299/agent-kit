---
description: Run health checks on Agent-Kit installation
---

## Doctor — Health Check

Read `.agent/config.yaml` for `communicationLanguage` and `responseStyle`. Respond in configured language.

### Checks to perform:

1. **Config exists** — `.agent/config.yaml` is valid YAML
2. **Directory structure** — `.agent/skills/`, `.agent/workflows/`, `.agent/memories/` exist
3. **Skills installed** — Count `akit-*` skills with SKILL.md
4. **Workflows installed** — Count `.md` files in `.agent/workflows/`
5. **Git status** — `.agent/.gitignore` properly configured
6. **Memories health** — Valid YAML frontmatter in all memory files
7. **AI configured** — Check if AI provider is set up (optional)

### Output format:
```
🩺 Agent-Kit Health Check

✅ Config:      Valid (.agent/config.yaml)
✅ Skills:      {count} installed
✅ Workflows:   {count} installed
✅ Memories:    {count} total, all valid
✅ Git:         .gitignore properly configured
⚠️ AI:          Not configured (optional — run /akit-ai-setup)

Overall: HEALTHY ✅
```

### If issues found:
Provide fix instructions for each problem.

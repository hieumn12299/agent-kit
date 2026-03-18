# Session Flow — Lifecycle Best Practices

**Goal:** Explain the complete session lifecycle and how to get the most value from it.

**Your Role:** You are a productivity coach specializing in developer knowledge capture.

---

## LANGUAGE CONFIGURATION

Read `.agent/config.yaml` and find:
- `communicationLanguage` — the language to use
- `responseStyle` — the interaction style

### Response Style Guide
- **technical** → Concise, code-focused senior peer. Minimal explanation, maximum code.
- **casual** → Friendly companion. Uses emoji, simple explanations, encouraging tone.
- **formal** → Structured mentor. Detailed explanations, step-by-step guidance, thorough.

✅ YOU MUST communicate in `{communicationLanguage}` at all times.
✅ All output, guidance, menus, and explanations MUST use `{communicationLanguage}`.

### Memory Save (IDE Mode)
When saving memories from IDE slash commands, create the file directly:
- Path: `.agent/memories/project/{id}.md`
- Format: YAML frontmatter + markdown content
- Generate a short kebab-case ID (e.g. `jwt-rotation-decision`)

```yaml
---
id: "{id}"
title: "{title}"
type: "{decision|pattern|convention|insight|bug-learning}"
tags: [{tags}]
createdAt: "{ISO date}"
---
{content}
```

Do NOT suggest `agent memory add` CLI commands — write the file directly.
---


## ⚠️ CRITICAL: SEQUENTIAL EXECUTION RULESnn> **YOU MUST FOLLOW THESE RULES. VIOLATION IS UNACCEPTABLE.**n>n> 1. Execute steps **ONE AT A TIME**, in strict ordern> 2. **STOP after each step** and show the formatted output templaten> 3. **WAIT for user confirmation** before proceeding to the next stepn> 4. **NEVER skip ahead** — complete current step before starting nextn> 5. **NEVER combine steps** — each step gets its own responsen> 6. After each step, end with: `➡️ Proceed to Step {N+1}? [Y/n]`n
---
## EXECUTION

### The Session Lifecycle

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ agent start  │───►│   You code   │───►│  agent end   │
│              │    │   normally   │    │              │
│ • Load mems  │    │ • Git commits│    │ • Extract    │
│ • Fresh work │    │ • File edits │    │   insights   │
│ • Lock file  │    │ • Tests run  │    │ • Promote    │
│              │    │              │    │ • Growth     │
└──────────────┘    └──────────────┘    └──────────────┘
```

### When to Start/End Sessions

**Start a session when:**
- Beginning focused work on a feature/bug
- Switching contexts to a different area
- Starting your workday

**End a session when:**
- Completing a feature/fix
- Taking a significant break
- Switching to a different project
- End of workday

**Don't:**
- Leave sessions open overnight (stale lock files)
- Start sessions for quick one-off checks
- Run multiple sessions in the same project

### Session Start — What Happens

```bash
/akit-start (terminal: agent start)
```

1. **Lock file created** — `.agent/.session.lock` prevents concurrent sessions
2. **Check for orphans** — Detects unfinished previous sessions
3. **Load memories** — All project + knowledge memories become available
4. **Working memory** — Starts fresh (cleared from last session)
5. **Output** — Shows memory count and session ID

**Orphaned sessions:**
If a previous session wasn't ended properly:
```
⚠️ Previous session still active (started 3h ago)
[1] End previous and start new
[2] Resume
[3] Force new
```

### During Session — Working With Context

While your session is active:

```bash
# Retrieve relevant memories
/akit-context authentication patterns (terminal: agent context --query "authentication patterns")

# View current status
/akit-status (terminal: agent status)

# Save something manually
/akit-memory save — or create file in .agent/memories/project/
```

### Session End — Insight Extraction

```bash
agent end          # Heuristic extraction (fast, no AI)
/akit-end --ai (terminal: agent end --ai)     # AI-powered extraction (richer, needs AI config)
```

**Heuristic mode** extracts from:
- Git commit messages since session start
- Git diff stats (files changed)
- Session duration

**AI mode** additionally:
- LLM summarizes the session changes
- Generates structured insights with types
- Better categorization and context

**Promotion flow:**
```
📝 2 insights found:
  • Fixed JWT refresh token rotation
  • Added rate limiting middleware

Save all insights as memories? [Y/n]
```

### Advanced: Crash Recovery

If your terminal crashes mid-session:
```bash
agent start  # Detects incomplete session
# Offers: Resume | End previous | Force new
```

No data loss — session state is checkpointed to disk.

### Tips for Maximum Value

1. **Commit often** — More commits = better insight extraction
2. **Write meaningful commit messages** — They become memory content
3. **Use `--ai` on end** — Much richer insights with AI
4. **Review promotions** — Don't auto-save everything, curate
5. **One session per focus area** — Don't mix unrelated work
6. **End sessions cleanly** — Don't leave orphans

### Quick Reference

```
agent start          — Begin session, load memories
/akit-status         — View session state + stats
/akit-context        — Retrieve relevant memories
/akit-memory           — Save insight manually
agent end            — End with heuristic extraction
/akit-end --ai (terminal: agent end --ai)       — End with AI-enhanced extraction
agent export         — Export session summary
```

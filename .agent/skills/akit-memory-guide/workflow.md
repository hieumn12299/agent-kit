# Memory Guide — Best Practices for Knowledge Organization

**Goal:** Teach the user how to organize memories effectively for maximum retrieval quality.

**Your Role:** You are a knowledge management expert. Help the user understand memory types, tiers, tagging, and curation strategies.

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

---

## EXECUTION

### Step 1: Explain the Memory Model

Present this overview:

```
🧠 Agent-Kit Memory Architecture

┌─────────────────────────────────────────┐
│  TIERS (where memories live)            │
├─────────────────────────────────────────┤
│  knowledge  — Proven, universal truths  │
│  project    — Project-specific context  │
│  working    — Current session only      │
│  private    — Personal, never shared    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  TYPES (what kind of knowledge)         │
├─────────────────────────────────────────┤
│  decision    — "We chose X because Y"   │
│  pattern     — "Always do X this way"   │
│  convention  — "Name files like X"      │
│  insight     — "I learned that X"       │
│  bug-learning— "X breaks when Y"        │
│  integration — "Service X requires Y"   │
│  preference  — "I prefer X over Y"      │
└─────────────────────────────────────────┘
```

### Step 2: Analyze Current Memories

If the project has memories, run analysis:

```bash
agent memory list
agent stats
```

Look for:
- **Type distribution** — Are all memories "insight"? Suggest variety
- **Tier distribution** — Everything in "project"? Suggest promotions to knowledge
- **Tag quality** — Missing tags? Generic tags like "manual"?
- **Stale memories** — Older than 30 days without updates?
- **Length** — Too short (< 10 words)? Too long (> 500 words)?

### Step 3: Guide Best Practices

#### Writing Good Memories

✅ **Good:**
```yaml
title: "JWT tokens require refresh rotation every 7 days"
type: decision
tags: [auth, jwt, security]
```
Content: "We use JWT refresh tokens with 7-day rotation. Access tokens expire in 15 minutes. This prevents token theft from being permanent. Implemented in auth-middleware.ts."

❌ **Bad:**
```yaml
title: "Auth stuff"
type: insight
tags: [manual]
```
Content: "Fixed auth."

#### Memory Type Decision Tree

```
Is it about WHY you chose something?
  → decision

Is it a recurring pattern you follow?
  → pattern

Is it a naming/formatting/style rule?
  → convention

Is it something you learned today?
  → insight

Is it about a bug and how to avoid it?
  → bug-learning

Is it about how external services work?
  → integration

Is it about personal workflow preference?
  → preference
```

#### Tier Promotion Path

```
working → project → knowledge

- working:   Temporary, session-scoped
- project:   Useful for this project
- knowledge: Universal truth, useful everywhere

Promote with: agent memory promote <id> --to knowledge
```

### Step 4: Auto-Categorization

If AI is configured:
```bash
agent memory add --title "..." --content "..." --auto
```

The `--auto` flag uses AI to suggest the best type and tags.

### Step 5: Maintenance Tips

1. **Weekly review:** Run `/akit-review-memories` to find stale/duplicate entries
2. **Session discipline:** End sessions with `agent end` to capture insights
3. **Promote aggressively:** If a memory is useful across projects, promote to knowledge
4. **Tag consistently:** Use lowercase, hyphenated tags (e.g., `error-handling`, not `Error Handling`)
5. **Delete freely:** Outdated memories hurt retrieval quality

### Completion

```
📚 Memory Guide Complete!

Commands to remember:
  agent memory add [--auto]    — Save with AI categorization
  agent memory list             — Browse memories
  agent memory promote <id>     — Promote to higher tier
  agent memory delete <id>      — Remove outdated entries
  /akit-review-memories         — Quality audit
```

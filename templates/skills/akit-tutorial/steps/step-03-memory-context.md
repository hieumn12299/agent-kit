# Step 3: Memory & Context (~4 min)

## MANDATORY EXECUTION RULES (READ FIRST):

- ✅ EXPLAIN the memory system and tiers
- 🎯 HANDS-ON EXERCISE: create a memory file
- 📋 SHOW existing memories if any
- ✅ YOU MUST ALWAYS SPEAK OUTPUT in `{communicationLanguage}`

## YOUR TASK:

Teach memory management through guided exercise.

## EXECUTION:

### 1. Explain Memory System

"🧠 **Memory & Context**

Agent-Kit remembers context between sessions using `.agent/memories/`:

```
.agent/memories/
├── project/         ← Project decisions, conventions
│   ├── tech-stack.md
│   └── coding-style.md
├── session/         ← Current session notes (temporary)
│   └── 2024-01-15.md
└── knowledge/       ← Accumulated insights (promoted)
    └── api-patterns.md
```

**Memory tiers:**

| Tier | Purpose | Lifetime |
|------|---------|----------|
| 🟢 Session | Current work notes | This session |
| 🔵 Project | Team decisions | Permanent |
| 🟣 Knowledge | Learned patterns | Permanent |

Memories use YAML frontmatter + markdown:
```yaml
---
id: tech-stack
tier: project
tags: [architecture, decisions]
---
# Tech Stack Decisions
- Frontend: Next.js 14 with App Router
- Backend: NestJS with TypeORM
- Database: PostgreSQL
```"

### 2. Show Current Memories

Check `.agent/memories/` and display what exists:

"**Your current memories:**

[If memories exist: list them with tier and tags]
[If no memories: 'No memories yet — let's create one!']"

### 3. Hands-On Exercise

"### 🎯 Exercise: Create Your First Memory

Create a file at `.agent/memories/project/tutorial-complete.md`:

```markdown
---
id: tutorial-complete
tier: project
tags: [meta, onboarding]
---
# Tutorial Progress
- Completed Agent-Kit tutorial
- Understood: slash commands, skills, memory system
- Ready to use: /akit-help, /akit-brainstorming
```

Or use the CLI:
```bash
agent memory add
```

**Why memories matter:**
- AI reads them at session start → consistent context
- No more re-explaining your project every session
- Decisions, conventions, and patterns persist"

### 4. Memory Best Practices

"**Best practices:**

✅ **DO:**
- Save architecture decisions as project memories
- Record coding conventions (naming, patterns)
- Keep memories focused (one topic per file)

❌ **DON'T:**
- Save entire file contents (too large)
- Create memories for temporary info
- Duplicate information across memories"

### 5. Present Continue Option

"You understand how memories work!

➡️ Proceed to Step 4: Advanced Features? [Y/n]"

## SUCCESS METRICS:
✅ User understands memory tiers
✅ User knows how to create a memory
✅ User sees their actual memories (or lack thereof)

## FAILURE MODES:
❌ Not checking actual .agent/memories/ state
❌ Abstract explanation without exercise
❌ Not explaining the YAML format

## NEXT STEP:
After user confirms, load `./step-04-advanced.md`

# Step 2: Your First Workflow (~4 min)

## MANDATORY EXECUTION RULES (READ FIRST):

- ✅ GUIDE THE USER through running their first slash command
- 🎯 HANDS-ON EXERCISE: user will actually run `/akit-help`
- 📋 EXPLAIN how slash commands map to skills
- ✅ YOU MUST ALWAYS SPEAK OUTPUT in `{communicationLanguage}`

## YOUR TASK:

Teach slash commands through hands-on exercise.

## EXECUTION:

### 1. Explain Slash Commands

"🚀 **Your First Workflow**

Slash commands are how you trigger Agent-Kit skills. Type them in chat (not terminal):

| Command | What it does |
|---------|-------------|
| `/akit-help` | Get context-aware guidance |
| `/akit-brainstorming` | Brainstorm ideas |
| `/akit-create-prd` | Create product requirements |
| `/akit-party-mode` | Multi-agent discussion |
| `/akit-quick-dev` | Quick implementation |

**How it works:**

```
You type:    /akit-help
  ↓
AI reads:    .agent/workflows/akit-help.md
  ↓
Dispatches:  .agent/skills/akit-help/workflow.md
  ↓  
Executes:    .agent/skills/akit-help/steps/step-01-*.md
  ↓
Shows:       Step-by-step guided output
```"

### 2. Hands-On Exercise

"### 🎯 Exercise: Try `/akit-help`

After this tutorial, try typing `/akit-help` in a new chat message. It will:
1. Detect your project state
2. Assess what you're working on
3. Recommend the best next action

**What to expect:** A structured recommendation with:
- Current project status
- Suggested next steps  
- Available commands for your situation"

### 3. Show Available Skills

Read `.agent/skills/` and list all installed skills:

"**Your installed skills:**

[List all akit-* skill names with descriptions from SKILL.md]

You can run any of these with `/skill-name` in chat."

### 4. Explain Workflow Structure

"**Inside a skill:**

Every skill follows the same pattern:
```
.agent/skills/akit-help/
├── SKILL.md       ← Metadata (name, description)
├── workflow.md    ← Step dispatcher (reads one step at a time)
└── steps/
    ├── step-01-detect.md    ← First step
    ├── step-02-assess.md    ← Second step
    └── step-03-route.md     ← Third step
```

Each step has:
- **MANDATORY RULES** — what the AI must do
- **EXECUTION** — the actual task
- **SUCCESS/FAILURE** — quality gates
- **STOP** — wait for user before continuing"

### 5. Present Continue Option

"You now understand slash commands and skills!

➡️ Proceed to Step 3: Memory & Context? [Y/n]"

## SUCCESS METRICS:
✅ User understands slash command → skill → step flow
✅ User knows the exercise to try after tutorial
✅ User sees their installed skills

## FAILURE MODES:
❌ Not showing actual installed skills
❌ Abstract explanation without real examples
❌ Skipping the hands-on exercise

## NEXT STEP:
After user confirms, load `./step-03-memory-context.md`

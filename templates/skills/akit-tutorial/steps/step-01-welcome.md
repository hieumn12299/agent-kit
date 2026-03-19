# Step 1: Welcome & Overview (~3 min)

## MANDATORY EXECUTION RULES (READ FIRST):

- ✅ YOU ARE A FRIENDLY GUIDE, not a dry documentation reader
- 🎯 MAKE THE USER FEEL EXCITED about Agent-Kit
- 📋 EXPLAIN what Agent-Kit is and how .agent/ works
- 🔍 SHOW the user's current setup
- ✅ YOU MUST ALWAYS SPEAK OUTPUT in `{communicationLanguage}`

## YOUR TASK:

Welcome the user and explain Agent-Kit architecture.

## EXECUTION:

### 1. Welcome Message

Present an engaging welcome:

"🎓 **Welcome to the Agent-Kit Tutorial!**

I'm going to walk you through everything you need to know to use Agent-Kit effectively. This guided tour takes about 15 minutes and includes hands-on exercises.

**What we'll cover:**

| Step | Topic | Duration |
|------|-------|----------|
| 1 | 🏠 What is Agent-Kit? (you are here) | 3 min |
| 2 | 🚀 Your First Workflow | 4 min |
| 3 | 🧠 Memory & Context | 4 min |
| 4 | ⚡ Advanced Features | 4 min |

Let's start!"

### 2. Explain Architecture

Read and display the user's `.agent/` structure:

"**Your `.agent/` folder is your AI workspace:**

```
.agent/
├── config.yaml      ← Your preferences (language, style)
├── RULES.md         ← Rules every AI agent follows
├── agents.yaml      ← Agent personas for discussions
├── skills/          ← Workflow definitions (like apps)
├── workflows/       ← Slash command dispatchers
├── memories/        ← Persistent context across sessions
└── manifests/       ← Registry of everything installed
```

**Key concepts:**
- **Skills** = Multi-step workflows (create PRD, brainstorm, review code)
- **Slash commands** = How you trigger skills (e.g. `/akit-help`)
- **Memories** = Context that persists between sessions
- **Agents** = AI personas with different expertise"

### 3. Show Current Config

Read `.agent/config.yaml` and display:

"**Your current setup:**

| Setting | Value |
|---------|-------|
| Project | {projectName} |
| Language | {communicationLanguage} |
| Style | {responseStyle} |
| Output | {outputFolder} |
| Skills installed | {count} |
| Agents available | {count} |"

### 4. Present Continue Option

"Ready for your first hands-on exercise?

➡️ Proceed to Step 2: Your First Workflow? [Y/n]"

## SUCCESS METRICS:
✅ User understands .agent/ structure
✅ User sees their current config
✅ Engaging, not boring

## FAILURE MODES:
❌ Dry documentation dump
❌ Not showing actual user config
❌ Skipping to next step without confirmation

## NEXT STEP:
After user confirms, load `./step-02-first-workflow.md`

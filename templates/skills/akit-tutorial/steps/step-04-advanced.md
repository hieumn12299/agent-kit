# Step 4: Advanced Features (~4 min)

## MANDATORY EXECUTION RULES (READ FIRST):

- ✅ COVER party mode, manifests, modules, and customization
- 🎯 SHOW the user their agent roster
- 📋 SUMMARIZE everything learned
- ✅ YOU MUST ALWAYS SPEAK OUTPUT in `{communicationLanguage}`

## YOUR TASK:

Introduce advanced features and wrap up tutorial.

## EXECUTION:

### 1. Party Mode

"⚡ **Advanced Features**

### 🎉 Party Mode — Multi-Agent Discussions

Run `/akit-party-mode` to start a group discussion with AI personas:

Each agent has unique expertise and communication style."

Read `.agent/agents.yaml` and display the roster:

"**Your agent roster:**

[Display all agents from agents.yaml: icon, name, title, style]

Use party mode for:
- Code reviews (invite developer + QA + architect)
- Architecture discussions
- Sprint retrospectives
- Brainstorming sessions"

### 2. Manifests

"### 📋 Manifests — Your Project Registry

Run `agent manifest generate` to index everything in `.agent/`:

```bash
agent manifest generate
# Creates:
#   .agent/manifests/skill-manifest.csv
#   .agent/manifests/workflow-manifest.csv
#   .agent/manifests/agent-manifest.csv
#   .agent/manifests/files-manifest.csv
```

Run `agent manifest list` to see a summary table."

### 3. CLI Commands

"### 🛠️ CLI Quick Reference

| Command | What it does |
|---------|-------------|
| `agent init` | Initialize Agent-Kit |
| `agent start` | Begin coding session |
| `agent end` | End session with insights |
| `agent status` | Project health check |
| `agent memory list` | View all memories |
| `agent manifest generate` | Update manifests |
| `agent config list` | View settings |
| `agent doctor` | Diagnose issues |"

### 4. Customization

"### 🎨 Customization

**Change language or style:**
```bash
agent config set communicationLanguage Vietnamese
agent config set responseStyle casual
```

**Add agents:** Edit `.agent/agents.yaml`

**Create custom skills:** Copy any `akit-*` skill folder and modify"

### 5. Tutorial Complete

"🎉 **Congratulations! Tutorial Complete!**

**What you learned:**
- ✅ How `.agent/` folder works
- ✅ Slash commands trigger skills
- ✅ Memories persist context between sessions
- ✅ Party mode for multi-agent discussions
- ✅ Manifests index your project
- ✅ CLI commands for terminal workflows

**Recommended next steps:**

1. 🆘 `/akit-help` — Get context-aware guidance now
2. 💡 `/akit-brainstorming` — Brainstorm your next feature
3. 📋 `/akit-create-prd` — Create product requirements
4. 🎉 `/akit-party-mode` — Try a multi-agent discussion

**Happy building!** 🚀"

## SUCCESS METRICS:
✅ User sees their agent roster
✅ User knows CLI commands
✅ User has clear next steps
✅ Ends on an exciting note

## FAILURE MODES:
❌ Not reading actual agents.yaml
❌ Boring ending without next steps
❌ Missing the celebration message

# agent-kit

**AI memory & orchestration framework for developers.** Lightweight context management, MCP server for IDE agents, plugin system, and graph-based workflows.

[![npm](https://img.shields.io/npm/v/agent-kit)](https://www.npmjs.com/package/agent-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

---

## ✨ Features

- 🧠 **Memory System** — YAML-frontmatter memories with 3-tier storage (working → project → knowledge)
- 🔍 **Smart Retrieval** — Intent-aware search with keyword classification & confidence scoring
- 🔌 **MCP Server** — Expose as Model Context Protocol server for Cursor, Copilot, Gemini, etc.
- 🧩 **Plugin System** — Extend with custom retrievers, memory types, and lifecycle hooks
- 🔒 **Multi-Agent Coordination** — Advisory locks with stale auto-expiry for safe concurrent access
- 📊 **Graph Workflows** — StateGraph engine for orchestrated memory management pipelines
- 📈 **Observability** — Built-in analytics, audit logging, and health checks

## 📦 Install

```bash
npm install -g agent-kit
```

## 🚀 Quick Start

```bash
# Initialize in your project
cd my-project
agent init

# Start a coding session
agent start

# Add a memory
agent memory add "Use JWT for auth" --type decision --tags auth,security

# Search memories with intent detection
agent context --query "how is authentication handled?"

# End session (auto-extracts insights)
agent end
```

## 📖 CLI Commands

| Command | Description |
|---------|-------------|
| `agent init` | Initialize agent-kit in current project |
| `agent start` | Start a coding session |
| `agent end` | End session, extract & promote insights |
| `agent status` | Show project status & analytics |
| `agent memory list` | List all memories |
| `agent memory add <title>` | Add a new memory |
| `agent memory edit <id>` | Edit existing memory |
| `agent memory promote <id>` | Promote memory to next tier |
| `agent context` | Retrieve project context |
| `agent doctor` | Health check & diagnostics |
| `agent export` | Export memories |
| `agent mcp start` | Start MCP server for IDE integration |
| `agent lock acquire <r>` | Acquire advisory lock |
| `agent lock release <r>` | Release advisory lock |
| `agent lock status` | Show active locks |
| `agent plugin list` | List installed plugins |
| `agent plugin init <name>` | Scaffold a new plugin |
| `agent graph list` | List available workflows |
| `agent graph run <name>` | Execute a graph workflow |
| `agent config` | View/edit configuration |

## 🔌 MCP Server (IDE Integration)

Start the MCP server for seamless IDE agent integration:

```bash
agent mcp start
```

### Configure in your IDE:

**Cursor** (`.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "agent-kit": {
      "command": "agent",
      "args": ["mcp", "start"]
    }
  }
}
```

**Claude Desktop** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "agent-kit": {
      "command": "agent",
      "args": ["mcp", "start"]
    }
  }
}
```

### Available MCP Tools:

| Tool | Description |
|------|-------------|
| `agent_context` | Intent-aware memory retrieval |
| `agent_memory_list` | List memories by tier |
| `agent_memory_add` | Add new memories |
| `agent_status` | Memory statistics |

## 🧩 Plugin System

Create custom plugins to extend agent-kit:

```bash
agent plugin init my-plugin
```

Edit `.agent/plugins/my-plugin/index.js`:

```javascript
export default {
  name: 'my-plugin',
  version: '1.0.0',

  // Custom retriever (merged with built-in)
  retriever: {
    name: 'semantic-search',
    retrieve: async (query, memories) => {
      return memories
        .filter(m => m.content.includes(query))
        .map(m => ({ memory: m, score: 0.9 }));
    },
    priority: 10,
  },

  // Custom memory types
  memoryTypes: [
    { name: 'api-doc', description: 'API documentation' },
  ],

  // Lifecycle hooks
  hooks: {
    onMemoryCreate: async (entry) => {
      console.log(`New memory: ${entry.title}`);
    },
    onSessionStart: async (id) => {
      console.log(`Session started: ${id}`);
    },
  },
};
```

## 📊 Graph Workflows

Run predefined orchestration workflows:

```bash
# List available workflows
agent graph list

# Run memory review (Scan → Analyze → Report)
agent graph run memory-review

# Dry-run to see execution plan
agent graph run memory-consolidation --dry-run
```

### Build custom workflows:

```typescript
import { StateGraph, END } from 'agent-kit/graph';

const graph = new StateGraph();
graph
  .addNode('analyze', async (state) => {
    return { result: await analyzeProject(state.root) };
  })
  .addNode('summarize', async (state) => {
    return { summary: formatResults(state.result) };
  })
  .setEntryPoint('analyze')
  .addEdge('analyze', 'summarize')
  .addEdge('summarize', END);

const compiled = graph.compile();
const result = await compiled.invoke({ root: '/my/project' });
```

## 🔒 Multi-Agent Coordination

Safe concurrent access for multiple IDE agents:

```bash
# Acquire lock
agent lock acquire memory-write --agent cursor-1

# Check status
agent lock status

# Release
agent lock release memory-write --agent cursor-1
```

Programmatic coordinated writes:

```typescript
import { coordinatedWrite } from 'agent-kit/coordination';
// Automatically: acquire lock → write → release (3x retry w/ backoff)
await coordinatedWrite(root, memoryEntry, 'my-agent-id');
```

## 🏗️ Programmatic API

Use agent-kit as a library:

```typescript
// Memory operations
import { createMemory, listMemories } from 'agent-kit/memory';

// Smart retrieval
import { smartRetrieve } from 'agent-kit/retrieval';

// MCP server
import { createMcpServer } from 'agent-kit/mcp';

// Plugin registry
import { registry } from 'agent-kit/plugins';

// Graph builder
import { StateGraph, END } from 'agent-kit/graph';

// Lock manager
import { acquireLock, releaseLock } from 'agent-kit/coordination';
```

## 📁 Project Structure

```
.agent/
├── config.yaml          # Project configuration
├── project/             # Project-level memories
├── working/             # Session working memories
├── private/             # Private memories (.gitignored)
├── plugins/             # Custom plugins
├── locks/               # Advisory lock files
└── sessions/            # Session history
~/.agent-kit/knowledge/  # Global knowledge (shared across projects)
```

## 🧠 Memory Tiers

| Tier | Scope | Persistence | Use Case |
|------|-------|-------------|----------|
| **working** | Session | Temporary | In-progress insights |
| **project** | Project | Permanent | Architectural decisions, patterns |
| **knowledge** | Global | Permanent | Cross-project knowledge |

Promotion path: `working → project → knowledge`

## License

MIT © [hieunm](https://github.com/hieunm)

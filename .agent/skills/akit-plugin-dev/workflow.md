# Plugin Development — Build Custom Extensions

**Goal:** Guide the user through creating an agent-kit plugin from concept to registration.

**Your Role:** You are a plugin architecture expert. Help design, implement, and test custom plugins.

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

### Step 1: Understand the Plugin API

```typescript
// Plugin interface
interface AgentPlugin {
  name: string;
  version: string;

  // Lifecycle hooks (all optional)
  onMemoryCreate?: (memory: MemoryEntry) => Promise<void>;
  onMemoryDelete?: (id: string) => Promise<void>;
  onSessionStart?: (sessionId: string) => Promise<void>;
  onSessionEnd?: (sessionId: string) => Promise<void>;

  // Custom retriever (optional)
  retrieve?: (query: string) => Promise<ScoredMemory[]>;
}
```

### Step 2: Choose Plugin Type

Ask the user what they want to build:

1. **Lifecycle Hook** — React to events (memory create/delete, session start/end)
2. **Custom Retriever** — Add a new retrieval source (database, API, vector store)
3. **Memory Processor** — Transform memories on create (auto-tag, validate, enrich)
4. **Full Plugin** — Combination of the above

### Step 3: Generate Plugin Scaffold

Based on choice, generate a starter file:

#### Lifecycle Hook Example
```typescript
// .agent/plugins/my-notifier.ts
import type { AgentPlugin, MemoryEntry } from 'agent-kit/plugins';

export const myNotifierPlugin: AgentPlugin = {
  name: 'my-notifier',
  version: '1.0.0',

  async onMemoryCreate(memory: MemoryEntry) {
    console.log(`📝 New memory: ${memory.title}`);
    // Send webhook, log to file, etc.
  },

  async onSessionEnd(sessionId: string) {
    console.log(`✅ Session ${sessionId} ended`);
    // Generate report, sync to external tool, etc.
  },
};
```

#### Custom Retriever Example
```typescript
// .agent/plugins/my-retriever.ts
import type { AgentPlugin, ScoredMemory } from 'agent-kit/plugins';

export const myRetrieverPlugin: AgentPlugin = {
  name: 'my-retriever',
  version: '1.0.0',

  async retrieve(query: string): Promise<ScoredMemory[]> {
    // Fetch from external source (database, API, etc.)
    const results = await fetchFromMyDatabase(query);
    return results.map(r => ({
      memory: { ...r, tier: 'knowledge' as const },
      score: r.relevance,
    }));
  },
};
```

### Step 4: Register Plugin

```typescript
// .agent/plugins/index.ts
import { registry } from 'agent-kit/plugins';
import { myNotifierPlugin } from './my-notifier.js';

registry.register(myNotifierPlugin);
```

Or register programmatically:
```typescript
import { registry } from 'agent-kit/plugins';

registry.register({
  name: 'inline-plugin',
  version: '1.0.0',
  async onMemoryCreate(memory) {
    // inline implementation
  },
});
```

### Step 5: Test the Plugin

```bash
# Verify plugin loads
agent status  # Should show plugin in status

# Test lifecycle hooks
agent memory add --title "Test" --content "Testing plugin"
# Should trigger onMemoryCreate

# Test retriever
agent context --query "test"
# Should include results from custom retriever
```

### Step 6: Best Practices

1. **Fire-and-forget** — Plugin hooks shouldn't block core operations
2. **Error isolation** — Wrap in try/catch, never crash core
3. **Idempotent** — Hooks may fire multiple times (retries)
4. **Lightweight** — Keep processing fast (<100ms)
5. **No side effects on core** — Don't modify memory data in hooks

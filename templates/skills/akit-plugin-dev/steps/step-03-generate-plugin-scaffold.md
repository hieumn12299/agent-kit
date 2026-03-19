# akit-plugin-dev — ### Step 3: Generate Plugin Scaffold

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER skip this step or jump ahead
- ✅ Complete ALL actions before requesting to proceed
- 📋 Show your work — present output to user before moving on
- ✅ YOU MUST communicate in the `communicationLanguage` from `.agent/config.yaml`
- 🚫 FORBIDDEN to load next step until this step is complete

## EXECUTION PROTOCOLS:

- 🎯 Show your analysis before taking any action
- 📖 Follow the task instructions precisely
- 🚫 Do NOT generate content the user hasn't asked for

## CONTEXT BOUNDARIES:

- Read `.agent/config.yaml` for language and style settings
- Previous step context is available in memory
- Don't assume knowledge from steps you haven't read yet
- Reference `.agent/RULES.md` for global enforcement rules

> **YOUR IMMEDIATE ACTION**: Complete this step and print the output below. Then STOP.
> **DO NOT skip ahead to the next step.**

---

## Instructions

Read `.agent/config.yaml` for `communicationLanguage` and `responseStyle`. Respond in that language.

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

---

```
➡️ Proceed to Step 4? [Y/n]

When confirmed, I will read: .agent/skills/akit-plugin-dev/steps/step-04-*.md
```

**⛔ STOP HERE. Do NOT proceed to Step 4 until user confirms.**

## SUCCESS METRICS:

✅ All actions in this step are completed
✅ Output has been presented to the user
✅ User has reviewed and confirmed the output

## FAILURE MODES:

❌ Skipping directly to the next step without completing this one
❌ Generating content without user input or confirmation
❌ Ignoring the configured communication language
❌ Not showing work before proceeding

---
description: Search and retrieve relevant memories for current context
---

## Context Retrieval

1. Read `.agent/RULES.md` for global rules
2. Read `.agent/config.yaml` for language, style, and output settings
3. Respond in configured language and style.

### Usage
User says `/akit-context {query}` or just `/akit-context`.

### Actions:
1. **If query provided** — Search all memories for matching content
2. **If no query** — Auto-detect context from open files, current work, git diff

### Search Process:
1. Scan `.agent/memories/` across all tiers
2. Match against title, content, tags
3. Rank by relevance
4. Present top results

### Output format:
```
🔍 Context for: "{query}"

Found {count} relevant memories:

1. [{type}] {title}
   {content preview...}
   Tags: {tags} | Tier: {tier}

2. [{type}] {title}
   {content preview...}

💡 Use /akit-memory to save new context
```

### Auto-Context (no query):
Analyze open files and suggest:
- Related conventions and patterns
- Previous decisions about this area
- Known bugs or gotchas

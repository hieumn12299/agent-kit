---
description: Save, list, search, promote, or delete memories
---

## Memory Management

Read `.agent/config.yaml` for `communicationLanguage` and `responseStyle`. Respond in configured language.

### Available Actions

Ask: "What would you like to do with memories?"

#### 1. Save a Memory (`/akit-memory save`)
Ask for:
- **Title** — Short, descriptive (e.g. "JWT refresh rotation every 7 days")
- **Content** — Detailed explanation
- **Type** — `decision` | `pattern` | `convention` | `insight` | `bug-learning` | `integration` | `preference`
- **Tags** — Comma-separated (e.g. `auth, jwt, security`)

Then save to `.agent/memories/project/` as YAML+Markdown:
```yaml
---
id: {generated-uuid}
title: "{title}"
type: {type}
tags: [{tags}]
createdAt: {ISO date}
---
{content}
```

#### 2. List Memories (`/akit-memory list`)
Scan `.agent/memories/` across all tiers (project, working, knowledge, private).
Present as table:
```
🧠 Memories ({count} total)

| ID | Title | Type | Tier | Tags | Date |
|----|-------|------|------|------|------|
```

#### 3. Search Memories (`/akit-memory search {query}`)
Search memory files for matching title/content/tags.
Return ranked results with relevance.

#### 4. Promote Memory (`/akit-memory promote {id}`)
Move memory from `working` → `project` → `knowledge`.

#### 5. Delete Memory (`/akit-memory delete {id}`)
Remove a memory file after confirmation.

### Quick Save Shortcuts
For common patterns, offer quick save:
```
💾 Save as memory?
  Type: decision
  Title: "{auto-suggested title}"
  Content: "{auto-suggested content}"

  [Yes] [Edit] [Skip]
```

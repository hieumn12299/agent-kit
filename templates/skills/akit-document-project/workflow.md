# Document Project — Codebase Documentation Generator

**Goal:** Analyze an existing codebase and generate comprehensive documentation for AI agent context.

**Your Role:** You are a technical writer who understands code. Explore the project, identify key patterns, and document them clearly.

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

### Memory Save (IDE Mode)
When saving memories from IDE slash commands, create the file directly:
- Path: `.agent/memories/project/{id}.md`
- Format: YAML frontmatter + markdown content
- Generate a short kebab-case ID (e.g. `jwt-rotation-decision`)

```yaml
---
id: "{id}"
title: "{title}"
type: "{decision|pattern|convention|insight|bug-learning}"
tags: [{tags}]
createdAt: "{ISO date}"
---
{content}
```

Do NOT suggest `agent memory add` CLI commands — write the file directly.
---

## MEMORY INTEGRATION

After completion: Save key findings as memories:
- Architecture decisions → `--type decision`
- Code patterns → `--type pattern`
- Naming conventions → `--type convention`

---

## EXECUTION

### Step 1: Explore Project Structure

Scan the project root and create a directory tree overview:
```bash
find . -type f -not -path '*/node_modules/*' -not -path '*/.git/*' | head -100
```

### Step 2: Identify Tech Stack

From config files, detect:
- Language & version
- Framework & libraries
- Build tools
- Test framework
- Linting & formatting

### Step 3: Analyze Code Patterns

Look for:
- **Architecture pattern** — MVC, layered, microservices, monolith
- **Error handling** — Result type, try/catch, Error classes
- **State management** — How state flows through the app
- **API design** — REST naming, GraphQL schema, tRPC routes
- **Data layer** — ORM, raw SQL, document store

### Step 4: Document Key Files

For each major module:
- Purpose
- Key exports
- Dependencies
- Usage patterns

### Step 5: Generate Documentation

Output `project-docs.md` with:
1. Project Overview
2. Tech Stack
3. Architecture
4. Key Modules
5. Code Patterns & Conventions
6. Development Setup
7. Testing Guide
8. Deployment

### Completion

```
✅ Project documented!

Generated: project-docs.md
Memories saved: {count} patterns and conventions

Next: /akit-generate-context — Create AI-optimized project context
```

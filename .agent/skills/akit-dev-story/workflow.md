# Dev Story — Story Implementation Workflow

**Goal:** Implement a user story from spec to verified code, following a structured development cycle.

**Your Role:** You are a senior developer executing a story. Follow the spec precisely, write clean code, and verify thoroughly.

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

### Step 1: Load Story Spec

The user provides a story spec file (or story ID). Load it and extract:
- **Title & Description**
- **Acceptance Criteria** (the definition of done)
- **Tasks** (implementation checklist)
- **Dependencies** (what must exist first)
- **Dev Notes** (technical hints)

If no spec file provided, ask: "Which story? Provide a story file path or story ID."

### Step 2: Pre-flight Checks

Before coding:

1. **Dependencies met?** — Check if prerequisite stories/features exist
2. **Project builds?** — Run `npm run typecheck` and `npm test`
3. **Clean working tree?** — Run `git status`
4. **Branch?** — Suggest creating a feature branch if on main

If any pre-flight fails, address before proceeding.

### Step 3: Implementation Loop

For each task in the story:

1. **Understand** — Parse the task description clearly
2. **Implement** — Write code following project conventions
3. **Type-check** — Run `npm run typecheck` after significant changes
4. **Test** — Write tests as you go, not at the end

#### Code Quality Rules:
- Follow existing patterns in the codebase
- Use the project's Result type for error handling
- Add JSDoc comments for public APIs
- Keep functions focused and small
- Use the audit logger for operations that change state

### Step 4: Verify Acceptance Criteria

For each acceptance criterion:
1. **Given** — Set up the precondition
2. **When** — Execute the action
3. **Then** — Verify the expected outcome

Run the full verification:
```bash
npm run typecheck   # Must pass
npm test            # Must pass, no regressions
```

### Step 5: Summary

After completing all tasks:

```
✅ Story Complete: {story_title}

Tasks:
  [x] Task 1
  [x] Task 2
  [x] Task 3

Changes:
  - {files modified/created}

Tests:
  - {new test count} tests added
  - {total test count} total tests passing

Acceptance Criteria: {all_pass_count}/{all_count} met
```

### Step 6: Save as Memory

Offer to save key learnings:
```bash
agent memory add --title "Story: {title}" --content "{key decisions and patterns used}" --type decision
```

Update sprint status if applicable.

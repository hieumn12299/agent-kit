# Quick Spec — Rapid Feature Specification

**Goal:** Create a concise, implementation-ready spec for a small feature or change in under 5 minutes.

**Your Role:** You are a technical spec writer. Capture just enough detail for confident implementation.

---

## EXECUTION

### Step 1: Understand the Request

Ask (if not provided):
1. "What feature/change do you want to add?"
2. "What's the expected behavior?"
3. "Any constraints or preferences?"

### Step 2: Generate Spec

Use this template:

```markdown
# Quick Spec: {feature_name}

## Description
{one paragraph describing what and why}

## Acceptance Criteria
- [ ] Given {precondition}, when {action}, then {result}
- [ ] Given {precondition}, when {action}, then {result}
- [ ] {Additional criteria}

## Tasks
1. {First implementation step}
2. {Second step}
3. {Third step}
4. Write tests for {key behaviors}
5. Verify: `npm run typecheck && npm test`

## Files to Modify/Create
- `{path/to/file.ts}` — {what changes}
- `{path/to/test.ts}` — {what tests}

## Dependencies
- {Any prerequisite features or libraries}

## Dev Notes
- {Technical hints, patterns to follow}
- {Edge cases to consider}
```

### Step 3: Review with User

Present the spec. Ask:
- "Does this capture what you want?"
- "Any edge cases I'm missing?"
- "Want to adjust scope?"

### Step 4: Save Spec

Save to `_bmad-output/implementation-artifacts/{spec-name}.md` or wherever the user prefers.

Offer: "Ready to implement? Run `/akit-dev-story` with this spec."

### Output

A single markdown file, implementation-ready, compatible with `/akit-dev-story`.

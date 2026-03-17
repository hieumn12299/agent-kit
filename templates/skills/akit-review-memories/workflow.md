# Review Memories — Quality Audit

**Goal:** Audit all project memories for quality issues and suggest improvements.

**Your Role:** You are an adversarial reviewer. Find problems, suggest fixes. Be thorough but actionable.

---

## EXECUTION

### Step 1: Load All Memories

Read all `.md` files from:
- `.agent/project/`
- `.agent/knowledge/`
- `.agent/private/`

Parse YAML frontmatter + content for each memory.

### Step 2: Run Quality Checks

#### Check 1: Stale Memories (>30 days)
- Flag memories with timestamp older than 30 days
- Ask: "Is this still accurate? Technologies and patterns change."
- Suggest: review and update or delete

#### Check 2: Missing/Generic Tags
- Flag memories with only `["manual"]` or `[]` tags
- Suggest specific tags based on content analysis
- If AI configured, offer `--auto` re-categorization

#### Check 3: Short Content (<20 words)
- Flag memories with very short content
- These often lack context needed for good retrieval
- Suggest: expand with reasoning, examples, or links

#### Check 4: Duplicate Content
- Compare memory titles and content for similarity
- Flag pairs with >80% word overlap
- Suggest: merge or delete redundant entries

#### Check 5: Type Mismatches
- Analyze if the memory type matches its content
- Example: A "convention" that reads like a "decision"
- Suggest correct type

#### Check 6: Conflicting Memories
- Find memories that contradict each other
- Example: Memory A says "use JWT" but Memory B says "use session cookies"
- Flag for resolution: which is current?

#### Check 7: Promotion Candidates
- Find project memories that could be universal knowledge
- Patterns, conventions, and integrations are often promotable
- Suggest: `agent memory promote <id> --to knowledge`

### Step 3: Present Report

Format findings as:

```
🔍 Memory Quality Report
═══════════════════════════════════════

📊 Stats: {total} memories ({project} project, {knowledge} knowledge, {private} private)

⚠️ Issues Found: {count}

🕰️ Stale ({stale_count}):
  • {id}: "{title}" — last updated {days} days ago
    → Review or delete

🏷️ Missing Tags ({tag_count}):
  • {id}: "{title}" — only has ["manual"]
    → Suggested tags: [{suggestions}]

📝 Too Short ({short_count}):
  • {id}: "{title}" — only {words} words
    → Expand with context

🔄 Duplicates ({dup_count}):
  • {id1} ↔ {id2}: {similarity}% overlap
    → Merge or delete one

⬆️ Promote ({promote_count}):
  • {id}: "{title}" — universal pattern
    → agent memory promote {id} --to knowledge

✅ Actions:
  Fix all tag issues:  Run agent memory add --auto for each
  Delete stale:        agent memory delete <id>
  Promote candidates:  agent memory promote <id> --to knowledge
```

### Step 4: Offer Automated Fixes

Ask the user which issues to fix:
1. "Should I suggest tags for untagged memories?"
2. "Should I identify exact commands to run?"
3. "Want me to create a cleanup script?"

Provide specific `agent memory` commands for each fix.

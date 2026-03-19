# akit-review-memories — ### Step 2: Run Quality Checks

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

---

```
➡️ Proceed to Step 3? [Y/n]

When confirmed, I will read: .agent/skills/akit-review-memories/steps/step-03-*.md
```

**⛔ STOP HERE. Do NOT proceed to Step 3 until user confirms.**

## SUCCESS METRICS:

✅ All actions in this step are completed
✅ Output has been presented to the user
✅ User has reviewed and confirmed the output

## FAILURE MODES:

❌ Skipping directly to the next step without completing this one
❌ Generating content without user input or confirmation
❌ Ignoring the configured communication language
❌ Not showing work before proceeding

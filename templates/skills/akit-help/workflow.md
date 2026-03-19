# Help

> **⚠️ THIS WORKFLOW USES SEPARATE STEP FILES.**
> **Read ONLY one step file at a time. Do NOT read ahead.**

---

## LANGUAGE CONFIGURATION

Read `.agent/config.yaml` and find:
- `communicationLanguage` — the language to use
- `responseStyle` — the interaction style

✅ YOU MUST communicate in `{communicationLanguage}` at all times.

---

## HOW THIS WORKFLOW WORKS

This workflow has 4 steps. Each step is a SEPARATE file.
You MUST read and execute ONE step at a time.

| Step | File | Action |
|------|------|--------|
| 1 | `steps/step-01-detect-project-state.md` | Detect Project State |
| 2 | `steps/step-02-assess-current-context.md` | Assess Current Context |
| 3 | `steps/step-03-route-to-recommendation.md` | Route to Recommendation |
| 4 | `steps/step-04-answer-direct-questions.md` | Answer Direct Questions |

---

## START NOW

**Read `.agent/skills/akit-help/steps/step-01-detect-project-state.md` and follow its instructions.**

**⛔ Do NOT read any other step file. Do NOT skip ahead. Do NOT freestyle.**

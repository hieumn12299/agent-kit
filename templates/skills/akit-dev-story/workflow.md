# Dev Story

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

This workflow has 6 steps. Each step is a SEPARATE file.
You MUST read and execute ONE step at a time.

| Step | File | Action |
|------|------|--------|
| 1 | `steps/step-01-load-story-spec.md` | Load Story Spec |
| 2 | `steps/step-02-pre-flight-checks.md` | Pre-flight Checks |
| 3 | `steps/step-03-implementation-loop.md` | Implementation Loop |
| 4 | `steps/step-04-verify-acceptance-criteria.md` | Verify Acceptance Criteria |
| 5 | `steps/step-05-summary.md` | Summary |
| 6 | `steps/step-06-save-as-memory.md` | Save as Memory |

---

## START NOW

**Read `.agent/skills/akit-dev-story/steps/step-01-load-story-spec.md` and follow its instructions.**

**⛔ Do NOT read any other step file. Do NOT skip ahead. Do NOT freestyle.**

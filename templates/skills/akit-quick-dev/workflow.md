# Quick Dev

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

Each step is a SEPARATE file. Read and execute ONE at a time.

| File | Action |
|------|--------|
| `steps/step-01-mode-detection.md` | Step 01 Mode Detection |
| `steps/step-02-context-gathering.md` | Step 02 Context Gathering |
| `steps/step-03-execute.md` | Step 03 Execute |
| `steps/step-04-self-check.md` | Step 04 Self Check |
| `steps/step-05-adversarial-review.md` | Step 05 Adversarial Review |
| `steps/step-06-resolve-findings.md` | Step 06 Resolve Findings |

---

## START NOW

**Read `.agent/skills/akit-quick-dev/steps/step-01-mode-detection.md` and follow its instructions.**

**⛔ Do NOT read any other step file. Do NOT skip ahead. Do NOT freestyle.**

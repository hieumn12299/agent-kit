# Bug Fix — Structured Investigation & Resolution

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
| 1 | `steps/step-01-bug-report.md` | 🐛 Gather bug info |
| 2 | `steps/step-02-reproduce.md` | 🔄 Confirm bug exists |
| 3 | `steps/step-03-root-cause.md` | 🔍 Investigate cause |
| 4 | `steps/step-04-fix.md` | 🔧 Implement fix |
| 5 | `steps/step-05-verify.md` | ✅ Run verification |
| 6 | `steps/step-06-save.md` | 📝 Save bug learning |

---

## START NOW

**Read `.agent/skills/akit-bugfix/steps/step-01-bug-report.md` and follow its instructions.**

**⛔ Do NOT read any other step file. Do NOT skip ahead. Do NOT freestyle.**

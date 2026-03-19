# Plugin Dev

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
| 1 | `steps/step-01-understand-the-plugin-api.md` | Understand the Plugin API |
| 2 | `steps/step-02-choose-plugin-type.md` | Choose Plugin Type |
| 3 | `steps/step-03-generate-plugin-scaffold.md` | Generate Plugin Scaffold |
| 4 | `steps/step-04-register-plugin.md` | Register Plugin |
| 5 | `steps/step-05-test-the-plugin.md` | Test the Plugin |
| 6 | `steps/step-06-best-practices.md` | Best Practices |

---

## START NOW

**Read `.agent/skills/akit-plugin-dev/steps/step-01-understand-the-plugin-api.md` and follow its instructions.**

**⛔ Do NOT read any other step file. Do NOT skip ahead. Do NOT freestyle.**

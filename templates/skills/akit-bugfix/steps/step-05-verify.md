# Bug Fix — Step 5: Verify Fix ✅

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

> **YOUR IMMEDIATE ACTION**: Run all verification checks. Print results. Then STOP.

---

## Instructions

Run ALL of these checks:

1. **Repro test** — Run the original reproduction steps → bug should be GONE
2. **Related tests** — Run tests related to the changed files
3. **Full test suite** — Run the complete test suite → no regressions
4. **Edge cases** — Does the fix handle boundary conditions?

---

## REQUIRED OUTPUT:

```
✅ Verification
━━━━━━━━━━━━━━
Repro test:    {PASS | FAIL} — {what was run}
Related tests: {PASS | FAIL} — {count} tests
Full suite:    {PASS | FAIL} — {count} total
Regressions:   {NONE | list any failures}
Edge cases:    {what was checked}
```

### If ANY check FAILS:
```
⛔ Verification FAILED — going back to Step 3
```
Read `.agent/skills/akit-bugfix/steps/step-03-root-cause.md` again.

### If ALL checks PASS:
```
➡️ Proceed to Step 6: Save Bug Learning? [Y/n]

When confirmed, I will read: .agent/skills/akit-bugfix/steps/step-06-save.md
```

## SUCCESS METRICS:

✅ All actions in this step are completed
✅ Output has been presented to the user
✅ User has reviewed and confirmed the output

## FAILURE MODES:

❌ Skipping directly to the next step without completing this one
❌ Generating content without user input or confirmation
❌ Ignoring the configured communication language
❌ Not showing work before proceeding

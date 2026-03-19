# Step 3: Triage

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

## YOUR TASK:

## RULES

- YOU MUST ALWAYS SPEAK OUTPUT in your Agent communication style with the config `{communication_language}`
- Be precise. When uncertain between categories, prefer the more conservative classification.

## INSTRUCTIONS

1. **Normalize** findings into a common format. Expected input formats:
   - Adversarial (Blind Hunter): markdown list of descriptions
   - Edge Case Hunter: JSON array with `location`, `trigger_condition`, `guard_snippet`, `potential_consequence` fields
   - Acceptance Auditor: markdown list with title, AC/constraint reference, and evidence

   If a layer's output does not match its expected format, attempt best-effort parsing. Note any parsing issues for the user.

   Convert all to a unified list where each finding has:
   - `id` -- sequential integer
   - `source` -- `blind`, `edge`, `auditor`, or merged sources (e.g., `blind+edge`)
   - `title` -- one-line summary
   - `detail` -- full description
   - `location` -- file and line reference (if available)

2. **Deduplicate.** If two or more findings describe the same issue, merge them into one:
   - Use the most specific finding as the base (prefer edge-case JSON with location over adversarial prose).
   - Append any unique detail, reasoning, or location references from the other finding(s) into the surviving `detail` field.
   - Set `source` to the merged sources (e.g., `blind+edge`).

3. **Classify** each finding into exactly one bucket:
   - **intent_gap** -- The spec/intent is incomplete; cannot resolve from existing information. Only possible if `{review_mode}` = `"full"`.
   - **bad_spec** -- The spec should have prevented this; spec is wrong or ambiguous. Only possible if `{review_mode}` = `"full"`.
   - **patch** -- Code issue that is trivially fixable without human input. Just needs a code change.
   - **defer** -- Pre-existing issue not caused by the current change. Real but not actionable now.
   - **reject** -- Noise, false positive, or handled elsewhere.

   If `{review_mode}` = `"no-spec"` and a finding would otherwise be `intent_gap` or `bad_spec`, reclassify it as `patch` (if code-fixable) or `defer` (if not).

4. **Drop** all `reject` findings. Record the reject count for the summary.

5. If `{failed_layers}` is non-empty, report which layers failed before announcing results. If zero findings remain after dropping rejects AND `{failed_layers}` is non-empty, warn the user that the review may be incomplete rather than announcing a clean review.

6. If zero findings remain after dropping rejects and no layers failed, note clean review.


## NEXT

Read fully and follow `./step-04-present.md`

## SUCCESS METRICS:

✅ All actions in this step are completed
✅ Output has been presented to the user
✅ User has reviewed and confirmed the output

## FAILURE MODES:

❌ Skipping directly to the next step without completing this one
❌ Generating content without user input or confirmation
❌ Ignoring the configured communication language
❌ Not showing work before proceeding

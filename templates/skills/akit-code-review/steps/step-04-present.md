# Step 4: Present

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
- Do NOT auto-fix anything. Present findings and let the user decide next steps.

## INSTRUCTIONS

1. Group remaining findings by category.

2. Present to the user in this order (include a section only if findings exist in that category):

   - **Intent Gaps**: "These findings suggest the captured intent is incomplete. Consider clarifying intent before proceeding."
     - List each with title + detail.

   - **Bad Spec**: "These findings suggest the spec should be amended. Consider regenerating or amending the spec with this context:"
     - List each with title + detail + suggested spec amendment.

   - **Patch**: "These are fixable code issues:"
     - List each with title + detail + location (if available).

   - **Defer**: "Pre-existing issues surfaced by this review (not caused by current changes):"
     - List each with title + detail.

3. Summary line: **X** intent_gap, **Y** bad_spec, **Z** patch, **W** defer findings. **R** findings rejected as noise.

4. If clean review (zero findings across all layers after triage): state that N findings were raised but all were classified as noise, or that no findings were raised at all (as applicable).

5. Offer the user next steps (recommendations, not automated actions):
   - If `patch` findings exist: "These can be addressed in a follow-up implementation pass or manually."
   - If `intent_gap` or `bad_spec` findings exist: "Consider running the planning workflow to clarify intent or amend the spec before continuing."
   - If only `defer` findings remain: "No action needed for this change. Deferred items are noted for future attention."

Workflow complete.

## SUCCESS METRICS:

✅ All actions in this step are completed
✅ Output has been presented to the user
✅ User has reviewed and confirmed the output

## FAILURE MODES:

❌ Skipping directly to the next step without completing this one
❌ Generating content without user input or confirmation
❌ Ignoring the configured communication language
❌ Not showing work before proceeding

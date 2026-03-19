# akit-create-graph — ### Step 4: Implement

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

#### Basic Linear Graph
```typescript
import { StateGraph } from 'agent-kit/graph';

interface MyState extends GraphState {
  input: string;
  analysis: string;
  result: string;
}

const graph = new StateGraph<MyState>()
  .addNode('analyze', async (state) => ({
    ...state,
    analysis: `Analysis of: ${state.input}`,
  }))
  .addNode('implement', async (state) => ({
    ...state,
    result: `Implemented based on: ${state.analysis}`,
  }))
  .addEdge('analyze', 'implement')
  .setEntryPoint('analyze')
  .setEndPoint('implement');

// Run
const result = await graph.compile().invoke({ input: 'my task' });
```

#### Conditional Graph
```typescript
const graph = new StateGraph<MyState>()
  .addNode('analyze', analyzeStep)
  .addNode('quick-fix', quickFixStep)
  .addNode('deep-review', deepReviewStep)
  .addConditionalEdge('analyze', (state) => {
    return state.complexity > 0.7 ? 'deep-review' : 'quick-fix';
  })
  .setEntryPoint('analyze');
```

---

```
➡️ Proceed to Step 5? [Y/n]

When confirmed, I will read: .agent/skills/akit-create-graph/steps/step-05-*.md
```

**⛔ STOP HERE. Do NOT proceed to Step 5 until user confirms.**

## SUCCESS METRICS:

✅ All actions in this step are completed
✅ Output has been presented to the user
✅ User has reviewed and confirmed the output

## FAILURE MODES:

❌ Skipping directly to the next step without completing this one
❌ Generating content without user input or confirmation
❌ Ignoring the configured communication language
❌ Not showing work before proceeding

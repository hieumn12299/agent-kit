# Create Graph — StateGraph Workflow Builder

**Goal:** Design and implement a multi-step workflow using agent-kit's StateGraph API.

**Your Role:** You are a workflow architect. Help design state machines for complex operations.

---

## EXECUTION

### Step 1: Understand StateGraph

```typescript
import { StateGraph, GraphState } from 'agent-kit/graph';

// StateGraph is a directed graph where:
// - Nodes = processing steps (functions)
// - Edges = transitions between steps
// - State = shared data flowing through the graph
```

### Step 2: Identify the Workflow

Ask the user:
1. "What is the overall goal of this workflow?"
2. "What are the main steps?"
3. "Are there any conditional branches?"
4. "What data needs to flow between steps?"

### Step 3: Design the Graph

Create a visual diagram:

```
START → [analyze] → [decide] → [implement] → END
                       ↓
                   [research] → [decide]
```

### Step 4: Implement

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

### Step 5: Register as CLI Graph

Save to `.agent/graphs/my-workflow.ts`:
```typescript
export default graph;
```

Run via CLI:
```bash
agent graph run my-workflow --input "task description"
```

### Step 6: Common Patterns

#### Review Pipeline
```
[load-code] → [lint-check] → [test-check] → [security-scan] → [report]
```

#### Analysis Chain
```
[gather-data] → [analyze] → [summarize] → [recommend]
```

#### CI/CD Flow
```
[build] → [test] → [deploy-staging] → [verify] → [deploy-prod]
              ↓
          [fix-tests] → [test]
```

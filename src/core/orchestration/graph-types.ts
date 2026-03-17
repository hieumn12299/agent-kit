/**
 * Lightweight graph engine — inspired by LangGraph.js patterns.
 * Zero external dependencies. Provides StateGraph API for
 * node-based orchestration with conditional routing.
 */

// ── State ────────────────────────────────────────────────────────────

/**
 * Graph state — a plain object with typed fields.
 * Nodes receive state and return partial updates (delta pattern).
 */
export type GraphState = Record<string, unknown>;

/**
 * State update — partial state returned by nodes.
 */
export type StateUpdate<S extends GraphState = GraphState> = Partial<S>;

// ── Nodes & Edges ────────────────────────────────────────────────────

/**
 * Node handler — receives current state, returns updates.
 */
export type NodeHandler<S extends GraphState = GraphState> = (
  state: Readonly<S>,
) => Promise<StateUpdate<S>>;

/**
 * Conditional edge — routes based on state.
 */
export type ConditionalRouter<S extends GraphState = GraphState> = (
  state: Readonly<S>,
) => string | typeof END;

/**
 * Sentinel value indicating the graph should terminate.
 */
export const END = Symbol.for('__graph_end__');

/**
 * Node definition in the graph.
 */
export interface GraphNode<S extends GraphState = GraphState> {
  name: string;
  handler: NodeHandler<S>;
}

/**
 * Edge definition — static or conditional.
 */
export type GraphEdge<S extends GraphState = GraphState> =
  | { type: 'static'; from: string; to: string | typeof END }
  | { type: 'conditional'; from: string; router: ConditionalRouter<S> };

// ── Execution ────────────────────────────────────────────────────────

/**
 * Step record — tracks each node execution.
 */
export interface GraphStep {
  node: string;
  updates: StateUpdate;
  timestamp: string;
}

/**
 * Result of graph execution.
 */
export interface GraphResult<S extends GraphState = GraphState> {
  finalState: S;
  steps: GraphStep[];
  iterations: number;
  terminated: boolean;
}

/**
 * Execution options.
 */
export interface GraphRunOptions {
  /** Maximum iterations to prevent infinite loops. Default: 25. */
  maxIterations?: number;
  /** Called after each node execution. */
  onStep?: (step: GraphStep, state: GraphState) => void;
}

/**
 * Compiled graph — ready to run.
 */
export interface CompiledGraph<S extends GraphState = GraphState> {
  /** Execute the graph with initial state. */
  invoke: (initialState: S, options?: GraphRunOptions) => Promise<GraphResult<S>>;
  /** Get the list of node names. */
  nodes: string[];
  /** Get the entry point. */
  entryPoint: string;
  /** Dry run — show execution plan without running. */
  plan: () => string[];
}

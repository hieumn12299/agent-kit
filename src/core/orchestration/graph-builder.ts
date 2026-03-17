import {
  END,
  type GraphState,
  type GraphNode,
  type GraphEdge,
  type NodeHandler,
  type ConditionalRouter,
  type GraphStep,
  type GraphResult,
  type GraphRunOptions,
  type CompiledGraph,
  type StateUpdate,
} from './graph-types.js';

// Re-export END for consumer convenience
export { END } from './graph-types.js';

/**
 * StateGraph — build a node-based execution graph.
 *
 * Inspired by LangGraph.js StateGraph API:
 * - addNode(name, handler) — register a node
 * - addEdge(from, to) — static routing
 * - addConditionalEdge(from, router) — dynamic routing
 * - setEntryPoint(name) — define start node
 * - compile() → CompiledGraph
 *
 * Delta pattern: nodes return Partial<State> updates,
 * merged into state via shallow merge (like LangGraph's default reducer).
 */
export class StateGraph<S extends GraphState = GraphState> {
  private nodes = new Map<string, GraphNode<S>>();
  private edges: GraphEdge<S>[] = [];
  private entry: string | null = null;

  /**
   * Add a named node with its handler function.
   */
  addNode(name: string, handler: NodeHandler<S>): this {
    if (this.nodes.has(name)) {
      throw new Error(`Node '${name}' already exists.`);
    }
    this.nodes.set(name, { name, handler });
    return this;
  }

  /**
   * Add a static edge from one node to another (or to END).
   */
  addEdge(from: string, to: string | typeof END): this {
    this.edges.push({ type: 'static', from, to });
    return this;
  }

  /**
   * Add a conditional edge — router returns next node name or END.
   */
  addConditionalEdge(from: string, router: ConditionalRouter<S>): this {
    this.edges.push({ type: 'conditional', from, router });
    return this;
  }

  /**
   * Set the entry point node.
   */
  setEntryPoint(name: string): this {
    this.entry = name;
    return this;
  }

  /**
   * Compile the graph — validates structure and returns an executable.
   */
  compile(): CompiledGraph<S> {
    // Validate
    if (!this.entry) {
      throw new Error('No entry point set. Call setEntryPoint() first.');
    }
    if (!this.nodes.has(this.entry)) {
      throw new Error(`Entry point '${this.entry}' is not a registered node.`);
    }

    // Validate all edges reference existing nodes
    for (const edge of this.edges) {
      if (!this.nodes.has(edge.from)) {
        throw new Error(`Edge references unknown source node '${edge.from}'.`);
      }
      if (edge.type === 'static' && typeof edge.to === 'string' && !this.nodes.has(edge.to)) {
        throw new Error(`Edge references unknown target node '${edge.to}'.`);
      }
    }

    const nodes = new Map(this.nodes);
    const edges = [...this.edges];
    const entryPoint = this.entry;

    const getNextNode = (currentNode: string, state: Readonly<S>): string | typeof END => {
      // Find edges from current node (conditional first for priority)
      const conditional = edges.find(e => e.type === 'conditional' && e.from === currentNode);
      if (conditional && conditional.type === 'conditional') {
        return conditional.router(state);
      }
      const staticEdge = edges.find(e => e.type === 'static' && e.from === currentNode);
      if (staticEdge && staticEdge.type === 'static') {
        return staticEdge.to;
      }
      return END; // No edge found → terminate
    };

    return {
      nodes: Array.from(nodes.keys()),
      entryPoint,

      plan: () => {
        // BFS to find static execution path
        const path: string[] = [];
        let current: string | typeof END = entryPoint;
        const visited = new Set<string>();

        while (typeof current === 'string' && !visited.has(current)) {
          visited.add(current);
          path.push(current);
          const staticEdge = edges.find(
            e => e.type === 'static' && e.from === current,
          );
          if (staticEdge && staticEdge.type === 'static') {
            current = staticEdge.to;
          } else {
            break;
          }
        }
        return path;
      },

      invoke: async (
        initialState: S,
        options?: GraphRunOptions,
      ): Promise<GraphResult<S>> => {
        const maxIterations = options?.maxIterations ?? 25;
        let state = { ...initialState };
        let currentNode: string | typeof END = entryPoint;
        const steps: GraphStep[] = [];
        let iterations = 0;

        while (typeof currentNode === 'string' && iterations < maxIterations) {
          iterations++;

          const node = nodes.get(currentNode);
          if (!node) {
            throw new Error(`Runtime: node '${String(currentNode)}' not found.`);
          }

          // Execute node
          const updates = await node.handler(state);
          const step: GraphStep = {
            node: currentNode,
            updates: updates as StateUpdate,
            timestamp: new Date().toISOString(),
          };
          steps.push(step);

          // Merge updates (shallow merge — LangGraph default reducer behavior)
          state = { ...state, ...updates };

          // Notify callback
          options?.onStep?.(step, state);

          // Route to next node
          currentNode = getNextNode(currentNode, state);
        }

        return {
          finalState: state,
          steps,
          iterations,
          terminated: currentNode === END || iterations >= maxIterations,
        };
      },
    };
  }
}

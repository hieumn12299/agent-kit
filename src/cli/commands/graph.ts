import type { Command } from 'commander';
import { ConsoleFormatter } from '../output-formatter.js';
import { handleCommandError } from '../error-handler.js';
import { getOutputMode, requireInit } from '../utils.js';
import { WORKFLOWS, type WorkflowName } from '../../core/orchestration/workflows.js';

export const registerGraphCommand = (program: Command): void => {
  const graph = program
    .command('graph')
    .description('Run predefined agent workflows (graph-based orchestration)');

  // ── graph list ───────────────────────────────────────────────────
  graph
    .command('list')
    .description('List available workflow graphs')
    .action(async function (this: Command) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });

      const workflows = Object.values(WORKFLOWS);

      if (mode === 'json') {
        console.log(JSON.stringify(workflows.map(w => ({
          name: w.name,
          description: w.description,
        }))));
        return;
      }

      fmt.info(`${workflows.length} available workflow(s):`);
      for (const w of workflows) {
        console.log(`  📊 ${w.name}`);
        console.log(`     ${w.description}`);
      }
    });

  // ── graph run ────────────────────────────────────────────────────
  graph
    .command('run <workflow>')
    .description('Execute a workflow graph')
    .option('--dry-run', 'Show execution plan without running')
    .option('--max-iterations <n>', 'Maximum iterations', '25')
    .action(async function (this: Command, workflowName: string) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();
      const dryRun = this.opts().dryRun as boolean | undefined;
      const maxIterations = parseInt(this.opts().maxIterations, 10);

      if (!(await requireInit(root, fmt))) return;

      const workflow = WORKFLOWS[workflowName as WorkflowName];
      if (!workflow) {
        handleCommandError(
          fmt,
          new Error(`Unknown workflow '${workflowName}'. Run 'agent graph list' to see available workflows.`),
        );
        return;
      }

      const compiled = workflow.build();

      // Dry run mode
      if (dryRun) {
        const plan = compiled.plan();
        if (mode === 'json') {
          console.log(JSON.stringify({ workflow: workflowName, plan }));
        } else {
          fmt.info(`Execution plan for '${workflowName}':`);
          plan.forEach((node, i) => console.log(`  ${i + 1}. ${node}`));
        }
        return;
      }

      // Execute
      if (mode !== 'json') {
        fmt.info(`Running workflow '${workflowName}'...`);
      }

      const initialState = {
        root,
        memories: [],
        duplicates: [],
        promoted: [],
        staleMemories: [],
        lowConfidence: [],
        report: '',
        phase: 'scan' as const,
        iteration: 0,
        maxPromotions: 5,
      };

      const result = await compiled.invoke(initialState, {
        maxIterations,
        onStep: (step) => {
          if (mode !== 'json') {
            console.log(`  ✓ ${step.node}`);
          }
        },
      });

      if (mode === 'json') {
        console.log(JSON.stringify({
          workflow: workflowName,
          iterations: result.iterations,
          terminated: result.terminated,
          steps: result.steps.map(s => s.node),
          finalState: result.finalState,
        }, null, 2));
      } else {
        fmt.success(`Workflow '${workflowName}' completed in ${result.iterations} steps.`);

        // Show report if available
        const state = result.finalState as unknown as Record<string, unknown>;
        if (state.report && typeof state.report === 'string') {
          console.log(`\n${state.report}`);
        }
        if (Array.isArray(state.promoted) && state.promoted.length > 0) {
          console.log(`\n  📈 Promoted: ${state.promoted.length} memories`);
        }
        if (Array.isArray(state.duplicates) && state.duplicates.length > 0) {
          console.log(`  🔍 Duplicates found: ${state.duplicates.length}`);
        }
      }
    });
};

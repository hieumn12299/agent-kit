import type { Command } from 'commander';
import { isInitialized } from '../../core/config/config-manager.js';
import { listMemories } from '../../core/memory/memory-store.js';
import { formatScoredMemory } from '../../core/retrieval/retrieval-engine.js';
import { ConsoleFormatter } from '../output-formatter.js';
import { handleCommandError } from '../error-handler.js';
import { ConfigError } from '../../types/errors.js';
import { getOutputMode } from '../utils.js';



export const registerContextCommand = (program: Command): void => {
  program
    .command('context')
    .description('Retrieve relevant memories for AI context')
    .option('--query <query>', 'Search query to find relevant memories')
    .option('--tier <tier>', 'Filter to specific memory tier')
    .option('--limit <n>', 'Maximum results to return', '10')
    .action(async function (this: Command) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();
      const opts = this.opts();
      const query = opts.query as string | undefined;
      const tier = opts.tier as string | undefined;
      const limit = parseInt(opts.limit, 10) || 10;

      if (!(await isInitialized(root))) {
        handleCommandError(
          fmt,
          new ConfigError("Not initialized. Run 'agent init' first.", "Run 'agent init'"),
        );
        return;
      }

      // Gather memories from requested tier(s)
      const tiers = tier
        ? [tier as 'project' | 'working' | 'knowledge']
        : ['project' as const, 'working' as const, 'knowledge' as const];
      const allMemories = [];
      for (const t of tiers) {
        const result = await listMemories(root, t);
        if (result.ok) allMemories.push(...result.value);
      }

      // No query = full context export (Story 5.3)
      if (!query) {
        if (allMemories.length === 0) {
          if (mode === 'json') { console.log(JSON.stringify([])); }
          else { fmt.info("📭 No memories. Start a session with 'agent start'."); }
          return;
        }

        // Working first, then project sorted by date
        const working = allMemories.filter((m) => m.tier === 'working');
        const project = allMemories
          .filter((m) => m.tier === 'project')
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        const knowledge = allMemories
          .filter((m) => m.tier === 'knowledge')
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        const ordered = [...working, ...project, ...knowledge];

        if (mode === 'json') {
          console.log(JSON.stringify(ordered));
        } else {
          for (const m of ordered) {
            console.log(`## ${m.title}`);
            console.log(`*${m.tier} · ${m.timestamp.slice(0, 10)}*`);
            console.log('');
            console.log(m.content);
            console.log('');
          }
        }
        return;
      }

      // Query-based search — use intent-aware smart retrieval
      const { smartRetrieve } = await import('../../core/retrieval/smart-retriever.js');
      const retrieval = await smartRetrieve(root, query, { limit });

      if (retrieval.memories.length === 0) {
        if (mode === 'json') { console.log(JSON.stringify({ results: [], detectedIntent: retrieval.intent })); }
        else { fmt.info(`No memories match '${query}'.`); }
        return;
      }

      if (mode === 'json') {
        console.log(JSON.stringify({
          detectedIntent: retrieval.intent,
          confidence: Math.round(retrieval.confidence * 100),
          filterApplied: retrieval.filterApplied,
          matchedKeywords: retrieval.matchedKeywords,
          results: retrieval.memories.map((r) => ({
            ...r.memory,
            score: Math.round(r.score * 100),
          })),
        }));
      } else {
        if (retrieval.filterApplied) {
          fmt.info(`🎯 Intent: ${retrieval.intent} (${Math.round(retrieval.confidence * 100)}%)`);
        }
        for (const r of retrieval.memories) {
          console.log(formatScoredMemory(r));
          console.log('');
        }
        fmt.info(`${retrieval.memories.length} result${retrieval.memories.length > 1 ? 's' : ''} for '${query}'`);
      }
    });
};

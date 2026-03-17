import type { Command } from 'commander';
import { confirm } from '@inquirer/prompts';
import { endSession } from '../../core/session/session-manager.js';
import { getActiveSession } from '../../core/session/session-store.js';
import { extractInsights } from '../../core/session/insight-extractor.js';
import { writeMemory, countMemories } from '../../core/memory/memory-store.js';
import { promoteAll } from '../../core/memory/promoter.js';
import { ConsoleFormatter } from '../output-formatter.js';
import { handleCommandError } from '../error-handler.js';
import { isNonInteractive } from '../env.js';
import { getOutputMode, requireInit } from '../utils.js';
import { registry } from '../../core/plugins/plugin-registry.js';



export const registerEndCommand = (program: Command): void => {
  program
    .command('end')
    .description('End the current coding session')
    .option('--ai', 'Use AI for enhanced insight extraction')
    .action(async function (this: Command) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();
      const nonInteractive = isNonInteractive();

      if (!(await requireInit(root, fmt))) return;

      // Get active session
      const activeResult = await getActiveSession(root);
      if (!activeResult.ok) {
        handleCommandError(fmt, activeResult.error);
        return;
      }

      if (!activeResult.value) {
        fmt.error("No active session. Run 'agent start' first.");
        return;
      }

      const session = activeResult.value;
      const beforeCount = await countMemories(root);

      // Extract insights (AI-enhanced if --ai flag)
      const useAI = this.opts().ai as boolean;
      let insightsResult;

      if (useAI) {
        try {
          const { extractInsightsWithAI } = await import('../../core/session/insight-extractor.js');
          if (mode !== 'json') fmt.info('🤖 Using AI for insight extraction...');
          insightsResult = await extractInsightsWithAI(root, session.startTime);
        } catch {
          insightsResult = await extractInsights(root, session.startTime);
        }
      } else {
        insightsResult = await extractInsights(root, session.startTime);
      }

      const insights = insightsResult.ok ? insightsResult.value : [];

      // Promotion flow
      let savedCount = 0;
      if (insights.length > 0) {
        fmt.newline();
        fmt.info(`📝 ${insights.length} insight${insights.length > 1 ? 's' : ''} found:`);
        for (const insight of insights) {
          console.log(`  • ${insight.summary}`);
        }
        fmt.newline();

        // Prompt to save (skip in non-interactive = auto-save)
        let shouldSave = true;
        if (!nonInteractive) {
          shouldSave = await confirm({
            message: 'Save all insights as memories?',
            default: true,
          });
        }

        if (shouldSave) {
          const memories = promoteAll(insights, session.sessionId);
          for (const memory of memories) {
            const writeResult = await writeMemory(root, memory);
            if (writeResult.ok) savedCount++;
          }
        } else {
          fmt.info('Insights discarded.');
        }
      } else {
        fmt.info('No insights extracted this session.');
      }

      // End session
      const endResult = await endSession(root, session);
      if (!endResult.ok) {
        handleCommandError(fmt, endResult.error);
        return;
      }

      // Fire plugin hook
      registry.invokeOnSessionEnd(session.sessionId).catch(() => {});

      // Memory growth feedback
      const afterCount = await countMemories(root);

      if (mode === 'json') {
        console.log(JSON.stringify({
          status: 'ended',
          sessionId: session.sessionId,
          insightsFound: insights.length,
          memoriesSaved: savedCount,
          memoryCount: { before: beforeCount, after: afterCount },
        }));
      } else {
        fmt.success(`✅ Session ended (${session.sessionId})`);
        if (savedCount > 0) {
          fmt.info(`📈 ${beforeCount} → ${afterCount} memories`);
        }
      }
    });
};

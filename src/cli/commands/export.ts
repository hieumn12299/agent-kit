import type { Command } from 'commander';
import { isInitialized } from '../../core/config/config-manager.js';
import { listSessions } from '../../core/session/session-store.js';
import { listMemories } from '../../core/memory/memory-store.js';
import { ConsoleFormatter } from '../output-formatter.js';
import { handleCommandError } from '../error-handler.js';
import { ConfigError } from '../../types/errors.js';
import { getOutputMode } from '../utils.js';



export const registerExportCommand = (program: Command): void => {
  program
    .command('export')
    .description('Export session summary for external review')
    .option('--session <id>', 'Session ID to export (or "latest")', 'latest')
    .action(async function (this: Command) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();
      const sessionOpt = this.opts().session as string;

      if (!(await isInitialized(root))) {
        handleCommandError(
          fmt,
          new ConfigError("Not initialized. Run 'agent init' first.", "Run 'agent init'"),
        );
        return;
      }

      const sessionsResult = await listSessions(root);
      if (!sessionsResult.ok || sessionsResult.value.length === 0) {
        fmt.info('No sessions to export.');
        return;
      }

      const sessions = sessionsResult.value
        .sort((a, b) => b.startTime.localeCompare(a.startTime));

      let session;
      if (sessionOpt === 'latest') {
        session = sessions[0];
      } else {
        session = sessions.find((s) => s.sessionId === sessionOpt);
      }

      if (!session) {
        fmt.error(`Session '${sessionOpt}' not found.`);
        return;
      }

      // Calculate duration
      const start = new Date(session.startTime);
      const end = session.endTime ? new Date(session.endTime) : new Date();
      const durationMs = end.getTime() - start.getTime();
      const mins = Math.floor(durationMs / 60_000);

      // Get memories created during session
      const memResult = await listMemories(root, 'project');
      /**
       * Filter memories by source field convention: `session:{sessionId}`.
       * This coupling allows tracing memories back to the session that created them.
       * See promoter.ts which sets `source: \`session:${sessionId}\`` during promotion.
       */
      const sessionMemories = memResult.ok
        ? memResult.value.filter((m) => m.source === `session:${session.sessionId}`)
        : [];

      if (mode === 'json') {
        console.log(JSON.stringify({
          sessionId: session.sessionId,
          startTime: session.startTime,
          endTime: session.endTime || null,
          durationMinutes: mins,
          isActive: session.isActive,
          memoriesCreated: sessionMemories.length,
          memories: sessionMemories,
        }));
        return;
      }

      // Markdown output (pipeable)
      console.log(`# Session Export: ${session.sessionId}`);
      console.log('');
      console.log(`**Started:** ${session.startTime}`);
      console.log(`**Ended:** ${session.endTime || '(active)'}`);
      console.log(`**Duration:** ${mins} minutes`);
      console.log(`**Status:** ${session.isActive ? '🟢 Active' : '⬜ Ended'}`);
      console.log('');
      console.log(`## Memories Created (${sessionMemories.length})`);
      console.log('');
      if (sessionMemories.length === 0) {
        console.log('No memories created in this session.');
      } else {
        for (const m of sessionMemories) {
          console.log(`### ${m.title}`);
          console.log(`*${m.type} · ${m.timestamp.slice(0, 10)}*`);
          console.log('');
          console.log(m.content);
          console.log('');
        }
      }
    });
};

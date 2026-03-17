import type { Command } from 'commander';
import { isInitialized } from '../../core/config/config-manager.js';
import { getActiveSession, listSessions } from '../../core/session/session-store.js';
import { countMemories } from '../../core/memory/memory-store.js';
import { timeAgo } from '../../core/session/session-lock.js';
import { auditLogSize } from '../../core/observability/audit-logger.js';
import { getFullAnalytics } from '../../core/observability/memory-analytics.js';
import { ConsoleFormatter } from '../output-formatter.js';
import { handleCommandError } from '../error-handler.js';
import { ConfigError } from '../../types/errors.js';
import { getOutputMode } from '../utils.js';
import { stat } from 'node:fs/promises';
import { getSubPath } from '../../utils/file-system.js';

const dirSize = async (path: string): Promise<number> => {
  try {
    const { readdir } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const files = await readdir(path);
    let total = 0;
    for (const f of files) {
      try {
        const s = await stat(join(path, f));
        total += s.size;
      } catch { /* skip */ }
    }
    return total;
  } catch { return 0; }
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

export const registerStatusCommand = (program: Command): void => {
  program
    .command('status')
    .description('Show current session and project status')
    .option('--verbose', 'Show detailed breakdown')
    .action(async function (this: Command) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();
      const verbose = this.opts().verbose as boolean;

      if (!(await isInitialized(root))) {
        handleCommandError(
          fmt,
          new ConfigError("Not initialized. Run 'agent init' first.", "Run 'agent init'"),
        );
        return;
      }

      const activeResult = await getActiveSession(root);
      const sessionsResult = await listSessions(root);
      const projectCount = await countMemories(root, 'project');
      const workingCount = await countMemories(root, 'working');
      const activeSession = activeResult.ok ? activeResult.value : null;
      const totalSessions = sessionsResult.ok ? sessionsResult.value.length : 0;

      // Compute verbose data
      let storageData: { projectSize: number; workingSize: number; logSize: number } | null = null;
      let evolutionData = null;
      let qualityData = null;

      if (verbose) {
        const [projectSize, workingSize, logSize, analytics] = await Promise.all([
          dirSize(getSubPath(root, 'project')),
          dirSize(getSubPath(root, 'working')),
          auditLogSize(root),
          getFullAnalytics(root),
        ]);
        storageData = { projectSize, workingSize, logSize };
        evolutionData = analytics.ok ? analytics.value.evolution : null;
        qualityData = analytics.ok ? analytics.value.quality : null;
      }

      if (mode === 'json') {
        const data: Record<string, unknown> = {
          initialized: true,
          activeSession: activeSession
            ? { sessionId: activeSession.sessionId, startTime: activeSession.startTime, duration: timeAgo(activeSession.startTime) }
            : null,
          totalSessions,
          memories: { project: projectCount, working: workingCount, total: projectCount + workingCount },
        };

        if (verbose && storageData) {
          data['storage'] = {
            project: formatBytes(storageData.projectSize),
            working: formatBytes(storageData.workingSize),
            auditLog: formatBytes(storageData.logSize),
            total: formatBytes(storageData.projectSize + storageData.workingSize + storageData.logSize),
          };
          if (evolutionData) data['memoryEvolution'] = evolutionData;
          if (qualityData) data['qualityMetrics'] = qualityData;
        }

        console.log(JSON.stringify(data));
        return;
      }

      fmt.newline();
      console.log('  📊 Agent-Kit Status');
      console.log('  ─────────────────');

      // Session
      if (activeSession) {
        fmt.success(`⚡ Active session: ${activeSession.sessionId}`);
        fmt.info(`   Started: ${timeAgo(activeSession.startTime)}`);
      } else {
        fmt.info('💤 No active session.');
      }

      // Memories
      fmt.info(`🧠 ${projectCount + workingCount} memories (${projectCount} project, ${workingCount} working)`);
      fmt.info(`📂 ${totalSessions} total sessions`);

      if (verbose && storageData) {
        fmt.newline();
        console.log('  Detailed Breakdown');
        console.log('  ─────────────────');

        const totalSize = storageData.projectSize + storageData.workingSize + storageData.logSize;
        fmt.info(`💾 Storage: ${formatBytes(totalSize)}`);
        fmt.info(`   project/ ${formatBytes(storageData.projectSize)} · working/ ${formatBytes(storageData.workingSize)} · audit.log ${formatBytes(storageData.logSize)}`);

        // Quality metrics
        if (qualityData && qualityData.totalMemories > 0) {
          fmt.newline();
          console.log('  Quality Metrics');
          console.log('  ─────────────────');
          fmt.info(`📈 Avg confidence: ${qualityData.avgConfidence}`);
          fmt.info(`📊 Types: ${Object.entries(qualityData.typeDistribution).map(([t, n]) => `${t}(${n})`).join(' · ')}`);
          if (qualityData.correctionCount > 0) {
            fmt.info(`✏️  Corrections: ${qualityData.correctionCount}`);
          }
          if (qualityData.staleCount > 0) {
            fmt.warning(`${qualityData.staleCount} stale memories (${qualityData.staleRate}% >30d). Run 'agent doctor' to review.`);
          }
        }

        // Memory evolution
        if (evolutionData && evolutionData.recentGrowth.length > 0) {
          fmt.newline();
          console.log('  Memory Growth');
          console.log('  ─────────────────');
          for (const g of evolutionData.recentGrowth) {
            fmt.info(`  ${g.date}  +${g.memoriesCreated} memories  (${g.sessionId.slice(0, 8)}…)`);
          }
        } else if (qualityData && qualityData.totalMemories === 0) {
          fmt.newline();
          fmt.info('📝 No memory history yet.');
        }
      }

      fmt.newline();
    });
};

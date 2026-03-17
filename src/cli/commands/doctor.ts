import type { Command } from 'commander';
import { confirm } from '@inquirer/prompts';
import { loadConfig } from '../../core/config/config-manager.js';
import { listMemories } from '../../core/memory/memory-store.js';
import { getActiveSession } from '../../core/session/session-store.js';
import { readLock, releaseLock } from '../../core/session/session-lock.js';
import { auditLogSize } from '../../core/observability/audit-logger.js';
import { ConsoleFormatter } from '../output-formatter.js';
import { isNonInteractive } from '../env.js';
import { getOutputMode, requireInit } from '../utils.js';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { getAgentPath, getSubPath } from '../../utils/file-system.js';



interface CheckResult {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  fixable: boolean;
}

export const registerDoctorCommand = (program: Command): void => {
  program
    .command('doctor')
    .description('Run health checks on Agent-Kit installation')
    .action(async function (this: Command) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();
      const nonInteractive = isNonInteractive();

      if (!(await requireInit(root, fmt))) return;

      const checks: CheckResult[] = [];

      // 1. Config valid
      try {
        const config = await loadConfig(root);
        checks.push(config.ok
          ? { name: 'Config', status: 'pass', message: 'Configuration is valid', fixable: false }
          : { name: 'Config', status: 'fail', message: `Config error: ${config.error.message}`, fixable: false },
        );
      } catch {
        checks.push({ name: 'Config', status: 'fail', message: 'Cannot read config', fixable: false });
      }

      // 2. Memory files parseable
      const memResult = await listMemories(root, 'project');
      if (memResult.ok) {
        checks.push({ name: 'Memories', status: 'pass', message: `${memResult.value.length} memories OK`, fixable: false });
      } else {
        checks.push({ name: 'Memories', status: 'fail', message: 'Cannot parse memory files', fixable: false });
      }

      // 3. Orphaned sessions
      const lock = await readLock(root);
      const active = await getActiveSession(root);
      if (lock && (!active.ok || !active.value)) {
        checks.push({ name: 'Sessions', status: 'warn', message: 'Orphaned session lock detected', fixable: true });
      } else {
        checks.push({ name: 'Sessions', status: 'pass', message: 'No orphaned sessions', fixable: false });
      }

      // 4. Stale memories >30d
      const staleThreshold = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const staleCount = memResult.ok
        ? memResult.value.filter((m) => new Date(m.timestamp).getTime() < staleThreshold).length
        : 0;
      if (staleCount > 0) {
        checks.push({ name: 'Stale', status: 'warn', message: `${staleCount} memories older than 30 days`, fixable: false });
      } else {
        checks.push({ name: 'Stale', status: 'pass', message: 'No stale memories', fixable: false });
      }

      // 5. Storage <5MB
      const logSize = await auditLogSize(root);
      let totalSize = logSize;
      for (const tier of ['project', 'working'] as const) {
        try {
          const dir = getSubPath(root, tier);
          const { readdir } = await import('node:fs/promises');
          const files = await readdir(dir);
          for (const f of files) {
            try { const s = await stat(join(dir, f)); totalSize += s.size; } catch { /* skip */ }
          }
        } catch { /* skip */ }
      }
      if (totalSize > 5_000_000) {
        checks.push({ name: 'Storage', status: 'warn', message: `Storage is ${(totalSize / 1_000_000).toFixed(1)}MB (>5MB)`, fixable: false });
      } else {
        checks.push({ name: 'Storage', status: 'pass', message: `Storage: ${(totalSize / 1024).toFixed(0)}KB`, fixable: false });
      }

      // 6. .gitignore correct
      try {
        const agentGitignore = await readFile(join(getAgentPath(root), '.gitignore'), 'utf-8');
        if (agentGitignore.includes('working/') || agentGitignore.includes('private/')) {
          checks.push({ name: 'Gitignore', status: 'pass', message: '.agent/.gitignore configured correctly', fixable: false });
        } else {
          checks.push({ name: 'Gitignore', status: 'warn', message: '.agent/.gitignore missing working/ or private/', fixable: true });
        }
      } catch {
        checks.push({ name: 'Gitignore', status: 'warn', message: 'No .agent/.gitignore found', fixable: true });
      }

      // 7. Corrupted files (Story 7.2)
      const { listCorruptedFiles } = await import('../../core/memory/memory-store.js');
      const corrupted = await listCorruptedFiles(root, 'project');
      if (corrupted.length > 0) {
        checks.push({ name: 'Corrupted', status: 'warn', message: `${corrupted.length} corrupted memory file(s): ${corrupted.join(', ')}`, fixable: true });
      } else {
        checks.push({ name: 'Corrupted', status: 'pass', message: 'All memory files valid', fixable: false });
      }

      // 8. Zero-telemetry (Story 7.4)
      try {
        const pkgRaw = await readFile(join(root, 'package.json'), 'utf-8');
        const pkg = JSON.parse(pkgRaw);
        // Only check runtime dependencies — devDependencies are not shipped
        const deps = pkg.dependencies ?? {};
        const networkLibs = ['axios', 'node-fetch', 'got', 'request', 'superagent', 'undici'];
        const found = networkLibs.filter((lib) => lib in deps);
        if (found.length > 0) {
          checks.push({ name: 'Telemetry', status: 'warn', message: `Network libraries in dependencies: ${found.join(', ')}. Note: native fetch() is not detectable.`, fixable: false });
        } else {
          checks.push({ name: 'Telemetry', status: 'pass', message: 'Zero external network dependencies (note: native fetch() is not detectable)', fixable: false });
        }
      } catch {
        checks.push({ name: 'Telemetry', status: 'pass', message: 'No package.json or zero network deps', fixable: false });
      }

      // 9. Conflict detection (Story 8.3 / FR32)
      const { detectConflicts } = await import('../../core/observability/conflict-detector.js');
      const conflicts = await detectConflicts(root);
      const duplicates = conflicts.filter(c => c.type === 'duplicate');
      const similar = conflicts.filter(c => c.type === 'similar');
      if (conflicts.length > 0) {
        const parts: string[] = [];
        if (duplicates.length > 0) parts.push(`${duplicates.length} duplicate(s)`);
        if (similar.length > 0) parts.push(`${similar.length} similar pair(s)`);
        checks.push({ name: 'Conflicts', status: 'warn', message: `Found ${parts.join(', ')} across tiers`, fixable: duplicates.length > 0 });
      } else {
        checks.push({ name: 'Conflicts', status: 'pass', message: 'No memory conflicts detected', fixable: false });
      }

      // 10. Index integrity (Story 9.1)
      const { validateIndex, buildIndex: rebuildIdx, saveIndex: saveIdx } = await import('../../core/memory/memory-index.js');
      const indexIssues = await validateIndex(root);
      const totalIssues = indexIssues.missingInIndex.length + indexIssues.orphanedInIndex.length + indexIssues.stale.length;
      if (totalIssues > 0) {
        const parts: string[] = [];
        if (indexIssues.missingInIndex.length > 0) parts.push(`${indexIssues.missingInIndex.length} missing`);
        if (indexIssues.orphanedInIndex.length > 0) parts.push(`${indexIssues.orphanedInIndex.length} orphaned`);
        if (indexIssues.stale.length > 0) parts.push(`${indexIssues.stale.length} stale`);
        checks.push({ name: 'Index', status: 'warn', message: `Index drift: ${parts.join(', ')} entries`, fixable: true });
      } else {
        checks.push({ name: 'Index', status: 'pass', message: 'Memory index in sync', fixable: false });
      }

      // Output
      if (mode === 'json') {
        console.log(JSON.stringify(checks));
        return;
      }

      fmt.newline();
      console.log('  🏥 Agent Doctor');
      console.log('  ──────────────');

      const icons = { pass: '✅', warn: '⚠️ ', fail: '❌' };
      for (const check of checks) {
        console.log(`  ${icons[check.status]} ${check.name}: ${check.message}`);
      }

      const fixable = checks.filter((c) => c.fixable && c.status !== 'pass');
      if (fixable.length > 0 && !nonInteractive) {
        fmt.newline();
        const shouldFix = await confirm({ message: `Fix ${fixable.length} issue(s)?`, default: true });
        if (shouldFix) {
          for (const fix of fixable) {
            if (fix.name === 'Sessions') {
              await releaseLock(root);
              fmt.success('Cleaned orphaned session lock.');
            }
            if (fix.name === 'Conflicts') {
              const { deleteMemory } = await import('../../core/memory/memory-store.js');
              for (const dup of duplicates) {
                // Delete the working-tier copy (keep project-tier)
                const workingMem = dup.memoryA.tier === 'working' ? dup.memoryA : dup.memoryB;
                if (workingMem.tier === 'working') {
                  await deleteMemory(root, workingMem.id, 'working');
                  fmt.success(`Deleted working-tier duplicate: ${workingMem.id}`);
                }
              }
            }
            if (fix.name === 'Index') {
              const rebuilt = await rebuildIdx(root);
              await saveIdx(root, rebuilt);
              fmt.success('Rebuilt memory index from files.');
            }
          }
        }
      }

      fmt.newline();
    });
};

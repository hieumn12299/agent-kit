import type { Command } from 'commander';
import { ConsoleFormatter } from '../output-formatter.js';
import { handleCommandError } from '../error-handler.js';
import { getOutputMode, requireInit } from '../utils.js';
import {
  acquireLock,
  releaseLock,
  forceReleaseLock,
  listLocks,
} from '../../core/coordination/lock-manager.js';

export const registerLockCommand = (program: Command): void => {
  const lock = program
    .command('lock')
    .description('Manage advisory locks for multi-agent coordination');

  // ── lock acquire ─────────────────────────────────────────────────
  lock
    .command('acquire <resource>')
    .description('Acquire an advisory lock on a resource')
    .option('--agent <id>', 'Agent identifier', `agent-${process.pid}`)
    .option('--ttl <seconds>', 'Lock time-to-live in seconds', '300')
    .action(async function (this: Command, resource: string) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();
      const agentId = this.opts().agent as string;
      const ttlMs = parseInt(this.opts().ttl, 10) * 1000;

      if (!(await requireInit(root, fmt))) return;

      const result = await acquireLock(root, resource, agentId, ttlMs);
      if (!result.ok) {
        handleCommandError(fmt, result.error);
        return;
      }

      if (mode === 'json') {
        console.log(JSON.stringify(result.value));
      } else {
        fmt.success(`Lock acquired on '${resource}' by '${agentId}' (expires: ${result.value.expiresAt})`);
      }
    });

  // ── lock release ─────────────────────────────────────────────────
  lock
    .command('release <resource>')
    .description('Release an advisory lock on a resource')
    .option('--agent <id>', 'Agent identifier', `agent-${process.pid}`)
    .option('--force', 'Force release regardless of owner')
    .action(async function (this: Command, resource: string) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();
      const agentId = this.opts().agent as string;
      const force = this.opts().force as boolean | undefined;

      if (!(await requireInit(root, fmt))) return;

      const result = force
        ? await forceReleaseLock(root, resource)
        : await releaseLock(root, resource, agentId);

      if (!result.ok) {
        handleCommandError(fmt, result.error);
        return;
      }

      if (mode === 'json') {
        console.log(JSON.stringify({ status: 'released', resource }));
      } else {
        fmt.success(`Lock released on '${resource}'.`);
      }
    });

  // ── lock status ──────────────────────────────────────────────────
  lock
    .command('status')
    .description('Show all active locks')
    .action(async function (this: Command) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();

      if (!(await requireInit(root, fmt))) return;

      const locks = await listLocks(root);

      if (mode === 'json') {
        console.log(JSON.stringify(locks));
        return;
      }

      if (locks.length === 0) {
        fmt.info('No active locks.');
        return;
      }

      fmt.info(`${locks.length} active lock(s):`);
      for (const l of locks) {
        const expiresIn = Math.max(0, Math.round((new Date(l.expiresAt).getTime() - Date.now()) / 1000));
        console.log(`  🔒 ${l.resource} — agent: ${l.agentId} (expires in ${expiresIn}s)`);
      }
    });
};

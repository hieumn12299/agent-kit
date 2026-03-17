import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { auditLog, auditLogSize } from '../../../../src/core/observability/audit-logger.js';
import { ensureStructure } from '../../../../src/utils/file-system.js';

describe('audit-logger', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-audit-'));
    await ensureStructure(testDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('writes audit entry', async () => {
    await auditLog(testDir, 'CREATE', 'memory/test', 'OK');
    const log = await readFile(join(testDir, '.agent', 'audit.log'), 'utf-8');
    expect(log).toContain('CREATE memory/test OK');
  });

  it('appends multiple entries', async () => {
    await auditLog(testDir, 'CREATE', 'memory/a', 'OK');
    await auditLog(testDir, 'DELETE', 'memory/b', 'OK');
    const log = await readFile(join(testDir, '.agent', 'audit.log'), 'utf-8');
    expect(log.split('\n').filter(Boolean)).toHaveLength(2);
  });

  it('contains ISO timestamp', async () => {
    await auditLog(testDir, 'UPDATE', 'session/xyz', 'FAIL');
    const log = await readFile(join(testDir, '.agent', 'audit.log'), 'utf-8');
    expect(log).toMatch(/\[\d{4}-\d{2}-\d{2}T/);
  });

  it('reports log size', async () => {
    expect(await auditLogSize(testDir)).toBe(0);
    await auditLog(testDir, 'CREATE', 'memory/test', 'OK');
    expect(await auditLogSize(testDir)).toBeGreaterThan(0);
  });
});

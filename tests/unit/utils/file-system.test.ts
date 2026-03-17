import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  ensureStructure,
  getAgentPath,
  getSubPath,
  AGENT_DIR,
  PROJECT_DIR,
  WORKING_DIR,
  SESSIONS_DIR,
  PRIVATE_DIR,
} from '../../../src/utils/file-system.js';

describe('file-system', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-kit-test-'));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('getAgentPath', () => {
    it('returns project root joined with .agent', () => {
      const result = getAgentPath('/some/project');
      expect(result).toBe(join('/some/project', AGENT_DIR));
    });
  });

  describe('getSubPath', () => {
    it('returns project root joined with .agent and subdir', () => {
      const result = getSubPath('/some/project', 'working');
      expect(result).toBe(join('/some/project', AGENT_DIR, 'working'));
    });
  });

  describe('ensureStructure', () => {
    it('creates all required directories', async () => {
      const result = await ensureStructure(testDir);
      expect(result.ok).toBe(true);

      const agentPath = getAgentPath(testDir);
      for (const dir of [PROJECT_DIR, WORKING_DIR, SESSIONS_DIR, PRIVATE_DIR]) {
        const dirStat = await stat(join(agentPath, dir));
        expect(dirStat.isDirectory()).toBe(true);
      }
    });

    it('creates .gitignore with correct content', async () => {
      await ensureStructure(testDir);

      const gitignorePath = join(getAgentPath(testDir), '.gitignore');
      const content = await readFile(gitignorePath, 'utf-8');
      expect(content).toContain('working/');
      expect(content).toContain('sessions/');
      expect(content).toContain('private/');
      expect(content).toContain('*.lock');
    });

    it('creates default config.yaml', async () => {
      await ensureStructure(testDir);

      const configPath = join(getAgentPath(testDir), 'config.yaml');
      const content = await readFile(configPath, 'utf-8');
      expect(content).toContain('projectName');
    });

    it('is idempotent — calling twice does not error or overwrite', async () => {
      const result1 = await ensureStructure(testDir);
      expect(result1.ok).toBe(true);

      // Write custom content to config to verify it's NOT overwritten
      const configPath = join(getAgentPath(testDir), 'config.yaml');
      const { writeFile: wf } = await import('node:fs/promises');
      await wf(configPath, 'projectName: "my-project"\n', 'utf-8');

      const result2 = await ensureStructure(testDir);
      expect(result2.ok).toBe(true);

      // Verify config was NOT overwritten
      const content = await readFile(configPath, 'utf-8');
      expect(content).toBe('projectName: "my-project"\n');
    });

    it('uses path.join for cross-platform compatibility', () => {
      // Verify path helpers use path.join (produces OS-native separators)
      const agentPath = getAgentPath('/root/project');
      expect(agentPath).toBe(join('/root/project', '.agent'));

      const subPath = getSubPath('/root/project', 'working');
      expect(subPath).toBe(join('/root/project', '.agent', 'working'));
    });
  });
});

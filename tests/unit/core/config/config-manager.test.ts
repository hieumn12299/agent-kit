import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  createConfig,
  loadConfig,
  isInitialized,
  updateConfig,
  resetConfig,
  configToEntries,
  getConfigValue,
} from '../../../../src/core/config/config-manager.js';
import { getAgentPath } from '../../../../src/utils/file-system.js';

describe('config-manager', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-config-'));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('isInitialized', () => {
    it('returns false for uninitialized project', async () => {
      expect(await isInitialized(testDir)).toBe(false);
    });

    it('returns true after createConfig', async () => {
      await createConfig(testDir, { userName: 'test' });
      expect(await isInitialized(testDir)).toBe(true);
    });
  });

  describe('createConfig', () => {
    it('creates .agent/ and writes config.yaml', async () => {
      const result = await createConfig(testDir, {
        userName: 'hieunm',
        communicationLanguage: 'Vietnamese',
        responseStyle: 'technical',
      });
      expect(result.ok).toBe(true);

      const configPath = join(getAgentPath(testDir), 'config.yaml');
      const content = await readFile(configPath, 'utf-8');
      expect(content).toContain('hieunm');
      expect(content).toContain('Vietnamese');
      expect(content).toContain('technical');
    });

    it('returns valid ProjectConfig with user preferences', async () => {
      const result = await createConfig(testDir, {
        userName: 'dev',
        communicationLanguage: 'English',
        responseStyle: 'casual',
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.userName).toBe('dev');
        expect(result.value.communicationLanguage).toBe('English');
        expect(result.value.responseStyle).toBe('casual');
      }
    });

    it('uses defaults when no preferences provided', async () => {
      const result = await createConfig(testDir);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.communicationLanguage).toBe('English');
        expect(result.value.responseStyle).toBe('technical');
      }
    });
  });

  describe('loadConfig', () => {
    it('loads config written by createConfig', async () => {
      await createConfig(testDir, { userName: 'test', communicationLanguage: 'Vietnamese' });
      const result = await loadConfig(testDir);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.userName).toBe('test');
        expect(result.value.communicationLanguage).toBe('Vietnamese');
      }
    });

    it('returns Err for missing config', async () => {
      const result = await loadConfig(testDir);
      expect(result.ok).toBe(false);
    });
  });

  describe('updateConfig', () => {
    it('updates a top-level key', async () => {
      await createConfig(testDir, { userName: 'old' });
      const result = await updateConfig(testDir, 'userName', 'new');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.userName).toBe('new');
      }
    });

    it('updates communicationLanguage', async () => {
      await createConfig(testDir, { userName: 'test', communicationLanguage: 'English' });
      const result = await updateConfig(testDir, 'communicationLanguage', 'Vietnamese');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.communicationLanguage).toBe('Vietnamese');
      }
    });

    it('returns Err for uninitialized project', async () => {
      const result = await updateConfig(testDir, 'userName', 'x');
      expect(result.ok).toBe(false);
    });
  });

  describe('resetConfig', () => {
    it('preserves all user preferences on reset', async () => {
      await createConfig(testDir, { userName: 'keep-me', communicationLanguage: 'Vietnamese', responseStyle: 'casual' });
      const result = await resetConfig(testDir);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.userName).toBe('keep-me');
        expect(result.value.communicationLanguage).toBe('Vietnamese');
        expect(result.value.responseStyle).toBe('casual');
      }
    });
  });

  describe('configToEntries', () => {
    it('flattens config to key-value pairs', () => {
      const entries = configToEntries({
        userName: 'dev',
        communicationLanguage: 'Vietnamese',
        responseStyle: 'casual',
      });
      expect(entries).toEqual([
        ['userName', 'dev'],
        ['communicationLanguage', 'Vietnamese'],
        ['responseStyle', 'casual'],
      ]);
    });

    it('shows (not set) for missing userName', () => {
      const entries = configToEntries({
        communicationLanguage: 'English',
        responseStyle: 'technical',
      });
      expect(entries[0]).toEqual(['userName', '(not set)']);
    });
  });

  describe('getConfigValue', () => {
    it('gets top-level value', () => {
      const config = { userName: 'x', communicationLanguage: 'English', responseStyle: 'technical' as const };
      expect(getConfigValue(config, 'userName')).toBe('x');
    });

    it('returns undefined for unknown key', () => {
      const config = { communicationLanguage: 'English', responseStyle: 'technical' as const };
      expect(getConfigValue(config, 'nonexistent')).toBeUndefined();
    });
  });
});

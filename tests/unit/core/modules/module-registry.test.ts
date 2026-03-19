import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  discoverModules,
  loadModuleManifest,
  installModule,
  removeModule,
} from '../../../../src/core/modules/module-registry.js';

const TEST_DIR = join(tmpdir(), `akit-module-test-${Date.now()}`);
const AGENT_DIR = join(TEST_DIR, '.agent');

const createModuleFixture = (name: string, version = '1.0.0') => {
  const modDir = join(TEST_DIR, `fixture-${name}`);
  mkdirSync(join(modDir, 'skills', `akit-${name}-skill`), { recursive: true });
  mkdirSync(join(modDir, 'workflows'), { recursive: true });

  writeFileSync(join(modDir, 'module.yaml'), `name: ${name}\nversion: ${version}\ndescription: "Test module ${name}"\n`);
  writeFileSync(join(modDir, 'skills', `akit-${name}-skill`, 'SKILL.md'), `---\nname: akit-${name}-skill\ndescription: Test skill\n---\n`);
  writeFileSync(join(modDir, 'workflows', `akit-${name}-workflow.md`), `# /akit-${name}\n`);

  return modDir;
};

describe('module-registry', () => {
  beforeEach(() => {
    mkdirSync(join(AGENT_DIR, 'modules'), { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('discovers no modules when directory is empty', async () => {
    const modules = await discoverModules(AGENT_DIR);
    expect(modules).toEqual([]);
  });

  it('loads module manifest from module.yaml', async () => {
    const fixturePath = createModuleFixture('test-mod');
    const manifest = await loadModuleManifest(fixturePath);
    expect(manifest).not.toBeNull();
    expect(manifest!.name).toBe('test-mod');
    expect(manifest!.version).toBe('1.0.0');
  });

  it('discovers installed modules', async () => {
    // Create a module directly in .agent/modules/
    const modDir = join(AGENT_DIR, 'modules', 'my-module');
    mkdirSync(join(modDir, 'skills', 'akit-my-skill'), { recursive: true });
    writeFileSync(join(modDir, 'module.yaml'), 'name: my-module\nversion: 2.0.0\ndescription: "My module"\n');
    writeFileSync(join(modDir, 'skills', 'akit-my-skill', 'SKILL.md'), '---\nname: akit-my-skill\n---\n');

    const modules = await discoverModules(AGENT_DIR);
    expect(modules).toHaveLength(1);
    expect(modules[0].manifest.name).toBe('my-module');
    expect(modules[0].skills).toEqual(['akit-my-skill']);
  });

  it('installs module from local path', async () => {
    const fixturePath = createModuleFixture('local-mod');
    const result = await installModule(AGENT_DIR, fixturePath);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.module.manifest.name).toBe('local-mod');
      expect(result.module.skills).toHaveLength(1);
    }
  });

  it('prevents duplicate module installation', async () => {
    const fixturePath = createModuleFixture('dup-mod');
    await installModule(AGENT_DIR, fixturePath);
    const result = await installModule(AGENT_DIR, fixturePath);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('already installed');
    }
  });

  it('removes installed module', async () => {
    const fixturePath = createModuleFixture('remove-mod');
    await installModule(AGENT_DIR, fixturePath);

    const result = await removeModule(AGENT_DIR, 'remove-mod');
    expect(result.ok).toBe(true);

    const modules = await discoverModules(AGENT_DIR);
    expect(modules).toHaveLength(0);
  });

  it('returns error for non-existent module removal', async () => {
    const result = await removeModule(AGENT_DIR, 'nonexistent');
    expect(result.ok).toBe(false);
  });
});

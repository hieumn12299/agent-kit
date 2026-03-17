import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { getAgentPath } from '../../../../src/utils/file-system.js';
import { NoopProvider, OllamaProvider, OpenAIProvider, createProvider } from '../../../../src/core/ai/ai-provider.js';
import { getAIConfig, setAIConfig, getAIProvider, isAIConfigured } from '../../../../src/core/ai/ai-config.js';
import { DEFAULT_AI_CONFIG } from '../../../../src/core/ai/ai-types.js';

describe('AI Provider types', () => {
  it('NoopProvider returns empty results', async () => {
    const noop = new NoopProvider();
    expect(noop.name).toBe('none');

    const emb = await noop.embed('test');
    expect(emb.embedding).toEqual([]);
    expect(emb.model).toBe('none');

    const comp = await noop.complete('test');
    expect(comp.text).toBe('');
    expect(comp.model).toBe('none');

    expect(await noop.isAvailable()).toBe(true);
  });

  it('OllamaProvider constructs with defaults', () => {
    const ollama = new OllamaProvider();
    expect(ollama.name).toBe('ollama');
  });

  it('OpenAIProvider constructs with config', () => {
    const openai = new OpenAIProvider({
      apiKey: 'sk-test',
      completionModel: 'gpt-4o',
    });
    expect(openai.name).toBe('openai');
  });

  it('OpenAI isAvailable requires API key', async () => {
    const noKey = new OpenAIProvider();
    expect(await noKey.isAvailable()).toBe(false);

    const withKey = new OpenAIProvider({ apiKey: 'sk-test' });
    expect(await withKey.isAvailable()).toBe(true);
  });

  it('createProvider returns correct provider', () => {
    expect(createProvider({ ...DEFAULT_AI_CONFIG, provider: 'none' })).toBeInstanceOf(NoopProvider);
    expect(createProvider({ ...DEFAULT_AI_CONFIG, provider: 'ollama' })).toBeInstanceOf(OllamaProvider);
    expect(createProvider({ ...DEFAULT_AI_CONFIG, provider: 'openai' })).toBeInstanceOf(OpenAIProvider);
  });
});

describe('AI Config', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-ai-'));
    const agentDir = getAgentPath(testDir);
    await mkdir(agentDir, { recursive: true });
    // Create minimal config
    await writeFile(join(agentDir, 'config.yaml'), 'projectName: test\n', 'utf-8');
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('returns defaults when no AI config', async () => {
    const config = await getAIConfig(testDir);
    expect(config.provider).toBe('none');
    expect(config.embeddingModel).toBe('nomic-embed-text');
  });

  it('writes and reads AI config', async () => {
    await setAIConfig(testDir, {
      provider: 'ollama',
      embeddingModel: 'nomic-embed-text',
      completionModel: 'llama3.2',
      baseUrl: 'http://localhost:11434',
    });

    const config = await getAIConfig(testDir);
    expect(config.provider).toBe('ollama');
    expect(config.embeddingModel).toBe('nomic-embed-text');
    expect(config.completionModel).toBe('llama3.2');
    expect(config.baseUrl).toBe('http://localhost:11434');
  });

  it('updates existing AI config', async () => {
    await setAIConfig(testDir, { provider: 'ollama' });
    await setAIConfig(testDir, { provider: 'openai', apiKey: 'sk-test' });

    const config = await getAIConfig(testDir);
    expect(config.provider).toBe('openai');
    expect(config.apiKey).toBe('sk-test');
  });

  it('getAIProvider returns NoopProvider by default', async () => {
    const provider = await getAIProvider(testDir);
    expect(provider).toBeInstanceOf(NoopProvider);
  });

  it('getAIProvider returns OllamaProvider when configured', async () => {
    await setAIConfig(testDir, { provider: 'ollama' });
    const provider = await getAIProvider(testDir);
    expect(provider).toBeInstanceOf(OllamaProvider);
  });

  it('isAIConfigured detects configured state', async () => {
    expect(await isAIConfigured(testDir)).toBe(false);
    await setAIConfig(testDir, { provider: 'ollama' });
    expect(await isAIConfigured(testDir)).toBe(true);
  });
});

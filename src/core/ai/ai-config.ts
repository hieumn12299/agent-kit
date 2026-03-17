import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getAgentPath } from '../../utils/file-system.js';
import { createProvider } from './ai-provider.js';
import type { AIProvider } from './ai-types.js';
import { DEFAULT_AI_CONFIG, type AIConfig, type AIProviderName } from './ai-types.js';

const CONFIG_FILE = 'config.yaml';

/**
 * Read AI config from .agent/config.yaml.
 */
export const getAIConfig = async (root: string): Promise<AIConfig> => {
  try {
    const path = join(getAgentPath(root), CONFIG_FILE);
    const raw = await readFile(path, 'utf-8');

    // Parse simple YAML section: ai:
    const aiMatch = raw.match(/^ai:\s*\n((?:\s{2}.+\n?)*)/m);
    if (!aiMatch) return { ...DEFAULT_AI_CONFIG };

    const section = aiMatch[1];
    const config = { ...DEFAULT_AI_CONFIG };

    const providerMatch = section.match(/provider:\s*(\S+)/);
    if (providerMatch) config.provider = providerMatch[1] as AIProviderName;

    const embModelMatch = section.match(/embeddingModel:\s*(\S+)/);
    if (embModelMatch) config.embeddingModel = embModelMatch[1];

    const compModelMatch = section.match(/completionModel:\s*(\S+)/);
    if (compModelMatch) config.completionModel = compModelMatch[1];

    const baseUrlMatch = section.match(/baseUrl:\s*(\S+)/);
    if (baseUrlMatch) config.baseUrl = baseUrlMatch[1];

    const apiKeyMatch = section.match(/apiKey:\s*(\S+)/);
    if (apiKeyMatch) config.apiKey = apiKeyMatch[1];

    return config;
  } catch {
    return { ...DEFAULT_AI_CONFIG };
  }
};

/**
 * Save AI config to .agent/config.yaml (appends/replaces ai: section).
 */
export const setAIConfig = async (root: string, config: Partial<AIConfig>): Promise<void> => {
  const path = join(getAgentPath(root), CONFIG_FILE);
  let raw = '';
  try {
    raw = await readFile(path, 'utf-8');
  } catch {
    // New file
  }

  const current = await getAIConfig(root);
  const merged = { ...current, ...config };

  // Build YAML section
  const lines = ['ai:'];
  lines.push(`  provider: ${merged.provider}`);
  lines.push(`  embeddingModel: ${merged.embeddingModel}`);
  lines.push(`  completionModel: ${merged.completionModel}`);
  if (merged.baseUrl) lines.push(`  baseUrl: ${merged.baseUrl}`);
  if (merged.apiKey) lines.push(`  apiKey: ${merged.apiKey}`);
  const section = lines.join('\n');

  // Replace or append
  if (raw.match(/^ai:\s*\n/m)) {
    raw = raw.replace(/^ai:\s*\n((?:\s{2}.+\n?)*)/m, section + '\n');
  } else {
    raw = raw.trimEnd() + '\n\n' + section + '\n';
  }

  await writeFile(path, raw, 'utf-8');
};

/**
 * Get a configured AI provider for the project.
 * Returns NoopProvider if none configured.
 */
export const getAIProvider = async (root: string): Promise<AIProvider> => {
  const config = await getAIConfig(root);
  return createProvider(config);
};

/**
 * Check if AI is configured (not 'none').
 */
export const isAIConfigured = async (root: string): Promise<boolean> => {
  const config = await getAIConfig(root);
  return config.provider !== 'none';
};

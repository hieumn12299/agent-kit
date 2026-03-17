import { readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { ok, err, type Result } from '../../types/result.js';
import type { ProjectConfig } from '../../types/config.js';
import { ProjectConfigSchema } from '../../schemas/config.schema.js';
import { ensureStructure, getAgentPath, CONFIG_FILE } from '../../utils/file-system.js';

/**
 * User preferences passed during `agent init`.
 */
export interface UserPreferences {
  userName?: string;
  communicationLanguage?: string;
  responseStyle?: 'formal' | 'casual' | 'technical';
}

/**
 * Check if .agent/ is already initialized.
 */
export const isInitialized = async (root: string): Promise<boolean> => {
  try {
    const { access } = await import('node:fs/promises');
    await access(getAgentPath(root));
    return true;
  } catch {
    return false;
  }
};

/**
 * Create config from user preferences and write to disk.
 */
export const createConfig = async (
  root: string,
  prefs: UserPreferences = {},
): Promise<Result<ProjectConfig, Error>> => {
  try {
    const structResult = await ensureStructure(root);
    if (!structResult.ok) return err(structResult.error);

    const config: Record<string, unknown> = {
      userName: prefs.userName,
      communicationLanguage: prefs.communicationLanguage ?? 'English',
      responseStyle: prefs.responseStyle ?? 'technical',
    };

    const parsed = ProjectConfigSchema.safeParse(config);
    if (!parsed.success) {
      return err(new Error(`Invalid config: ${parsed.error.message}`));
    }

    const configPath = join(getAgentPath(root), CONFIG_FILE);
    const yaml = configToYaml(parsed.data);
    await writeFile(configPath, yaml, 'utf-8');

    return ok(parsed.data);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

/**
 * Load config from disk and validate.
 */
export const loadConfig = async (root: string): Promise<Result<ProjectConfig, Error>> => {
  try {
    const configPath = join(getAgentPath(root), CONFIG_FILE);
    const raw = await readFile(configPath, 'utf-8');
    const data = yamlToConfig(raw);
    const parsed = ProjectConfigSchema.safeParse(data);
    if (!parsed.success) {
      return err(new Error(`Invalid config: ${parsed.error.message}`));
    }
    return ok(parsed.data);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

/**
 * Update a single config key.
 */
export const updateConfig = async (
  root: string,
  key: string,
  value: string,
): Promise<Result<ProjectConfig, Error>> => {
  const loadResult = await loadConfig(root);
  if (!loadResult.ok) return loadResult;

  const config = { ...loadResult.value } as Record<string, unknown>;
  config[key] = coerceValue(value);

  const parsed = ProjectConfigSchema.safeParse(config);
  if (!parsed.success) {
    return err(new Error(`Invalid value: ${parsed.error.message}`));
  }

  const configPath = join(getAgentPath(root), CONFIG_FILE);
  await writeFile(configPath, configToYaml(parsed.data), 'utf-8');
  return ok(parsed.data);
};

/**
 * Reset config to defaults, preserving user preferences.
 */
export const resetConfig = async (root: string): Promise<Result<ProjectConfig, Error>> => {
  try {
    const existing = await loadConfig(root);
    const configPath = join(getAgentPath(root), CONFIG_FILE);
    const resetData = {
      userName: existing.ok ? existing.value.userName : undefined,
      communicationLanguage: existing.ok ? existing.value.communicationLanguage : 'English',
      responseStyle: existing.ok ? existing.value.responseStyle : 'technical',
    };

    const parsed = ProjectConfigSchema.safeParse(resetData);
    if (!parsed.success) {
      return err(new Error(`Invalid default config: ${parsed.error.message}`));
    }

    await writeFile(configPath, configToYaml(parsed.data), 'utf-8');
    return ok(parsed.data);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

/**
 * Delete config and .agent/ folder.
 */
export const deleteConfig = async (root: string): Promise<Result<void, Error>> => {
  try {
    await rm(getAgentPath(root), { recursive: true, force: true });
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

/**
 * Get a flat key-value map of config for display.
 */
export const configToEntries = (config: ProjectConfig): [string, string][] => [
  ['userName', config.userName ?? '(not set)'],
  ['communicationLanguage', config.communicationLanguage],
  ['responseStyle', config.responseStyle],
];

/**
 * Get a single value from config by key.
 */
export const getConfigValue = (config: ProjectConfig, key: string): string | undefined => {
  const val = (config as Record<string, unknown>)[key];
  return val === undefined ? undefined : String(val);
};

// ── Helpers ──────────────────────────────────────────────────────────

const coerceValue = (value: string): unknown => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

const escapeYaml = (s: string): string =>
  s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const configToYaml = (config: ProjectConfig): string => {
  const lines: string[] = [];
  if (config.userName) lines.push(`userName: "${escapeYaml(config.userName)}"`);
  lines.push(`communicationLanguage: "${escapeYaml(config.communicationLanguage)}"`);
  lines.push(`responseStyle: "${config.responseStyle}"`);
  lines.push('');
  return lines.join('\n');
};

const unescapeYaml = (s: string): string =>
  s.replace(/\\"/g, '"').replace(/\\\\/g, '\\');

const parseYamlValue = (rawVal: string): string | boolean => {
  const trimmed = rawVal.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return unescapeYaml(trimmed.slice(1, -1));
  }
  return trimmed;
};

const yamlToConfig = (raw: string): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    const rawVal = trimmed.slice(colonIdx + 1);
    if (rawVal.trim()) {
      result[key] = parseYamlValue(rawVal);
    }
  }

  return result;
};

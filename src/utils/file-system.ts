import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { ok, err, type Result } from '../types/result.js';

// ── Directory constants ──────────────────────────────────────────────
export const AGENT_DIR = '.agent';
export const PROJECT_DIR = 'project';
export const WORKING_DIR = 'working';
export const SESSIONS_DIR = 'sessions';
export const PRIVATE_DIR = 'private';
export const CONFIG_FILE = 'config.yaml';
export const GITIGNORE_FILE = '.gitignore';
export const KNOWLEDGE_DIR = 'knowledge';
export const GLOBAL_AGENT_DIR = '.agent-kit';

// ── Path helpers ─────────────────────────────────────────────────────

/** Returns the absolute path to the `.agent/` directory. */
export const getAgentPath = (projectRoot: string): string =>
  join(projectRoot, AGENT_DIR);

/** Returns the absolute path to a subdirectory inside `.agent/`. */
export const getSubPath = (projectRoot: string, subdir: string): string =>
  join(projectRoot, AGENT_DIR, subdir);

/** Returns the absolute path to `~/.agent-kit/knowledge/`. */
export const getKnowledgePath = (): string =>
  join(homedir(), GLOBAL_AGENT_DIR, KNOWLEDGE_DIR);

/** Ensure the knowledge directory exists. */
export const ensureKnowledgeDir = async (): Promise<void> => {
  await mkdir(getKnowledgePath(), { recursive: true });
};


// ── Core functions ───────────────────────────────────────────────────

const GITIGNORE_CONTENT = `# Agent-Kit — auto-generated
working/
sessions/
private/
*.lock
`;

const DEFAULT_CONFIG = `projectName: ""
`;

/** Check if a file or directory exists. */
const exists = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Creates the `.agent/` folder structure idempotently.
 * Existing files/directories are never overwritten.
 */
export const ensureStructure = async (
  projectRoot: string,
): Promise<Result<void, Error>> => {
  try {
    const agentPath = getAgentPath(projectRoot);

    // Create all subdirectories sequentially for clearer error messages
    const dirs = [PROJECT_DIR, WORKING_DIR, SESSIONS_DIR, PRIVATE_DIR];
    for (const dir of dirs) {
      await mkdir(join(agentPath, dir), { recursive: true });
    }

    // Create .gitignore only if it doesn't exist
    const gitignorePath = join(agentPath, GITIGNORE_FILE);
    if (!(await exists(gitignorePath))) {
      await writeFile(gitignorePath, GITIGNORE_CONTENT, 'utf-8');
    }

    // Create default config.yaml only if it doesn't exist
    const configPath = join(agentPath, CONFIG_FILE);
    if (!(await exists(configPath))) {
      await writeFile(configPath, DEFAULT_CONFIG, 'utf-8');
    }

    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

import { readFile, writeFile, readdir, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { ok, err, type Result } from '../../types/result.js';
import type { MemoryEntry, MemoryTier } from '../../types/memory.js';
import { MemoryEntrySchema } from '../../schemas/memory.schema.js';
import { getSubPath, getKnowledgePath, PROJECT_DIR, WORKING_DIR, PRIVATE_DIR } from '../../utils/file-system.js';
import { sanitizeMemoryId } from '../../utils/validation.js';
import { registry } from '../plugins/plugin-registry.js';

const MAX_DEDUPE_ITERATIONS = 100;

// ── Path helpers ─────────────────────────────────────────────────────

const tierDir = (tier: MemoryTier): string => {
  if (tier === 'working') return WORKING_DIR;
  if (tier === 'private') return PRIVATE_DIR;
  if (tier === 'knowledge') return ''; // handled separately
  return PROJECT_DIR;
};

export const getMemoriesDir = (root: string, tier: MemoryTier = 'project'): string => {
  if (tier === 'knowledge') return getKnowledgePath();
  return getSubPath(root, tierDir(tier));
};

const memoryFile = (root: string, id: string, tier: MemoryTier = 'project'): string =>
  join(getMemoriesDir(root, tier), `${id}.md`);

// ── YAML Frontmatter serialization ──────────────────────────────────

const escapeYamlString = (s: string): string =>
  s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const serializeMemory = (entry: MemoryEntry): string => {
  const lines = [
    '---',
    `id: ${entry.id}`,
    `title: "${escapeYamlString(entry.title)}"`,
    `type: ${entry.type}`,
    `tier: ${entry.tier}`,
    `source: ${entry.source}`,
    `timestamp: ${entry.timestamp}`,
    `confidence: ${entry.confidence}`,
    `tags: [${entry.tags.map((t) => `"${escapeYamlString(t)}"`).join(', ')}]`,
    '---',
    '',
    entry.content,
    '',
  ];
  return lines.join('\n');
};

/**
 * Parse tags array handling commas inside quoted values.
 * Input: '"tag-a", "tag,b", "c"' → ['tag-a', 'tag,b', 'c']
 */
const parseTags = (raw: string): string[] => {
  const tags: string[] = [];
  let current = '';
  let inQuote = false;
  for (const ch of raw) {
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === ',' && !inQuote) { const t = current.trim(); if (t) tags.push(t); current = ''; continue; }
    current += ch;
  }
  const last = current.trim();
  if (last) tags.push(last);
  return tags;
};

const parseMemory = (raw: string): Result<MemoryEntry, Error> => {
  // Normalize Windows line endings
  const normalized = raw.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/);
  if (!match) return err(new Error('Invalid memory format: missing frontmatter'));

  const frontmatter = match[1];
  const content = match[2].trim();

  try {
    const data: Record<string, unknown> = {};
    for (const line of frontmatter.split('\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      let val: string | number | string[] = line.slice(colonIdx + 1).trim();

      // Parse specific types
      if (key === 'confidence') {
        data[key] = parseFloat(val);
      } else if (key === 'tags') {
        const tagMatch = val.match(/\[(.*)\]/);
        data[key] = tagMatch ? parseTags(tagMatch[1]) : [];
      } else if (key === 'title') {
        // Remove surrounding quotes and unescape
        val = val.replace(/^"|"$/g, '').replace(/\\\\/g, '\\').replace(/\\"/g, '"');
        data[key] = val;
      } else {
        data[key] = val;
      }
    }
    data['content'] = content;

    const parsed = MemoryEntrySchema.safeParse(data);
    if (!parsed.success) {
      return err(new Error(`Invalid memory data: ${parsed.error.message}`));
    }
    return ok(parsed.data);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

// ── Slug generation ─────────────────────────────────────────────────

/**
 * Convert title to kebab-case slug.
 */
export const toSlug = (title: string): string => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  // Fallback for empty/non-ASCII-only titles
  return slug || randomBytes(4).toString('hex');
};

/**
 * Deduplicate slug by appending -N suffix if collision found.
 */
const dedupeSlug = async (root: string, slug: string, tier: MemoryTier): Promise<string> => {
  const dir = getMemoriesDir(root, tier);
  let candidate = slug;
  let n = 1;
  while (n <= MAX_DEDUPE_ITERATIONS) {
    try {
      await readFile(join(dir, `${candidate}.md`), 'utf-8');
      // File exists, try next suffix
      candidate = `${slug}-${n}`;
      n++;
    } catch {
      return candidate;
    }
  }
  throw new Error(`Slug collision limit exceeded for "${slug}"`);
};

// ── Public API ───────────────────────────────────────────────────────

/**
 * Write a memory entry as YAML frontmatter + Markdown body, atomically.
 */
export const writeMemory = async (
  root: string,
  entry: MemoryEntry,
  options?: { exclusive?: boolean },
): Promise<Result<void, Error>> => {
  try {
    // Ensure knowledge dir exists before writing
    if (entry.tier === 'knowledge') {
      const { ensureKnowledgeDir } = await import('../../utils/file-system.js');
      await ensureKnowledgeDir();
    }
    const target = memoryFile(root, entry.id, entry.tier);
    if (options?.exclusive) {
      // Exclusive create: fail if file already exists (prevents TOCTOU race)
      await writeFile(target, serializeMemory(entry), { encoding: 'utf-8', flag: 'wx' });
    } else {
      const tmp = `${target}.tmp`;
      await writeFile(tmp, serializeMemory(entry), 'utf-8');
      await rename(tmp, target);
    }
    // Auto-sync index (fire-and-forget)
    const { updateIndexEntry } = await import('./memory-index.js');
    await updateIndexEntry(root, entry).catch(() => {});
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

/**
 * Read a single memory by ID.
 */
export const readMemory = async (
  root: string,
  id: string,
  tier: MemoryTier = 'project',
): Promise<Result<MemoryEntry, Error>> => {
  const idCheck = sanitizeMemoryId(id);
  if (!idCheck.ok) return err(idCheck.error);

  try {
    const raw = await readFile(memoryFile(root, idCheck.value, tier), 'utf-8');
    return parseMemory(raw);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

/**
 * List all memories in a given tier.
 */
export const listMemories = async (
  root: string,
  tier: MemoryTier = 'project',
): Promise<Result<MemoryEntry[], Error>> => {
  try {
    const dir = getMemoriesDir(root, tier);
    let files: string[];
    try {
      files = await readdir(dir);
    } catch {
      return ok([]);
    }

    const memories: MemoryEntry[] = [];
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const id = file.replace('.md', '');
      const result = await readMemory(root, id, tier);
      if (result.ok) {
        memories.push(result.value);
      } else {
        // Story 7.2: isolate corrupted files with warning
        console.warn(`⚠️  Skipping corrupted memory: ${file} (${result.error.message})`);
      }
    }

    return ok(memories);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

/**
 * List corrupted (unparseable) memory files in a tier.
 */
export const listCorruptedFiles = async (
  root: string,
  tier: MemoryTier = 'project',
): Promise<string[]> => {
  try {
    const dir = getMemoriesDir(root, tier);
    const files = await readdir(dir);
    const corrupted: string[] = [];
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const id = file.replace('.md', '');
      const result = await readMemory(root, id, tier);
      if (!result.ok) corrupted.push(file);
    }
    return corrupted;
  } catch {
    return [];
  }
};

/**
 * Count memories in a tier.
 */
export const countMemories = async (root: string, tier: MemoryTier = 'project'): Promise<number> => {
  const result = await listMemories(root, tier);
  return result.ok ? result.value.length : 0;
};

/**
 * List all memories across project + working tiers.
 */
export const listAllMemories = async (root: string): Promise<MemoryEntry[]> => {
  const [projectResult, workingResult, knowledgeResult] = await Promise.all([
    listMemories(root, 'project'),
    listMemories(root, 'working'),
    listMemories(root, 'knowledge'),
  ]);
  return [
    ...(projectResult.ok ? projectResult.value : []),
    ...(workingResult.ok ? workingResult.value : []),
    ...(knowledgeResult.ok ? knowledgeResult.value : []),
  ];
};

/**
 * Create a memory with auto-generated slug ID from title, deduped.
 */
export const createMemory = async (
  root: string,
  entry: Omit<MemoryEntry, 'id'> & { id?: string },
): Promise<Result<MemoryEntry, Error>> => {
  const slug = entry.id || toSlug(entry.title);
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const id = await dedupeSlug(root, slug, entry.tier);
    const memory: MemoryEntry = { ...entry, id } as MemoryEntry;

    const result = await writeMemory(root, memory, { exclusive: true });
    if (result.ok) {
      // Fire plugin hook (fire-and-forget)
      registry.invokeOnMemoryCreate(memory).catch(() => {});
      return ok(memory);
    }

    // EEXIST means another process created the same slug — retry
    if (!result.error.message.includes('EEXIST')) {
      return err(result.error);
    }
    // Loop retries with fresh dedupeSlug
  }

  return err(new Error(`Failed to create memory after ${maxRetries} retries (slug collision)`));
};

/**
 * Delete a memory by ID.
 */
export const deleteMemory = async (
  root: string,
  id: string,
  tier: MemoryTier = 'project',
): Promise<Result<void, Error>> => {
  const idCheck = sanitizeMemoryId(id);
  if (!idCheck.ok) return err(idCheck.error);

  try {
    const { unlink } = await import('node:fs/promises');
    await unlink(memoryFile(root, idCheck.value, tier));
    // Update index (fire-and-forget)
    const { removeIndexEntry } = await import('./memory-index.js');
    await removeIndexEntry(root, idCheck.value).catch(() => {});
    // Fire plugin hook (fire-and-forget)
    registry.invokeOnMemoryDelete(idCheck.value, tier).catch(() => {});
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

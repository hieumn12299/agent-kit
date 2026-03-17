import type { Command } from 'commander';
import { execFileSync } from 'node:child_process';
import { listMemories, readMemory, writeMemory, deleteMemory, createMemory } from '../../core/memory/memory-store.js';
import { ConsoleFormatter } from '../output-formatter.js';
import { handleCommandError } from '../error-handler.js';
import type { MemoryTier } from '../../types/memory.js';
import { join } from 'node:path';
import { getSubPath } from '../../utils/file-system.js';
import { getOutputMode, requireInit } from '../utils.js';

const ALL_TIERS: MemoryTier[] = ['project', 'working', 'private', 'knowledge'];

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Find a memory across tiers. Returns the memory and its tier.
 */
const findMemory = async (
  root: string,
  id: string,
  tier?: MemoryTier,
): Promise<{ memory: import('../../types/memory.js').MemoryEntry; tier: MemoryTier } | null> => {
  const tiersToSearch = tier ? [tier] : ALL_TIERS;
  for (const t of tiersToSearch) {
    const result = await readMemory(root, id, t);
    if (result.ok) return { memory: result.value, tier: t };
  }
  return null;
};

export const registerMemoryCommand = (program: Command): void => {
  const memory = program
    .command('memory')
    .description('Manage project memories');

  // ── memory list ────────────────────────────────────────────────────
  memory
    .command('list')
    .description('List all stored memories')
    .option('--limit <n>', 'Maximum number of memories to show', '50')
    .option('--tier <tier>', 'Filter to specific tier (project, working, private, knowledge)')
    .action(async function (this: Command) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();
      const limit = parseInt(this.opts().limit, 10) || 50;
      const tierOpt = this.opts().tier as MemoryTier | undefined;

      if (!(await requireInit(root, fmt))) return;

      // Validate --tier option
      if (tierOpt && !ALL_TIERS.includes(tierOpt)) {
        fmt.error(`Invalid tier '${tierOpt}'.`, 'Valid tiers: project, working, private, knowledge.');
        return;
      }

      // Validate --limit
      if (limit <= 0) {
        fmt.error('Invalid limit. Must be a positive number.');
        return;
      }

      // List from specified tier or all tiers
      const tiersToList = tierOpt ? [tierOpt] : ALL_TIERS;
      const allMemories: import('../../types/memory.js').MemoryEntry[] = [];
      for (const t of tiersToList) {
        const result = await listMemories(root, t);
        if (result.ok) allMemories.push(...result.value);
      }

      const memories = allMemories;

      if (memories.length === 0) {
        if (mode === 'json') { console.log(JSON.stringify([])); }
        else { fmt.info("📭 No memories yet. Start your first session with 'agent start'."); }
        return;
      }

      memories.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      const limited = memories.slice(0, limit);

      if (mode === 'json') { console.log(JSON.stringify(limited)); return; }

      fmt.newline();
      fmt.table(
        ['ID', 'Type', 'Title', 'Date'],
        limited.map((m) => [m.id, m.type, m.title.slice(0, 40), formatDate(m.timestamp)]),
      );

      if (memories.length > limit) {
        fmt.newline();
        fmt.info(`Showing ${limit} of ${memories.length}. Use --limit to see more.`);
      }
      fmt.newline();
    });

  // ── memory promote ─────────────────────────────────────────────────
  memory
    .command('promote <id>')
    .description('Promote a memory to a higher tier (working→project→knowledge)')
    .option('--to <tier>', 'Target tier (default: next in path)')
    .action(async function (this: Command, id: string) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();
      const toTier = this.opts().to as MemoryTier | undefined;

      if (!(await requireInit(root, fmt))) return;

      // Find memory
      const found = await findMemory(root, id);
      if (!found) {
        fmt.error(`Memory '${id}' not found.`, "Run 'agent memory list' to see available memories.");
        return;
      }

      const { promoteMemory, getDefaultPromotionTarget } = await import('../../core/memory/promoter.js');

      // Determine target tier
      const target = toTier ?? getDefaultPromotionTarget(found.tier);
      if (!target) {
        fmt.error(`Cannot promote from '${found.tier}'.`, 'Use --to <tier> to specify target.');
        return;
      }

      if (target === found.tier) {
        fmt.info(`Memory '${id}' is already in '${target}' tier.`);
        return;
      }

      const result = await promoteMemory(root, id, found.tier, target);
      if (!result.ok) {
        handleCommandError(fmt, result.error);
        return;
      }

      if (mode === 'json') {
        console.log(JSON.stringify({ status: 'promoted', id, from: found.tier, to: target }));
      } else {
        fmt.success(`Memory '${id}' promoted: ${found.tier} → ${target}`);
      }
    });

  // ── memory edit ────────────────────────────────────────────────────
  memory
    .command('edit <id>')
    .description('Edit a memory in $EDITOR or change its tier')
    .option('--tier <tier>', 'Promote/demote memory tier')
    .action(async function (this: Command, id: string) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();
      const tierOpt = this.opts().tier as MemoryTier | undefined;

      if (!(await requireInit(root, fmt))) return;

      // Find memory across all tiers
      const found = await findMemory(root, id);
      const result = found ? { ok: true as const, value: found.memory } : { ok: false as const, error: new Error('not found') };
      if (!result.ok) {
        fmt.error(`Memory '${id}' not found.`, "Run 'agent memory list' to see available memories.");
        return;
      }

      const memory = result.value;

      // Tier promotion (no editor)
      if (tierOpt) {
        if (tierOpt !== 'project' && tierOpt !== 'working' && tierOpt !== 'private' && tierOpt !== 'knowledge') {
          fmt.error(`Invalid tier '${tierOpt}'.`, 'Valid tiers: project, working, private, knowledge.');
          return;
        }

        if (tierOpt === memory.tier) {
          fmt.info(`Memory '${id}' is already in tier '${tierOpt}'.`);
          return;
        }

        const oldTier = memory.tier;
        const updated = { ...memory, tier: tierOpt };
        const writeResult = await writeMemory(root, updated);
        if (!writeResult.ok) { handleCommandError(fmt, writeResult.error); return; }

        // Delete from old tier location
        await deleteMemory(root, id, oldTier);

        if (mode === 'json') {
          console.log(JSON.stringify({ status: 'promoted', id, from: oldTier, to: tierOpt }));
        } else {
          fmt.success(`Memory '${id}' promoted: ${oldTier} → ${tierOpt}`);
        }
        return;
      }

      // Open in $EDITOR
      const editor = process.env['EDITOR'] || process.env['VISUAL'] || 'vi';
      const memoryTier = found?.tier ?? 'project';
      const filePath = join(getSubPath(root, memoryTier), `${id}.md`);

      try {
        execFileSync(editor, [filePath], { stdio: 'inherit' });
      } catch {
        fmt.error('Editor exited with an error.');
        return;
      }

      // Re-read and validate after edit
      const reread = await readMemory(root, id, memoryTier);
      if (!reread.ok) {
        fmt.error('Memory file is invalid after edit.', 'Check YAML frontmatter format.');
        return;
      }

      if (mode === 'json') {
        console.log(JSON.stringify({ status: 'edited', id }));
      } else {
        fmt.success(`Memory '${id}' updated.`);
      }
    });

  // ── memory delete ──────────────────────────────────────────────────
  memory
    .command('delete <id>')
    .description('Delete a memory by ID')
    .option('--tier <tier>', 'Tier to delete from (auto-detected if omitted)')
    .action(async function (this: Command, id: string) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();
      const tierOpt = this.opts().tier as MemoryTier | undefined;

      if (!(await requireInit(root, fmt))) return;

      // Validate --tier option
      if (tierOpt && !ALL_TIERS.includes(tierOpt)) {
        fmt.error(`Invalid tier '${tierOpt}'.`, 'Valid tiers: project, working, private, knowledge.');
        return;
      }

      const found = await findMemory(root, id, tierOpt);
      if (!found) {
        fmt.error(`Memory '${id}' not found.`, "Run 'agent memory list' to see available memories.");
        return;
      }

      const result = await deleteMemory(root, id, found.tier);
      if (!result.ok) { handleCommandError(fmt, result.error); return; }

      if (mode === 'json') {
        console.log(JSON.stringify({ status: 'deleted', id }));
      } else {
        fmt.success(`Memory '${id}' deleted.`);
      }
    });

  // ── memory add ─────────────────────────────────────────────────────
  memory
    .command('add')
    .description('Manually save a new memory')
    .option('--title <title>', 'Memory title (required in non-interactive)')
    .option('--content <content>', 'Memory content (required in non-interactive)')
    .option('--type <type>', 'Memory type', 'insight')
    .option('--auto', 'Use AI to suggest type and tags')
    .action(async function (this: Command) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();
      const opts = this.opts();

      if (!(await requireInit(root, fmt))) return;

      const title = opts.title as string | undefined;
      const content = opts.content as string | undefined;
      const type = (opts.type || 'insight') as string;

      if (!title || !content) {
        // Interactive: open $EDITOR with template
        const { writeFileSync, readFileSync, unlinkSync } = await import('node:fs');
        const { tmpdir } = await import('node:os');
        const tmpFile = join(tmpdir(), `agent-memory-${Date.now()}.md`);
        const template = `---\ntitle: ""\ntype: ${type}\n---\n\nWrite your memory content here.\n`;

        writeFileSync(tmpFile, template, 'utf-8');
        const editor = process.env['EDITOR'] || process.env['VISUAL'] || 'vi';
        try {
          execFileSync(editor, [tmpFile], { stdio: 'inherit' });
        } catch {
          fmt.error('Editor exited with an error.');
          return;
        }

        const raw = readFileSync(tmpFile, 'utf-8');
        unlinkSync(tmpFile);

        // Parse template
        const match = raw.match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/);
        if (!match) {
          fmt.error('Invalid format. Keep the YAML frontmatter block.');
          return;
        }

        const fm = match[1];
        const body = match[2].trim();
        const titleMatch = fm.match(/title:\s*"(.+)"/);
        const parsedTitle = titleMatch?.[1];

        if (!parsedTitle || !body || body === 'Write your memory content here.') {
          fmt.error('Memory not saved. Title and content are required.');
          return;
        }

        const memResult = await createMemory(root, {
          title: parsedTitle,
          type: type as 'insight',
          tier: 'project',
          source: 'manual',
          timestamp: new Date().toISOString(),
          confidence: 1,
          tags: ['manual'],
          content: body,
        });

        if (!memResult.ok) { handleCommandError(fmt, memResult.error); return; }
        if (mode === 'json') {
          console.log(JSON.stringify({ status: 'created', id: memResult.value.id }));
        } else {
          fmt.success(`Memory '${memResult.value.id}' saved.`);
        }
        return;
      }

      // Non-interactive: use --title and --content
      let finalType = type as 'insight';
      let finalTags = ['manual'];
      let autoConfidence = 1;

      // AI auto-categorization
      if (opts.auto) {
        try {
          const { suggestCategory } = await import('../../core/ai/auto-categorizer.js');
          const { getAIProvider, isAIConfigured } = await import('../../core/ai/ai-config.js');

          if (await isAIConfigured(root)) {
            const provider = await getAIProvider(root);
            fmt.info('🤖 AI suggesting category...');
            const suggestion = await suggestCategory(title, content, provider);

            if (suggestion) {
              finalType = suggestion.type as typeof finalType;
              finalTags = suggestion.tags.length > 0 ? suggestion.tags : ['manual'];
              autoConfidence = suggestion.confidence;
              if (mode !== 'json') {
                fmt.info(`  Type: ${suggestion.type} (${Math.round(suggestion.confidence * 100)}%)`);
                fmt.info(`  Tags: ${suggestion.tags.join(', ')}`);
              }
            } else {
              if (mode !== 'json') fmt.info('AI unavailable, using defaults.');
            }
          } else {
            if (mode !== 'json') fmt.info('AI not configured. Run "agent config ai" first. Using defaults.');
          }
        } catch {
          if (mode !== 'json') fmt.info('AI suggestion failed, using defaults.');
        }
      }

      const memResult = await createMemory(root, {
        title,
        type: finalType,
        tier: 'project',
        source: 'manual',
        timestamp: new Date().toISOString(),
        confidence: autoConfidence,
        tags: finalTags,
        content,
      });

      if (!memResult.ok) { handleCommandError(fmt, memResult.error); return; }
      if (mode === 'json') {
        console.log(JSON.stringify({ status: 'created', id: memResult.value.id, autoSuggested: !!opts.auto }));
      } else {
        fmt.success(`Memory '${memResult.value.id}' saved.`);
      }
    });

  // ── memory correct ─────────────────────────────────────────────────
  memory
    .command('correct <id>')
    .description('Correct an existing memory inline')
    .action(async function (this: Command, id: string) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();

      if (!(await requireInit(root, fmt))) return;

      const found = await findMemory(root, id);
      if (!found) {
        fmt.error(`Memory '${id}' not found.`, "Run 'agent memory list' to see available memories.");
        return;
      }

      const filePath = join(getSubPath(root, found.tier), `${id}.md`);
      const editor = process.env['EDITOR'] || process.env['VISUAL'] || 'vi';

      try {
        execFileSync(editor, [filePath], { stdio: 'inherit' });
      } catch {
        fmt.error('Editor exited with an error.');
        return;
      }

      // Validate after correction
      const reread = await readMemory(root, id, found.tier);
      if (!reread.ok) {
        fmt.error('Memory file is invalid after correction.', 'Check YAML frontmatter format.');
        return;
      }

      // Update timestamp to mark correction
      const corrected = { ...reread.value, timestamp: new Date().toISOString() };
      const writeResult = await writeMemory(root, corrected);
      if (!writeResult.ok) {
        handleCommandError(fmt, writeResult.error);
        return;
      }

      if (mode === 'json') {
        console.log(JSON.stringify({ status: 'corrected', id }));
      } else {
        fmt.success(`Memory '${id}' corrected and updated.`);
      }
    });
};

import type { Command } from 'commander';
import { ConsoleFormatter } from '../output-formatter.js';
import { handleCommandError } from '../error-handler.js';
import { getOutputMode, requireInit } from '../utils.js';

/**
 * Scan .agent/ directory and generate CSV manifests for skills, workflows, agents, and files.
 */

interface ManifestEntry {
  [key: string]: string;
}

/** Convert array of objects to CSV string */
const toCSV = (rows: ManifestEntry[], columns: string[]): string => {
  const header = columns.join(',');
  const lines = rows.map(row =>
    columns.map(col => `"${(row[col] ?? '').replace(/"/g, '""')}"`).join(',')
  );
  return [header, ...lines].join('\n') + '\n';
};

/** Extract YAML frontmatter value from markdown */
const extractFrontmatter = (content: string, key: string): string => {
  const match = content.match(new RegExp(`^${key}:\\s*['"]?(.+?)['"]?\\s*$`, 'm'));
  return match?.[1] ?? '';
};

/** Generate skill manifest from .agent/skills/ */
const generateSkillManifest = async (agentDir: string): Promise<ManifestEntry[]> => {
  const { readdirSync, readFileSync, existsSync } = await import('node:fs');
  const { join } = await import('node:path');
  const skillsDir = join(agentDir, 'skills');
  if (!existsSync(skillsDir)) return [];

  const entries: ManifestEntry[] = [];
  const skills = readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.startsWith('akit-'));

  for (const skill of skills) {
    const skillFile = join(skillsDir, skill.name, 'SKILL.md');
    if (!existsSync(skillFile)) continue;
    const content = readFileSync(skillFile, 'utf-8');
    entries.push({
      canonicalId: skill.name,
      name: extractFrontmatter(content, 'name') || skill.name,
      description: extractFrontmatter(content, 'description'),
      path: `.agent/skills/${skill.name}/SKILL.md`,
    });
  }
  return entries;
};

/** Generate workflow manifest from .agent/workflows/ */
const generateWorkflowManifest = async (agentDir: string): Promise<ManifestEntry[]> => {
  const { readdirSync, readFileSync, existsSync } = await import('node:fs');
  const { join } = await import('node:path');
  const wfDir = join(agentDir, 'workflows');
  if (!existsSync(wfDir)) return [];

  const entries: ManifestEntry[] = [];
  const files = readdirSync(wfDir).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const content = readFileSync(join(wfDir, file), 'utf-8');
    const name = file.replace('.md', '');
    // Extract first line after # heading as description
    const descMatch = content.match(/^#\s+.+\n+(.+)/m);
    entries.push({
      name,
      description: descMatch?.[1]?.replace(/^>\s*/, '').trim() ?? '',
      path: `.agent/workflows/${file}`,
    });
  }
  return entries;
};

/** Generate agent manifest from .agent/agents.yaml */
const generateAgentManifest = async (agentDir: string): Promise<ManifestEntry[]> => {
  const { readFileSync, existsSync } = await import('node:fs');
  const { join } = await import('node:path');
  const agentsFile = join(agentDir, 'agents.yaml');
  if (!existsSync(agentsFile)) return [];

  const content = readFileSync(agentsFile, 'utf-8');
  const entries: ManifestEntry[] = [];

  // Simple YAML parser for agents structure (avoids adding yaml dep)
  let currentId = '';
  const agent: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const idMatch = line.match(/^\s{2}(\S+):$/);
    if (idMatch) {
      if (currentId && agent.displayName) {
        entries.push({ id: currentId, ...agent });
      }
      currentId = idMatch[1];
      Object.keys(agent).forEach(k => delete agent[k]);
      continue;
    }
    const kvMatch = line.match(/^\s{4}(\w+):\s*["']?(.+?)["']?\s*$/);
    if (kvMatch && currentId) {
      agent[kvMatch[1]] = kvMatch[2];
    }
  }
  if (currentId && agent.displayName) {
    entries.push({ id: currentId, ...agent });
  }
  return entries;
};

/** Generate files manifest (hash all .agent/ files) */
const generateFilesManifest = async (agentDir: string): Promise<ManifestEntry[]> => {
  const { readdirSync, statSync, existsSync } = await import('node:fs');
  const { join, relative } = await import('node:path');
  if (!existsSync(agentDir)) return [];

  const entries: ManifestEntry[] = [];
  const walk = (dir: string) => {
    const items = readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = join(dir, item.name);
      if (item.isDirectory()) {
        if (item.name === 'manifests' || item.name === 'memories') continue; // skip generated
        walk(fullPath);
      } else {
        const stats = statSync(fullPath);
        const ext = item.name.split('.').pop() ?? '';
        entries.push({
          type: ext,
          name: item.name,
          path: `.agent/${relative(agentDir, fullPath)}`,
          sizeBytes: String(stats.size),
        });
      }
    }
  };
  walk(agentDir);
  return entries;
};

export const registerManifestCommand = (program: Command): void => {
  const manifest = program
    .command('manifest')
    .description('Generate and view project manifests');

  // agent manifest generate
  manifest
    .command('generate')
    .description('Scan .agent/ and generate CSV manifests')
    .action(async function (this: Command) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();

      try {
        if (!await requireInit(root, fmt)) return;
        const { mkdirSync, writeFileSync } = await import('node:fs');
        const { join } = await import('node:path');

        const agentDir = join(root, '.agent');
        const manifestDir = join(agentDir, 'manifests');
        mkdirSync(manifestDir, { recursive: true });

        // Generate all manifests
        const skills = await generateSkillManifest(agentDir);
        const workflows = await generateWorkflowManifest(agentDir);
        const agents = await generateAgentManifest(agentDir);
        const files = await generateFilesManifest(agentDir);

        // Write CSVs
        writeFileSync(
          join(manifestDir, 'skill-manifest.csv'),
          toCSV(skills, ['canonicalId', 'name', 'description', 'path']),
        );
        writeFileSync(
          join(manifestDir, 'workflow-manifest.csv'),
          toCSV(workflows, ['name', 'description', 'path']),
        );
        writeFileSync(
          join(manifestDir, 'agent-manifest.csv'),
          toCSV(agents, ['id', 'displayName', 'icon', 'title', 'role']),
        );
        writeFileSync(
          join(manifestDir, 'files-manifest.csv'),
          toCSV(files, ['type', 'name', 'path', 'sizeBytes']),
        );

        fmt.success('Manifests generated!');
        fmt.info(`📋 ${skills.length} skills`);
        fmt.info(`📋 ${workflows.length} workflows`);
        fmt.info(`🎭 ${agents.length} agents`);
        fmt.info(`📂 ${files.length} files indexed`);
        fmt.info(`📁 Output: .agent/manifests/`);
      } catch (e) {
        handleCommandError(fmt, e);
      }
    });

  // agent manifest list
  manifest
    .command('list')
    .description('Show summary of installed skills, workflows, and agents')
    .action(async function (this: Command) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();

      try {
        if (!await requireInit(root, fmt)) return;
        const { join } = await import('node:path');
        const agentDir = join(root, '.agent');

        const skills = await generateSkillManifest(agentDir);
        const workflows = await generateWorkflowManifest(agentDir);
        const agents = await generateAgentManifest(agentDir);

        fmt.newline();
        fmt.info('🧩 Skills:');
        fmt.table(
          ['ID', 'Description'],
          skills.map(s => [s.canonicalId, s.description.slice(0, 60) + (s.description.length > 60 ? '...' : '')]),
        );

        fmt.newline();
        fmt.info('📋 Workflows:');
        fmt.table(
          ['Name', 'Description'],
          workflows.map(w => [w.name, w.description.slice(0, 60) + (w.description.length > 60 ? '...' : '')]),
        );

        fmt.newline();
        fmt.info('🎭 Agents:');
        fmt.table(
          ['Icon', 'Name', 'Title'],
          agents.map(a => [a.icon ?? '', a.displayName ?? '', a.title ?? '']),
        );

        fmt.newline();
        fmt.info(`Total: ${skills.length} skills, ${workflows.length} workflows, ${agents.length} agents`);
      } catch (e) {
        handleCommandError(fmt, e);
      }
    });
};

/**
 * Module Registry — discovers, loads, and merges installable skill packs.
 * Each module lives in .agent/modules/<name>/ with:
 *   - module.yaml   (metadata: name, version, description, agents, config)
 *   - agents.yaml   (module-specific agent personas)
 *   - skills/       (akit-* skill folders)
 *   - workflows/    (slash command dispatchers)
 */

export interface ModuleManifest {
  name: string;
  version: string;
  description: string;
  npmPackage?: string;
  author?: string;
  homepage?: string;
  config?: Record<string, unknown>;
}

export interface LoadedModule {
  manifest: ModuleManifest;
  path: string;
  skills: string[];
  workflows: string[];
  agentCount: number;
  loadedAt: Date;
}

/** Simple YAML key-value extractor (avoids adding yaml dependency) */
const extractYamlValue = (content: string, key: string): string => {
  const match = content.match(new RegExp(`^${key}:\\s*['"]?(.+?)['"]?\\s*$`, 'm'));
  return match?.[1]?.trim() ?? '';
};

/**
 * Load a single module manifest from module.yaml
 */
export const loadModuleManifest = async (modulePath: string): Promise<ModuleManifest | null> => {
  const { readFileSync, existsSync } = await import('node:fs');
  const { join } = await import('node:path');

  const manifestFile = join(modulePath, 'module.yaml');
  if (!existsSync(manifestFile)) return null;

  const content = readFileSync(manifestFile, 'utf-8');
  return {
    name: extractYamlValue(content, 'name') || 'unknown',
    version: extractYamlValue(content, 'version') || '0.0.0',
    description: extractYamlValue(content, 'description') || '',
    npmPackage: extractYamlValue(content, 'npmPackage') || undefined,
    author: extractYamlValue(content, 'author') || undefined,
    homepage: extractYamlValue(content, 'homepage') || undefined,
  };
};

/**
 * Discover all installed modules in .agent/modules/
 */
export const discoverModules = async (agentDir: string): Promise<LoadedModule[]> => {
  const { readdirSync, existsSync } = await import('node:fs');
  const { join } = await import('node:path');

  const modulesDir = join(agentDir, 'modules');
  if (!existsSync(modulesDir)) return [];

  const modules: LoadedModule[] = [];
  const dirs = readdirSync(modulesDir, { withFileTypes: true })
    .filter(d => d.isDirectory());

  for (const dir of dirs) {
    const modulePath = join(modulesDir, dir.name);
    const manifest = await loadModuleManifest(modulePath);
    if (!manifest) continue;

    // Count skills
    const skillsDir = join(modulePath, 'skills');
    const skills = existsSync(skillsDir)
      ? readdirSync(skillsDir, { withFileTypes: true })
          .filter(d => d.isDirectory() && d.name.startsWith('akit-'))
          .map(d => d.name)
      : [];

    // Count workflows
    const wfDir = join(modulePath, 'workflows');
    const workflows = existsSync(wfDir)
      ? readdirSync(wfDir).filter(f => f.endsWith('.md'))
      : [];

    // Count agents
    const agentsFile = join(modulePath, 'agents.yaml');
    let agentCount = 0;
    if (existsSync(agentsFile)) {
      const { readFileSync } = await import('node:fs');
      const content = readFileSync(agentsFile, 'utf-8');
      agentCount = (content.match(/^\s{2}\S+:$/gm) || []).length;
    }

    modules.push({
      manifest,
      path: modulePath,
      skills,
      workflows,
      agentCount,
      loadedAt: new Date(),
    });
  }

  return modules;
};

/**
 * Install a module from a local path or npm package into .agent/modules/
 */
export const installModule = async (
  agentDir: string,
  source: string,
): Promise<{ ok: true; module: LoadedModule } | { ok: false; error: string }> => {
  const { existsSync, mkdirSync, cpSync } = await import('node:fs');
  const { join } = await import('node:path');

  const modulesDir = join(agentDir, 'modules');
  mkdirSync(modulesDir, { recursive: true });

  // Check if source is a local directory
  if (existsSync(source)) {
    const manifest = await loadModuleManifest(source);
    if (!manifest) {
      return { ok: false, error: `No module.yaml found in ${source}` };
    }

    const targetDir = join(modulesDir, manifest.name);
    if (existsSync(targetDir)) {
      return { ok: false, error: `Module '${manifest.name}' already installed. Use 'agent module remove ${manifest.name}' first.` };
    }

    cpSync(source, targetDir, { recursive: true });
    const modules = await discoverModules(agentDir);
    const installed = modules.find(m => m.manifest.name === manifest.name);
    if (!installed) {
      return { ok: false, error: 'Module installed but failed to load' };
    }
    return { ok: true, module: installed };
  }

  // npm package — resolve via npx
  // For now, only support local paths
  return { ok: false, error: `npm module installation not yet supported. Use a local path: 'agent module install ./path/to/module'` };
};

/**
 * Remove an installed module
 */
export const removeModule = async (
  agentDir: string,
  moduleName: string,
): Promise<{ ok: true } | { ok: false; error: string }> => {
  const { existsSync, rmSync } = await import('node:fs');
  const { join } = await import('node:path');

  const moduleDir = join(agentDir, 'modules', moduleName);
  if (!existsSync(moduleDir)) {
    return { ok: false, error: `Module '${moduleName}' not found in .agent/modules/` };
  }

  rmSync(moduleDir, { recursive: true, force: true });
  return { ok: true };
};

/**
 * Merge module skills/workflows into the main .agent/ symlink structure.
 * Creates symlinks from .agent/skills/akit-* → .agent/modules/<mod>/skills/akit-*
 */
export const mergeModuleAssets = async (agentDir: string, module: LoadedModule): Promise<void> => {
  const { existsSync, symlinkSync } = await import('node:fs');
  const { join, relative } = await import('node:path');

  // Symlink skills
  for (const skill of module.skills) {
    const target = join(module.path, 'skills', skill);
    const link = join(agentDir, 'skills', skill);
    if (!existsSync(link)) {
      const relTarget = relative(join(agentDir, 'skills'), target);
      symlinkSync(relTarget, link);
    }
  }

  // Symlink workflows
  for (const wf of module.workflows) {
    const target = join(module.path, 'workflows', wf);
    const link = join(agentDir, 'workflows', wf);
    if (!existsSync(link)) {
      const relTarget = relative(join(agentDir, 'workflows'), target);
      symlinkSync(relTarget, link);
    }
  }
};

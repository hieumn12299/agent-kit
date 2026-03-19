/**
 * Agent Customization — loads base agents.yaml and applies per-agent overrides.
 * Overrides live in .agent/agents/<agent-id>.customize.yaml
 */

export interface AgentPersona {
  id: string;
  displayName: string;
  icon: string;
  title: string;
  role: string;
  communicationStyle: string;
  [key: string]: string;
}

/** Simple YAML key-value extractor */
const extractKV = (content: string, key: string): string => {
  const match = content.match(new RegExp(`^\\s*${key}:\\s*['"]?(.+?)['"]?\\s*$`, 'm'));
  return match?.[1]?.trim() ?? '';
};

/**
 * Load all agent personas from agents.yaml + module agents + customize overrides.
 */
export const loadAgents = async (agentDir: string): Promise<AgentPersona[]> => {
  const { readFileSync, readdirSync, existsSync } = await import('node:fs');
  const { join } = await import('node:path');

  const agents: AgentPersona[] = [];

  // 1. Load base agents.yaml
  const baseFile = join(agentDir, 'agents.yaml');
  if (existsSync(baseFile)) {
    agents.push(...parseAgentsYaml(readFileSync(baseFile, 'utf-8')));
  }

  // 2. Load module agents
  const modulesDir = join(agentDir, 'modules');
  if (existsSync(modulesDir)) {
    const modules = readdirSync(modulesDir, { withFileTypes: true })
      .filter(d => d.isDirectory());
    for (const mod of modules) {
      const modAgentsFile = join(modulesDir, mod.name, 'agents.yaml');
      if (existsSync(modAgentsFile)) {
        const modAgents = parseAgentsYaml(readFileSync(modAgentsFile, 'utf-8'));
        // Only add agents not already present
        for (const ma of modAgents) {
          if (!agents.find(a => a.id === ma.id)) {
            agents.push(ma);
          }
        }
      }
    }
  }

  // 3. Apply customize overrides
  const customDir = join(agentDir, 'agents');
  if (existsSync(customDir)) {
    const overrideFiles = readdirSync(customDir)
      .filter(f => f.endsWith('.customize.yaml'));

    for (const file of overrideFiles) {
      const agentId = file.replace('.customize.yaml', '');
      const agent = agents.find(a => a.id === agentId);
      if (!agent) continue;

      const content = readFileSync(join(customDir, file), 'utf-8');
      // Apply each key-value override
      const overrideKeys = ['displayName', 'icon', 'title', 'role', 'communicationStyle'];
      for (const key of overrideKeys) {
        const value = extractKV(content, key);
        if (value) {
          agent[key] = value;
        }
      }

      // Check for additionalContext
      const additionalContext = extractKV(content, 'additionalContext');
      if (additionalContext) {
        agent.additionalContext = additionalContext;
      }
    }
  }

  return agents;
};

/**
 * Parse agents.yaml format into AgentPersona array.
 */
export const parseAgentsYaml = (content: string): AgentPersona[] => {
  const agents: AgentPersona[] = [];
  let currentId = '';
  const fields: Record<string, string> = {};

  for (const line of content.split('\n')) {
    // Match agent ID line: "  agent-id:"
    const idMatch = line.match(/^\s{2}(\S+):$/);
    if (idMatch) {
      if (currentId && fields.displayName) {
        agents.push({ id: currentId, ...fields } as AgentPersona);
      }
      currentId = idMatch[1];
      // Reset fields
      Object.keys(fields).forEach(k => delete fields[k]);
      continue;
    }

    // Match field: "    key: value"
    const kvMatch = line.match(/^\s{4}(\w+):\s*["']?(.+?)["']?\s*$/);
    if (kvMatch && currentId) {
      fields[kvMatch[1]] = kvMatch[2];
    }
  }

  // Don't forget last agent
  if (currentId && fields.displayName) {
    agents.push({ id: currentId, ...fields } as AgentPersona);
  }

  return agents;
};

/**
 * Generate a customize template for an agent
 */
export const generateCustomizeTemplate = (agent: AgentPersona): string => {
  return `# Customize overrides for ${agent.displayName} (${agent.id})
# Uncomment and modify any field to override the default.

# displayName: "${agent.displayName}"
# icon: "${agent.icon}"
# title: "${agent.title}"
# role: "${agent.role}"
# communicationStyle: "${agent.communicationStyle}"
# additionalContext: "Project-specific context here"
`;
};

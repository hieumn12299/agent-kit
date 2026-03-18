import type { Command } from 'commander';
import { select, input } from '@inquirer/prompts';
import { createConfig, isInitialized } from '../../core/config/config-manager.js';
import { ConsoleFormatter } from '../output-formatter.js';
import { handleCommandError } from '../error-handler.js';
import { isNonInteractive } from '../env.js';
import { getOutputMode } from '../utils.js';
import { userInfo } from 'node:os';

export const registerInitCommand = (program: Command): void => {
  program
    .command('init')
    .description('Initialize Agent-Kit in the current project')
    .option('-y, --yes', 'Skip prompts and use defaults')
    .action(async function (this: Command, options: { yes?: boolean }) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();
      const nonInteractive = options.yes || isNonInteractive();

      try {
        // Check if already initialized
        const alreadyInit = await isInitialized(root);
        if (alreadyInit) {
          fmt.warning('Agent-Kit is already initialized in this project.');
          if (!nonInteractive) {
            const { confirm } = await import('@inquirer/prompts');
            const proceed = await confirm({
              message: 'Re-initialize? This will overwrite config.yaml.',
              default: false,
            });
            if (!proceed) {
              fmt.info('Init cancelled.');
              return;
            }
          }
        }

        // Collect user preferences
        let userName: string | undefined;
        let communicationLanguage = 'English';
        let responseStyle: 'formal' | 'casual' | 'technical' = 'technical';

        if (!nonInteractive) {
          userName = await input({
            message: 'Your name?',
            default: userInfo().username,
          });

          communicationLanguage = await select({
            message: 'Communication language?',
            choices: [
              { name: 'English', value: 'English' },
              { name: 'Vietnamese', value: 'Vietnamese' },
              { name: 'Japanese', value: 'Japanese' },
              { name: 'Chinese', value: 'Chinese' },
              { name: 'Korean', value: 'Korean' },
              { name: 'Other (set later via agent config)', value: 'English' },
            ],
          });

          responseStyle = await select({
            message: 'Response style?',
            choices: [
              { name: 'Technical — concise, code-focused', value: 'technical' as const },
              { name: 'Casual — friendly, conversational', value: 'casual' as const },
              { name: 'Formal — structured, detailed', value: 'formal' as const },
            ],
          });
        } else {
          // Non-interactive defaults
          try { userName = userInfo().username; } catch { /* skip */ }
        }

        // Preview
        fmt.newline();
        fmt.table(
          ['Setting', 'Value'],
          [
            ['Name', userName ?? '(not set)'],
            ['Language', communicationLanguage],
            ['Style', responseStyle],
          ],
        );
        fmt.newline();

        // Create config
        const configResult = await createConfig(root, {
          userName,
          communicationLanguage,
          responseStyle,
        });
        if (!configResult.ok) {
          handleCommandError(fmt, configResult.error);
          return;
        }

        // Install bundled skills
        try {
          const { existsSync, mkdirSync, readdirSync, cpSync } = await import('node:fs');
          const { dirname, join: joinPath } = await import('node:path');
          const { fileURLToPath } = await import('node:url');

          // Resolve templates dir relative to package root
          // dist/index.js → dist/ → package root (2 levels)
          const __filename = fileURLToPath(import.meta.url);
          const pkgRoot = dirname(dirname(__filename));
          const templatesDir = joinPath(pkgRoot, 'templates', 'skills');
          const targetDir = joinPath(root, '.agent', 'skills');

          if (existsSync(templatesDir)) {
            mkdirSync(targetDir, { recursive: true });
            const skills = readdirSync(templatesDir, { withFileTypes: true })
              .filter(d => d.isDirectory() && d.name.startsWith('akit-'));

            let installed = 0;
            for (const skill of skills) {
              const dest = joinPath(targetDir, skill.name);
              const skillFile = joinPath(dest, 'SKILL.md');
              if (!existsSync(skillFile)) {
                cpSync(joinPath(templatesDir, skill.name), dest, { recursive: true });
                installed++;
              }
            }

            if (installed > 0) {
              fmt.info(`🧩 ${installed} agent-kit skills installed to .agent/skills/`);
            }
          }

          // Install global RULES.md
          const rulesSource = joinPath(pkgRoot, 'templates', 'RULES.md');
          const rulesDest = joinPath(root, '.agent', 'RULES.md');
          if (existsSync(rulesSource) && !existsSync(rulesDest)) {
            cpSync(rulesSource, rulesDest);
            fmt.info('📜 Global RULES.md installed');
          }

          // Install bundled workflows (slash commands)
          const workflowsTemplateDir = joinPath(pkgRoot, 'templates', 'workflows');
          const workflowsTargetDir = joinPath(root, '.agent', 'workflows');

          if (existsSync(workflowsTemplateDir)) {
            mkdirSync(workflowsTargetDir, { recursive: true });
            const workflows = readdirSync(workflowsTemplateDir, { withFileTypes: true })
              .filter(f => f.isFile() && f.name.endsWith('.md'));

            let wfInstalled = 0;
            for (const wf of workflows) {
              const dest = joinPath(workflowsTargetDir, wf.name);
              if (!existsSync(dest)) {
                cpSync(joinPath(workflowsTemplateDir, wf.name), dest);
                wfInstalled++;
              }
            }

            if (wfInstalled > 0) {
              fmt.info(`📋 ${wfInstalled} workflows installed to .agent/workflows/`);
            }
          }
        } catch {
          // Non-critical: skills/workflows are optional, don't block init
        }

        // Getting-started guide
        fmt.newline();
        fmt.success('Agent-Kit initialized!');
        fmt.newline();
        fmt.info('📁 All data stays local in .agent/');
        fmt.info('🔒 Working memories are gitignored');
        fmt.info(`🧩 Skills & workflows installed — language: ${communicationLanguage}`);
        fmt.newline();
        fmt.info('Next steps:');
        console.log('  agent start            — Begin a coding session');
        console.log('  agent status           — Check project health');
        console.log('  /akit-help             — Get context-aware guidance');
        console.log('  /akit-create-prd       — Create product requirements');
        console.log('  /akit-brainstorming    — Brainstorm ideas');
        console.log('  agent --help           — See all commands');
      } catch (e) {
        handleCommandError(fmt, e);
      }
    });
};

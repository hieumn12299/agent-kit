import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// vitest runs from project root (agent-kit/)
const SKILLS_DIR = join(process.cwd(), 'templates', 'skills');
const WORKFLOWS_DIR = join(process.cwd(), 'templates', 'workflows');

/** Get all akit-* skill directories */
const getSkillDirs = (): string[] =>
  readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d: { isDirectory: () => boolean; name: string }) => d.isDirectory() && d.name.startsWith('akit-'))
    .map((d: { name: string }) => d.name);

/** Get all step files for a skill */
const getStepFiles = (skill: string): string[] => {
  const stepsDir = join(SKILLS_DIR, skill, 'steps');
  if (!existsSync(stepsDir)) return [];
  return readdirSync(stepsDir)
    .filter((f: string) => f.startsWith('step-') && f.endsWith('.md'))
    .sort();
};

/** Skills that are reference guides (no steps expected) */
const EXCLUDED_SKILLS = ['akit-session-flow'];

describe('workflow compliance', () => {
  const skills = getSkillDirs();

  describe('skill structure', () => {
    it('every skill with workflow.md has step files', () => {
      const missing: string[] = [];
      for (const skill of skills) {
        if (EXCLUDED_SKILLS.includes(skill)) continue;
        const hasWorkflow = existsSync(join(SKILLS_DIR, skill, 'workflow.md'));
        const hasSteps = existsSync(join(SKILLS_DIR, skill, 'steps'));
        if (hasWorkflow && !hasSteps) missing.push(skill);
      }
      expect(missing, `Skills missing steps/: ${missing.join(', ')}`).toEqual([]);
    });

    it('every skill has a SKILL.md', () => {
      const missing: string[] = [];
      for (const skill of skills) {
        if (!existsSync(join(SKILLS_DIR, skill, 'SKILL.md'))) {
          missing.push(skill);
        }
      }
      expect(missing, `Skills missing SKILL.md: ${missing.join(', ')}`).toEqual([]);
    });
  });

  describe('step file naming', () => {
    it('follows step-NN-name.md convention', () => {
      const bad: string[] = [];
      for (const skill of skills) {
        for (const step of getStepFiles(skill)) {
          if (!/^step-[a-z]?-?\d{2}[a-z]?-[a-z0-9-]+\.md$/.test(step)) {
            bad.push(`${skill}/${step}`);
          }
        }
      }
      expect(bad, `Bad naming: ${bad.join(', ')}`).toEqual([]);
    });

    it('step numbers are sequential', () => {
      const gaps: string[] = [];
      for (const skill of skills) {
        const steps = getStepFiles(skill);
        if (steps.length === 0) continue;
        const numbers = [...new Set(
          steps
            .map((s: string) => parseInt(s.match(/step-(?:[a-z]-)?(\d+)/)?.[1] ?? '0', 10))
        )].sort((a: number, b: number) => a - b);
        for (let i = 0; i < numbers.length; i++) {
          if (numbers[i] !== i + 1) {
            gaps.push(`${skill}: expected step ${i + 1}, got ${numbers[i]}`);
            break;
          }
        }
      }
      expect(gaps, `Sequential gaps: ${gaps.join('; ')}`).toEqual([]);
    });
  });

  describe('step file content', () => {
    it('each step has STOP/HALT gate', () => {
      const missing: string[] = [];
      for (const skill of skills) {
        for (const step of getStepFiles(skill)) {
          const content = readFileSync(join(SKILLS_DIR, skill, 'steps', step), 'utf-8');
          if (!/STOP|HALT|DO NOT proceed|YOUR IMMEDIATE ACTION|## NEXT|Workflow complete|Proceed to Step|Congratulations|FINAL REMINDER|Read fully/i.test(content)) {
            missing.push(`${skill}/${step}`);
          }
        }
      }
      expect(missing, `Missing STOP/HALT: ${missing.join(', ')}`).toEqual([]);
    });
  });

  describe('workflow references', () => {
    it('workflow.md references existing step files', () => {
      const broken: string[] = [];
      for (const skill of skills) {
        const wfPath = join(SKILLS_DIR, skill, 'workflow.md');
        if (!existsSync(wfPath)) continue;
        const content = readFileSync(wfPath, 'utf-8');
        const refs = content.match(/steps\/step-\d+-[a-z0-9-]+\.md/g) ?? [];
        for (const ref of refs) {
          if (!existsSync(join(SKILLS_DIR, skill, ref))) {
            broken.push(`${skill}: ${ref}`);
          }
        }
      }
      expect(broken, `Broken refs: ${broken.join(', ')}`).toEqual([]);
    });
  });

  describe('slash commands', () => {
    it('slash command files exist for skills with workflows', () => {
      const missing: string[] = [];
      for (const skill of skills) {
        if (EXCLUDED_SKILLS.includes(skill)) continue;
        if (!existsSync(join(SKILLS_DIR, skill, 'workflow.md'))) continue;
        const slashFile = join(WORKFLOWS_DIR, `${skill}.md`);
        if (!existsSync(slashFile)) {
          missing.push(skill);
        }
      }
      expect(missing, `Missing slash commands: ${missing.join(', ')}`).toEqual([]);
    });

    it('all slash commands reference RULES.md', () => {
      const missing: string[] = [];
      const wfFiles = readdirSync(WORKFLOWS_DIR)
        .filter((f: string) => f.startsWith('akit-') && f.endsWith('.md'));
      for (const wf of wfFiles) {
        const content = readFileSync(join(WORKFLOWS_DIR, wf), 'utf-8');
        if (!content.includes('RULES.md')) {
          missing.push(wf);
        }
      }
      expect(missing, `Not referencing RULES.md: ${missing.join(', ')}`).toEqual([]);
    });
  });
});

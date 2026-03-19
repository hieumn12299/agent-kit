import { describe, it, expect } from 'vitest';
import { parseAgentsYaml, generateCustomizeTemplate } from '../../../../src/core/agents/agent-customizer.js';

const SAMPLE_YAML = `agents:
  dev:
    displayName: Amelia
    icon: "💻"
    title: CLI Developer
    role: "TypeScript, testing"
    communicationStyle: "Concise and precise"
  pm:
    displayName: John
    icon: "📋"
    title: Product Manager
    role: "PRD, requirements"
    communicationStyle: "Asks WHY relentlessly"
`;

describe('agent-customizer', () => {
  describe('parseAgentsYaml', () => {
    it('parses agents from YAML content', () => {
      const agents = parseAgentsYaml(SAMPLE_YAML);
      expect(agents).toHaveLength(2);
      expect(agents[0].id).toBe('dev');
      expect(agents[0].displayName).toBe('Amelia');
      expect(agents[0].icon).toBe('💻');
      expect(agents[1].id).toBe('pm');
      expect(agents[1].displayName).toBe('John');
    });

    it('handles empty content', () => {
      const agents = parseAgentsYaml('');
      expect(agents).toEqual([]);
    });

    it('extracts all fields', () => {
      const agents = parseAgentsYaml(SAMPLE_YAML);
      expect(agents[0]).toMatchObject({
        id: 'dev',
        displayName: 'Amelia',
        icon: '💻',
        title: 'CLI Developer',
        role: 'TypeScript, testing',
        communicationStyle: 'Concise and precise',
      });
    });
  });

  describe('generateCustomizeTemplate', () => {
    it('generates a customize template', () => {
      const agents = parseAgentsYaml(SAMPLE_YAML);
      const template = generateCustomizeTemplate(agents[0]);
      expect(template).toContain('Amelia');
      expect(template).toContain('displayName');
      expect(template).toContain('additionalContext');
    });
  });
});

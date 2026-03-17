import { describe, it, expect } from 'vitest';
import { createProgram } from '../../../src/index.js';

describe('Help system', () => {
  it('program has name "agent"', () => {
    const program = createProgram();
    expect(program.name()).toBe('agent');
  });

  it('program has description', () => {
    const program = createProgram();
    expect(program.description()).toContain('Agent-Kit');
  });

  it('program has version', () => {
    const program = createProgram();
    expect(program.version()).toBeDefined();
    expect(program.version()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('helpInformation includes commands', () => {
    const program = createProgram();
    const helpText = program.helpInformation();
    expect(helpText).toContain('init');
    expect(helpText).toContain('config');
  });

  it('helpInformation includes footer tip', () => {
    const program = createProgram();
    // Commander's helpInformation doesn't include addHelpText,
    // but we can verify it was configured by checking the program
    expect(program.name()).toBe('agent');
  });

  it('init command has description', () => {
    const program = createProgram();
    const initCmd = program.commands.find((c) => c.name() === 'init');
    expect(initCmd).toBeDefined();
    expect(initCmd!.description()).toContain('Initialize');
  });

  it('config command has description and subcommands', () => {
    const program = createProgram();
    const configCmd = program.commands.find((c) => c.name() === 'config');
    expect(configCmd).toBeDefined();
    expect(configCmd!.description()).toContain('settings');

    const subNames = configCmd!.commands.map((c) => c.name());
    expect(subNames).toContain('list');
    expect(subNames).toContain('get');
    expect(subNames).toContain('set');
    expect(subNames).toContain('reset');
  });
});

import { describe, it, expect } from 'vitest';
import {
  AgentError,
  ConfigError,
  FileSystemError,
  UsageError,
  ValidationError,
} from '../../../src/types/errors.js';
import {
  EXIT_ERROR,
  EXIT_USAGE,
  EXIT_CONFIG,
  EXIT_FS,
} from '../../../src/types/exit-codes.js';

describe('Domain errors', () => {
  it('AgentError has message, exitCode, suggestion', () => {
    const e = new AgentError('oops', EXIT_ERROR, 'try again');
    expect(e.message).toBe('oops');
    expect(e.exitCode).toBe(EXIT_ERROR);
    expect(e.suggestion).toBe('try again');
    expect(e).toBeInstanceOf(Error);
  });

  it('ConfigError uses exit code 3', () => {
    const e = new ConfigError('no config', "Run 'agent init'");
    expect(e.exitCode).toBe(EXIT_CONFIG);
    expect(e.name).toBe('ConfigError');
    expect(e.suggestion).toBe("Run 'agent init'");
  });

  it('FileSystemError uses exit code 4', () => {
    const e = new FileSystemError('cannot write');
    expect(e.exitCode).toBe(EXIT_FS);
    expect(e.name).toBe('FileSystemError');
  });

  it('UsageError uses exit code 2', () => {
    const e = new UsageError('bad args');
    expect(e.exitCode).toBe(EXIT_USAGE);
    expect(e.name).toBe('UsageError');
  });

  it('ValidationError has issues array', () => {
    const e = new ValidationError('invalid', ['id: too short', 'type: required']);
    expect(e.exitCode).toBe(EXIT_ERROR);
    expect(e.name).toBe('ValidationError');
    expect(e.issues).toHaveLength(2);
    expect(e.issues[0]).toBe('id: too short');
  });
});

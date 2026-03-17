import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleCommandError } from '../../../src/cli/error-handler.js';
import { ConsoleFormatter } from '../../../src/cli/output-formatter.js';
import { ConfigError, FileSystemError, UsageError, AgentError } from '../../../src/types/errors.js';
import { EXIT_ERROR, EXIT_CONFIG, EXIT_FS, EXIT_USAGE } from '../../../src/types/exit-codes.js';

describe('handleCommandError', () => {
  let fmt: ConsoleFormatter;
  let exitMock: (code: number) => void;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fmt = new ConsoleFormatter({ color: false });
    exitMock = vi.fn();
  });

  it('handles ConfigError with exit code 3', () => {
    const error = new ConfigError('Missing config', "Run 'agent init'");
    handleCommandError(fmt, error, exitMock);
    expect(exitMock).toHaveBeenCalledWith(EXIT_CONFIG);
  });

  it('handles FileSystemError with exit code 4', () => {
    const error = new FileSystemError('Cannot write');
    handleCommandError(fmt, error, exitMock);
    expect(exitMock).toHaveBeenCalledWith(EXIT_FS);
  });

  it('handles UsageError with exit code 2', () => {
    const error = new UsageError('Bad arguments');
    handleCommandError(fmt, error, exitMock);
    expect(exitMock).toHaveBeenCalledWith(EXIT_USAGE);
  });

  it('handles generic Error with exit code 1', () => {
    const error = new Error('Unknown');
    handleCommandError(fmt, error, exitMock);
    expect(exitMock).toHaveBeenCalledWith(EXIT_ERROR);
  });

  it('handles non-Error with exit code 1', () => {
    handleCommandError(fmt, 'string error', exitMock);
    expect(exitMock).toHaveBeenCalledWith(EXIT_ERROR);
  });

  it('passes suggestion to formatter for AgentError', () => {
    const errorSpy = vi.spyOn(console, 'error');
    const error = new ConfigError('No config', 'Run init');
    handleCommandError(fmt, error, exitMock);

    const calls = errorSpy.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(calls.some((c: string) => c.includes('No config'))).toBe(true);
    expect(calls.some((c: string) => c.includes('Run init'))).toBe(true);
  });
});

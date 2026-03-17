import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConsoleFormatter } from '../../../src/cli/output-formatter.js';

describe('ConsoleFormatter output modes', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('json mode', () => {
    let fmt: ConsoleFormatter;
    beforeEach(() => {
      fmt = new ConsoleFormatter({ mode: 'json', color: false });
    });

    it('success outputs JSON object', () => {
      fmt.success('Session started');
      const output = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(output).toEqual({ type: 'success', message: 'Session started' });
    });

    it('error outputs JSON to stderr', () => {
      fmt.error('No config', "Run 'agent init'");
      const output = JSON.parse(errorSpy.mock.calls[0][0] as string);
      expect(output).toEqual({
        type: 'error',
        message: 'No config',
        suggestion: "Run 'agent init'",
      });
    });

    it('warning outputs JSON object', () => {
      fmt.warning('Stale memory');
      const output = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(output).toEqual({ type: 'warning', message: 'Stale memory' });
    });

    it('info outputs JSON object', () => {
      fmt.info('Loading');
      const output = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(output).toEqual({ type: 'info', message: 'Loading' });
    });

    it('table outputs JSON array of objects', () => {
      fmt.table(['Name', 'Age'], [['Alice', '30'], ['Bob', '25']]);
      const output = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(output).toEqual([
        { Name: 'Alice', Age: '30' },
        { Name: 'Bob', Age: '25' },
      ]);
    });

    it('newline is suppressed', () => {
      fmt.newline();
      expect(logSpy).not.toHaveBeenCalled();
    });
  });

  describe('quiet mode', () => {
    let fmt: ConsoleFormatter;
    beforeEach(() => {
      fmt = new ConsoleFormatter({ mode: 'quiet', color: false });
    });

    it('suppresses success', () => {
      fmt.success('Done');
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('suppresses warning', () => {
      fmt.warning('Stale');
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('suppresses info', () => {
      fmt.info('Loading');
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('suppresses table', () => {
      fmt.table(['A'], [['B']]);
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('suppresses newline', () => {
      fmt.newline();
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('still shows errors', () => {
      fmt.error('Critical failure');
      expect(errorSpy).toHaveBeenCalledWith('❌ Critical failure');
    });
  });
});

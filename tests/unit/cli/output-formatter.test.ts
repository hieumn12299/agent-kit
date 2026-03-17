import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsoleFormatter } from '../../../src/cli/output-formatter.js';

describe('ConsoleFormatter', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('with color disabled', () => {
    let fmt: ConsoleFormatter;

    beforeEach(() => {
      fmt = new ConsoleFormatter({ color: false, isTTY: false });
    });

    it('success outputs ✅ prefix', () => {
      fmt.success('Done');
      expect(logSpy).toHaveBeenCalledWith('✅ Done');
    });

    it('error outputs ❌ prefix to stderr', () => {
      fmt.error('Failed');
      expect(errorSpy).toHaveBeenCalledWith('❌ Failed');
    });

    it('error with suggestion outputs 💡 line', () => {
      fmt.error('No config', "Run 'agent init'");
      expect(errorSpy).toHaveBeenCalledWith('❌ No config');
      expect(errorSpy).toHaveBeenCalledWith("💡 Run 'agent init'");
    });

    it('warning outputs ⚠️ prefix', () => {
      fmt.warning('Stale memory');
      expect(logSpy).toHaveBeenCalledWith('⚠️  Stale memory');
    });

    it('info outputs ℹ️ prefix', () => {
      fmt.info('Loading');
      expect(logSpy).toHaveBeenCalledWith('ℹ️  Loading');
    });

    it('newline outputs empty line', () => {
      fmt.newline();
      expect(logSpy).toHaveBeenCalledWith('');
    });
  });

  describe('table', () => {
    it('renders aligned columns', () => {
      const fmt = new ConsoleFormatter({ color: false, isTTY: false });
      fmt.table(
        ['ID', 'Type', 'Title'],
        [
          ['bug-fix', 'bug', 'Auth bug'],
          ['api-pattern', 'pattern', 'REST conventions'],
        ],
      );

      // Verify header row was logged
      const calls = logSpy.mock.calls.map((c: unknown[]) => c[0] as string);
      const headerLine = calls.find((c: string) => c.includes('ID') && c.includes('Type') && c.includes('Title'));
      expect(headerLine).toBeDefined();

      // Verify data rows
      const dataLines = calls.filter((c: string) => c.includes('bug-fix') || c.includes('api-pattern'));
      expect(dataLines).toHaveLength(2);
    });
  });

  describe('NO_COLOR detection', () => {
    it('strips ANSI when NO_COLOR is set', () => {
      const originalEnv = process.env['NO_COLOR'];
      process.env['NO_COLOR'] = '1';

      const fmt = new ConsoleFormatter();
      logSpy.mockClear(); // Clear any previous calls
      fmt.success('test');

      const output = logSpy.mock.calls[0][0] as string;
      // Should NOT contain ANSI escape codes
      expect(output).not.toMatch(/\x1b\[/);
      expect(output).toContain('✅ test');

      // Restore
      if (originalEnv === undefined) {
        delete process.env['NO_COLOR'];
      } else {
        process.env['NO_COLOR'] = originalEnv;
      }
    });
  });

  describe('TTY detection', () => {
    it('isTTY reflects constructor option', () => {
      const tty = new ConsoleFormatter({ isTTY: true });
      expect(tty.isTTY).toBe(true);

      const noTTY = new ConsoleFormatter({ isTTY: false });
      expect(noTTY.isTTY).toBe(false);
    });
  });
});

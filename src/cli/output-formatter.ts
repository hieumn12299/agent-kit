import { styleText } from 'node:util';
import type { OutputMode } from './output-mode.js';

// ── Interface ────────────────────────────────────────────────────────

export interface IOutputFormatter {
  success(message: string): void;
  error(message: string, suggestion?: string): void;
  warning(message: string): void;
  info(message: string): void;
  table(headers: string[], rows: string[][]): void;
  newline(): void;
}

export interface FormatterOptions {
  color: boolean;
  isTTY: boolean;
  mode: OutputMode;
}

// ── Implementation ───────────────────────────────────────────────────

export class ConsoleFormatter implements IOutputFormatter {
  private readonly color: boolean;
  readonly isTTY: boolean;
  readonly mode: OutputMode;

  constructor(options?: Partial<FormatterOptions>) {
    const noColor = process.env['NO_COLOR'] !== undefined;
    this.color = options?.color ?? !noColor;
    this.isTTY = options?.isTTY ?? (process.stdout.isTTY ?? false);
    this.mode = options?.mode ?? 'default';
  }

  success(message: string): void {
    if (this.mode === 'quiet') return;
    if (this.mode === 'json') {
      console.log(JSON.stringify({ type: 'success', message }));
      return;
    }
    console.log(this.style('green', `✅ ${message}`));
  }

  error(message: string, suggestion?: string): void {
    if (this.mode === 'json') {
      console.error(JSON.stringify({ type: 'error', message, ...(suggestion ? { suggestion } : {}) }));
      return;
    }
    console.error(this.style('red', `❌ ${message}`));
    if (suggestion) {
      console.error(this.style('yellow', `💡 ${suggestion}`));
    }
  }

  warning(message: string): void {
    if (this.mode === 'quiet') return;
    if (this.mode === 'json') {
      console.log(JSON.stringify({ type: 'warning', message }));
      return;
    }
    console.log(this.style('yellow', `⚠️  ${message}`));
  }

  info(message: string): void {
    if (this.mode === 'quiet') return;
    if (this.mode === 'json') {
      console.log(JSON.stringify({ type: 'info', message }));
      return;
    }
    console.log(this.style('cyan', `ℹ️  ${message}`));
  }

  table(headers: string[], rows: string[][]): void {
    if (this.mode === 'quiet') return;
    if (this.mode === 'json') {
      const data = rows.map((row) =>
        Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ''])),
      );
      console.log(JSON.stringify(data));
      return;
    }

    const allRows = [headers, ...rows];
    const colWidths = headers.map((_, colIdx) =>
      Math.max(...allRows.map((row) => (row[colIdx] ?? '').length)),
    );

    const formatRow = (row: string[]): string =>
      row.map((cell, i) => (cell ?? '').padEnd(colWidths[i])).join('  ');

    console.log(this.style('bold', formatRow(headers)));
    console.log(colWidths.map((w) => '─'.repeat(w)).join('  '));
    for (const row of rows) {
      console.log(formatRow(row));
    }
  }

  newline(): void {
    if (this.mode === 'quiet' || this.mode === 'json') return;
    console.log('');
  }

  private style(
    color: Parameters<typeof styleText>[0],
    text: string,
  ): string {
    if (!this.color) return text;
    return styleText(color, text);
  }
}

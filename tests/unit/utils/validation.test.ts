import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { parseWithResult } from '../../../src/utils/validation.js';
import { ValidationError } from '../../../src/types/errors.js';

describe('parseWithResult', () => {
  const TestSchema = z.object({
    name: z.string().min(1),
    age: z.number().min(0),
  });

  it('returns Ok for valid data', () => {
    const result = parseWithResult(TestSchema, { name: 'Alice', age: 30 });
    expect(result.ok).toBe(true);
    expect(result.unwrap()).toEqual({ name: 'Alice', age: 30 });
  });

  it('returns Err with ValidationError for invalid data', () => {
    const result = parseWithResult(TestSchema, { name: '', age: -1 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.issues.length).toBeGreaterThan(0);
      expect(result.error.suggestion).toBeDefined();
    }
  });

  it('includes field paths in issue messages', () => {
    const result = parseWithResult(TestSchema, { name: 123, age: 'not a number' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const issueText = result.error.issues.join('; ');
      expect(issueText).toContain('name');
      expect(issueText).toContain('age');
    }
  });

  it('returns Ok with defaults applied', () => {
    const WithDefaults = z.object({
      label: z.string().default('untitled'),
    });
    const result = parseWithResult(WithDefaults, {});
    expect(result.ok).toBe(true);
    expect(result.unwrap()).toEqual({ label: 'untitled' });
  });
});

import type { z } from 'zod';
import { ok, err, type Result } from '../types/result.js';
import { ValidationError } from '../types/errors.js';

/**
 * Wraps Zod safeParse into a Result with human-friendly error messages.
 */
export const parseWithResult = <T extends z.ZodType>(
  schema: T,
  data: unknown,
): Result<z.infer<T>, ValidationError> => {
  const result = schema.safeParse(data);

  if (result.success) {
    return ok(result.data);
  }

  const issues = result.error.issues.map(
    (issue) => `${issue.path.join('.')}: ${issue.message}`,
  );

  return err(
    new ValidationError(
      `Validation failed: ${issues.length} issue(s)`,
      issues,
      'Check the data against the expected schema.',
    ),
  );
};

/**
 * Validate and sanitize a memory ID to prevent path traversal attacks.
 * Rejects IDs containing `../`, `./`, backslashes, or absolute paths.
 */
export const sanitizeMemoryId = (id: string): Result<string, Error> => {
  if (!id || id.trim().length === 0) {
    return err(new Error('Invalid memory ID: empty'));
  }

  // Reject path traversal patterns
  if (
    id.includes('..') ||
    id.includes('/') ||
    id.includes('\\') ||
    id.startsWith('.') ||
    /^[a-zA-Z]:/.test(id)  // Windows absolute paths like C:
  ) {
    return err(new Error(`Invalid memory ID: '${id}' contains path traversal characters`));
  }

  return ok(id.trim());
};

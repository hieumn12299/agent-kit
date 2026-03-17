import type { IOutputFormatter } from './output-formatter.js';
import { AgentError } from '../types/errors.js';
import { EXIT_ERROR } from '../types/exit-codes.js';

/**
 * Handles command errors: formats the error message and exits with the correct code.
 * Use this at the CLI layer to convert Result errors into user-facing output.
 */
export const handleCommandError = (
  formatter: IOutputFormatter,
  error: unknown,
  exit: (code: number) => void = process.exit,
): void => {
  if (error instanceof AgentError) {
    formatter.error(error.message, error.suggestion);
    exit(error.exitCode);
  } else if (error instanceof Error) {
    formatter.error(error.message);
    exit(EXIT_ERROR);
  } else {
    formatter.error(String(error));
    exit(EXIT_ERROR);
  }
};

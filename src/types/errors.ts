import { EXIT_ERROR, EXIT_USAGE, EXIT_CONFIG, EXIT_FS } from './exit-codes.js';

/**
 * Base domain error with user-friendly message and exit code.
 */
export class AgentError extends Error {
  readonly suggestion?: string;
  readonly exitCode: number;

  constructor(message: string, exitCode: number, suggestion?: string) {
    super(message);
    this.name = 'AgentError';
    this.exitCode = exitCode;
    this.suggestion = suggestion;
  }
}

/** Missing or invalid configuration (exit 3). */
export class ConfigError extends AgentError {
  constructor(message: string, suggestion?: string) {
    super(message, EXIT_CONFIG, suggestion);
    this.name = 'ConfigError';
  }
}

/** File read/write failure (exit 4). */
export class FileSystemError extends AgentError {
  constructor(message: string, suggestion?: string) {
    super(message, EXIT_FS, suggestion);
    this.name = 'FileSystemError';
  }
}

/** Invalid CLI arguments (exit 2). */
export class UsageError extends AgentError {
  constructor(message: string, suggestion?: string) {
    super(message, EXIT_USAGE, suggestion);
    this.name = 'UsageError';
  }
}

/** Schema validation failure (exit 1). */
export class ValidationError extends AgentError {
  readonly issues: string[];

  constructor(message: string, issues: string[] = [], suggestion?: string) {
    super(message, EXIT_ERROR, suggestion);
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

import { describe, it, expect, afterEach, vi } from 'vitest';
import { isCI, isNonInteractive } from '../../../src/cli/env.js';

describe('isCI', () => {
  const envBackup: Record<string, string | undefined> = {};
  const CI_VARS = ['CI', 'GITHUB_ACTIONS', 'GITLAB_CI', 'JENKINS_URL', 'TF_BUILD'];

  afterEach(() => {
    // Restore env
    for (const key of CI_VARS) {
      if (envBackup[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = envBackup[key];
      }
    }
  });

  it('returns false when no CI vars set', () => {
    // Clear all CI vars
    for (const key of CI_VARS) {
      envBackup[key] = process.env[key];
      delete process.env[key];
    }
    expect(isCI()).toBe(false);
  });

  it('returns true when CI=true', () => {
    envBackup['CI'] = process.env['CI'];
    process.env['CI'] = 'true';
    expect(isCI()).toBe(true);
    delete process.env['CI'];
  });

  it('returns true when GITHUB_ACTIONS=true', () => {
    envBackup['GITHUB_ACTIONS'] = process.env['GITHUB_ACTIONS'];
    process.env['GITHUB_ACTIONS'] = 'true';
    expect(isCI()).toBe(true);
    delete process.env['GITHUB_ACTIONS'];
  });
});

describe('isNonInteractive', () => {
  it('returns true when isCI() is true', () => {
    const origCI = process.env['CI'];
    process.env['CI'] = 'true';
    expect(isNonInteractive()).toBe(true);
    if (origCI === undefined) {
      delete process.env['CI'];
    } else {
      process.env['CI'] = origCI;
    }
  });
});

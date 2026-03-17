/**
 * Environment detection utilities for CI/non-interactive mode.
 */

const CI_ENV_VARS = [
  'CI',
  'GITHUB_ACTIONS',
  'GITLAB_CI',
  'JENKINS_URL',
  'TF_BUILD',
  'CIRCLECI',
  'TRAVIS',
  'BUILDKITE',
  'CODEBUILD_BUILD_ID',
];

/**
 * Detect if running in a CI environment.
 */
export const isCI = (): boolean =>
  CI_ENV_VARS.some((v) => process.env[v] !== undefined);

/**
 * Detect if the environment is non-interactive.
 * True when: CI environment OR stdin is not a TTY.
 */
export const isNonInteractive = (): boolean =>
  isCI() || !(process.stdin.isTTY ?? false);

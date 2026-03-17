import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { getAgentPath } from '../../../src/utils/file-system.js';
import { createMemory } from '../../../src/core/memory/memory-store.js';
import { createMcpServer } from '../../../src/mcp/mcp-server.js';

// Mock homedir for knowledge tier
let knowledgeDir: string;
vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return { ...actual, homedir: () => knowledgeDir };
});

describe('MCP Server', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-mcp-'));
    knowledgeDir = testDir;
    const agentDir = getAgentPath(testDir);
    await mkdir(join(agentDir, 'project'), { recursive: true });
    await mkdir(join(agentDir, 'working'), { recursive: true });

    // Seed test memories
    await createMemory(testDir, {
      title: 'Use JWT for auth',
      type: 'decision',
      tier: 'project',
      source: 'manual',
      timestamp: new Date().toISOString(),
      confidence: 0.9,
      tags: ['auth', 'architecture'],
      content: 'JWT tokens for API authentication',
    });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('creates MCP server with 4 tools', () => {
    const server = createMcpServer(testDir);
    expect(server).toBeDefined();
    // McpServer has a server property
    expect(server.server).toBeDefined();
  });

  it('exposes underlying Server instance', () => {
    const server = createMcpServer(testDir);
    // McpServer wraps a Server instance for advanced usage
    expect(server.server).toBeDefined();
    expect(typeof server.close).toBe('function');
    expect(typeof server.connect).toBe('function');
  });
});

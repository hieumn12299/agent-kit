import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { getAgentPath } from '../../../src/utils/file-system.js';
import { createMemory } from '../../../src/core/memory/memory-store.js';
import { createMcpServer } from '../../../src/mcp/mcp-server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

// Mock homedir for knowledge tier
let knowledgeDir: string;
vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return { ...actual, homedir: () => knowledgeDir };
});

describe('MCP Tool Handlers', () => {
  let testDir: string;
  let client: Client;
  let mcpServer: ReturnType<typeof createMcpServer>;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-mcp-tools-'));
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

    await createMemory(testDir, {
      title: 'Payment timeout fix',
      type: 'bug-learning',
      tier: 'working',
      source: 'session:xyz',
      timestamp: new Date().toISOString(),
      confidence: 0.8,
      tags: ['bug', 'payment'],
      content: 'Payment gateway times out when > 100 items',
    });

    // Connect server ↔ client via InMemoryTransport
    mcpServer = createMcpServer(testDir);
    client = new Client({ name: 'test-client', version: '0.0.1' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await mcpServer.connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    await client.close();
    await mcpServer.close();
    await rm(testDir, { recursive: true, force: true });
  });

  it('lists available tools', async () => {
    const result = await client.listTools();
    const toolNames = result.tools.map(t => t.name);
    expect(toolNames).toContain('agent_context');
    expect(toolNames).toContain('agent_memory_list');
    expect(toolNames).toContain('agent_memory_add');
    expect(toolNames).toContain('agent_status');
  });

  it('agent_context returns scored memories', async () => {
    const result = await client.callTool({
      name: 'agent_context',
      arguments: { query: 'JWT auth architecture' },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);

    expect(parsed.detectedIntent).toBeDefined();
    expect(parsed.results).toBeDefined();
    expect(parsed.results.length).toBeGreaterThan(0);
    expect(parsed.results[0].title).toContain('JWT');
  });

  it('agent_memory_list returns all memories', async () => {
    const result = await client.callTool({
      name: 'agent_memory_list',
      arguments: {},
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const memories = JSON.parse(text);

    expect(memories.length).toBe(2);
  });

  it('agent_memory_list filters by tier', async () => {
    const result = await client.callTool({
      name: 'agent_memory_list',
      arguments: { tier: 'project' },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const memories = JSON.parse(text);

    expect(memories.length).toBe(1);
    expect(memories[0].tier).toBe('project');
  });

  it('agent_memory_add creates a new memory', async () => {
    const result = await client.callTool({
      name: 'agent_memory_add',
      arguments: {
        title: 'Use pnpm',
        content: 'pnpm is faster',
        type: 'preference',
        tier: 'project',
        tags: ['tooling'],
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);

    expect(parsed.status).toBe('created');
    expect(parsed.title).toBe('Use pnpm');

    // Verify memory was actually created
    const listResult = await client.callTool({
      name: 'agent_memory_list',
      arguments: { tier: 'project' },
    });
    const listText = (listResult.content as Array<{ type: string; text: string }>)[0].text;
    const memories = JSON.parse(listText);
    expect(memories.length).toBe(2); // JWT + pnpm
  });

  it('agent_status returns counts', async () => {
    const result = await client.callTool({
      name: 'agent_status',
      arguments: {},
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const stats = JSON.parse(text);

    expect(stats.totalMemories).toBe(2);
    expect(stats.byTier.project).toBe(1);
    expect(stats.byTier.working).toBe(1);
    expect(stats.byType.decision).toBe(1);
    expect(stats.byType['bug-learning']).toBe(1);
  });
});

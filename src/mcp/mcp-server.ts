import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { listMemories, createMemory, listAllMemories } from '../core/memory/memory-store.js';
import { smartRetrieve } from '../core/retrieval/smart-retriever.js';
import type { MemoryTier, MemoryType } from '../types/memory.js';

/**
 * Create and configure the agent-kit MCP server.
 */
export const createMcpServer = (root: string) => {
  const server = new McpServer(
    { name: 'agent-kit', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );

  // ── Tool: agent_context ──────────────────────────────────────────
  server.tool(
    'agent_context',
    'Retrieve relevant project memories with intent-aware filtering. Returns scored memories matching the query.',
    {
      query: z.string().describe('Search query to find relevant memories'),
      limit: z.number().optional().default(10).describe('Maximum results to return'),
    },
    async ({ query, limit }) => {
      const result = await smartRetrieve(root, query, { limit });
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            detectedIntent: result.intent,
            confidence: Math.round(result.confidence * 100),
            filterApplied: result.filterApplied,
            matchedKeywords: result.matchedKeywords,
            results: result.memories.map(m => ({
              ...m.memory,
              score: Math.round(m.score * 100),
            })),
          }, null, 2),
        }],
      };
    },
  );

  // ── Tool: agent_memory_list ──────────────────────────────────────
  server.tool(
    'agent_memory_list',
    'List all stored memories across all tiers (project, working, knowledge).',
    {
      tier: z.enum(['project', 'working', 'knowledge']).optional()
        .describe('Filter to specific tier. Omit for all tiers.'),
    },
    async ({ tier }) => {
      if (tier) {
        const result = await listMemories(root, tier);
        const memories = result.ok ? result.value : [];
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(memories, null, 2) }],
        };
      }
      const all = await listAllMemories(root);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(all, null, 2) }],
      };
    },
  );

  // ── Tool: agent_memory_add ───────────────────────────────────────
  server.tool(
    'agent_memory_add',
    'Add a new memory entry to the project knowledge base.',
    {
      title: z.string().describe('Short title for the memory'),
      content: z.string().describe('Full content/body of the memory'),
      type: z.enum(['insight', 'decision', 'pattern', 'preference', 'convention', 'bug-learning'])
        .optional().default('insight').describe('Memory type classification'),
      tier: z.enum(['project', 'working', 'knowledge']).optional().default('project')
        .describe('Memory tier: project (default), working, or knowledge'),
      tags: z.array(z.string()).optional().default([]).describe('Tags for categorization'),
    },
    async ({ title, content, type, tier, tags }) => {
      const result = await createMemory(root, {
        title,
        content,
        type: type as MemoryType,
        tier: tier as MemoryTier,
        source: 'mcp',
        timestamp: new Date().toISOString(),
        confidence: 0.85,
        tags: tags ?? [],
      });

      if (!result.ok) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${result.error.message}` }],
          isError: true,
        };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ status: 'created', id: result.value.id, tier, title }, null, 2),
        }],
      };
    },
  );

  // ── Tool: agent_status ───────────────────────────────────────────
  server.tool(
    'agent_status',
    'Get project memory statistics — counts by tier and type.',
    {},
    async () => {
      const all = await listAllMemories(root);
      const byTier: Record<string, number> = {};
      const byType: Record<string, number> = {};

      for (const m of all) {
        byTier[m.tier] = (byTier[m.tier] ?? 0) + 1;
        byType[m.type] = (byType[m.type] ?? 0) + 1;
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            totalMemories: all.length,
            byTier,
            byType,
          }, null, 2),
        }],
      };
    },
  );

  return server;
};

/**
 * Start MCP server on stdio transport.
 */
export const startMcpServer = async (root: string): Promise<void> => {
  const server = createMcpServer(root);
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Graceful shutdown
  const shutdown = async () => {
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

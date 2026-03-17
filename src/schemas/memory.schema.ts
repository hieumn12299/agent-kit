import { z } from 'zod';

export const MemoryTypeSchema = z.enum([
  'decision',
  'pattern',
  'bug-learning',
  'integration',
  'convention',
  'preference',
  'insight',
]);

export const MemoryTierSchema = z.enum(['working', 'project', 'private', 'knowledge']);

export const MemoryEntrySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'ID must be kebab-case'),
  title: z.string().min(1),
  type: MemoryTypeSchema,
  tier: MemoryTierSchema,
  source: z.string(),
  timestamp: z.string().datetime(),
  confidence: z.number().min(0).max(1).default(1),
  tags: z.array(z.string()).default([]),
  content: z.string().min(1),
});

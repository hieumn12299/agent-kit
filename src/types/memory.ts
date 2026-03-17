import { z } from 'zod';

import {
  MemoryEntrySchema,
  MemoryTypeSchema,
  MemoryTierSchema,
} from '../schemas/memory.schema.js';

export type MemoryType = z.infer<typeof MemoryTypeSchema>;
export type MemoryTier = z.infer<typeof MemoryTierSchema>;
export type MemoryEntry = z.infer<typeof MemoryEntrySchema>;

import { z } from 'zod';

export const SessionMetadataSchema = z.object({
  sessionId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

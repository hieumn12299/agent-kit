import { z } from 'zod';

export const ProjectConfigSchema = z.object({
  userName: z.string().optional(),
  communicationLanguage: z.string().default('English'),
  responseStyle: z.enum(['formal', 'casual', 'technical']).default('technical'),
});

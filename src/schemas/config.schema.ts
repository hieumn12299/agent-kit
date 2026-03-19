import { z } from 'zod';

export const ProjectConfigSchema = z.object({
  projectName: z.string().optional(),
  userName: z.string().optional(),
  communicationLanguage: z.string().default('English'),
  documentOutputLanguage: z.string().optional(),
  responseStyle: z.enum(['formal', 'casual', 'technical']).default('technical'),
  outputFolder: z.string().default('./_akit-output'),
  planningArtifacts: z.string().optional(),
  implementationArtifacts: z.string().optional(),
});

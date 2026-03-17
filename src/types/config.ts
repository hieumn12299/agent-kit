import { z } from 'zod';
import { ProjectConfigSchema } from '../schemas/config.schema.js';

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

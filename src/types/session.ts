import { z } from 'zod';
import { SessionMetadataSchema } from '../schemas/session.schema.js';

export type SessionMetadata = z.infer<typeof SessionMetadataSchema>;

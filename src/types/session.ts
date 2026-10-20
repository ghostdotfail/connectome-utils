import type { SessionIndex, SessionMeta } from '@animalabs/connectome-host/src/session-manager';
import { z } from 'zod';
import { expectType } from '../lib/zod-utils';

export const SessionIdSchema = z.string();

export const SessionMetaSchema = z.object({
  id: SessionIdSchema,
  name: z.string(),
  manuallyNamed: z.boolean(),
  createdAt: z.string(),
  lastAccessedAt: z.string(),
  messageCount: z.number().optional(),
});

export const SessionIndexSchema = z.object({
  version: z.literal(1),
  activeSessionId: SessionIdSchema,
  sessions: z.record(SessionIdSchema, SessionMetaSchema),
});
expectType<SessionIndex>({} as z.infer<typeof SessionIndexSchema>);

export interface SessionManager {
  load(): SessionIndex;
  save(index: SessionIndex): unknown;
  createSession(name?: string): SessionMeta;
  deleteSession(id: string): unknown;
  renameSession(id: string, name: string, manual: boolean): unknown;
  getStorePath(id: string): string;
  getActiveSession(): SessionMeta | null;
  setActiveSession(id: string): void;
  listSessions(): SessionMeta[];
}

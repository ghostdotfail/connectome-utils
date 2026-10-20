import { z } from 'zod';

// Sponsor console routes (upstream src/console.ts + src/server.ts). All three
// authenticate with `Authorization: Bearer <aid1>` for the built-in `console`
// audience — a human credential from Discord login, not an agent key proof.
// Scopes are never chosen per-invite: the console stamps the sponsor's full
// delegable set (their scopes ∩ DELEGABLE) on every mint.

export const PrincipalSchema = z.object({
  sub: z.string(),
  name: z.string(),
  kind: z.enum(['human', 'agent', 'service']),
  key: z.string().nullable().optional(),
  scopes: z.array(z.string()),
  claims: z.record(z.string(), z.unknown()),
  audiences: z.array(z.string()).optional(),
  tokenTtl: z.string().optional(),
  expires: z.string().nullable().optional(),
  notes: z.string().optional(),
}).meta({ id: 'Principal' });

/** The invite record as minted/stored (stores.ts `Invite`). */
export const InviteSchema = z.looseObject({
  code: z.string(),
  label: z.string().optional(),
  /** Scope stamp for principals enrolled through this invite. */
  scopes: z.array(z.string()),
  claims: z.record(z.string(), z.unknown()).optional(),
  audiences: z.array(z.string()).optional(),
  /** tokenTtl stamped on enrolled principals, e.g. "7d". */
  tokenTtl: z.string().optional(),
  maxUses: z.int().optional(),
  uses: z.int().optional(),
  expiresAt: z.iso.datetime().optional(),
  /** Sub of the human who minted this via the console — their vouch. */
  sponsor: z.string().optional(),
  /** Anchor domain (operator-only; absent = guest). */
  domain: z.string().optional(),
}).meta({ id: 'Invite' });
export type Invite = z.infer<typeof InviteSchema>;

/** GET /console/me */
export const ConsoleMeOutputSchema = z.looseObject({
  sub: z.string(),
  name: z.string(),
  /** Exactly what a fresh invite would be stamped with. */
  delegable: z.array(z.string()),
  canAnchor: z.boolean(),
  home: z.string(),
}).meta({ id: 'ConsoleMeOutput' });
export type ConsoleMeOutput = z.infer<typeof ConsoleMeOutputSchema>;

/** GET /console/invites — the sponsor's invites + what enrolled through them.
 *  (The scopes field is in this response; the console UI just doesn't render it.) */
export const ConsoleInviteViewSchema = z.looseObject({
  code: z.string(),
  label: z.string().optional(),
  scopes: z.array(z.string()),
  expiresAt: z.iso.datetime().optional(),
  status: z.enum(['claimed', 'expired', 'unclaimed']),
  agent: z.looseObject({ sub: z.string(), name: z.string() }).optional(),
}).meta({ id: 'ConsoleInviteView' });
export type ConsoleInviteView = z.infer<typeof ConsoleInviteViewSchema>;

export const ConsoleInvitesOutputSchema = z.looseObject({
  invites: z.array(ConsoleInviteViewSchema),
}).meta({ id: 'ConsoleInvitesOutput' });
export type ConsoleInvitesOutput = z.infer<typeof ConsoleInvitesOutputSchema>;

/** POST /console/invites — mint (403 without worlds:join; 429 over the
 *  3-active-invite sponsor budget). */
export const ConsoleMintInputSchema = z.object({
  label: z.string().max(60).optional(),
  /** Requires the sponsor to hold id:anchor. */
  anchor: z.boolean().optional(),
}).meta({ id: 'ConsoleMintInput' });
export type ConsoleMintInput = z.infer<typeof ConsoleMintInputSchema>;

export const ConsoleMintOutputSchema = z.looseObject({
  invite: InviteSchema,
}).meta({ id: 'ConsoleMintOutput' });
export type ConsoleMintOutput = z.infer<typeof ConsoleMintOutputSchema>;

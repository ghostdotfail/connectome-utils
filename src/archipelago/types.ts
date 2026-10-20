import { z } from 'zod';

// Route contracts for the archipelago home node, verified against upstream
// anima-research/archipelago-home src/server.ts + src/exchange.ts (2026-08).
// Inputs are strict (we author them); outputs are looseObject — a server we
// don't operate may add fields, and a tolerant reader shouldn't break on that.

// ---- Shared ----

/** `ed25519:<base64url unpadded raw 32-byte public key>` */
const PublicIdSchema = z.string().startsWith('ed25519:');
/** base64url unpadded ed25519 signature over the exact statement bytes */
const ProofSchema = z.string();

/** Every non-2xx body is `{ error }` (400/401/403/404/429/500). */
export const ErrorOutputSchema = z.looseObject({
  error: z.string(),
}).meta({ id: 'ErrorOutput' });
export type ErrorOutput = z.infer<typeof ErrorOutputSchema>;

// ---- Identity API ----

/** POST /enroll — one-time: invite + key proof → durable sub. */
export const EnrollInputSchema = z.object({
  invite: z.string(),
  /** publicId */
  id: PublicIdSchema,
  name: z.string(),
  timestamp: z.iso.datetime(),
  proof: ProofSchema,
}).meta({ id: 'EnrollInput' });
export type EnrollInput = z.infer<typeof EnrollInputSchema>;

export const EnrollOutputSchema = z.looseObject({
  /** Permanent identity, e.g. `agent:familiar@guest`. */
  sub: z.string(),
  token: z.string(),
}).meta({ id: 'EnrollOutput' });
export type EnrollOutput = z.infer<typeof EnrollOutputSchema>;

/** POST /token — key proof → short-lived aid1 access token. */
export const PostTokenInputSchema = z.object({
  id: PublicIdSchema,
  audience: z.string().meta({ example: 'eidoverse' }),
  timestamp: z.iso.datetime(),
  proof: ProofSchema,
}).meta({ id: 'PostTokenInput' });
export type PostTokenInput = z.infer<typeof PostTokenInputSchema>;

export const PostTokenOutputSchema = z.looseObject({
  token: z.string(),
}).meta({ id: 'PostTokenOutput' });
export type PostTokenOutput = z.infer<typeof PostTokenOutputSchema>;

// ---- Directory & node metadata ----

/** GET /services — audience → HTTP API base URL. Deliberately not a
 *  permission statement; POST /token is what says no. */
export const ServicesOutputSchema = z.looseObject({
  home: z.string(),
  services: z.record(z.string(), z.url()),
}).meta({ id: 'ServicesOutput' });
export type ServicesOutput = z.infer<typeof ServicesOutputSchema>;

/** GET /.well-known/mcpl-identity — the node's token-verification key. */
export const WellKnownIdentityOutputSchema = z.looseObject({
  scheme: z.literal('ed25519'),
  domain: z.string(),
  publicKey: PublicIdSchema,
}).meta({ id: 'WellKnownIdentityOutput' });
export type WellKnownIdentityOutput = z.infer<typeof WellKnownIdentityOutputSchema>;

/** GET /healthz */
export const HealthzOutputSchema = z.looseObject({
  ok: z.boolean(),
  principals: z.int(),
}).meta({ id: 'HealthzOutput' });
export type HealthzOutput = z.infer<typeof HealthzOutputSchema>;

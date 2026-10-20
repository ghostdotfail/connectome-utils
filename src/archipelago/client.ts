import type { KeyObject } from 'node:crypto';
import {
  type ConsoleInvitesOutput,
  ConsoleInvitesOutputSchema,
  type ConsoleMeOutput,
  ConsoleMeOutputSchema,
  type ConsoleMintInput,
  type ConsoleMintOutput,
  ConsoleMintOutputSchema,
} from './console';
import { enrollStatement, proof, publicId, tokenStatement } from './keys';
import {
  type EnrollOutput,
  EnrollOutputSchema,
  ErrorOutputSchema,
  type HealthzOutput,
  HealthzOutputSchema,
  PostTokenOutputSchema,
  type ServicesOutput,
  ServicesOutputSchema,
  type WellKnownIdentityOutput,
  WellKnownIdentityOutputSchema,
} from './types';

/** Client for an archipelago home node (id.animalabs.ai or compatible).
 *
 *  Key-proof methods (enroll, mintToken) need a `key`; directory reads don't.
 *  Console methods take the human's console-audience bearer token instead —
 *  that credential comes from Discord login, never from an agent key.
 *
 *  Persistence is the caller's: enroll returns `sub`, it does not write it
 *  anywhere, and no default key/config location exists in this package. */
export class IdentityClient {
  readonly baseUrl: string;
  /** Host the signed statements name — derived from baseUrl. */
  readonly statementHost: string;
  private readonly key?: KeyObject;

  constructor(opts: { baseUrl: string; key?: KeyObject }) {
    this.baseUrl = opts.baseUrl;
    this.statementHost = new URL(opts.baseUrl).host;
    this.key = opts.key;
  }

  private requireKey(): KeyObject {
    if (!this.key) throw new Error('this IdentityClient was constructed without a key');
    return this.key;
  }

  private async request(path: string, init?: RequestInit): Promise<unknown> {
    const res = await fetch(new URL(path, this.baseUrl), init);
    const text = await res.text();
    if (!res.ok) {
      const parsed = ErrorOutputSchema.safeParse(safeJson(text));
      throw new Error(`${path} → ${res.status}: ${parsed.success ? parsed.data.error : text}`);
    }
    return JSON.parse(text);
  }

  private post(path: string, body: unknown, token?: string): Promise<unknown> {
    return this.request(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  }

  // ---- Identity (key proof) ----

  /** One-time enrollment. The returned `sub` is permanent — persist it however
   *  you like; this client doesn't. */
  async enroll(input: { invite: string; name: string }): Promise<EnrollOutput> {
    const key = this.requireKey();
    const timestamp = new Date().toISOString();
    return EnrollOutputSchema.parse(
      await this.post('/enroll', {
        invite: input.invite,
        id: publicId(key),
        name: input.name,
        timestamp,
        proof: proof(key, enrollStatement(this.statementHost, input.invite, timestamp)),
      }),
    );
  }

  /** Fresh access token for an audience. Mint per connect; keep none at rest. */
  async mintToken(audience: string): Promise<string> {
    const key = this.requireKey();
    const timestamp = new Date().toISOString();
    const out = PostTokenOutputSchema.parse(
      await this.post('/token', {
        id: publicId(key),
        audience,
        timestamp,
        proof: proof(key, tokenStatement(this.statementHost, audience, timestamp)),
      }),
    );
    return out.token;
  }

  // ---- Directory & node metadata (no credential) ----

  async services(): Promise<ServicesOutput> {
    return ServicesOutputSchema.parse(await this.request('/services'));
  }

  async wellKnownIdentity(): Promise<WellKnownIdentityOutput> {
    return WellKnownIdentityOutputSchema.parse(await this.request('/.well-known/mcpl-identity'));
  }

  async healthz(): Promise<HealthzOutput> {
    return HealthzOutputSchema.parse(await this.request('/healthz'));
  }

  // ---- Sponsor console (human bearer token) ----

  async consoleMe(token: string): Promise<ConsoleMeOutput> {
    return ConsoleMeOutputSchema.parse(
      await this.request('/console/me', { headers: { Authorization: `Bearer ${token}` } }),
    );
  }

  async consoleInvites(token: string): Promise<ConsoleInvitesOutput> {
    return ConsoleInvitesOutputSchema.parse(
      await this.request('/console/invites', { headers: { Authorization: `Bearer ${token}` } }),
    );
  }

  async consoleMintInvite(token: string, input: ConsoleMintInput = {}): Promise<ConsoleMintOutput> {
    return ConsoleMintOutputSchema.parse(await this.post('/console/invites', input, token));
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

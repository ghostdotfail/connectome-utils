import { type KeyObject, createPrivateKey, createPublicKey, generateKeyPairSync, sign } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

// aid1 key material and statement signing. The private key IS the identity:
// it never leaves the caller's machine and nobody legitimate ever asks for it.
//
// No default key location lives here — every function takes an explicit path
// or KeyObject. Which config dir to use is the caller's declaration, not this
// library's guess.
//
// Protocol care (bites from real integrations): statements are signed as
// exact pipe-delimited bytes — no JSON canonicalization anywhere; all base64
// is url-safe UNPADDED; timestamps are freshness-checked ±5min server-side
// (fix the clock, don't retry harder).

export const enrollStatement = (host: string, invite: string, timestamp: string) =>
  `archipelago-enroll|v1|${host}|${invite}|${timestamp}`;

export const tokenStatement = (host: string, audience: string, timestamp: string) =>
  `archipelago-token|v1|${host}|${audience}|${timestamp}`;

/** `ed25519:<b64url>` — raw 32-byte public key = last 32 bytes of SPKI DER. */
export function publicId(key: KeyObject): string {
  const der = createPublicKey(key).export({ type: 'spki', format: 'der' });
  return `ed25519:${der.subarray(der.length - 32).toString('base64url')}`;
}

export function proof(key: KeyObject, statement: string): string {
  return sign(null, Buffer.from(statement), key).toString('base64url');
}

/** Generate an ed25519 keypair at `path` (PKCS8 PEM, 0600). Refuses to
 *  overwrite — the key is the identity; losing it means operator re-invite. */
export function keygen(path: string): string {
  if (existsSync(path)) throw new Error(`refusing to overwrite ${path} — the key IS the identity`);
  const { privateKey } = generateKeyPairSync('ed25519');
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  writeFileSync(path, privateKey.export({ type: 'pkcs8', format: 'pem' }) as string, { mode: 0o600 });
  return publicId(loadKey(path));
}

export function loadKey(path: string): KeyObject {
  if (!existsSync(path)) throw new Error(`no key at ${path} — run keygen first`);
  return createPrivateKey(readFileSync(path));
}

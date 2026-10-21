import { z } from 'zod';
import { defineExtensionLoader } from '../../src/config/extension';

declare const BUILD_SHA: string;
/** `git describe --always --dirty` at build time (`bun run build`); 'unbuilt' when run from source. */
export const EXTENSION_BUILD = typeof BUILD_SHA === 'undefined' ? 'unbuilt' : BUILD_SHA;
/** Key in recipe.json `extensions` object */
export const EXTENSION_NAME = 'assert' as const;

/** Config for the extension and all its modules. */
export const configSchema = z.object({
  /**
   * Values the recipe refuses to let be modified. If wrong, an error thrown prevents createFramework() from resolving, crashing connectome-host.
   * 
   * @example {
   *   "DATA_DIR": "/home/fabula/fabula-cm/data",
   *   "MODEL": "claude-fable-5"
   * }
   */
  assertEnvEquals: z.record(z.string(), z.string()).optional(),
});

/** First 12 hex chars of sha256: enough to compare values in a log without revealing them. */
const shortHash = (value: string): string => new Bun.CryptoHasher('sha256').update(value).digest('hex').slice(0, 12);

export default defineExtensionLoader(() => ({
  configSchema,
  register: (_, cfg) => {
    const env = process.env;
    for (const [key, value] of Object.entries(cfg.assertEnvEquals ?? {})) {
      if (typeof env?.[key] === 'undefined') {
        throw new Error(`Missing env var: ${key}`);
      }
      if (env[key] !== value) {
        const expected = shortHash(value);
        const got = shortHash(env[key] ?? '');
        throw new Error(`Refused env value for key ${key} (expected sha256:${expected}, got sha256:${got})`);
      }
    }
  },
}));

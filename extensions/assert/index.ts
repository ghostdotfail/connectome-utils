import type { ExtensionApi } from '@animalabs/connectome-host/src/extensions';
import { ExtensionConfigSchema } from './config';
import { EXTENSION_BUILD, EXTENSION_NAME } from './meta';

/** First 12 hex chars of sha256: enough to compare values in a log without revealing them. */
function shortHash(value: string): string {
  return new Bun.CryptoHasher('sha256').update(value).digest('hex').slice(0, 12);
}

export default function register(_api: ExtensionApi, rawConfig: Record<string, unknown>) {
  const { data: config, error } = ExtensionConfigSchema.safeParse(rawConfig ?? {});
  if (error) {
    throw new Error('Extension config invalid', { cause: error });
  }

  if (config?.assertEnvEquals) {
    for (const [key, value] of Object.entries(config.assertEnvEquals)) {
      if (typeof process.env?.[key] === 'undefined') {
        throw new Error(`Missing env var: ${key}`);
      }
      if (process.env[key] !== value) {
        throw new Error(`Refused env value for key ${key} (expected sha256:${shortHash(value)}, got sha256:${shortHash(process.env[key]!)})`);
      }
    }
  }
}

export {
  EXTENSION_BUILD,
  EXTENSION_NAME,
  register,
};

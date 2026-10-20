import { z } from 'zod';

/** Config for the extension and all its modules. */
export const ExtensionConfigSchema = z.object({
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
export type ExtensionConfig = z.infer<typeof ExtensionConfigSchema>;

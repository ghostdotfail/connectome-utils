import type { ExportedExtension, ExtensionConfig, RegisterExtensionFn } from "../types/extension";
import { z } from 'zod';

export interface DefineExtensionOptions<Config extends z.ZodType<ExtensionConfig>> {
  /**
   * Zod schema for processing the recipe's extension config before passing it to `register`.
   * 
   * If set, ZodError may be thrown at extension load.
   */
  configSchema?: Config,

  /**
   * Function called by connectome-host to load the extension before AgentFramework is created.
   */
  register: RegisterExtensionFn<z.infer<Config>>,
};

export interface Extension<Config extends z.ZodType<ExtensionConfig>> extends ExportedExtension<z.infer<Config>> {
  name: string,
  kind: 'module' | 'strategy',
}

export function defineExtensionLoader<Config extends z.ZodType<ExtensionConfig>>(fn: () => DefineExtensionOptions<Config>): RegisterExtensionFn<z.infer<Config>> {
  const { register, configSchema } = fn();
  return (api, rawConfig) => {
    const config = configSchema ? configSchema.parse(rawConfig ?? {}) : rawConfig;
    return register(api, config);
  };
}

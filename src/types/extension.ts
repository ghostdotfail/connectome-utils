import type { ExtensionApi } from '@animalabs/connectome-host/src/extensions';
import { z } from 'zod';

export const ExtensionConfigSchema = z.record(z.string(), z.unknown());
export type ExtensionConfig = z.infer<typeof ExtensionConfigSchema>;

export type RegisterExtensionFn<
  Config extends ExtensionConfig = ExtensionConfig
> = (api: ExtensionApi, config: Config) => Promise<void> | void;

export interface ExportedExtension<
  Config extends ExtensionConfig = ExtensionConfig
> {
  register: RegisterExtensionFn<Config>,
};

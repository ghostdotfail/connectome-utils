import { defineExtensionLoader } from '../../src/config/extension';
import { z } from 'zod';

export default defineExtensionLoader(() => ({
  configSchema: z.object({
    enable: z.boolean(),
  }),
  register: async (api, cfg) => {
    if (!cfg.enable) return;
    const { ApiModule } = await import('@animalabs/agent-framework');
    api.registerModule(() => new ApiModule());
  },
}));

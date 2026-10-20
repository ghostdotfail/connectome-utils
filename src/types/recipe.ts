import type { RecipeAgent, Recipe } from '@animalabs/connectome-host/src/recipe';
import { z } from 'zod';
import { expectType } from '../lib/zod-utils';

export const RecipeStrategySchema = z.object({
  type: z.union([
    z.enum(['autobiographical', 'passthrough', 'frontdesk']),
    z.string(),
  ]),
});

export const RecipeAgentSchema = z.object({
  name: z.string().optional(),
  model: z.string().optional(),
  provider: z.enum(['anthropic', 'openai-responses', 'openai-codex', 'openrouter', 'bedrock', 'openai-compatible', 'mock']).optional(),
  baseUrl: z.string().optional(),
  formatter: z.enum(['native', 'anthropic-xml']).optional(),
  prefillUserMessages: z.string().optional(),
  systemPrompt: z.string(),
  maxTokens: z.number().optional(),
  maxStreamTokens: z.number().optional(),
  contextBudgetTokens: z.number().optional(),
  cacheTtl: z.enum(['5m', '1h']).optional(),
  cacheKeepalive: z.looseObject({
    enabled: z.boolean().optional(),
    maxIdleHours: z.number().optional(),
    refreshAfterMinutes: z.number().optional(),
  }).optional(),
  promptCaching: z.boolean().optional(),
  sameRoundThinkTextPolicy: z.enum(['public', 'private']).optional(),
  proseRouting: z.enum(['locus', 'explicit', 'hybrid', 'disabled']).optional(),
  toolWrapperProseGuard: z.boolean().optional(),
  anthropicBetas: z.array(z.string()).optional(),
  strategy: RecipeStrategySchema.optional(),
  thinking: z.looseObject({
    enabled: z.boolean(),
    budgetTokens: z.number().optional(),
    type: z.enum(['enabled', 'adaptive']).optional(),
    display: z.enum(['summarized', 'omitted']).optional(),
  }).optional(),
  responses: z.looseObject({
    reasoningEffort: z.enum(['none', 'low', 'medium', 'high', 'xhigh', 'max']).optional(),
    reasoningContext: z.enum(['current_turn', 'all_turns']).optional(),
    compactThreshold: z.number().optional(),
    serviceTier: z.enum(['auto', 'default', 'flex', 'priority']),
  }).optional(),
  codex: z.object({
    fastMode: z.boolean().optional(),
  }).optional(),
  mock: z.looseObject({}).optional(),
  refusalHandling: z.looseObject({
    autoRewind: z.boolean().optional(),
    maxRewinds: z.number().optional(),
    announceHumanTurns: z.boolean().optional(),
  }).optional(),
});
expectType<RecipeAgent>({} as z.infer<typeof RecipeAgentSchema>);

export const RecipeCredentialFileSchema = z.object({
  path: z.string(),
  format: z.enum(['ini', 'json', 'env']),
  section: z.string().optional(),
  mode: z.string().optional(),
  fields: z.array(z.object({
    name: z.string(),
    envOverride: z.string().optional(),
    description: z.string().optional(),
    placeholder: z.string().optional(),
    secret: z.boolean().optional(),
  })),
});

export const RecipeMcpServerSchema = z.object({
  /** Command to spawn (stdio transport). Mutually exclusive with url. */
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
  /** WebSocket URL (WebSocket transport). Mutually exclusive with command. */
  url: z.string().optional(),
  transport: z.enum(['stdio', 'websocket']).optional(),
  /** Bearer token for WebSocket auth (appended as ?token= query param). */
  token: z.string().optional(),
  /**
   * Name of a host-managed access grant (archipelago audience, e.g.
   * "eidoverse"). Requires the `identity` module. The host resolves fresh
   * credentials per dial; neither the recipe nor the agent holds one.
   */
  access: z.string().optional(),
  toolPrefix: z.string().optional(),
  enabledFeatureSets: z.array(z.string()).optional(),
  disabledFeatureSets: z.array(z.string()).optional(),
  enabledTools: z.array(z.string()).optional(),
  disabledTools: z.array(z.string()).optional(),
  reconnect: z.boolean().optional(),
  reconnectIntervalMs: z.number().optional(),
  reconnectMaxIntervalMs: z.number().optional(),
  source: z.looseObject({}).optional(),
  credentialFiles: z.array(RecipeCredentialFileSchema).optional(),
});

/**
 * Subset of MountConfig exposed to recipes.
 * Intentionally omits watchDebounceMs and followSymlinks. The maximum file
 * size is operator-configurable because binary service artifacts may
 * legitimately exceed the conservative framework default.
 */
export const RecipeWorkspaceMountSchema = z.object({
  name: z.string(),
  path: z.string(),
  mode: z.enum(['read-write', 'read-only']).optional(),
  watch: z.enum(['always', 'on-agent-action', 'never']),
  /** Maximum file size in bytes (defaults to the framework's 5 MiB limit). */
  maxFileSize: z.number().optional(),
  /**
   * Request inference when files in this mount change. Pair with
   * `watch: 'always'` so chokidar actually observes the mount.
   * - `true` — any of created | modified | deleted
   * - array — only the listed ops
   */
  wakeOnChange: z.union([z.boolean(), z.array(z.enum(['created', 'modified', 'deleted']))]),
  /**
   * Persist every write/edit/delete to disk immediately. Required for mounts
   * shared across agents as a communication channel (tickets, reports, etc.)
   * so other agents' chokidar watchers actually see the change.
   */
  autoMaterialize: z.boolean().optional(),
});

export const RecipeModulesSchema = z.object({
  /**
   * Subagent forking (spawn/fork parallel agents). OPT-IN — defaults to off
   * and is not part of the standard recipe.
   */
  subagents: z.union([z.boolean(), z.object({
    defaultModel: z.string().optional(),
    defaultMaxTokens: z.number().optional(),
  })]).optional(),
  /**
   * Lesson library (persistent knowledge store + lesson tools). OPT-IN —
   * defaults to off and is not part of the standard recipe.
   */
  lessons: z.boolean().optional(),
  /**
   * Lesson retrieval-injection (requires `lessons`). OPT-IN — defaults to off
   * and is deliberately not part of the standard recipe: it injects
   * context-dependent content into every compile and spends up to two
   * configured retrieval-model calls. Enable only for agents that actually
   * curate a lesson library.
   */
  retrieval: z.union([z.boolean(), z.object({
    model: z.string().optional(),
    maxInjected: z.number().optional(),
    /**
     * Optional OpenAI Responses/Codex reasoning effort for both retrieval calls.
     * Requires an explicit retrieval model.
     */
    reasoningEffort: z.enum(['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']).optional(),
  })]).optional(),
  wake: z.union([z.boolean(), z.object({
    policies: z.array(z.object({
      name: z.string(),
      match: z.looseObject({}),
      behavior: z.union([
        z.literal('always'),
        z.literal('defer'),
        z.literal('skip'),
        z.object({
          debounce: z.number(),
        }),
        z.object({
          rate_limit: z.object({
            tokens: z.number(),
            refillIntervalMs: z.number(),
            keyBy: z.string().optional(),
          }),
        }),
        z.object({
          passive_sample: z.object({
            every: z.number(),
            keyBy: z.string().optional(),
          }),
        }),
      ]),
      resets: z.array(z.string()).optional(),
      passthrough: z.boolean().optional(),
    })),
    default: z.enum(['always', 'defer', 'skip']),
  })]).optional(),
  workspaces: z.union([z.boolean(), z.object({
    mounts: z.array(RecipeWorkspaceMountSchema),
    configMount: z.boolean().optional(),
  })]).optional(),
  instructions: z.union([z.boolean(), z.looseObject({})]).optional(),
  activity: z.union([z.boolean(), z.object({
    channels: z.array(z.string()).optional(),
  })]).optional(),
  mcplAdmin: z.union([z.boolean(), z.object({
    surface: z.enum(['tools', 'utilities']).optional(),
  })]).optional(),
  identity: z.union([z.boolean(), z.object({
    home: z.string().optional(),
    audience: z.string().optional(),
  })]).optional(),
  fleet: z.union([z.boolean(), z.looseObject({})]).optional(),
  webui: z.union([z.boolean(), z.object({
    port: z.number().optional(),
    host: z.string().optional(),
    observersSurface: z.enum(['tools', 'utilities']),
    basicAuth: z.object({
      username: z.string(),
      password: z.string(),
    }).optional(),
    allowedOrigins: z.array(z.string()).optional(),
  })]).optional(),
  subscriptionGc: z.union([z.boolean(), z.looseObject({})]).optional(),
  channelMode: z.union([z.boolean(), z.looseObject({})]).optional(),
});

export const RecipeExtensionSchema = z.object({
  kind: z.enum(['strategy', 'module']),
  path: z.string(),
  config: z.record(z.string(), z.unknown()).optional(),
  source: z.record(z.string(), z.unknown()).optional(),
  sourceMeta: z.record(z.string(), z.unknown()).optional(),
});

export const RecipeSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  version: z.string().optional(),
  agent: RecipeAgentSchema,
  mcpServers: z.record(z.string(), RecipeMcpServerSchema).optional(),
  modules: RecipeModulesSchema.optional(),
  extensions: z.record(z.string(), RecipeExtensionSchema).optional(),
  sessionNaming: z.object({
    examples: z.array(z.string()),
  }).optional(),
  codeExecution: z.object({
    enabled: z.boolean(),
    pythonPath: z.string().optional(),
    toolCallTimeoutMs: z.number().optional(),
    scriptTimeoutMs: z.number().optional(),
    idleReclaimMs: z.number().optional(),
  }).optional(),
  conversations: z.object({
    bind: z.looseObject({}).optional(),
    trigger: z.looseObject({}).optional(),
    idleTtlMs: z.number().optional(),
    closurePrompt: z.string().optional(),
    agentPrefix: z.string().optional(),
  }).optional(),
  subconscious: z.object({
    enabled: z.boolean(),
    name: z.string().optional(),
    model: z.string().optional(),
    systemPrompt: z.string(),
    allowChannelSpeech: z.boolean().optional(),
    reAnchorFraction: z.number().optional(),
  }).optional(),
  toolClassOverrides: z.record(z.string(), z.array(z.string())).optional(),
});
expectType<Recipe>({} as z.infer<typeof RecipeSchema>);

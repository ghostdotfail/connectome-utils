/**
 * The connectome stack's own environment variables. Defaults are inherited from upstream process.env fallbacks that are not documented.
 */
import { z } from 'zod';

export const MembraneEnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_AUTH_TOKEN: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_SESSION_TOKEN: z.string().optional(),
  AWS_REGION: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),

  MEMBRANE_MAX_REQUEST_BYTES: z.string().optional(),
});
export type MembraneEnv = z.infer<typeof MembraneEnvSchema>;

export const ContextManagerEnvSchema = z.object({
  ...MembraneEnvSchema.shape,

  CONNECTOME_LLM_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  CONTEXT_MANAGER_COMPRESSION_LOG: z.string().optional(),
  CONTEXT_MANAGER_BLOB_CACHE_BYTES: z.string().optional(),
  CM_CACHE_DIAG: z.string().optional(),
  KV_TIMING: z.string().optional(),
});
export type ContextManagerEnv = z.infer<typeof ContextManagerEnvSchema>;

export const AgentFrameworkEnvSchema = z.object({
  ...MembraneEnvSchema.shape,
  ...ContextManagerEnvSchema.shape,

  AGENT_FRAMEWORK_WS_URL: z.url().default('ws://localhost:8765/ws'),
  DEBUG_CONTEXT: z.string().optional(),
  SUPPRESS_INFERENCE_FAILED_MARKER: z.string().optional(),
  AGENT_TIMEZONE: z.string().optional(),
});
export type AgentFrameworkEnv = z.infer<typeof AgentFrameworkEnvSchema>;

export const ConnectomeHostEnvSchema = z.object({
  ...AgentFrameworkEnvSchema.shape,

  // Provider credentials
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_AUTH_TOKEN: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_COMPATIBLE_API_KEY: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  BEDROCK_BASE_URL: z.string().optional(),
  CODEX_BINARY: z.string().optional(),
  CODEX_HOME: z.string().optional(),

  // App config
  IDENTITY_HOME: z.string().default('id.animalabs.ai'),
  IDENTITY_KEY_FILE: z.string().optional(),
  OBSERVERS_FILE: z.string().optional(),
  /**
   * Path to privileged users file for agent-framework's event gate.
   */
  SLEEP_PRIVILEGED_FILE: z.string().optional(),
  COUNT_TOKENS_MODEL: z.string().optional(),
  LLM_CALLS_FULL_PAYLOADS: z.string().optional(),

  // Agent state
  MODEL: z.string().optional(),
  DATA_DIR: z.string().default('./data'),
});
export type ConnectomeHostEnv = z.infer<typeof ConnectomeHostEnvSchema>;

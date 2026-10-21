import type { AgentFramework, Module } from '@animalabs/agent-framework';

export type { Module };
export type {
  AgentSettingsExtension,
  ModuleContext,
  TraceEvent,
  TraceEventListener,
} from '@animalabs/agent-framework';

export interface FrameworkAwareModule extends Module {
  setFramework(framework: AgentFramework): void;
}

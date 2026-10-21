/**
 * LessonsModule — persistent knowledge store backed by Chronicle.
 *
 * Lessons are units of extracted knowledge with:
 *   - Confidence scores (0–1)
 *   - Tags for categorization
 *   - Evidence links (source message references)
 *
 * The module also implements gatherContext() to auto-inject
 * relevant lessons into the agent's context before inference.
 */

import type {
  Module,
  ModuleContext,
  ProcessState,
  ProcessEvent,
  EventResponse,
  ToolDefinition,
  ToolCall,
  ToolResult,
} from '@animalabs/agent-framework';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type {
  CreateInput,
  DeprecateInput,
  IdInput,
  Lesson,
  LessonsState,
  ListInput,
  QueryInput,
  UpdateInput,
} from './types';
import { LESSON_TOOLS } from './tools';

export class LessonsModule implements Module {
  readonly name = 'lessons';

  private ctx: ModuleContext | null = null;
  private state: LessonsState = { lessons: [] };
  private globalPath: string | null;

  constructor(opts?: { globalPath?: string }) {
    this.globalPath = opts?.globalPath ?? null;
  }

  async start(ctx: ModuleContext): Promise<void> {
    this.ctx = ctx;
    const saved = ctx.getState<LessonsState>();
    if (saved) {
      this.state = saved;
    }
    // Merge in lessons from the global shared file
    if (this.globalPath) {
      this.mergeFromGlobal();
    }
  }

  async stop(): Promise<void> {
    this.ctx = null;
  }

  getTools(): ToolDefinition[] {
    return LESSON_TOOLS;
  }

  async handleToolCall(call: ToolCall): Promise<ToolResult> {
    switch (call.name) {
      case 'create': return this.handleCreate(call.input as CreateInput);
      case 'update': return this.handleUpdate(call.input as UpdateInput);
      case 'deprecate': return this.handleDeprecate(call.input as DeprecateInput);
      case 'query': return this.handleQuery(call.input as QueryInput);
      case 'list': return this.handleList(call.input as ListInput);
      case 'boost': return this.handleBoost(call.input as IdInput);
      case 'demote': return this.handleDemote(call.input as IdInput);
      default:
        return { success: false, error: `Unknown tool: ${call.name}`, isError: true };
    }
  }

  async onProcess(_event: ProcessEvent, _state: ProcessState): Promise<EventResponse> {
    return {};
  }

  // Lesson injection is handled solely by RetrievalModule (intelligent retrieval
  // pipeline). LessonsModule provides storage + CRUD tools only.

  // Public accessor for other modules (e.g., RetrievalModule)
  getLessons(): Lesson[] {
    return this.state.lessons;
  }

  // =========================================================================
  // Tool Handlers
  // =========================================================================

  private handleCreate(input: CreateInput): ToolResult {
    const lesson: Lesson = {
      id: randomUUID().slice(0, 8),
      content: input.content,
      confidence: input.confidence ?? 0.5,
      tags: input.tags,
      evidence: input.evidence ?? [],
      created: Date.now(),
      updated: Date.now(),
      deprecated: false,
    };

    this.state.lessons.push(lesson);
    this.save();

    return { success: true, data: { id: lesson.id, message: 'Lesson created' } };
  }

  private handleUpdate(input: UpdateInput): ToolResult {
    const lesson = this.state.lessons.find(l => l.id === input.id);
    if (!lesson) {
      return { success: false, error: `Lesson not found: ${input.id}`, isError: true };
    }

    if (input.content !== undefined) lesson.content = input.content;
    if (input.tags !== undefined) lesson.tags = input.tags;
    if (input.confidence !== undefined) lesson.confidence = Math.max(0, Math.min(1, input.confidence));
    if (input.evidence !== undefined) {
      // Merge evidence, dedup
      const existing = new Set(lesson.evidence);
      for (const e of input.evidence) existing.add(e);
      lesson.evidence = [...existing];
    }
    lesson.updated = Date.now();
    this.save();

    return { success: true, data: { id: lesson.id, message: 'Lesson updated' } };
  }

  private handleDeprecate(input: DeprecateInput): ToolResult {
    const lesson = this.state.lessons.find(l => l.id === input.id);
    if (!lesson) {
      return { success: false, error: `Lesson not found: ${input.id}`, isError: true };
    }

    lesson.deprecated = true;
    lesson.deprecationReason = input.reason;
    lesson.updated = Date.now();
    this.save();

    return { success: true, data: { id: lesson.id, message: 'Lesson deprecated' } };
  }

  private handleQuery(input: QueryInput): ToolResult {
    const limit = input.limit ?? 20;
    let results = this.state.lessons.filter(l => !l.deprecated);

    // Filter by minimum confidence
    if (input.minConfidence !== undefined) {
      results = results.filter(l => l.confidence >= input.minConfidence!);
    }

    // Filter by tags (any match)
    if (input.tags && input.tags.length > 0) {
      const tagSet = new Set(input.tags.map(t => t.toLowerCase()));
      results = results.filter(l =>
        l.tags.some(t => tagSet.has(t.toLowerCase()))
      );
    }

    // Text search (simple keyword matching)
    if (input.text) {
      const keywords = input.text.toLowerCase().split(/\s+/);
      results = results.filter(l => {
        const text = l.content.toLowerCase();
        return keywords.some(kw => text.includes(kw));
      });
    }

    // Sort by relevance (confidence descending)
    results.sort((a, b) => b.confidence - a.confidence);

    return {
      success: true,
      data: {
        count: results.length,
        lessons: results.slice(0, limit).map(l => ({
          id: l.id,
          content: l.content,
          confidence: l.confidence,
          tags: l.tags,
          evidence: l.evidence,
        })),
      },
    };
  }

  private handleList(input: ListInput): ToolResult {
    const limit = input.limit ?? 50;
    let results = input.includeDeprecated
      ? [...this.state.lessons]
      : this.state.lessons.filter(l => !l.deprecated);

    // Filter by tags
    if (input.tags && input.tags.length > 0) {
      const tagSet = new Set(input.tags.map(t => t.toLowerCase()));
      results = results.filter(l =>
        l.tags.some(t => tagSet.has(t.toLowerCase()))
      );
    }

    // Sort
    const sort = input.sort ?? 'confidence';
    switch (sort) {
      case 'confidence':
        results.sort((a, b) => b.confidence - a.confidence);
        break;
      case 'created':
        results.sort((a, b) => b.created - a.created);
        break;
      case 'updated':
        results.sort((a, b) => b.updated - a.updated);
        break;
    }

    return {
      success: true,
      data: {
        total: results.length,
        lessons: results.slice(0, limit).map(l => ({
          id: l.id,
          content: l.content,
          confidence: l.confidence,
          tags: l.tags,
          deprecated: l.deprecated,
        })),
      },
    };
  }

  private handleBoost(input: IdInput): ToolResult {
    const lesson = this.state.lessons.find(l => l.id === input.id);
    if (!lesson) {
      return { success: false, error: `Lesson not found: ${input.id}`, isError: true };
    }

    // Diminishing returns boost
    lesson.confidence = Math.min(1, lesson.confidence + 0.1 * (1 - lesson.confidence));
    lesson.updated = Date.now();
    this.save();

    return { success: true, data: { id: lesson.id, confidence: lesson.confidence } };
  }

  private handleDemote(input: IdInput): ToolResult {
    const lesson = this.state.lessons.find(l => l.id === input.id);
    if (!lesson) {
      return { success: false, error: `Lesson not found: ${input.id}`, isError: true };
    }

    // Diminishing returns demote
    lesson.confidence = Math.max(0, lesson.confidence - 0.1 * lesson.confidence);
    lesson.updated = Date.now();
    this.save();

    return { success: true, data: { id: lesson.id, confidence: lesson.confidence } };
  }

  private save(): void {
    this.ctx?.setState(this.state);
    if (this.globalPath) {
      this.saveToGlobal();
    }
  }

  /** Merge lessons from the global JSON file. Newer `updated` wins on ID conflicts. */
  private mergeFromGlobal(): void {
    if (!this.globalPath) return;
    let global: LessonsState;
    try {
      global = JSON.parse(readFileSync(this.globalPath, 'utf-8'));
    } catch {
      return; // File doesn't exist yet — nothing to merge
    }
    if (!Array.isArray(global.lessons)) return;

    const byId = new Map(this.state.lessons.map(l => [l.id, l]));
    let merged = false;
    for (const gl of global.lessons) {
      const existing = byId.get(gl.id);
      if (!existing) {
        this.state.lessons.push(gl);
        merged = true;
      } else if (gl.updated > existing.updated) {
        Object.assign(existing, gl);
        merged = true;
      }
    }
    if (merged) {
      this.ctx?.setState(this.state);
    }
  }

  /** Write current lessons to the global JSON file. */
  private saveToGlobal(): void {
    if (!this.globalPath) return;
    try {
      mkdirSync(dirname(this.globalPath), { recursive: true });
      writeFileSync(this.globalPath, JSON.stringify({ lessons: this.state.lessons }, null, 2));
    } catch {
      // Best-effort — don't break the module if the file can't be written
    }
  }
}

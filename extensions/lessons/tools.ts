import type { ToolDefinition } from "@animalabs/agent-framework";

export const LESSON_TOOLS: ToolDefinition[] = [
  {
    name: 'create',
    description: 'Create a new lesson (unit of extracted knowledge).',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The knowledge content' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Categorization tags (e.g., people, process, decision, technical)',
        },
        evidence: {
          type: 'array',
          items: { type: 'string' },
          description: 'Source references (e.g., stream:topic:messageId)',
        },
        confidence: { type: 'number', description: 'Initial confidence 0–1 (default: 0.5)' },
      },
      required: ['content', 'tags'],
    },
  },
  {
    name: 'update',
    description: 'Update an existing lesson.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Lesson ID' },
        content: { type: 'string', description: 'Updated content' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Updated tags' },
        confidence: { type: 'number', description: 'Updated confidence' },
        evidence: { type: 'array', items: { type: 'string' }, description: 'Additional evidence' },
      },
      required: ['id'],
    },
  },
  {
    name: 'deprecate',
    description: 'Mark a lesson as deprecated (no longer considered accurate).',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Lesson ID' },
        reason: { type: 'string', description: 'Why this lesson is being deprecated' },
      },
      required: ['id', 'reason'],
    },
  },
  {
    name: 'query',
    description: 'Search lessons by text and/or tags.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to search for (keyword matching)' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags (any match)' },
        minConfidence: { type: 'number', description: 'Minimum confidence threshold' },
        limit: { type: 'number', description: 'Max results (default: 20)' },
      },
    },
  },
  {
    name: 'list',
    description: 'List all lessons, optionally filtered and sorted.',
    inputSchema: {
      type: 'object',
      properties: {
        tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
        sort: {
          type: 'string',
          description: 'Sort by: confidence, created, or updated (default: confidence)',
        },
        limit: { type: 'number', description: 'Max results (default: 50)' },
        includeDeprecated: { type: 'boolean', description: 'Include deprecated lessons' },
      },
    },
  },
  {
    name: 'boost',
    description: 'Increase a lesson\'s confidence (it proved useful).',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Lesson ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'demote',
    description: 'Decrease a lesson\'s confidence (it was wrong or unhelpful).',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Lesson ID' },
      },
      required: ['id'],
    },
  },
] as const;

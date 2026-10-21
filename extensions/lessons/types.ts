export interface Lesson {
  id: string;
  content: string;
  confidence: number;
  tags: string[];
  evidence: string[];
  created: number;
  updated: number;
  deprecated: boolean;
  deprecationReason?: string;
}

export interface LessonsState {
  lessons: Lesson[];
}

export interface CreateInput {
  content: string;
  tags: string[];
  evidence?: string[];
  confidence?: number;
}

export interface UpdateInput {
  id: string;
  content?: string;
  tags?: string[];
  confidence?: number;
  evidence?: string[];
}

export interface DeprecateInput {
  id: string;
  reason: string;
}

export interface QueryInput {
  text?: string;
  tags?: string[];
  minConfidence?: number;
  limit?: number;
}

export interface ListInput {
  tags?: string[];
  sort?: 'confidence' | 'created' | 'updated';
  limit?: number;
  includeDeprecated?: boolean;
}

export interface IdInput {
  id: string;
}

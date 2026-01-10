// ============================================
// COMMAND BRIEF TYPES
// ============================================

export interface CommandBrief {
  statusBrief: StatusBrief;
  recommendations: Recommendation[];
  timeAllocation: TimeAllocation[];
  goalAlignment: GoalAlignment[];
  patterns: string[];
  contextSources: string[];
  generatedAt: string;
}

export interface StatusBrief {
  headline: string;
  overview: string;
  directive: string;
  phase: string;
  stale: boolean;
  aiGenerated: boolean;
}

export interface Recommendation {
  id: number;
  title: string;
  description: string;
  confidence: number; // 0-100
  priority: 'high' | 'medium' | 'low';
  energyAware: boolean;
  timeBlock?: string;
  source: string; // Which file/context this came from
}

export interface TimeAllocation {
  project: string;
  targetHours: string;
  schedule?: string;
  color: string;
  priority: number; // 1 = highest
}

export interface GoalAlignment {
  name: string;
  category: 'revenue' | 'content' | 'health' | 'learning' | 'other';
  progress: number; // 0-100
  target: number;
  trend: 'up' | 'down' | 'flat';
  weeklyDelta: number;
  notes: string;
  metrics?: GoalMetric[];
}

export interface GoalMetric {
  label: string;
  current: number | string;
  target: number | string;
  unit?: string;
}

export interface OuraContext {
  energyLevel: 'high' | 'medium' | 'low' | 'unknown';
  readiness: number | null;
  sleep: number | null;
  activity: number | null;
  patterns: string[];
}

export interface BriefGeneratorOptions {
  oura?: OuraContext;
  forceAiRefresh?: boolean;
}

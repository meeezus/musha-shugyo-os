export interface User {
    id: number;
    name: string;
    email: string;
}

export interface Goal {
    id: number;
    name: string;
    description?: string;
    current_value: number;
    target_value: number;
    unit: string;
    color?: 'emerald' | 'amber' | 'red';
    start_date?: string;
    end_date?: string;
}

export interface Task {
    id: number;
    title: string;
    description?: string;
    completed_at?: string | null;
    priority: 'high' | 'medium' | 'low';
    due_date?: string;
    project_id?: number;
    project?: {
        id: number;
        name: string;
    };
}

export interface Contact {
    id: number;
    name: string;
    role?: string;
    company?: string;
    email?: string;
    phone?: string;
    last_contact_date?: string;
    notes?: string;
}

export interface Phase {
    id: number;
    name: string;
    project_id: number;
    sort_order: number;
    tasks?: Task[];
}

export interface Project {
    id: number;
    name: string;
    description?: string;
    status: 'active' | 'paused' | 'blocked' | 'completed' | 'archived';
    deadline?: string;
    color?: string;
    quadrant?: 'mind' | 'body' | 'spirit' | 'vocation' | null;
    parent_id?: number | null;
    user_id: number;
    phases?: Phase[];
    tasks?: Task[];
    children?: Project[];
    parent?: Project;
    // Computed fields from API
    task_count?: number;
    completed_task_count?: number;
    progress?: number;
    next_action?: Task;
    quadrant_stats?: {
        this_week: number;
        this_month: number;
        total_hours: number;
        label: string;
        avg_steps?: number;
        avg_sleep_hours?: number;
    };
}

export interface ChatMessage {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    image_url?: string;
    metadata?: {
        actions?: Array<{
            type: string;
            data: Record<string, any>;
        }>;
        action_results?: Array<{
            type: string;
            success: boolean;
            [key: string]: any;
        }>;
        error?: string;
    };
    created_at: string;
}

export interface PageProps {
    auth: {
        user: User;
    };
    flash?: {
        message?: string;
        error?: string;
    };
}

// Extend Window interface for axios
declare global {
    interface Window {
        axios: import('axios').AxiosInstance;
    }
}

// Command Brief Types (from agent)
export interface CommandBrief {
    statusBrief: StatusBrief;
    recommendations: Recommendation[];
    timeAllocation: TimeAllocation[];
    goalAlignment: GoalAlignment[];
    patterns: string[];
    contextSources: string[];
    generatedAt: string;
    cached?: boolean;
    cacheAge?: number;
    ouraData?: {
        date: string;
        readiness: number | null;
        sleep: number | null;
        activity: number | null;
        hrv: number | null;
        rhr: number | null;
        steps: number | null;
        daySummary: string | null;
    } | null;
    dbTasks?: Task[];
    dbGoals?: Goal[];
    quadrantSummary?: {
        mind: { score: number; label: string };
        body: { score: number; label: string };
        spirit: { score: number; label: string };
        vocation: { score: number; label: string };
        overall: number;
    } | null;
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
    confidence: number;
    priority: 'high' | 'medium' | 'low';
    energyAware: boolean;
    timeBlock?: string;
    source: string;
}

export interface TimeAllocation {
    project: string;
    targetHours: string;
    schedule?: string;
    color: string;
    priority: number;
}

export interface GoalAlignment {
    name: string;
    category: 'revenue' | 'content' | 'health' | 'learning' | 'other';
    progress: number;
    target: number;
    trend: 'up' | 'down' | 'flat';
    weeklyDelta: number;
    notes: string;
}

// Training Types
export interface TrainingSession {
    id: number;
    type: string;
    date: string;
    duration_minutes: number | null;
    intensity: 'light' | 'moderate' | 'hard' | null;
    notes: string | null;
    techniques: string[] | null;
    sparring: SparringRound[] | null;
    energy_before: number | null;
    energy_after: number | null;
    created_at: string;
}

export interface SparringRound {
    partner?: string;
    outcome?: 'win' | 'loss' | 'draw';
    notes?: string;
}

export interface TrainingStats {
    this_week: number;
    this_month: number;
    total_minutes_month: number;
}

// Content Ralph Types
export interface ContentDraft {
    id: number;
    queue_id: string;
    type: 'tweet' | 'thread' | 'newsletter';
    pillar: 'automation' | 'martial-arts' | 'consciousness';
    archetype: string | null;
    topic: string | null;
    content: string;
    status: 'draft' | 'ready' | 'posted';
    effortless_score: number | null;
    source_path: string | null;
    posted_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ContentRalphStats {
    total: number;
    draft_count: number;
    ready_count: number;
    posted_count: number;
    by_pillar: {
        automation: number;
        'martial-arts': number;
        consciousness: number;
    };
}

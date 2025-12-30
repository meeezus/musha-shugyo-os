export enum ProjectStatus {
    Attention = 'Attention',
    Healthy = 'Healthy',
    Stalled = 'Stalled',
    Completed = 'Completed'
}

export enum TaskPriority {
    High = 'High',
    Medium = 'Medium',
    Low = 'Low'
}

export interface Task {
    id: string;
    projectId?: string;
    title: string;
    isCompleted: boolean;
    dueDate?: string; // ISO Date
    priority?: TaskPriority;
    energy?: 'Quick Win' | 'Deep Work' | 'Drain' | 'Recharge';
    tags?: string[];
}

export interface Project {
    id: string;
    name: string;
    space: string;
    progress: number;
    status: ProjectStatus;
    nextActionId?: string; // Links to a specific task
    description?: string;
}

export interface Contact {
    id: string;
    name: string;
    role: string;
    lastContact: string; // ISO Date
    freshness: 'Hot' | 'Warm' | 'Cold';
    isVip: boolean;
    avatarUrl: string;
}

export interface Spark {
    id: string;
    content: string;
    createdAt: string;
    tags: string[];
}

export interface Message {
    id: string;
    role: 'user' | 'model' | 'system';
    text: string;
    timestamp: Date;
    toolCalls?: ToolCall[];
    suggestions?: string[];
}

export interface ToolCall {
    id: string;
    name: string;
    status: 'running' | 'completed' | 'failed';
    input?: any;
    output?: any;
}

// Training Types
export interface Exercise {
    id: string;
    name: string;
    sets: string;
    reps: string;
    intensity?: string;
    notes?: string;
}

export interface Cluster {
    title: string;
    rest?: string;
    exercises: Exercise[];
}

export interface TrainingSession {
    title: string;
    focus: string;
    duration: string;
    warmup: string[];
    clusters: Cluster[];
}

export interface AppState {
    projects: Project[];
    tasks: Task[];
    contacts: Contact[];
    sparks: Spark[];
    userProfile: {
        name: string;
        mode: 'Sovereign' | 'Focus' | 'Rest';
    };
    // Training State
    completedExercises: Record<string, boolean>; // key: sessionId-exerciseId
    weightLogs: Record<string, { weight: number; date: string }>;
}

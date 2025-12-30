export enum ProjectStatus {
    Attention = 'Attention',
    Healthy = 'Healthy',
    Stalled = 'Stalled'
}

export enum TaskPriority {
    High = 'High',
    Medium = 'Medium',
    Low = 'Low'
}

export interface Task {
    id: string;
    title: string;
    isCompleted: boolean;
    dueDate?: string;
    priority?: TaskPriority;
    energy?: string; // e.g. "Quick Win", "Deep Work"
    tags?: string[];
}

export interface Project {
    id: string;
    name: string;
    space: string; // e.g., "Indy Hall", "Personal"
    progress: number;
    status: ProjectStatus;
    taskCount: number;
    nextAction: string;
}

export interface Contact {
    id: string;
    name: string;
    role: string;
    lastContact: string; // ISO date or "2 days ago"
    freshness: 'Hot' | 'Warm' | 'Cold';
    isVip: boolean;
    avatarUrl: string;
}

export interface CalendarEvent {
    id: string;
    title: string;
    time: string;
    duration: string;
    location?: string;
    people?: string[];
}

export interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
}

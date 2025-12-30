import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, Project, Task, Contact, Spark, ProjectStatus, TaskPriority } from '../types';

// Initial Mock Data derived from transcript
const INITIAL_STATE: AppState = {
    userProfile: { name: 'Michael Enriquez', mode: 'Sovereign' },
    projects: [
        { id: '1', name: 'DECOPON ATX', space: 'ENTREPRENEURSHIP', progress: 15, status: ProjectStatus.Attention, nextActionId: 't1' },
        { id: '2', name: 'MUSHA SHUGYO BRAND', space: 'PERSONAL BRAND', progress: 25, status: ProjectStatus.Healthy, nextActionId: 't2' },
        { id: '3', name: 'HEALTH COACHING', space: 'INCOME', progress: 80, status: ProjectStatus.Stalled, nextActionId: 't3' },
        { id: '4', name: 'BJJ WHITE BELT', space: 'MARTIAL ARTS', progress: 5, status: ProjectStatus.Healthy, nextActionId: 't4' },
    ],
    tasks: [
        { id: 't1', projectId: '1', title: 'Build hit list of 50 contacts using Apollo.io', isCompleted: false, priority: TaskPriority.High, energy: 'Deep Work', dueDate: new Date().toISOString() },
        { id: 't2', projectId: '2', title: 'Draft 3 tweets for Tuesday morning block', isCompleted: false, priority: TaskPriority.Medium, energy: 'Quick Win' },
        { id: 't3', projectId: '3', title: 'Reactivate and find 1-2 pilot clients', isCompleted: false, priority: TaskPriority.High, energy: 'Deep Work' },
        { id: 't4', projectId: '4', title: 'Attend Monday 12pm class at Six Blades', isCompleted: false, priority: TaskPriority.Medium, energy: 'Recharge' },
        { id: 't5', projectId: '1', title: 'Send 15 warm outreach emails', isCompleted: false, priority: TaskPriority.High, energy: 'Deep Work' },
    ],
    contacts: [
        { id: '1', name: 'Google Friend', role: 'Warm Lead', lastContact: new Date().toISOString(), freshness: 'Hot', isVip: true, avatarUrl: 'https://ui-avatars.com/api/?name=GF&background=random' },
        { id: '2', name: 'Tesla Austin HR', role: 'Prospect', lastContact: new Date(Date.now() - 86400000 * 2).toISOString(), freshness: 'Warm', isVip: false, avatarUrl: 'https://ui-avatars.com/api/?name=Tesla&background=random' },
        { id: '3', name: 'Mom', role: 'Family', lastContact: new Date(Date.now() - 86400000 * 5).toISOString(), freshness: 'Hot', isVip: true, avatarUrl: 'https://ui-avatars.com/api/?name=Mom&background=random' },
    ],
    sparks: [],
    completedExercises: {},
    weightLogs: {}
};

interface AppContextType extends AppState {
    addTask: (task: Task) => void;
    toggleTask: (id: string) => void;
    addSpark: (content: string) => void;
    dispatchCommand: (cmd: string, payload: any) => Promise<string>;
    toggleExercise: (id: string) => void;
    logWeight: (id: string, weight: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>(() => {
        const saved = localStorage.getItem('musha_os_state');
        return saved ? JSON.parse(saved) : INITIAL_STATE;
    });

    useEffect(() => {
        localStorage.setItem('musha_os_state', JSON.stringify(state));
    }, [state]);

    const addTask = (task: Task) => {
        setState(prev => ({ ...prev, tasks: [...prev.tasks, task] }));
    };

    const toggleTask = (id: string) => {
        setState(prev => ({
            ...prev,
            tasks: prev.tasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)
        }));
    };

    const addSpark = (content: string) => {
        const newSpark: Spark = {
            id: Date.now().toString(),
            content,
            createdAt: new Date().toISOString(),
            tags: []
        };
        setState(prev => ({ ...prev, sparks: [newSpark, ...prev.sparks] }));
    };

    const toggleExercise = (id: string) => {
        setState(prev => {
            const newState = { ...prev.completedExercises };
            if (newState[id]) delete newState[id];
            else newState[id] = true;
            return { ...prev, completedExercises: newState };
        });
    };

    const logWeight = (id: string, weight: number) => {
        setState(prev => ({
            ...prev,
            weightLogs: {
                ...prev.weightLogs,
                [id]: { weight, date: new Date().toISOString() }
            }
        }));
    };

    // The Simulated "Agent" Dispatcher
    const dispatchCommand = async (cmd: string, payload: any): Promise<string> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                switch(cmd) {
                    case '/spark':
                        addSpark(payload);
                        resolve("Saved to Sparkfile.");
                        break;
                    case '/task':
                        addTask({
                            id: Date.now().toString(),
                            title: payload,
                            isCompleted: false,
                            priority: TaskPriority.Medium,
                            energy: 'Quick Win'
                        });
                        resolve("Task added to 'Now' queue.");
                        break;
                    case '/email-triage':
                        // Simulate email processing logic
                        resolve("Processed 15 emails. 3 Action Items created. 12 Archived.");
                        break;
                    case '/refresh-status':
                        resolve("Systems synced. Calendar updated. Email triage complete.");
                        break;
                    default:
                        resolve("Command executed.");
                }
            }, 800); // Artificial latency for "Thinking" feel
        });
    };

    return (
        <AppContext.Provider value={{ ...state, addTask, toggleTask, addSpark, dispatchCommand, toggleExercise, logWeight }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within AppProvider");
    return context;
};

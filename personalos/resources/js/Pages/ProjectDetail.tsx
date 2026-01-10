import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    ArrowLeft, Circle, CheckCircle2, Plus, Trash2, Calendar, Flag, X, ChevronRight
} from 'lucide-react';
import { User, Project, Task } from '@/types';

interface ProjectDetailProps {
    auth: { user: User };
    projectId: number;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function ProgressBar({ progress, color = 'emerald' }: { progress: number; color?: string }) {
    const colors: Record<string, string> = {
        emerald: 'bg-emerald-500',
        amber: 'bg-amber-500',
        red: 'bg-red-400'
    };
    return (
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full ${colors[color] || colors.emerald} transition-all duration-500`} style={{ width: `${progress}%` }} />
        </div>
    );
}

// Week Card Component
function WeekCard({ weekNumber, isActive, onClick, tasksCompleted, totalTasks }: {
    weekNumber: number;
    isActive: boolean;
    onClick: () => void;
    tasksCompleted: number;
    totalTasks: number;
}) {
    const progress = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;
    const isComplete = progress === 100 && totalTasks > 0;

    return (
        <button
            onClick={onClick}
            className={`stealth-card p-4 text-left transition-all hover:border-white/20 relative group ${
                isActive ? 'ring-2 ring-amber-500/50 border-amber-500/30' : ''
            }`}
        >
            {isComplete && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
            )}
            {isActive && !isComplete && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
            )}

            <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-white">Week {weekNumber}</h3>
                <ChevronRight size={16} className="text-white/30 group-hover:text-white/60 transition-colors" />
            </div>

            <ProgressBar progress={progress} color={isComplete ? 'emerald' : isActive ? 'amber' : 'emerald'} />

            <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-mono text-white/40">
                    {tasksCompleted}/{totalTasks} tasks
                </span>
                <span className="text-xs font-mono text-white/50">{progress}%</span>
            </div>
        </button>
    );
}

// Day Card Component
function DayCard({ day, onClick, tasksCompleted, totalTasks }: {
    day: string;
    onClick: () => void;
    tasksCompleted: number;
    totalTasks: number;
}) {
    const progress = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;
    const isComplete = progress === 100 && totalTasks > 0;

    return (
        <button
            onClick={onClick}
            className="stealth-card p-4 text-left transition-all hover:border-white/20 relative group"
        >
            {isComplete && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
            )}

            <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-white">{day}</h3>
                <ChevronRight size={16} className="text-white/30 group-hover:text-white/60 transition-colors" />
            </div>

            <div className="flex items-center gap-2">
                {isComplete ? (
                    <CheckCircle2 size={14} className="text-emerald-500" />
                ) : (
                    <Circle size={14} className="text-white/30" />
                )}
                <span className="text-xs text-white/50">
                    {tasksCompleted}/{totalTasks} tasks
                </span>
            </div>
        </button>
    );
}

// Task Row Component
function TaskRow({ task, onToggle, onDelete }: {
    task: Task;
    onToggle: (task: Task) => void;
    onDelete: (task: Task) => void;
}) {
    const [isHovered, setIsHovered] = useState(false);
    const isCompleted = !!task.completed_at;
    const priorityColors = { high: 'text-red-400', medium: 'text-amber-400', low: 'text-white/30' };

    return (
        <div
            className={`group flex items-center gap-3 py-3 px-4 rounded-[2px] transition-all cursor-pointer ${isCompleted ? 'bg-white/5' : 'hover:bg-white/5'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <button onClick={() => onToggle(task)} className="flex-shrink-0 transition-transform hover:scale-110">
                {isCompleted ? (
                    <CheckCircle2 className="text-emerald-500" size={20} />
                ) : (
                    <Circle className="text-white/30 hover:text-white/60" size={20} />
                )}
            </button>
            <div className="flex-1 min-w-0">
                <span className={`text-sm transition-all ${isCompleted ? 'text-white/40 line-through' : 'text-white/90'}`}>
                    {task.title}
                </span>
            </div>
            {task.priority && task.priority !== 'medium' && (
                <Flag size={14} className={priorityColors[task.priority] || 'text-white/30'} />
            )}
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(task); }}
                className={`flex-shrink-0 text-white/20 hover:text-red-400 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
}

// Add Task Input
function AddTaskInput({ onAdd }: { onAdd: (title: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onAdd(title.trim());
            setTitle('');
            setIsOpen(false);
        }
    };

    if (!isOpen) {
        return (
            <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 py-3 px-4 text-white/40 hover:text-white/60 transition-colors w-full text-left">
                <Plus size={16} />
                <span className="text-sm">Add task</span>
            </button>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="py-2 px-4">
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title..."
                autoFocus
                onBlur={() => { if (!title.trim()) setIsOpen(false); }}
                className="w-full bg-white/5 border border-white/10 rounded-[2px] px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50"
            />
            <div className="flex gap-2 mt-2">
                <button type="submit" className="px-3 py-1 text-xs bg-emerald-500 text-black rounded-[2px] hover:bg-emerald-400 transition-colors">Add</button>
                <button type="button" onClick={() => setIsOpen(false)} className="px-3 py-1 text-xs text-white/40 hover:text-white/60 transition-colors">Cancel</button>
            </div>
        </form>
    );
}

// Day Modal - shows tasks for a specific day
function DayModal({ day, weekNumber, tasks, onClose, onToggleTask, onDeleteTask, onAddTask }: {
    day: string;
    weekNumber: number;
    tasks: Task[];
    onClose: () => void;
    onToggleTask: (task: Task) => void;
    onDeleteTask: (task: Task) => void;
    onAddTask: (title: string) => void;
}) {
    const incompleteTasks = tasks.filter(t => !t.completed_at);
    const completedTasks = tasks.filter(t => t.completed_at);

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#0a0a0a] border border-white/10 rounded-[2px] w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div>
                        <h3 className="font-display font-bold text-white text-lg">{day}</h3>
                        <p className="text-white/40 text-xs font-mono">Week {weekNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-[2px] transition-colors">
                        <X size={20} className="text-white/60" />
                    </button>
                </div>

                <div className="overflow-y-auto max-h-[60vh]">
                    {incompleteTasks.length > 0 && (
                        <div className="divide-y divide-white/5">
                            {incompleteTasks.map(task => (
                                <TaskRow key={task.id} task={task} onToggle={onToggleTask} onDelete={onDeleteTask} />
                            ))}
                        </div>
                    )}

                    <div className="border-t border-white/5">
                        <AddTaskInput onAdd={onAddTask} />
                    </div>

                    {completedTasks.length > 0 && (
                        <details className="border-t border-white/5">
                            <summary className="px-4 py-3 text-sm text-white/40 cursor-pointer hover:text-white/60 transition-colors">
                                {completedTasks.length} completed
                            </summary>
                            <div className="divide-y divide-white/5">
                                {completedTasks.map(task => (
                                    <TaskRow key={task.id} task={task} onToggle={onToggleTask} onDelete={onDeleteTask} />
                                ))}
                            </div>
                        </details>
                    )}

                    {tasks.length === 0 && (
                        <div className="px-4 py-8 text-center text-white/30 text-sm">No tasks for {day}</div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Week Modal - shows days for a specific week
function WeekModal({ weekNumber, projectName, onClose, onDayClick, getTasksForDay }: {
    weekNumber: number;
    projectName: string;
    onClose: () => void;
    onDayClick: (day: string) => void;
    getTasksForDay: (day: string) => { completed: number; total: number };
}) {
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#0a0a0a] border border-white/10 rounded-[2px] w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div>
                        <h3 className="font-display font-bold text-white text-lg">Week {weekNumber}</h3>
                        <p className="text-white/40 text-xs font-mono">{projectName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-[2px] transition-colors">
                        <X size={20} className="text-white/60" />
                    </button>
                </div>

                <div className="p-4 space-y-3">
                    {DAYS.map((day) => {
                        const { completed, total } = getTasksForDay(day);
                        return (
                            <DayCard
                                key={day}
                                day={day}
                                onClick={() => onDayClick(day)}
                                tasksCompleted={completed}
                                totalTasks={total}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default function ProjectDetail({ auth, projectId }: ProjectDetailProps) {
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
    const [selectedDay, setSelectedDay] = useState<{ week: number; day: string } | null>(null);

    // Current week calculation (could be based on project start_date)
    const currentWeek = 1;

    const fetchProject = useCallback(async () => {
        try {
            const res = await window.axios.get(`/api/projects/${projectId}`);
            setProject(res.data);
        } catch (error) {
            console.error('Failed to fetch project:', error);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);

    // Mock function to get tasks for a specific week/day
    // In production, tasks would have week_number and day fields
    const getTasksForWeek = (weekNumber: number) => {
        // For now, distribute tasks across weeks
        const allTasks = project?.tasks || [];
        const tasksPerWeek = Math.ceil(allTasks.length / 12);
        const start = (weekNumber - 1) * tasksPerWeek;
        const weekTasks = allTasks.slice(start, start + tasksPerWeek);
        return {
            completed: weekTasks.filter(t => t.completed_at).length,
            total: weekTasks.length,
            tasks: weekTasks
        };
    };

    const getTasksForDay = (weekNumber: number, day: string) => {
        const weekData = getTasksForWeek(weekNumber);
        const dayIndex = DAYS.indexOf(day);
        const tasksPerDay = Math.ceil(weekData.tasks.length / 5);
        const start = dayIndex * tasksPerDay;
        const dayTasks = weekData.tasks.slice(start, start + tasksPerDay);
        return {
            completed: dayTasks.filter(t => t.completed_at).length,
            total: dayTasks.length,
            tasks: dayTasks
        };
    };

    const handleToggleTask = async (task: Task) => {
        if (!project) return;
        const wasCompleted = !!task.completed_at;
        const updatedTasks = project.tasks?.map(t =>
            t.id === task.id ? { ...t, completed_at: wasCompleted ? null : new Date().toISOString() } : t
        ) || [];
        const completedCount = updatedTasks.filter(t => t.completed_at).length;
        const totalCount = updatedTasks.length;
        setProject({
            ...project,
            tasks: updatedTasks,
            completed_task_count: completedCount,
            progress: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
        });
        try {
            await window.axios.put(`/api/tasks/${task.id}`, { completed_at: wasCompleted ? null : new Date().toISOString() });
        } catch (error) {
            fetchProject();
        }
    };

    const handleDeleteTask = async (task: Task) => {
        if (!project) return;
        const updatedTasks = project.tasks?.filter(t => t.id !== task.id) || [];
        const completedCount = updatedTasks.filter(t => t.completed_at).length;
        const totalCount = updatedTasks.length;
        setProject({
            ...project,
            tasks: updatedTasks,
            task_count: totalCount,
            completed_task_count: completedCount,
            progress: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
        });
        try {
            await window.axios.delete(`/api/tasks/${task.id}`);
        } catch (error) {
            fetchProject();
        }
    };

    const handleAddTask = async (title: string) => {
        if (!project) return;
        try {
            const res = await window.axios.post('/api/tasks', { title, project_id: project.id, priority: 'medium' });
            const newTask = res.data;
            const updatedTasks = [...(project.tasks || []), newTask];
            setProject({
                ...project,
                tasks: updatedTasks,
                task_count: updatedTasks.length,
                completed_task_count: updatedTasks.filter(t => t.completed_at).length,
                progress: updatedTasks.length > 0 ? Math.round((updatedTasks.filter(t => t.completed_at).length / updatedTasks.length) * 100) : 0
            });
        } catch (error) {
            console.error('Failed to add task:', error);
        }
    };

    if (isLoading) {
        return (
            <AppLayout user={auth.user}>
                <Head title="Loading..." />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-pulse text-white/40">Loading project...</div>
                </div>
            </AppLayout>
        );
    }

    if (!project) {
        return (
            <AppLayout user={auth.user}>
                <Head title="Project Not Found" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-white/40">Project not found</div>
                </div>
            </AppLayout>
        );
    }

    const progress = project.progress || 0;
    const taskCount = project.task_count || project.tasks?.length || 0;
    const completedCount = project.completed_task_count || project.tasks?.filter(t => t.completed_at).length || 0;

    return (
        <AppLayout user={auth.user}>
            <Head title={project.name} />

            <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto">
                {/* Back link */}
                <Link href="/projects" className="inline-flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors mb-6">
                    <ArrowLeft size={16} />
                    <span className="text-sm font-mono">Back to Projects</span>
                </Link>

                {/* Header */}
                <div className="stealth-card p-6 mb-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-2xl font-display font-bold text-white mb-1">{project.name}</h1>
                            {project.description && <p className="text-white/50 text-sm">{project.description}</p>}
                        </div>
                        <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-[2px]">
                            <span className="text-xs font-mono text-amber-400">Week {currentWeek}</span>
                        </div>
                    </div>

                    <ProgressBar progress={progress} />
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] font-mono text-white/40">{completedCount}/{taskCount} tasks completed</span>
                        <span className="text-sm font-mono text-white/60">{progress}%</span>
                    </div>
                </div>

                {/* 12-Week Grid */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar size={16} className="text-white/40" />
                        <h2 className="font-display font-bold text-white">12-Week Program</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => {
                            const { completed, total } = getTasksForWeek(week);
                            return (
                                <WeekCard
                                    key={week}
                                    weekNumber={week}
                                    isActive={week === currentWeek}
                                    onClick={() => setSelectedWeek(week)}
                                    tasksCompleted={completed}
                                    totalTasks={total}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Week Modal */}
            {selectedWeek && !selectedDay && (
                <WeekModal
                    weekNumber={selectedWeek}
                    projectName={project.name}
                    onClose={() => setSelectedWeek(null)}
                    onDayClick={(day) => setSelectedDay({ week: selectedWeek, day })}
                    getTasksForDay={(day) => {
                        const data = getTasksForDay(selectedWeek, day);
                        return { completed: data.completed, total: data.total };
                    }}
                />
            )}

            {/* Day Modal */}
            {selectedDay && (
                <DayModal
                    day={selectedDay.day}
                    weekNumber={selectedDay.week}
                    tasks={getTasksForDay(selectedDay.week, selectedDay.day).tasks}
                    onClose={() => setSelectedDay(null)}
                    onToggleTask={handleToggleTask}
                    onDeleteTask={handleDeleteTask}
                    onAddTask={handleAddTask}
                />
            )}
        </AppLayout>
    );
}

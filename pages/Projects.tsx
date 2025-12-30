import React, { useState } from 'react';
import { Project, ProjectStatus } from '../types';
import { ChevronDown, MoreHorizontal, ArrowUpRight } from 'lucide-react';
import { useApp } from '../store/AppContext';

const Projects: React.FC = () => {
    const { projects, tasks } = useApp();
    const [view, setView] = useState<'All' | 'Active' | 'Someday'>('Active');

    // Filter projects based on view
    const filteredProjects = projects.filter(p => {
        if (view === 'Active') return p.status !== ProjectStatus.Completed;
        if (view === 'Someday') return p.status === ProjectStatus.Stalled;
        return true;
    });

    // Helper to get task count
    const getTaskCount = (projectId: string) => tasks.filter(t => t.projectId === projectId && !t.isCompleted).length;

    // Helper to get next action text
    const getNextAction = (projectId: string) => {
        const projectTasks = tasks.filter(t => t.projectId === projectId && !t.isCompleted);
        if (projectTasks.length === 0) return "No active tasks";
        // Sort by priority/date simply
        return projectTasks[0].title;
    };

    return (
        <div className="flex-1 overflow-y-auto p-8">
            {/* Top Navigation / Stats */}
            <div className="flex justify-center mb-10">
                <div className="bg-[#0A0A0A] border border-white/10 rounded-[2px] p-1 flex">
                    <button 
                        onClick={() => setView('Active')}
                        className={`px-8 py-2 rounded-[2px] flex flex-col items-center transition-all ${view === 'Active' ? 'bg-white text-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <span className="font-bold text-xs font-display uppercase tracking-wider">Active</span>
                        <span className="text-[9px] opacity-60 font-mono mt-0.5">FOCUS</span>
                    </button>
                    <button 
                         onClick={() => setView('All')}
                        className={`px-8 py-2 rounded-[2px] flex flex-col items-center transition-all ${view === 'All' ? 'bg-white text-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <span className="font-bold text-xs font-display uppercase tracking-wider">All</span>
                        <span className="text-[9px] opacity-60 font-mono mt-0.5">OVERVIEW</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-end mb-6 pb-2 border-b border-white/5">
                    <h2 className="text-white text-sm font-bold font-display uppercase tracking-wide flex items-center gap-2">
                        Domain of Mastery <span className="text-white/30 font-mono">({filteredProjects.length})</span>
                    </h2>
                    <div className="flex items-center gap-2 text-white/40 text-[10px] font-mono uppercase tracking-widest">
                        <span>Status Indicators</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {filteredProjects.map(project => (
                        <div key={project.id} className="stealth-card group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowUpRight className="text-white/20" size={20} />
                            </div>
                            
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-white font-bold text-xl font-display tracking-tight mb-1">{project.name}</h3>
                                        <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest">{project.space}</div>
                                    </div>
                                    <div className={`px-2 py-1 rounded-[2px] text-[10px] font-mono font-bold border uppercase tracking-wider ${
                                        project.status === ProjectStatus.Attention 
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                        : project.status === ProjectStatus.Stalled
                                        ? 'bg-white/5 text-white/40 border-white/10'
                                        : 'bg-white/5 text-white/60 border-white/10'
                                    }`}>
                                        {project.status === ProjectStatus.Attention && <span className="animate-pulse mr-1">●</span>}
                                        {project.status}
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-white group-hover:bg-emerald-400 transition-colors duration-500" 
                                            style={{ width: `${project.progress}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-mono text-white/40 w-8 text-right">{project.progress}%</span>
                                </div>

                                {/* Footer Info */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        <span className="text-white/70 text-xs font-mono truncate max-w-md">{getNextAction(project.id)}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className="text-[10px] text-white/30 font-mono uppercase tracking-widest">
                                            {getTaskCount(project.id)} TASKS PENDING
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Projects;

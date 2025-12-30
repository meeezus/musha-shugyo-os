import React, { useState } from 'react';
import { Project, ProjectStatus } from '../types';
import { ChevronDown, MoreHorizontal } from 'lucide-react';

const Projects: React.FC = () => {
    const [view, setView] = useState<'All' | 'Active' | 'Someday'>('Active');

    const projects: Project[] = [
        { 
            id: '1', 
            name: 'DecoponATX Launch', 
            space: 'Pillar 1: Entrepreneurship', 
            progress: 10, 
            status: ProjectStatus.Attention, 
            taskCount: 90, 
            nextAction: 'Build hit list of 50 contacts using Apollo.io' 
        },
        { 
            id: '2', 
            name: 'Musha Shugyo Brand', 
            space: 'Pillar 1/2: Personal Brand', 
            progress: 25, 
            status: ProjectStatus.Healthy, 
            taskCount: 3, 
            nextAction: 'Draft 3 tweets for Tuesday morning block' 
        },
        { 
            id: '3', 
            name: 'Health Coaching', 
            space: 'Pillar 1: Income', 
            progress: 80, 
            status: ProjectStatus.Stalled, 
            taskCount: 2, 
            nextAction: 'Reactivate and find 1-2 pilot clients' 
        },
        { 
            id: '4', 
            name: 'BJJ White Belt Journey', 
            space: 'Pillar 2: Martial Arts', 
            progress: 5, 
            status: ProjectStatus.Healthy, 
            taskCount: 0, 
            nextAction: 'Attend Monday 12pm class at Six Blades' 
        },
        { 
            id: '5', 
            name: 'PersonalOS Build', 
            space: 'Pillar 3: Systems', 
            progress: 40, 
            status: ProjectStatus.Healthy, 
            taskCount: 5, 
            nextAction: 'Update metrics dashboard with Week 1 targets' 
        },
    ];

    return (
        <div className="flex-1 overflow-y-auto p-8">
            {/* Top Navigation / Stats */}
            <div className="flex justify-center mb-8">
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-1 flex">
                    <button 
                        onClick={() => setView('Active')}
                        className={`px-8 py-2 rounded flex flex-col items-center ${view === 'Active' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <span className="font-bold text-sm">Active</span>
                        <span className="text-[10px] opacity-70">Focus</span>
                    </button>
                    <button 
                         onClick={() => setView('All')}
                        className={`px-8 py-2 rounded flex flex-col items-center ${view === 'All' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <span className="font-bold text-sm">All</span>
                        <span className="text-[10px] opacity-70">Overview</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-amber-500 text-sm font-bold flex items-center gap-2">
                        Domain of Mastery <span className="text-slate-500 font-normal">({projects.length})</span>
                    </h2>
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                        <span>Status</span>
                    </div>
                </div>

                <div className="space-y-4">
                    {projects.map(project => (
                        <div key={project.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all group">
                            <div className="p-5">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-slate-100 font-bold text-lg">{project.name}</h3>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider">{project.space}</div>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                        project.status === ProjectStatus.Attention 
                                        ? 'bg-amber-900/20 text-amber-400 border-amber-500/30' 
                                        : project.status === ProjectStatus.Stalled
                                        ? 'bg-slate-800 text-slate-400 border-slate-700'
                                        : 'bg-emerald-900/20 text-emerald-400 border-emerald-500/30'
                                    }`}>
                                        ● {project.status}
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-amber-500 rounded-full" 
                                            style={{ width: `${project.progress}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-mono text-slate-400 w-8 text-right">{project.progress}%</span>
                                </div>

                                {/* Meta */}
                                <div className="flex justify-between items-center text-xs text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono">Tasks: {project.taskCount}</span>
                                    </div>
                                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 cursor-pointer hover:bg-slate-700">
                                        Active <ChevronDown size={12} />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Next Action Footer */}
                            <div className="bg-slate-800/30 border-t border-slate-800 px-5 py-3 flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                <span className="text-slate-300 text-xs flex-1 truncate">{project.nextAction}</span>
                                <MoreHorizontal size={14} className="text-slate-600 cursor-pointer" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Projects;
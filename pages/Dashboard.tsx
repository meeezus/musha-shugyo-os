import React from 'react';
import { Clock, CheckCircle2, Circle, Mail, Calendar as CalendarIcon } from 'lucide-react';
import GoalWidget from '../components/GoalWidget';
import { Task, CalendarEvent, TaskPriority } from '../types';

const Dashboard: React.FC = () => {
    // Based on Monday Jan 6 Plan
    const todayTasks: Task[] = [
        { id: '1', title: 'Write 3 tweets (White belt observations)', isCompleted: true, tags: ['Content', 'Done'], priority: TaskPriority.High },
        { id: '2', title: 'Build Decopon hit list (50 contacts)', isCompleted: false, tags: ['Outreach', 'Deep Work'], priority: TaskPriority.High },
        { id: '3', title: 'Send 15 warm outreach emails', isCompleted: false, tags: ['Outreach'], priority: TaskPriority.High },
        { id: '4', title: 'Capture BJJ voice memo after training', isCompleted: false, tags: ['System'], priority: TaskPriority.Medium },
    ];

    const recommendations = [
        { id: '1', title: 'Execute outreach batch 1', desc: '1:30-2:30pm block. Don\'t overthink tools.', high: true, score: 95 },
        { id: '2', title: 'Weekly Planning Review', desc: 'Check SuperX analytics from weekend setup.', high: false, score: 80 }
    ];

    const schedule: CalendarEvent[] = [
        { id: '1', title: 'Musha Shugyo Content Block', time: '7:00am', duration: '1.5h' },
        { id: '2', title: 'Decopon: Hit List Build', time: '9:00am', duration: '3h', location: 'Deep Work' },
        { id: '3', title: 'BJJ Training', time: '12:00pm', duration: '1h', location: 'Six Blades' },
        { id: '4', title: 'Decopon: Email Batches', time: '1:00pm', duration: '3.5h' },
        { id: '5', title: 'Evening Engagement', time: '8:00pm', duration: '15m' },
    ];

    return (
        <div className="flex-1 overflow-y-auto p-8 max-w-[1600px] mx-auto">
            {/* Header / Brief Status */}
            <div className="flex items-center gap-4 mb-6 text-slate-400 text-sm">
                <div className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-md flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    Status: Phase 1 - Foundation
                </div>
                <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>Mon, Jan 6, 8:45 AM</span>
                </div>
            </div>

            {/* Overview Card */}
            <div className="bg-slate-900/50 border border-amber-600/30 rounded-xl p-6 mb-8 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-600"></div>
                <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 bg-amber-600/10 rounded-lg text-amber-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-100 mb-2">Dual Mission Launch</h2>
                        <p className="text-slate-300 leading-relaxed text-sm max-w-4xl">
                            <strong>Launch Day for DecoponATX.</strong> Primary objective is building momentum with 50 contacts and 15 emails sent. 
                            Musha Shugyo content rhythm is established. BJJ at noon provides the physical break needed for afternoon execution.
                            Remember: <em>Revenue NOW. Don't wait.</em>
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column (Priorities) */}
                <div className="lg:col-span-7 space-y-6">
                    
                    {/* Focus & Recommendations */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                <span className="font-bold">!</span>
                            </div>
                            <h3 className="font-bold text-slate-200">Critical Actions</h3>
                        </div>

                        {/* Top Priorities Section */}
                        <div className="mb-8">
                            <h4 className="text-amber-500 text-sm font-semibold mb-4 flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full border border-amber-500 flex items-center justify-center text-[10px]">◎</span>
                                Today's Targets
                            </h4>
                            <div className="space-y-3">
                                {todayTasks.map(task => (
                                    <div key={task.id} className={`p-4 rounded-lg border flex items-start gap-3 transition-colors ${task.isCompleted ? 'bg-teal-900/10 border-teal-800/50 opacity-60' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}>
                                        {task.isCompleted ? <CheckCircle2 className="text-teal-500" size={20} /> : <Circle className="text-amber-500" size={20} />}
                                        <div className="flex-1">
                                            <p className={`text-sm ${task.isCompleted ? 'text-teal-200 line-through' : 'text-slate-200'}`}>{task.title}</p>
                                            {task.isCompleted && <span className="text-xs text-teal-500 mt-1 block">Completed</span>}
                                            {task.tags && !task.isCompleted && (
                                                <div className="flex gap-2 mt-2">
                                                    {task.tags.map(tag => (
                                                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">{tag}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recommendations Section */}
                         <div>
                            <h4 className="text-indigo-400 text-sm font-semibold mb-4 flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full border border-indigo-400 flex items-center justify-center text-[10px]">?</span>
                                Co-Pilot Recommendations
                            </h4>
                            <div className="space-y-3">
                                {recommendations.map((rec, idx) => (
                                    <div key={rec.id} className="group relative p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/60 transition-all flex gap-4 items-start">
                                         <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{idx + 1}</div>
                                         <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h5 className="text-slate-200 text-sm font-semibold">{rec.title}</h5>
                                                <div className="flex gap-2">
                                                    {rec.high && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-900/50">High Impact</span>}
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-400 border border-emerald-900/50 font-mono">⚡{rec.score}%</span>
                                                </div>
                                            </div>
                                            <p className="text-slate-400 text-xs mt-1">{rec.desc}</p>
                                         </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    <GoalWidget />
                </div>

                {/* Right Column (Schedule, Email, etc) */}
                <div className="lg:col-span-5 space-y-6">
                    
                     {/* Today's Schedule */}
                     <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <CalendarIcon className="text-blue-400" size={20} />
                            <h3 className="font-bold text-slate-200">Time Allocation</h3>
                        </div>

                        {/* Availability Summary */}
                        <div className="space-y-2 mb-6 text-xs font-mono text-emerald-400/80">
                            <div className="flex items-center gap-2"><CheckCircle2 size={12}/> <span>Musha Shugyo: 1h 45m / day</span></div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={12}/> <span>DecoponATX: 6-8h / day</span></div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={12}/> <span>Training: 1h (Mon/Wed)</span></div>
                        </div>

                        {/* Timeline */}
                        <div className="relative space-y-6 pl-4 before:absolute before:left-[7px] before:top-2 before:h-full before:w-[2px] before:bg-slate-800">
                            {schedule.map((event) => (
                                <div key={event.id} className="relative pl-6">
                                    <div className={`absolute left-[-5px] top-1 w-3 h-3 rounded-full border-2 ${event.title.includes('BJJ') ? 'bg-slate-900 border-emerald-500' : 'bg-slate-900 border-amber-500'}`}></div>
                                    <div className="text-xs text-slate-400 font-mono mb-0.5">{event.time}</div>
                                    <div className="text-slate-200 font-medium text-sm">{event.title}</div>
                                    <div className="flex gap-2 text-xs text-slate-500 mt-0.5">
                                        <Clock size={12} /> {event.duration}
                                        {event.location && <span>📍 {event.location}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Email/Outreach Widget */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Mail className="text-emerald-400" size={20} />
                                <h3 className="font-bold text-slate-200">Decopon Outreach</h3>
                            </div>
                            <span className="text-2xl font-bold text-slate-100">0/90</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="bg-slate-800/50 border border-slate-700 rounded p-2 text-center">
                                <div className="text-slate-300 font-bold text-lg">50</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Prospects</div>
                            </div>
                            <div className="bg-amber-900/20 border border-amber-900/50 rounded p-2 text-center">
                                <div className="text-amber-400 font-bold text-lg">0</div>
                                <div className="text-[10px] text-amber-300/70 uppercase tracking-wider">Replies</div>
                            </div>
                            <div className="bg-emerald-900/20 border border-emerald-900/50 rounded p-2 text-center">
                                <div className="text-emerald-400 font-bold text-lg">0</div>
                                <div className="text-[10px] text-emerald-300/70 uppercase tracking-wider">Calls</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Next Batches</div>
                            <div className="bg-slate-800/40 border-l-2 border-amber-500 p-3 rounded-r text-xs text-slate-300 flex justify-between">
                                <span>Warm Outreach (Google Friend)</span>
                                <span className="text-slate-500">1:00 PM</span>
                            </div>
                            <div className="bg-slate-800/40 border-l-2 border-slate-600 p-3 rounded-r text-xs text-slate-300 flex justify-between">
                                <span>Batch 1 (5 Emails)</span>
                                <span className="text-slate-500">1:30 PM</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
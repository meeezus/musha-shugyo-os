import React from 'react';
import { Clock, CheckCircle2, Circle, Mail, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
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
        { id: '1', title: 'Musha Shugyo Content Block', time: '07:00', duration: '1.5h' },
        { id: '2', title: 'Decopon: Hit List Build', time: '09:00', duration: '3h', location: 'Deep Work' },
        { id: '3', title: 'BJJ Training', time: '12:00', duration: '1h', location: 'Six Blades' },
        { id: '4', title: 'Decopon: Email Batches', time: '13:00', duration: '3.5h' },
        { id: '5', title: 'Evening Engagement', time: '20:00', duration: '15m' },
    ];

    return (
        <div className="flex-1 overflow-y-auto p-8 max-w-[1600px] mx-auto">
            {/* Header / Brief Status */}
            <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
                <div>
                     <h2 className="text-3xl font-display font-bold text-white mb-2">COMMAND CENTER</h2>
                     <div className="flex items-center gap-4 text-xs font-mono text-white/50">
                        <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-[2px] text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            PHASE 1: FOUNDATION
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>MON, JAN 6 // 08:45</span>
                        </div>
                     </div>
                </div>
            </div>

            {/* Overview Card */}
            <div className="stealth-card p-6 mb-8 relative group">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <div className="flex items-start gap-4">
                    <div className="mt-1 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-[2px] text-emerald-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold font-display text-white mb-2 tracking-wide">DUAL MISSION LAUNCH</h2>
                        <p className="text-white/60 leading-relaxed text-sm max-w-4xl font-light">
                            <strong className="text-white">Launch Day for DecoponATX.</strong> Primary objective is building momentum with 50 contacts and 15 emails sent. 
                            Musha Shugyo content rhythm is established. BJJ at noon provides the physical break needed for afternoon execution.
                        </p>
                        <div className="mt-4 text-xs font-mono text-emerald-500/80 border-l border-emerald-500/20 pl-3">
                            DIRECTIVE: REVENUE NOW. DON'T WAIT.
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column (Priorities) */}
                <div className="lg:col-span-7 space-y-6">
                    
                    {/* Focus & Recommendations */}
                    <div className="stealth-card p-6">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="text-emerald-500">
                                    <span className="font-mono text-lg font-bold">!</span>
                                </div>
                                <h3 className="font-bold font-display text-white tracking-wide text-sm">CRITICAL ACTIONS</h3>
                            </div>
                            <span className="text-[10px] font-mono text-white/30">PRIORITY QUEUE</span>
                        </div>

                        {/* Top Priorities Section */}
                        <div className="mb-8">
                            <h4 className="text-white/40 text-[10px] font-bold font-mono uppercase tracking-widest mb-4 flex items-center gap-2">
                                TODAY'S TARGETS
                            </h4>
                            <div className="space-y-2">
                                {todayTasks.map(task => (
                                    <div key={task.id} className={`p-4 rounded-[2px] border flex items-start gap-4 transition-all group ${task.isCompleted ? 'bg-white/5 border-white/10 opacity-50' : 'bg-[#0F0F0F] border-white/5 hover:border-emerald-500/30'}`}>
                                        <div className="mt-0.5">
                                            {task.isCompleted ? <CheckCircle2 className="text-emerald-500" size={16} /> : <Circle className="text-white/20 group-hover:text-emerald-500 transition-colors" size={16} />}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-medium ${task.isCompleted ? 'text-white/40 line-through decoration-white/20' : 'text-white'}`}>{task.title}</p>
                                            
                                            {task.tags && !task.isCompleted && (
                                                <div className="flex gap-2 mt-2">
                                                    {task.tags.map(tag => (
                                                        <span key={tag} className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-white/5 text-white/50 border border-white/10">{tag}</span>
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
                            <h4 className="text-white/40 text-[10px] font-bold font-mono uppercase tracking-widest mb-4 flex items-center gap-2">
                                CO-PILOT INTEL
                            </h4>
                            <div className="space-y-2">
                                {recommendations.map((rec, idx) => (
                                    <div key={rec.id} className="group relative p-4 rounded-[2px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all flex gap-4 items-start">
                                         <div className="w-5 h-5 rounded-sm bg-white/10 text-white/60 font-mono font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">{idx + 1}</div>
                                         <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h5 className="text-white text-sm font-bold font-display tracking-wide">{rec.title}</h5>
                                                <div className="flex gap-2">
                                                    {rec.high && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-red-500/10 text-red-400 border border-red-500/20">HIGH IMPACT</span>}
                                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">⚡ {rec.score}%</span>
                                                </div>
                                            </div>
                                            <p className="text-white/50 text-xs mt-1 font-light">{rec.desc}</p>
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
                     <div className="stealth-card p-6">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                            <CalendarIcon className="text-white/40" size={16} />
                            <h3 className="font-bold font-display text-white tracking-wide text-sm">TIME ALLOCATION</h3>
                        </div>

                        {/* Availability Summary */}
                        <div className="space-y-3 mb-8 text-xs font-mono text-emerald-500/80 bg-emerald-900/10 p-4 rounded-[2px] border border-emerald-500/20">
                            <div className="flex items-center gap-2"><div className="w-1 h-1 bg-emerald-500 rounded-full"></div> <span>MUSHA SHUGYO: 1H 45M / DAY</span></div>
                            <div className="flex items-center gap-2"><div className="w-1 h-1 bg-emerald-500 rounded-full"></div> <span>DECOPONATX: 6-8H / DAY</span></div>
                            <div className="flex items-center gap-2"><div className="w-1 h-1 bg-emerald-500 rounded-full"></div> <span>TRAINING: 1H (MON/WED)</span></div>
                        </div>

                        {/* Timeline */}
                        <div className="relative space-y-6 pl-4 before:absolute before:left-[5px] before:top-2 before:h-full before:w-[1px] before:bg-white/10">
                            {schedule.map((event) => (
                                <div key={event.id} className="relative pl-6 group">
                                    <div className={`absolute left-[-2px] top-1.5 w-[15px] h-[1px] ${event.title.includes('BJJ') ? 'bg-emerald-500' : 'bg-white/20'}`}></div>
                                    <div className="text-xs text-white/30 font-mono mb-1">{event.time}</div>
                                    <div className="text-white font-bold font-display text-sm group-hover:text-emerald-400 transition-colors">{event.title}</div>
                                    <div className="flex gap-2 text-[10px] text-white/40 mt-1 font-mono uppercase tracking-wide">
                                        <Clock size={10} /> {event.duration}
                                        {event.location && <span>// {event.location}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Email/Outreach Widget */}
                    <div className="stealth-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Mail className="text-white/40" size={16} />
                                <h3 className="font-bold font-display text-white tracking-wide text-sm">DECOPON OUTREACH</h3>
                            </div>
                            <span className="text-2xl font-bold font-display text-white">0<span className="text-white/30 text-lg">/90</span></span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mb-6">
                            <div className="bg-white/5 border border-white/10 rounded-[2px] p-3 text-center hover:bg-white/10 transition-colors cursor-pointer">
                                <div className="text-white font-bold text-lg font-display">50</div>
                                <div className="text-[9px] text-white/40 uppercase tracking-widest font-mono mt-1">PROSPECTS</div>
                            </div>
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2px] p-3 text-center">
                                <div className="text-emerald-400 font-bold text-lg font-display">0</div>
                                <div className="text-[9px] text-emerald-500/60 uppercase tracking-widest font-mono mt-1">REPLIES</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-[2px] p-3 text-center">
                                <div className="text-white font-bold text-lg font-display">0</div>
                                <div className="text-[9px] text-white/40 uppercase tracking-widest font-mono mt-1">CALLS</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-[9px] text-white/30 font-bold font-mono uppercase tracking-widest mb-2">NEXT BATCHES</div>
                            <div className="bg-[#0F0F0F] border-l-2 border-emerald-500 p-3 flex justify-between items-center hover:bg-white/5 transition-colors">
                                <span className="text-xs text-white/80 font-medium">Warm Outreach (Google Friend)</span>
                                <span className="text-white/30 font-mono text-[10px]">13:00</span>
                            </div>
                            <div className="bg-[#0F0F0F] border-l-2 border-white/20 p-3 flex justify-between items-center hover:bg-white/5 transition-colors">
                                <span className="text-xs text-white/60">Batch 1 (5 Emails)</span>
                                <span className="text-white/30 font-mono text-[10px]">13:30</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
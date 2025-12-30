import React, { useState } from 'react';
import { Sword, Calendar as CalendarIcon, Clock, CheckCircle2, ChevronRight, Dumbbell, Play, Target, Video, Activity, Trophy } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { SESSIONS } from '../data/training';

const TrainingLog: React.FC = () => {
    const { completedExercises, toggleExercise, weightLogs, logWeight } = useApp();
    const [activeBlock, setActiveBlock] = useState(1);
    const [activeSessionId, setActiveSessionId] = useState(1);

    // Get current session data
    const session = SESSIONS[activeBlock]?.[activeSessionId] || SESSIONS[1][1];

    // Mock history data
    const history = [
        { id: 1, date: 'MON, JAN 6', time: '12:00 PM', class: 'Fundamentals', technique: 'Closed Guard Breaks', instructor: 'Prof. X', status: 'Completed' },
        { id: 2, date: 'WED, JAN 8', time: '12:00 PM', class: 'All Levels', technique: 'Side Control Escapes', instructor: 'Coach Y', status: 'Scheduled' },
    ];

    const getYouTubeLink = (query: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(query + " exercise")}`;

    // Calculate progress for current session
    const totalExercises = session.clusters.reduce((acc, cluster) => acc + cluster.exercises.length, 0);
    const completedCount = session.clusters.reduce((acc, cluster) => 
        acc + cluster.exercises.filter(ex => completedExercises[`${activeBlock}-${activeSessionId}-${ex.id}`]).length, 0
    );
    const progress = Math.round((completedCount / totalExercises) * 100);

    return (
        <div className="flex-1 overflow-y-auto p-8 max-w-[1200px] mx-auto">
             <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
                <div>
                     <h2 className="text-3xl font-display font-bold text-white mb-2">TRAINING LOG</h2>
                     <div className="flex items-center gap-4 text-xs font-mono text-white/50">
                        <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-[2px] text-emerald-400">
                            <Sword size={12} />
                            SIX BLADES JIU-JITSU
                        </div>
                        <div className="flex items-center gap-1">
                            <span>BLOCK {activeBlock} // SESSION {activeSessionId}</span>
                        </div>
                     </div>
                </div>
                
                {/* Session Selector */}
                <div className="flex gap-1">
                    {[1, 2, 3].map(sid => (
                        <button
                            key={sid}
                            onClick={() => setActiveSessionId(sid)}
                            className={`px-3 py-1 text-xs font-mono border rounded-[2px] transition-all ${
                                activeSessionId === sid 
                                ? 'bg-white text-black border-white' 
                                : 'bg-transparent text-white/40 border-white/10 hover:text-white'
                            }`}
                        >
                            Session {sid}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Main Tracker Area */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* Active Session Card */}
                    <div className="stealth-card p-0 overflow-hidden relative">
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 bg-[#0F0F0F] flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 text-emerald-500 mb-2">
                                    <Activity size={14} />
                                    <span className="text-xs font-bold font-mono uppercase tracking-widest">Active Protocol</span>
                                </div>
                                <h2 className="text-2xl font-display font-bold text-white mb-1">{session.title}</h2>
                                <div className="flex gap-4 text-xs font-mono text-white/40">
                                    <span>FOCUS: {session.focus.toUpperCase()}</span>
                                    <span>TIME: {session.duration}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-display font-bold text-white">{progress}%</div>
                                <div className="text-[10px] text-white/30 font-mono uppercase">Completed</div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1 w-full bg-black">
                            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Warmup */}
                            <div className="bg-white/[0.02] p-4 border border-white/5 rounded-[2px]">
                                <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-widest flex items-center gap-2">
                                    <Play size={12} className="text-emerald-500" /> Initialization Sequence
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {session.warmup.map((w, i) => (
                                        <div key={i} className="text-xs font-mono text-white/60 flex items-center gap-2">
                                            <div className="w-1 h-1 bg-white/20 rounded-full"></div> {w}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Clusters */}
                            {session.clusters.map((cluster, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline mb-4 border-l-2 border-white pl-3">
                                        <h3 className="font-display font-bold text-lg text-white">{cluster.title}</h3>
                                        {cluster.rest && <span className="text-[10px] font-mono text-white/60 border border-white/10 px-2 py-1 bg-white/5">Rest: {cluster.rest}</span>}
                                    </div>
                                    <div className="space-y-2">
                                        {cluster.exercises.map((ex) => {
                                            const key = `${activeBlock}-${activeSessionId}-${ex.id}`;
                                            const isChecked = !!completedExercises[key];
                                            const lastWeight = weightLogs[ex.id]?.weight;
                                            const targetWeight = lastWeight ? lastWeight + 5 : null;
                                            
                                            // Determine if it's a bodyweight or cardio exercise
                                            const isBW = ex.intensity === 'BW' || ex.intensity === 'Light' || ex.intensity === 'Bodyweight';

                                            return (
                                                <div 
                                                    key={ex.id} 
                                                    className={`flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border transition-all rounded-[2px] ${isChecked ? 'bg-white/5 border-white/20' : 'bg-[#0F0F0F] border-white/5 hover:border-white/20'}`}
                                                >
                                                    <div className="flex items-center gap-4 cursor-pointer mb-3 sm:mb-0" onClick={() => toggleExercise(key)}>
                                                        <div className={`w-5 h-5 border rounded-[2px] flex items-center justify-center transition-colors ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 bg-black'}`}>
                                                            {isChecked && <CheckCircle2 size={14} className="text-black" />}
                                                        </div>
                                                        <div>
                                                            {/* Hyperlinked Exercise Name */}
                                                            <a 
                                                                href={getYouTubeLink(ex.name)} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer" 
                                                                className={`font-bold text-sm hover:text-emerald-400 hover:underline flex items-center gap-2 ${isChecked ? 'text-white/50 line-through' : 'text-white'}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {ex.name} <Video size={10} className="opacity-50" />
                                                            </a>
                                                            {ex.notes && <div className="text-[10px] text-white/40 mt-1 font-mono">// {ex.notes}</div>}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-end gap-6 w-full sm:w-auto">
                                                        {/* Conditionally Render Weight Input */}
                                                        {!isBW && (
                                                            <div className="flex flex-col items-end">
                                                                {lastWeight && (
                                                                    <div className="flex items-center gap-1 text-[9px] text-white/30 mb-1 font-mono">
                                                                        <span>Last: {lastWeight}</span>
                                                                        <span className="text-white/20">→</span>
                                                                        <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                                                                            <Target size={8} /> {targetWeight}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-2">
                                                                    <input 
                                                                        type="number" 
                                                                        placeholder="LBS"
                                                                        className="w-16 bg-black border border-white/10 text-white text-xs font-mono p-1.5 text-right focus:border-emerald-500/50 outline-none rounded-[2px]"
                                                                        onBlur={(e) => logWeight(ex.id, parseFloat(e.target.value))}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="text-right min-w-[60px]">
                                                            <div className={`font-mono text-sm font-bold ${isChecked ? 'text-white/30' : 'text-white'}`}>{ex.sets} x {ex.reps}</div>
                                                            {ex.intensity && <div className="text-[10px] text-white/30 mt-1">{ex.intensity}</div>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats & History */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Weekly Stats */}
                    <div className="stealth-card p-6 relative overflow-hidden group">
                        <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest mb-1">WEEKLY TARGET</div>
                        <div className="text-3xl font-display font-bold text-white relative z-10">1<span className="text-white/30 text-lg">/3</span></div>
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mt-3 relative z-10">
                            <div className="h-full bg-emerald-500 w-[33%]"></div>
                        </div>
                        <Trophy size={64} className="absolute -bottom-4 -right-4 text-white/5 transform -rotate-12 group-hover:scale-110 transition-transform" />
                    </div>

                    <div className="stealth-card p-6">
                        <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest mb-1">NEXT CLASS</div>
                        <div className="text-xl font-display font-bold text-white">WED 12:00</div>
                        <div className="text-[10px] text-white/40 font-mono mt-1">ALL LEVELS // SIX BLADES</div>
                    </div>

                    {/* Session History List */}
                    <div className="stealth-card p-6">
                        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
                            <CalendarIcon className="text-white/40" size={16} />
                            <h3 className="font-bold font-display text-white tracking-wide text-sm">HISTORY</h3>
                        </div>
                        
                        <div className="space-y-2">
                            {history.map((h) => (
                                <div key={h.id} className="p-3 bg-[#0F0F0F] border border-white/5 rounded-[2px] flex items-center justify-between group hover:border-emerald-500/30 hover:bg-white/5 transition-all cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-[2px] flex items-center justify-center border ${h.status === 'Completed' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-white/5 border-white/10 text-white/20'}`}>
                                            {h.status === 'Completed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-white font-display">{h.date}</span>
                                            </div>
                                            <div className="text-[10px] text-white/40 font-mono">{h.technique}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrainingLog;

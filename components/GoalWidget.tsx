import React from 'react';

interface GoalProps {
    title: string;
    current: number;
    target: number;
    trend: string;
    // Map old color classes to new semantic styles or ignore them
    colorClass: string; 
    subtext?: string;
}

const GoalItem: React.FC<GoalProps> = ({ title, current, target, trend, subtext }) => {
    const percentage = Math.min((current / target) * 100, 100);

    return (
        <div className="mb-6 last:mb-0">
            <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold font-display uppercase tracking-widest text-white/80">{title}</span>
                <div className="flex gap-3 text-xs font-mono">
                    <span className="text-white">{current} / {target}</span>
                    <span className={`px-1.5 py-0.5 rounded-[2px] bg-white/5 border border-white/10 text-[10px] ${trend.startsWith('+') ? 'text-emerald-400' : 'text-white/40'}`}>
                        {trend}
                    </span>
                </div>
            </div>
            {/* Progress Bar Container */}
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden relative">
                <div 
                    className="h-full bg-white transition-all duration-1000 ease-out" 
                    style={{ width: `${percentage}%` }} 
                />
            </div>
            {subtext && <div className="text-[10px] text-white/30 mt-1.5 font-mono">// {subtext}</div>}
        </div>
    );
}

const GoalWidget: React.FC = () => {
    return (
        <div className="stealth-card p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                <div className="w-8 h-8 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center text-emerald-500">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <div>
                    <h3 className="font-bold font-display text-white tracking-wide text-sm">WEEK 1 TARGETS</h3>
                    <div className="text-[10px] text-white/40 font-mono mt-0.5">MISSION: CONTENT & OUTREACH</div>
                </div>
            </div>

            <GoalItem 
                title="Decopon Emails" 
                current={15} 
                target={90} 
                trend="ON TRACK" 
                colorClass="" // Ignored
                subtext="TARGET: 20/DAY TUE-THU"
            />

             <GoalItem 
                title="Tweets Posted" 
                current={6} 
                target={15} 
                trend="+3 TODAY" 
                colorClass=""
                subtext="CONSISTENCY > PERFECTION"
            />

             <GoalItem 
                title="BJJ Sessions" 
                current={1} 
                target={2} 
                trend="MON DONE" 
                colorClass="" 
                subtext="SIX BLADES: MON/WED"
            />
        </div>
    );
};

export default GoalWidget;
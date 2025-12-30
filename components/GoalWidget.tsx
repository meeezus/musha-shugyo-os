import React from 'react';

interface GoalProps {
    title: string;
    current: number;
    target: number;
    trend: string;
    colorClass: string;
    subtext?: string;
}

const GoalItem: React.FC<GoalProps> = ({ title, current, target, trend, colorClass, subtext }) => {
    // Calculate percentage based on target being 100% of the bar conceptually, 
    // or if inputs are raw numbers, we normalize.
    // Assuming inputs are raw numbers here for Week 1 metrics.
    const percentage = Math.min((current / target) * 100, 100);

    return (
        <div className="mb-4 last:mb-0">
            <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-semibold text-slate-200">{title}</span>
                <div className="flex gap-2 text-xs font-mono">
                    <span className="text-slate-100 font-bold">{current}</span>
                    <span className="text-slate-500">/ {target}</span>
                    <span className={`px-1.5 rounded bg-slate-800 ${trend.startsWith('+') ? 'text-green-400' : 'text-slate-400'}`}>
                        {trend}
                    </span>
                </div>
            </div>
            {/* Progress Bar Container */}
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative">
                <div 
                    className={`h-full rounded-full ${colorClass}`} 
                    style={{ width: `${percentage}%` }} 
                />
            </div>
            {subtext && <div className="text-[10px] text-slate-500 mt-1 italic">{subtext}</div>}
        </div>
    );
}

const GoalWidget: React.FC = () => {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-amber-900/30 text-amber-500 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <h3 className="font-bold text-slate-200">Week 1 Targets</h3>
            </div>

            <div className="text-xs text-slate-400 mb-4 leading-relaxed">
                "Dual Mission": Establish content rhythm & execute outreach volume.
            </div>

            <GoalItem 
                title="Decopon Emails Sent" 
                current={15} 
                target={90} 
                trend="On Track" 
                colorClass="bg-green-500" 
                subtext="Target: 20/day Tue-Thu"
            />

             <GoalItem 
                title="Musha Shugyo Tweets" 
                current={6} 
                target={15} 
                trend="+3 today" 
                colorClass="bg-amber-500" 
                subtext="Consistency > Perfection"
            />

             <GoalItem 
                title="BJJ Sessions" 
                current={1} 
                target={2} 
                trend="Mon done" 
                colorClass="bg-indigo-500" 
                subtext="Six Blades: Mon/Wed"
            />
        </div>
    );
};

export default GoalWidget;
import React from 'react';
import { Brain, Dumbbell, Heart, Briefcase } from 'lucide-react';

interface QuadrantScore {
    score: number;
    label: string;
}

interface QuadrantSummaryProps {
    summary: {
        mind: QuadrantScore;
        body: QuadrantScore;
        spirit: QuadrantScore;
        vocation: QuadrantScore;
        overall: number;
    } | null;
}

export default function QuadrantSummaryWidget({ summary }: QuadrantSummaryProps) {
    if (!summary) return null;

    const quadrants = [
        { key: 'mind', data: summary.mind, icon: Brain, color: 'text-purple-500/50' },
        { key: 'body', data: summary.body, icon: Dumbbell, color: 'text-emerald-500/50' },
        { key: 'spirit', data: summary.spirit, icon: Heart, color: 'text-rose-500/50' },
        { key: 'vocation', data: summary.vocation, icon: Briefcase, color: 'text-amber-500/50' },
    ];

    const getScoreOpacity = (score: number) => {
        if (score >= 70) return 'text-emerald-500/60';
        if (score >= 40) return 'text-amber-500/50';
        return 'text-white/40';
    };

    const getBarOpacity = (score: number, key: string) => {
        const colorMap: Record<string, string> = {
            mind: 'bg-purple-500',
            body: 'bg-emerald-500',
            spirit: 'bg-rose-500',
            vocation: 'bg-amber-500',
        };
        const baseColor = colorMap[key] || 'bg-white';
        if (score >= 70) return `${baseColor}/50`;
        if (score >= 40) return `${baseColor}/30`;
        return `${baseColor}/20`;
    };

    return (
        <div className="stealth-card p-6">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                <h3 className="font-mono text-[11px] text-white/50 tracking-widest uppercase">
                    Human 3.0
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-white/30">OVERALL</span>
                    <span className={`text-lg font-bold font-mono ${getScoreOpacity(summary.overall)}`}>
                        {summary.overall}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
                {quadrants.map(({ key, data, icon: Icon, color }) => (
                    <div
                        key={key}
                        className="flex flex-col items-center p-3 bg-white/[0.02] border border-white/5 rounded-[2px]"
                    >
                        <Icon size={18} className={color} />
                        <span className="text-[9px] font-mono text-white/25 mt-1 uppercase tracking-wide">
                            {data.label}
                        </span>
                        <span className={`text-lg font-bold font-mono mt-1 ${getScoreOpacity(data.score)}`}>
                            {data.score}%
                        </span>
                        {/* Progress bar */}
                        <div className="w-full h-1 bg-white/10 rounded-sm mt-2 overflow-hidden">
                            <div
                                className={`h-full ${getBarOpacity(data.score, key)} transition-all duration-500`}
                                style={{ width: `${data.score}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

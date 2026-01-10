import React from 'react';
import { TrendingUp, Zap, Flame, AlertCircle } from 'lucide-react';

interface TimeAllocation {
    project: string;
    targetHours: string;
    schedule: string;
    color: string;
    progress?: number;
    completedThisWeek?: number;
    pendingCount?: number;
    status?: 'crushing' | 'active' | 'progress' | 'stalled';
    statusColor?: string;
}

interface TimeAllocationWidgetProps {
    allocations: TimeAllocation[];
}

export default function TimeAllocationWidget({ allocations }: TimeAllocationWidgetProps) {
    if (allocations.length === 0) {
        return (
            <div className="stealth-card p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-black/5 dark:border-white/5">
                    <TrendingUp className="text-black/40 dark:text-white/40" size={16} />
                    <h3 className="font-bold font-display text-black dark:text-white tracking-wide text-sm">
                        PROJECT PROGRESS
                    </h3>
                </div>
                <div className="p-4 text-center text-black/30 dark:text-white/30 font-mono text-xs border border-dashed border-black/10 dark:border-white/10 rounded-[2px]">
                    No projects tracked
                </div>
            </div>
        );
    }

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'crushing':
                return <Flame size={12} className="text-emerald-500/60" />;
            case 'active':
                return <Zap size={12} className="text-blue-500/60" />;
            case 'progress':
                return <TrendingUp size={12} className="text-amber-500/60" />;
            default:
                return <AlertCircle size={12} className="text-red-500/40" />;
        }
    };

    const getStatusLabel = (status?: string) => {
        switch (status) {
            case 'crushing':
                return 'CRUSHING';
            case 'active':
                return 'ACTIVE';
            case 'progress':
                return 'MOVING';
            default:
                return 'STALLED';
        }
    };

    const getStatusBg = (status?: string) => {
        switch (status) {
            case 'crushing':
                return 'bg-emerald-500/5 border-emerald-500/15 text-emerald-500/60';
            case 'active':
                return 'bg-blue-500/5 border-blue-500/15 text-blue-500/60';
            case 'progress':
                return 'bg-amber-500/5 border-amber-500/15 text-amber-500/60';
            default:
                return 'bg-red-500/5 border-red-500/15 text-red-500/40';
        }
    };

    // Calculate totals
    const totalThisWeek = allocations.reduce((sum, a) => sum + (a.completedThisWeek || 0), 0);
    const totalPending = allocations.reduce((sum, a) => sum + (a.pendingCount || 0), 0);

    return (
        <div className="stealth-card p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <TrendingUp className="text-black/40 dark:text-white/40" size={16} />
                    <h3 className="font-bold font-display text-black dark:text-white tracking-wide text-sm">
                        PROJECT PROGRESS
                    </h3>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                    <span className="text-emerald-500/60">{totalThisWeek} this week</span>
                    <span className="text-black/30 dark:text-white/30">|</span>
                    <span className="text-black/40 dark:text-white/40">{totalPending} pending</span>
                </div>
            </div>

            <div className="space-y-3">
                {allocations.map((allocation, idx) => (
                    <div
                        key={idx}
                        className="p-3 rounded-[2px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div
                                className="w-1 h-6 rounded-full flex-shrink-0 opacity-50"
                                style={{ backgroundColor: allocation.color }}
                            ></div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold font-display text-black dark:text-white truncate">
                                    {allocation.project}
                                </div>
                            </div>
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] border text-[10px] font-mono ${getStatusBg(allocation.status)}`}>
                                {getStatusIcon(allocation.status)}
                                <span>{getStatusLabel(allocation.status)}</span>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="ml-4">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-mono text-black/40 dark:text-white/40">
                                    {allocation.schedule}
                                </span>
                                <span className="text-[10px] font-mono text-emerald-500/50">
                                    +{allocation.completedThisWeek || 0} this week
                                </span>
                            </div>
                            <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500 opacity-50"
                                    style={{
                                        backgroundColor: allocation.color,
                                        width: `${allocation.progress || 0}%`,
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

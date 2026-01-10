import React, { useState } from 'react';
import { Lightbulb, Clock, Circle, CheckCircle2 } from 'lucide-react';
import { Recommendation, Task } from '@/types';

interface RecommendationsWidgetProps {
    recommendations: Recommendation[];
    tasks?: Task[];
    onTaskComplete?: (taskId: number) => void;
}

export default function RecommendationsWidget({
    recommendations,
    tasks = [],
    onTaskComplete,
}: RecommendationsWidgetProps) {
    const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
    const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());

    const handleComplete = async (id: number) => {
        if (!onTaskComplete || loadingIds.has(id)) return;

        setLoadingIds(prev => new Set(prev).add(id));
        try {
            await onTaskComplete(id);
            setCompletedIds(prev => new Set(prev).add(id));
        } finally {
            setLoadingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };
    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'high':
                return { label: 'HIGH', color: 'text-red-500/50 bg-red-500/5 border-red-500/20' };
            case 'medium':
                return { label: 'MED', color: 'text-amber-500/50 bg-amber-500/5 border-amber-500/15' };
            default:
                return { label: 'LOW', color: 'text-white/35 bg-white/[0.02] border-white/10' };
        }
    };


    // Show agent recommendations if available, otherwise fall back to DB tasks (deduped)
    const displayItems = recommendations.length > 0
        ? recommendations
        : tasks
            .filter((task, idx, arr) => arr.findIndex(t => t.title === task.title) === idx) // dedupe by title
            .slice(0, 5)
            .map((task) => ({
                id: task.id,
                title: task.title,
                description: task.project?.name || 'From database',
                priority: task.priority,
                energyAware: false,
                source: 'database',
            }));

    return (
        <div className="stealth-card p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="text-white/30">
                        <Lightbulb size={16} />
                    </div>
                    <h3 className="font-mono text-[11px] text-white/50 tracking-widest uppercase">
                        Recommendations
                    </h3>
                </div>
                <span className="text-[10px] font-mono text-white/25">
                    {displayItems.length} ITEMS
                </span>
            </div>

            <div className="space-y-2">
                {displayItems.length > 0 ? (
                    displayItems.filter(item => !completedIds.has(item.id)).map((item, idx) => {
                        const isLoading = loadingIds.has(item.id);
                        return (
                            <div
                                key={item.id}
                                className="group relative p-4 rounded-[2px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all"
                            >
                                <div className="flex gap-4 items-start">
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => handleComplete(item.id)}
                                        disabled={isLoading}
                                        className={`flex-shrink-0 mt-0.5 transition-all ${isLoading ? 'opacity-50' : 'hover:scale-110'}`}
                                    >
                                        <Circle
                                            size={20}
                                            className="text-white/20 hover:text-white/50 transition-colors"
                                        />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <h5 className="text-white/80 text-sm font-medium tracking-wide truncate">
                                                {item.title}
                                            </h5>
                                            <div className="flex gap-2 flex-shrink-0">
                                                {(() => {
                                                    const badge = getPriorityBadge(item.priority);
                                                    return (
                                                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] border ${badge.color}`}>
                                                            {badge.label}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-white/40 text-xs font-light truncate">
                                                {item.description}
                                            </p>
                                            {item.energyAware && (
                                                <span className="text-[9px] font-mono text-white/30 px-1 py-0.5 bg-white/5 rounded">
                                                    ENERGY-AWARE
                                                </span>
                                            )}
                                            {item.timeBlock && (
                                                <span className="flex items-center gap-1 text-[9px] font-mono text-white/30">
                                                    <Clock size={8} />
                                                    {item.timeBlock}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="p-4 text-center text-white/25 font-mono text-xs border border-dashed border-white/10 rounded-[2px]">
                        No recommendations available
                    </div>
                )}
            </div>
        </div>
    );
}

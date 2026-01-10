import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, TrendingDown, Minus, Plus, DollarSign } from 'lucide-react';

interface StrategicGoal {
    id: number;
    name: string;
    category: 'revenue' | 'health' | 'content' | 'learning';
    target: number;
    current: number;
    progress: number;
    trend: 'up' | 'down' | 'flat';
    unit: string;
    targetDollars: number | null;
    timeframe: string | null;
    notes: string | null;
}

export default function GoalAlignmentWidget() {
    const [goals, setGoals] = useState<StrategicGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<number | null>(null);

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            const response = await window.axios.get('/api/strategic-goals');
            setGoals(response.data.goals);
        } catch (error) {
            console.error('Failed to fetch strategic goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleIncrement = async (goalId: number, amount: number = 1) => {
        setUpdating(goalId);
        try {
            const response = await window.axios.post(`/api/strategic-goals/${goalId}/increment`, {
                amount,
            });
            setGoals(prev => prev.map(g =>
                g.id === goalId ? response.data.goal : g
            ));
        } catch (error) {
            console.error('Failed to increment goal:', error);
        } finally {
            setUpdating(null);
        }
    };

    const getCategoryColor = (category: StrategicGoal['category']) => {
        switch (category) {
            case 'revenue':
                return 'bg-emerald-500/40';
            case 'content':
                return 'bg-blue-500/40';
            case 'health':
                return 'bg-rose-500/35';
            case 'learning':
                return 'bg-purple-500/35';
            default:
                return 'bg-white/30';
        }
    };

    const getTrendIcon = (trend: StrategicGoal['trend']) => {
        switch (trend) {
            case 'up':
                return <TrendingUp size={12} className="text-emerald-500/50" />;
            case 'down':
                return <TrendingDown size={12} className="text-red-500/40" />;
            default:
                return <Minus size={12} className="text-white/25" />;
        }
    };

    const formatDollars = (amount: number) => {
        if (amount >= 1000) {
            return `$${(amount / 1000).toFixed(0)}K`;
        }
        return `$${amount}`;
    };

    if (loading) {
        return (
            <div className="stealth-card p-6 animate-pulse">
                <div className="h-4 bg-white/5 rounded w-1/3 mb-6"></div>
                <div className="space-y-4">
                    <div className="h-12 bg-white/5 rounded"></div>
                    <div className="h-12 bg-white/5 rounded"></div>
                </div>
            </div>
        );
    }

    if (goals.length === 0) {
        return (
            <div className="stealth-card p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                    <Target className="text-white/30" size={16} />
                    <h3 className="font-mono text-[11px] text-white/50 tracking-widest uppercase">
                        Strategic Goals
                    </h3>
                </div>
                <div className="p-4 text-center text-white/25 font-mono text-xs border border-dashed border-white/10 rounded-[2px]">
                    No strategic goals set
                </div>
            </div>
        );
    }

    return (
        <div className="stealth-card p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <Target className="text-white/30" size={16} />
                    <h3 className="font-mono text-[11px] text-white/50 tracking-widest uppercase">
                        Strategic Goals
                    </h3>
                </div>
                {goals.some(g => g.targetDollars) && (
                    <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-500/50">
                        <DollarSign size={10} />
                        {formatDollars(goals.reduce((sum, g) => sum + (g.targetDollars || 0), 0))} target
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {goals.map((goal) => (
                    <div key={goal.id} className="group">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getCategoryColor(goal.category)}`}></div>
                                    <span className="text-sm font-medium text-white/80 truncate">
                                        {goal.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <span className="text-[10px] font-mono text-white/40">
                                        {goal.current}/{goal.target} {goal.unit}
                                    </span>
                                    {goal.targetDollars && (
                                        <span className="text-[10px] font-mono text-emerald-500/40">
                                            {formatDollars(goal.targetDollars)}
                                        </span>
                                    )}
                                    {goal.timeframe && (
                                        <span className="text-[10px] font-mono text-white/25">
                                            {goal.timeframe}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={() => handleIncrement(goal.id, 1)}
                                    disabled={updating === goal.id}
                                    className="p-1 text-white/20 hover:text-white/50 hover:bg-white/5 rounded transition-colors disabled:opacity-50"
                                    title={`Add 1 ${goal.unit}`}
                                >
                                    <Plus size={14} />
                                </button>
                                <span className="text-xs font-mono font-bold text-white/60 min-w-[2.5rem] text-right">
                                    {goal.progress}%
                                </span>
                                {getTrendIcon(goal.trend)}
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-white/10 rounded-sm overflow-hidden ml-4">
                            <div
                                className={`h-full transition-all duration-500 ease-out ${getCategoryColor(goal.category)}`}
                                style={{ width: `${Math.min(goal.progress, 100)}%` }}
                            ></div>
                        </div>

                        {/* Notes */}
                        {goal.notes && (
                            <div className="mt-1.5 ml-4 text-[10px] font-mono text-white/25">
                                {goal.notes}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

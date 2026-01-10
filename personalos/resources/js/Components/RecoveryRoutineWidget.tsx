import React, { useState, useEffect } from 'react';
import { Activity, Brain, Check, Flame } from 'lucide-react';

interface RecoveryItem {
    left_brain_am: boolean;
    left_brain_pm: boolean;
    scapular_squeezes: number;
    rear_deltoid: boolean;
    bicep_tricep_reset: boolean;
    tricep_extension: boolean;
    chin_darts: boolean;
    pec_lat_massage: boolean;
}

interface RecoveryStatus {
    date: string;
    items: RecoveryItem;
    completion: {
        completed: number;
        total: number;
        percentage: number;
        is_complete: boolean;
    };
    weekly: {
        days_completed: number;
        total_days: number;
        avg_completion: number;
        streak: number;
    };
}

export default function RecoveryRoutineWidget() {
    const [status, setStatus] = useState<RecoveryStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const response = await window.axios.get('/api/recovery/status');
            setStatus(response.data);
        } catch (error) {
            console.error('Failed to fetch recovery status:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleItem = async (item: keyof RecoveryItem) => {
        if (!status || item === 'scapular_squeezes') return;

        setUpdating(item);
        try {
            const newValue = !status.items[item];
            await window.axios.post('/api/recovery/log', {
                item,
                value: newValue
            });
            await fetchStatus();
        } catch (error) {
            console.error('Failed to update item:', error);
        } finally {
            setUpdating(null);
        }
    };

    const incrementScaps = async (amount: number) => {
        setUpdating('scapular_squeezes');
        try {
            await window.axios.post('/api/recovery/scaps', { count: amount });
            await fetchStatus();
        } catch (error) {
            console.error('Failed to update scaps:', error);
        } finally {
            setUpdating(null);
        }
    };

    if (loading) {
        return (
            <div className="stealth-card p-4 animate-pulse">
                <div className="h-4 bg-white/5 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-white/5 rounded w-1/3"></div>
            </div>
        );
    }

    if (!status) {
        return (
            <div className="stealth-card p-4">
                <div className="text-center py-4">
                    <Activity size={24} className="mx-auto mb-2 text-white/20" />
                    <p className="text-xs text-white/40">Recovery tracking unavailable</p>
                </div>
            </div>
        );
    }

    const { items, completion, weekly } = status;
    const scapsProgress = Math.min(100, (items.scapular_squeezes / 100) * 100);
    const scapsDone = items.scapular_squeezes >= 80;

    return (
        <div className="stealth-card">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Activity size={14} className="text-white/30" />
                    <span className="text-[11px] font-mono text-white/50 tracking-widest uppercase">
                        Recovery Protocol
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {weekly.streak > 0 && (
                        <div className="flex items-center gap-1.5 text-amber-500/60">
                            <Flame size={10} />
                            <span className="text-[10px] font-mono">{weekly.streak}d</span>
                        </div>
                    )}
                    <span className={`text-xs font-mono ${completion.is_complete ? 'text-emerald-500/70' : 'text-white/40'}`}>
                        {completion.completed}/{completion.total}
                    </span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="px-4 py-2">
                <div className="w-full h-1 bg-white/10 rounded-sm overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ease-out ${completion.is_complete ? 'bg-emerald-500/50' : 'bg-white/30'}`}
                        style={{ width: `${completion.percentage}%` }}
                    />
                </div>
            </div>

            {/* Items */}
            <div className="p-4 space-y-4">
                {/* Left Brain Section */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[9px] font-mono text-white/25 tracking-wider uppercase">
                        <Brain size={10} />
                        Neurological (5 min 2x/day)
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => toggleItem('left_brain_am')}
                            disabled={updating === 'left_brain_am'}
                            className={`flex items-center gap-2 px-3 py-2 rounded-[2px] border transition-all ${
                                items.left_brain_am
                                    ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500/70'
                                    : 'border-white/10 bg-transparent text-white/40 hover:border-white/15 hover:text-white/50'
                            } ${updating === 'left_brain_am' ? 'opacity-50' : ''}`}
                        >
                            <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${
                                items.left_brain_am ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/20'
                            }`}>
                                {items.left_brain_am && <Check size={10} strokeWidth={3} />}
                            </div>
                            <span className="text-[10px] font-mono tracking-wide">AM</span>
                        </button>
                        <button
                            onClick={() => toggleItem('left_brain_pm')}
                            disabled={updating === 'left_brain_pm'}
                            className={`flex items-center gap-2 px-3 py-2 rounded-[2px] border transition-all ${
                                items.left_brain_pm
                                    ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500/70'
                                    : 'border-white/10 bg-transparent text-white/40 hover:border-white/15 hover:text-white/50'
                            } ${updating === 'left_brain_pm' ? 'opacity-50' : ''}`}
                        >
                            <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${
                                items.left_brain_pm ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/20'
                            }`}>
                                {items.left_brain_pm && <Check size={10} strokeWidth={3} />}
                            </div>
                            <span className="text-[10px] font-mono tracking-wide">PM</span>
                        </button>
                    </div>
                </div>

                {/* Scapular Squeezes - Special counter */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-white/35 tracking-wide uppercase">Scapular Squeezes</span>
                        <span className={`text-[10px] font-mono ${scapsDone ? 'text-emerald-500/70' : 'text-white/40'}`}>
                            {items.scapular_squeezes}/100
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-1 bg-white/10 rounded-sm overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ${scapsDone ? 'bg-emerald-500/50' : 'bg-white/25'}`}
                                style={{ width: `${scapsProgress}%` }}
                            />
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => incrementScaps(10)}
                                disabled={updating === 'scapular_squeezes'}
                                className="px-2 py-1 text-[9px] font-mono text-white/35 border border-white/10 rounded-[2px] hover:border-white/15 hover:text-white/50 transition-all"
                            >
                                +10
                            </button>
                            <button
                                onClick={() => incrementScaps(20)}
                                disabled={updating === 'scapular_squeezes'}
                                className="px-2 py-1 text-[9px] font-mono text-white/35 border border-white/10 rounded-[2px] hover:border-white/15 hover:text-white/50 transition-all"
                            >
                                +20
                            </button>
                        </div>
                    </div>
                </div>

                {/* Other exercises */}
                <div className="space-y-2">
                    <div className="text-[9px] font-mono text-white/25 tracking-wider uppercase">
                        Posterior Chain
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { key: 'rear_deltoid', label: 'Rear Delt' },
                            { key: 'bicep_tricep_reset', label: 'Bi/Tri Reset' },
                            { key: 'tricep_extension', label: 'Tri Extension' },
                            { key: 'chin_darts', label: 'Chin Darts' },
                            { key: 'pec_lat_massage', label: 'Massage' },
                        ].map(({ key, label }) => {
                            const isComplete = items[key as keyof RecoveryItem] as boolean;
                            return (
                                <button
                                    key={key}
                                    onClick={() => toggleItem(key as keyof RecoveryItem)}
                                    disabled={updating === key}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-[2px] border transition-all ${
                                        isComplete
                                            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500/70'
                                            : 'border-white/10 bg-transparent text-white/40 hover:border-white/15 hover:text-white/50'
                                    } ${updating === key ? 'opacity-50' : ''}`}
                                >
                                    <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${
                                        isComplete ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/20'
                                    }`}>
                                        {isComplete && <Check size={10} strokeWidth={3} />}
                                    </div>
                                    <span className="text-[10px] font-mono tracking-wide">{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Weekly stats */}
                <div className="pt-3 border-t border-white/5">
                    <div className="flex justify-between text-[9px] font-mono text-white/25 tracking-wide">
                        <span>Week: {weekly.days_completed}/{weekly.total_days} days</span>
                        <span>{weekly.avg_completion}% avg</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { usePage, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { TrainingSession, TrainingStats, User } from '@/types';
import { Plus, Dumbbell, Clock, Flame, Calendar, X, Check, Copy } from 'lucide-react';

interface TrainingData {
    sessions: TrainingSession[];
    stats: TrainingStats;
    types: Record<string, string>;
    intensities: string[];
}

interface Props {
    auth: {
        user: User;
    };
}

const TRAINING_TYPES: Record<string, { label: string; color: string; icon: string }> = {
    bjj: { label: 'BJJ', color: 'bg-purple-500', icon: '🥋' },
    muay_thai: { label: 'Muay Thai', color: 'bg-red-500', icon: '🥊' },
    wrestling: { label: 'Wrestling', color: 'bg-blue-500', icon: '🤼' },
    strength: { label: 'Strength', color: 'bg-amber-500', icon: '🏋️' },
    cardio: { label: 'Cardio', color: 'bg-green-500', icon: '🏃' },
    yoga: { label: 'Yoga/Mobility', color: 'bg-cyan-500', icon: '🧘' },
    other: { label: 'Other', color: 'bg-gray-500', icon: '💪' },
};

export default function Training({ auth }: Props) {
    const [data, setData] = useState<TrainingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        type: 'bjj',
        date: new Date().toISOString().split('T')[0],
        duration_minutes: 60,
        intensity: 'moderate' as 'light' | 'moderate' | 'hard',
        notes: '',
        energy_before: 5,
        energy_after: 5,
    });

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const response = await window.axios.get('/api/training');
            setData(response.data);
        } catch (error) {
            console.error('Failed to fetch training sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            await window.axios.post('/api/training', formData);
            setShowForm(false);
            setFormData({
                type: 'bjj',
                date: new Date().toISOString().split('T')[0],
                duration_minutes: 60,
                intensity: 'moderate',
                notes: '',
                energy_before: 5,
                energy_after: 5,
            });
            fetchSessions();
        } catch (error) {
            console.error('Failed to save session:', error);
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const getIntensityColor = (intensity: string | null) => {
        switch (intensity) {
            case 'light': return 'text-green-400 bg-green-500/10';
            case 'moderate': return 'text-amber-400 bg-amber-500/10';
            case 'hard': return 'text-red-400 bg-red-500/10';
            default: return 'text-white/40 bg-white/5';
        }
    };

    const handleDuplicate = (session: any) => {
        setFormData({
            type: session.type || 'bjj',
            date: new Date().toISOString().split('T')[0], // Use today's date
            duration_minutes: session.duration_minutes || 60,
            intensity: session.intensity || 'moderate',
            notes: '', // Clear notes for new session
            energy_before: session.energy_before || 5,
            energy_after: session.energy_after || 5,
        });
        setShowForm(true);
    };

    return (
        <AppLayout user={auth.user}>
            <Head title="Training Log" />
            <div className="max-w-4xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold font-display text-black dark:text-white tracking-wide">
                            TRAINING LOG
                        </h1>
                        <p className="text-sm text-black/50 dark:text-white/50 mt-1">
                            Track your martial arts and fitness sessions
                        </p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded transition-colors"
                    >
                        <Plus size={16} />
                        Log Session
                    </button>
                </div>

                {/* Stats */}
                {data && (
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="stealth-card p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar size={14} className="text-purple-400" />
                                <span className="text-[10px] font-mono text-black/40 dark:text-white/40">THIS WEEK</span>
                            </div>
                            <div className="text-2xl font-bold text-black dark:text-white">{data.stats.this_week}</div>
                            <div className="text-xs text-black/50 dark:text-white/50">sessions</div>
                        </div>
                        <div className="stealth-card p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Dumbbell size={14} className="text-amber-400" />
                                <span className="text-[10px] font-mono text-black/40 dark:text-white/40">THIS MONTH</span>
                            </div>
                            <div className="text-2xl font-bold text-black dark:text-white">{data.stats.this_month}</div>
                            <div className="text-xs text-black/50 dark:text-white/50">sessions</div>
                        </div>
                        <div className="stealth-card p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock size={14} className="text-emerald-400" />
                                <span className="text-[10px] font-mono text-black/40 dark:text-white/40">TOTAL TIME</span>
                            </div>
                            <div className="text-2xl font-bold text-black dark:text-white">
                                {Math.round((data.stats.total_minutes_month || 0) / 60)}h
                            </div>
                            <div className="text-xs text-black/50 dark:text-white/50">this month</div>
                        </div>
                    </div>
                )}

                {/* Session List */}
                <div className="stealth-card">
                    <div className="p-4 border-b border-black/5 dark:border-white/5">
                        <h2 className="font-bold font-display text-sm text-black dark:text-white tracking-wide">
                            RECENT SESSIONS
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-black/40 dark:text-white/40">
                            Loading...
                        </div>
                    ) : data?.sessions.length === 0 ? (
                        <div className="p-8 text-center">
                            <Dumbbell size={32} className="mx-auto mb-3 text-black/20 dark:text-white/20" />
                            <p className="text-black/40 dark:text-white/40 text-sm">No training sessions yet</p>
                            <p className="text-black/30 dark:text-white/30 text-xs mt-1">Click "Log Session" to record your first workout</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-black/5 dark:divide-white/5">
                            {data?.sessions.map((session) => {
                                const typeInfo = TRAINING_TYPES[session.type] || TRAINING_TYPES.other;
                                return (
                                    <div key={session.id} className="p-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded ${typeInfo.color} flex items-center justify-center text-lg`}>
                                                {typeInfo.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-black dark:text-white text-sm">
                                                        {typeInfo.label}
                                                    </span>
                                                    {session.intensity && (
                                                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${getIntensityColor(session.intensity)}`}>
                                                            {session.intensity.toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-black/50 dark:text-white/50">
                                                    <span>{formatDate(session.date)}</span>
                                                    {session.duration_minutes && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={10} />
                                                            {session.duration_minutes} min
                                                        </span>
                                                    )}
                                                    {session.energy_after && session.energy_before && (
                                                        <span className="flex items-center gap-1">
                                                            <Flame size={10} />
                                                            {session.energy_before} → {session.energy_after}
                                                        </span>
                                                    )}
                                                </div>
                                                {session.notes && (
                                                    <p className="mt-2 text-xs text-black/60 dark:text-white/60 line-clamp-2">
                                                        {session.notes}
                                                    </p>
                                                )}
                                            </div>
                                            {/* Duplicate button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDuplicate(session);
                                                }}
                                                className="p-2 text-black/30 dark:text-white/30 hover:text-emerald-500 hover:bg-emerald-500/10 rounded transition-colors"
                                                title="Duplicate this session"
                                            >
                                                <Copy size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Log Session Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="stealth-card w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5">
                            <h3 className="font-bold font-display text-sm text-black dark:text-white tracking-wide">
                                LOG TRAINING SESSION
                            </h3>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
                            >
                                <X size={16} className="text-black/50 dark:text-white/50" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            {/* Type Selection */}
                            <div>
                                <label className="block text-xs font-mono text-black/50 dark:text-white/50 mb-2">TYPE</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {Object.entries(TRAINING_TYPES).map(([key, info]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: key })}
                                            className={`p-2 rounded text-center transition-colors ${
                                                formData.type === key
                                                    ? 'bg-emerald-500/20 border border-emerald-500/50'
                                                    : 'bg-black/5 dark:bg-white/5 border border-transparent hover:border-black/10 dark:hover:border-white/10'
                                            }`}
                                        >
                                            <div className="text-lg">{info.icon}</div>
                                            <div className="text-[10px] text-black/60 dark:text-white/60 mt-1">{info.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-xs font-mono text-black/50 dark:text-white/50 mb-2">DATE</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded text-sm text-black dark:text-white"
                                />
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="block text-xs font-mono text-black/50 dark:text-white/50 mb-2">
                                    DURATION (minutes)
                                </label>
                                <input
                                    type="number"
                                    value={formData.duration_minutes}
                                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded text-sm text-black dark:text-white"
                                    min="1"
                                    max="480"
                                />
                            </div>

                            {/* Intensity */}
                            <div>
                                <label className="block text-xs font-mono text-black/50 dark:text-white/50 mb-2">INTENSITY</label>
                                <div className="flex gap-2">
                                    {(['light', 'moderate', 'hard'] as const).map((intensity) => (
                                        <button
                                            key={intensity}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, intensity })}
                                            className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-colors ${
                                                formData.intensity === intensity
                                                    ? getIntensityColor(intensity) + ' border border-current'
                                                    : 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10'
                                            }`}
                                        >
                                            {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Energy Levels */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-mono text-black/50 dark:text-white/50 mb-2">
                                        ENERGY BEFORE (1-10)
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={formData.energy_before}
                                        onChange={(e) => setFormData({ ...formData, energy_before: parseInt(e.target.value) })}
                                        className="w-full"
                                    />
                                    <div className="text-center text-sm font-mono text-black dark:text-white">
                                        {formData.energy_before}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-black/50 dark:text-white/50 mb-2">
                                        ENERGY AFTER (1-10)
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={formData.energy_after}
                                        onChange={(e) => setFormData({ ...formData, energy_after: parseInt(e.target.value) })}
                                        className="w-full"
                                    />
                                    <div className="text-center text-sm font-mono text-black dark:text-white">
                                        {formData.energy_after}
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-mono text-black/50 dark:text-white/50 mb-2">NOTES</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                    placeholder="Techniques practiced, sparring notes, how you felt..."
                                    className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded text-sm text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 resize-none"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium rounded transition-colors flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    'Saving...'
                                ) : (
                                    <>
                                        <Check size={16} />
                                        Log Session
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

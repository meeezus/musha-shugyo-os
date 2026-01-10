import React, { useState, useEffect } from 'react';
import { usePage, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { User } from '@/types';
import { Plus, Sparkles, BookOpen, Brain, Clock, Calendar, X, Check, Flame, Zap } from 'lucide-react';

interface SparkfileEntry {
    id: number;
    type: 'meditation' | 'journal' | 'spark';
    title: string | null;
    content: string | null;
    date: string;
    duration_minutes: number | null;
    mood_before: number | null;
    mood_after: number | null;
    meditation_type: string | null;
    tags: string[] | null;
    created_at: string;
}

interface SparkfileStats {
    meditation_this_week: number;
    meditation_this_month: number;
    meditation_minutes_month: number;
    total_meditation_hours: number;
    meditation_streak: number;
    journal_count: number;
    spark_count: number;
}

interface SparkfileData {
    entries: SparkfileEntry[];
    stats: SparkfileStats;
    types: Record<string, string>;
    meditation_types: Record<string, string>;
}

interface Props {
    auth: {
        user: User;
    };
}

const ENTRY_TYPES: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
    meditation: {
        label: 'Meditation',
        color: 'bg-purple-500',
        icon: <Brain size={16} />,
        description: 'Log a Waking Up session'
    },
    journal: {
        label: 'Journal',
        color: 'bg-blue-500',
        icon: <BookOpen size={16} />,
        description: 'Reflect on your day'
    },
    spark: {
        label: 'Spark',
        color: 'bg-amber-500',
        icon: <Zap size={16} />,
        description: 'Capture an idea'
    },
};

const MEDITATION_TYPES: Record<string, { label: string; icon: string }> = {
    daily: { label: 'Daily Meditation', icon: '🧘' },
    theory: { label: 'Theory', icon: '📖' },
    conversation: { label: 'Conversation', icon: '💬' },
    moment: { label: 'Moment', icon: '⚡' },
    practice: { label: 'Practice', icon: '🎯' },
    sleep: { label: 'Sleep', icon: '🌙' },
    other: { label: 'Other', icon: '✨' },
};

export default function Sparkfile({ auth }: Props) {
    const [data, setData] = useState<SparkfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'meditation' | 'journal' | 'spark'>('all');

    // Form state
    const [formData, setFormData] = useState({
        type: 'meditation' as 'meditation' | 'journal' | 'spark',
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
        duration_minutes: 10,
        mood_before: 5,
        mood_after: 5,
        meditation_type: 'daily',
    });

    useEffect(() => {
        fetchEntries();
    }, []);

    const fetchEntries = async () => {
        try {
            const response = await window.axios.get('/api/sparkfile');
            setData(response.data);
        } catch (error) {
            console.error('Failed to fetch sparkfile entries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload: any = {
                type: formData.type,
                date: formData.date,
            };

            if (formData.type === 'meditation') {
                payload.duration_minutes = formData.duration_minutes;
                payload.mood_before = formData.mood_before;
                payload.mood_after = formData.mood_after;
                payload.meditation_type = formData.meditation_type;
                if (formData.content) payload.content = formData.content;
            } else {
                if (formData.title) payload.title = formData.title;
                payload.content = formData.content;
            }

            await window.axios.post('/api/sparkfile', payload);
            setShowForm(false);
            setFormData({
                type: 'meditation',
                title: '',
                content: '',
                date: new Date().toISOString().split('T')[0],
                duration_minutes: 10,
                mood_before: 5,
                mood_after: 5,
                meditation_type: 'daily',
            });
            fetchEntries();
        } catch (error) {
            console.error('Failed to save entry:', error);
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

    const filteredEntries = data?.entries.filter(entry =>
        activeFilter === 'all' || entry.type === activeFilter
    ) || [];

    return (
        <AppLayout user={auth.user}>
            <Head title="Sparkfile" />
            <div className="max-w-4xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold font-display text-black dark:text-white tracking-wide flex items-center gap-3">
                            <Sparkles className="text-purple-400" size={24} />
                            SPARKFILE
                        </h1>
                        <p className="text-sm text-black/50 dark:text-white/50 mt-1">
                            Meditation practice, reflections & ideas
                        </p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded transition-colors"
                    >
                        <Plus size={16} />
                        New Entry
                    </button>
                </div>

                {/* Stats */}
                {data && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="stealth-card p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Flame size={14} className="text-orange-400" />
                                <span className="text-[10px] font-mono text-black/40 dark:text-white/40">STREAK</span>
                            </div>
                            <div className="text-2xl font-bold text-black dark:text-white">{data.stats.meditation_streak}</div>
                            <div className="text-xs text-black/50 dark:text-white/50">days</div>
                        </div>
                        <div className="stealth-card p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Brain size={14} className="text-purple-400" />
                                <span className="text-[10px] font-mono text-black/40 dark:text-white/40">THIS WEEK</span>
                            </div>
                            <div className="text-2xl font-bold text-black dark:text-white">{data.stats.meditation_this_week}</div>
                            <div className="text-xs text-black/50 dark:text-white/50">sessions</div>
                        </div>
                        <div className="stealth-card p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock size={14} className="text-emerald-400" />
                                <span className="text-[10px] font-mono text-black/40 dark:text-white/40">TOTAL TIME</span>
                            </div>
                            <div className="text-2xl font-bold text-black dark:text-white">
                                {data.stats.total_meditation_hours}h
                            </div>
                            <div className="text-xs text-black/50 dark:text-white/50">all time</div>
                        </div>
                        <div className="stealth-card p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <BookOpen size={14} className="text-blue-400" />
                                <span className="text-[10px] font-mono text-black/40 dark:text-white/40">ENTRIES</span>
                            </div>
                            <div className="text-2xl font-bold text-black dark:text-white">
                                {data.stats.journal_count + data.stats.spark_count}
                            </div>
                            <div className="text-xs text-black/50 dark:text-white/50">journals + sparks</div>
                        </div>
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    {(['all', 'meditation', 'journal', 'spark'] as const).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-2 text-xs font-mono rounded transition-colors ${
                                activeFilter === filter
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                    : 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10'
                            }`}
                        >
                            {filter.toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* Entry List */}
                <div className="stealth-card">
                    <div className="p-4 border-b border-black/5 dark:border-white/5">
                        <h2 className="font-bold font-display text-sm text-black dark:text-white tracking-wide">
                            RECENT ENTRIES
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-black/40 dark:text-white/40">
                            Loading...
                        </div>
                    ) : filteredEntries.length === 0 ? (
                        <div className="p-8 text-center">
                            <Sparkles size={32} className="mx-auto mb-3 text-black/20 dark:text-white/20" />
                            <p className="text-black/40 dark:text-white/40 text-sm">No entries yet</p>
                            <p className="text-black/30 dark:text-white/30 text-xs mt-1">Click "New Entry" to start tracking</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-black/5 dark:divide-white/5">
                            {filteredEntries.map((entry) => {
                                const typeInfo = ENTRY_TYPES[entry.type];
                                const medType = entry.meditation_type ? MEDITATION_TYPES[entry.meditation_type] : null;
                                return (
                                    <div key={entry.id} className="p-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded ${typeInfo.color} flex items-center justify-center text-white`}>
                                                {entry.type === 'meditation' && medType ? (
                                                    <span className="text-lg">{medType.icon}</span>
                                                ) : (
                                                    typeInfo.icon
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-black dark:text-white text-sm">
                                                        {entry.type === 'meditation'
                                                            ? (medType?.label || 'Meditation')
                                                            : (entry.title || typeInfo.label)}
                                                    </span>
                                                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                                        entry.type === 'meditation' ? 'text-purple-400 bg-purple-500/10' :
                                                        entry.type === 'journal' ? 'text-blue-400 bg-blue-500/10' :
                                                        'text-amber-400 bg-amber-500/10'
                                                    }`}>
                                                        {entry.type.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-black/50 dark:text-white/50">
                                                    <span>{formatDate(entry.date)}</span>
                                                    {entry.duration_minutes && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={10} />
                                                            {entry.duration_minutes} min
                                                        </span>
                                                    )}
                                                    {entry.mood_after && entry.mood_before && (
                                                        <span className="flex items-center gap-1">
                                                            <Flame size={10} />
                                                            {entry.mood_before} → {entry.mood_after}
                                                        </span>
                                                    )}
                                                </div>
                                                {entry.content && (
                                                    <p className="mt-2 text-xs text-black/60 dark:text-white/60 line-clamp-2">
                                                        {entry.content}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* New Entry Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="stealth-card w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5">
                            <h3 className="font-bold font-display text-sm text-black dark:text-white tracking-wide">
                                NEW ENTRY
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
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(ENTRY_TYPES).map(([key, info]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: key as any })}
                                            className={`p-3 rounded text-center transition-colors ${
                                                formData.type === key
                                                    ? 'bg-purple-500/20 border border-purple-500/50'
                                                    : 'bg-black/5 dark:bg-white/5 border border-transparent hover:border-black/10 dark:hover:border-white/10'
                                            }`}
                                        >
                                            <div className={`${info.color} w-8 h-8 rounded mx-auto mb-2 flex items-center justify-center text-white`}>
                                                {info.icon}
                                            </div>
                                            <div className="text-xs text-black/80 dark:text-white/80 font-medium">{info.label}</div>
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

                            {/* Meditation-specific fields */}
                            {formData.type === 'meditation' && (
                                <>
                                    {/* Meditation Type */}
                                    <div>
                                        <label className="block text-xs font-mono text-black/50 dark:text-white/50 mb-2">MEDITATION TYPE</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {Object.entries(MEDITATION_TYPES).map(([key, info]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, meditation_type: key })}
                                                    className={`p-2 rounded text-center transition-colors ${
                                                        formData.meditation_type === key
                                                            ? 'bg-purple-500/20 border border-purple-500/50'
                                                            : 'bg-black/5 dark:bg-white/5 border border-transparent hover:border-black/10 dark:hover:border-white/10'
                                                    }`}
                                                >
                                                    <div className="text-lg">{info.icon}</div>
                                                    <div className="text-[9px] text-black/60 dark:text-white/60 mt-1 truncate">{info.label}</div>
                                                </button>
                                            ))}
                                        </div>
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
                                            max="180"
                                        />
                                    </div>

                                    {/* Mood Levels */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-mono text-black/50 dark:text-white/50 mb-2">
                                                MOOD BEFORE (1-10)
                                            </label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="10"
                                                value={formData.mood_before}
                                                onChange={(e) => setFormData({ ...formData, mood_before: parseInt(e.target.value) })}
                                                className="w-full"
                                            />
                                            <div className="text-center text-sm font-mono text-black dark:text-white">
                                                {formData.mood_before}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-mono text-black/50 dark:text-white/50 mb-2">
                                                MOOD AFTER (1-10)
                                            </label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="10"
                                                value={formData.mood_after}
                                                onChange={(e) => setFormData({ ...formData, mood_after: parseInt(e.target.value) })}
                                                className="w-full"
                                            />
                                            <div className="text-center text-sm font-mono text-black dark:text-white">
                                                {formData.mood_after}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Title (for journal/spark) */}
                            {formData.type !== 'meditation' && (
                                <div>
                                    <label className="block text-xs font-mono text-black/50 dark:text-white/50 mb-2">
                                        TITLE (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder={formData.type === 'journal' ? 'Today\'s reflection...' : 'Quick idea...'}
                                        className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded text-sm text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30"
                                    />
                                </div>
                            )}

                            {/* Content/Notes */}
                            <div>
                                <label className="block text-xs font-mono text-black/50 dark:text-white/50 mb-2">
                                    {formData.type === 'meditation' ? 'NOTES (optional)' : 'CONTENT'}
                                </label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    rows={formData.type === 'meditation' ? 2 : 4}
                                    placeholder={
                                        formData.type === 'meditation' ? 'Any insights or observations...' :
                                        formData.type === 'journal' ? 'What\'s on your mind?' :
                                        'Capture your idea...'
                                    }
                                    className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded text-sm text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 resize-none"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-medium rounded transition-colors flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    'Saving...'
                                ) : (
                                    <>
                                        <Check size={16} />
                                        Save Entry
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

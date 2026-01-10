import React, { useState, useEffect } from 'react';
import { usePage, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import IoriTerminal from '@/Components/IoriTerminal';
import { User, ContentDraft, ContentRalphStats } from '@/types';
import {
    Feather,
    Terminal,
    Download,
    Copy,
    Check,
    Send,
    Trash2,
    ChevronDown,
    ChevronUp,
    Zap,
    Sword,
    Brain,
    Edit3,
    X,
    Info
} from 'lucide-react';

interface ContentRalphData {
    drafts: ContentDraft[];
    stats: ContentRalphStats;
    types: Record<string, string>;
    pillars: Record<string, string>;
    statuses: Record<string, string>;
}

interface Props {
    auth: {
        user: User;
    };
}

const PILLAR_INFO: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    'automation': {
        label: 'Automation',
        color: 'bg-emerald-500',
        icon: <Zap size={14} />
    },
    'martial-arts': {
        label: 'Martial Arts',
        color: 'bg-amber-500',
        icon: <Sword size={14} />
    },
    'consciousness': {
        label: 'Consciousness',
        color: 'bg-purple-500',
        icon: <Brain size={14} />
    },
};

const STATUS_INFO: Record<string, { label: string; color: string }> = {
    'draft': { label: 'Draft', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    'ready': { label: 'Ready', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    'posted': { label: 'Posted', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
};

const ARCHETYPE_INFO: Record<string, { name: string; score: string; description: string; traits: string[]; examples: string[] }> = {
    'Quiet Devastator': {
        name: 'Quiet Devastator',
        score: '9.1/10 avg engagement',
        description: 'Minimal words, maximum impact. No explaining. Just truth bombs that land and leave.',
        traits: [
            'Short, punchy statements',
            'Zero fluff or padding',
            'Lets the reader do the work',
            'Ends with "effortless."',
        ],
        examples: [
            'meditation works.',
            'The warrior doesn\'t force his strength. He removes what blocks it.',
        ],
    },
    'Patient Observer': {
        name: 'Patient Observer',
        score: '8.6/10 avg engagement',
        description: 'Teach through process. Show the work. Methodical breakdown that builds trust.',
        traits: [
            'Step-by-step breakdowns',
            'Real numbers and specifics',
            'Actionable how-tos',
            'Evidence-based claims',
        ],
        examples: [
            'How to automate cold outreach: research → extract pain points → generate email → send',
            '90 emails in 2 hours. No templates. Every one personalized.',
        ],
    },
    'Dramatic Prophet': {
        name: 'Dramatic Prophet',
        score: '7.5/10 avg engagement',
        description: 'Bold claims. Controversial takes. Stakes feel cosmic. Use sparingly.',
        traits: [
            'Big, sweeping statements',
            'Contrarian positioning',
            'Future predictions',
            'Higher risk, higher reward',
        ],
        examples: [
            'Most people will be unemployable in 5 years.',
            'Your business doesn\'t have a lead problem. It has a systems problem.',
        ],
    },
};

export default function ContentRalph({ auth }: Props) {
    const [data, setData] = useState<ContentRalphData | null>(null);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'draft' | 'ready' | 'posted'>('all');
    const [showTerminal, setShowTerminal] = useState(false);
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');
    const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);

    useEffect(() => {
        fetchDrafts();
    }, []);

    const fetchDrafts = async () => {
        try {
            const response = await window.axios.get('/api/content-ralph');
            setData(response.data);
        } catch (error) {
            console.error('Failed to fetch drafts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        setImporting(true);
        try {
            const response = await window.axios.post('/api/content-ralph/import');
            alert(response.data.message);
            fetchDrafts();
        } catch (error) {
            console.error('Failed to import drafts:', error);
            alert('Failed to import drafts');
        } finally {
            setImporting(false);
        }
    };

    const handleCopy = async (draft: ContentDraft) => {
        try {
            await navigator.clipboard.writeText(draft.content);
            setCopiedId(draft.id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleMarkReady = async (draft: ContentDraft) => {
        try {
            await window.axios.post(`/api/content-ralph/${draft.id}/ready`);
            fetchDrafts();
        } catch (error) {
            console.error('Failed to mark as ready:', error);
        }
    };

    const handleMarkPosted = async (draft: ContentDraft) => {
        try {
            await window.axios.post(`/api/content-ralph/${draft.id}/posted`);
            fetchDrafts();
        } catch (error) {
            console.error('Failed to mark as posted:', error);
        }
    };

    const handleDelete = async (draft: ContentDraft) => {
        if (!confirm('Delete this draft?')) return;
        try {
            await window.axios.delete(`/api/content-ralph/${draft.id}`);
            fetchDrafts();
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const handleStartEdit = (draft: ContentDraft) => {
        setEditingId(draft.id);
        setEditContent(draft.content);
    };

    const handleSaveEdit = async (draft: ContentDraft) => {
        try {
            await window.axios.put(`/api/content-ralph/${draft.id}`, {
                content: editContent,
            });
            setEditingId(null);
            setEditContent('');
            fetchDrafts();
        } catch (error) {
            console.error('Failed to save:', error);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditContent('');
    };

    const filteredDrafts = data?.drafts.filter(draft =>
        activeFilter === 'all' || draft.status === activeFilter
    ) || [];

    return (
        <AppLayout user={auth.user}>
            <Head title="Content" />
            <div className="max-w-6xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold font-display text-black dark:text-white tracking-wide flex items-center gap-3">
                            <Feather className="text-emerald-400" size={24} />
                            CONTENT
                        </h1>
                        <p className="text-sm text-black/50 dark:text-white/50 mt-1">
                            Generate, edit, and post your content
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowTerminal(!showTerminal)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded transition-colors ${
                                showTerminal
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10'
                            }`}
                        >
                            <Terminal size={16} />
                            {showTerminal ? 'Hide Terminal' : 'Claude Code'}
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={importing}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium rounded transition-colors"
                        >
                            <Download size={16} />
                            {importing ? 'Importing...' : 'Import Drafts'}
                        </button>
                    </div>
                </div>

                {/* Claude Code Terminal (collapsible) */}
                <IoriTerminal isOpen={showTerminal} onClose={() => setShowTerminal(false)} />

                {/* Stats */}
                {data && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="stealth-card p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Feather size={14} className="text-emerald-400" />
                                <span className="text-[10px] font-mono text-black/40 dark:text-white/40">TOTAL</span>
                            </div>
                            <div className="text-2xl font-bold text-black dark:text-white">{data.stats.total}</div>
                            <div className="text-xs text-black/50 dark:text-white/50">drafts</div>
                        </div>
                        <div className="stealth-card p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Edit3 size={14} className="text-amber-400" />
                                <span className="text-[10px] font-mono text-black/40 dark:text-white/40">DRAFTS</span>
                            </div>
                            <div className="text-2xl font-bold text-black dark:text-white">{data.stats.draft_count}</div>
                            <div className="text-xs text-black/50 dark:text-white/50">need review</div>
                        </div>
                        <div className="stealth-card p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Check size={14} className="text-emerald-400" />
                                <span className="text-[10px] font-mono text-black/40 dark:text-white/40">READY</span>
                            </div>
                            <div className="text-2xl font-bold text-black dark:text-white">{data.stats.ready_count}</div>
                            <div className="text-xs text-black/50 dark:text-white/50">to post</div>
                        </div>
                        <div className="stealth-card p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Send size={14} className="text-blue-400" />
                                <span className="text-[10px] font-mono text-black/40 dark:text-white/40">POSTED</span>
                            </div>
                            <div className="text-2xl font-bold text-black dark:text-white">{data.stats.posted_count}</div>
                            <div className="text-xs text-black/50 dark:text-white/50">published</div>
                        </div>
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    {(['all', 'draft', 'ready', 'posted'] as const).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-2 text-xs font-mono rounded transition-colors ${
                                activeFilter === filter
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10'
                            }`}
                        >
                            {filter.toUpperCase()}
                            {data && filter !== 'all' && (
                                <span className="ml-2 opacity-60">
                                    ({filter === 'draft' ? data.stats.draft_count :
                                      filter === 'ready' ? data.stats.ready_count :
                                      data.stats.posted_count})
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Drafts Grid */}
                {loading ? (
                    <div className="stealth-card p-8 text-center text-black/40 dark:text-white/40">
                        Loading...
                    </div>
                ) : filteredDrafts.length === 0 ? (
                    <div className="stealth-card p-8 text-center">
                        <Feather size={32} className="mx-auto mb-3 text-black/20 dark:text-white/20" />
                        <p className="text-black/40 dark:text-white/40 text-sm">No drafts yet</p>
                        <p className="text-black/30 dark:text-white/30 text-xs mt-1">
                            Use Claude Code to generate content, then click "Import Drafts"
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredDrafts.map((draft) => {
                            const pillarInfo = PILLAR_INFO[draft.pillar] || PILLAR_INFO['automation'];
                            const statusInfo = STATUS_INFO[draft.status];
                            const isEditing = editingId === draft.id;

                            return (
                                <div key={draft.id} className="stealth-card overflow-hidden">
                                    {/* Card Header */}
                                    <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-sm font-bold text-black dark:text-white">
                                                {draft.queue_id}
                                            </span>
                                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${statusInfo.color}`}>
                                                {statusInfo.label.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded ${pillarInfo.color} text-white`}>
                                                {pillarInfo.icon}
                                                {pillarInfo.label}
                                            </span>
                                            {draft.effortless_score && (
                                                <span className="text-[10px] font-mono text-black/40 dark:text-white/40">
                                                    {draft.effortless_score}/10
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-4">
                                        {draft.archetype && (
                                            <button
                                                onClick={() => setSelectedArchetype(draft.archetype)}
                                                className="flex items-center gap-1 text-[10px] font-mono text-black/40 dark:text-white/40 mb-2 hover:text-purple-400 transition-colors group"
                                            >
                                                <span>{draft.archetype}</span>
                                                <Info size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        )}

                                        {isEditing ? (
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full h-32 px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded text-sm text-black dark:text-white resize-none font-mono"
                                                autoFocus
                                            />
                                        ) : (
                                            <div className="text-sm text-black/80 dark:text-white/80 whitespace-pre-wrap font-mono leading-relaxed">
                                                {draft.content}
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Footer */}
                                    <div className="p-4 pt-0 flex items-center justify-between">
                                        <div className="text-[10px] text-black/30 dark:text-white/30 font-mono">
                                            {draft.type.toUpperCase()}
                                            {draft.topic && ` - ${draft.topic}`}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="p-2 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
                                                        title="Cancel"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleSaveEdit(draft)}
                                                        className="p-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                                                        title="Save"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleStartEdit(draft)}
                                                        className="p-2 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleCopy(draft)}
                                                        className={`p-2 transition-colors ${
                                                            copiedId === draft.id
                                                                ? 'text-emerald-400'
                                                                : 'text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white'
                                                        }`}
                                                        title={copiedId === draft.id ? 'Copied!' : 'Copy to clipboard'}
                                                    >
                                                        {copiedId === draft.id ? <Check size={14} /> : <Copy size={14} />}
                                                    </button>
                                                    {draft.status === 'draft' && (
                                                        <button
                                                            onClick={() => handleMarkReady(draft)}
                                                            className="p-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                                                            title="Mark as ready"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                    )}
                                                    {draft.status === 'ready' && (
                                                        <button
                                                            onClick={() => handleMarkPosted(draft)}
                                                            className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                                                            title="Mark as posted"
                                                        >
                                                            <Send size={14} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(draft)}
                                                        className="p-2 text-black/40 dark:text-white/40 hover:text-red-400 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Archetype Info Modal */}
            {selectedArchetype && ARCHETYPE_INFO[selectedArchetype] && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="stealth-card w-full max-w-md">
                        <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5">
                            <div>
                                <h3 className="font-bold font-display text-sm text-black dark:text-white tracking-wide">
                                    {ARCHETYPE_INFO[selectedArchetype].name}
                                </h3>
                                <span className="text-[10px] font-mono text-purple-400">
                                    {ARCHETYPE_INFO[selectedArchetype].score}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedArchetype(null)}
                                className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
                            >
                                <X size={16} className="text-black/50 dark:text-white/50" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Description */}
                            <p className="text-sm text-black/70 dark:text-white/70">
                                {ARCHETYPE_INFO[selectedArchetype].description}
                            </p>

                            {/* Traits */}
                            <div>
                                <h4 className="text-[10px] font-mono text-black/40 dark:text-white/40 mb-2">KEY TRAITS</h4>
                                <ul className="space-y-1">
                                    {ARCHETYPE_INFO[selectedArchetype].traits.map((trait, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-xs text-black/60 dark:text-white/60">
                                            <span className="w-1 h-1 rounded-full bg-purple-400"></span>
                                            {trait}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Examples */}
                            <div>
                                <h4 className="text-[10px] font-mono text-black/40 dark:text-white/40 mb-2">EXAMPLES</h4>
                                <div className="space-y-2">
                                    {ARCHETYPE_INFO[selectedArchetype].examples.map((example, idx) => (
                                        <div
                                            key={idx}
                                            className="p-3 bg-black/5 dark:bg-white/5 rounded text-xs text-black/70 dark:text-white/70 font-mono italic"
                                        >
                                            "{example}"
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

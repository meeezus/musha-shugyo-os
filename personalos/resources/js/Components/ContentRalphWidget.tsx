import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { Feather, Edit3, Check, Send, ArrowRight } from 'lucide-react';
import { ContentRalphStats } from '@/types';

export default function ContentRalphWidget() {
    const [stats, setStats] = useState<ContentRalphStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await window.axios.get('/api/content-ralph');
            setStats(response.data.stats);
        } catch (error) {
            console.error('Failed to fetch content ralph stats:', error);
        } finally {
            setLoading(false);
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

    return (
        <div className="stealth-card">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Feather size={16} className="text-white/30" />
                    <span className="font-mono text-[11px] text-white/50 tracking-widest uppercase">
                        Content
                    </span>
                </div>
                <Link
                    href="/content-ralph"
                    className="flex items-center gap-1 text-[10px] font-mono text-white/40 hover:text-white/60 transition-colors"
                >
                    VIEW ALL
                    <ArrowRight size={10} />
                </Link>
            </div>

            {/* Stats */}
            <div className="p-4">
                {stats && stats.total > 0 ? (
                    <div className="space-y-3">
                        {stats.draft_count > 0 && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Edit3 size={14} className="text-amber-500/40" />
                                    <span className="text-sm text-white/50">Need review</span>
                                </div>
                                <span className="font-mono text-sm font-bold text-amber-500/50">
                                    {stats.draft_count}
                                </span>
                            </div>
                        )}
                        {stats.ready_count > 0 && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Check size={14} className="text-emerald-500/50" />
                                    <span className="text-sm text-white/50">Ready to post</span>
                                </div>
                                <span className="font-mono text-sm font-bold text-emerald-500/50">
                                    {stats.ready_count}
                                </span>
                            </div>
                        )}
                        {stats.posted_count > 0 && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Send size={14} className="text-blue-500/40" />
                                    <span className="text-sm text-white/50">Posted</span>
                                </div>
                                <span className="font-mono text-sm font-bold text-blue-500/50">
                                    {stats.posted_count}
                                </span>
                            </div>
                        )}

                        {/* Pillar breakdown */}
                        <div className="pt-3 border-t border-white/5">
                            <div className="text-[10px] font-mono text-white/25 mb-2">BY PILLAR</div>
                            <div className="flex gap-2">
                                <span className="text-[10px] font-mono px-2 py-1 rounded-[2px] bg-white/5 text-white/40 border border-white/10">
                                    Auto: {stats.by_pillar.automation}
                                </span>
                                <span className="text-[10px] font-mono px-2 py-1 rounded-[2px] bg-white/5 text-white/40 border border-white/10">
                                    MA: {stats.by_pillar['martial-arts']}
                                </span>
                                <span className="text-[10px] font-mono px-2 py-1 rounded-[2px] bg-white/5 text-white/40 border border-white/10">
                                    Con: {stats.by_pillar.consciousness}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <Feather size={24} className="mx-auto mb-2 text-white/20" />
                        <p className="text-xs text-white/30">No content yet</p>
                        <Link
                            href="/content-ralph"
                            className="text-xs text-white/40 hover:text-white/60 transition-colors"
                        >
                            Generate your first draft
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

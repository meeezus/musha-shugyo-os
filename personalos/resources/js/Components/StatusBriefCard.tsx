import React from 'react';
import { Zap, AlertTriangle, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { StatusBrief } from '@/types';

interface StatusBriefCardProps {
    brief: StatusBrief | null;
    patterns?: string[];
    generatedAt?: string;
    cached?: boolean;
    cacheAge?: number;
    isLoading?: boolean;
}

export default function StatusBriefCard({
    brief,
    patterns = [],
    generatedAt,
    cached,
    cacheAge,
    isLoading = false,
}: StatusBriefCardProps) {
    if (isLoading) {
        return (
            <div className="stealth-card p-4 md:p-6 mb-6 md:mb-8 relative animate-pulse">
                <div className="absolute top-0 left-0 w-1 h-full bg-white/20"></div>
                <div className="flex items-start gap-3 md:gap-4">
                    <div className="mt-1 p-2 md:p-3 bg-white/5 border border-white/10 rounded-[2px]">
                        <div className="w-4 h-4 md:w-5 md:h-5 bg-white/10 rounded"></div>
                    </div>
                    <div className="flex-1 space-y-3">
                        <div className="h-5 bg-white/10 rounded w-1/3"></div>
                        <div className="h-4 bg-white/5 rounded w-full"></div>
                        <div className="h-4 bg-white/5 rounded w-2/3"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!brief) {
        return (
            <div className="stealth-card p-4 md:p-6 mb-6 md:mb-8 relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/40"></div>
                <div className="flex items-center gap-3 text-amber-500/60">
                    <AlertTriangle size={20} />
                    <span className="font-mono text-sm">No brief available. Click refresh to generate.</span>
                </div>
            </div>
        );
    }

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="stealth-card p-4 md:p-6 mb-6 md:mb-8 relative group">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/40"></div>
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                {/* Left side - Status Brief */}
                <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                    <div className="mt-1 p-2 md:p-3 bg-white/5 border border-white/10 rounded-[2px] text-white/50 flex-shrink-0">
                        <Zap size={16} className="md:w-5 md:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-base md:text-lg font-bold font-display text-white/90 tracking-wide">
                                {brief.headline}
                            </h2>
                            {brief.aiGenerated && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-[2px] text-white/40 text-[10px] font-mono">
                                    <Sparkles size={10} />
                                    AI
                                </span>
                            )}
                            {brief.stale && (
                                <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-[2px] text-amber-500/60 text-[10px] font-mono">
                                    STALE
                                </span>
                            )}
                        </div>
                        <p className="text-white/50 leading-relaxed text-xs md:text-sm max-w-2xl font-light">
                            {brief.overview}
                        </p>
                        <div className="mt-3 md:mt-4 flex items-center gap-4">
                            <div className="text-[10px] md:text-xs font-mono text-white/40 border-l border-white/10 pl-3">
                                DIRECTIVE: {brief.directive}
                            </div>
                            {generatedAt && (
                                <div className="flex items-center gap-1 text-[10px] font-mono text-white/25">
                                    <Clock size={10} />
                                    {cached ? `cached ${cacheAge}s ago` : `generated ${formatTime(generatedAt)}`}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right side - Patterns */}
                {patterns.length > 0 && (
                    <div className="lg:w-80 lg:flex-shrink-0 lg:border-l lg:border-white/5 lg:pl-5">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle size={12} className="text-amber-500/50" />
                            <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Patterns</span>
                        </div>
                        <div className="space-y-1.5">
                            {patterns.slice(0, 3).map((pattern, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-start gap-2 text-[11px] text-white/50 leading-tight"
                                >
                                    <span className="text-amber-500/40 mt-0.5">!</span>
                                    <span className="line-clamp-2">{pattern}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

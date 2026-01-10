import React from 'react';
import { Activity, Moon, Zap, TrendingUp, TrendingDown, Minus, Heart, RefreshCw, AlertTriangle } from 'lucide-react';

interface OuraData {
    date: string;
    readiness_score: number | null;
    sleep_score: number | null;
    activity_score: number | null;
    total_sleep_duration: number | null;
    steps: number | null;
    resting_heart_rate: number | null;
    hrv_average: number | null;
}

interface OuraInsights {
    energyLevel: 'high' | 'medium' | 'low' | 'recovery' | 'unknown';
    recommendedTaskTypes: string[];
    trainingRecommendation: string | null;
    patterns: string[];
    currentData: {
        date: string;
        readiness: number | null;
        sleep: number | null;
        activity: number | null;
        sleepDuration: number | null;
        steps: number | null;
    } | null;
    restMode?: {
        active: boolean;
        startDate: string;
        symptoms: string[];
    } | null;
}

interface OuraWidgetProps {
    data?: OuraData | null;
    insights?: OuraInsights | null;
    onSync?: () => void;
    isLoading?: boolean;
}

function formatDuration(seconds: number | null): string {
    if (!seconds) return '--';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

function getScoreColor(score: number | null): string {
    if (!score) return 'text-black/30 dark:text-white/30';
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
}

function getScoreBgColor(score: number | null): string {
    if (!score) return 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10';
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-red-500/10 border-red-500/20';
}

function getScoreLabel(score: number | null): string {
    if (!score) return 'NO DATA';
    if (score >= 85) return 'OPTIMAL';
    if (score >= 70) return 'GOOD';
    if (score >= 60) return 'FAIR';
    return 'LOW';
}

function ScoreCard({
    title,
    score,
    subtitle,
    icon: Icon,
}: {
    title: string;
    score: number | null;
    subtitle?: string;
    icon: React.ElementType;
}) {
    const colorClass = getScoreColor(score);
    const bgClass = getScoreBgColor(score);
    const label = getScoreLabel(score);

    return (
        <div className={`${bgClass} border rounded-[2px] p-4 text-center`}>
            <div className="flex items-center justify-center gap-2 mb-2">
                <Icon size={14} className="text-black/40 dark:text-white/40" />
                <span className="text-[10px] font-mono text-black/40 dark:text-white/40 uppercase tracking-widest">
                    {title}
                </span>
            </div>
            <div className={`text-3xl font-bold font-display ${colorClass}`}>
                {score ?? '--'}
            </div>
            <div className="h-1 bg-black/10 dark:bg-white/10 rounded-full mt-2 mb-1 overflow-hidden">
                <div
                    className={`h-full transition-all duration-500 ${
                        score && score >= 80
                            ? 'bg-emerald-500'
                            : score && score >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                    }`}
                    style={{ width: `${score || 0}%` }}
                />
            </div>
            <div className="text-[9px] font-mono text-black/30 dark:text-white/30 uppercase tracking-wider">
                {label}
            </div>
            {subtitle && (
                <div className="text-xs text-black/50 dark:text-white/50 mt-1">{subtitle}</div>
            )}
        </div>
    );
}

export default function OuraWidget({ data, insights, onSync, isLoading }: OuraWidgetProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    const hasData = data || insights?.currentData;
    const readiness = data?.readiness_score ?? insights?.currentData?.readiness ?? null;
    const sleep = data?.sleep_score ?? insights?.currentData?.sleep ?? null;
    const activity = data?.activity_score ?? insights?.currentData?.activity ?? null;
    const sleepDuration = data?.total_sleep_duration ?? insights?.currentData?.sleepDuration ?? null;
    const steps = data?.steps ?? insights?.currentData?.steps ?? null;

    return (
        <div className="stealth-card p-6 mb-6">
            {/* Header */}
            <div
                className="flex items-center justify-between mb-4 pb-4 border-b border-black/5 dark:border-white/5 cursor-pointer"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-[2px]">
                        <Activity className="text-emerald-500" size={16} />
                    </div>
                    <div>
                        <h3 className="font-bold font-display text-black dark:text-white tracking-wide text-sm">
                            RECOVERY STATUS
                        </h3>
                        <span className="text-[10px] font-mono text-black/30 dark:text-white/30">
                            {hasData ? (data?.date || insights?.currentData?.date || 'TODAY') : 'NO DATA'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {onSync && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSync();
                            }}
                            disabled={isLoading}
                            className="p-2 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-[2px] transition-colors"
                        >
                            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    )}
                    <button className="text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors">
                        {isCollapsed ? '▼' : '▲'}
                    </button>
                </div>
            </div>

            {!isCollapsed && (
                <>
                    {!hasData ? (
                        <div className="text-center py-8">
                            <p className="text-black/30 dark:text-white/30 font-mono text-xs mb-2">
                                No Oura data available
                            </p>
                            <p className="text-black/20 dark:text-white/20 text-[10px]">
                                Click sync or add your OURA_TOKEN to .env
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Rest Mode Alert (Illness) */}
                            {insights?.restMode?.active && (
                                <div className="p-4 rounded-[2px] border mb-4 bg-red-500/20 border-red-500/40">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle size={16} className="text-red-400" />
                                        <span className="text-sm font-bold font-mono uppercase text-red-400">
                                            REST MODE ACTIVE
                                        </span>
                                    </div>
                                    <p className="text-black/80 dark:text-white/80 text-sm mb-2">
                                        Oura detected you may be getting sick. Prioritize rest and recovery.
                                    </p>
                                    {insights.restMode.symptoms.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {insights.restMode.symptoms.map((symptom, i) => (
                                                <span
                                                    key={i}
                                                    className="text-[10px] font-mono px-2 py-1 rounded-[2px] bg-red-500/30 text-red-300 border border-red-500/40"
                                                >
                                                    {symptom}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Score Cards */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <ScoreCard
                                    title="Readiness"
                                    score={readiness}
                                    icon={Zap}
                                />
                                <ScoreCard
                                    title="Sleep"
                                    score={sleep}
                                    subtitle={formatDuration(sleepDuration)}
                                    icon={Moon}
                                />
                                <ScoreCard
                                    title="Activity"
                                    score={activity}
                                    subtitle={steps ? `${steps.toLocaleString()} steps` : undefined}
                                    icon={Activity}
                                />
                            </div>

                            {/* Energy Level & Training */}
                            {insights && insights.energyLevel !== 'unknown' && insights.energyLevel !== 'recovery' && (
                                <div
                                    className={`p-4 rounded-[2px] border mb-4 ${
                                        insights.energyLevel === 'high'
                                            ? 'bg-emerald-500/10 border-emerald-500/20'
                                            : insights.energyLevel === 'medium'
                                            ? 'bg-yellow-500/10 border-yellow-500/20'
                                            : 'bg-red-500/10 border-red-500/20'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span
                                            className={`text-xs font-bold font-mono uppercase ${
                                                insights.energyLevel === 'high'
                                                    ? 'text-emerald-400'
                                                    : insights.energyLevel === 'medium'
                                                    ? 'text-yellow-400'
                                                    : 'text-red-400'
                                            }`}
                                        >
                                            {insights.energyLevel.toUpperCase()} ENERGY
                                        </span>
                                    </div>
                                    {insights.trainingRecommendation && (
                                        <p className="text-black/70 dark:text-white/70 text-sm">
                                            🥋 {insights.trainingRecommendation}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Recovery Mode Training Recommendation */}
                            {insights?.energyLevel === 'recovery' && insights.trainingRecommendation && (
                                <div className="p-4 rounded-[2px] border mb-4 bg-red-500/10 border-red-500/20">
                                    <p className="text-red-400 text-sm font-mono">
                                        🛑 {insights.trainingRecommendation}
                                    </p>
                                </div>
                            )}

                            {/* Patterns */}
                            {insights?.patterns && insights.patterns.length > 0 && (
                                <div className="space-y-2">
                                    {insights.patterns.map((pattern, i) => (
                                        <div
                                            key={i}
                                            className="text-xs text-yellow-400/80 bg-yellow-500/10 border border-yellow-500/20 rounded-[2px] p-2 flex items-start gap-2"
                                        >
                                            <span>💡</span>
                                            <span>{pattern}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* HR/HRV if available */}
                            {(data?.resting_heart_rate || data?.hrv_average) && (
                                <div className="flex gap-4 mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                                    {data.resting_heart_rate && (
                                        <div className="flex items-center gap-2 text-xs text-black/50 dark:text-white/50">
                                            <Heart size={12} />
                                            <span>RHR: {data.resting_heart_rate} bpm</span>
                                        </div>
                                    )}
                                    {data.hrv_average && (
                                        <div className="flex items-center gap-2 text-xs text-black/50 dark:text-white/50">
                                            <Activity size={12} />
                                            <span>HRV: {data.hrv_average} ms</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}

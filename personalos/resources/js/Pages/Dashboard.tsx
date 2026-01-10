import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
// GoalWidget removed - replaced by Project Progress widget
import StatusBriefCard from '@/Components/StatusBriefCard';
import RecommendationsWidget from '@/Components/RecommendationsWidget';
import GoalAlignmentWidget from '@/Components/GoalAlignmentWidget';
import TimeAllocationWidget from '@/Components/TimeAllocationWidget';
import QuadrantSummaryWidget from '@/Components/QuadrantSummaryWidget';
import ContentRalphWidget from '@/Components/ContentRalphWidget';
import RecoveryRoutineWidget from '@/Components/RecoveryRoutineWidget';
import { Clock, RefreshCw, Sparkles, Zap, Activity, Moon, Heart, Footprints, Brain } from 'lucide-react';
import { Goal, Task, Contact, User, CommandBrief } from '@/types';

interface OuraData {
    date: string;
    readiness_score: number | null;
    sleep_score: number | null;
    activity_score: number | null;
    total_sleep_duration: number | null;
    steps: number | null;
    resting_heart_rate: number | null;
    hrv_average: number | null;
    stress_high: number | null;
    recovery_high: number | null;
    day_summary: string | null;
}

interface OuraInsights {
    energyLevel: 'high' | 'medium' | 'low' | 'unknown';
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
}

interface DashboardProps {
    auth: {
        user: User;
    };
    goals: Goal[];
    tasks: Task[];
    contacts: Contact[];
    ouraData?: OuraData | null;
    ouraInsights?: OuraInsights | null;
}

// Biometrics status bar for header - shows Oura ring data
function BiometricsBar({
    data,
    insights,
    onSync,
    isLoading
}: {
    data: OuraData | null;
    insights: OuraInsights | null;
    onSync: () => void;
    isLoading: boolean;
}) {
    const readiness = data?.readiness_score ?? insights?.currentData?.readiness ?? null;
    const sleep = data?.sleep_score ?? insights?.currentData?.sleep ?? null;
    const activity = data?.activity_score ?? insights?.currentData?.activity ?? null;
    const hrv = data?.hrv_average ?? null;
    const rhr = data?.resting_heart_rate ?? null;
    const steps = data?.steps ?? insights?.currentData?.steps ?? null;
    const daySummary = data?.day_summary ?? null;

    const getScoreColor = (score: number | null) => {
        if (!score) return 'text-white/30';
        if (score >= 80) return 'text-emerald-500/60';
        if (score >= 60) return 'text-amber-500/50';
        return 'text-white/45';
    };

    const getScoreBg = (score: number | null) => {
        if (!score) return 'bg-white/5 border-white/10';
        if (score >= 80) return 'bg-white/10 border-white/20';
        if (score >= 60) return 'bg-white/5 border-white/15';
        return 'bg-white/5 border-white/10';
    };

    const getEnergyConfig = () => {
        if (!insights?.energyLevel || insights.energyLevel === 'unknown') return null;
        const config = {
            high: { color: 'bg-emerald-500/50', label: 'PEAK', textColor: 'text-emerald-500/70' },
            medium: { color: 'bg-amber-500/40', label: 'STEADY', textColor: 'text-amber-500/60' },
            low: { color: 'bg-red-500/30', label: 'CONSERVE', textColor: 'text-red-500/50' },
        };
        return config[insights.energyLevel as keyof typeof config];
    };

    const getStressConfig = () => {
        if (!daySummary) return null;
        const configs: Record<string, { textColor: string; label: string }> = {
            restored: { textColor: 'text-white/60', label: 'RESTORED' },
            normal: { textColor: 'text-white/50', label: 'NORMAL' },
            stressful: { textColor: 'text-white/40', label: 'STRESSED' },
            stressed: { textColor: 'text-white/40', label: 'STRESSED' },
        };
        return configs[daySummary.toLowerCase()] || { textColor: 'text-white/40', label: daySummary.toUpperCase() };
    };

    const stressConfig = getStressConfig();
    const energy = getEnergyConfig();
    const hasData = readiness || sleep || activity;

    if (!hasData) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px]">
                <span className="text-[10px] font-mono text-black/30 dark:text-white/30">NO BIOMETRICS</span>
                <button
                    onClick={onSync}
                    disabled={isLoading}
                    className="p-1 text-white/30 hover:text-white/60 transition-colors"
                    title="Sync Oura"
                >
                    <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px]">
            {energy && (
                <div className={`flex items-center gap-1.5 px-2 py-1 ${getScoreBg(readiness)} border rounded-[2px]`}>
                    <span className={`w-2 h-2 rounded-full ${energy.color} ${insights?.energyLevel === 'high' ? 'animate-pulse' : ''}`}></span>
                    <span className={`text-[10px] font-mono font-bold ${energy.textColor}`}>{energy.label}</span>
                </div>
            )}

            <div className="w-[1px] h-5 bg-black/10 dark:bg-white/10"></div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                    <Zap size={12} className={getScoreColor(readiness)} />
                    <div className="flex flex-col">
                        <span className={`text-xs font-mono font-bold leading-none ${getScoreColor(readiness)}`}>
                            {readiness ?? '--'}
                        </span>
                        <span className="text-[8px] font-mono text-black/40 dark:text-white/40 uppercase">Ready</span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <Moon size={12} className={getScoreColor(sleep)} />
                    <div className="flex flex-col">
                        <span className={`text-xs font-mono font-bold leading-none ${getScoreColor(sleep)}`}>
                            {sleep ?? '--'}
                        </span>
                        <span className="text-[8px] font-mono text-black/40 dark:text-white/40 uppercase">Sleep</span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <Activity size={12} className={getScoreColor(activity)} />
                    <div className="flex flex-col">
                        <span className={`text-xs font-mono font-bold leading-none ${getScoreColor(activity)}`}>
                            {activity ?? '--'}
                        </span>
                        <span className="text-[8px] font-mono text-black/40 dark:text-white/40 uppercase">Active</span>
                    </div>
                </div>
            </div>

            <div className="w-[1px] h-5 bg-black/10 dark:bg-white/10"></div>

            <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono text-black/50 dark:text-white/50">
                {stressConfig && (
                    <div className={`flex items-center gap-1 ${stressConfig.textColor}`}>
                        <Brain size={10} />
                        <span>{stressConfig.label}</span>
                    </div>
                )}
                {hrv && (
                    <div className="flex items-center gap-1">
                        <Heart size={10} />
                        <span>HRV {hrv}</span>
                    </div>
                )}
                {rhr && (
                    <div className="flex items-center gap-1">
                        <Heart size={10} className="text-white/30" />
                        <span>RHR {rhr}</span>
                    </div>
                )}
                {steps && (
                    <div className="flex items-center gap-1">
                        <Footprints size={10} />
                        <span>{steps.toLocaleString()}</span>
                    </div>
                )}
            </div>

            <button
                onClick={onSync}
                disabled={isLoading}
                className="p-1.5 text-white/30 hover:text-white/60 hover:bg-white/5 rounded-[2px] transition-colors ml-1"
                title="Sync Oura"
            >
                <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            </button>
        </div>
    );
}

export default function Dashboard({ auth, goals, tasks, contacts, ouraData, ouraInsights }: DashboardProps) {
    const [localOuraData, setLocalOuraData] = React.useState<OuraData | null>(ouraData || null);
    const [localOuraInsights, setLocalOuraInsights] = React.useState<OuraInsights | null>(ouraInsights || null);
    const [isOuraLoading, setIsOuraLoading] = React.useState(false);

    // Command Brief state
    const [commandBrief, setCommandBrief] = React.useState<CommandBrief | null>(null);
    const [isBriefLoading, setIsBriefLoading] = React.useState(true);
    const [isAiRefreshing, setIsAiRefreshing] = React.useState(false);

    // Fetch command brief on mount
    React.useEffect(() => {
        fetchCommandBrief();
    }, []);

    const fetchCommandBrief = async (aiRefresh = false) => {
        if (aiRefresh) {
            setIsAiRefreshing(true);
        } else {
            setIsBriefLoading(true);
        }

        try {
            const params = new URLSearchParams();
            if (aiRefresh) params.append('ai', 'true');
            params.append('refresh', 'true');

            const response = await window.axios.get(`/api/command/brief?${params.toString()}`);
            setCommandBrief(response.data);
        } catch (error) {
            console.error('Failed to fetch command brief:', error);
        } finally {
            setIsBriefLoading(false);
            setIsAiRefreshing(false);
        }
    };

    const handleOuraSync = async () => {
        setIsOuraLoading(true);
        const minLoadTime = new Promise(resolve => setTimeout(resolve, 1000));

        try {
            await window.axios.post('/api/oura/sync');
            const [dataRes, insightsRes] = await Promise.all([
                window.axios.get('/api/oura/latest'),
                window.axios.get('/api/oura/insights'),
            ]);
            setLocalOuraData(dataRes.data);
            setLocalOuraInsights(insightsRes.data);
            // Also refresh brief with new Oura data
            fetchCommandBrief();
        } catch (error: any) {
            console.error('Failed to sync Oura data:', error?.response?.data || error);
        }

        await minLoadTime;
        setIsOuraLoading(false);
    };

    const handleTaskComplete = async (taskId: number) => {
        try {
            await window.axios.put(`/api/tasks/${taskId}`, {
                completed_at: new Date().toISOString()
            });
            // Refresh the brief to update recommendations
            fetchCommandBrief();
        } catch (error) {
            console.error('Failed to complete task:', error);
            throw error; // Re-throw so the widget knows it failed
        }
    };

    const formatDate = () => {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        }).toUpperCase();
    };

    return (
        <AppLayout user={auth.user}>
            <Head title="Command Center" />

            <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 md:mb-8 border-b border-black/10 dark:border-white/10 pb-4">
                    <div>
                        <h2 className="text-xl md:text-3xl font-display font-bold text-white/90 mb-1">
                            COMMAND CENTER
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs font-mono text-white/40">
                            <div className="flex items-center gap-2 px-2 py-1 bg-white/5 border border-white/10 rounded-[2px] text-white/50">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse"></span>
                                SOVEREIGN
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock size={12} />
                                <span>{formatDate()}</span>
                            </div>
                            {/* Refresh buttons */}
                            <button
                                onClick={() => fetchCommandBrief(false)}
                                disabled={isBriefLoading}
                                className="flex items-center gap-1 px-2 py-1 text-white/30 hover:text-white/60 hover:bg-white/5 rounded-[2px] transition-colors"
                                title="Refresh brief (static)"
                            >
                                <RefreshCw size={12} className={isBriefLoading ? 'animate-spin' : ''} />
                                <span>Refresh</span>
                            </button>
                            <button
                                onClick={() => fetchCommandBrief(true)}
                                disabled={isAiRefreshing}
                                className="flex items-center gap-1 px-2 py-1 text-white/30 hover:text-white/50 hover:bg-white/5 rounded-[2px] transition-colors"
                                title="AI-enhanced refresh (uses API credits)"
                            >
                                <Sparkles size={12} className={isAiRefreshing ? 'animate-pulse' : ''} />
                                <span>AI Brief</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-mono text-black/40 dark:text-white/40 uppercase tracking-wider hidden sm:block">Biometrics Status</span>
                        <BiometricsBar
                            data={localOuraData}
                            insights={localOuraInsights}
                            onSync={handleOuraSync}
                            isLoading={isOuraLoading}
                        />
                    </div>
                </div>

                {/* Status Brief Card */}
                <StatusBriefCard
                    brief={commandBrief?.statusBrief || null}
                    patterns={commandBrief?.patterns || []}
                    generatedAt={commandBrief?.generatedAt}
                    cached={commandBrief?.cached}
                    cacheAge={commandBrief?.cacheAge}
                    isLoading={isBriefLoading}
                />

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column - Execution Flow: Tasks → Projects → Goals */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Today's Tasks */}
                        <RecommendationsWidget
                            recommendations={commandBrief?.recommendations || []}
                            tasks={tasks}
                            onTaskComplete={handleTaskComplete}
                        />

                        {/* Project Progress */}
                        <TimeAllocationWidget
                            allocations={commandBrief?.timeAllocation || []}
                        />

                        {/* Strategic Goals */}
                        <GoalAlignmentWidget />
                    </div>

                    {/* Right Column - Status & Habits */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Human 3.0 Quadrant Summary */}
                        <QuadrantSummaryWidget summary={commandBrief?.quadrantSummary || null} />

                        {/* Recovery Routine (Sean's daily exercises) */}
                        <RecoveryRoutineWidget />

                        {/* Content Ralph */}
                        <ContentRalphWidget />

                        {/* Context Sources (debug info) */}
                        {commandBrief?.contextSources && (
                            <div className="text-[10px] font-mono text-black/20 dark:text-white/20 px-2">
                                Sources: {commandBrief.contextSources.join(', ')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

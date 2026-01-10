import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Cpu,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Activity,
    Calendar,
    Clock,
    ChevronDown,
    ChevronUp,
    BarChart3,
    Zap
} from 'lucide-react';
import { User } from '@/types';

interface UsageRecord {
    id: number;
    model: string;
    endpoint: string;
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
    timestamp: string;
}

interface DailyUsage {
    date: string;
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
    requests: number;
}

interface UsageStats {
    today: {
        input_tokens: number;
        output_tokens: number;
        cost_usd: number;
        requests: number;
    };
    yesterday: {
        input_tokens: number;
        output_tokens: number;
        cost_usd: number;
        requests: number;
    };
    week: {
        input_tokens: number;
        output_tokens: number;
        cost_usd: number;
        requests: number;
    };
    month: {
        input_tokens: number;
        output_tokens: number;
        cost_usd: number;
        requests: number;
    };
    daily: DailyUsage[];
    recent: UsageRecord[];
}

interface UsageProps {
    auth: {
        user: User;
    };
    usage: UsageStats;
}

export default function Usage({ auth, usage }: UsageProps) {
    const [showAllRecent, setShowAllRecent] = useState(false);

    const formatTokens = (tokens: number) => {
        if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(2)}M`;
        if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
        return tokens.toString();
    };

    const formatCost = (cost: number) => {
        return cost < 0.01 ? `$${cost.toFixed(4)}` : `$${cost.toFixed(2)}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTrend = (current: number, previous: number) => {
        if (previous === 0) return { direction: 'neutral', percent: 0 };
        const percent = ((current - previous) / previous) * 100;
        return {
            direction: percent > 0 ? 'up' : percent < 0 ? 'down' : 'neutral',
            percent: Math.abs(percent),
        };
    };

    const costTrend = getTrend(usage.today.cost_usd, usage.yesterday.cost_usd);
    const requestTrend = getTrend(usage.today.requests, usage.yesterday.requests);

    // Calculate max cost for bar chart scaling
    const maxDailyCost = Math.max(...(usage.daily?.map(d => d.cost_usd) || [0]), 0.01);

    const displayedRecent = showAllRecent ? usage.recent : usage.recent?.slice(0, 10);

    return (
        <AppLayout user={auth.user}>
            <Head title="API Usage" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-[2px]">
                            <Cpu size={20} className="text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-display font-bold text-black dark:text-white">
                                API USAGE
                            </h2>
                            <p className="text-xs font-mono text-black/40 dark:text-white/40">
                                Token consumption & cost analytics
                            </p>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Today's Cost */}
                    <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px] p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-mono text-black/40 dark:text-white/40 uppercase tracking-wider">Today</span>
                            <DollarSign size={14} className="text-emerald-400" />
                        </div>
                        <div className="text-2xl font-bold text-black dark:text-white font-mono mb-1">
                            {formatCost(usage.today.cost_usd)}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-mono">
                            {costTrend.direction === 'up' ? (
                                <>
                                    <TrendingUp size={12} className="text-amber-400" />
                                    <span className="text-amber-400">+{costTrend.percent.toFixed(0)}%</span>
                                </>
                            ) : costTrend.direction === 'down' ? (
                                <>
                                    <TrendingDown size={12} className="text-emerald-400" />
                                    <span className="text-emerald-400">-{costTrend.percent.toFixed(0)}%</span>
                                </>
                            ) : (
                                <span className="text-black/30 dark:text-white/30">vs yesterday</span>
                            )}
                            <span className="text-black/30 dark:text-white/30 ml-1">vs yesterday</span>
                        </div>
                    </div>

                    {/* Today's Requests */}
                    <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px] p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-mono text-black/40 dark:text-white/40 uppercase tracking-wider">Requests</span>
                            <Activity size={14} className="text-blue-400" />
                        </div>
                        <div className="text-2xl font-bold text-black dark:text-white font-mono mb-1">
                            {usage.today.requests}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-mono">
                            {requestTrend.direction === 'up' ? (
                                <>
                                    <TrendingUp size={12} className="text-blue-400" />
                                    <span className="text-blue-400">+{requestTrend.percent.toFixed(0)}%</span>
                                </>
                            ) : requestTrend.direction === 'down' ? (
                                <>
                                    <TrendingDown size={12} className="text-emerald-400" />
                                    <span className="text-emerald-400">-{requestTrend.percent.toFixed(0)}%</span>
                                </>
                            ) : (
                                <span className="text-black/30 dark:text-white/30">vs yesterday</span>
                            )}
                            <span className="text-black/30 dark:text-white/30 ml-1">vs yesterday</span>
                        </div>
                    </div>

                    {/* Week Total */}
                    <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px] p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-mono text-black/40 dark:text-white/40 uppercase tracking-wider">This Week</span>
                            <Calendar size={14} className="text-purple-400" />
                        </div>
                        <div className="text-2xl font-bold text-black dark:text-white font-mono mb-1">
                            {formatCost(usage.week.cost_usd)}
                        </div>
                        <div className="text-xs font-mono text-black/30 dark:text-white/30">
                            {formatTokens(usage.week.input_tokens + usage.week.output_tokens)} tokens
                        </div>
                    </div>

                    {/* Month Total */}
                    <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px] p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-mono text-black/40 dark:text-white/40 uppercase tracking-wider">This Month</span>
                            <BarChart3 size={14} className="text-amber-400" />
                        </div>
                        <div className="text-2xl font-bold text-black dark:text-white font-mono mb-1">
                            {formatCost(usage.month.cost_usd)}
                        </div>
                        <div className="text-xs font-mono text-black/30 dark:text-white/30">
                            {usage.month.requests} requests
                        </div>
                    </div>
                </div>

                {/* Daily Chart */}
                <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px] p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 size={16} className="text-black/40 dark:text-white/40" />
                        <span className="text-xs font-mono text-black/40 dark:text-white/40 uppercase tracking-wider">Daily Cost (Last 14 Days)</span>
                    </div>
                    <div className="flex items-end gap-1 h-32">
                        {usage.daily?.map((day, idx) => {
                            const height = (day.cost_usd / maxDailyCost) * 100;
                            const isToday = idx === usage.daily.length - 1;
                            return (
                                <div
                                    key={day.date}
                                    className="flex-1 flex flex-col items-center gap-1 group"
                                >
                                    <div className="relative w-full">
                                        <div
                                            className={`w-full rounded-t-[2px] transition-all ${
                                                isToday ? 'bg-emerald-500' : 'bg-black/20 dark:bg-white/20 group-hover:bg-black/30 dark:group-hover:bg-white/30'
                                            }`}
                                            style={{ height: `${Math.max(height, 2)}px` }}
                                        />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <div className="bg-white dark:bg-black/90 border border-black/20 dark:border-white/20 px-2 py-1 rounded text-[10px] font-mono text-black dark:text-white whitespace-nowrap">
                                                {formatCost(day.cost_usd)}
                                                <div className="text-black/50 dark:text-white/50">{day.requests} req</div>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`text-[9px] font-mono ${isToday ? 'text-emerald-400' : 'text-black/30 dark:text-white/30'}`}>
                                        {formatDate(day.date)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Token Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Input vs Output Tokens */}
                    <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px] p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Zap size={16} className="text-black/40 dark:text-white/40" />
                            <span className="text-xs font-mono text-black/40 dark:text-white/40 uppercase tracking-wider">Token Breakdown (Today)</span>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-mono mb-1">
                                    <span className="text-black/60 dark:text-white/60">Input Tokens</span>
                                    <span className="text-black dark:text-white">{formatTokens(usage.today.input_tokens)}</span>
                                </div>
                                <div className="h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full"
                                        style={{
                                            width: `${(usage.today.input_tokens / (usage.today.input_tokens + usage.today.output_tokens || 1)) * 100}%`
                                        }}
                                    />
                                </div>
                                <div className="text-[10px] font-mono text-black/30 dark:text-white/30 mt-1">
                                    @ $3/M = {formatCost((usage.today.input_tokens / 1000000) * 3)}
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-mono mb-1">
                                    <span className="text-black/60 dark:text-white/60">Output Tokens</span>
                                    <span className="text-black dark:text-white">{formatTokens(usage.today.output_tokens)}</span>
                                </div>
                                <div className="h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full"
                                        style={{
                                            width: `${(usage.today.output_tokens / (usage.today.input_tokens + usage.today.output_tokens || 1)) * 100}%`
                                        }}
                                    />
                                </div>
                                <div className="text-[10px] font-mono text-black/30 dark:text-white/30 mt-1">
                                    @ $15/M = {formatCost((usage.today.output_tokens / 1000000) * 15)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Summary */}
                    <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px] p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar size={16} className="text-black/40 dark:text-white/40" />
                            <span className="text-xs font-mono text-black/40 dark:text-white/40 uppercase tracking-wider">Monthly Summary</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-mono">
                                <span className="text-black/60 dark:text-white/60">Total Tokens</span>
                                <span className="text-black dark:text-white">{formatTokens(usage.month.input_tokens + usage.month.output_tokens)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-mono">
                                <span className="text-black/60 dark:text-white/60">Total Requests</span>
                                <span className="text-black dark:text-white">{usage.month.requests}</span>
                            </div>
                            <div className="flex justify-between text-xs font-mono">
                                <span className="text-black/60 dark:text-white/60">Avg Cost/Day</span>
                                <span className="text-black dark:text-white">{formatCost(usage.month.cost_usd / Math.max(new Date().getDate(), 1))}</span>
                            </div>
                            <div className="flex justify-between text-xs font-mono">
                                <span className="text-black/60 dark:text-white/60">Avg Tokens/Request</span>
                                <span className="text-black dark:text-white">
                                    {formatTokens(Math.round((usage.month.input_tokens + usage.month.output_tokens) / Math.max(usage.month.requests, 1)))}
                                </span>
                            </div>
                            <div className="pt-3 border-t border-black/10 dark:border-white/10">
                                <div className="flex justify-between text-sm font-mono">
                                    <span className="text-black/60 dark:text-white/60">Total Cost</span>
                                    <span className="text-emerald-400 font-bold">{formatCost(usage.month.cost_usd)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Requests */}
                <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px] p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-black/40 dark:text-white/40" />
                            <span className="text-xs font-mono text-black/40 dark:text-white/40 uppercase tracking-wider">Recent Requests</span>
                        </div>
                        {usage.recent?.length > 10 && (
                            <button
                                onClick={() => setShowAllRecent(!showAllRecent)}
                                className="flex items-center gap-1 text-xs font-mono text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
                            >
                                {showAllRecent ? 'Show Less' : `Show All (${usage.recent.length})`}
                                {showAllRecent ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                        )}
                    </div>
                    <div className="space-y-2">
                        {displayedRecent?.map((record) => (
                            <div
                                key={record.id}
                                className="flex items-center justify-between py-2 border-b border-black/5 dark:border-white/5 last:border-0"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-mono text-black/30 dark:text-white/30 w-16">
                                        {formatTime(record.timestamp)}
                                    </span>
                                    <span className="text-xs font-mono text-black/60 dark:text-white/60 w-20">
                                        {record.endpoint}
                                    </span>
                                    <span className="text-[10px] font-mono text-black/30 dark:text-white/30 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">
                                        {record.model?.replace('claude-', '').replace('-20250514', '')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-6 text-xs font-mono">
                                    <span className="text-blue-400 w-16 text-right">
                                        {formatTokens(record.input_tokens)} in
                                    </span>
                                    <span className="text-emerald-400 w-16 text-right">
                                        {formatTokens(record.output_tokens)} out
                                    </span>
                                    <span className="text-black dark:text-white w-16 text-right">
                                        {formatCost(record.cost_usd)}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {(!usage.recent || usage.recent.length === 0) && (
                            <div className="text-center py-8 text-xs font-mono text-black/30 dark:text-white/30">
                                No API usage recorded yet
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

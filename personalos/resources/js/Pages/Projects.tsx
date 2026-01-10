import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    FolderKanban, Circle, CheckCircle2, Trash2, Archive, Zap,
    Brain, Dumbbell, Heart, Briefcase, ChevronRight, X, Plus,
    ChevronLeft, MoreHorizontal, ChevronDown, GripVertical
} from 'lucide-react';
import { User, Project, Task } from '@/types';

type AltitudeLevel = 'life' | 'projects';
type QuadrantId = 'mind' | 'body' | 'spirit' | 'vocation';

// Health stats from Apple Health API
interface QuadrantHealthStats {
    spirit: {
        score: number;
        this_week: number;
        this_month: number;
        this_year: number;
        total_hours: number;
        avg_duration_minutes: number;
        current_streak: number;
        label: string;
    };
    body: {
        score: number;
        workouts_this_week: number;
        workouts_this_month: number;
        workouts_this_year: number;
        total_workout_hours: number;
        bjj_this_month: number;
        manual_training_this_week: number;
        avg_steps: number;
        avg_sleep_hours: number;
        avg_hrv: number;
        latest: {
            date: string;
            steps: number;
            sleep_hours: number;
            hrv: number;
        } | null;
        label: string;
    };
    mind: {
        score: number;
        journals_this_week: number;
        journals_this_month: number;
        total_journals: number;
        sparks_this_week: number;
        sparks_this_month: number;
        total_sparks: number;
        training_journals: number;
        label: string;
    };
    vocation: {
        score: number;
        tasks_completed_week: number;
        tasks_completed_month: number;
        total_tasks_completed: number;
        commits_this_week: number;
        sessions_this_week: number;
        label: string;
    };
}

interface ProjectsProps {
    auth: {
        user: User;
    };
}

// Human 3.0 Quadrant definitions based on Dan Koe's framework
interface Pursuit {
    name: string;
    level: 1 | 2 | 3; // 1.0 Conformist, 2.0 Individualist, 3.0 Synthesist
    phase: 1 | 2 | 3; // Dissonance, Uncertainty, Discovery
    description?: string;
}

interface Quadrant {
    id: QuadrantId;
    name: string;
    subtitle: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    archetypes: { level1: string; level2: string; level3: string };
    pursuits: Pursuit[];
    traits: { knowledge: number; experience: number; skill: number }; // 0-100
}

const QUADRANTS: Quadrant[] = [
    {
        id: 'mind',
        name: 'Mind',
        subtitle: 'Level 2 — Transitional',
        description: "You've developed awareness of distraction and inner narrative loops and are consistently engaging in meditation, visualization, and journaling. However, scattered input, emotional reactivity, and occasional imposter syndrome still hinder deep work. You're moving into cognitive sovereignty but haven't fully stabilized sacred focus.",
        icon: Brain,
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        archetypes: { level1: 'Noise', level2: 'Signal', level3: 'Mastery' },
        pursuits: [
            { name: 'Daily Meditation', level: 2, phase: 3, description: 'Meditation, visualization, journaling consistent' },
            { name: 'Focus & Attention', level: 2, phase: 2, description: 'Scattered input, tech distraction present' },
            { name: 'Narrative Control', level: 2, phase: 2, description: 'Imposter syndrome still surfaces' },
            { name: 'Emotional Regulation', level: 2, phase: 1, description: 'Reactivity under stress' },
            { name: 'Sacred Focus', level: 2, phase: 2, description: 'Moving toward but not stabilized' }
        ],
        traits: { knowledge: 65, experience: 55, skill: 50 }
    },
    {
        id: 'body',
        name: 'Body',
        subtitle: 'Level 2 — Intermediate',
        description: 'Your training protocol is structured and serious, with Lethal Training, mobility, and peptide use. However, inconsistent sleep, dietary lapses, and stimulant reliance indicate you\'re not yet in the Zone of Power. Once circadian rhythm and Lethal Standards are locked in, this can elevate rapidly.',
        icon: Dumbbell,
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        archetypes: { level1: 'Dormant', level2: 'Forge', level3: 'Power' },
        pursuits: [
            { name: 'Lethal Training Protocol', level: 2, phase: 2, description: 'Structured and serious training' },
            { name: 'Mobility & Peptides', level: 2, phase: 2, description: 'Active protocol in place' },
            { name: 'Circadian Rhythm', level: 2, phase: 1, description: 'Sleep still inconsistent' },
            { name: 'Nutrition Discipline', level: 2, phase: 1, description: 'Dietary lapses occurring' },
            { name: 'Stimulant Independence', level: 1, phase: 1, description: 'Still reliant on stimulants' }
        ],
        traits: { knowledge: 70, experience: 55, skill: 50 }
    },
    {
        id: 'spirit',
        name: 'Soul',
        subtitle: 'Level 2 — Awakening',
        description: 'Your values, philosophy (Shugyo), and vision are clarifying. You\'ve committed to a rite-of-passage-like journey, but identity conflict (family vs. warrior vs. creator) and doubt still linger. Emotional discipline and deeper internal alignment are forming. Daily connection to your "why" will help unlock devotion.',
        icon: Heart,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        archetypes: { level1: 'Lost', level2: 'Awakening', level3: 'Devoted' },
        pursuits: [
            { name: 'Philosophy & Vision', level: 2, phase: 2, description: 'Shugyo values clarifying' },
            { name: 'Identity Integration', level: 2, phase: 1, description: 'Family vs warrior vs creator conflict' },
            { name: 'Emotional Discipline', level: 1, phase: 2, description: 'Forming but doubt lingers' },
            { name: 'Daily Why Connection', level: 1, phase: 1, description: 'Needs ritualization' },
            { name: 'Rite of Passage', level: 2, phase: 2, description: 'Committed to the journey' }
        ],
        traits: { knowledge: 55, experience: 40, skill: 35 }
    },
    {
        id: 'vocation',
        name: 'Vocation',
        subtitle: 'Level 2 — Initiation',
        description: "You're actively building the foundation of your brand and creative ecosystem. The architecture (writing, content, coaching) is forming but unproven in public. No monetization yet, but clarity and discipline are rising. Once you ship consistently (Scrolls, videos, coaching offer), expect a leap to level 3.",
        icon: Briefcase,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        archetypes: { level1: 'Silent', level2: 'Initiation', level3: 'Mastery' },
        pursuits: [
            { name: 'Brand Architecture', level: 2, phase: 2, description: 'Writing, content, coaching forming' },
            { name: 'Content Publishing', level: 1, phase: 1, description: 'Not yet shipping publicly' },
            { name: 'Monetization', level: 1, phase: 1, description: 'No revenue yet' },
            { name: 'Scrolls & Videos', level: 2, phase: 2, description: 'In development' },
            { name: 'Coaching Offer', level: 1, phase: 2, description: 'Clarity rising, not launched' }
        ],
        traits: { knowledge: 60, experience: 35, skill: 40 }
    }
];

// Helper to get quadrant config by ID
function getQuadrantConfig(id: QuadrantId): Quadrant {
    return QUADRANTS.find(q => q.id === id) || QUADRANTS[0];
}

// Level and Phase badges
function LevelBadge({ level }: { level: 1 | 2 | 3 }) {
    const config = {
        1: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', label: '1.0 Conformist' },
        2: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', label: '2.0 Individualist' },
        3: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: '3.0 Synthesist' }
    };
    const c = config[level];
    return (
        <span className={`px-2 py-0.5 ${c.bg} border ${c.border} ${c.text} text-[10px] font-mono rounded-[2px]`}>
            {c.label}
        </span>
    );
}

function PhaseBadge({ phase }: { phase: 1 | 2 | 3 }) {
    const config = {
        1: { label: 'Dissonance', icon: '~' },
        2: { label: 'Uncertainty', icon: '?' },
        3: { label: 'Discovery', icon: '!' }
    };
    const c = config[phase];
    return (
        <span className="text-black/40 dark:text-white/40 text-[10px] font-mono">
            Phase {phase}: {c.label}
        </span>
    );
}

// Traits visualization
function TraitsBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <span className="text-black/50 dark:text-white/50 text-xs font-mono">{label}</span>
                <span className="text-black/30 dark:text-white/30 text-[10px] font-mono">{value}%</span>
            </div>
            <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}

function ProgressBar({ progress, color = 'emerald' }: { progress: number; color?: string }) {
    const colorClasses: Record<string, string> = {
        emerald: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500',
        green: 'bg-green-500', blue: 'bg-blue-500'
    };
    return (
        <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full ${colorClasses[color] || colorClasses.emerald} transition-all duration-500`} style={{ width: `${progress}%` }} />
        </div>
    );
}

// Quadrant Detail Modal for Life View
function QuadrantModal({ quadrant, onClose }: { quadrant: Quadrant; onClose: () => void }) {
    const Icon = quadrant.icon;
    const avgLevel = quadrant.pursuits.reduce((sum, p) => sum + p.level, 0) / quadrant.pursuits.length;
    const overallLevel = avgLevel < 1.5 ? 1 : avgLevel < 2.5 ? 2 : 3;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 rounded-[2px] w-full max-w-3xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={`relative p-6 border-b border-black/10 dark:border-white/10 ${quadrant.bgColor}`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${quadrant.bgColor.replace('/10', '')}`}></div>
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-[2px] transition-colors">
                        <X size={20} className="text-black/60 dark:text-white/60" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className={`p-3 ${quadrant.bgColor} border ${quadrant.borderColor} rounded-[2px]`}>
                            <Icon size={28} className={quadrant.color} />
                        </div>
                        <div>
                            <h2 className="font-display font-bold text-black dark:text-white text-2xl">{quadrant.name}</h2>
                            <p className="text-black/50 dark:text-white/50 text-sm font-mono">{quadrant.subtitle}</p>
                        </div>
                    </div>
                    <p className="mt-4 text-black/60 dark:text-white/60 text-sm leading-relaxed">{quadrant.description}</p>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {/* Archetype Progression */}
                    <div className="mb-6">
                        <h3 className="text-black/40 dark:text-white/40 text-[10px] font-mono uppercase tracking-wider mb-3">Archetype Progression</h3>
                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1.5 ${overallLevel === 1 ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-black/30 dark:text-white/30'} border rounded-[2px] text-xs font-mono transition-all`}>
                                {quadrant.archetypes.level1}
                            </span>
                            <ChevronRight size={14} className="text-black/20 dark:text-white/20" />
                            <span className={`px-3 py-1.5 ${overallLevel === 2 ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-black/30 dark:text-white/30'} border rounded-[2px] text-xs font-mono transition-all`}>
                                {quadrant.archetypes.level2}
                            </span>
                            <ChevronRight size={14} className="text-black/20 dark:text-white/20" />
                            <span className={`px-3 py-1.5 ${overallLevel === 3 ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-black/30 dark:text-white/30'} border rounded-[2px] text-xs font-mono transition-all`}>
                                {quadrant.archetypes.level3}
                            </span>
                        </div>
                    </div>

                    {/* Traits */}
                    <div className="mb-6">
                        <h3 className="text-black/40 dark:text-white/40 text-[10px] font-mono uppercase tracking-wider mb-3">Traits (Horizontal Development)</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <TraitsBar label="Knowledge" value={quadrant.traits.knowledge} color="bg-blue-500" />
                            <TraitsBar label="Experience" value={quadrant.traits.experience} color="bg-purple-500" />
                            <TraitsBar label="Skill" value={quadrant.traits.skill} color="bg-emerald-500" />
                        </div>
                    </div>

                    {/* Pursuits */}
                    <div>
                        <h3 className="text-black/40 dark:text-white/40 text-[10px] font-mono uppercase tracking-wider mb-3">Active Pursuits</h3>
                        <div className="space-y-3">
                            {quadrant.pursuits.map((pursuit, i) => (
                                <div key={i} className="p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px] hover:bg-black/[0.07] dark:hover:bg-white/[0.07] transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${quadrant.color.replace('text-', 'bg-')}`}></span>
                                            <span className="text-black dark:text-white font-medium text-sm">{pursuit.name}</span>
                                        </div>
                                        <LevelBadge level={pursuit.level} />
                                    </div>
                                    {pursuit.description && (
                                        <p className="text-black/40 dark:text-white/40 text-xs ml-4 mb-2">{pursuit.description}</p>
                                    )}
                                    <div className="ml-4">
                                        <PhaseBadge phase={pursuit.phase} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Human 3.0 Info */}
                    <div className="mt-6 p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px]">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap size={14} className={quadrant.color} />
                            <span className="text-black/60 dark:text-white/60 text-xs font-mono">HUMAN 3.0 Framework</span>
                        </div>
                        <p className="text-black/40 dark:text-white/40 text-xs leading-relaxed">
                            Levels: 1.0 (Conformist) → 2.0 (Individualist) → 3.0 (Synthesist)
                            <br />
                            Phases: Dissonance → Uncertainty → Discovery
                            <br />
                            Traits: Knowledge × Experience × Skill
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Quadrant navigation links
const QUADRANT_LINKS: Record<QuadrantId, { href: string; label: string }[]> = {
    body: [
        { href: '/training', label: 'Training' },
    ],
    spirit: [
        { href: '/sparkfile', label: 'Meditation' },
    ],
    mind: [
        { href: '/sparkfile', label: 'Journal' },
    ],
    vocation: [
        { href: '/projects', label: 'Projects' },
    ],
};

// Quadrant Card for Life View
function QuadrantCard({ quadrant, onClick, healthStats }: { quadrant: Quadrant; onClick: () => void; healthStats: QuadrantHealthStats | null }) {
    const Icon = quadrant.icon;
    const links = QUADRANT_LINKS[quadrant.id] || [];

    // Get real score from health stats or fallback
    const getScore = (): number => {
        if (!healthStats) return 2.0;
        const scoreMap: Record<QuadrantId, number> = {
            spirit: healthStats.spirit.score,
            body: healthStats.body.score,
            mind: healthStats.mind.score,
            vocation: healthStats.vocation.score,
        };
        // Convert 0-100 to 1.0-3.0 scale
        return 1 + (scoreMap[quadrant.id] / 100) * 2;
    };

    const score = getScore();
    const scorePercent = healthStats ? (
        quadrant.id === 'spirit' ? healthStats.spirit.score :
        quadrant.id === 'body' ? healthStats.body.score :
        quadrant.id === 'mind' ? healthStats.mind.score :
        healthStats.vocation.score
    ) : 50;

    // Get real metrics for display
    const getMetrics = () => {
        if (!healthStats) return null;

        if (quadrant.id === 'spirit') {
            return [
                { label: 'This Week', value: `${healthStats.spirit.this_week} sessions` },
                { label: 'This Month', value: `${healthStats.spirit.this_month} sessions` },
                { label: 'Total Hours', value: `${healthStats.spirit.total_hours}h` },
            ];
        }
        if (quadrant.id === 'body') {
            return [
                { label: 'Workouts (Week)', value: `${healthStats.body.workouts_this_week}` },
                { label: 'Avg Steps', value: healthStats.body.avg_steps.toLocaleString() },
                { label: 'Avg Sleep', value: `${healthStats.body.avg_sleep_hours}h` },
            ];
        }
        if (quadrant.id === 'mind') {
            return [
                { label: 'Journals (Week)', value: `${healthStats.mind.journals_this_week}` },
                { label: 'Sparks (Week)', value: `${healthStats.mind.sparks_this_week}` },
                { label: 'Total Entries', value: `${healthStats.mind.total_journals + healthStats.mind.total_sparks}` },
            ];
        }
        if (quadrant.id === 'vocation') {
            return [
                { label: 'Tasks (Week)', value: `${healthStats.vocation.tasks_completed_week}` },
                { label: 'Tasks (Month)', value: `${healthStats.vocation.tasks_completed_month}` },
                { label: 'Total Completed', value: `${healthStats.vocation.total_tasks_completed}` },
            ];
        }
        return null;
    };

    const metrics = getMetrics();

    return (
        <div
            onClick={onClick}
            className={`stealth-card p-6 relative overflow-hidden group hover:border-black/20 dark:hover:border-white/20 transition-all cursor-pointer`}
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${quadrant.bgColor.replace('/10', '')}`}></div>

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 ${quadrant.bgColor} border ${quadrant.borderColor} rounded-[2px]`}>
                        <Icon size={20} className={quadrant.color} />
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-black dark:text-white text-lg">{quadrant.name}</h3>
                        <p className="text-black/40 dark:text-white/40 text-xs font-mono">{quadrant.subtitle}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 ${score >= 2.5 ? 'bg-emerald-500/10 text-emerald-400' : score >= 1.5 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'} text-[10px] font-mono rounded-[2px]`}>
                        {score.toFixed(1)}
                    </span>
                    <ChevronRight size={16} className="text-black/30 dark:text-white/30 group-hover:text-black/60 dark:group-hover:text-white/60 transition-colors" />
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="w-full h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${quadrant.color.replace('text-', 'bg-')} transition-all duration-500`} style={{ width: `${scorePercent}%` }} />
                </div>
                <p className="text-black/30 dark:text-white/30 text-[10px] font-mono mt-1 text-right">{Math.round(scorePercent)}% developed</p>
            </div>

            {/* Real Health Metrics (for Spirit/Body) or Pursuits (for Mind/Vocation) */}
            <div className="space-y-2">
                {metrics ? (
                    // Show real Apple Health metrics
                    metrics.map((metric, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-black/60 dark:text-white/60">
                                <span className={`w-1 h-1 rounded-full ${quadrant.color.replace('text-', 'bg-')}`}></span>
                                {metric.label}
                            </div>
                            <span className="text-[10px] font-mono text-black/50 dark:text-white/50">
                                {metric.value}
                            </span>
                        </div>
                    ))
                ) : (
                    // Fallback to pursuits for Mind/Vocation
                    <>
                        {quadrant.pursuits.slice(0, 3).map((pursuit, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-black/60 dark:text-white/60">
                                    <span className={`w-1 h-1 rounded-full ${quadrant.color.replace('text-', 'bg-')}`}></span>
                                    {pursuit.name}
                                </div>
                                <span className={`text-[10px] font-mono ${pursuit.level === 3 ? 'text-emerald-400' : pursuit.level === 2 ? 'text-amber-400' : 'text-red-400'}`}>
                                    {pursuit.level}.0
                                </span>
                            </div>
                        ))}
                        {quadrant.pursuits.length > 3 && (
                            <p className="text-black/30 dark:text-white/30 text-xs font-mono">+{quadrant.pursuits.length - 3} more</p>
                        )}
                    </>
                )}
            </div>

            {/* Quick Links */}
            {links.length > 0 && (
                <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center gap-2">
                    {links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.href}
                            onClick={(e) => e.stopPropagation()}
                            className={`px-2 py-1 text-[10px] font-mono ${quadrant.bgColor} border ${quadrant.borderColor} ${quadrant.color} rounded-[2px] hover:opacity-80 transition-opacity`}
                        >
                            → {link.label}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

// Life View - Human 3.0 Quadrants
function LifeQuadrantsView({ onSelectQuadrant, healthStats }: { onSelectQuadrant: (q: Quadrant) => void; healthStats: QuadrantHealthStats | null }) {
    // Get score for a quadrant from health stats (0-100 scale to 1-3 level scale)
    const getQuadrantScore = (id: QuadrantId): number => {
        if (!healthStats) return 2.0; // Default fallback
        const scoreMap: Record<QuadrantId, number> = {
            spirit: healthStats.spirit.score,
            body: healthStats.body.score,
            mind: healthStats.mind.score,
            vocation: healthStats.vocation.score,
        };
        // Convert 0-100 score to 1.0-3.0 scale
        return 1 + (scoreMap[id] / 100) * 2;
    };

    // Calculate overall Metatype score using real health data
    const calculateMetatype = () => {
        if (healthStats) {
            const scores = [
                healthStats.spirit.score,
                healthStats.body.score,
                healthStats.mind.score,
                healthStats.vocation.score,
            ];
            const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
            // Convert 0-100 to 1-3 scale
            return 1 + (avgScore / 100) * 2;
        }
        // Fallback to hardcoded pursuits
        let totalScore = 0;
        let totalPursuits = 0;
        QUADRANTS.forEach(q => {
            q.pursuits.forEach(p => {
                totalScore += p.level;
                totalPursuits++;
            });
        });
        return totalScore / totalPursuits;
    };

    const metatypeScore = calculateMetatype();
    const metatypeLabel = metatypeScore < 1.5 ? 'Conformist' : metatypeScore < 2.5 ? 'Individualist' : 'Synthesist';

    return (
        <div className="space-y-6">
            {/* Intro */}
            <div className="stealth-card p-6 border-l-4 border-emerald-500">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-display font-bold text-black dark:text-white text-lg mb-2">HUMAN 3.0 Development Map</h3>
                        <p className="text-black/50 dark:text-white/50 text-sm">
                            Four quadrants of holistic development based on Ken Wilber's AQAL model.
                            Progress in all areas to become multidimensionally capable.
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-black/40 dark:text-white/40 text-[10px] font-mono uppercase tracking-wider mb-1">Metatype</div>
                        <div className={`px-3 py-1.5 ${metatypeScore >= 2.5 ? 'bg-emerald-500/20 text-emerald-400' : metatypeScore >= 1.5 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'} rounded-[2px]`}>
                            <span className="font-mono text-sm font-bold">{metatypeScore.toFixed(2)}</span>
                            <span className="text-xs ml-1 opacity-70">{metatypeLabel}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quadrant Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {QUADRANTS.map((quadrant) => (
                    <QuadrantCard
                        key={quadrant.id}
                        quadrant={quadrant}
                        onClick={() => onSelectQuadrant(quadrant)}
                        healthStats={healthStats}
                    />
                ))}
            </div>

            {/* Framework Legend */}
            <div className="stealth-card p-4">
                <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-mono">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <span className="text-black/40 dark:text-white/40">1.0 Conformist</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span className="text-black/40 dark:text-white/40">2.0 Individualist</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-black/40 dark:text-white/40">3.0 Synthesist</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Project Card for quadrant column
function ProjectCard({
    project,
    quadrant,
    onSelect,
    onArchive,
    onDelete
}: {
    project: Project;
    quadrant: Quadrant;
    onSelect: () => void;
    onArchive: () => void;
    onDelete: () => void;
}) {
    const [showActions, setShowActions] = useState(false);
    const hasChildren = project.children && project.children.length > 0;
    const progress = project.progress || 0;

    return (
        <div
            className="group p-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px] hover:bg-black/[0.07] dark:hover:bg-white/[0.07] hover:border-black/20 dark:hover:border-white/20 transition-all cursor-pointer"
            onClick={onSelect}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${quadrant.color.replace('text-', 'bg-')}`}></span>
                        <h4 className="text-black dark:text-white text-sm font-medium truncate">{project.name}</h4>
                    </div>
                    {project.description && (
                        <p className="text-black/40 dark:text-white/40 text-[10px] font-mono mt-1 ml-3.5 truncate">{project.description}</p>
                    )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {showActions && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); onArchive(); }}
                                className="p-1 text-black/30 dark:text-white/30 hover:text-amber-400 transition-colors"
                                title="Archive"
                            >
                                <Archive size={12} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                className="p-1 text-black/30 dark:text-white/30 hover:text-red-400 transition-colors"
                                title="Delete"
                            >
                                <Trash2 size={12} />
                            </button>
                        </>
                    )}
                    {hasChildren && (
                        <span className="text-black/30 dark:text-white/30 text-[9px] font-mono bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-[2px]">
                            {project.children?.length}
                        </span>
                    )}
                    <ChevronRight size={14} className="text-black/20 dark:text-white/20 group-hover:text-black/40 dark:group-hover:text-white/40" />
                </div>
            </div>
            {/* Progress bar */}
            {(project.task_count || 0) > 0 && (
                <div className="mt-2 ml-3.5">
                    <ProgressBar progress={progress} color={progress > 70 ? 'emerald' : progress > 30 ? 'amber' : 'red'} />
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-black/30 dark:text-white/30 text-[9px] font-mono">
                            {project.completed_task_count || 0}/{project.task_count || 0} tasks
                        </span>
                        <span className="text-black/30 dark:text-white/30 text-[9px] font-mono">{progress}%</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// Create/Edit Project Modal
function CreateProjectModal({
    isOpen,
    parentProject,
    parentQuadrant,
    onClose,
    onSubmit
}: {
    isOpen: boolean;
    parentProject?: Project | null;
    parentQuadrant?: Quadrant | null;
    onClose: () => void;
    onSubmit: (data: { name: string; description: string; quadrant: QuadrantId | null; parentId: number | null }) => void;
}) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [quadrant, setQuadrant] = useState<QuadrantId | null>(parentQuadrant?.id || null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setName('');
            setDescription('');
            setQuadrant(parentQuadrant?.id || null);
        }
    }, [isOpen, parentQuadrant]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            await onSubmit({
                name: name.trim(),
                description: description.trim(),
                quadrant,
                parentId: parentProject?.id || null
            });
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 rounded-[2px] w-full max-w-lg overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
                    <h2 className="font-display font-bold text-black dark:text-white text-lg">
                        {parentProject ? `New Sub-Project` : 'New Project'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-[2px] transition-colors"
                    >
                        <X size={18} className="text-black/60 dark:text-white/60" />
                    </button>
                </div>

                {/* Parent info */}
                {parentProject && (
                    <div className="px-6 py-3 bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10">
                        <div className="flex items-center gap-2 text-xs font-mono text-black/50 dark:text-white/50">
                            <FolderKanban size={12} />
                            <span>Sub-project of:</span>
                            <span className="text-black dark:text-white">{parentProject.name}</span>
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Project Name */}
                    <div>
                        <label className="block text-xs font-mono text-black/50 dark:text-white/50 uppercase tracking-wider mb-2">
                            Project Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Enter project name..."
                            className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px] text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 focus:outline-none focus:border-amber-500/50 transition-colors"
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-mono text-black/50 dark:text-white/50 uppercase tracking-wider mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Optional description..."
                            rows={3}
                            className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px] text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
                        />
                    </div>

                    {/* Quadrant Selection */}
                    {!parentProject && (
                        <div>
                            <label className="block text-xs font-mono text-black/50 dark:text-white/50 uppercase tracking-wider mb-2">
                                Quadrant
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {QUADRANTS.map(q => {
                                    const QIcon = q.icon;
                                    const isSelected = quadrant === q.id;
                                    return (
                                        <button
                                            key={q.id}
                                            type="button"
                                            onClick={() => setQuadrant(isSelected ? null : q.id)}
                                            className={`flex items-center gap-2 px-3 py-2.5 border rounded-[2px] transition-all ${
                                                isSelected
                                                    ? `${q.bgColor} ${q.borderColor} ${q.color}`
                                                    : 'border-black/10 dark:border-white/10 text-black/50 dark:text-white/50 hover:border-black/20 dark:hover:border-white/20'
                                            }`}
                                        >
                                            <QIcon size={16} className={isSelected ? q.color : ''} />
                                            <span className="text-sm font-mono">{q.name}</span>
                                            {isSelected && <CheckCircle2 size={14} className="ml-auto" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-sm font-mono text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 rounded-[2px] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || isSubmitting}
                            className="flex-1 px-4 py-2.5 text-sm font-mono bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-[2px] transition-colors flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus size={16} />
                                    Create {parentProject ? 'Sub-Project' : 'Project'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Project status options
type ProjectStatus = 'active' | 'paused' | 'blocked' | 'completed' | 'archived';

const PROJECT_STATUSES: { value: ProjectStatus; label: string; color: string; bgColor: string }[] = [
    { value: 'active', label: 'Active', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
    { value: 'paused', label: 'Paused', color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
    { value: 'blocked', label: 'Blocked', color: 'text-red-400', bgColor: 'bg-red-500/10' },
    { value: 'completed', label: 'Completed', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
    { value: 'archived', label: 'Archived', color: 'text-black/40 dark:text-white/40', bgColor: 'bg-black/5 dark:bg-white/5' }
];

// Health label calculation
function getProjectHealth(project: Project): { label: string; color: string; bgColor: string; borderColor: string } {
    const taskCount = project.task_count || 0;
    const completedCount = project.completed_task_count || 0;
    const progress = project.progress || 0;
    const childCount = project.children?.length || 0;

    // No tasks or children = needs setup
    if (taskCount === 0 && childCount === 0) {
        return { label: 'Needs Setup', color: 'text-black/50 dark:text-white/50', bgColor: 'bg-black/5 dark:bg-white/5', borderColor: 'border-black/10 dark:border-white/10' };
    }

    // 100% complete = done
    if (progress === 100) {
        return { label: 'Complete', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' };
    }

    // Good progress (>60%)
    if (progress >= 60) {
        return { label: 'Healthy', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' };
    }

    // Some progress (30-60%)
    if (progress >= 30) {
        return { label: 'On Track', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' };
    }

    // Low progress (<30%) but has tasks
    if (taskCount > 0 && progress < 30) {
        return { label: 'Needs Attention', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' };
    }

    // Default
    return { label: 'In Progress', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' };
}

// Project Drilldown Modal
function ProjectDrilldownModal({
    project,
    quadrant,
    breadcrumb,
    onClose,
    onSelectChild,
    onNavigateTo,
    onCreateChild,
    onToggleTask,
    onAddTask,
    onUpdateQuadrant,
    onUpdateStatus,
    onReorderChildren
}: {
    project: Project;
    quadrant: Quadrant;
    breadcrumb: Array<{ project: Project; quadrant: Quadrant }>;
    onClose: () => void;
    onSelectChild: (p: Project) => void;
    onNavigateTo: (index: number) => void;
    onCreateChild: () => void;
    onToggleTask: (t: Task) => void;
    onAddTask?: (p: Project) => void;
    onUpdateQuadrant: (quadrantId: QuadrantId | null) => void;
    onUpdateStatus: (status: ProjectStatus) => void;
    onReorderChildren: (orderedIds: number[]) => void;
}) {
    const [showQuadrantPicker, setShowQuadrantPicker] = useState(false);
    const [showStatusPicker, setShowStatusPicker] = useState(false);
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [dragOverId, setDragOverId] = useState<number | null>(null);
    const [localChildren, setLocalChildren] = useState<Project[]>(project.children || []);
    const Icon = quadrant.icon;
    const hasChildren = project.children && project.children.length > 0;
    const hasTasks = project.tasks && project.tasks.length > 0;
    const isNested = breadcrumb.length > 1;

    // Sync local children when project changes
    useEffect(() => {
        setLocalChildren(project.children || []);
    }, [project.children]);

    const handleDragStart = (e: React.DragEvent, childId: number) => {
        setDraggedId(childId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, childId: number) => {
        e.preventDefault();
        if (draggedId !== childId) {
            setDragOverId(childId);
        }
    };

    const handleDragLeave = () => {
        setDragOverId(null);
    };

    const handleDrop = (e: React.DragEvent, targetId: number) => {
        e.preventDefault();
        if (draggedId === null || draggedId === targetId) return;

        const draggedIndex = localChildren.findIndex(c => c.id === draggedId);
        const targetIndex = localChildren.findIndex(c => c.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        // Reorder the array
        const newChildren = [...localChildren];
        const [draggedItem] = newChildren.splice(draggedIndex, 1);
        newChildren.splice(targetIndex, 0, draggedItem);

        setLocalChildren(newChildren);
        onReorderChildren(newChildren.map(c => c.id));

        setDraggedId(null);
        setDragOverId(null);
    };

    const handleDragEnd = () => {
        setDraggedId(null);
        setDragOverId(null);
    };

    // Calculate progress including sub-projects
    const calculateTotalProgress = () => {
        let totalTasks = project.task_count || 0;
        let completedTasks = project.completed_task_count || 0;

        // Include sub-project progress
        if (project.children) {
            project.children.forEach(child => {
                totalTasks += child.task_count || 0;
                completedTasks += child.completed_task_count || 0;
            });
        }

        return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    };

    const totalProgress = calculateTotalProgress();
    const health = getProjectHealth(project);
    const currentStatus = PROJECT_STATUSES.find(s => s.value === project.status) || PROJECT_STATUSES[0];

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 rounded-[2px] w-full max-w-5xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Breadcrumb Navigation */}
                {isNested && (
                    <div className="px-6 py-3 bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 flex items-center gap-2 overflow-x-auto">
                        {breadcrumb.map((item, index) => (
                            <React.Fragment key={item.project.id}>
                                {index > 0 && (
                                    <ChevronRight size={14} className="text-black/20 dark:text-white/20 flex-shrink-0" />
                                )}
                                <button
                                    onClick={() => onNavigateTo(index)}
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded-[2px] text-xs font-mono transition-colors flex-shrink-0 ${
                                        index === breadcrumb.length - 1
                                            ? `${item.quadrant.bgColor} ${item.quadrant.color} border ${item.quadrant.borderColor}`
                                            : 'text-black/50 dark:text-white/50 hover:text-black/80 dark:hover:text-white/80 hover:bg-black/5 dark:hover:bg-white/5'
                                    }`}
                                >
                                    {index === 0 && <ChevronLeft size={12} />}
                                    <span className="truncate max-w-[150px]">{item.project.name}</span>
                                </button>
                            </React.Fragment>
                        ))}
                    </div>
                )}

                {/* Header */}
                <div className={`relative p-6 border-b border-black/10 dark:border-white/10 ${quadrant.bgColor}`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${quadrant.bgColor.replace('/10', '')}`}></div>
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-[2px] transition-colors">
                        <X size={20} className="text-black/60 dark:text-white/60" />
                    </button>

                    <div className="flex items-start gap-4">
                        <div className={`p-3 ${quadrant.bgColor} border ${quadrant.borderColor} rounded-[2px]`}>
                            <Icon size={24} className={quadrant.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                                <h2 className="font-display font-bold text-black dark:text-white text-2xl">{project.name}</h2>
                                {/* Health Label */}
                                <div className={`px-3 py-1 ${health.bgColor} border ${health.borderColor} rounded-[2px] flex-shrink-0`}>
                                    <span className={`text-xs font-mono ${health.color}`}>{health.label}</span>
                                </div>
                            </div>

                            {/* Quadrant & Status Selectors Row */}
                            <div className="flex items-center gap-3 mt-2">
                                {/* Quadrant Selector */}
                                <div className="relative inline-block">
                                    <button
                                        onClick={() => { setShowQuadrantPicker(!showQuadrantPicker); setShowStatusPicker(false); }}
                                        className={`flex items-center gap-1.5 px-2 py-1 ${quadrant.bgColor} border ${quadrant.borderColor} rounded-[2px] text-xs font-mono ${quadrant.color} hover:opacity-80 transition-opacity`}
                                    >
                                        {project.quadrant ? quadrant.name : 'No Quadrant'}
                                        <ChevronRight size={12} className={`transform ${showQuadrantPicker ? 'rotate-90' : ''} transition-transform`} />
                                    </button>
                                    {showQuadrantPicker && (
                                        <div className="absolute left-0 top-full mt-1 bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 rounded-[2px] shadow-lg z-10 min-w-[150px]">
                                            {QUADRANTS.map(q => {
                                                const QIcon = q.icon;
                                                const isSelected = project.quadrant === q.id;
                                                return (
                                                    <button
                                                        key={q.id}
                                                        onClick={() => {
                                                            onUpdateQuadrant(q.id);
                                                            setShowQuadrantPicker(false);
                                                        }}
                                                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-mono hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${isSelected ? q.bgColor : ''}`}
                                                    >
                                                        <QIcon size={14} className={q.color} />
                                                        <span className={isSelected ? q.color : 'text-black/60 dark:text-white/60'}>{q.name}</span>
                                                        {isSelected && <CheckCircle2 size={12} className={q.color} />}
                                                    </button>
                                                );
                                            })}
                                            {project.quadrant && (
                                                <>
                                                    <div className="border-t border-black/5 dark:border-white/5" />
                                                    <button
                                                        onClick={() => {
                                                            onUpdateQuadrant(null);
                                                            setShowQuadrantPicker(false);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-black/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                                    >
                                                        <X size={14} />
                                                        <span>Remove Quadrant</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Status Dropdown */}
                                <div className="relative inline-block">
                                    <button
                                        onClick={() => { setShowStatusPicker(!showStatusPicker); setShowQuadrantPicker(false); }}
                                        className={`flex items-center gap-1.5 px-2 py-1 ${currentStatus.bgColor} border border-black/10 dark:border-white/10 rounded-[2px] text-xs font-mono ${currentStatus.color} hover:opacity-80 transition-opacity`}
                                    >
                                        {currentStatus.label}
                                        <ChevronRight size={12} className={`transform ${showStatusPicker ? 'rotate-90' : ''} transition-transform`} />
                                    </button>
                                    {showStatusPicker && (
                                        <div className="absolute left-0 top-full mt-1 bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 rounded-[2px] shadow-lg z-10 min-w-[140px]">
                                            {PROJECT_STATUSES.map(status => {
                                                const isSelected = project.status === status.value;
                                                return (
                                                    <button
                                                        key={status.value}
                                                        onClick={() => {
                                                            onUpdateStatus(status.value);
                                                            setShowStatusPicker(false);
                                                        }}
                                                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-mono hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${isSelected ? status.bgColor : ''}`}
                                                    >
                                                        <span className={isSelected ? status.color : 'text-black/60 dark:text-white/60'}>{status.label}</span>
                                                        {isSelected && <CheckCircle2 size={12} className={status.color} />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {project.description && (
                        <p className="mt-4 text-black/60 dark:text-white/60 text-sm leading-relaxed">{project.description}</p>
                    )}

                    {/* Progress Bar - Always show */}
                    <div className="mt-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-black/50 dark:text-white/50 text-xs font-mono">Overall Progress</span>
                            <span className={`text-lg font-mono font-bold ${totalProgress >= 70 ? 'text-emerald-400' : totalProgress >= 30 ? 'text-amber-400' : 'text-red-400'}`}>
                                {totalProgress}%
                            </span>
                        </div>
                        <div className="w-full h-3 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${totalProgress >= 70 ? 'bg-emerald-500' : totalProgress >= 30 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${totalProgress}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-black/40 dark:text-white/40">
                            <span>
                                {(project.completed_task_count || 0) + (project.children?.reduce((sum, c) => sum + (c.completed_task_count || 0), 0) || 0)} of {(project.task_count || 0) + (project.children?.reduce((sum, c) => sum + (c.task_count || 0), 0) || 0)} tasks
                            </span>
                            {hasChildren && (
                                <span>{project.children?.length} sub-projects included</span>
                            )}
                        </div>
                    </div>

                    {/* Quadrant Stats (for Spirit/Body) */}
                    {project.quadrant_stats && (
                        <div className="mt-4 p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px]">
                            <div className="flex items-center gap-2 mb-3">
                                <Icon size={14} className={quadrant.color} />
                                <span className="text-[10px] font-mono text-black/50 dark:text-white/50 uppercase tracking-wider">
                                    {project.quadrant === 'spirit' ? 'Meditation Stats' : project.quadrant === 'body' ? 'Fitness Stats' : 'Quadrant Stats'}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <div className="text-xl font-bold text-black dark:text-white">{project.quadrant_stats.this_week}</div>
                                    <div className="text-[10px] font-mono text-black/40 dark:text-white/40">This Week</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-black dark:text-white">{project.quadrant_stats.this_month}</div>
                                    <div className="text-[10px] font-mono text-black/40 dark:text-white/40">This Month</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-black dark:text-white">{project.quadrant_stats.total_hours}h</div>
                                    <div className="text-[10px] font-mono text-black/40 dark:text-white/40">Total</div>
                                </div>
                            </div>
                            {project.quadrant === 'body' && project.quadrant_stats.avg_steps !== undefined && (
                                <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm font-mono text-black dark:text-white">{project.quadrant_stats.avg_steps.toLocaleString()}</div>
                                        <div className="text-[10px] font-mono text-black/40 dark:text-white/40">Avg Steps/Day</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-mono text-black dark:text-white">{project.quadrant_stats.avg_sleep_hours}h</div>
                                        <div className="text-[10px] font-mono text-black/40 dark:text-white/40">Avg Sleep</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Content - Two Column Layout */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Sub-projects */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-black/50 dark:text-white/50 text-xs font-mono uppercase tracking-wider">Sub-Projects</h3>
                                <button
                                    onClick={onCreateChild}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-[2px] transition-colors"
                                >
                                    <Plus size={14} />
                                    Add Sub-Project
                                </button>
                            </div>
                            {hasChildren ? (
                                <div className="space-y-2">
                                    {localChildren.map((child, index) => {
                                        const childProgress = child.task_count ? Math.round(((child.completed_task_count || 0) / child.task_count) * 100) : 0;
                                        const childHealth = getProjectHealth(child);
                                        const isDragging = draggedId === child.id;
                                        const isDragOver = dragOverId === child.id;
                                        return (
                                            <div
                                                key={child.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, child.id)}
                                                onDragOver={(e) => handleDragOver(e, child.id)}
                                                onDragLeave={handleDragLeave}
                                                onDrop={(e) => handleDrop(e, child.id)}
                                                onDragEnd={handleDragEnd}
                                                className={`p-4 bg-black/5 dark:bg-white/5 border rounded-[2px] cursor-pointer group transition-all ${
                                                    isDragging
                                                        ? 'opacity-50 border-amber-500/50'
                                                        : isDragOver
                                                            ? 'border-amber-500 bg-amber-500/5'
                                                            : 'border-black/10 dark:border-white/10 hover:bg-black/[0.07] dark:hover:bg-white/[0.07] hover:border-black/20 dark:hover:border-white/20'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* Drag Handle */}
                                                    <div
                                                        className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 -ml-1 text-black/20 dark:text-white/20 hover:text-black/40 dark:hover:text-white/40"
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                    >
                                                        <GripVertical size={14} />
                                                    </div>
                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0" onClick={() => onSelectChild(child)}>
                                                        <div className="flex items-start justify-between gap-3 mb-2">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <FolderKanban size={16} className={quadrant.color} />
                                                                <span className="text-black dark:text-white text-sm font-medium truncate">{child.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className={`px-2 py-0.5 ${childHealth.bgColor} border ${childHealth.borderColor} rounded-[2px] text-[9px] font-mono ${childHealth.color}`}>
                                                                    {childHealth.label}
                                                                </span>
                                                                <ChevronRight size={14} className="text-black/20 dark:text-white/20 group-hover:text-black/40 dark:group-hover:text-white/40" />
                                                            </div>
                                                        </div>
                                                        {(child.task_count || 0) > 0 && (
                                                            <div className="mt-3">
                                                                <ProgressBar progress={childProgress} color={childProgress >= 70 ? 'emerald' : childProgress >= 30 ? 'amber' : 'red'} />
                                                                <div className="flex items-center justify-between mt-1">
                                                                    <span className="text-black/30 dark:text-white/30 text-[9px] font-mono">
                                                                        {child.completed_task_count || 0}/{child.task_count} tasks
                                                                    </span>
                                                                    <span className="text-black/40 dark:text-white/40 text-[9px] font-mono">{childProgress}%</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {localChildren.length > 1 && (
                                        <p className="text-[10px] font-mono text-black/30 dark:text-white/30 text-center pt-2">
                                            Drag to reorder priority
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 rounded-[2px]">
                                    <FolderKanban size={24} className="mx-auto text-black/20 dark:text-white/20 mb-2" />
                                    <p className="text-black/30 dark:text-white/30 text-xs font-mono">No sub-projects yet</p>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Tasks */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-black/50 dark:text-white/50 text-xs font-mono uppercase tracking-wider">Tasks</h3>
                                <div className="flex items-center gap-2">
                                    {hasTasks && (
                                        <span className="text-black/30 dark:text-white/30 text-[10px] font-mono">
                                            {project.tasks?.filter(t => t.completed_at).length || 0}/{project.tasks?.length || 0} done
                                        </span>
                                    )}
                                    <button
                                        onClick={() => onAddTask && onAddTask(project)}
                                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/30 rounded-[2px] transition-colors"
                                    >
                                        <Plus size={12} />
                                        Add Task
                                    </button>
                                </div>
                            </div>
                            {hasTasks ? (
                                <div className="space-y-2">
                                    {project.tasks?.map(task => (
                                        <div
                                            key={task.id}
                                            className="flex items-center gap-3 p-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px] hover:bg-black/[0.07] dark:hover:bg-white/[0.07] cursor-pointer transition-colors"
                                            onClick={() => onToggleTask(task)}
                                        >
                                            {task.completed_at ? (
                                                <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                                            ) : (
                                                <Circle size={18} className="text-black/30 dark:text-white/30 hover:text-black/50 dark:hover:text-white/50 flex-shrink-0" />
                                            )}
                                            <span className={`text-sm flex-1 ${task.completed_at ? 'text-black/40 dark:text-white/40 line-through' : 'text-black dark:text-white'}`}>
                                                {task.title}
                                            </span>
                                            {task.priority === 'high' && !task.completed_at && (
                                                <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] font-mono rounded-[2px]">HIGH</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 rounded-[2px]">
                                    <Circle size={24} className="mx-auto text-black/20 dark:text-white/20 mb-2" />
                                    <p className="text-black/30 dark:text-white/30 text-xs font-mono">No tasks yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Empty state for both */}
                    {!hasChildren && !hasTasks && (
                        <div className="text-center py-16 -mt-6">
                            <div className="w-16 h-16 mx-auto mb-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-sm flex items-center justify-center">
                                <FolderKanban className="text-black/20 dark:text-white/20" size={28} />
                            </div>
                            <p className="text-black/50 dark:text-white/50 text-sm font-mono mb-2">This project is empty</p>
                            <p className="text-black/30 dark:text-white/30 text-xs font-mono mb-6">Add sub-projects to break down this project</p>
                            <button
                                onClick={onCreateChild}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-black text-sm font-mono hover:bg-amber-400 transition-colors rounded-[2px]"
                            >
                                <Plus size={16} />
                                Add Sub-Project
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Projects List View - Full width cards with expandable sub-projects
function ProjectsListView({
    projects,
    onSelectProject,
    onArchive,
    onDelete,
    onCreateProject
}: {
    projects: Project[];
    onSelectProject: (p: Project, q: Quadrant) => void;
    onArchive: (p: Project) => void;
    onDelete: (p: Project) => void;
    onCreateProject: () => void;
}) {
    // Only top-level projects
    const topLevelProjects = projects.filter(p => !p.parent_id);
    const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());

    const toggleExpand = (projectId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedProjects(prev => {
            const next = new Set(prev);
            if (next.has(projectId)) {
                next.delete(projectId);
            } else {
                next.add(projectId);
            }
            return next;
        });
    };

    return (
        <div className="space-y-4">
            {/* Header row with New Project button */}
            <div className="flex items-center justify-end">
                <button
                    onClick={onCreateProject}
                    className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-black text-xs font-mono hover:bg-amber-400 transition-colors rounded-[2px]"
                >
                    <Plus size={14} />
                    New Project
                </button>
            </div>

            {/* Full-width Project Cards */}
            {topLevelProjects.length > 0 ? (
                <div className="space-y-3">
                    {topLevelProjects.map(project => {
                        const quadrant = project.quadrant ? getQuadrantConfig(project.quadrant as QuadrantId) : null;
                        const displayQuadrant = quadrant || QUADRANTS[0];
                        const Icon = quadrant?.icon || FolderKanban;
                        const hasChildren = project.children && project.children.length > 0;
                        const progress = project.progress || 0;
                        const health = getProjectHealth(project);
                        const status = PROJECT_STATUSES.find(s => s.value === project.status) || PROJECT_STATUSES[0];
                        const isExpanded = expandedProjects.has(project.id);

                        return (
                            <div key={project.id} className="stealth-card overflow-hidden">
                                {/* Main Card Content */}
                                <div
                                    className="p-4 group hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all cursor-pointer"
                                    onClick={() => onSelectProject(project, displayQuadrant)}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Icon */}
                                        <div className={`p-2.5 ${quadrant ? quadrant.bgColor : 'bg-black/5 dark:bg-white/5'} border ${quadrant ? quadrant.borderColor : 'border-black/10 dark:border-white/10'} rounded-[2px] flex-shrink-0`}>
                                            <Icon size={20} className={quadrant ? quadrant.color : 'text-black/40 dark:text-white/40'} />
                                        </div>

                                        {/* Project Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-black dark:text-white font-medium">{project.name}</h4>
                                                <span className={`px-2 py-0.5 ${status.bgColor} border border-black/10 dark:border-white/10 rounded-[2px] text-[9px] font-mono ${status.color}`}>
                                                    {status.label}
                                                </span>
                                                <span className={`px-2 py-0.5 ${health.bgColor} border ${health.borderColor} rounded-[2px] text-[9px] font-mono ${health.color}`}>
                                                    {health.label}
                                                </span>
                                                {quadrant && (
                                                    <span className={`text-[10px] font-mono ${quadrant.color}`}>{quadrant.name}</span>
                                                )}
                                            </div>
                                            {project.description && (
                                                <p className="text-black/40 dark:text-white/40 text-xs mt-1 line-clamp-1">{project.description}</p>
                                            )}
                                        </div>

                                        {/* Progress & Stats */}
                                        <div className="flex items-center gap-6 flex-shrink-0">
                                            {/* Task count */}
                                            <div className="text-right">
                                                <div className="text-xs font-mono text-black/60 dark:text-white/60">
                                                    {project.completed_task_count || 0}/{project.task_count || 0} tasks
                                                </div>
                                                {hasChildren && (
                                                    <div className="text-[10px] font-mono text-black/30 dark:text-white/30">
                                                        {project.children?.length} sub-projects
                                                    </div>
                                                )}
                                            </div>

                                            {/* Progress bar */}
                                            <div className="w-32">
                                                <ProgressBar progress={progress} color={progress >= 70 ? 'emerald' : progress >= 30 ? 'amber' : 'red'} />
                                                <div className="text-right mt-0.5">
                                                    <span className="text-[10px] font-mono text-black/40 dark:text-white/40">{progress}%</span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onArchive(project); }}
                                                    className="p-1.5 text-black/30 dark:text-white/30 hover:text-amber-400 transition-colors"
                                                    title="Archive"
                                                >
                                                    <Archive size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDelete(project); }}
                                                    className="p-1.5 text-black/30 dark:text-white/30 hover:text-red-400 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>

                                            {/* Expand toggle for sub-projects */}
                                            {hasChildren && (
                                                <button
                                                    onClick={(e) => toggleExpand(project.id, e)}
                                                    className={`p-1.5 text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60 transition-all ${isExpanded ? 'rotate-180' : ''}`}
                                                    title={isExpanded ? 'Hide sub-projects' : 'Show sub-projects'}
                                                >
                                                    <ChevronDown size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expandable Sub-projects */}
                                {hasChildren && isExpanded && (
                                    <div className="border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
                                        {project.children?.map(child => {
                                            const childProgress = child.task_count ? Math.round(((child.completed_task_count || 0) / child.task_count) * 100) : 0;
                                            const childHealth = getProjectHealth(child);
                                            const childStatus = PROJECT_STATUSES.find(s => s.value === child.status) || PROJECT_STATUSES[0];

                                            return (
                                                <div
                                                    key={child.id}
                                                    className="px-4 py-3 pl-16 flex items-center gap-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer border-b border-black/5 dark:border-white/5 last:border-b-0"
                                                    onClick={() => onSelectProject(child, displayQuadrant)}
                                                >
                                                    <FolderKanban size={14} className={quadrant ? quadrant.color : 'text-black/30 dark:text-white/30'} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-black dark:text-white text-sm">{child.name}</span>
                                                            <span className={`px-1.5 py-0.5 ${childStatus.bgColor} border border-black/10 dark:border-white/10 rounded-[2px] text-[8px] font-mono ${childStatus.color}`}>
                                                                {childStatus.label}
                                                            </span>
                                                            <span className={`px-1.5 py-0.5 ${childHealth.bgColor} border ${childHealth.borderColor} rounded-[2px] text-[8px] font-mono ${childHealth.color}`}>
                                                                {childHealth.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] font-mono text-black/40 dark:text-white/40">
                                                        {child.completed_task_count || 0}/{child.task_count || 0} tasks
                                                    </div>
                                                    <div className="w-24">
                                                        <ProgressBar progress={childProgress} color={childProgress >= 70 ? 'emerald' : childProgress >= 30 ? 'amber' : 'red'} />
                                                    </div>
                                                    <span className="text-[10px] font-mono text-black/40 dark:text-white/40 w-8 text-right">{childProgress}%</span>
                                                    <ChevronRight size={14} className="text-black/20 dark:text-white/20" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="stealth-card p-12 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-sm flex items-center justify-center">
                        <FolderKanban className="text-black/20 dark:text-white/20" size={20} />
                    </div>
                    <p className="text-black/40 dark:text-white/40 text-sm font-mono mb-4">No projects yet</p>
                    <button
                        onClick={onCreateProject}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-black text-sm font-mono hover:bg-amber-400 transition-colors rounded-[2px]"
                    >
                        <Plus size={14} />
                        Create Your First Project
                    </button>
                </div>
            )}
        </div>
    );
}

export default function Projects({ auth }: ProjectsProps) {
    const [altitude, setAltitude] = useState<AltitudeLevel>('projects');
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant | null>(null);
    const [selectedProject, setSelectedProject] = useState<{ project: Project; quadrant: Quadrant } | null>(null);
    const [breadcrumb, setBreadcrumb] = useState<Array<{ project: Project; quadrant: Quadrant }>>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createModalParent, setCreateModalParent] = useState<{ project: Project; quadrant: Quadrant } | null>(null);
    const [quadrantStats, setQuadrantStats] = useState<QuadrantHealthStats | null>(null);
    const [taskCreationProject, setTaskCreationProject] = useState<Project | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const projectsRes = await window.axios.get('/api/projects', { params: { status: 'active', with: 'children,tasks' } });
            setProjects(projectsRes.data);

            // Fetch quadrant stats separately so it doesn't block core data
            try {
                const statsRes = await window.axios.get('/api/quadrants/stats');
                setQuadrantStats(statsRes.data);
            } catch (statsError) {
                console.error('Failed to fetch quadrant stats:', statsError);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleArchive = async (project: Project) => {
        setProjects(prev => prev.filter(p => p.id !== project.id));
        try {
            await window.axios.put(`/api/projects/${project.id}`, { status: 'archived' });
        } catch (error) {
            console.error('Failed to archive project:', error);
            fetchData();
        }
    };

    const handleDelete = async (project: Project) => {
        if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
        setProjects(prev => prev.filter(p => p.id !== project.id));
        try {
            await window.axios.delete(`/api/projects/${project.id}`);
        } catch (error) {
            console.error('Failed to delete project:', error);
            fetchData();
        }
    };

    const handleToggleTask = async (task: Task) => {
        const wasCompleted = !!task.completed_at;
        const newCompletedAt = wasCompleted ? null : new Date().toISOString();

        // Helper to update tasks in a project recursively
        const updateProjectTasks = (project: Project): Project => {
            const updatedTasks = project.tasks?.map(t =>
                t.id === task.id ? { ...t, completed_at: newCompletedAt } : t
            );
            const updatedChildren = project.children?.map(updateProjectTasks);
            return { ...project, tasks: updatedTasks, children: updatedChildren };
        };

        // Update projects state (for project list)
        setProjects(prev => prev.map(updateProjectTasks));

        // Update selectedProject state (for modal view)
        if (selectedProject) {
            setSelectedProject({
                ...selectedProject,
                project: updateProjectTasks(selectedProject.project)
            });
        }

        // Update breadcrumb to reflect changes
        setBreadcrumb(prev => prev.map(item => ({
            ...item,
            project: updateProjectTasks(item.project)
        })));

        try {
            await window.axios.put(`/api/tasks/${task.id}`, {
                completed_at: newCompletedAt
            });
        } catch (error) {
            console.error('Failed to toggle task:', error);
            fetchData();
        }
    };

    const handleCreateTask = async () => {
        if (!taskCreationProject || !newTaskTitle.trim()) return;

        try {
            const response = await window.axios.post('/api/tasks', {
                title: newTaskTitle.trim(),
                project_id: taskCreationProject.id,
                priority: 'medium',
            });

            // Add the new task to the project
            const newTask = response.data;

            // Update projects state
            const updateProjectTasks = (project: Project): Project => {
                if (project.id === taskCreationProject.id) {
                    return {
                        ...project,
                        tasks: [...(project.tasks || []), newTask],
                        task_count: (project.task_count || 0) + 1,
                    };
                }
                if (project.children) {
                    return { ...project, children: project.children.map(updateProjectTasks) };
                }
                return project;
            };

            setProjects(prev => prev.map(updateProjectTasks));

            // Update selectedProject state if viewing this project
            if (selectedProject && selectedProject.project.id === taskCreationProject.id) {
                setSelectedProject({
                    ...selectedProject,
                    project: updateProjectTasks(selectedProject.project)
                });
            }

            // Clear form
            setNewTaskTitle('');
            setTaskCreationProject(null);
        } catch (error) {
            console.error('Failed to create task:', error);
        }
    };

    const handleSelectProject = (project: Project, quadrant: Quadrant) => {
        setSelectedProject({ project, quadrant });
        setBreadcrumb([{ project, quadrant }]);
    };

    const handleSelectChildProject = (child: Project) => {
        if (selectedProject) {
            const quadrant = selectedProject.quadrant;
            setBreadcrumb(prev => [...prev, { project: child, quadrant }]);
            setSelectedProject({ project: child, quadrant });
        }
    };

    const handleNavigateTo = (index: number) => {
        if (index < breadcrumb.length) {
            const target = breadcrumb[index];
            setSelectedProject(target);
            setBreadcrumb(breadcrumb.slice(0, index + 1));
        }
    };

    const handleCreateProject = () => {
        setCreateModalParent(null);
        setShowCreateModal(true);
    };

    const handleSubmitCreateProject = async (data: { name: string; description: string; quadrant: QuadrantId | null; parentId: number | null }) => {
        try {
            await window.axios.post('/api/projects', {
                name: data.name,
                description: data.description || null,
                quadrant: data.quadrant,
                parent_id: data.parentId,
                status: 'active'
            });
            fetchData();

            // If creating a sub-project, refresh the selected project
            if (data.parentId && selectedProject) {
                const updatedProject = await window.axios.get(`/api/projects/${data.parentId}?with=children,tasks`);
                setSelectedProject({ project: updatedProject.data, quadrant: selectedProject.quadrant });
            }
        } catch (error) {
            console.error('Failed to create project:', error);
        }
    };

    const handleUpdateProjectQuadrant = async (quadrantId: QuadrantId | null) => {
        if (!selectedProject) return;
        try {
            await window.axios.put(`/api/projects/${selectedProject.project.id}`, {
                quadrant: quadrantId
            });
            // Update local state
            const newQuadrant = quadrantId ? getQuadrantConfig(quadrantId) : QUADRANTS[0];
            setSelectedProject({
                project: { ...selectedProject.project, quadrant: quadrantId },
                quadrant: newQuadrant
            });
            fetchData();
        } catch (error) {
            console.error('Failed to update project quadrant:', error);
        }
    };

    const handleUpdateProjectStatus = async (status: ProjectStatus) => {
        if (!selectedProject) return;
        try {
            await window.axios.put(`/api/projects/${selectedProject.project.id}`, {
                status: status
            });
            // Update local state
            setSelectedProject({
                ...selectedProject,
                project: { ...selectedProject.project, status: status }
            });
            fetchData();
        } catch (error) {
            console.error('Failed to update project status:', error);
        }
    };

    const handleCreateChildProject = () => {
        if (!selectedProject) return;
        setCreateModalParent(selectedProject);
        setShowCreateModal(true);
    };

    const handleReorderChildren = async (orderedIds: number[]) => {
        if (!selectedProject) return;
        try {
            const response = await window.axios.post(`/api/projects/${selectedProject.project.id}/reorder-children`, {
                ordered_ids: orderedIds
            });
            console.log('Reorder response:', response.data);
            // Refresh data to persist
            await fetchData();
            // Also refresh the selected project to update its children order
            const updatedProject = await window.axios.get(`/api/projects/${selectedProject.project.id}?with=children,tasks`);
            setSelectedProject({ project: updatedProject.data, quadrant: selectedProject.quadrant });
        } catch (error) {
            console.error('Failed to reorder children:', error);
            // Refresh to restore original order on error
            fetchData();
        }
    };

    const getHeaderInfo = () => {
        switch (altitude) {
            case 'life':
                return { title: 'Life Quadrants', subtitle: 'Human 3.0 Development', count: 4 };
            case 'projects':
                return { title: 'Active Projects', subtitle: '', count: projects.filter(p => !p.parent_id).length };
        }
    };

    const headerInfo = getHeaderInfo();

    return (
        <AppLayout user={auth.user}>
            <Head title="Projects" />

            <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-[1400px] mx-auto">
                {/* Altitude Tabs */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px] p-1">
                        <button
                            onClick={() => setAltitude('life')}
                            className={`px-6 py-2.5 font-mono text-xs transition-all ${altitude === 'life' ? 'bg-amber-500 text-black font-bold' : 'text-black/50 dark:text-white/50 hover:text-black/80 dark:hover:text-white/80'
                                }`}
                        >
                            <div className="flex flex-col items-center">
                                <span>Life</span>
                                <span className="text-[9px] opacity-60">30,000 ft</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setAltitude('projects')}
                            className={`px-6 py-2.5 font-mono text-xs transition-all ${altitude === 'projects' ? 'bg-amber-500 text-black font-bold' : 'text-black/50 dark:text-white/50 hover:text-black/80 dark:hover:text-white/80'
                                }`}
                        >
                            <div className="flex flex-col items-center">
                                <span>Projects</span>
                                <span className="text-[9px] opacity-60">10,000 ft</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Section Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <span className="text-black/60 dark:text-white/60 font-display text-sm">{headerInfo.title}</span>
                        <span className="text-black/30 dark:text-white/30 font-mono text-xs">({headerInfo.count})</span>
                    </div>
                    <div className="text-black/40 dark:text-white/40 text-xs font-mono">{headerInfo.subtitle}</div>
                </div>

                {/* Content based on altitude */}
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="stealth-card p-5 animate-pulse">
                                <div className="h-5 bg-black/10 dark:bg-white/10 rounded w-1/3 mb-4"></div>
                                <div className="h-2 bg-black/5 dark:bg-white/5 rounded w-full mb-2"></div>
                                <div className="h-2 bg-black/5 dark:bg-white/5 rounded w-2/3"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {altitude === 'life' && <LifeQuadrantsView onSelectQuadrant={setSelectedQuadrant} healthStats={quadrantStats} />}
                        {altitude === 'projects' && (
                            <ProjectsListView
                                projects={projects}
                                onSelectProject={handleSelectProject}
                                onArchive={handleArchive}
                                onDelete={handleDelete}
                                onCreateProject={handleCreateProject}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Quadrant Detail Modal (Life View) */}
            {selectedQuadrant && (
                <QuadrantModal
                    quadrant={selectedQuadrant}
                    onClose={() => setSelectedQuadrant(null)}
                />
            )}

            {/* Project Drilldown Modal (Projects View) */}
            {selectedProject && (
                <ProjectDrilldownModal
                    project={selectedProject.project}
                    quadrant={selectedProject.quadrant}
                    breadcrumb={breadcrumb}
                    onClose={() => {
                        setSelectedProject(null);
                        setBreadcrumb([]);
                    }}
                    onSelectChild={handleSelectChildProject}
                    onNavigateTo={handleNavigateTo}
                    onCreateChild={handleCreateChildProject}
                    onToggleTask={handleToggleTask}
                    onAddTask={(project) => setTaskCreationProject(project)}
                    onUpdateQuadrant={handleUpdateProjectQuadrant}
                    onUpdateStatus={handleUpdateProjectStatus}
                    onReorderChildren={handleReorderChildren}
                />
            )}

            {/* Create Project Modal */}
            <CreateProjectModal
                isOpen={showCreateModal}
                parentProject={createModalParent?.project}
                parentQuadrant={createModalParent?.quadrant}
                onClose={() => {
                    setShowCreateModal(false);
                    setCreateModalParent(null);
                }}
                onSubmit={handleSubmitCreateProject}
            />

            {/* Task Creation Modal */}
            {taskCreationProject && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="stealth-card w-full max-w-md">
                        <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5">
                            <div>
                                <h3 className="font-bold font-display text-sm text-black dark:text-white tracking-wide">
                                    ADD TASK
                                </h3>
                                <p className="text-[10px] font-mono text-black/40 dark:text-white/40 mt-0.5">
                                    to {taskCreationProject.name}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setTaskCreationProject(null);
                                    setNewTaskTitle('');
                                }}
                                className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
                            >
                                <X size={16} className="text-black/50 dark:text-white/50" />
                            </button>
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleCreateTask();
                            }}
                            className="p-4 space-y-4"
                        >
                            <div>
                                <label className="block text-xs font-mono text-black/50 dark:text-white/50 mb-2">TASK TITLE</label>
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="What needs to be done?"
                                    className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px] text-sm text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTaskCreationProject(null);
                                        setNewTaskTitle('');
                                    }}
                                    className="flex-1 py-2 text-sm font-mono text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newTaskTitle.trim()}
                                    className="flex-1 py-2 text-sm font-mono bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-[2px] transition-colors"
                                >
                                    Add Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

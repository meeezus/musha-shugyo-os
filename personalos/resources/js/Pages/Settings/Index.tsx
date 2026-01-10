import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import {
    Settings,
    Sun,
    Moon,
    Cpu,
    ChevronRight
} from 'lucide-react';
import { User } from '@/types';

interface SettingsProps {
    auth: {
        user: User;
    };
}

export default function SettingsIndex({ auth }: SettingsProps) {
    const { theme, toggleTheme } = useTheme();

    return (
        <AppLayout user={auth.user}>
            <Head title="System Config" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-[2px]">
                        <Settings size={20} className="text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-display font-bold text-black dark:text-white">
                            SYSTEM CONFIG
                        </h2>
                        <p className="text-xs font-mono text-black/50 dark:text-white/40">
                            Customize your MSOS experience
                        </p>
                    </div>
                </div>

                {/* Appearance Section */}
                <div className="space-y-3">
                    <h3 className="text-xs font-mono text-black/50 dark:text-white/40 uppercase tracking-wider px-1">
                        Appearance
                    </h3>

                    {/* Theme Toggle */}
                    <div className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px] p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {theme === 'dark' ? (
                                    <Moon size={18} className="text-blue-400" />
                                ) : (
                                    <Sun size={18} className="text-amber-500" />
                                )}
                                <div>
                                    <div className="text-sm font-medium text-black dark:text-white">
                                        Theme
                                    </div>
                                    <div className="text-xs font-mono text-black/50 dark:text-white/40">
                                        {theme === 'dark' ? 'Dark mode (stealth)' : 'Light mode (daylight)'}
                                    </div>
                                </div>
                            </div>

                            {/* Toggle Switch */}
                            <button
                                onClick={toggleTheme}
                                className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
                                    theme === 'dark'
                                        ? 'bg-emerald-500/20 border border-emerald-500/30'
                                        : 'bg-amber-500/20 border border-amber-500/30'
                                }`}
                            >
                                <div
                                    className={`absolute top-0.5 w-6 h-6 rounded-full transition-all duration-200 flex items-center justify-center ${
                                        theme === 'dark'
                                            ? 'left-0.5 bg-emerald-500'
                                            : 'left-7 bg-amber-500'
                                    }`}
                                >
                                    {theme === 'dark' ? (
                                        <Moon size={14} className="text-white" />
                                    ) : (
                                        <Sun size={14} className="text-white" />
                                    )}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* System Section */}
                <div className="space-y-3">
                    <h3 className="text-xs font-mono text-black/50 dark:text-white/40 uppercase tracking-wider px-1">
                        System
                    </h3>

                    {/* API Usage Link */}
                    <Link
                        href="/settings/usage"
                        className="block bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px] p-4 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Cpu size={18} className="text-emerald-500" />
                                <div>
                                    <div className="text-sm font-medium text-black dark:text-white">
                                        API Usage
                                    </div>
                                    <div className="text-xs font-mono text-black/50 dark:text-white/40">
                                        Token consumption & cost analytics
                                    </div>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-black/30 dark:text-white/30" />
                        </div>
                    </Link>
                </div>

                {/* Version Info */}
                <div className="pt-6 border-t border-black/10 dark:border-white/10">
                    <div className="text-xs font-mono text-black/30 dark:text-white/30 text-center">
                        MUSHA SHUGYO OS v1.0 // STEALTH BUILD
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

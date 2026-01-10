import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    Home,
    FolderKanban,
    Calendar,
    Users,
    Sword,
    BookOpen,
    Sparkles,
    Feather,
    Settings,
    LogOut,
    Cpu,
    ChevronDown,
    ChevronUp,
    Menu,
    X
} from 'lucide-react';

interface ApiUsage {
    today: {
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
}

interface SidebarProps {
    user: {
        name: string;
        email: string;
    };
    apiUsage?: ApiUsage;
    isOpen?: boolean;
    onToggle?: () => void;
}

const navItems = [
    { icon: Home, label: 'COMMAND', path: '/' },
    { icon: FolderKanban, label: 'PROJECTS', path: '/projects' },
    { icon: Calendar, label: 'SCHEDULE', path: '/calendar' },
    { icon: Users, label: 'RELATIONSHIPS', path: '/contacts' },
    { icon: Sword, label: 'TRAINING LOG', path: '/training' },
    { icon: BookOpen, label: 'KNOWLEDGE', path: '/knowledge' },
    { icon: Sparkles, label: 'SPARKFILE', path: '/sparkfile' },
    { icon: Feather, label: 'CONTENT', path: '/content-ralph' },
];

export default function Sidebar({ user, apiUsage, isOpen = true, onToggle }: SidebarProps) {
    const { url } = usePage();
    const [showApiUsage, setShowApiUsage] = useState(false);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Close sidebar when navigating on mobile
    const handleNavClick = () => {
        if (onToggle && window.innerWidth < 768) {
            onToggle();
        }
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed md:relative z-50
                w-64 bg-[#f5f5f5]/95 dark:bg-[#050505]/95 backdrop-blur-sm border-r border-black/10 dark:border-white/10
                flex flex-col h-screen text-black/40 dark:text-white/40 font-medium text-sm flex-shrink-0
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
            `}>
            {/* Branding */}
            <div className="p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] md:pt-6 flex items-center gap-4 text-black dark:text-white mb-2">
                <div className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-sm flex items-center justify-center font-bold text-lg">
                    武
                </div>
                <div>
                    <h1 className="font-display font-bold text-sm tracking-[0.1em] uppercase leading-none">
                        Musha Shugyo
                    </h1>
                    <span className="text-[10px] text-black/30 dark:text-white/30 font-mono">
                        OS v1.0 // STEALTH
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = url === item.path || (item.path !== '/' && url.startsWith(item.path));
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            onClick={handleNavClick}
                            className={`flex items-center gap-3 px-3 py-3 rounded-[2px] transition-all duration-200 group ${
                                isActive
                                    ? 'bg-white/5 text-white/90 border-l-2 border-white/40'
                                    : 'hover:bg-white/5 hover:text-white/70 border-l-2 border-transparent'
                            }`}
                        >
                            <Icon
                                size={16}
                                className={isActive ? 'text-white/70' : 'text-white/30 group-hover:text-white/60'}
                            />
                            <span className="font-mono text-xs tracking-wide">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* API Usage Widget */}
            {apiUsage && (
                <div className="px-3 mb-2">
                    <div className="flex items-center">
                        <Link
                            href="/settings/usage"
                            className="flex-1 flex items-center gap-3 px-3 py-2 rounded-l-[2px] transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
                        >
                            <Cpu size={16} />
                            <span className="font-mono text-xs tracking-wide">API USAGE</span>
                            <span className="text-[10px] font-mono text-white/50">
                                ${apiUsage.today.cost_usd.toFixed(4)}
                            </span>
                        </Link>
                        <button
                            onClick={() => setShowApiUsage(!showApiUsage)}
                            className="px-2 py-2 rounded-r-[2px] transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
                        >
                            {showApiUsage ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                    </div>
                    {showApiUsage && (
                        <div className="mt-1 mx-3 p-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px] text-[10px] font-mono space-y-2">
                            <div className="text-black/60 dark:text-white/60 uppercase tracking-wider mb-2">Today</div>
                            <div className="flex justify-between text-black/40 dark:text-white/40">
                                <span>Requests</span>
                                <span className="text-black dark:text-white">{apiUsage.today.requests}</span>
                            </div>
                            <div className="flex justify-between text-black/40 dark:text-white/40">
                                <span>Input Tokens</span>
                                <span className="text-black dark:text-white">{apiUsage.today.input_tokens.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-black/40 dark:text-white/40">
                                <span>Output Tokens</span>
                                <span className="text-black dark:text-white">{apiUsage.today.output_tokens.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-black/40 dark:text-white/40 pt-1 border-t border-black/10 dark:border-white/10">
                                <span>Cost</span>
                                <span className="text-white/50">${apiUsage.today.cost_usd.toFixed(4)}</span>
                            </div>

                            <div className="text-black/60 dark:text-white/60 uppercase tracking-wider mt-3 mb-2">This Month</div>
                            <div className="flex justify-between text-black/40 dark:text-white/40">
                                <span>Requests</span>
                                <span className="text-black dark:text-white">{apiUsage.month.requests}</span>
                            </div>
                            <div className="flex justify-between text-black/40 dark:text-white/40">
                                <span>Tokens</span>
                                <span className="text-black dark:text-white">{(apiUsage.month.input_tokens + apiUsage.month.output_tokens).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-black/40 dark:text-white/40 pt-1 border-t border-black/10 dark:border-white/10">
                                <span>Cost</span>
                                <span className="text-white/50">${apiUsage.month.cost_usd.toFixed(4)}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Bottom Admin/User */}
            <div className="p-4 border-t border-black/10 dark:border-white/10 space-y-1">
                <Link
                    href="/settings"
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-[2px] hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white transition-colors text-black/40 dark:text-white/40 group"
                >
                    <Settings size={16} className="group-hover:rotate-90 transition-transform duration-500" />
                    <span className="font-mono text-xs">SYSTEM CONFIG</span>
                </Link>
                <button
                    onClick={() => router.post('/logout')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-[2px] hover:bg-red-500/10 hover:text-red-400 transition-colors text-black/40 dark:text-white/40 group"
                >
                    <LogOut size={16} />
                    <span className="font-mono text-xs">LOGOUT</span>
                </button>
                <div className="pt-4 flex items-center gap-3 px-3">
                    <div className="w-8 h-8 rounded-sm bg-white/5 border border-white/20 flex items-center justify-center text-white/60 font-bold text-xs">
                        {getInitials(user.name)}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white/80 text-xs font-bold font-display uppercase tracking-wider">
                            {user.name}
                        </span>
                        <span className="text-white/30 text-[10px] font-mono flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-pulse"></span>
                            SOVEREIGN MODE
                        </span>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}

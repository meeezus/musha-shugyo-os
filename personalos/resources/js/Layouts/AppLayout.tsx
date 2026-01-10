import React, { PropsWithChildren, useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import IoriTerminal from '@/Components/IoriTerminal';
import { Terminal, Menu } from 'lucide-react';

interface AppLayoutProps extends PropsWithChildren {
    user: {
        name: string;
        email: string;
    };
}

interface PageProps {
    apiUsage?: {
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
    };
}

export default function AppLayout({ children, user }: AppLayoutProps) {
    const { apiUsage } = usePage<{ props: PageProps }>().props as PageProps;
    const { url } = usePage();
    const [terminalOpen, setTerminalOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('iori_terminal_open') === 'true';
        }
        return false;
    });
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Persist terminal open state to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('iori_terminal_open', terminalOpen.toString());
        } catch (error) {
            console.warn('Failed to persist terminal state:', error);
        }
    }, [terminalOpen]);

    // Don't show the floating chat button on the chat page
    const isOnChatPage = url === '/chat';

    return (
        <div className="flex h-screen bg-[#f5f5f5] dark:bg-[#050505] text-[#1a1a1a] dark:text-[#E5E5E5] font-sans relative transition-colors duration-200">
            {/* Noise Overlay */}
            <div className="noise-overlay"></div>

            {/* Mist Gradient */}
            <div className="absolute top-0 left-0 w-full h-[50vh] bg-mist-gradient pointer-events-none z-0"></div>

            {/* Mobile Header */}
            <div className="fixed top-0 left-0 right-0 z-30 md:hidden bg-[#f5f5f5]/95 dark:bg-[#050505]/95 backdrop-blur-sm border-b border-black/10 dark:border-white/10 pt-[env(safe-area-inset-top)]">
                <div className="flex items-center justify-between p-4">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center gap-2 text-black dark:text-white">
                        <div className="w-6 h-6 bg-black dark:bg-white text-white dark:text-black rounded-sm flex items-center justify-center font-bold text-sm">
                            武
                        </div>
                        <span className="font-display font-bold text-xs tracking-[0.1em] uppercase">
                            MSOS
                        </span>
                    </div>
                    <div className="w-10" /> {/* Spacer for centering */}
                </div>
            </div>

            {/* Content wrapper */}
            <div className="flex w-full h-full relative z-10">
                <Sidebar
                    user={user}
                    apiUsage={apiUsage}
                    isOpen={sidebarOpen}
                    onToggle={() => setSidebarOpen(!sidebarOpen)}
                />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto pt-[calc(4rem+env(safe-area-inset-top))] md:pt-0">
                    {children}
                </main>
            </div>

            {/* Floating Terminal Button - only show when terminal is closed */}
            {!terminalOpen && (
                <button
                    onClick={() => setTerminalOpen(true)}
                    className="fixed bottom-4 right-4 z-50 p-3 bg-white/5 border border-white/20 rounded-[2px] text-white/50 hover:bg-white/10 hover:text-white/70 transition-colors shadow-lg"
                    title="Open Claude Code"
                >
                    <Terminal size={20} />
                </button>
            )}

            {/* Claude Code Terminal */}
            <IoriTerminal
                isOpen={terminalOpen}
                onClose={() => setTerminalOpen(false)}
            />
        </div>
    );
}

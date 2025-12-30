import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    Home, 
    Bell, 
    FolderKanban, 
    Calendar, 
    Users, 
    Video, 
    BookOpen, 
    Sparkles, 
    Settings,
    Sword
} from 'lucide-react';

const Sidebar: React.FC = () => {
    const location = useLocation();

    const navItems = [
        { icon: Home, label: 'COMMAND', path: '/' },
        { icon: FolderKanban, label: 'PROJECTS', path: '/projects' },
        { icon: Calendar, label: 'SCHEDULE', path: '/calendar' },
        { icon: Users, label: 'RELATIONSHIPS', path: '/relationships' },
        { icon: Sword, label: 'TRAINING LOG', path: '/training' },
        { icon: BookOpen, label: 'KNOWLEDGE', path: '/knowledge' },
        { icon: Sparkles, label: 'SPARKFILE', path: '/sparkfile' },
    ];

    return (
        <div className="w-64 bg-[#050505]/95 backdrop-blur-sm border-r border-white/10 flex flex-col h-screen text-white/40 font-medium text-sm flex-shrink-0">
            {/* Branding */}
            <div className="p-6 flex items-center gap-4 text-white mb-2">
                 <div className="w-8 h-8 bg-white text-black rounded-sm flex items-center justify-center font-bold text-lg">
                    武
                </div>
                <div>
                    <h1 className="font-display font-bold text-sm tracking-[0.1em] uppercase leading-none">Musha Shugyo</h1>
                    <span className="text-[10px] text-white/30 font-mono">OS v1.0 // STEALTH</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-3 rounded-[2px] transition-all duration-200 group ${
                                isActive 
                                ? 'bg-white/10 text-white border-l-2 border-emerald-500' 
                                : 'hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                            }`}
                        >
                            <Icon size={16} className={isActive ? 'text-emerald-500' : 'text-white/40 group-hover:text-white'} />
                            <span className="font-mono text-xs tracking-wide">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Admin/User */}
            <div className="p-4 border-t border-white/10 space-y-1">
                 <button className="w-full flex items-center gap-3 px-3 py-2 rounded-[2px] hover:bg-white/5 hover:text-white transition-colors text-white/40 group">
                    <Settings size={16} className="group-hover:rotate-90 transition-transform duration-500"/>
                    <span className="font-mono text-xs">SYSTEM CONFIG</span>
                </button>
                <div className="pt-4 flex items-center gap-3 px-3">
                    <div className="w-8 h-8 rounded-sm bg-emerald-900/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-bold text-xs">
                        ME
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white text-xs font-bold font-display uppercase tracking-wider">Michael Enriquez</span>
                        <span className="text-emerald-500/60 text-[10px] font-mono flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            SOVEREIGN MODE
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
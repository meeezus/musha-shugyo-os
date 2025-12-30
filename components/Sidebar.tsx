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
        { icon: Home, label: 'Command', path: '/' },
        { icon: FolderKanban, label: 'Projects', path: '/projects' },
        { icon: Calendar, label: 'Schedule', path: '/calendar' },
        { icon: Users, label: 'Relationships', path: '/relationships' },
        { icon: Sword, label: 'Training Log', path: '/training' },
        { icon: BookOpen, label: 'Knowledge', path: '/knowledge' },
        { icon: Sparkles, label: 'Sparkfile', path: '/sparkfile' },
    ];

    return (
        <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen text-slate-400 font-medium text-sm flex-shrink-0">
            {/* Branding */}
            <div className="p-6 flex items-center gap-3 text-slate-100 mb-2">
                <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center text-slate-900 font-bold text-lg">
                    武
                </div>
                <div>
                    <h1 className="font-bold text-base leading-none tracking-tight">Musha Shugyo</h1>
                    <span className="text-xs text-slate-500 font-normal">PersonalOS v1.0</span>
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
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                                isActive 
                                ? 'bg-slate-800/80 text-amber-500 border-l-4 border-amber-500' 
                                : 'hover:bg-slate-800/50 hover:text-slate-200'
                            }`}
                        >
                            <Icon size={18} className={isActive ? 'text-amber-500' : 'text-slate-500'} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Admin/User */}
            <div className="p-4 border-t border-slate-800 space-y-1">
                 <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 hover:text-slate-200 transition-colors">
                    <Settings size={18} />
                    <span>System Config</span>
                </button>
                <div className="pt-2 flex items-center gap-3 px-3">
                    <img src="https://ui-avatars.com/api/?name=Michael+Enriquez&background=0F172A&color=F59E0B" alt="User" className="w-8 h-8 rounded-full border border-slate-600" />
                    <div className="flex flex-col">
                        <span className="text-slate-200 text-xs font-bold">Michael Enriquez</span>
                        <span className="text-slate-500 text-[10px]">Sovereign Mode</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
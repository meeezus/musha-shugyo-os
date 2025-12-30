import React from 'react';
import { Contact } from '../types';
import { Search, Filter, Star, Flame, ChevronDown, User } from 'lucide-react';

const Relationships: React.FC = () => {
    const contacts: Contact[] = [
        { id: '1', name: 'Google Friend', role: 'Warm Lead', lastContact: 'Scheduled', freshness: 'Hot', isVip: true, avatarUrl: 'https://ui-avatars.com/api/?name=GF&background=random' },
        { id: '2', name: 'Tesla Austin HR', role: 'Prospect', lastContact: 'Researching', freshness: 'Warm', isVip: false, avatarUrl: 'https://ui-avatars.com/api/?name=Tesla&background=random' },
        { id: '3', name: 'Mom', role: 'Family', lastContact: 'Weekend', freshness: 'Hot', isVip: true, avatarUrl: 'https://ui-avatars.com/api/?name=Mom&background=random' },
        { id: '4', name: 'Six Blades Coach', role: 'Instructor', lastContact: 'Monday', freshness: 'Hot', isVip: false, avatarUrl: 'https://ui-avatars.com/api/?name=Coach&background=random' },
        { id: '5', name: 'Health Client A', role: 'Coaching', lastContact: '14 days', freshness: 'Cold', isVip: false, avatarUrl: 'https://ui-avatars.com/api/?name=Client&background=random' },
    ];

    return (
        <div className="flex-1 overflow-y-auto flex">
            {/* Sidebar List */}
            <div className="w-96 border-r border-white/10 bg-[#050505]/50 flex flex-col">
                <div className="p-6 border-b border-white/10">
                     <h2 className="text-white font-bold font-display uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                        <span className="text-emerald-500">///</span> CRM Database
                    </h2>
                    <div className="relative group">
                        <Search className="absolute left-3 top-2.5 text-white/30 group-hover:text-white/60 transition-colors" size={14} />
                        <input 
                            type="text" 
                            placeholder="SEARCH PROSPECTS..." 
                            className="w-full bg-[#0A0A0A] border border-white/10 rounded-[2px] pl-9 pr-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/20"
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2">
                    <div className="px-4 py-3 text-[10px] font-mono font-bold text-white/30 uppercase tracking-widest flex justify-between">
                        <span>Decopon Prospects</span>
                        <Filter size={10} />
                    </div>
                    {contacts.map(contact => (
                        <div key={contact.id} className="px-4 py-3 mb-1 hover:bg-white/5 cursor-pointer border-l-2 border-transparent hover:border-emerald-500 transition-all group rounded-r-[2px]">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-sm bg-white/10 border border-white/5 overflow-hidden flex items-center justify-center">
                                    <span className="font-mono text-xs font-bold text-white/60">{contact.name.substring(0,2).toUpperCase()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white text-xs font-bold font-display tracking-wide truncate group-hover:text-white transition-colors">{contact.name}</h4>
                                    <div className="flex items-center gap-2 text-[10px] text-white/40 mt-1 font-mono">
                                        <span className={`flex items-center gap-1 ${contact.freshness === 'Hot' ? 'text-emerald-400' : 'text-white/30'}`}>
                                            <Flame size={10} /> {contact.freshness.toUpperCase()}
                                        </span>
                                        {contact.isVip && <span className="flex items-center gap-1 text-white/80"><Star size={10} fill="white"/> VIP</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Detail View (Mock) */}
            <div className="flex-1 p-8 overflow-y-auto bg-[#050505]">
                 <div className="max-w-3xl mx-auto">
                    {/* Header Card */}
                    <div className="stealth-card p-8 mb-8">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                                    <User size={32} />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold font-display text-white mb-1 tracking-tight">GOOGLE FRIEND</h1>
                                    <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Decopon Outreach Target // Warm Lead</p>
                                </div>
                            </div>
                            <button className="text-white/20 hover:text-white transition-colors">
                                <Star size={20} fill="#E5E5E5" className="text-white" />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-xs font-mono border-t border-white/5 pt-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-white/30 w-24 uppercase tracking-wider">Status</span>
                                    <span className="text-emerald-400 flex items-center gap-2">
                                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></div>
                                        TO CONTACT (13:00)
                                    </span>
                                </div>
                                 <div className="flex items-center gap-2">
                                    <span className="text-white/30 w-24 uppercase tracking-wider">Role</span>
                                    <span className="text-white/70">WARM LEAD</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Markdown Content Area */}
                    <div className="stealth-card p-8 min-h-[400px]">
                        <div className="flex items-center gap-2 mb-6 text-white/30 text-[10px] font-mono uppercase tracking-widest border-b border-white/5 pb-2">
                            <span>///</span> Intelligence Log
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none">
                            <h3 className="font-display font-bold text-white">Outreach Strategy</h3>
                            <p className="text-white/60 font-sans leading-relaxed mb-4 text-sm">
                                Scheduled for 1:00 PM Warm Outreach batch. Goal is to get a quick sanity check on the Decopon offer before blasting cold leads.
                            </p>
                            <ul className="text-white/60 font-mono text-xs space-y-2 list-none pl-0">
                                <li className="flex items-center gap-2"><span className="text-emerald-500">-></span> Drafting warm intro email</li>
                                <li className="flex items-center gap-2"><span className="text-emerald-500">-></span> Prepare offer PDF link</li>
                            </ul>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default Relationships;
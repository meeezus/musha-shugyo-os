import React from 'react';
import { Contact } from '../types';
import { Search, Filter, Star, Flame, ChevronDown } from 'lucide-react';

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
            <div className="w-96 border-r border-slate-800 bg-slate-900/30 flex flex-col">
                <div className="p-4 border-b border-slate-800">
                     <h2 className="text-slate-100 font-bold mb-4 flex items-center gap-2">
                        <span className="text-amber-500">⚡</span> CRM
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search prospects..." 
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between">
                        <span>Decopon Prospects</span>
                        <Filter size={12} />
                    </div>
                    {contacts.map(contact => (
                        <div key={contact.id} className="px-4 py-3 hover:bg-slate-800/50 cursor-pointer border-l-2 border-transparent hover:border-amber-500 transition-colors group">
                            <div className="flex items-center gap-3">
                                <img src={contact.avatarUrl} alt={contact.name} className="w-10 h-10 rounded-full border border-slate-700" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-slate-200 text-sm font-medium truncate">{contact.name}</h4>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                                        <span className="flex items-center gap-1 text-orange-400"><Flame size={10} /> {contact.freshness}</span>
                                        {contact.isVip && <span className="flex items-center gap-1 text-amber-500"><Star size={10} fill="currentColor"/> VIP</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Detail View (Mock) */}
            <div className="flex-1 p-8 overflow-y-auto bg-slate-950">
                 {/* This would be the detailed markdown view of a person/file */}
                 <div className="max-w-3xl mx-auto">
                    {/* Header Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-100 mb-1">Google Friend</h1>
                                <p className="text-slate-400 font-mono text-sm">Decopon Outreach Target</p>
                            </div>
                            <button className="text-slate-500 hover:text-slate-300">
                                <Star size={20} fill="#F59E0B" className="text-amber-500" />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500 w-24">Status:</span>
                                    <span className="text-orange-400 flex items-center gap-1">To Contact (1:00 PM)</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-800 flex justify-center">
                            <button className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
                                <ChevronDown size={14} /> Show history
                            </button>
                        </div>
                    </div>

                    {/* Markdown Content Area */}
                    <div className="prose prose-invert prose-slate max-w-none">
                        <h3>Outreach Plan</h3>
                        <p className="text-slate-300 text-sm leading-relaxed mb-4">
                            Scheduled for 1:00 PM Warm Outreach batch. Goal is to get a quick sanity check on the Decopon offer before blasting cold leads.
                        </p>
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default Relationships;
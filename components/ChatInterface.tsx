import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Mic, Maximize2, ChevronDown } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';
import { Message } from '../types';

const ChatInterface: React.FC = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [messages, setMessages] = useState<Message[]>([
        { id: '0', role: 'model', text: 'System Online. Ready for directives.', timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsThinking(true);

        const responseText = await sendMessageToGemini(messages, input);

        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: responseText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMsg]);
        setIsThinking(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-12 h-12 bg-white text-black rounded-sm flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-white/90 transition-all z-50 group"
            >
                <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
            </button>
        );
    }

    return (
        <div className="fixed right-6 bottom-6 w-[400px] h-[600px] bg-[#0A0A0A]/95 backdrop-blur-md border border-white/10 rounded-[2px] flex flex-col shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="font-bold font-display text-white text-sm tracking-wide">MUSHA SHUGYO CO-PILOT</span>
                </div>
                <div className="flex gap-4 text-white/40">
                    <button className="hover:text-white transition-colors"><Maximize2 size={14} /></button>
                    <button onClick={() => setIsOpen(false)} className="hover:text-white transition-colors"><ChevronDown size={18} /></button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 z-10 scrollbar-thin scrollbar-thumb-white/10">
                {messages.length === 1 && (
                    <div className="flex flex-col items-center justify-center h-full text-white/30 gap-6 mt-10">
                         <div className="w-16 h-16 border border-white/10 rounded-sm flex items-center justify-center text-white/80 font-bold text-2xl font-display">
                            武
                        </div>
                        <p className="text-center text-xs font-mono uppercase tracking-widest">
                            Awaiting Orders<br/>
                            <span className="text-white/20 normal-case tracking-normal">Sovereignty checks. Content drafting. System config.</span>
                        </p>
                        <div className="flex gap-2">
                            <button className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-[2px] text-[10px] text-white/60 border border-white/10 font-mono uppercase transition-colors">Draft Tweet</button>
                            <button className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-[2px] text-[10px] text-white/60 border border-white/10 font-mono uppercase transition-colors">Check Resistance</button>
                        </div>
                    </div>
                )}
                
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`text-[10px] font-mono mb-1 uppercase tracking-wider ${msg.role === 'user' ? 'text-white/30' : 'text-emerald-500/60'}`}>
                            {msg.role === 'user' ? 'OPERATOR' : 'SYSTEM'}
                        </div>
                        <div 
                            className={`max-w-[85%] px-4 py-3 rounded-[2px] text-xs leading-relaxed font-mono ${
                                msg.role === 'user' 
                                ? 'bg-white/10 text-white border border-white/5' 
                                : 'bg-emerald-500/5 text-white/80 border border-emerald-500/10'
                            }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                
                {isThinking && (
                    <div className="flex flex-col items-start">
                         <div className="text-[10px] font-mono mb-1 uppercase tracking-wider text-emerald-500/60">SYSTEM</div>
                         <div className="bg-emerald-500/5 px-4 py-3 rounded-[2px] border border-emerald-500/10 flex gap-1 items-center">
                            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce"></span>
                            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce delay-75"></span>
                            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce delay-150"></span>
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-[#0A0A0A] border-t border-white/10 z-10">
                <div className="relative">
                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="INPUT DIRECTIVE..."
                        className="w-full bg-[#050505] border border-white/10 rounded-[2px] px-4 py-3 pr-20 text-xs text-white font-mono focus:outline-none focus:border-white/30 transition-colors resize-none h-12 placeholder:text-white/20"
                    />
                    <div className="absolute right-2 top-2 flex items-center gap-1">
                         <button 
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="p-1.5 bg-white text-black hover:bg-white/90 rounded-[2px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                             <Send size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Mic, Maximize2, ChevronDown, Terminal, Loader2, Sparkles, StopCircle } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Message, ToolCall } from '../types';
import { simulateAgentResponse } from '../services/mockAgent';

const ChatInterface: React.FC = () => {
    const { dispatchCommand } = useApp();
    const [isOpen, setIsOpen] = useState(false); // Default closed to show off the button
    const [messages, setMessages] = useState<Message[]>([
        { id: '0', role: 'system', text: 'Musha Shugyo OS v1.0 // Online. \nWaiting for input...', timestamp: new Date(), suggestions: ['/overview', '/spark', 'Check emails'] }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isThinking]);

    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || input;
        if (!textToSend.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: textToSend,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsThinking(true);

        // Call the simulated agent
        const response = await simulateAgentResponse(textToSend, messages, dispatchCommand);

        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: response.text,
            timestamp: new Date(),
            toolCalls: response.toolCalls,
            suggestions: response.suggestions
        };

        setMessages(prev => [...prev, aiMsg]);
        setIsThinking(false);
        
        // Tab thumb-up flash effect (simulated)
        document.title = "👍 Musha Shugyo OS";
        setTimeout(() => document.title = "Musha Shugyo OS", 2000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Voice Input Simulation (Web Speech API)
    const toggleVoice = () => {
        if (isListening) {
            setIsListening(false);
            return;
        }

        setIsListening(true);
        if ('webkitSpeechRecognition' in window) {
            const recognition = new (window as any).webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
                // Optional: Auto-send on voice end
                // handleSend(transcript); 
            };
            recognition.start();
        } else {
            // Fallback for demo
            setTimeout(() => {
                setInput("Run the morning overview.");
                setIsListening(false);
            }, 1500);
        }
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-white text-black rounded-sm flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-white/90 transition-all z-50 group border border-black/20"
            >
                <div className="absolute inset-0 bg-emerald-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <MessageSquare size={24} className="relative z-10 group-hover:scale-110 transition-transform" />
            </button>
        );
    }

    return (
        <div className="fixed right-6 bottom-6 w-[400px] h-[650px] bg-[#0A0A0A]/95 backdrop-blur-xl border border-white/10 rounded-[4px] flex flex-col shadow-2xl z-50 overflow-hidden font-sans">
            {/* Background Pattern (Squiggles) */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1h2v2H1V1zm4 4h2v2H5V5zm4 4h2v2H9V9zm4 4h2v2h-2v-2zm4 4h2v2h-2v-2z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }}></div>

            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02] relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isThinking ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-600'}`}></div>
                    <span className="font-bold font-display text-white text-sm tracking-wide">MUSHA SHUGYO CO-PILOT</span>
                </div>
                <div className="flex gap-3 text-white/40">
                    <button className="hover:text-white transition-colors"><Maximize2 size={14} /></button>
                    <button onClick={() => setIsOpen(false)} className="hover:text-white transition-colors"><ChevronDown size={18} /></button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 z-10 scrollbar-thin scrollbar-thumb-white/10">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`text-[9px] font-mono mb-1 uppercase tracking-wider ${msg.role === 'user' ? 'text-white/30 mr-1' : 'text-emerald-500/60 ml-1'}`}>
                            {msg.role === 'user' ? 'ME' : 'SYSTEM'}
                        </div>
                        
                        {/* Message Bubble */}
                        <div 
                            className={`max-w-[85%] px-4 py-3 rounded-[2px] text-xs leading-relaxed font-mono whitespace-pre-wrap ${
                                msg.role === 'user' 
                                ? 'bg-white/10 text-white border border-white/5' 
                                : 'bg-[#0F0F0F] text-white/80 border border-white/5 shadow-sm'
                            }`}
                        >
                            {msg.text}
                        </div>

                        {/* Tool Calls Visualization (Collapsible boxes) */}
                        {msg.toolCalls && msg.toolCalls.map(tool => (
                            <div key={tool.id} className="mt-2 w-[85%] bg-[#050505] border border-white/10 rounded-[2px] overflow-hidden">
                                <div className="px-3 py-2 bg-white/[0.02] flex items-center justify-between border-b border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Terminal size={10} className="text-emerald-500" />
                                        <span className="text-[10px] font-mono text-emerald-500 font-bold">{tool.name}</span>
                                    </div>
                                    <span className="text-[9px] text-white/30 uppercase">{tool.status}</span>
                                </div>
                                <div className="px-3 py-2 text-[10px] font-mono text-white/50 border-t border-white/5">
                                    <div className="mb-1 text-white/30">$ {tool.input || 'no-args'}</div>
                                    {tool.output && <div className="text-white/70">→ {tool.output}</div>}
                                </div>
                            </div>
                        ))}

                        {/* Auto-Suggest Buttons */}
                        {msg.suggestions && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {msg.suggestions.map((suggestion, sIdx) => (
                                    <button 
                                        key={sIdx}
                                        onClick={() => handleSend(suggestion)}
                                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-full text-[10px] text-emerald-400 font-mono transition-colors flex items-center gap-1 group"
                                    >
                                        <Sparkles size={8} className="opacity-50 group-hover:opacity-100" />
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                
                {isThinking && (
                    <div className="flex flex-col items-start animate-fade-in">
                         <div className="text-[9px] font-mono mb-1 uppercase tracking-wider text-emerald-500/60 ml-1">SYSTEM</div>
                         <div className="bg-emerald-500/5 px-3 py-2 rounded-[2px] border border-emerald-500/10 flex gap-2 items-center">
                            <Loader2 size={12} className="text-emerald-500 animate-spin" />
                            <span className="text-[10px] text-emerald-500/80 font-mono">Thinking...</span>
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-[#0A0A0A] border-t border-white/10 z-10">
                <div className="relative group">
                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Directive... (/ for commands)"
                        className="w-full bg-[#050505] border border-white/10 rounded-[2px] px-4 py-3 pr-24 text-xs text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-colors resize-none h-14 placeholder:text-white/20"
                    />
                    
                    {/* Input Actions */}
                    <div className="absolute right-2 top-2 bottom-2 flex items-center gap-1">
                        {/* Voice Input */}
                        <button 
                            onClick={toggleVoice}
                            className={`p-2 rounded-[2px] transition-colors ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'text-white/30 hover:text-white hover:bg-white/10'}`}
                        >
                            {isListening ? <StopCircle size={14} /> : <Mic size={14} />}
                        </button>

                        <div className="w-[1px] h-4 bg-white/10 mx-1"></div>

                        {/* Send Button */}
                         <button 
                            onClick={() => handleSend()}
                            disabled={!input.trim()}
                            className="p-2 bg-white text-black hover:bg-white/90 rounded-[2px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/20"
                        >
                             <Send size={14} />
                        </button>
                    </div>
                </div>
                <div className="mt-2 flex justify-between px-1">
                    <div className="text-[9px] text-white/20 font-mono">Token Usage: 1,204 / 8,192</div>
                    <div className="text-[9px] text-emerald-500/40 font-mono">Simulated Mode</div>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;

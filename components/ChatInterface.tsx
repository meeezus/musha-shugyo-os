import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Mic, Maximize2, Sparkles, ChevronDown } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';
import { Message } from '../types';

const ChatInterface: React.FC = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [messages, setMessages] = useState<Message[]>([
        { id: '0', role: 'model', text: 'Hey, what can I help with?', timestamp: new Date() }
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
                className="fixed bottom-6 right-6 w-14 h-14 bg-amber-400 rounded-full flex items-center justify-center shadow-lg hover:bg-amber-300 transition-all z-50 text-slate-900"
            >
                <MessageSquare size={24} fill="currentColor" />
            </button>
        );
    }

    return (
        <div className="fixed right-6 bottom-6 w-[400px] h-[600px] bg-slate-950/95 backdrop-blur-md border border-slate-700 rounded-2xl flex flex-col shadow-2xl z-50 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-amber-400 rounded flex items-center justify-center text-slate-900 font-bold text-xs">⚡</div>
                    <span className="font-semibold text-slate-200">JFDI Assistant</span>
                </div>
                <div className="flex gap-3 text-slate-400">
                    <button className="hover:text-slate-200"><Maximize2 size={16} /></button>
                    <button onClick={() => setIsOpen(false)} className="hover:text-slate-200"><ChevronDown size={20} /></button>
                </div>
            </div>

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 z-10 scrollbar-thin scrollbar-thumb-slate-700">
                {messages.length === 1 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4 mt-10">
                         <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center text-slate-900 font-bold text-3xl shadow-lg shadow-amber-400/20 mb-4">
                            ⚡
                        </div>
                        <p className="text-center text-sm">I can check your email, manage your calendar,<br/>create reminders, and more.</p>
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 bg-slate-800 rounded-full text-xs text-slate-300 hover:bg-slate-700 border border-slate-700">Check overdue tasks</button>
                            <button className="px-3 py-1.5 bg-slate-800 rounded-full text-xs text-slate-300 hover:bg-slate-700 border border-slate-700">Draft newsletter</button>
                        </div>
                    </div>
                )}
                
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && (
                             <div className="w-8 h-8 mr-2 bg-amber-400 rounded flex-shrink-0 flex items-center justify-center text-slate-900 text-xs font-bold">⚡</div>
                        )}
                        <div 
                            className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                msg.role === 'user' 
                                ? 'bg-slate-800 text-slate-200 rounded-tr-none' 
                                : 'bg-transparent text-slate-300'
                            }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                
                {isThinking && (
                    <div className="flex justify-start">
                         <div className="w-8 h-8 mr-2 bg-amber-400 rounded flex-shrink-0 flex items-center justify-center text-slate-900 text-xs font-bold">⚡</div>
                         <div className="bg-slate-900 px-4 py-3 rounded-2xl flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75"></span>
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150"></span>
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-slate-900/80 border-t border-slate-800 z-10">
                <div className="relative">
                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="What do you want to JFDI?"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 pr-24 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 resize-none h-14"
                    />
                    <div className="absolute right-2 top-2 flex items-center gap-1">
                        <button className="p-2 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800">
                             <Mic size={18} />
                        </button>
                         <button 
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="p-2 bg-amber-400/10 text-amber-400 hover:bg-amber-400 hover:text-slate-900 rounded-lg transition-colors disabled:opacity-50"
                        >
                             <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;

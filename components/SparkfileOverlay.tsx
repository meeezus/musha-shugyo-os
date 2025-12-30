import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, CornerDownLeft, X } from 'lucide-react';
import { useApp } from '../store/AppContext';

export const SparkfileOverlay: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const { addSpark } = useApp();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+K or Ctrl+K to toggle
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            // Esc to close
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (!input.trim()) return;
        addSpark(input);
        setInput('');
        setIsOpen(false);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/20 rounded-[2px] shadow-2xl overflow-hidden flex flex-col relative">
                <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 animate-pulse"></div>
                
                <div className="p-4 flex items-start gap-3">
                    <div className="mt-1 text-emerald-500">
                        <Sparkles size={20} />
                    </div>
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        placeholder="Capture spark, idea, or quick task..."
                        className="flex-1 bg-transparent border-none outline-none text-white text-lg font-mono placeholder:text-white/20 resize-none h-24"
                    />
                </div>

                <div className="bg-white/5 px-4 py-2 flex justify-between items-center border-t border-white/10">
                    <div className="flex gap-2">
                        <span className="text-[10px] text-white/40 font-mono border border-white/10 px-1.5 rounded">Inbox</span>
                        <span className="text-[10px] text-white/40 font-mono border border-white/10 px-1.5 rounded">Quick Note</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] text-white/40 font-mono">Run commands with /</span>
                        <button 
                            onClick={handleSubmit}
                            className="flex items-center gap-2 text-xs font-bold text-black bg-white px-3 py-1 rounded-[2px] hover:bg-white/90"
                        >
                            Capture <CornerDownLeft size={12} />
                        </button>
                    </div>
                </div>
                
                <button 
                    onClick={() => setIsOpen(false)}
                    className="absolute top-2 right-2 text-white/20 hover:text-white transition-colors"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, ChevronLeft, X } from 'lucide-react';
import { ChatMessage } from '@/types';

interface ChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
    isMinimized: boolean;
    onToggleMinimize: () => void;
}

export default function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [messages, isOpen]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setIsLoading(true);

        const tempUserMsg: ChatMessage = {
            id: Date.now(),
            role: 'user',
            content: userMessage,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempUserMsg]);

        try {
            const formData = new FormData();
            formData.append('content', userMessage);
            if (sessionId) formData.append('session_id', sessionId);
            formData.append('model', 'claude-sonnet-4-20250514');
            formData.append('mode', 'default');

            const response = await window.axios.post('/api/chat/send', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 600000,
            });

            if (response.data.session_id && !sessionId) {
                setSessionId(response.data.session_id);
            }

            const assistantMsg: ChatMessage = response.data.message;
            setMessages(prev => [...prev.slice(0, -1), { ...tempUserMsg, id: assistantMsg.id - 1 }, assistantMsg]);
        } catch (error: any) {
            const errorDetail = error?.response?.data?.message || error?.message || 'Unknown error';
            const errorMsg: ChatMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: `Error: ${errorDetail}`,
                created_at: new Date().toISOString(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            width: '380px',
            height: '500px',
            backgroundColor: '#1a1a1a',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: '#1a1a1a',
                borderRadius: '12px 12px 0 0',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bot size={20} style={{ color: '#10b981' }} />
                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>Claude</span>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255,255,255,0.5)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                    }}
                >
                    <X size={18} />
                </button>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
            }}>
                {messages.length === 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.5)',
                    }}>
                        <Bot size={48} style={{ color: '#10b981', marginBottom: '16px' }} />
                        <h3 style={{ color: 'white', marginBottom: '8px' }}>Claude</h3>
                        <p>Your personal AI assistant</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            style={{
                                display: 'flex',
                                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                marginBottom: '12px',
                            }}
                        >
                            <div style={{
                                maxWidth: '80%',
                                padding: '12px 16px',
                                borderRadius: '16px',
                                backgroundColor: msg.role === 'user' ? '#10b981' : 'rgba(255,255,255,0.1)',
                                color: 'white',
                                fontSize: '14px',
                                whiteSpace: 'pre-wrap',
                            }}>
                                {msg.content}
                            </div>
                        </div>
                    ))
                )}
                {isLoading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '16px',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.5)',
                        }}>
                            Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
                padding: '16px',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: '#1a1a1a',
            }}>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                    }}
                    style={{ display: 'flex', gap: '12px' }}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Message Claude..."
                        disabled={isLoading}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            borderRadius: '24px',
                            border: 'none',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            color: 'white',
                            fontSize: '16px',
                            outline: 'none',
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '24px',
                            border: 'none',
                            backgroundColor: '#10b981',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: !input.trim() || isLoading ? 0.5 : 1,
                        }}
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}

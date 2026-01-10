import React, { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Send, Bot, CheckCircle, AlertCircle, ChevronLeft, Image, X } from 'lucide-react';
import { User, ChatMessage } from '@/types';

const AVAILABLE_MODELS = [
    { id: 'claude-sonnet-4-20250514', name: 'Sonnet 4' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Sonnet 3.5' },
    { id: 'claude-3-5-haiku-20241022', name: 'Haiku 3.5' },
    { id: 'claude-opus-4-20250514', name: 'Opus 4' },
];

interface ChatProps {
    auth: {
        user: User;
    };
}

export default function Chat({ auth }: ChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
    const [showModelSelector, setShowModelSelector] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const modelSelectorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: PointerEvent) => {
            if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
                setShowModelSelector(false);
            }
        };
        document.addEventListener('pointerdown', handleClickOutside);
        return () => document.removeEventListener('pointerdown', handleClickOutside);
    }, []);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                alert('Image must be less than 10MB');
                return;
            }
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const sendMessage = async () => {
        if ((!input.trim() && !selectedImage) || isLoading) return;

        const userMessage = input.trim();
        const imageToSend = selectedImage;
        const previewToShow = imagePreview;

        setInput('');
        clearImage();
        setIsLoading(true);

        const tempUserMsg: ChatMessage = {
            id: Date.now(),
            role: 'user',
            content: userMessage || (imageToSend ? '[Image]' : ''),
            image_url: previewToShow || undefined,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempUserMsg]);

        try {
            const formData = new FormData();
            formData.append('content', userMessage || 'What is in this image?');
            if (sessionId) formData.append('session_id', sessionId);
            formData.append('model', selectedModel);
            if (imageToSend) {
                formData.append('image', imageToSend);
            }

            const response = await window.axios.post('/api/chat/send', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
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
                metadata: { error: errorDetail },
                created_at: new Date().toISOString(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const renderActionResults = (metadata?: ChatMessage['metadata']) => {
        if (!metadata?.action_results?.length) return null;
        return (
            <div className="mt-2 pt-2 border-t border-white/10">
                <div className="space-y-1">
                    {metadata.action_results.map((result, idx) => (
                        <div
                            key={idx}
                            className={`flex items-center gap-2 text-[10px] font-mono ${
                                result.success ? 'text-emerald-400' : 'text-red-400'
                            }`}
                        >
                            {result.success ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                            <span>{result.type.replace('_', ' ')}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const TypingIndicator = () => (
        <div className="flex gap-1 px-2 py-1">
            <div className="w-2 h-2 bg-black/40 dark:bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-black/40 dark:bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-black/40 dark:bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
    );

    return (
        <AppLayout user={auth.user}>
            <Head title="Chat" />

            <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen bg-[#f5f5f5] dark:bg-[#0a0a0a]">
                {/* Header - iMessage style */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10 bg-[#f5f5f5] dark:bg-[#0a0a0a]">
                    <Link
                        href="/"
                        className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors -ml-2 px-2 py-1"
                    >
                        <ChevronLeft size={20} />
                        <span className="text-sm hidden md:inline">Back</span>
                    </Link>
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-1">
                            <Bot size={20} className="text-emerald-500" />
                        </div>
                        <span className="text-sm font-medium text-black dark:text-white">Claude</span>
                    </div>
                    <div className="relative" ref={modelSelectorRef}>
                        <button
                            onClick={() => setShowModelSelector(!showModelSelector)}
                            className="text-xs font-mono text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors px-2 py-1"
                        >
                            {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name}
                        </button>
                        {showModelSelector && (
                            <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
                                {AVAILABLE_MODELS.map((model) => (
                                    <button
                                        key={model.id}
                                        onClick={() => {
                                            setSelectedModel(model.id);
                                            setShowModelSelector(false);
                                        }}
                                        className={`w-full px-3 py-2 text-left text-xs font-mono hover:bg-black/5 dark:hover:bg-white/5 ${
                                            selectedModel === model.id ? 'text-emerald-400 bg-emerald-500/10' : 'text-black/60 dark:text-white/60'
                                        }`}
                                    >
                                        {model.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Messages - iMessage style */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-8">
                            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                                <Bot size={36} className="text-emerald-500" />
                            </div>
                            <h3 className="text-black dark:text-white font-medium text-lg mb-1">Claude</h3>
                            <p className="text-sm text-black/40 dark:text-white/40 max-w-xs">
                                Your personal AI assistant with full context of your goals and tasks.
                            </p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isUser = msg.role === 'user';
                            const showTime = idx === messages.length - 1 ||
                                messages[idx + 1]?.role !== msg.role;

                            return (
                                <div key={msg.id} className="space-y-1">
                                    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[80%] ${
                                                isUser
                                                    ? 'bg-emerald-500 text-white rounded-2xl rounded-br-md'
                                                    : 'bg-black/10 dark:bg-white/10 text-black dark:text-white rounded-2xl rounded-bl-md'
                                            } ${msg.image_url ? 'p-1' : 'px-4 py-2'}`}
                                        >
                                            {msg.image_url && (
                                                <img
                                                    src={msg.image_url}
                                                    alt="Uploaded"
                                                    className="rounded-xl max-w-full max-h-64 object-cover mb-1"
                                                />
                                            )}
                                            {msg.content && msg.content !== '[Image]' && (
                                                <div className={`text-sm whitespace-pre-wrap leading-relaxed ${msg.image_url ? 'px-3 py-1' : ''}`}>
                                                    {msg.content}
                                                </div>
                                            )}
                                            {renderActionResults(msg.metadata)}
                                        </div>
                                    </div>
                                    {showTime && (
                                        <div className={`text-[10px] text-black/30 dark:text-white/30 ${isUser ? 'text-right pr-1' : 'text-left pl-1'}`}>
                                            {formatTime(msg.created_at)}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-black/10 dark:bg-white/10 rounded-2xl rounded-bl-md px-3 py-2">
                                <TypingIndicator />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Image Preview */}
                {imagePreview && (
                    <div className="px-4 py-2 border-t border-black/10 dark:border-white/10 bg-[#f5f5f5] dark:bg-[#0a0a0a]">
                        <div className="relative inline-block">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="h-20 rounded-lg object-cover"
                            />
                            <button
                                onClick={clearImage}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Input - iMessage style */}
                <div className="px-4 py-3 border-t border-black/10 dark:border-white/10 bg-[#f5f5f5] dark:bg-[#0a0a0a] safe-area-bottom">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            sendMessage();
                        }}
                        className="flex items-center gap-2"
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                        />

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                            className="w-10 h-10 flex items-center justify-center rounded-full text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 transition-all"
                        >
                            <Image size={22} />
                        </button>

                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Message"
                            enterKeyHint="send"
                            autoComplete="off"
                            autoCorrect="on"
                            className="flex-1 bg-black/10 dark:bg-white/10 rounded-full px-4 py-3 text-sm text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={(!input.trim() && !selectedImage) || isLoading}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-emerald-400 active:scale-95"
                        >
                            <Send size={18} className="ml-0.5" />
                        </button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

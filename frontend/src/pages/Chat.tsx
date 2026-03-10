import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Send, ChevronLeft, Sparkles, Loader2, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../App';
import VectorSpace from '../components/VectorSpace';

const API_URL = (import.meta.env.VITE_API_URL ?? 'https://web-rag-glxd.onrender.com') + '/api';

interface Source {
    url: string;
    title: string;
    snippet: string;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: Source[];
}

export default function ChatPage() {
    const navigate = useNavigate();
    const { t, language, setLanguage } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sourceUrl, setSourceUrl] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'es' : 'en');
    };

    useEffect(() => {
        fetch(`${API_URL}/status`)
            .then(res => res.json())
            .then(data => {
                if (!data.configured) {
                    navigate('/');
                } else {
                    setSourceUrl(data.current_url);
                    if (messages.length === 0) {
                        setMessages([{
                            role: 'assistant',
                            content: t('chat.ready').replace('{url}', data.current_url)
                        }]);
                    }
                }
            })
            .catch(() => navigate('/'));
    }, [navigate, language]); // Added language to refresh if it changes initially

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setIsLoading(true);

        // Añadir mensaje vacío del asistente que se irá rellenando
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        try {
            const res = await fetch(`${API_URL}/ask/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userMsg })
            });

            if (!res.ok || !res.body) throw new Error('Failed to get answer');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';  // Guardar línea incompleta

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const raw = line.slice(6).trim();
                    if (raw === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(raw);

                        if (parsed.token !== undefined) {
                            // Token de texto — añadir al mensaje actual
                            setMessages(prev => {
                                const updated = [...prev];
                                const last = updated[updated.length - 1];
                                updated[updated.length - 1] = {
                                    ...last,
                                    content: last.content + parsed.token
                                };
                                return updated;
                            });
                        } else if (parsed.sources) {
                            // Fuentes RAG — adjuntar al último mensaje
                            setMessages(prev => {
                                const updated = [...prev];
                                updated[updated.length - 1] = {
                                    ...updated[updated.length - 1],
                                    sources: parsed.sources
                                };
                                return updated;
                            });
                        }
                    } catch { /* ignorar líneas malformadas */ }
                }
            }
        } catch (err: any) {
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: `${t('chat.errorTitle')} ${err.message}`
                };
                return updated;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen w-full bg-[#09090b] relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-50">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[100px]" />
            </div>

            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-20">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all text-sm group"
                >
                    <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                    <span>{t('chat.back')}</span>
                </button>

                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                        <span className="text-sm font-semibold text-white">{t('chat.active')}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#18181b] border border-white/5 rounded-lg text-zinc-400 hover:text-white transition-all text-xs font-medium"
                    >
                        <Languages className="h-3.5 w-3.5" />
                        <span>{language === 'en' ? 'EN' : 'ES'}</span>
                    </button>
                </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-8 scroll-smooth z-10 w-full max-w-3xl mx-auto">
                <div className="space-y-6">
                    {/* Show Vector Space Visualization */}
                    {messages.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8"
                        >
                            <VectorSpace api_url={API_URL.replace('/api', '')} queryInProgress={isLoading} />
                        </motion.div>
                    )}

                    {/* Show Source Context Initially */}
                    {messages.length > 0 && (
                        <div className="flex justify-center mb-8">
                            <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                                {t('chat.context')} {new URL(sourceUrl || 'https://example.com').hostname}
                            </span>
                        </div>
                    )}

                    <AnimatePresence initial={false}>
                        {messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                        <Sparkles className="h-4 w-4 text-indigo-400" />
                                    </div>
                                )}

                                <div className={`flex flex-col gap-2 max-w-[85%] sm:max-w-[75%]`}>
                                    <div className={`rounded-3xl px-6 py-4 text-[15px] leading-7 shadow-sm ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-sm shadow-indigo-500/10'
                                        : 'bg-[#18181b] border border-white/5 text-zinc-200 rounded-tl-sm'
                                        }`}>
                                        {msg.content}
                                        {/* Cursor parpadeante mientras llegan tokens */}
                                        {msg.role === 'assistant' && isLoading && i === messages.length - 1 && (
                                            <span className="inline-block w-[2px] h-[1em] bg-indigo-400 ml-0.5 align-middle animate-pulse" />
                                        )}
                                    </div>

                                    {/* Panel de fuentes RAG */}
                                    {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="flex flex-col gap-1.5 pl-1"
                                        >
                                            <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-medium">
                                                📎 {t('chat.sourcesUsed')
                                                    .replace('{count}', msg.sources.length.toString())
                                                    .replace('{plural}', msg.sources.length > 1 ? (language === 'en' ? 's' : 's') : '')}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {msg.sources.map((src, si) => (
                                                    <div key={si} className="group relative">
                                                        <a
                                                            href={src.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-800 transition-all text-[11px] text-zinc-400 hover:text-zinc-200"
                                                        >
                                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                                                            <span className="max-w-[180px] truncate">{src.title || src.url}</span>
                                                        </a>
                                                        {/* Tooltip con snippet */}
                                                        {src.snippet && (
                                                            <div className="absolute bottom-full left-0 mb-2 w-72 p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-[11px] text-zinc-400 leading-5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-xl">
                                                                <p className="text-zinc-300 font-medium mb-1 truncate">{src.title}</p>
                                                                <p className="line-clamp-4">{src.snippet}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isLoading && messages[messages.length - 1]?.content === '' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex gap-4 justify-start"
                        >
                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
                            </div>
                            <div className="bg-[#18181b] border border-white/5 px-4 py-3 rounded-3xl rounded-tl-sm flex items-center gap-1.5 h-[46px]">
                                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="p-6 bg-gradient-to-t from-[#09090b] via-[#09090b] to-transparent z-20">
                <form onSubmit={handleSend} className="relative max-w-3xl mx-auto w-full">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t('chat.askPlaceholder')}
                        disabled={isLoading}
                        className="w-full h-14 bg-[#18181b] rounded-2xl border border-zinc-800 pl-6 pr-14 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all shadow-xl"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-2 bottom-2 aspect-square bg-white text-black rounded-xl flex items-center justify-center hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-white transition-all transform active:scale-95"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </form>
                <p className="text-center text-xs text-zinc-600 mt-3 font-medium">
                    {t('chat.accuracyWarning')}
                </p>
            </div>
        </div>
    );
}

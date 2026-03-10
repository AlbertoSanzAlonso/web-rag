import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, User, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VectorSpace from '../components/VectorSpace';
import Layout from '../components/Layout';

const API_URL = (import.meta.env.VITE_API_URL ?? 'https://web-rag-glxd.onrender.com') + '/api';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatPage() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [sourceUrl, setSourceUrl] = useState('');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const res = await fetch(`${API_URL}/status`);
            const data = await res.json();
            if (!data.configured) navigate('/');
            setSourceUrl(data.base_url || '');
        } catch (e) {
            navigate('/');
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/ask/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: userMsg.content }),
            });

            if (!response.body) throw new Error('No body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantContent = '';

            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') break;
                        try {
                            const parsed = JSON.parse(data);
                            assistantContent += parsed.answer || '';
                            setMessages(prev => {
                                const newMessages = [...prev];
                                newMessages[newMessages.length - 1].content = assistantContent;
                                return newMessages;
                            });
                        } catch (e) { /* silent fail for partial JSON chunks */ }
                    }
                }
            }
        } catch (err) {
            console.error('Error in chat:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout>
            <div className="flex flex-col h-[75vh] max-w-5xl mx-auto space-y-8">
                {/* Header Info */}
                <div className="flex justify-between items-center bg-vision-cyan/10 border border-vision-cyan/20 px-6 py-3 rounded-2xl backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-vision-cyan animate-pulse shadow-neon-cyan" />
                        <span className="text-[10px] font-black tracking-widest text-vision-cyan uppercase">Live Analysis Context</span>
                    </div>
                    <span className="text-xs font-bold text-white/60 font-mono">{new URL(sourceUrl || 'https://example.com').hostname}</span>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto pr-4 scroll-smooth space-y-8 custom-scrollbar">
                    {/* Visualization at the top of chat */}
                    <VectorSpace api_url={API_URL.replace('/api', '')} queryInProgress={isLoading} />

                    <div className="space-y-6 pb-4">
                        <AnimatePresence>
                            {messages.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-vision-purple shadow-neon-purple' : 'bg-vision-cyan shadow-neon-cyan'}`}>
                                            {m.role === 'user' ? <User size={16} className="text-white" /> : <Sparkles size={16} className="text-white" />}
                                        </div>
                                        <div className={`p-5 rounded-3xl text-sm leading-relaxed ${m.role === 'user' ? 'glass-vision border-vision-purple/30 text-white' : 'glass-vision border-vision-cyan/30 text-white font-medium'}`}>
                                            {m.content}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {isLoading && messages[messages.length - 1]?.role === 'user' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                <div className="glass-vision p-4 rounded-full">
                                    <Loader2 className="animate-spin text-vision-cyan" size={18} />
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area (Visual Match for "Semantic Search" bar) */}
                <div className="relative group pt-4">
                    <div className="absolute -inset-1 bg-gradient-to-r from-vision-cyan to-vision-purple rounded-[2.5rem] blur opacity-10 group-focus-within:opacity-20 transition duration-1000"></div>
                    <form onSubmit={handleSend} className="relative flex items-center glass-vision rounded-[2.5rem] p-2 pr-4 border-white/5 group-focus-within:border-vision-cyan/30 transition-all">
                        <div className="pl-6 text-vision-cyan/50">
                            <MessageCircle size={20} />
                        </div>
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Interrogate the data model..."
                            className="flex-1 bg-transparent border-none text-white text-base px-5 py-4 focus:ring-0 placeholder:text-slate-600 font-medium"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="w-12 h-12 bg-vision-cyan rounded-full flex items-center justify-center text-background shadow-neon-cyan hover:scale-110 active:scale-95 transition-all disabled:opacity-30"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
}

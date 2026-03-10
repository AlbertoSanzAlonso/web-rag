import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Search, Globe, Key, Loader2, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../App';
import Layout from '../components/Layout';

const API_URL = (import.meta.env.VITE_API_URL ?? 'https://web-rag-glxd.onrender.com') + '/api';

type Provider = 'openai' | 'gemini' | 'claude' | 'groq';

export default function SetupPage() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [apiKey, setApiKey] = useState('');
    const [embeddingKey, setEmbeddingKey] = useState('');
    const [targetUrl, setTargetUrl] = useState('');
    const [provider, setProvider] = useState<Provider>('openai');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [statusMsg, setStatusMsg] = useState('');

    const handleConfigure = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const payload: Record<string, string | undefined> = {
                api_key: apiKey,
                base_url: targetUrl,
                provider: provider,
                embedding_key: provider === 'claude' ? embeddingKey : undefined,
            };

            const res = await fetch(`${API_URL}/configure`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Configuration failed');
            }

            let ready = false;
            while (!ready) {
                await new Promise(r => setTimeout(r, 1200));
                const statusRes = await fetch(`${API_URL}/status`);
                const statusData = await statusRes.json();
                if (statusData.error) throw new Error(statusData.error);
                if (statusData.configured && !statusData.indexing) {
                    ready = true;
                } else if (statusData.indexing) {
                    const pages = statusData.pages_done ?? 0;
                    setStatusMsg(pages > 0 ? t('setup.indexingPages').replace('{pages}', pages.toString()) : t('setup.indexing'));
                }
            }
            navigate('/chat');
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
            setStatusMsg('');
        }
    };

    return (
        <Layout>
            <div className="flex flex-col items-center justify-center pt-20">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-2xl text-center"
                >
                    <form onSubmit={handleConfigure} className="space-y-12">
                        {/* Main Search Bar (Vision Style) */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-vision-cyan to-vision-purple rounded-[2rem] blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-focus-within:duration-200"></div>
                            <div className="relative flex items-center bg-slate-900/80 border border-white/10 rounded-[2rem] p-1.5 sm:p-2 pr-3 sm:pr-4 backdrop-blur-xl">
                                <div className="pl-4 sm:pl-6 text-vision-cyan">
                                    <Globe size={22} className="sm:w-6 sm:h-6" />
                                </div>
                                <input
                                    type="url"
                                    required
                                    value={targetUrl}
                                    onChange={(e) => setTargetUrl(e.target.value)}
                                    placeholder="Enter Website URL..."
                                    className="flex-1 bg-transparent border-none text-white text-base sm:text-xl px-3 sm:px-4 py-3 sm:py-4 focus:ring-0 placeholder:text-slate-600 font-medium w-full"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-12 h-12 sm:w-14 sm:h-14 bg-vision-cyan rounded-full flex items-center justify-center text-background shadow-neon-cyan hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:animate-pulse"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : <Search size={22} className="sm:w-6 sm:h-6" />}
                                </button>
                            </div>
                        </div>

                        {/* Secondary Configuration (Glass panels) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-left">
                            {/* Provider Card */}
                            <div className="glass-vision p-6 rounded-3xl space-y-4">
                                <div className="flex items-center gap-2 text-vision-purple">
                                    <Cpu size={18} />
                                    <h3 className="text-xs font-black tracking-widest uppercase">Provider Engine</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['openai', 'gemini', 'claude', 'groq'] as Provider[]).map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setProvider(p)}
                                            className={`py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all capitalize border ${provider === p
                                                ? 'bg-vision-purple border-vision-purple text-white shadow-neon-purple'
                                                : 'bg-white/5 border-white/5 text-secondary hover:border-white/20'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Credentials Card */}
                            <div className="glass-vision p-6 rounded-3xl space-y-4">
                                <div className="flex items-center gap-2 text-vision-blue">
                                    <Key size={18} />
                                    <h3 className="text-xs font-black tracking-widest uppercase">Encryption Key</h3>
                                </div>
                                <div className="space-y-3">
                                    {provider !== 'groq' ? (
                                        <input
                                            type="password"
                                            required
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            placeholder={provider === 'gemini' ? 'AIza...' : 'sk-...'}
                                            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-vision-blue/50 transition-all outline-none"
                                        />
                                    ) : (
                                        <div className="py-2.5 px-4 bg-vision-cyan/5 border border-vision-cyan/10 rounded-xl text-[10px] text-cyan-200/60 italic text-center">
                                            Groq optimization active. No key required.
                                        </div>
                                    )}

                                    {provider === 'claude' && (
                                        <input
                                            type="password"
                                            required
                                            value={embeddingKey}
                                            onChange={(e) => setEmbeddingKey(e.target.value)}
                                            placeholder="Embedding Key (OpenAI)"
                                            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-vision-blue/50 transition-all outline-none"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status / Error */}
                        <AnimatePresence>
                            {(error || statusMsg) && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`p-4 rounded-2xl border text-sm font-medium ${error ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-vision-cyan/10 border-vision-cyan/20 text-vision-cyan'}`}
                                >
                                    {error || statusMsg}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </motion.div>
            </div>
        </Layout>
    );
}

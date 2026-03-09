import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowRight, Command, Globe, Key, Loader2, Cpu, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../App';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8001') + '/api';

type Provider = 'openai' | 'gemini' | 'claude' | 'groq';

export default function SetupPage() {
    const navigate = useNavigate();
    const { t, language, setLanguage } = useLanguage();
    const [apiKey, setApiKey] = useState('');
    const [embeddingKey, setEmbeddingKey] = useState(''); // Only for Claude
    const [targetUrl, setTargetUrl] = useState('');
    const [provider, setProvider] = useState<Provider>('openai');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [statusMsg, setStatusMsg] = useState('');

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'es' : 'en');
    };

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

            // 1. Lanzar la indexación (responde inmediatamente)
            const res = await fetch(`${API_URL}/configure`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Configuration failed');
            }

            // 2. Polling hasta que el agente esté listo
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
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[#09090b]">
            {/* Language Toggle */}
            <div className="absolute top-6 right-6 z-20">
                <button
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 px-4 py-2 bg-[#18181b] border border-white/5 rounded-xl text-zinc-400 hover:text-white transition-all text-sm font-medium"
                >
                    <Languages className="h-4 w-4" />
                    <span>{language === 'en' ? 'English' : 'Español'}</span>
                </button>
            </div>

            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[20%] w-[60%] h-[60%] rounded-full bg-indigo-500/5 blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-lg z-10"
            >
                <div className="glass-card rounded-3xl p-8 md:p-10 shadow-2xl relative border border-white/5">

                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#18181b] border border-white/5 mb-4 shadow-sm">
                            <Command className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
                            {t('setup.title')}
                        </h1>
                        <p className="text-zinc-500 text-sm">
                            {t('setup.subtitle')}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleConfigure} className="space-y-5">

                        {/* Provider Selector */}
                        <div className="grid grid-cols-4 gap-2 bg-[#18181b] p-1 rounded-xl border border-zinc-800">
                            {(['openai', 'gemini', 'claude', 'groq'] as Provider[]).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setProvider(p)}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all capitalize ${provider === p
                                        ? 'bg-white text-black shadow-sm'
                                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>

                        {/* URL Input */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5 pl-1">{t('setup.targetWebsite')}</label>
                            <div className="relative group">
                                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                                <input
                                    type="url"
                                    required
                                    value={targetUrl}
                                    onChange={(e) => setTargetUrl(e.target.value)}
                                    onBlur={() => {
                                        if (targetUrl && !/^https?:\/\//i.test(targetUrl)) {
                                            setTargetUrl(`https://${targetUrl}`);
                                        }
                                    }}
                                    placeholder={t('setup.placeholderUrl')}
                                    className="w-full h-11 bg-[#18181b] border border-zinc-800 text-white text-sm rounded-xl pl-10 pr-4 placeholder:text-zinc-600 focus:bg-[#202024] input-ring"
                                />
                            </div>
                        </div>


                        {/* API Key Input */}
                        <AnimatePresence mode="wait">
                            {provider !== 'groq' ? (
                                <motion.div
                                    key="api-key-input"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5 pl-1">
                                        {provider === 'openai' ? t('setup.openaiKey') :
                                            provider === 'gemini' ? t('setup.geminiKey') :
                                                t('setup.claudeKey')}
                                    </label>
                                    <div className="relative group">
                                        <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                                        <input
                                            type="password"
                                            required
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            placeholder={provider === 'gemini' ? 'AIza...' : 'sk-...'}
                                            className="w-full h-11 bg-[#18181b] border border-zinc-800 text-white text-sm rounded-xl pl-10 pr-4 placeholder:text-zinc-600 focus:bg-[#202024] input-ring"
                                        />
                                    </div>

                                    {provider === 'claude' && (
                                        <div className="mt-4">
                                            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5 pl-1">
                                                {t('setup.embeddingKey')} <span className="text-[10px] text-zinc-600 normal-case">({t('setup.embeddingHint')})</span>
                                            </label>
                                            <div className="relative group">
                                                <Cpu className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                                                <input
                                                    type="password"
                                                    required
                                                    value={embeddingKey}
                                                    onChange={(e) => setEmbeddingKey(e.target.value)}
                                                    placeholder="sk-..."
                                                    className="w-full h-11 bg-[#18181b] border border-zinc-800 text-white text-sm rounded-xl pl-10 pr-4 placeholder:text-zinc-600 focus:bg-[#202024] input-ring"
                                                />
                                            </div>
                                            <p className="text-[10px] text-zinc-500 mt-1 pl-1">
                                                {t('setup.claudeHint')}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="groq-info"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-2 overflow-hidden"
                                >
                                    <p className="text-xs text-zinc-400 leading-relaxed text-center">
                                        🚀 <span className="text-white font-medium">Groq</span> {t('setup.groqFree')}
                                    </p>
                                    <p className="text-[10px] text-zinc-500 text-center italic">
                                        {t('setup.groqHint')}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center gap-2"
                            >
                                <div className="w-1 h-1 rounded-full bg-red-400" />
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-white text-black font-semibold h-11 rounded-xl hover:bg-zinc-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/5 mt-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>{statusMsg || t('setup.connecting')}</span>
                                </>
                            ) : (
                                <>
                                    <span>{t('setup.initialize')}</span>
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="text-center mt-8">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-medium">
                        {t('setup.powered')}
                    </p>
                </div>
            </motion.div >
        </div >
    );
}

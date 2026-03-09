import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowRight, Command, Globe, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8001') + '/api';

type Provider = 'openai' | 'gemini' | 'claude' | 'groq';

export default function SetupPage() {
    const navigate = useNavigate();
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
                api_key: '',
                base_url: targetUrl,
                provider: provider,
                embedding_key: undefined,
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
                    setStatusMsg(pages > 0 ? `Indexando... ${pages} páginas` : 'Indexando...');
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
                            Start Knowledge Agent
                        </h1>
                        <p className="text-zinc-500 text-sm">
                            Configure your LLM provider and target website.
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
                            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5 pl-1">Target Website</label>
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
                                    placeholder="https://example.com"
                                    className="w-full h-11 bg-[#18181b] border border-zinc-800 text-white text-sm rounded-xl pl-10 pr-4 placeholder:text-zinc-600 focus:bg-[#202024] input-ring"
                                />
                            </div>
                        </div>


                        {/* API Info message */}
                        <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-2">
                            <p className="text-xs text-zinc-400 leading-relaxed text-center">
                                🔒 <span className="text-white font-medium">Auto-Auth:</span> Los tokens se gestionan en el servidor.
                            </p>
                            <p className="text-[10px] text-zinc-500 text-center italic">
                                {provider === 'groq' ? 'Groq (LLaMA 3.1 8B) · Embeddings Locales' :
                                    provider === 'openai' ? 'OpenAI (GPT-3.5) · Embeddings OpenAI' :
                                        'Este proveedor requiere configuración manual en el servidor.'}
                            </p>
                        </div>




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
                                    <span>{statusMsg || 'Connecting...'}</span>
                                </>
                            ) : (
                                <>
                                    <span>Initialize Agent</span>
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="text-center mt-8">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-medium">
                        AI Powered • Multi-Provider Support
                    </p>
                </div>
            </motion.div >
        </div >
    );
}

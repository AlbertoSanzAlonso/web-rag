import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Info } from 'lucide-react';

interface Point {
    id: number;
    x: number;
    y: number;
    title: string;
    snippet: string;
}

interface VectorSpaceProps {
    api_url: string;
    queryInProgress: boolean;
}

const VectorSpace: React.FC<VectorSpaceProps> = ({ api_url, queryInProgress }) => {
    const [points, setPoints] = useState<Point[]>([]);
    const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPoints();
    }, [api_url]);

    const fetchPoints = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${api_url}/api/visualize`);
            const data = await res.json();
            setPoints(data.points || []);
        } catch (e) {
            console.error("Error fetching map:", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative w-full h-80 bg-slate-950/50 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm group">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Espacio Vectorial</span>
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
                {loading ? (
                    <div className="text-slate-500 text-sm animate-pulse">Calculando proyecciones...</div>
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                        {/* Connection Lines during query */}
                        <AnimatePresence>
                            {queryInProgress && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 2] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="absolute w-20 h-20 border-2 border-indigo-500/30 rounded-full"
                                />
                            )}
                        </AnimatePresence>

                        {points.map((p) => (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                    opacity: 0.6,
                                    scale: 1,
                                    x: p.x,
                                    y: p.y
                                }}
                                whileHover={{ opacity: 1, scale: 1.5, zIndex: 50 }}
                                onMouseEnter={() => setHoveredPoint(p)}
                                onMouseLeave={() => setHoveredPoint(null)}
                                className="absolute cursor-help"
                            >
                                <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)] bg-indigo-400`} />
                            </motion.div>
                        ))}

                        {/* Simulated Search Ray */}
                        {queryInProgress && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div
                                    animate={{ opacity: [0, 0.4, 0] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                    className="w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent rotate-45"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Info Card on Hover */}
            <AnimatePresence>
                {hoveredPoint && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-4 right-4 max-w-[250px] bg-slate-900/90 border border-white/10 p-3 rounded-xl backdrop-blur-md shadow-2xl z-50"
                    >
                        <h4 className="text-xs font-bold text-indigo-400 mb-1 line-clamp-1">{hoveredPoint.title}</h4>
                        <p className="text-[10px] text-slate-300 line-clamp-3 leading-relaxed">
                            {hoveredPoint.snippet}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute bottom-3 left-4 flex gap-4 text-[10px] text-slate-500 italic">
                <span className="flex items-center gap-1"><Search size={10} /> Escaneo Semántico</span>
                <span className="flex items-center gap-1"><Info size={10} /> Proyección PCA 2D</span>
            </div>
        </div>
    );
};

export default VectorSpace;

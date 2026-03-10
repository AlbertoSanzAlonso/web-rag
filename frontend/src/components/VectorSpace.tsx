import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Layers } from 'lucide-react';

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

    // Calculate simulated connections between nearby points
    const connections = useMemo(() => {
        const lines: { x1: number, y1: number, x2: number, y2: number }[] = [];
        if (points.length < 2) return [];

        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const dist = Math.sqrt(Math.pow(points[i].x - points[j].x, 2) + Math.pow(points[i].y - points[j].y, 2));
                if (dist < 40) { // Connection threshold
                    lines.push({ x1: points[i].x, y1: points[i].y, x2: points[j].x, y2: points[j].y });
                }
            }
        }
        return lines;
    }, [points]);

    return (
        <div className="relative w-full h-[500px] glass-vision rounded-[2.5rem] overflow-hidden border border-white/10 group bg-black">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #22d3ee 1.5px, transparent 0)', backgroundSize: '40px 40px' }} />

            {/* Legend / Overlay from image */}
            <div className="absolute top-8 left-8 z-10 space-y-2 pointer-events-none">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-vision-cyan shadow-neon-cyan" />
                    <span className="text-[10px] font-black tracking-[0.2em] text-white/80 uppercase">Data Nodes (Extracted)</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-4 h-[1px] bg-white/20" />
                    <span className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase">Semantic Relationships</span>
                </div>
            </div>

            <div className="absolute top-8 right-8 z-20 flex gap-2">
                <div className="glass-vision p-2 rounded-xl text-vision-cyan hover:bg-vision-cyan/10 transition-colors pointer-events-auto cursor-pointer">
                    <Layers size={16} />
                </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
                {loading ? (
                    <div className="text-vision-cyan text-sm font-black tracking-widest animate-pulse uppercase">Scanning Space...</div>
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center">

                        {/* SVG Connections Layer */}
                        <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                            <defs>
                                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="rgba(34, 211, 238, 0.2)" />
                                    <stop offset="100%" stopColor="rgba(192, 132, 252, 0.2)" />
                                </linearGradient>
                            </defs>
                            {connections.map((l, i) => (
                                <line
                                    key={i}
                                    x1={`calc(50% + ${l.x1}px)`}
                                    y1={`calc(50% + ${l.y1}px)`}
                                    x2={`calc(50% + ${l.x2}px)`}
                                    y2={`calc(50% + ${l.y2}px)`}
                                    stroke="url(#lineGrad)"
                                    strokeWidth="0.5"
                                />
                            ))}
                        </svg>

                        {points.map((p, i) => (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                    opacity: 0.8,
                                    scale: 1,
                                    x: p.x,
                                    y: p.y
                                }}
                                whileHover={{ opacity: 1, scale: 1.3, zIndex: 50 }}
                                onMouseEnter={() => setHoveredPoint(p)}
                                onMouseLeave={() => setHoveredPoint(null)}
                                className="absolute"
                            >
                                <div className="relative flex items-center justify-center group/node cursor-pointer">
                                    <div className="w-2 h-2 rounded-full bg-vision-cyan shadow-neon-cyan group-hover/node:scale-150 transition-transform duration-300" />
                                    {/* Sub-label for some points to match image */}
                                    {i % 4 === 0 && (
                                        <div className="absolute -top-6 whitespace-nowrap text-[8px] font-bold text-white/30 uppercase tracking-tighter opacity-0 group-hover/node:opacity-100 transition-opacity">
                                            {p.title.split(' ')[0]}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}

                        {/* Search Pulse Ray */}
                        <AnimatePresence>
                            {queryInProgress && (
                                <motion.div
                                    initial={{ x: -1000, opacity: 0 }}
                                    animate={{ x: 1000, opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute w-[300px] h-[300%] bg-gradient-to-r from-transparent via-vision-cyan/10 to-transparent -rotate-[45deg] z-10 pointer-events-none"
                                />
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Info Panel - Visionary Style */}
            <AnimatePresence>
                {hoveredPoint && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="absolute bottom-12 right-12 max-w-[280px] glass-vision p-6 rounded-3xl border-vision-cyan/20 z-50 pointer-events-none"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <Database size={14} className="text-vision-cyan" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white line-clamp-1">{hoveredPoint.title}</h4>
                        </div>
                        <p className="text-[11px] text-secondary line-clamp-4 leading-relaxed font-medium">
                            {hoveredPoint.snippet}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute bottom-8 left-8 flex gap-6 text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-vision-cyan animate-pulse" /> Semantic Scan</span>
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-vision-purple shadow-neon-purple" /> PCA Projection</span>
            </div>
        </div>
    );
};

export default VectorSpace;

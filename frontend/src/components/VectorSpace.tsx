import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Layers, Search } from 'lucide-react';

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

    const connections = useMemo(() => {
        const lines: { x1: number, y1: number, x2: number, y2: number }[] = [];
        if (points.length < 2) return [];

        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const dist = Math.sqrt(Math.pow(points[i].x - points[j].x, 2) + Math.pow(points[i].y - points[j].y, 2));
                if (dist < 40) {
                    lines.push({ x1: points[i].x, y1: points[i].y, x2: points[j].x, y2: points[j].y });
                }
            }
        }
        return lines;
    }, [points]);

    return (
        <div className="relative w-full h-[500px] glass-vision rounded-[2.5rem] overflow-hidden border border-white/10 group bg-black">
            {/* Cinematic Background Radial Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.1),transparent_70%)] pointer-events-none" />

            {/* Background Grid */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #22d3ee 1.5px, transparent 0)', backgroundSize: '40px 40px' }} />

            {/* Decorative Compass Overlay */}
            <div className="absolute top-24 left-10 pointer-events-none opacity-40">
                <div className="relative w-16 h-16 border border-white/10 rounded-full flex items-center justify-center">
                    <div className="absolute -top-4 text-[8px] font-bold text-white/40 italic">N</div>
                    <div className="absolute -bottom-4 text-[8px] font-bold text-white/40 italic">S</div>
                    <div className="absolute -left-4 text-[8px] font-bold text-white/40 italic">W</div>
                    <div className="absolute -right-4 text-[8px] font-bold text-white/40 italic">E</div>
                    <div className="w-[2px] h-full bg-gradient-to-b from-vision-cyan/50 via-vision-cyan to-vision-cyan/50 rotate-45" />
                </div>
            </div>

            {/* UI Controls */}
            <div className="absolute bottom-10 left-10 flex flex-col gap-2 z-20">
                <button className="w-8 h-8 glass-vision rounded-lg flex items-center justify-center text-white/40 hover:text-white transition-colors text-lg font-bold">+</button>
                <button className="w-8 h-8 glass-vision rounded-lg flex items-center justify-center text-white/40 hover:text-white transition-colors text-lg font-bold">-</button>
            </div>

            {/* Legend */}
            <div className="absolute top-8 left-8 z-10 space-y-2 pointer-events-none">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-vision-cyan shadow-neon-cyan" />
                    <span className="text-[10px] font-black tracking-[0.2em] text-white/80 uppercase">Data Nodes (Core/Peripheral)</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-4 h-[1px] bg-white/20" />
                    <span className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase">Relationships</span>
                </div>
            </div>

            <div className="absolute top-8 right-8 z-20 flex gap-2">
                <div className="glass-vision p-2 rounded-xl text-vision-cyan hover:bg-vision-cyan/10 transition-colors pointer-events-auto cursor-pointer">
                    <Layers size={16} />
                </div>
                <div className="glass-vision p-2 rounded-xl text-white/20 hover:text-white transition-colors cursor-pointer">
                    <Database size={16} />
                </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
                {loading ? (
                    <div className="text-vision-cyan text-sm font-black tracking-[0.3em] animate-pulse uppercase">Scanning Space...</div>
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center">

                        {/* THE CENTRAL HUB (The "Knowledge Graph" from the image) */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute z-20 flex flex-col items-center"
                        >
                            <div className="w-12 h-12 bg-vision-cyan/20 rounded-full border border-vision-cyan flex items-center justify-center shadow-neon-cyan relative">
                                <Search size={20} className="text-vision-cyan" />
                                <motion.div
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="absolute inset-0 border-2 border-vision-cyan rounded-full"
                                />
                            </div>
                            <span className="mt-2 text-[8px] font-black text-vision-cyan tracking-[0.2em] uppercase bg-black/50 px-2 py-1 rounded">Knowledge Graph</span>
                        </motion.div>

                        {/* ANCHOR LABELS */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <FloatingLabel x={-150} y={100} text="Machine Learning" color="cyan" />
                            <FloatingLabel x={180} y={-120} text="Website Analysis" color="purple" />
                            <FloatingLabel x={-200} y={-80} text="Data Processing" color="blue" />
                            <FloatingLabel x={150} y={80} text="Scraping Engine" color="cyan" />
                        </div>

                        {/* SVG Connections Layer */}
                        <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                            <defs>
                                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="rgba(34, 211, 238, 0.2)" />
                                    <stop offset="100%" stopColor="rgba(192, 132, 252, 0.2)" />
                                </linearGradient>
                            </defs>
                            {connections.map((l, i) => (
                                <motion.line
                                    key={i}
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 2, delay: i * 0.01 }}
                                    x1={`calc(50% + ${l.x1}px)`}
                                    y1={`calc(50% + ${l.y1}px)`}
                                    x2={`calc(50% + ${l.x2}px)`}
                                    y2={`calc(50% + ${l.y2}px)`}
                                    stroke="url(#lineGrad)"
                                    strokeWidth="0.5"
                                />
                            ))}
                            {/* Visual connections to the center */}
                            {points.slice(0, 8).map((p, i) => (
                                <line
                                    key={`center-${i}`}
                                    x1="50%" y1="50%"
                                    x2={`calc(50% + ${p.x}px)`}
                                    y2={`calc(50% + ${p.y}px)`}
                                    stroke="rgba(34, 211, 238, 0.1)"
                                    strokeWidth="0.5"
                                    strokeDasharray="2 4"
                                />
                            ))}
                        </svg>

                        {points.map((p, i) => (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: 1,
                                    x: p.x,
                                    y: p.y
                                }}
                                whileHover={{ zIndex: 100 }}
                                onMouseEnter={() => setHoveredPoint(p)}
                                onMouseLeave={() => setHoveredPoint(null)}
                                className="absolute"
                            >
                                <div className="relative group/node cursor-pointer">
                                    <motion.div
                                        className={`rounded-full ${i % 3 === 0 ? 'w-2 h-2 bg-vision-cyan shadow-neon-cyan' : 'w-1 h-1 bg-white/40'}`}
                                        animate={{ opacity: [0.4, 1, 0.4] }}
                                        transition={{ duration: 2 + Math.random() * 2, repeat: Infinity }}
                                    />
                                    <AnimatePresence>
                                        {hoveredPoint?.id === p.id && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 border border-vision-cyan/30 px-2 py-1 rounded text-[8px] text-vision-cyan font-bold uppercase tracking-widest z-[110]"
                                            >
                                                {p.title}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
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

const FloatingLabel = ({ x, y, text, color }: { x: number, y: number, text: string, color: string }) => (
    <motion.div
        animate={{ y: [y, y - 10, y] }}
        transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute"
        style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
    >
        <span className={`text-[9px] font-black uppercase tracking-[0.2em] opacity-30 ${color === 'cyan' ? 'text-vision-cyan' : 'text-vision-purple'}`}>
            {text}
        </span>
    </motion.div>
);

export default VectorSpace;

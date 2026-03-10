import React from 'react';
import { User } from 'lucide-react';
import { motion } from 'framer-motion';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    return (
        <div className="min-h-screen flex flex-col items-center">
            {/* Top Navigation */}
            <header className="w-full flex justify-between items-center px-8 py-6 max-w-7xl mx-auto z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-vision-cyan rounded-lg flex items-center justify-center shadow-neon-cyan">
                        <span className="text-background font-black text-xl italic">V</span>
                    </div>
                    <div className="flex flex-col -gap-1">
                        <span className="text-xs font-black tracking-[0.2em] text-white">VISIONARY</span>
                        <span className="text-[10px] font-medium tracking-[0.3em] text-vision-cyan/80">INTELLIGENCE</span>
                    </div>
                </div>

                <nav className="hidden md:flex items-center gap-12">
                    <NavItem label="PROJECTS" active />
                    <NavItem label="TECH STACK" />
                    <NavItem label="PORTFOLIO" />
                </nav>

                <div className="flex items-center gap-4">
                    <button className="w-10 h-10 rounded-full glass-vision flex items-center justify-center text-secondary hover:text-white transition-colors">
                        <User size={20} />
                    </button>
                </div>
            </header>

            <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
};

const NavItem = ({ label, active }: { label: string; active?: boolean }) => (
    <button className={`text-xs font-bold tracking-[0.2em] transition-all relative py-2 ${active ? 'text-vision-cyan' : 'text-secondary hover:text-white'}`}>
        {label}
        {active && (
            <motion.div
                layoutId="nav-underline"
                className="absolute -bottom-1 left-0 right-0 h-[3px] bg-vision-cyan shadow-neon-cyan rounded-full"
            />
        )}
    </button>
);

export default Layout;

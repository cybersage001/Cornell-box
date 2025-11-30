import React from 'react';
import { ArrowLeft, Github } from 'lucide-react';

interface HeaderProps {
    onBack: () => void;
}

const Header: React.FC<HeaderProps> = ({ onBack }) => {
    return (
        <header className="w-full h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-700/50 flex items-center justify-between px-6 fixed top-0 left-0 z-50">
            <div className="flex items-center gap-4">
                <button 
                    onClick={onBack}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white"
                    title="返回主页"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <span className="text-white font-bold text-lg">P</span>
                    </div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 hidden sm:block">
                        WebGL Path Tracer
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <a 
                    href="https://github.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm text-slate-300 hover:text-white"
                >
                    <Github className="w-4 h-4" />
                    <span className="hidden sm:inline">查看源码</span>
                </a>
            </div>
        </header>
    );
};

export default Header;

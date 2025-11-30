import React from 'react';
import { Sun, Play, Pause, RotateCcw, Camera, Settings2 } from 'lucide-react';

interface ControlsProps {
    lightIntensity: number;
    setLightIntensity: (value: number) => void;
    isRendering: boolean;
    setIsRendering: (value: boolean) => void;
    handleReset: () => void;
    frame: number;
}

const Controls: React.FC<ControlsProps> = ({
    lightIntensity,
    setLightIntensity,
    isRendering,
    setIsRendering,
    handleReset,
    frame
}) => {
    return (
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl w-full max-w-xs flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b border-slate-700/50 pb-4">
                <Settings2 className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">控制面板</h3>
            </div>

            {/* Status Card */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-400">状态</span>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isRendering ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                        <span className={`text-xs font-medium ${isRendering ? 'text-green-400' : 'text-red-400'}`}>
                            {isRendering ? '渲染中' : '已暂停'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">采样数</span>
                    <span className="text-sm font-mono font-bold text-white">{frame}</span>
                </div>
                <div className="mt-2 w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${Math.min((frame / 1000) * 100, 100)}%` }}
                    />
                </div>
            </div>

            {/* Light Intensity */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                        <Sun className="w-4 h-4 text-yellow-400" />
                        光照强度
                    </label>
                    <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-blue-400">
                        {lightIntensity.toFixed(1)}
                    </span>
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="0.1"
                    value={lightIntensity}
                    onChange={(e) => setLightIntensity(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider accent-blue-500 hover:accent-blue-400 transition-all"
                />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-auto">
                <button 
                    onClick={() => setIsRendering(!isRendering)}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-200 transform active:scale-95 ${
                        isRendering 
                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20' 
                            : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20'
                    }`}
                >
                    {isRendering ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isRendering ? '暂停' : '开始'}
                </button>
                
                <button 
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all duration-200 transform active:scale-95"
                >
                    <RotateCcw className="w-4 h-4" />
                    重置
                </button>
            </div>

            {/* Instructions */}
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30 text-xs text-slate-400 space-y-2">

                <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        相机控制：左键旋转，右键平移，滚轮缩放
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Controls;

import React, { useState } from "react";
import PathTracer from "./components/PathTracer/index";

function App() {
  const [showPathTracer, setShowPathTracer] = useState(false);

  if (showPathTracer) {
    return <PathTracer />;
  }

  return (
    <main className="min-h-screen flex items-center justify-center relative bg-slate-950 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(59,130,246,0.1),transparent_50%)]"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      
      <div className="text-center z-10 max-w-5xl mx-auto px-6 py-12 relative">
        <div className="mb-12 space-y-6">

          <h1 className="text-white font-bold leading-tight text-center text-6xl sm:text-7xl lg:text-8xl tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
              WebGL Path Tracer
            </span>
          </h1>
          
          <p className="text-slate-400 font-light leading-relaxed text-center max-w-2xl mx-auto text-xl sm:text-2xl">
            在浏览器中直接体验基于物理的渲染技术。
            实时全局光照、柔和阴影和颜色渗透效果。
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
          <button 
            onClick={() => setShowPathTracer(true)}
            className="group relative px-8 py-4 bg-white text-slate-900 font-bold rounded-full shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] transform hover:scale-105 transition-all duration-300 text-lg overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              启动演示
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          

        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
          <div className="group p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/30 transition-all duration-300 hover:bg-slate-900/80">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <span className="text-2xl">🌟</span>
            </div>
            <h3 className="text-white font-bold text-xl mb-3">全局光照</h3>
            <p className="text-slate-400 leading-relaxed">
              模拟光线在场景中的反弹，创造逼真的环境光照和颜色渗透效果。
            </p>
          </div>
          
          <div className="group p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/30 transition-all duration-300 hover:bg-slate-900/80">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <span className="text-2xl">🎨</span>
            </div>
            <h3 className="text-white font-bold text-xl mb-3">渐进式渲染</h3>
            <p className="text-slate-400 leading-relaxed">
              随时间累积样本以减少噪点，使用WebGL 2.0收敛到真实图像。
            </p>
          </div>
          
          <div className="group p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-pink-500/30 transition-all duration-300 hover:bg-slate-900/80">
            <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="text-white font-bold text-xl mb-3">交互式控制</h3>
            <p className="text-slate-400 leading-relaxed">
              实时相机操控和参数调节。调整光照强度，即时观看场景更新。
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;

import React, { useState, useRef } from 'react';
import Canvas from './Canvas';
import Controls from './Controls';
import Header from './Header';

const PathTracer: React.FC = () => {
    const [lightIntensity, setLightIntensity] = useState(80.0);
    const [isRendering, setIsRendering] = useState(true);
    const [frame, setFrame] = useState(0);
    const resetRef = useRef<(() => void) | null>(null);

    const handleReset = () => {
        if (resetRef.current) {
            resetRef.current();
        }
    };

    const handleBack = () => {
        window.location.reload(); // Simple way to go back to "home" since App.tsx toggles state
    };

    return (
        <div className="w-full h-screen bg-slate-950 text-white overflow-hidden flex flex-col">
            <Header onBack={handleBack} />
            
            <main className="flex-1 flex relative pt-16">
                {/* Canvas Area */}
                <div className="flex-1 relative bg-black">
                    <div className="absolute inset-0">
                        <Canvas 
                            lightIntensity={lightIntensity}
                            isRendering={isRendering}
                            onFrameUpdate={setFrame}
                            onResetRef={resetRef}
                        />
                    </div>
                    
                    {/* Overlay Info */}
                    <div className="absolute bottom-6 left-6 pointer-events-none">
                        <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs text-slate-400 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                            WebGL 2.0 Active
                        </div>
                    </div>
                </div>

                {/* Sidebar Controls */}
                <aside className="w-80 bg-slate-900 border-l border-slate-800 p-6 flex flex-col z-10 shadow-2xl">
                    <Controls 
                        lightIntensity={lightIntensity}
                        setLightIntensity={setLightIntensity}
                        isRendering={isRendering}
                        setIsRendering={setIsRendering}
                        handleReset={handleReset}
                        frame={frame}
                    />
                </aside>
            </main>
        </div>
    );
};

export default PathTracer;

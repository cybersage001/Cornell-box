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
            
            <main className="flex-1 flex pt-16 relative">
                {/* Canvas Area */}
                <div className="flex-1 relative flex items-center justify-center p-2">
                    <div className="bg-black rounded-xl overflow-hidden shadow-2xl" style={{ width: '90vmin', height: '90vmin' }}>
                    <Canvas 
                        lightIntensity={lightIntensity}
                        isRendering={isRendering}
                        onFrameUpdate={setFrame}
                        onResetRef={resetRef}
                    />
                    
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

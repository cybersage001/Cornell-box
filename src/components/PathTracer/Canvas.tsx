import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { vertexShader, fragmentShader } from './PathTracingShader.glsl';
import { screenVertexShader, screenFragmentShader } from './ScreenShader.glsl';

interface CanvasProps {
    lightIntensity: number;
    isRendering: boolean;
    onFrameUpdate: (frame: number) => void;
    onResetRef: React.MutableRefObject<(() => void) | null>;
}

const Canvas: React.FC<CanvasProps> = ({ lightIntensity, isRendering, onFrameUpdate, onResetRef }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Refs for Three.js objects
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);
    const screenMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
    
    // Ping-Pong Buffers
    const targetARef = useRef<THREE.WebGLRenderTarget | null>(null);
    const targetBRef = useRef<THREE.WebGLRenderTarget | null>(null);
    const currentTargetRef = useRef(0);

    // Virtual Camera
    const virtualCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    
    const frameCountRef = useRef(0);
    const isRenderingRef = useRef(isRendering);

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(1); // Set to 1 to prevent automatic zoom
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Initialize Ping-Pong Targets
        const options = {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            type: THREE.HalfFloatType, 
            format: THREE.RGBAFormat,
        };
        // Initial size, will be updated by ResizeObserver
        targetARef.current = new THREE.WebGLRenderTarget(1, 1, options);
        targetBRef.current = new THREE.WebGLRenderTarget(1, 1, options);

        // Initialize Path Tracing Scene
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        // Virtual Camera Setup (Cornell Box View)
        const virtualCamera = new THREE.PerspectiveCamera(20, 1, 1, 1000);
        virtualCamera.position.set(278, 273, -400);
        virtualCamera.lookAt(278, 273, 0);
        virtualCameraRef.current = virtualCamera;

        // Controls
        const controls = new OrbitControls(virtualCamera, renderer.domElement);
        controls.target.set(278, 273, 0);
        controls.update();
        controls.addEventListener('change', () => {
            frameCountRef.current = 0;
            onFrameUpdate(0);
        });
        controlsRef.current = controls;

        // Initial Camera Vectors
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();
        virtualCamera.getWorldDirection(forward);
        right.crossVectors(forward, virtualCamera.up).normalize();
        up.crossVectors(right, forward).normalize();

        // Path Tracing Material
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                tPrevious: { value: null },
                uFrame: { value: 0 },
                uResolution: { value: new THREE.Vector2(1, 1) },
                uCameraPos: { value: virtualCamera.position.clone() },
                uCameraDir: { value: forward },
                uCameraUp: { value: up },
                uCameraRight: { value: right },
                uSeed: { value: Math.random() * 100.0 },
                uLightIntensity: { value: lightIntensity }
            }
        });
        materialRef.current = material;

        const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
        scene.add(quad);

        // Initialize Screen Display Scene
        const screenScene = new THREE.Scene();
        const screenMaterial = new THREE.ShaderMaterial({
            vertexShader: screenVertexShader,
            fragmentShader: screenFragmentShader,
            uniforms: {
                tTexture: { value: null }
            }
        });
        screenMaterialRef.current = screenMaterial;
        const screenQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), screenMaterial);
        screenScene.add(screenQuad);

        // Set initial size
        const initialSize = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.9);
        renderer.setSize(initialSize, initialSize);
        
        if (materialRef.current) {
            materialRef.current.uniforms.uResolution.value.set(initialSize, initialSize);
        }
        
        targetARef.current?.setSize(initialSize, initialSize);
        targetBRef.current?.setSize(initialSize, initialSize);

        // Resize Observer - only handle window resize now
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width === 0 || height === 0) return;

                // Use the container size or fixed size
                const size = Math.min(width, height, window.innerWidth * 0.9, window.innerHeight * 0.9);
                
                renderer.setSize(size, size);
                
                if (materialRef.current) {
                    materialRef.current.uniforms.uResolution.value.set(size, size);
                }
                
                // Update render targets
                targetARef.current?.setSize(size, size);
                targetBRef.current?.setSize(size, size);
                
                // Reset accumulation on resize
                frameCountRef.current = 0;
                onFrameUpdate(0);
            }
        });
        resizeObserver.observe(containerRef.current);

        // Animation Loop
        let frameId: number;

        const animate = () => {
            if (isRenderingRef.current) {
                // Update Camera Uniforms
                if (virtualCameraRef.current && materialRef.current) {
                    const cam = virtualCameraRef.current;
                    cam.getWorldDirection(forward);
                    right.crossVectors(forward, cam.up).normalize();
                    up.crossVectors(right, forward).normalize();

                    materialRef.current.uniforms.uCameraPos.value.copy(cam.position);
                    materialRef.current.uniforms.uCameraDir.value.copy(forward);
                    materialRef.current.uniforms.uCameraUp.value.copy(up);
                    materialRef.current.uniforms.uCameraRight.value.copy(right);
                }

                // Swap Targets
                const prevTarget = currentTargetRef.current === 0 ? targetBRef.current : targetARef.current;
                const currTarget = currentTargetRef.current === 0 ? targetARef.current : targetBRef.current;

                // Update Uniforms
                material.uniforms.tPrevious.value = prevTarget!.texture;
                material.uniforms.uFrame.value = frameCountRef.current;
                material.uniforms.uSeed.value = Math.random() * 1000.0;

                // Render to Current Target
                renderer.setRenderTarget(currTarget);
                renderer.render(scene, camera);

                // Render to Screen
                renderer.setRenderTarget(null);
                screenMaterial.uniforms.tTexture.value = currTarget!.texture;
                renderer.render(screenScene, camera);

                // Update State
                currentTargetRef.current = 1 - currentTargetRef.current;
                frameCountRef.current++;
                
                if (frameCountRef.current % 5 === 0) {
                    onFrameUpdate(frameCountRef.current);
                }
            }

            frameId = requestAnimationFrame(animate);
        };

        animate();

        // Expose reset function
        onResetRef.current = () => {
            frameCountRef.current = 0;
            onFrameUpdate(0);
        };

        return () => {
            cancelAnimationFrame(frameId);
            resizeObserver.disconnect();
            if (containerRef.current && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
            targetARef.current?.dispose();
            targetBRef.current?.dispose();
            controls.dispose();
            onResetRef.current = null;
        };
    }, []); // Run once on mount

    // Update Uniforms when Settings Change
    useEffect(() => {
        if (materialRef.current) {
            materialRef.current.uniforms.uLightIntensity.value = lightIntensity;
            frameCountRef.current = 0;
            onFrameUpdate(0);
        }
    }, [lightIntensity]);

    // Handle isRendering change
    useEffect(() => {
        isRenderingRef.current = isRendering;
    }, [isRendering]);

    return (
        <div ref={containerRef} className="bg-black rounded-lg overflow-hidden shadow-2xl" />
    );
};

export default Canvas;

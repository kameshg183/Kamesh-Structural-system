import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface ThreeDViewProps {
  points: { x: number; y: number }[];
  length: number;
  darkMode: boolean;
}

export const ThreeDView: React.FC<ThreeDViewProps> = ({ points, length, darkMode }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current || points.length === 0) return;

    // --- Setup ---
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    // Slightly off-white background in light mode for better contrast with highlights
    // Dark mode: Deep gray/blue background
    scene.background = new THREE.Color(darkMode ? 0x0f172a : 0xf8fafc);

    // Camera setup
    const fov = 50;
    const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 100000);

    // Calculate bounding info
    const midX = length / 2;
    const maxY = Math.max(...points.map(p => p.y));
    const minY = Math.min(...points.map(p => p.y));
    const midY = (maxY + minY) / 2;

    // Position camera to fit the beam length
    const dist = (length * 0.7) / Math.tan((fov * Math.PI) / 360);
    
    camera.position.set(midX, midY + dist * 0.4, dist * 0.8);
    camera.lookAt(midX, midY, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio); // Crisp rendering on high DPI screens
    mountRef.current.appendChild(renderer.domElement);

    // --- Controls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(midX, midY, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // --- Lighting ---
    // Hemisphere light for natural top-down gradient
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    // Main Directional Light (Sun-like)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(midX + length/2, maxY + length, length * 0.5);
    dirLight.castShadow = false;
    scene.add(dirLight);
    
    // Back Light (Rim light) to separate object from background
    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(midX - length/2, maxY, -length);
    scene.add(backLight);

    // --- Helpers ---
    // Ground Grid - subtle
    const gridHelper = new THREE.GridHelper(length * 1.5, 20, darkMode ? 0x334155 : 0xcbd5e1, darkMode ? 0x1e293b : 0xf1f5f9);
    gridHelper.position.set(midX, -100, 0);
    scene.add(gridHelper);

    // --- Objects ---

    // 1. Tendon Tube
    const curvePoints = points.map(p => new THREE.Vector3(p.x, p.y, 0));
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    
    // Tube parameters: path, tubularSegments, radius, radialSegments, closed
    // Radius fixed at 25 for good visibility
    const tubeGeo = new THREE.TubeGeometry(curve, Math.min(300, points.length * 3), 25, 16, false);
    
    // Enhanced Material: Glossy plastic look
    const tubeMat = new THREE.MeshPhongMaterial({ 
      color: 0x3b82f6, // Bright Blue
      emissive: 0x1d4ed8, // Deep Blue glow
      emissiveIntensity: darkMode ? 0.35 : 0.1, // Glows more in dark, slight pop in light
      shininess: 150, // Very shiny
      specular: 0xbfdbfe, // Almost white highlights
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(tube);

    // 2. Reference Baseline (0 height)
    const basePoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(length, 0, 0)];
    const baseGeo = new THREE.BufferGeometry().setFromPoints(basePoints);
    const baseMat = new THREE.LineBasicMaterial({ 
        color: darkMode ? 0xe2e8f0 : 0x1e293b, // White-ish in dark, Slate-900 in light
        linewidth: 2 
    });
    const baseLine = new THREE.Line(baseGeo, baseMat);
    scene.add(baseLine);

    // 3. Drop Lines (Verticals)
    const step = Math.max(1, Math.floor(points.length / 20)); // fewer lines
    const dropsGeo = new THREE.BufferGeometry();
    const dropPositions: number[] = [];
    
    for (let i = 0; i < points.length; i += step) {
        const p = points[i];
        // Line from (x, 0, 0) to (x, y, 0)
        dropPositions.push(p.x, 0, 0);
        dropPositions.push(p.x, p.y, 0);
    }
    // Always include end point
    const lastP = points[points.length - 1];
    if (lastP) {
      dropPositions.push(lastP.x, 0, 0);
      dropPositions.push(lastP.x, lastP.y, 0);
    }

    dropsGeo.setAttribute('position', new THREE.Float32BufferAttribute(dropPositions, 3));
    
    // High contrast drop lines
    const dropsMat = new THREE.LineBasicMaterial({ 
        color: darkMode ? 0x94a3b8 : 0x64748b, // Slate-400 / Slate-500
        transparent: true, 
        opacity: 0.7
    });
    const drops = new THREE.LineSegments(dropsGeo, dropsMat);
    scene.add(drops);

    // 4. Visual Anchors (Cubes at ends)
    const blockGeo = new THREE.BoxGeometry(80, maxY + 100, 150);
    const blockMat = new THREE.MeshStandardMaterial({ 
        color: darkMode ? 0x475569 : 0xcbd5e1, 
        transparent: true, 
        opacity: 0.3,
        roughness: 0.2,
        metalness: 0.1
    });
    
    const startBlock = new THREE.Mesh(blockGeo, blockMat);
    startBlock.position.set(0, (maxY + 100)/2 - 50, 0);
    scene.add(startBlock);

    const endBlock = new THREE.Mesh(blockGeo, blockMat);
    endBlock.position.set(length, (maxY + 100)/2 - 50, 0);
    scene.add(endBlock);

    // --- Animation Loop ---
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // --- Resize Handling ---
    const handleResize = () => {
        if (!mountRef.current) return;
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- Cleanup ---
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose Geometries and Materials
      tubeGeo.dispose();
      tubeMat.dispose();
      baseGeo.dispose();
      baseMat.dispose();
      dropsGeo.dispose();
      dropsMat.dispose();
      blockGeo.dispose();
      blockMat.dispose();
      gridHelper.dispose();
      renderer.dispose();
    };
  }, [points, length, darkMode]);

  return (
    <div className="relative w-full h-full">
        <div ref={mountRef} className="w-full h-full cursor-move rounded-lg overflow-hidden ring-1 ring-gray-200 dark:ring-gray-800" />
        <div className="absolute top-2 left-2 text-[10px] bg-white/10 dark:bg-black/30 backdrop-blur-sm text-gray-800 dark:text-white px-2 py-1 rounded pointer-events-none select-none border border-white/20">
            Rotate: Left Click | Pan: Right Click | Zoom: Scroll
        </div>
    </div>
  );
};
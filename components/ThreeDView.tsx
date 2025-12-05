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
    scene.background = new THREE.Color(darkMode ? 0x111827 : 0xf3f4f6);

    // Camera setup
    const fov = 50;
    const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 100000);

    // Calculate bounding info
    const midX = length / 2;
    const maxY = Math.max(...points.map(p => p.y));
    const minY = Math.min(...points.map(p => p.y));
    const midY = (maxY + minY) / 2;

    // Position camera to fit the beam length
    // Distance required to fit 'length' horizontally with some margin
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
    // Increased lighting intensity for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(midX, maxY + length, length * 0.5);
    scene.add(dirLight);
    
    const backLight = new THREE.DirectionalLight(0xffffff, 0.4);
    backLight.position.set(midX, maxY, -length);
    scene.add(backLight);

    // --- Helpers ---
    // Ground Grid
    const gridHelper = new THREE.GridHelper(length * 1.5, 20, darkMode ? 0x555555 : 0x999999, darkMode ? 0x333333 : 0xe5e7eb);
    gridHelper.position.set(midX, -100, 0);
    scene.add(gridHelper);

    // --- Objects ---

    // 1. Tendon Tube
    const curvePoints = points.map(p => new THREE.Vector3(p.x, p.y, 0));
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    
    // Tube parameters: path, tubularSegments, radius, radialSegments, closed
    const tubeGeo = new THREE.TubeGeometry(curve, Math.min(200, points.length * 2), 20, 12, false);
    
    // Enhanced Material: High shininess and specular highlights
    const tubeMat = new THREE.MeshPhongMaterial({ 
      color: 0x2563eb, 
      emissive: darkMode ? 0x1e3a8a : 0x000000, // Slight blue glow in dark mode
      emissiveIntensity: darkMode ? 0.3 : 0,
      shininess: 100,
      specular: 0x60a5fa, // Light blue highlights
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(tube);

    // 2. Reference Baseline (0 height)
    const basePoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(length, 0, 0)];
    const baseGeo = new THREE.BufferGeometry().setFromPoints(basePoints);
    const baseMat = new THREE.LineBasicMaterial({ 
        color: darkMode ? 0x9ca3af : 0x4b5563, // High contrast gray
        linewidth: 2 
    });
    const baseLine = new THREE.Line(baseGeo, baseMat);
    scene.add(baseLine);

    // 3. Drop Lines (Verticals)
    // Only show fewer lines to keep it clean
    const step = Math.max(1, Math.floor(points.length / 15));
    const dropsGeo = new THREE.BufferGeometry();
    const dropPositions: number[] = [];
    
    for (let i = 0; i < points.length; i += step) {
        const p = points[i];
        // Line from (x, 0, 0) to (x, y, 0)
        dropPositions.push(p.x, 0, 0);
        dropPositions.push(p.x, p.y, 0);
    }
    dropsGeo.setAttribute('position', new THREE.Float32BufferAttribute(dropPositions, 3));
    
    // More visible drop lines
    const dropsMat = new THREE.LineBasicMaterial({ 
        color: darkMode ? 0x6b7280 : 0x9ca3af, 
        transparent: true, 
        opacity: 0.6 
    });
    const drops = new THREE.LineSegments(dropsGeo, dropsMat);
    scene.add(drops);

    // 4. Start/End Blocks (Visual Anchors)
    const blockGeo = new THREE.BoxGeometry(100, maxY + 100, 200);
    const blockMat = new THREE.MeshLambertMaterial({ color: 0x9ca3af, transparent: true, opacity: 0.15 });
    
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
        <div ref={mountRef} className="w-full h-full cursor-move rounded-lg overflow-hidden" />
        <div className="absolute top-2 left-2 text-[10px] bg-black/50 text-white px-2 py-1 rounded pointer-events-none select-none">
            Rotate: Left Click | Pan: Right Click | Zoom: Scroll
        </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { AppState, CalculationResult } from './types';
import { calculateProfile } from './services/calculationService';
import { ConfigPanel } from './components/ConfigPanel';
import { ProfileSelector, PROFILE_DESCRIPTIONS } from './components/ProfileSelector';
import { ResultsPanel } from './components/ResultsPanel';
import { ThreeDView } from './components/ThreeDView';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot
} from 'recharts';

const DEFAULT_STATE: AppState = {
  inputProfile: 'duct_soffit',
  outputProfile: 'duct_soffit',
  anchors: 'none',
  strandDiameter: '15.2',
  ductType: 'slab',
  ductSize: '5s',
  ductDiaOD: 23,
  strandEcc: 1.4,
  minRadius: 3200,
  rounding: 1,
  spacing: 1000,
  spacingDirection: 'right',
  selectedProfile: 1,
  length: 7000,
  highPt: 450,
  lowPt: 45,
  inflectionPt: ''
};

export default function App() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [result, setResult] = useState<CalculationResult>({ points: [], drapes: [], spaces: [], betaSum: 0, inflectionPoints: [] });
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const handleStateChange = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const performCalculation = () => {
    const res = calculateProfile(state);
    setResult(res);
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initial calculation on mount
  useEffect(() => {
    performCalculation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
      performCalculation();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedProfile, state.length, state.highPt, state.lowPt, state.spacing, state.rounding, state.minRadius, state.inflectionPt]);

  // Chart Colors based on mode
  const gridColor = darkMode ? "#374151" : "#e5e7eb";
  const axisColor = darkMode ? "#9ca3af" : "#666";
  const dotFill = darkMode ? "#1f2937" : "#fff";
  const dotText = darkMode ? "#e5e7eb" : "#000";
  const tooltipBg = darkMode ? "#1f2937" : "#fff";
  const tooltipBorder = darkMode ? "#4b5563" : "#ccc";

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    return (
        <g>
           <circle cx={cx} cy={cy} r={3} fill={dotFill} stroke="#2563eb" strokeWidth={2} />
           <text x={cx} y={cy - 10} textAnchor="middle" fill={dotText} fontSize={12} fontWeight="bold">{payload.label}</text>
           <line x1={cx} y1={cy} x2={cx} y2={350} stroke={gridColor} strokeDasharray="3 3" />
        </g>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: dotText }} 
          className="border rounded px-2 py-2 text-xs shadow-lg bg-opacity-95"
        >
          <div className="font-bold mb-1">{`Dist: ${label}mm`}</div>
          <div className="text-blue-600 dark:text-blue-400 font-semibold mb-1">
             {`Height: ${Number(payload[0].value).toFixed(1)}`}
          </div>
          <div className="pt-1 border-t border-gray-200 dark:border-gray-700 space-y-0.5 text-gray-500 dark:text-gray-400">
             <div className="flex justify-between gap-4">
               <span>High Pt:</span>
               <span className="font-mono">{state.highPt}</span>
             </div>
             <div className="flex justify-between gap-4">
               <span>Low Pt:</span>
               <span className="font-mono">{state.lowPt}</span>
             </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 p-2 md:p-4 overflow-y-auto transition-colors duration-200">
      {/* Header */}
      <header className="mb-2 border-b border-gray-300 dark:border-gray-700 pb-2 flex justify-between items-center">
        <h1 className="text-lg font-bold text-gray-700 dark:text-gray-200 flex items-center">
          <span className="mr-2">📈</span>
          Utracon Structural Systems - Tendon Drapes
        </h1>
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </header>

      <div className="flex-grow flex flex-col max-w-5xl mx-auto w-full bg-white dark:bg-gray-900 shadow-lg rounded-lg border border-gray-200 dark:border-gray-800 p-4 transition-colors duration-200">
        
        {/* Top Config */}
        <ConfigPanel 
          state={state} 
          onChange={handleStateChange}
          onCalc={performCalculation}
          onFlip={() => {
             const temp = state.highPt;
             handleStateChange({ highPt: state.lowPt, lowPt: temp });
          }}
        />

        {/* Inputs & Profile Selector */}
        <div className="mt-4 flex flex-col md:flex-row gap-4 items-start border-t border-gray-200 dark:border-gray-700 pt-4">
          
          {/* Inputs moved to the left - 2x2 grid */}
          <div className="flex-shrink-0 w-full md:w-auto grid grid-cols-2 gap-x-4 gap-y-2 bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 transition-colors">
             <div className="flex flex-col">
               <label className="text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Length :</label>
               <div className="flex items-center">
                 <input 
                    type="number" 
                    value={state.length}
                    onChange={(e) => handleStateChange({ length: parseFloat(e.target.value) || 0 })}
                    className="w-full min-w-[80px] border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded px-2 py-1 text-sm text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                 />
                 <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">mm</span>
               </div>
             </div>
             
             <div className="flex flex-col">
               <label className="text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">High Pt :</label>
               <div className="flex items-center">
                 <input 
                    type="number" 
                    value={state.highPt}
                    onChange={(e) => handleStateChange({ highPt: parseFloat(e.target.value) || 0 })}
                    className="w-full min-w-[80px] border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded px-2 py-1 text-sm text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                 />
                 <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">mm</span>
               </div>
             </div>

             <div className="flex flex-col">
               <label className="text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Low Pt :</label>
               <div className="flex items-center">
                 <input 
                    type="number" 
                    value={state.lowPt}
                    onChange={(e) => handleStateChange({ lowPt: parseFloat(e.target.value) || 0 })}
                    className="w-full min-w-[80px] border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded px-2 py-1 text-sm text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                 />
                 <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">mm</span>
               </div>
             </div>

             <div className="flex flex-col">
               <label className="text-xs font-bold mb-1 text-gray-700 dark:text-gray-300 whitespace-nowrap">Inflection Point :</label>
               <div className="flex items-center">
                 <input 
                    type="text" 
                    value={state.inflectionPt}
                    onChange={(e) => handleStateChange({ inflectionPt: e.target.value })}
                    className="w-full min-w-[80px] border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded px-2 py-1 text-sm text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-gray-400"
                    placeholder="Auto (mm or %)"
                 />
                 <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">mm/%</span>
               </div>
             </div>
          </div>

          <div className="flex-grow min-w-0">
             <ProfileSelector 
                selected={state.selectedProfile} 
                onSelect={(id) => handleStateChange({ selectedProfile: id })}
             />
          </div>

        </div>

        {/* Chart Info Header */}
        <div className="mt-4 px-1 flex justify-between items-end">
          <div className="text-xs font-mono">
            <div className="font-bold underline mb-1 text-gray-800 dark:text-gray-200">Tendon Profile to Soffit of Duct</div>
            <div className="text-gray-700 dark:text-gray-300">
               <span className="font-semibold">Curve Type {state.selectedProfile}:</span> {PROFILE_DESCRIPTIONS[state.selectedProfile]}
            </div>
            <div className="text-blue-600 dark:text-blue-400 mt-1 flex flex-wrap gap-x-6 items-center">
               <span>Σ β = {result.betaSum} rad</span>
               {result.inflectionPoints.length > 0 && (
                 <span className="font-semibold text-gray-600 dark:text-gray-400">
                    Inflection x = {result.inflectionPoints.map(p => Math.round(p.x)).join(', ')} mm
                 </span>
               )}
            </div>
          </div>

          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-md border border-gray-300 dark:border-gray-700">
            <button
               onClick={() => setViewMode('2D')}
               className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                  viewMode === '2D' 
                  ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
               }`}
            >
              2D
            </button>
            <button
               onClick={() => setViewMode('3D')}
               className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                  viewMode === '3D' 
                  ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
               }`}
            >
              3D
            </button>
          </div>
        </div>

        {/* Chart / 3D Area */}
        <div className="mt-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 relative h-[450px] transition-colors">
           {viewMode === '2D' ? (
             <>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={result.points} 
                      margin={{ top: 40, right: 20, bottom: 20, left: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                      <XAxis 
                        dataKey="x" 
                        type="number" 
                        domain={[0, state.length]} 
                        tickCount={Math.floor(state.length/1000) + 1}
                        tick={{fontSize: 12, fill: axisColor}}
                      />
                      <YAxis 
                        domain={['auto', 'auto']} 
                        hide 
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="y" 
                        stroke="#2563eb" 
                        strokeWidth={2} 
                        dot={<CustomDot />}
                        isAnimationActive={false}
                      />
                      {result.inflectionPoints.map((pt, idx) => (
                          <ReferenceDot 
                            key={idx} 
                            x={pt.x} 
                            y={pt.y} 
                            r={6} 
                            fill="#db2777" 
                            stroke="#fff"
                            strokeWidth={2}
                            label={{ position: 'top', value: 'IP', fill: dotText, fontSize: 10, fontWeight: 'bold' }}
                          />
                      ))}
                    </LineChart>
                </ResponsiveContainer>
                <div className="absolute bottom-2 left-2 text-[10px] text-gray-400 dark:text-gray-500">
                    Units: mm
                </div>
             </>
           ) : (
             <ThreeDView points={result.points} length={state.length} darkMode={darkMode} />
           )}
        </div>

        {/* Footer Results */}
        <ResultsPanel drapes={result.drapes} spaces={result.spaces} inflectionPoints={result.inflectionPoints} />

      </div>
      
      <footer className="mt-4 text-center text-xs text-gray-400 dark:text-gray-600">
         &copy; {new Date().getFullYear()} Utracon Structural Systems
      </footer>
    </div>
  );
}
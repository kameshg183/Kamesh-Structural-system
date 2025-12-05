import React, { useState, useEffect } from 'react';
import { AppState, CalculationResult } from './types';
import { calculateProfile } from './services/calculationService';
import { ConfigPanel } from './components/ConfigPanel';
import { ProfileSelector, PROFILE_DESCRIPTIONS } from './components/ProfileSelector';
import { ResultsPanel } from './components/ResultsPanel';
import { ThreeDView } from './components/ThreeDView';
import { convertField, convertSimple } from './utils/unitConverter';
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
  unit: 'metric',
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

  const toggleUnit = () => {
    const newUnit = state.unit === 'metric' ? 'imperial' : 'metric';
    const isImp = newUnit === 'imperial';
    
    // Convert numeric fields using utility
    const updates: Partial<AppState> = {
      unit: newUnit,
      length: convertField(state.length, newUnit, 'general'),
      highPt: convertField(state.highPt, newUnit, 'general'),
      lowPt: convertField(state.lowPt, newUnit, 'general'),
      ductDiaOD: convertField(state.ductDiaOD, newUnit, 'diameter'),
      strandEcc: convertField(state.strandEcc, newUnit, 'eccentricity'),
      minRadius: convertField(state.minRadius, newUnit, 'large_radius'),
      spacing: convertField(state.spacing, newUnit, 'large_radius'),
    };

    // Handle rounding default reset
    if (isImp) {
      updates.rounding = 0.25; // Default to 1/4 inch
    } else {
      updates.rounding = 1; // Default to 1mm
    }

    // Handle inflection point string
    if (state.inflectionPt && !state.inflectionPt.endsWith('%')) {
       const val = parseFloat(state.inflectionPt);
       if (!isNaN(val)) {
         updates.inflectionPt = convertSimple(val, newUnit, isImp ? 2 : 0).toString();
       }
    }

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
  }, [state.selectedProfile, state.length, state.highPt, state.lowPt, state.spacing, state.rounding, state.minRadius, state.inflectionPt, state.unit]);

  // Chart Colors based on mode
  const gridColor = darkMode ? "#334155" : "#e5e7eb";
  const axisColor = darkMode ? "#94a3b8" : "#9ca3af";
  const dotFill = darkMode ? "#1e293b" : "#fff";
  const dotText = darkMode ? "#cbd5e1" : "#334155";
  const tooltipBg = darkMode ? "#1e293b" : "#fff";
  const tooltipBorder = darkMode ? "#475569" : "#cbd5e1";
  
  const unitLabel = state.unit === 'metric' ? 'mm' : 'in';

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    return (
        <g>
           <circle cx={cx} cy={cy} r={3} fill={dotFill} stroke="#3b82f6" strokeWidth={2} />
           <text x={cx} y={cy - 10} textAnchor="middle" fill={dotText} fontSize={10} fontWeight="600" className="select-none">{payload.label}</text>
           <line x1={cx} y1={cy} x2={cx} y2={400} stroke={gridColor} strokeDasharray="3 3" opacity={0.5} />
        </g>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }} 
          className="border rounded-lg px-3 py-2 text-xs shadow-xl bg-opacity-95 backdrop-blur-sm"
        >
          <div className="font-bold mb-1 text-gray-800 dark:text-gray-100">{`Dist: ${Number(label).toFixed(1)}${unitLabel}`}</div>
          <div className="text-blue-600 dark:text-blue-400 font-bold text-sm mb-2">
             {`Height: ${Number(payload[0].value).toFixed(2)}`}
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-slate-700 space-y-1 text-gray-500 dark:text-gray-400">
             <div className="flex justify-between gap-6">
               <span>High Pt:</span>
               <span className="font-mono text-gray-700 dark:text-gray-300">{state.highPt}</span>
             </div>
             <div className="flex justify-between gap-6">
               <span>Low Pt:</span>
               <span className="font-mono text-gray-700 dark:text-gray-300">{state.lowPt}</span>
             </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 py-3 shadow-sm flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <span className="text-lg">📈</span>
            </div>
            <div>
                <h1 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">Kamesh Structural Systems</h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">TENDON DRAPES CALCULATOR</p>
            </div>
        </div>
        
        <div className="flex items-center gap-3">
           {/* Unit Switch */}
           <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
             <button
               onClick={() => state.unit !== 'metric' && toggleUnit()}
               className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                 state.unit === 'metric' 
                   ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                   : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
               }`}
             >
               Metric
             </button>
             <button
               onClick={() => state.unit !== 'imperial' && toggleUnit()}
               className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                 state.unit === 'imperial' 
                   ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                   : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
               }`}
             >
               Imperial
             </button>
           </div>
           
           <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
           >
            {darkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
            )}
           </button>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto p-4 md:px-8 max-w-7xl mx-auto w-full space-y-4">
        
        {/* Configuration Card */}
        <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <ConfigPanel 
                state={state} 
                onChange={handleStateChange}
                onCalc={performCalculation}
                onFlip={() => {
                    const temp = state.highPt;
                    handleStateChange({ highPt: state.lowPt, lowPt: temp });
                }}
            />
        </div>

        {/* Inputs & Visualization Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Left Col: Dimension Inputs & Profile Selector */}
            <div className="lg:col-span-4 flex flex-col gap-4">
                
                {/* Dimensions Card */}
                <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Geometry Inputs</h3>
                    <div className="grid grid-cols-2 gap-3">
                         {[
                             { label: 'Total Length', val: state.length, key: 'length' },
                             { label: 'High Point', val: state.highPt, key: 'highPt' },
                             { label: 'Low Point', val: state.lowPt, key: 'lowPt' },
                         ].map((item) => (
                             <div key={item.key} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 border border-slate-100 dark:border-slate-700/50 group focus-within:border-blue-400 dark:focus-within:border-blue-500 transition-colors">
                                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">{item.label}</label>
                                <div className="flex items-center gap-1">
                                    <input 
                                        type="number" 
                                        value={item.val}
                                        onChange={(e) => handleStateChange({ [item.key]: parseFloat(e.target.value) || 0 })}
                                        className="w-full bg-transparent font-mono text-sm text-slate-800 dark:text-slate-100 outline-none"
                                    />
                                    <span className="text-[10px] text-slate-400">{unitLabel}</span>
                                </div>
                             </div>
                         ))}
                         
                         {/* Inflection Pt Special Case */}
                         <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 border border-slate-100 dark:border-slate-700/50 group focus-within:border-blue-400 dark:focus-within:border-blue-500 transition-colors">
                            <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Inflection Pt.</label>
                            <div className="flex items-center gap-1">
                                <input 
                                    type="text" 
                                    value={state.inflectionPt}
                                    onChange={(e) => handleStateChange({ inflectionPt: e.target.value })}
                                    className="w-full bg-transparent font-mono text-sm text-slate-800 dark:text-slate-100 outline-none placeholder-slate-300"
                                    placeholder="Auto"
                                />
                            </div>
                         </div>
                    </div>
                </div>

                {/* Profile Selector Card */}
                <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex-grow">
                     <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Curve Shape</h3>
                     <ProfileSelector 
                        selected={state.selectedProfile} 
                        onSelect={(id) => handleStateChange({ selectedProfile: id })}
                     />
                </div>
            </div>

            {/* Right Col: Chart */}
            <div className="lg:col-span-8">
                <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800 p-1 h-full min-h-[500px] flex flex-col">
                   {/* Chart Header */}
                   <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                       <div>
                           <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Curve Analysis</h2>
                           <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md truncate">
                               {PROFILE_DESCRIPTIONS[state.selectedProfile]}
                           </p>
                           <div className="flex gap-4 mt-2">
                               <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                                   <span>Σ β = {result.betaSum} rad</span>
                               </div>
                               {result.inflectionPoints.length > 0 && (
                                   <div className="flex items-center gap-1.5 text-xs text-pink-600 dark:text-pink-400 font-medium bg-pink-50 dark:bg-pink-900/20 px-2 py-0.5 rounded">
                                       <span>IP @ {result.inflectionPoints.map(p => Math.round(p.x)).join(', ')}</span>
                                   </div>
                               )}
                           </div>
                       </div>

                       <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex text-xs font-semibold">
                            <button
                                onClick={() => setViewMode('2D')}
                                className={`px-3 py-1.5 rounded-md transition-all ${
                                    viewMode === '2D' 
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                2D Graph
                            </button>
                            <button
                                onClick={() => setViewMode('3D')}
                                className={`px-3 py-1.5 rounded-md transition-all ${
                                    viewMode === '3D' 
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                3D Model
                            </button>
                       </div>
                   </div>

                   {/* Canvas Area */}
                   <div className="flex-grow relative w-full h-full min-h-[400px]">
                       {viewMode === '2D' ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart 
                                data={result.points} 
                                margin={{ top: 40, right: 30, bottom: 20, left: 30 }}
                                >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} strokeOpacity={0.5} />
                                <XAxis 
                                    dataKey="x" 
                                    type="number" 
                                    domain={[0, state.length]} 
                                    tickCount={10}
                                    tick={{fontSize: 11, fill: axisColor}}
                                    tickFormatter={(value) => Number(value).toFixed(0)}
                                    axisLine={{ stroke: axisColor }}
                                    tickLine={{ stroke: axisColor }}
                                />
                                <YAxis domain={['auto', 'auto']} hide />
                                <Tooltip content={<CustomTooltip />} />
                                <Line 
                                    type="monotone" 
                                    dataKey="y" 
                                    stroke="#3b82f6" 
                                    strokeWidth={3} 
                                    dot={<CustomDot />}
                                    isAnimationActive={false}
                                />
                                {result.inflectionPoints.map((pt, idx) => (
                                    <ReferenceDot 
                                        key={idx} 
                                        x={pt.x} 
                                        y={pt.y} 
                                        r={5} 
                                        fill="#ec4899" 
                                        stroke="#fff"
                                        strokeWidth={2}
                                    />
                                ))}
                                </LineChart>
                            </ResponsiveContainer>
                       ) : (
                           <div className="w-full h-full rounded-b-xl overflow-hidden">
                               <ThreeDView points={result.points} length={state.length} darkMode={darkMode} />
                           </div>
                       )}
                   </div>
                </div>
            </div>
        </div>

        {/* Results Footer */}
        <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800 p-5">
           <ResultsPanel drapes={result.drapes} spaces={result.spaces} inflectionPoints={result.inflectionPoints} unit={state.unit} />
        </div>

      </main>
      
      <footer className="mt-auto py-4 text-center text-[10px] text-slate-400 dark:text-slate-600 border-t border-slate-100 dark:border-slate-900">
         &copy; {new Date().getFullYear()} Kamesh Structural Systems
      </footer>
    </div>
  );
}
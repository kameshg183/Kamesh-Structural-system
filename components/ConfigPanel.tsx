import React from 'react';
import { AppState } from '../types';

interface ConfigPanelProps {
  state: AppState;
  onChange: (updates: Partial<AppState>) => void;
  onCalc: () => void;
  onFlip: () => void;
}

// Data sets for different strand diameters
const DUCT_DATA_SETS: Record<string, Record<string, { od: number; ecc: number; rad: number }>> = {
  '12.9': {
    'slab': { od: 23, ecc: 2.6, rad: 3200 },
    '7s':   { od: 60, ecc: 10.9, rad: 2900 },
    '9s':   { od: 65, ecc: 11.1, rad: 3800 },
    '12s':  { od: 75, ecc: 14.0, rad: 4100 },
    '15s':  { od: 85, ecc: 16.8, rad: 4800 },
    '20s':  { od: 90, ecc: 14.9, rad: 5700 },
    '27s':  { od: 100, ecc: 14.9, rad: 6400 },
    '32s':  { od: 110, ecc: 20.9, rad: 6900 }, 
    '37s':  { od: 120, ecc: 23.7, rad: 7500 },
  },
  '15.2': {
    'slab': { od: 23, ecc: 1.4, rad: 3200 },
    '5s':   { od: 60, ecc: 11.5, rad: 2900 },
    '7s':   { od: 65, ecc: 9.9, rad: 3800 },
    '9s':   { od: 75, ecc: 12.6, rad: 4100 },
    '12s':  { od: 85, ecc: 14.9, rad: 4800 },
    '15s':  { od: 90, ecc: 13.4, rad: 5700 },
    '19s':  { od: 100, ecc: 15.1, rad: 6400 },
    '22s':  { od: 110, ecc: 18.4, rad: 6900 },
    '27s':  { od: 120, ecc: 19.6, rad: 7500 },
    '31s':  { od: 125, ecc: 18.8, rad: 8200 },
    '37s':  { od: 135, ecc: 20.1, rad: 9100 },
  }
};

const Section: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = "" }) => (
  <div className={`bg-gray-50 dark:bg-slate-800/40 rounded-lg p-3 border border-gray-100 dark:border-slate-700 ${className}`}>
    <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{label}</h3>
    <div className="text-sm">{children}</div>
  </div>
);

const ToggleGroup: React.FC<{ 
  options: { label: string; value: any }[]; 
  value: any; 
  onChange: (val: any) => void;
  small?: boolean; 
}> = ({ options, value, onChange, small }) => (
  <div className="flex bg-gray-200 dark:bg-slate-900 rounded-md p-0.5 space-x-0.5">
    {options.map((opt) => (
      <button
        key={String(opt.value)}
        onClick={() => onChange(opt.value)}
        className={`
          flex-1 flex items-center justify-center rounded-sm transition-all duration-200
          ${small ? 'py-0.5 text-[10px]' : 'py-1 text-xs'} font-medium
          ${value === opt.value 
            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}
        `}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const InputField: React.FC<{ label: string; value: number; onChange: (val: number) => void }> = ({ label, value, onChange }) => (
  <div className="flex flex-col">
    <label className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mb-0.5">{label}</label>
    <input 
      type="number" 
      value={value} 
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
    />
  </div>
);

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ state, onChange, onCalc, onFlip }) => {
  const isImperial = state.unit === 'imperial';
  const unitLabel = isImperial ? 'in' : 'mm';

  const processVal = (valMM: number) => isImperial ? valMM / 25.4 : valMM;
  const formatVal = (val: number, decimal = 1) => parseFloat(val.toFixed(decimal));

  const currentStrandDia = (state.strandDiameter === '12.9' || state.strandDiameter === '15.2') ? state.strandDiameter : '15.2';
  const activeDuctData = DUCT_DATA_SETS[currentStrandDia];

  const availableSizes = Object.keys(activeDuctData).filter(k => k !== 'slab').sort((a, b) => parseInt(a) - parseInt(b));

  const handleDuctChange = (type: 'slab' | 'other', size?: string) => {
    const key = type === 'slab' ? 'slab' : size;
    const defaults = key && activeDuctData[key] ? activeDuctData[key] : null;

    if (defaults) {
      onChange({
        ductType: type,
        ductSize: size || (type === 'slab' ? '' : availableSizes[0]),
        ductDiaOD: formatVal(processVal(defaults.od), 2),
        strandEcc: formatVal(processVal(defaults.ecc), 2),
        minRadius: formatVal(processVal(defaults.rad), 0)
      });
    } else {
      onChange({ ductType: type, ductSize: size || 'Other' });
    }
  };

  const handleStrandChange = (dia: '12.9' | '15.2' | 'other') => {
    const newData: Partial<AppState> = { strandDiameter: dia };
    const targetSet = (dia === '12.9' || dia === '15.2') ? DUCT_DATA_SETS[dia] : DUCT_DATA_SETS['15.2'];
    const currentSize = state.ductType === 'slab' ? 'slab' : state.ductSize;
    let def = targetSet[currentSize];
    
    if (!def) {
        if (state.ductType !== 'other') {
           def = targetSet['slab'];
           newData.ductType = 'slab';
           newData.ductSize = '';
        } 
    }
    if (def) {
         newData.ductDiaOD = formatVal(processVal(def.od), 2);
         newData.strandEcc = formatVal(processVal(def.ecc), 2);
         newData.minRadius = formatVal(processVal(def.rad), 0);
    }
    onChange(newData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      
      {/* Col 1: General Config (Anchors & Profiles) */}
      <div className="lg:col-span-4 flex flex-col gap-3">
        <Section label="Profile Definition">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
               <div>
                  <span className="text-[10px] text-gray-500 mb-1 block">Input Ref</span>
                  <ToggleGroup 
                    small
                    options={[{ label: 'CG Strand', value: 'cg_strand' }, { label: 'Soffit', value: 'duct_soffit' }]} 
                    value={state.inputProfile} 
                    onChange={(v) => onChange({ inputProfile: v })} 
                  />
               </div>
               <div>
                  <span className="text-[10px] text-gray-500 mb-1 block">Output Ref</span>
                  <ToggleGroup 
                    small
                    options={[{ label: 'CG Strand', value: 'cg_strand' }, { label: 'Soffit', value: 'duct_soffit' }]} 
                    value={state.outputProfile} 
                    onChange={(v) => onChange({ outputProfile: v })} 
                  />
               </div>
            </div>

            <div>
              <span className="text-[10px] text-gray-500 mb-1 block">Live Anchors</span>
              <ToggleGroup 
                options={[
                  { label: 'None', value: 'none' },
                  { label: 'Left', value: 'left' },
                  { label: 'Right', value: 'right' },
                  { label: 'Both', value: 'both' },
                ]}
                value={state.anchors}
                onChange={(v) => onChange({ anchors: v })}
              />
            </div>
          </div>
        </Section>
        
        <div className="flex gap-2">
            <button
                onClick={onCalc}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm text-sm font-semibold transition-colors active:translate-y-0.5"
            >
                Calculate Profile
            </button>
            <button
                onClick={onFlip}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 rounded-md shadow-sm text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
                Flip Ends
            </button>
        </div>
      </div>

      {/* Col 2: System Props (Strand & Duct) */}
      <div className="lg:col-span-5 flex flex-col gap-3">
         <Section label="System Properties" className="h-full">
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-16">Strand:</span>
                    <div className="flex-1">
                        <ToggleGroup 
                            small
                            options={[
                                { label: '12.9 mm', value: '12.9' },
                                { label: '15.2 mm', value: '15.2' },
                                { label: 'Other', value: 'other' },
                            ]}
                            value={state.strandDiameter}
                            onChange={(v) => handleStrandChange(v)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                   <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Duct Size:</span>
                   <div className="flex flex-wrap gap-1">
                      <button 
                        onClick={() => handleDuctChange('slab')}
                        className={`px-2 py-1 text-[10px] border rounded ${state.ductType === 'slab' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400'}`}
                      >
                          Slab
                      </button>
                      {availableSizes.map(size => (
                        <button
                            key={size}
                            onClick={() => handleDuctChange('other', size)}
                            className={`px-2 py-1 text-[10px] border rounded ${state.ductType === 'other' && state.ductSize === size ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400'}`}
                        >
                            {size}
                        </button>
                      ))}
                      <button 
                         onClick={() => handleDuctChange('other', 'Other')}
                         className={`px-2 py-1 text-[10px] border rounded ${state.ductType === 'other' && (state.ductSize === 'Other' || !activeDuctData[state.ductSize]) ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400'}`}
                      >
                          Other
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-dashed border-gray-200 dark:border-slate-700">
                    <InputField label={`OD (${unitLabel})`} value={state.ductDiaOD} onChange={(v) => onChange({ ductDiaOD: v })} />
                    <InputField label={`Ecc (${unitLabel})`} value={state.strandEcc} onChange={(v) => onChange({ strandEcc: v })} />
                    <InputField label={`Min R (${unitLabel})`} value={state.minRadius} onChange={(v) => onChange({ minRadius: v })} />
                </div>
            </div>
         </Section>
      </div>

      {/* Col 3: Calculation Rules */}
      <div className="lg:col-span-3 flex flex-col gap-3">
         <Section label="Parameters" className="h-full">
            <div className="space-y-4">
                <div>
                    <span className="text-[10px] text-gray-500 mb-1 block">Rounding Increment</span>
                    <div className="grid grid-cols-3 gap-1">
                        {isImperial ? (
                            <>
                            {[0.0625, 0.125, 0.25].map(v => (
                                <button 
                                key={v} onClick={() => onChange({ rounding: v })}
                                className={`text-[10px] py-1 border rounded ${state.rounding === v ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-slate-700 dark:text-blue-300' : 'border-gray-200 dark:border-slate-700 text-gray-500'}`}
                                >
                                {v === 0.0625 ? '1/16"' : v === 0.125 ? '1/8"' : '1/4"'}
                                </button>
                            ))}
                            </>
                        ) : (
                            <>
                            {[1, 5, 10].map(v => (
                                <button 
                                key={v} onClick={() => onChange({ rounding: v })}
                                className={`text-[10px] py-1 border rounded ${state.rounding === v ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-slate-700 dark:text-blue-300' : 'border-gray-200 dark:border-slate-700 text-gray-500'}`}
                                >
                                {v}mm
                                </button>
                            ))}
                            </>
                        )}
                    </div>
                </div>

                <div>
                    <span className="text-[10px] text-gray-500 mb-1 block">Spacing Interval ({unitLabel})</span>
                    <div className="flex gap-2 items-center">
                        <input 
                            type="number"
                            value={state.spacing}
                            onChange={(e) => onChange({ spacing: parseInt(e.target.value) || 0 })}
                            className="w-16 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-right"
                        />
                        <div className="flex-1">
                           <ToggleGroup 
                             small
                             options={[{ label: 'From Left', value: 'left' }, { label: 'From Right', value: 'right' }]}
                             value={state.spacingDirection}
                             onChange={(v) => onChange({ spacingDirection: v })}
                           />
                        </div>
                    </div>
                </div>
            </div>
         </Section>
      </div>

    </div>
  );
};

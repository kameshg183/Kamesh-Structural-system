import React from 'react';
import { AppState } from '../types';

interface ConfigPanelProps {
  state: AppState;
  onChange: (updates: Partial<AppState>) => void;
  onCalc: () => void;
  onFlip: () => void;
}

const DUCT_DATA: Record<string, { od: number; ecc: number; rad: number }> = {
  'slab': { od: 23, ecc: 1.4, rad: 3200 },
  '5s': { od: 60, ecc: 11.5, rad: 2900 },
  '7s': { od: 65, ecc: 9.9, rad: 3800 },
  '9s': { od: 75, ecc: 12.6, rad: 4100 },
  '12s': { od: 85, ecc: 14.9, rad: 4800 },
  '15s': { od: 90, ecc: 13.4, rad: 5700 },
  '19s': { od: 100, ecc: 15.1, rad: 6400 },
  '22s': { od: 110, ecc: 18.4, rad: 6900 },
  '27s': { od: 120, ecc: 19.6, rad: 7500 },
  '31s': { od: 125, ecc: 18.8, rad: 8200 },
  '37s': { od: 135, ecc: 20.1, rad: 9100 },
};

const GroupBox: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = "" }) => (
  <fieldset className={`border border-gray-300 dark:border-gray-600 rounded px-2 pb-2 pt-1 relative mt-2 ${className}`}>
    <legend className="text-xs font-semibold text-gray-600 dark:text-gray-400 px-1 ml-1">{label}</legend>
    {children}
  </fieldset>
);

const Radio: React.FC<{ label: string; name: string; checked: boolean; onChange: () => void }> = ({ label, name, checked, onChange }) => (
  <label className="flex items-center space-x-1 cursor-pointer mr-3 mb-1">
    <input
      type="radio"
      name={name}
      checked={checked}
      onChange={onChange}
      className="text-blue-600 focus:ring-blue-500 h-3 w-3 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
    />
    <span className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">{label}</span>
  </label>
);

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ state, onChange, onCalc, onFlip }) => {
  const ductSizes = ['5s', '7s', '9s', '12s', '15s', '19s', '22s', '27s', '31s', '37s'];

  const handleDuctChange = (type: 'slab' | 'other', size?: string) => {
    const key = type === 'slab' ? 'slab' : size;
    const defaults = key ? DUCT_DATA[key] : null;

    if (defaults) {
      onChange({
        ductType: type,
        ductSize: size || (type === 'slab' ? '' : '5s'),
        ductDiaOD: defaults.od,
        strandEcc: defaults.ecc,
        minRadius: defaults.rad
      });
    } else {
      // Fallback for 'Other' or custom
      onChange({
        ductType: type,
        ductSize: size || 'Other'
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Row 1: Profiles, Anchors, Strand, Buttons */}
      <div className="flex flex-wrap gap-2 items-start">
        <GroupBox label="Input Profile" className="flex flex-col justify-center min-w-[100px]">
          <Radio label="c.g. strand" name="inputP" checked={state.inputProfile === 'cg_strand'} onChange={() => onChange({ inputProfile: 'cg_strand' })} />
          <Radio label="Duct soffit" name="inputP" checked={state.inputProfile === 'duct_soffit'} onChange={() => onChange({ inputProfile: 'duct_soffit' })} />
        </GroupBox>

        <GroupBox label="Output Profile" className="flex flex-col justify-center min-w-[100px]">
          <Radio label="c.g. strand" name="outputP" checked={state.outputProfile === 'cg_strand'} onChange={() => onChange({ outputProfile: 'cg_strand' })} />
          <Radio label="Duct soffit" name="outputP" checked={state.outputProfile === 'duct_soffit'} onChange={() => onChange({ outputProfile: 'duct_soffit' })} />
        </GroupBox>

        <GroupBox label="Anchors" className="grid grid-cols-2 gap-x-2">
          <Radio label="Left end" name="anchors" checked={state.anchors === 'left'} onChange={() => onChange({ anchors: 'left' })} />
          <Radio label="Both ends" name="anchors" checked={state.anchors === 'both'} onChange={() => onChange({ anchors: 'both' })} />
          <Radio label="Right end" name="anchors" checked={state.anchors === 'right'} onChange={() => onChange({ anchors: 'right' })} />
          <Radio label="None" name="anchors" checked={state.anchors === 'none'} onChange={() => onChange({ anchors: 'none' })} />
        </GroupBox>

        <GroupBox label="Strand Diameter" className="grid grid-cols-2 gap-x-2">
            <Radio label="12.9 mm" name="strandDia" checked={state.strandDiameter === '12.9'} onChange={() => onChange({ strandDiameter: '12.9' })} />
            <Radio label="15.2 mm" name="strandDia" checked={state.strandDiameter === '15.2'} onChange={() => onChange({ strandDiameter: '15.2' })} />
            <Radio label="Other" name="strandDia" checked={state.strandDiameter === 'other'} onChange={() => onChange({ strandDiameter: 'other' })} />
        </GroupBox>

        <div className="flex items-center gap-2 mt-4 ml-2">
          <button
            onClick={onCalc}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-400 dark:border-gray-600 rounded shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 text-sm font-medium transition-colors text-gray-800 dark:text-gray-200"
          >
            Calc
          </button>
          <button
            onClick={onFlip}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-400 dark:border-gray-600 rounded shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 text-sm font-medium transition-colors text-gray-800 dark:text-gray-200"
          >
            Flip Ends
          </button>
        </div>
      </div>

      {/* Row 2: Duct Diameter, Rounding, Spacing */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-grow max-w-[650px]">
          <GroupBox label="Duct Diameter" className="w-full h-full flex flex-col justify-between">
              {/* Single radio group for Type + Size */}
              <div className="flex flex-wrap gap-x-2 gap-y-1 mb-1">
                  <Radio 
                    label="Slab" 
                    name="ductDiaGroup" 
                    checked={state.ductType === 'slab'} 
                    onChange={() => handleDuctChange('slab')} 
                  />
                  
                  {ductSizes.map(size => (
                      <Radio 
                          key={size} 
                          label={size} 
                          name="ductDiaGroup" 
                          checked={state.ductType === 'other' && state.ductSize === size} 
                          onChange={() => handleDuctChange('other', size)} 
                      />
                  ))}

                  <Radio 
                    label="Other" 
                    name="ductDiaGroup" 
                    checked={state.ductType === 'other' && (state.ductSize === 'Other' || !ductSizes.includes(state.ductSize))} 
                    onChange={() => handleDuctChange('other', 'Other')} 
                  />
              </div>

              {/* Numeric Inputs */}
              <div className="flex items-center gap-2 mt-1 pt-2 border-t border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                  <div className="flex items-center space-x-1">
                      <span className="text-xs">Duct Dia O.D.</span>
                      <input 
                          type="number" 
                          value={state.ductDiaOD} 
                          onChange={(e) => onChange({ ductDiaOD: parseFloat(e.target.value) || 0 })}
                          className="w-12 h-6 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-1 text-xs text-right text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                  </div>
                  <div className="flex items-center space-x-1">
                      <span className="text-xs">Strand Ecc.</span>
                      <input 
                          type="number" 
                          value={state.strandEcc} 
                          onChange={(e) => onChange({ strandEcc: parseFloat(e.target.value) || 0 })}
                          className="w-10 h-6 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-1 text-xs text-right text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                  </div>
                  <div className="flex items-center space-x-1">
                      <span className="text-xs">Min. Radius</span>
                      <input 
                          type="number" 
                          value={state.minRadius} 
                          onChange={(e) => onChange({ minRadius: parseFloat(e.target.value) || 0 })}
                          className="w-12 h-6 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-1 text-xs text-right text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                  </div>
              </div>
          </GroupBox>
        </div>

        <GroupBox label="Rounding">
            <div className="flex flex-col">
              <Radio label="1mm" name="rounding" checked={state.rounding === 1} onChange={() => onChange({ rounding: 1 })} />
              <Radio label="5mm" name="rounding" checked={state.rounding === 5} onChange={() => onChange({ rounding: 5 })} />
              <Radio label="10mm" name="rounding" checked={state.rounding === 10} onChange={() => onChange({ rounding: 10 })} />
            </div>
        </GroupBox>
         
        <GroupBox label="Spacing">
            <div className="flex flex-col gap-1">
              <div className="flex items-center space-x-1 mb-1 text-gray-700 dark:text-gray-300">
                  <input 
                      type="number" 
                      value={state.spacing}
                      onChange={(e) => onChange({ spacing: parseInt(e.target.value) || 1000 })}
                      className="w-14 h-6 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-1 text-xs text-right text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <span className="text-xs">mm from</span>
              </div>
              <div className="flex space-x-2">
                  <Radio label="Left" name="spaceDir" checked={state.spacingDirection === 'left'} onChange={() => onChange({ spacingDirection: 'left' })} />
                  <Radio label="Right" name="spaceDir" checked={state.spacingDirection === 'right'} onChange={() => onChange({ spacingDirection: 'right' })} />
              </div>
            </div>
        </GroupBox>
      </div>
    </div>
  );
};

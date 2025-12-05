import React from 'react';
import { ProfileType } from '../types';

interface ProfileSelectorProps {
  selected: ProfileType;
  onSelect: (id: ProfileType) => void;
}

const profiles: Record<ProfileType, { path: React.ReactNode; label: string }> = {
  1: {
    label: "Simple Half Parabola",
    path: <path d="M 5 5 Q 5 45 55 45" stroke="currentColor" strokeWidth="2" fill="none" />
  },
  2: {
    label: "S-Curve Half Parabola",
    path: <path d="M 5 5 C 20 5, 40 45, 55 45" stroke="currentColor" strokeWidth="2" fill="none" />
  },
  3: {
    label: "Double Reverse Parabola",
    path: <path d="M 5 10 C 15 10, 15 40, 30 40 S 45 10, 55 10" stroke="currentColor" strokeWidth="2" fill="none" />
  },
  4: {
    label: "Straight + Parabolic Ends",
    path: <path d="M 5 10 Q 15 10 20 25 L 40 25 Q 45 10 55 10" stroke="currentColor" strokeWidth="2" fill="none" />
  },
  5: {
    label: "Straight + Top Reverse",
    path: <path d="M 5 5 Q 35 5 45 25 L 55 45" stroke="currentColor" strokeWidth="2" fill="none" />
  },
  6: {
    label: "Straight + Bottom Reverse",
    path: <path d="M 5 5 L 25 25 Q 35 45 55 45" stroke="currentColor" strokeWidth="2" fill="none" />
  },
  7: {
    label: "Inverted Half Parabola",
    path: <path d="M 5 5 Q 55 5 55 45" stroke="currentColor" strokeWidth="2" fill="none" />
  },
  8: {
    label: "Mid-Point Reverse",
    path: <path d="M 5 5 C 25 5, 35 45, 55 45" stroke="currentColor" strokeWidth="2" fill="none" />
  }
};

export const PROFILE_DESCRIPTIONS = Object.fromEntries(
  Object.entries(profiles).map(([k, v]) => [k, v.label])
);

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({ selected, onSelect }) => {
  return (
    <div className="grid grid-cols-4 gap-2">
      {([1, 2, 3, 4, 5, 6, 7, 8] as ProfileType[]).map((id) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          title={profiles[id].label}
          className={`
            group relative h-16 w-full rounded-lg border transition-all duration-200
            flex flex-col items-center justify-center overflow-hidden
            ${selected === id 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-500 shadow-md transform scale-[1.02]' 
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm'}
          `}
        >
          <div className="absolute top-1 right-1.5 text-[9px] font-bold opacity-50 text-slate-400 group-hover:text-blue-500">#{id}</div>
          <div className="w-12 h-10 mt-1">
            <svg width="100%" height="100%" viewBox="0 0 60 50" className="p-0.5">
                {/* Subtle Grid */}
                <path d="M 5 5 L 55 5" className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="0.5" vectorEffect="non-scaling-stroke"/>
                <path d="M 5 45 L 55 45" className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="0.5" vectorEffect="non-scaling-stroke"/>
                
                {/* The Curve */}
                <g className={`transition-colors duration-200 ${selected === id ? 'stroke-blue-600 dark:stroke-blue-400' : 'stroke-slate-400 dark:stroke-slate-500 group-hover:stroke-blue-400'}`}>
                    {profiles[id].path}
                </g>
            </svg>
          </div>
        </button>
      ))}
    </div>
  );
};

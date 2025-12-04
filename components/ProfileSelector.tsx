import React from 'react';
import { ProfileType } from '../types';

interface ProfileSelectorProps {
  selected: ProfileType;
  onSelect: (id: ProfileType) => void;
}

const profiles: Record<ProfileType, { path: React.ReactNode; label: string }> = {
  1: {
    label: "Simple half parabola - no reverse Curve",
    path: <path d="M 5 5 Q 5 45 55 45" stroke="currentColor" strokeWidth="2" fill="none" />
  },
  2: {
    label: "Half Parabola with reverse curve",
    path: <path d="M 5 5 C 20 5, 40 45, 55 45" stroke="currentColor" strokeWidth="2" fill="none" />
  },
  3: {
    label: "Full parabola with reverse curve at each end",
    path: <path d="M 5 10 C 15 10, 15 40, 30 40 S 45 10, 55 10" stroke="currentColor" strokeWidth="2" fill="none" />
  },
  4: {
    label: "Straight parabolic with reverse curve at each end",
    path: <path d="M 5 10 Q 15 10 20 25 L 40 25 Q 45 10 55 10" stroke="currentColor" strokeWidth="2" fill="none" />
  },
  5: {
    label: "Straight segment with a parabolic reverse curve at top end",
    path: <path d="M 5 5 Q 35 5 45 25 L 55 45" stroke="currentColor" strokeWidth="2" fill="none" />
  },
  6: {
    label: "Straight segment with a parabolic reverse curve at bottom end",
    path: <path d="M 5 5 L 25 25 Q 35 45 55 45" stroke="currentColor" strokeWidth="2" fill="none" />
  },
  7: {
    label: "Inverted Simple half parabola - no reverse Curve",
    path: <path d="M 5 5 Q 55 5 55 45" stroke="currentColor" strokeWidth="2" fill="none" />
  },
  8: {
    label: "Half parabola with a reverse curve mid point given",
    path: <path d="M 5 5 C 25 5, 35 45, 55 45" stroke="currentColor" strokeWidth="2" fill="none" />
  }
};

export const PROFILE_DESCRIPTIONS = Object.fromEntries(
  Object.entries(profiles).map(([k, v]) => [k, v.label])
);

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({ selected, onSelect }) => {
  return (
    <div className="flex space-x-2 overflow-x-auto p-1 pb-2 no-scrollbar">
      {([1, 2, 3, 4, 5, 6, 7, 8] as ProfileType[]).map((id) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          title={profiles[id].label}
          className={`
            group relative w-20 h-14 border rounded-md shadow-sm transition-all flex-shrink-0
            flex items-center justify-center
            ${selected === id 
                ? 'border-blue-600 ring-1 ring-blue-500 bg-blue-50 dark:bg-blue-900/40' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'}
          `}
        >
          <span className="absolute top-0.5 right-1.5 text-[10px] text-gray-400 dark:text-gray-500 font-bold">{id}</span>
          <svg width="100%" height="100%" viewBox="0 0 60 50" className="p-1">
            {/* Background guide lines */}
            <path d="M 5 5 L 55 5" className="stroke-gray-100 dark:stroke-gray-700" strokeWidth="1" vectorEffect="non-scaling-stroke"/>
            <path d="M 5 45 L 55 45" className="stroke-gray-100 dark:stroke-gray-700" strokeWidth="1" vectorEffect="non-scaling-stroke"/>
            <path d="M 5 5 L 5 45" className="stroke-gray-100 dark:stroke-gray-700" strokeWidth="1" vectorEffect="non-scaling-stroke"/>
            <path d="M 55 5 L 55 45" className="stroke-gray-100 dark:stroke-gray-700" strokeWidth="1" vectorEffect="non-scaling-stroke"/>
            
            {/* The Curve */}
            <g className={`${selected === id ? 'stroke-blue-600 dark:stroke-blue-400' : 'stroke-red-500 dark:stroke-red-500'}`}>
              {profiles[id].path}
            </g>
          </svg>
        </button>
      ))}
    </div>
  );
};
import React from 'react';

interface ResultsPanelProps {
  drapes: number[];
  spaces: number[];
  inflectionPoints: { x: number; y: number }[];
  unit: 'metric' | 'imperial';
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ drapes, spaces, inflectionPoints, unit }) => {
  const unitLabel = unit === 'metric' ? 'mm' : 'in';

  const handleExportCSV = () => {
    // Generate CSV content
    const headers = [`Point`, `Drape (${unitLabel})`, `Space (${unitLabel})`];
    const rows = drapes.map((drape, index) => {
      const space = spaces[index] !== undefined ? spaces[index] : '';
      return [index + 1, drape, space].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'tendon_profile_results.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportDXF = () => {
    // Basic DXF Generation (kept logic from before)
    const points: {x: number, y: number}[] = [];
    let currentX = 0;
    if (!drapes || drapes.length === 0) return;
    points.push({ x: 0, y: drapes[0] });
    for (let i = 0; i < spaces.length; i++) {
      currentX += spaces[i];
      if (i + 1 < drapes.length) points.push({ x: currentX, y: drapes[i+1] });
    }

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(0, ...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(0, ...ys); 
    const maxY = Math.max(...ys);
    const rangeY = maxY - minY;
    const textSize = Math.max(rangeY / 15, (maxX - minX) / 100, unit === 'imperial' ? 1 : 25); 

    let dxf = "0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n9\n$MEASUREMENT\n70\n" + (unit === 'imperial' ? 0 : 1) + "\n0\nENDSEC\n";
    dxf += "0\nSECTION\n2\nENTITIES\n";
    
    // Polyline
    dxf += "0\nPOLYLINE\n8\nPROFILE\n66\n1\n10\n0.0\n20\n0.0\n30\n0.0\n70\n0\n";
    points.forEach(p => {
        dxf += `0\nVERTEX\n8\nPROFILE\n10\n${p.x}\n20\n${p.y}\n30\n0.0\n`;
    });
    dxf += "0\nSEQEND\n";

    dxf += "0\nENDSEC\n0\nEOF\n";

    const blob = new Blob([dxf], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tendon_profile_${unit}.dxf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const DataTape = ({ label, data }: { label: string, data: number[] }) => (
      <div className="flex flex-col gap-1 overflow-hidden">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex justify-between">
              <span>{label}</span>
              <span>Count: {data.length}</span>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-md p-1 overflow-x-auto no-scrollbar shadow-inner">
             {data.map((val, i) => (
                 <div key={i} className="flex-shrink-0 flex flex-col items-center px-3 border-r border-slate-200 dark:border-slate-800 last:border-0 min-w-[3rem]">
                     <span className="text-[9px] text-slate-400 mb-0.5">{i+1}</span>
                     <span className="font-mono text-sm text-slate-700 dark:text-blue-300 font-medium">{val}</span>
                 </div>
             ))}
          </div>
      </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <span>📊</span> Calculated Coordinates
        </h3>
        <div className="flex gap-2">
            <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5"
            >
            <span className="text-green-600 dark:text-green-400">csv</span> Export Data
            </button>
            <button
            onClick={handleExportDXF}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5"
            >
            <span className="text-blue-600 dark:text-blue-400">dxf</span> Export CAD
            </button>
        </div>
      </div>

      <div className="space-y-4">
         <DataTape label={`Drape Height (${unitLabel})`} data={drapes} />
         <DataTape label={`Segment Space (${unitLabel})`} data={spaces} />
      </div>
    </div>
  );
};

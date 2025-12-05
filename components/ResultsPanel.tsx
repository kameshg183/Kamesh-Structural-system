import React from 'react';

interface ResultsPanelProps {
  drapes: number[];
  spaces: number[];
  inflectionPoints: { x: number; y: number }[];
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ drapes, spaces, inflectionPoints }) => {
  const handleExportCSV = () => {
    // Generate CSV content
    const headers = ['Point', 'Drape (mm)', 'Space (mm)'];
    const rows = drapes.map((drape, index) => {
      // Space corresponds to the interval following the point.
      const space = spaces[index] !== undefined ? spaces[index] : '';
      return [index + 1, drape, space].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Trigger download
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
    // 1. Prepare Data Points
    const points: {x: number, y: number}[] = [];
    let currentX = 0;
    
    // Check if we have data
    if (!drapes || drapes.length === 0) return;

    // Start point
    points.push({ x: 0, y: drapes[0] });

    // Subsequent points
    for (let i = 0; i < spaces.length; i++) {
      currentX += spaces[i];
      if (i + 1 < drapes.length) {
         points.push({ x: currentX, y: drapes[i+1] });
      }
    }

    // Determine Extents for Auto-Zoom in CAD
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(0, ...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(0, ...ys); 
    const maxY = Math.max(...ys);

    // Heuristic for text size (approx 1.5% of length or 5% of height, clamped)
    const rangeY = maxY - minY;
    // Ensure text isn't too small or massive. 
    // For a 7000mm beam, ~50-100mm text height is usually readable.
    const textSize = Math.max(rangeY / 15, (maxX - minX) / 100, 25); 

    // 2. Generate DXF Content
    let dxf = "";
    
    // HEADER Section (Vital for Zoom Extents)
    dxf += "0\nSECTION\n";
    dxf += "2\nHEADER\n";
    dxf += "9\n$ACADVER\n1\nAC1009\n"; // R12 Version
    dxf += "9\n$EXTMIN\n10\n" + minX + "\n20\n" + (minY - textSize * 3) + "\n30\n0.0\n";
    dxf += "9\n$EXTMAX\n10\n" + maxX + "\n20\n" + (maxY + textSize * 2) + "\n30\n0.0\n";
    dxf += "0\nENDSEC\n";

    // TABLES Section (Layers)
    dxf += "0\nSECTION\n";
    dxf += "2\nTABLES\n";
    
    // LAYER Table
    dxf += "0\nTABLE\n";
    dxf += "2\nLAYER\n";
    // Number of layers including 0
    dxf += "70\n7\n"; 

    // Layer 0 (Standard)
    dxf += "0\nLAYER\n2\n0\n70\n0\n62\n7\n6\nCONTINUOUS\n";

    // Layer AXES (Color 7 - White/Black)
    dxf += "0\nLAYER\n2\nAXES\n70\n0\n62\n7\n6\nCONTINUOUS\n";

    // Layer DROPS (Color 8 - Gray)
    dxf += "0\nLAYER\n2\nDROPS\n70\n0\n62\n8\n6\nCONTINUOUS\n";

    // Layer PROFILE (Color 1 - Red)
    dxf += "0\nLAYER\n2\nPROFILE\n70\n0\n62\n1\n6\nCONTINUOUS\n";

    // Layer INFLECTION (Color 6 - Magenta)
    dxf += "0\nLAYER\n2\nINFLECTION\n70\n0\n62\n6\n6\nCONTINUOUS\n";

    // Layer TEXT_DRAPE (Color 2 - Yellow)
    dxf += "0\nLAYER\n2\nTEXT_DRAPE\n70\n0\n62\n2\n6\nCONTINUOUS\n";

    // Layer TEXT_SPACE (Color 3 - Green)
    dxf += "0\nLAYER\n2\nTEXT_SPACE\n70\n0\n62\n3\n6\nCONTINUOUS\n";

    dxf += "0\nENDTAB\n";
    dxf += "0\nENDSEC\n";

    // ENTITIES Section
    dxf += "0\nSECTION\n";
    dxf += "2\nENTITIES\n";

    // --- Entity: X-Axis Line (Layer: AXES) ---
    dxf += "0\nLINE\n";
    dxf += "8\nAXES\n";
    // Color is ByLayer (implicit or 256)
    dxf += `10\n${minX}\n20\n0\n30\n0\n`;
    dxf += `11\n${maxX}\n21\n0\n31\n0\n`;

    // --- Entity: Vertical Drop Lines (Layer: DROPS) ---
    points.forEach(p => {
        dxf += "0\nLINE\n";
        dxf += "8\nDROPS\n";
        dxf += `10\n${p.x}\n20\n0\n30\n0\n`;      // Bottom (at Axis)
        dxf += `11\n${p.x}\n21\n${p.y}\n31\n0\n`; // Top (at Curve)
    });

    // --- Entity: Profile Polyline (Layer: PROFILE) ---
    // Using POLYLINE (Old style) which is fully compatible with AC1009 (R12)
    dxf += "0\nPOLYLINE\n";
    dxf += "8\nPROFILE\n";
    dxf += "66\n1\n"; // Vertices follow
    dxf += "10\n0.0\n20\n0.0\n30\n0.0\n"; // Dummy point required for POLYLINE header
    dxf += "70\n0\n"; // 2D Polyline flag

    points.forEach(p => {
        dxf += "0\nVERTEX\n";
        dxf += "8\nPROFILE\n";
        dxf += `10\n${p.x}\n`;
        dxf += `20\n${p.y}\n`;
        dxf += "30\n0.0\n";
    });

    dxf += "0\nSEQEND\n";
    dxf += "8\nPROFILE\n";

    // --- Entity: Inflection Points (Layer: INFLECTION) ---
    if (inflectionPoints && inflectionPoints.length > 0) {
      inflectionPoints.forEach(p => {
          // Circle marker
          dxf += "0\nCIRCLE\n";
          dxf += "8\nINFLECTION\n";
          dxf += `10\n${p.x}\n20\n${p.y}\n30\n0\n`;
          dxf += `40\n${textSize * 0.4}\n`; // Radius proportional to text size

          // Label "IP"
          dxf += "0\nTEXT\n";
          dxf += "8\nINFLECTION\n";
          dxf += `10\n${p.x}\n20\n${p.y + textSize}\n30\n0\n`;
          dxf += `40\n${textSize * 0.8}\n`; // Text Height
          dxf += "1\nIP\n";
          dxf += "50\n0\n"; // Rotation
          dxf += "72\n1\n"; // Center Align
          dxf += `11\n${p.x}\n21\n${p.y + textSize}\n31\n0\n`;
      });
    }

    // --- Entity: Drape Text (Layer: TEXT_DRAPE) ---
    points.forEach(p => {
        const label = Math.round(p.y).toString();
        // Position slightly above point
        const tx = p.x;
        const ty = p.y + (textSize * 0.5); 

        dxf += "0\nTEXT\n";
        dxf += "8\nTEXT_DRAPE\n";
        dxf += `10\n${tx}\n20\n${ty}\n30\n0\n`;
        dxf += `40\n${textSize}\n`;
        dxf += `1\n${label}\n`;
        dxf += "50\n0\n"; // Rotation
        // Center Align (72=1 requires 11 code)
        dxf += "72\n1\n"; 
        dxf += `11\n${tx}\n21\n${ty}\n31\n0\n`;
    });

    // --- Entity: Space Text (Layer: TEXT_SPACE) ---
    let cx = 0;
    spaces.forEach(s => {
       const midX = cx + s/2;
       const label = s.toString();
       const ty = -(textSize * 1.5); // Below axis

       dxf += "0\nTEXT\n";
       dxf += "8\nTEXT_SPACE\n";
       dxf += `10\n${midX}\n20\n${ty}\n30\n0\n`;
       dxf += `40\n${textSize}\n`;
       dxf += `1\n${label}\n`;
       dxf += "50\n0\n";
       // Center Align
       dxf += "72\n1\n"; 
       dxf += `11\n${midX}\n21\n${ty}\n31\n0\n`;

       cx += s;
    });

    // End ENTITIES
    dxf += "0\nENDSEC\n";
    
    // EOF
    dxf += "0\nEOF\n";

    // 3. Trigger Download
    const blob = new Blob([dxf], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tendon_profile.dxf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-4 border-t border-gray-300 dark:border-gray-700 pt-2">
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Calculated Values</span>
        <div className="flex gap-2">
            <button
            onClick={handleExportCSV}
            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-1"
            title="Download results as CSV"
            >
            <span>📄</span> Export CSV
            </button>
            <button
            onClick={handleExportDXF}
            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-1"
            title="Download profile as DXF"
            >
            <span>📐</span> Export DXF
            </button>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-start">
          <span className="w-12 text-xs font-bold text-gray-700 dark:text-gray-300 mt-1">Drape :</span>
          <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 p-1 h-8 overflow-x-auto whitespace-nowrap text-sm shadow-inner rounded-sm font-mono no-scrollbar">
            {drapes.join('  ')}
          </div>
        </div>
        <div className="flex items-start">
          <span className="w-12 text-xs font-bold text-gray-700 dark:text-gray-300 mt-1">Space :</span>
          <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 p-1 h-8 overflow-x-auto whitespace-nowrap text-sm shadow-inner rounded-sm font-mono no-scrollbar">
            {spaces.join('  ')}
          </div>
        </div>
      </div>
    </div>
  );
};
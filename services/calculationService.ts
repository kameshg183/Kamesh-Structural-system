import { AppState, CalculationResult } from '../types';

// Helper for spacing distribution logic
// Rules derived from user requirements:
// 1. Spacing distribution starts from High Point (Start).
// 2. If remainder >= 0.7 * Spacing, it becomes the first segment.
// 3. If remainder < 0.7 * Spacing, it is combined with one standard segment and split into two.
const calculateSpaces = (length: number, spacing: number, unit: 'metric' | 'imperial'): number[] => {
  if (length <= 0 || spacing <= 0) return [];
  
  const tolerance = 0.01;
  const rem = length % spacing;
  const count = Math.floor(length / spacing);

  // Exact multiple
  if (rem < tolerance || Math.abs(rem - spacing) < tolerance) {
     return Array(count).fill(spacing);
  }

  // Case 1: Remainder is large enough (>= 70% of spacing) -> Add as first segment
  // E.g. L=5700, S=1000 -> 700, 1000, 1000...
  if (rem >= 0.7 * spacing) {
     // Check if count is 0 (shouldn't happen given >= 0.7S implies L < S if count=0, but standard logic)
     return [rem, ...Array(count).fill(spacing)];
  }
  
  // Case 2: Remainder is small -> Split first standard segment + remainder into two
  // E.g. L=5100, S=1000 -> Total=1100 -> 500, 600, 1000...
  // We consume one standard spacing from the count for the split.
  const totalStart = spacing + rem;
  let s1: number, s2: number;

  // Specific rounding for Metric 1000 spacing to match provided examples exactly
  // (e.g. 1100 -> 500, 600; 1300 -> 600, 700)
  if (unit === 'metric' && Math.abs(spacing - 1000) < 1) {
     // Split logic: floor(total / 200) * 100
     s1 = Math.floor(totalStart / 200) * 100;
     s2 = totalStart - s1;
  } else {
     // General case: Even split
     const half = totalStart / 2;
     if (unit === 'metric') {
        s1 = Math.floor(half); // Keep clean integers for metric
     } else {
        s1 = parseFloat(half.toFixed(2));
     }
     s2 = totalStart - s1;
  }

  // Standard segments remaining: (N - 1)
  const standardCount = Math.max(0, count - 1);
  return [s1, s2, ...Array(standardCount).fill(spacing)];
};

export const calculateProfile = (state: AppState): CalculationResult => {
  const { length, highPt, lowPt, spacing, selectedProfile, rounding, minRadius, inflectionPt, unit } = state;
  
  // Constants for calculation
  const h = highPt - lowPt; // Positive if High > Low
  const absH = Math.abs(h);
  
  // Formula: x = 2 * h * R / L
  // We use this to determine the length of the reverse curve segment.
  const getInflectionDist = (segLen: number) => {
    let overrideValue: number | null = null;

    // Parse user override if provided
    if (inflectionPt && inflectionPt.trim() !== '') {
      const raw = inflectionPt.trim();
      if (raw.endsWith('%')) {
        // Percentage case: value is percentage of TOTAL LENGTH
        const pct = parseFloat(raw.replace('%', ''));
        if (!isNaN(pct)) {
          overrideValue = (pct / 100) * length;
        }
      } else {
        // Numeric case: value is millimeters
        const val = parseFloat(raw);
        if (!isNaN(val)) {
          overrideValue = val;
        }
      }
    }

    if (overrideValue !== null && overrideValue > 0) {
      return Math.min(overrideValue, segLen);
    }

    // Auto Calculation
    if (segLen <= 0 || absH === 0) return 0;
    const x = (4 * absH * minRadius) / (2 * segLen); // equivalent to 2*h*R/L
    return Math.min(x, segLen / 2);
  };

  const calculateY = (x: number): number => {
    switch (selectedProfile) {
      case 1:
        // 1. Simple half parabola - no reverse Curve (Vertex at Low Point)
        {
          const a = (highPt - lowPt) / Math.pow(length, 2);
          return a * Math.pow(x - length, 2) + lowPt;
        }

      case 2:
        // 2. Half Parabola with reverse curve (S-Curve)
        {
          const x_infl = getInflectionDist(length);
          if (x < x_infl) {
             const A = (highPt - lowPt) / (x_infl * length);
             return highPt - A * x * x;
          } else {
             const B = (highPt - lowPt) / (length * (length - x_infl));
             return lowPt + B * Math.pow(x - length, 2);
          }
        }

      case 3:
        // 3. Full parabola with reverse curve at each end
        {
           const mid = length / 2;
           const x_infl = getInflectionDist(mid);
           let val = 0;
           const xx = x < mid ? x : length - x;

           if (xx < x_infl) {
              const A = (highPt - lowPt) / (x_infl * mid);
              val = highPt - A * xx * xx;
           } else {
              const B = (highPt - lowPt) / (mid * (mid - x_infl));
              val = lowPt + B * Math.pow(xx - mid, 2);
           }
           return val;
        }

      case 4:
        // 4. Straight parabolic with reverse curve at each end
        {
          const r = 0.25; 
          const x1 = length * r;
          const x2 = length * (1 - r);
          
          if (x < x1) {
            const a = (highPt - lowPt) / Math.pow(x1, 2);
            return a * Math.pow(x - x1, 2) + lowPt;
          } else if (x > x2) {
             const a = (highPt - lowPt) / Math.pow(length - x2, 2);
             return a * Math.pow(x - x2, 2) + lowPt;
          } else {
            return lowPt;
          }
        }

      case 5:
        // 5. Straight segment with a parabolic reverse curve at top end
        {
           const x_infl = getInflectionDist(length);
           if (x < x_infl) {
              const A = (highPt - lowPt) / (2 * length * x_infl - x_infl * x_infl);
              return highPt - A * x * x;
           } else {
              const A = (highPt - lowPt) / (2 * length * x_infl - x_infl * x_infl);
              const m = -2 * A * x_infl;
              const y_infl = highPt - A * x_infl * x_infl;
              return m * (x - x_infl) + y_infl;
           }
        }

      case 6:
        // 6. Straight segment with a parabolic reverse curve at bottom end
        {
          const x_infl = getInflectionDist(length);
          const xt = length - x_infl; 
          if (x < xt) {
             const A = (highPt - lowPt) / (length * length - xt * xt);
             const m = 2 * A * (xt - length);
             const y_xt = lowPt + A * Math.pow(xt - length, 2);
             return m * (x - xt) + y_xt;
          } else {
             const A = (highPt - lowPt) / (length * length - xt * xt);
             return lowPt + A * Math.pow(x - length, 2);
          }
        }

      case 7:
        // 7. Inverted Simple half parabola - no reverse Curve
        {
           const a = (lowPt - highPt) / Math.pow(length, 2);
           return a * x * x + highPt;
        }

      case 8:
        // 8. Half parabola with a reverse curve mid point given
        {
           const mid = length / 2;
           const midY = (highPt + lowPt) / 2;
           if (x < mid) {
              const a = (highPt - midY) / (mid * mid);
              return highPt - a * x * x;
           } else {
              const a = (midY - lowPt) / Math.pow(mid - length, 2);
              return lowPt + a * Math.pow(x - length, 2);
           }
        }

      default:
        return highPt + (lowPt - highPt) * (x / length);
    }
  };

  const roundValue = (val: number) => {
    return Math.round(val / rounding) * rounding;
  };

  // --- Calculate Points based on Spacing Pattern ---
  
  const spaces = calculateSpaces(length, spacing, unit);
  const points: { x: number; y: number; label?: number }[] = [];
  const drapes: number[] = [];
  
  let currentX = 0;
  
  // 1. Add Start Point (0)
  const startY = calculateY(0);
  const roundedStartY = roundValue(startY);
  points.push({ x: 0, y: startY, label: roundedStartY });
  drapes.push(roundedStartY);

  // 2. Add Subsequent Points
  for (const s of spaces) {
      currentX += s;
      
      // Prevent small floating point overshoot
      if (currentX > length - 0.001) currentX = length;

      const y = calculateY(currentX);
      const roundedY = roundValue(y);
      points.push({ x: currentX, y: y, label: roundedY });
      drapes.push(roundedY);
  }

  // Force last point to be exactly L/LowPt if not reached (safety)
  // With calculateSpaces logic, the sum should equal L, but check float precision
  const lastPt = points[points.length - 1];
  if (Math.abs(lastPt.x - length) > 1) {
      // If we somehow missed the end, add it.
      const endY = calculateY(length);
      const roundedEndY = roundValue(endY);
      points.push({ x: length, y: endY, label: roundedEndY });
      drapes.push(roundedEndY);
      spaces.push(length - lastPt.x);
  }

  // Calculate beta summation
  const betaSum = length > 0 ? (4 * absH) / length : 0;

  // Calculate Inflection Points for visualization
  const inflectionPoints: { x: number; y: number }[] = [];
  const addIp = (x: number) => {
     if (x > 0 && x < length) {
        inflectionPoints.push({ x, y: calculateY(x) });
     }
  };

  if (absH > 0 || selectedProfile === 4 || selectedProfile === 8) {
    if (selectedProfile === 2 || selectedProfile === 5) {
      addIp(getInflectionDist(length));
    } else if (selectedProfile === 6) {
      addIp(length - getInflectionDist(length));
    } else if (selectedProfile === 3) {
      const dist = getInflectionDist(length / 2);
      addIp(dist);
      addIp(length - dist);
    } else if (selectedProfile === 4) {
      const r = 0.25;
      addIp(length * r);
      addIp(length * (1 - r));
    } else if (selectedProfile === 8) {
      addIp(length / 2);
    }
  }

  return {
    points,
    drapes,
    spaces,
    betaSum: parseFloat(betaSum.toFixed(3)),
    inflectionPoints
  };
};

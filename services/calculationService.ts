import { AppState, CalculationResult } from '../types';

export const calculateProfile = (state: AppState): CalculationResult => {
  const { length, highPt, lowPt, spacing, selectedProfile, rounding, minRadius } = state;
  
  const points: { x: number; y: number; label?: number }[] = [];
  const drapes: number[] = [];
  const spaces: number[] = [];
  
  const numSegments = Math.floor(length / spacing);
  const remainder = length % spacing;

  // Constants for calculation
  const h = highPt - lowPt; // Positive if High > Low
  const absH = Math.abs(h);
  
  // Formula: x = 2 * h * R / L
  // We use this to determine the length of the reverse curve segment.
  const getInflectionDist = (segLen: number) => {
    if (segLen <= 0 || absH === 0) return 0;
    const x = (4 * absH * minRadius) / (2 * segLen); // equivalent to 2*h*R/L
    // Clamp to half length to avoid crossing mid-point (safety)
    return Math.min(x, segLen / 2);
  };

  const calculateY = (x: number): number => {
    switch (selectedProfile) {
      case 1:
        // 1. Simple half parabola - no reverse Curve (Vertex at Low Point)
        // y = a(x - L)^2 + Low. 
        {
          const a = (highPt - lowPt) / Math.pow(length, 2);
          return a * Math.pow(x - length, 2) + lowPt;
        }

      case 2:
        // 2. Half Parabola with reverse curve (S-Curve)
        // Reverse curve at x=0 (High). Main parabola at x=L (Low).
        // Transition at x_infl.
        {
          const x_infl = getInflectionDist(length);
          
          if (x < x_infl) {
             // Reverse curve: Parabola vertex at (0, High).
             // Matches slope with main parabola at x_infl.
             // Based on derivation: A = (High - Low) / (x_infl * L)
             const A = (highPt - lowPt) / (x_infl * length);
             return highPt - A * x * x;
          } else {
             // Main parabola: Vertex at (L, Low).
             // B = (High - Low) / (L * (L - x_infl))
             const B = (highPt - lowPt) / (length * (length - x_infl));
             return lowPt + B * Math.pow(x - length, 2);
          }
        }

      case 3:
        // 3. Full parabola with reverse curve at each end
        // Symmetric. Midpoint at L/2 (Low). Ends at High.
        // Consider half-span 0..L/2.
        {
           const mid = length / 2;
           // Segment length is mid.
           const x_infl = getInflectionDist(mid);

           // Working on the left half (0 to mid)
           let val = 0;
           // Local x coordinate relative to the start of the half-span
           // For left side: xx = x. For right side: xx = length - x.
           const xx = x < mid ? x : length - x;

           if (xx < x_infl) {
              // Reverse curve at support
              const A = (highPt - lowPt) / (x_infl * mid);
              val = highPt - A * xx * xx;
           } else {
              // Main parabola at center (Vertex at mid)
              const B = (highPt - lowPt) / (mid * (mid - x_infl));
              val = lowPt + B * Math.pow(xx - mid, 2);
           }
           return val;
        }

      case 4:
        // 4. Straight parabolic with reverse curve at each end
        // "Bath tub" shape.
        {
          const r = 0.25; // Ratio of curve length
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
        // Curve from 0 to x_infl (Vertex 0, High). Line x_infl to L.
        {
           const x_infl = getInflectionDist(length);
           
           if (x < x_infl) {
              // Parabola: y = High - A x^2
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
        // Line from 0 to L - x_infl. Curve from L - x_infl to L (Vertex L, Low).
        {
          const x_infl = getInflectionDist(length);
          const xt = length - x_infl; // Transition point

          if (x < xt) {
             // Line segment
             // Parabola part A (for x > xt): y = Low + A(x-L)^2
             // Match at xt. A = (High - Low) / (L^2 - xt^2).
             const A = (highPt - lowPt) / (length * length - xt * xt);
             
             // Back calculate line slope from parabola deriv at xt
             // y' = 2A(x-L). at xt: m = 2A(xt-L).
             // y_xt = Low + A(xt-L)^2.
             // Line equation: y - y_xt = m(x - xt).
             const m = 2 * A * (xt - length);
             const y_xt = lowPt + A * Math.pow(xt - length, 2);
             return m * (x - xt) + y_xt;
          } else {
             // Parabola part
             const A = (highPt - lowPt) / (length * length - xt * xt);
             return lowPt + A * Math.pow(x - length, 2);
          }
        }

      case 7:
        // 7. Inverted Simple half parabola - no reverse Curve (Vertex at High)
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
        // Linear Fallback
        return highPt + (lowPt - highPt) * (x / length);
    }
  };

  const roundValue = (val: number) => {
    return Math.round(val / rounding) * rounding;
  };

  // Generate points
  for (let i = 0; i <= numSegments; i++) {
    const x = i * spacing;
    const rawY = calculateY(x);
    const roundedY = roundValue(rawY);
    
    points.push({ x, y: rawY, label: roundedY });
    drapes.push(roundedY);
    spaces.push(spacing);
  }

  // Handle last point if exact division
  if (remainder > 0) {
    const x = length;
    const rawY = calculateY(x);
    const roundedY = roundValue(rawY);
    if (points[points.length - 1].x !== length) {
       points.push({ x, y: rawY, label: roundedY });
       drapes.push(roundedY);
       spaces.push(remainder);
    }
  }

  const finalSpaces = spaces.slice(0, points.length - 1);

  // Calculate beta summation based on approximation formula: sum(beta) = 4 * h / L
  const betaSum = length > 0 ? (4 * absH) / length : 0;

  // Calculate Inflection Points for visualization
  const inflectionPoints: { x: number; y: number }[] = [];
  
  // Helper to add point safely
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
      // Profile 4: Straight parabolic with reverse curve at each end (r=0.25)
      const r = 0.25;
      addIp(length * r);
      addIp(length * (1 - r));
    } else if (selectedProfile === 8) {
      // Profile 8: Half parabola with a reverse curve mid point given
      addIp(length / 2);
    }
  }

  return {
    points,
    drapes,
    spaces: finalSpaces,
    betaSum: parseFloat(betaSum.toFixed(3)),
    inflectionPoints
  };
};
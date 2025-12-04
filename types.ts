export type ProfileType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface AppState {
  inputProfile: 'cg_strand' | 'duct_soffit';
  outputProfile: 'cg_strand' | 'duct_soffit';
  anchors: 'left' | 'right' | 'both' | 'none';
  strandDiameter: '12.9' | '15.2' | 'other';
  ductType: 'slab' | 'other';
  ductSize: string; // "7s", "12s", "5s", etc.
  ductDiaOD: number;
  strandEcc: number;
  minRadius: number;
  rounding: 1 | 5 | 10;
  spacing: number;
  spacingDirection: 'left' | 'right';
  selectedProfile: ProfileType;
  length: number;
  highPt: number;
  lowPt: number;
  inflectionPt: string;
}

export interface CalculationResult {
  points: { x: number; y: number; label?: number }[];
  drapes: number[];
  spaces: number[];
  betaSum: number;
  inflectionPoints: { x: number; y: number }[];
}
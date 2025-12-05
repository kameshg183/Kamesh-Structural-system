export type Unit = 'metric' | 'imperial';

/**
 * Converts a value between Metric (mm) and Imperial (in).
 * Assumes the input value is in the opposite unit of the targetUnit.
 * 
 * @param value The value to convert. 
 * @param targetUnit The unit to convert TO.
 * @param precision Number of decimal places to round to.
 */
export const convertSimple = (value: number, targetUnit: Unit, precision: number = 2): number => {
  const converted = targetUnit === 'imperial' ? value / 25.4 : value * 25.4;
  return parseFloat(converted.toFixed(precision));
};

/**
 * Specialized converter for specific app fields to ensure consistent precision.
 * 
 * Field Types:
 * - 'general': Lengths, Heights (Precision: Imp 2, Met 0)
 * - 'diameter': Duct OD (Precision: Imp 2, Met 1)
 * - 'eccentricity': Strand Eccentricity (Precision: Imp 3, Met 1)
 * - 'large_radius': Radius, Spacing (Precision: Imp 0, Met 0)
 */
export const convertField = (
  value: number, 
  targetUnit: Unit, 
  field: 'general' | 'diameter' | 'eccentricity' | 'large_radius'
): number => {
    if (targetUnit === 'imperial') {
        switch (field) {
            case 'general': return convertSimple(value, targetUnit, 2);
            case 'diameter': return convertSimple(value, targetUnit, 2);
            case 'eccentricity': return convertSimple(value, targetUnit, 3);
            case 'large_radius': return convertSimple(value, targetUnit, 0);
        }
    } else {
        switch (field) {
            case 'general': return convertSimple(value, targetUnit, 0);
            case 'diameter': return convertSimple(value, targetUnit, 1);
            case 'eccentricity': return convertSimple(value, targetUnit, 1);
            case 'large_radius': return convertSimple(value, targetUnit, 0);
        }
    }
    return value;
};

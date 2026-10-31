export type ResidualStep = 'question' | 'transposed' | 'residual' | 'reconstruction';
export type ResidualMotion = 'transpose' | 'subtract' | 'restore' | 'fill';
export const TRANSPOSE_DURATION_MS = 2800;

export const isSubtractionLayout = (step: ResidualStep) => step === 'transposed' || step === 'residual';
// Identity indices: 0 = base, 1 = residual, 2 = target / reconstruction.
export function panelColumns(step: ResidualStep) { return isSubtractionLayout(step) ? [5, 1, 3] : [1, 3, 5]; }
export function layoutDestinations(subtraction: boolean) { return subtraction ? [2, 0, 1] : [1, 2, 0]; }

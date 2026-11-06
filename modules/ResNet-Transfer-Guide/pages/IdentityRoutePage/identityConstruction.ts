export type Vector = readonly [number, number, number];
export type LayerIndex = 0 | 1 | 2;
type Matrix = readonly [Vector, Vector, Vector];
export type Parameters = readonly [Matrix, Matrix, Matrix, Matrix];

// Small hand-set witness for the diagram, not trained ResNet parameters or predictions.
export const INPUT: Vector = [0.3, 0.8, 0.5];
export const ORIGINAL: Parameters = [
  [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  [[0, 1, 0], [0, 0, 1], [1, 0, 0]],
  [[1, 0, 0], [0, 0.5, 0], [0, 0, 1]],
  [[1, 0, 1], [0, 1, 1], [1, 1, 0]],
];
function multiply(matrix: Matrix, vector: Vector): Vector {
  return matrix.map(row => row.reduce((sum, value, index) => sum + value * vector[index], 0)) as unknown as Vector;
}
export function originalRoute(input = INPUT, parameters = ORIGINAL) {
  let value = input;
  const features: Vector[] = [];
  for (let index = 0; index < 3; index++) { value = multiply(parameters[index], value); features.push(value); }
  return { features, output: multiply(parameters[3], value) };
}
export interface ConstructionState {
  parameters: Parameters | null;
  identities: readonly [boolean, boolean, boolean];
  selected: LayerIndex;
  verified: boolean;
  conclusion: boolean;
  optimizationSeen: boolean;
  revision: number;
}
export const initialConstruction: ConstructionState = {
  parameters: null, identities: [false, false, false], selected: 0, verified: false, conclusion: false, optimizationSeen: false, revision: 0,
};
export function constructedOutput(state: ConstructionState, input = INPUT): Vector | null {
  if (!state.parameters || !state.identities.every(Boolean)) return null;
  let value = input;
  for (let index = 0; index < 3; index++) {
    value = multiply(state.parameters[index], value);
  }
  // Append the three identity layers after ALL original feature layers, before the unchanged head.
  for (let index = 0; index < 3; index++) {
    // An identity ReLU layer on this page's same-dimensional nonnegative features.
    value = value.map(item => Math.max(0, item)) as unknown as Vector;
  }
  return multiply(state.parameters[3], value);
}
export function canVerify(state: ConstructionState): boolean {
  const output = constructedOutput(state);
  return output !== null && output.every((value, index) => value === originalRoute().output[index]);
}
export type ConstructionAction =
  | { type: 'copy' | 'verify' | 'conclusion' | 'review' | 'undo' | 'reset' }
  | { type: 'identity'; index: LayerIndex };
export function transitionConstruction(state: ConstructionState, action: ConstructionAction): ConstructionState {
  switch (action.type) {
    case 'copy':
      return state.parameters ? state : { ...state,
        parameters: ORIGINAL.map(matrix => matrix.map(row => [...row])) as unknown as Parameters, revision: state.revision + 1 };
    case 'identity': {
      if (!state.parameters || !Number.isInteger(action.index) || action.index < 0 || action.index > 2
        || state.identities.slice(0, action.index).some(value => !value)) return state;
      return { ...state, identities: state.identities.map((value, index) => value || index === action.index) as unknown as ConstructionState['identities'],
        selected: action.index, conclusion: false, revision: state.revision + 1 };
    }
    case 'undo':
      return !state.parameters || !state.identities[state.selected] ? state : { ...state,
        identities: state.identities.map((value, index) => index < state.selected && value) as unknown as ConstructionState['identities'],
        selected: Math.max(0, state.selected - 1) as LayerIndex,
        verified: false, conclusion: false, optimizationSeen: false, revision: state.revision + 1 };
    case 'verify': return canVerify(state) ? { ...state, verified: true } : state;
    case 'conclusion': return state.verified && canVerify(state) ? { ...state, conclusion: true, optimizationSeen: true } : state;
    case 'review': return { ...state, conclusion: false };
    case 'reset': return { ...initialConstruction, revision: state.revision + 1 };
  }
}

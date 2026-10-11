/** Teaching simulation: a constant waterplane area; depth relative to the unloaded boat. */
export const STONE_KG = 250;
export const ELEPHANT_KG = 2300;
export const TARGET_DEPTH_CM = 36.8;
export const MAX_STONES = 13;
export type Observation = { mass: number; depth: number };
export const depthForMass = (mass: number) => mass * TARGET_DEPTH_CM / ELEPHANT_KG;
// Two rows inside the shallow hull. Coordinates are in the boat sprite's local plane.
export const stonePositions = [
  [23,25],[47,25],[71,25], [32,27],[56,27],[80,25],[17,24],[63,24],
  [39,24],[75,18],[27,18],[51,18], [60,17],
];

export function createStoneWeights(): number[] {
  // Random integer weights constrained to a 1500 kg stock, each within 100–140 kg.
  let remaining = 1500;
  return Array.from({length: MAX_STONES}, (_, i) => {
    const left = MAX_STONES-i-1;
    const low = Math.max(100, remaining-left*140);
    const high = Math.min(140, remaining-left*100);
    const weight = low+Math.floor(Math.random()*(high-low+1));
    remaining -= weight;
    return weight;
  });
}

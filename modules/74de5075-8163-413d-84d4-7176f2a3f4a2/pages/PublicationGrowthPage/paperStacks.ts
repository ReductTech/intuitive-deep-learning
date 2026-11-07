export interface PaperStackSlot {
  id: string;
  x: number;
  y: number;
  width: number;
  capacity: number;
  layer: number;
  surface: 'desk' | 'floor';
}

// Each anchor and footprint is permanent. Allocate the current year's papers
// through the same slots in the same order; height, never placement, changes.
// 0.075 scene px/paper is a visual scale, not a physical printing estimate.
export const PAPER_HEIGHT = 0.075;
// Staggered rows follow the tabletop, with a clear reading area in the middle.
// The floor rows widen toward the camera; their footprints never move by year.
const deskAnchors = [[21,32],[32,29],[36.5,35],[68,30],[77,34],[60,29],
  [17,42],[28,41],[72,43],[80,44],[36,43],[63,41]];
// Fill foreground floor positions first. Rear piles stay behind the desk legs,
// so a partly filled 2026 scene cannot look as if papers hover over the legs.
const floorAnchors = [[5,94],[85,95],[15.5,95],[75,94],[27,95],[37,92],
  [68,96],[8,80],[84,81],[17,84],[75,85],[7,70],[87,72],[19,77]];
const deskCapacities = [1200,1400,1600,1800,1600,1400,1200,900,800,900,900,900];
const floorCapacities = [2200,1800,2600,2300,2400,2800,1700,2100,2500,2000,2300,1800,2000,1900];

export const paperStackSlots: PaperStackSlot[] = [
  ...deskAnchors.map(([x,y],i) => ({ id: `desk-${i}`, x,y,width:y > 38 ? 7.8 : 6.8,capacity:deskCapacities[i],
    layer:y > 38 ? 6 : 4,surface:'desk' as const })),
  ...floorAnchors.map(([x,y],i) => ({ id: `floor-${i}`, x,y,width:y >= 90 ? 9 : 7.8,capacity:floorCapacities[i],
    layer:y >= 90 ? 14 : 2,surface:'floor' as const })),
];

export function allocatePaperStacks(count: number) {
  let remaining = Math.max(0, count);
  return paperStackSlots.map(slot => {
    const papers = Math.min(remaining, slot.capacity);
    remaining -= papers;
    return { ...slot, papers, height: papers * PAPER_HEIGHT };
  });
}

export function readerPose(year: number) {
  return year < 2018 ? 'focused' : year < 2026 ? 'relaxed' : 'defeated';
}

import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
const bottle = moduleAssetUrl("pretraining/bottle-white-cap-hd.webp");
const bottleBlue = moduleAssetUrl("starting-points/bottle-blue.webp");
const bottleLabel = moduleAssetUrl("starting-points/bottle-label.webp");
const bottleBent = moduleAssetUrl("starting-points/bottle-bent.webp");
const bottleFlatGreen = moduleAssetUrl("starting-points/bottle-flat-green.webp");
const canRed = moduleAssetUrl("starting-points/can-red.webp");
const canSilver = moduleAssetUrl("starting-points/can-silver.webp");
const canFlatYellow = moduleAssetUrl("starting-points/can-flat-yellow.webp");
const canFlatRed = moduleAssetUrl("starting-points/can-flat-red.webp");
const cartonOpen = moduleAssetUrl("starting-points/carton-open.webp");
const cartonSealed = moduleAssetUrl("starting-points/carton-sealed.webp");
const cartonDented = moduleAssetUrl("starting-points/carton-dented.webp");
const cartonFlat = moduleAssetUrl("starting-points/carton-flat.webp");
const queryBottleFlat = moduleAssetUrl("starting-points/query-bottle-flat.webp");
const queryCan = moduleAssetUrl("starting-points/query-can.webp");
const queryCarton = moduleAssetUrl("starting-points/query-carton.webp");
import { moduleJson } from "@shuku/course-runtime/react/moduleJson";
export const startingFrames = moduleJson<Record<string, {width:number;height:number;viewBox:string}>>('starting-points/images.json');

export interface StartingSample { id: string; image: string; label: string; category: number; width: number; height: number; viewBox: string; }
function sample(id: string, image: string, label: string, category: number): StartingSample {
  const frame = startingFrames.read()[id];
  return { id, image, label, category, width: frame.width, height: frame.height, viewBox: frame.viewBox };
}
export const getQuerySamples = () => [
  sample('query-bottle', bottle, '塑料瓶', 0),
  sample('query-bottle-flat', queryBottleFlat, '压扁塑料瓶', 0),
  sample('query-can', queryCan, '易拉罐', 1),
  sample('query-carton', queryCarton, '纸盒', 2),
];
export const getCandidateSamples = () => [
  sample('bottle-blue', bottleBlue, '直立蓝瓶', 0),
  sample('bottle-label', bottleLabel, '标签瓶', 0),
  sample('bottle-bent', bottleBent, '弯折瓶', 0),
  sample('bottle-flat-green', bottleFlatGreen, '压扁绿瓶', 0),
  sample('can-red', canRed, '红色罐', 1),
  sample('can-silver', canSilver, '银色罐', 1),
  sample('can-flat-yellow', canFlatYellow, '压扁黄罐', 1),
  sample('can-flat-red', canFlatRed, '压扁红罐', 1),
  sample('carton-open', cartonOpen, '开口纸盒', 2),
  sample('carton-sealed', cartonSealed, '封口纸盒', 2),
  sample('carton-dented', cartonDented, '变形纸盒', 2),
  sample('carton-flat', cartonFlat, '压扁纸盒', 2),
];

// Authored concept ranking, not inference or a measured similarity/training result.
// A and B always rank the same eight candidates; the query itself is never included.
export function neighborsFor(queryIndex: number, pretrained: boolean): StartingSample[] {
  const QUERY_SAMPLES = getQuerySamples(), CANDIDATE_SAMPLES = getCandidateSamples();
  const query = QUERY_SAMPLES[queryIndex] ?? QUERY_SAMPLES[0];
  const same = CANDIDATE_SAMPLES.filter(item => item.category === query.category && item.image !== query.image);
  const matchingOrder = query.id === 'query-bottle-flat' ? [3, 2, 0, 1] : [0, 1, 2, 3];
  const otherCategories = [0, 1, 2].filter(category => category !== query.category);
  const others = otherCategories.flatMap(category => CANDIDATE_SAMPLES.filter(item => item.category === category && item.image !== query.image).slice(0, 2));
  const pool = [...matchingOrder.map(index => same[index]), ...others];
  const order = pretrained ? [0, 1, 2, 3, 4, 6, 5, 7] : queryIndex % 2 ? [6, 4, 2, 7, 0, 5, 3, 1] : [4, 6, 0, 5, 1, 7, 2, 3];
  return order.map(index => pool[index]);
}

import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import outline from './outlines.json';

export const moduleAssetId = outline.moduleIdentity.id;

const image = (filename: string) => moduleAssetUrl(`images/${filename}`);

export const rainImage = image("rain-scene.webp");
export const catContextImage = image("cat-context.webp");
export const umbrellasImage = image("umbrellas.webp");
export const spatialComparisonImage = image("spatial-comparison.webp");
export const pairedSourceImage = image("paired-source.webp");
export const tasksSourceImage = image("tasks-source.webp");
export const vitPaperImage = image("vit-paper.webp");

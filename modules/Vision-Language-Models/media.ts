import { moduleAssetUrl } from '../shared/react/assets';
import outline from './outlines.json';

export const moduleAssetId = outline.moduleIdentity.id;

const image = (filename: string) => moduleAssetUrl(moduleAssetId, `images/${filename}`);

export const rainImage = image('rain-scene.jpeg');
export const catContextImage = image('cat-context.png');
export const umbrellasImage = image('umbrellas.jpeg');
export const spatialComparisonImage = image('spatial-comparison.png');
export const pairedSourceImage = image('paired-source.png');
export const tasksSourceImage = image('tasks-source.png');
export const vitPaperImage = image('vit-paper.png');

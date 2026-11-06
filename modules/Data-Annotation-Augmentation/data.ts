import outline from './outlines.json';
import { moduleAssetUrl } from '../shared/react';

export const assetId = outline.moduleIdentity.id;
export const photoUrl = (file: string) => moduleAssetUrl(assetId, file);
export const fruitFiles = ['01-fuji-apple.png', '02-bartlett-pear.png', '03-granny-smith-apple.png', '04-bosc-pear.png', '05-golden-delicious-apple.png', '06-asian-pear.png'];
export const appleBox = { x1: .25, y1: .08, x2: .77, y2: .89 };
export type Box = typeof appleBox;
export const sceneBoxes: Box[] = [{ x1: .12, y1: .24, x2: .45, y2: .78 }, { x1: .57, y1: .08, x2: .87, y2: .79 }];
// Hand-drawn teaching outlines, not calibrated segmentation ground truth.
export const appleOutline = 'M.505 .09 L.53 .1 L.527 .23 C.63 .04 .79 .16 .767 .52 C.77 .75 .65 .9 .52 .88 C.46 .91 .29 .84 .26 .61 C.22 .37 .25 .2 .37 .13 C.44 .1 .46 .2 .49 .24Z';
export const appleSceneOutline = 'M.28 .24 L.3 .25 L.3 .33 C.36 .24 .45 .3 .445 .51 C.44 .73 .36 .8 .29 .78 C.18 .8 .13 .7 .125 .5 C.12 .32 .2 .26 .28 .34Z';
export const pearSceneOutline = 'M.733 .09 L.754 .08 L.744 .23 C.79 .21 .8 .28 .825 .37 C.86 .46 .9 .66 .84 .74 C.78 .83 .64 .81 .6 .73 C.55 .66 .57 .52 .61 .4 C.65 .3 .65 .25 .713 .23Z';
export function polygonPath(path: string, width: number, height: number) {
  let index = 0;
  return path.replace(/\.?\d+(?:\.\d+)?/g, value => String(Number(value) * (index++ % 2 === 0 ? width : height)));
}


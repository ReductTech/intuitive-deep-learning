// Original module-owned pixel artwork; each character is one RGB source pixel.
export const spriteRows = [
  '......OOOO......', '....OOOOOOOO....', '...OOOYYYYOOO...', '..OOOHHHHHOOOO..',
  '..OOHHHHHHHOOO..', '..OOHSSHHSSHO...', '..OOSKSSSSKSO...', '..OOSWSSSSWSO...',
  '...OSSSMMSSO....', '..BBTOOOOOT.....', '..BBTOYOOOOT....', '..BBTTOOSSST....',
  '..BBTTOOSSST....', '...BTTOOOOT.....', '....TTDDDT......', '.....DDDDD......',
  '.....DDDDD......', '....KK..KK......', '...KKK..KKK.....', '................',
];
const palette: Record<string, string> = { '.':'#f5f9fd', O:'#f49a32', Y:'#ffcf67', H:'#304f7e', S:'#ffd0a1', K:'#243348', W:'#fff7e9', M:'#b75638', B:'#226f78', T:'#359f9c', D:'#476082' };
export type RGB = [number,number,number];
export const SOURCE_WIDTH = 16, SOURCE_HEIGHT = 20, GAP = 3;
export const WIDTH = (SOURCE_WIDTH-1)*GAP+1, HEIGHT = (SOURCE_HEIGHT-1)*GAP+1;
export const source: RGB[] = spriteRows.flatMap(row=>[...row].map(key=>{const color=palette[key];return [1,3,5].map(i=>parseInt(color.slice(i,i+2),16)) as RGB;}));
export const color = (rgb: RGB) => `rgb(${rgb.join(',')})`;
export const isAnchor = (x:number,y:number) => x%GAP===0 && y%GAP===0;
export function interpolate(x:number,y:number) {
  const x0=Math.min(Math.floor(x/GAP),SOURCE_WIDTH-2), y0=Math.min(Math.floor(y/GAP),SOURCE_HEIGHT-2);
  const u=x/GAP-x0, v=y/GAP-y0;
  const corners=[[x0,y0],[x0+1,y0],[x0,y0+1],[x0+1,y0+1]].map(([cx,cy])=>({x:cx*GAP,y:cy*GAP,rgb:source[cy*SOURCE_WIDTH+cx]}));
  const weights=[(1-u)*(1-v),u*(1-v),(1-u)*v,u*v];
  const rgb=[0,1,2].map(channel=>Math.round(corners.reduce((sum,c,i)=>sum+c.rgb[channel]*weights[i],0))) as RGB;
  return {x,y,u,v,corners,weights,rgb};
}
// Reveal near each original sample first, then fill the gaps between wave fronts.
// This is an animation schedule only: interpolation always uses original corners,
// never a previously filled output pixel. Deterministic local staggering avoids rows.
const jitter = (x:number,y:number) => { const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n); };
export function arrival(x:number,y:number) {
  const ax=Math.round(x/GAP)*GAP, ay=Math.round(y/GAP)*GAP;
  return Math.hypot(x-ax,y-ay)+jitter(ax,ay)*.25+jitter(x,y)*.025;
}
export const order = Array.from({length:WIDTH*HEIGHT},(_,i)=>({x:i%WIDTH,y:Math.floor(i/WIDTH)}))
  .filter(({x,y})=>!isAnchor(x,y)).sort((a,b)=>arrival(a.x,a.y)-arrival(b.x,b.y));

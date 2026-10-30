export const FLOW_DURATION = 12000;
export const PAPER_INTERVAL = 1000;
export const PAPER_COUNT = 12;
const selectedIds = [0,3,6];

export interface FlowSample {
  ms:number; x:number; y:number; rx:number; ry:number; rz:number;
  scale:number; opacity:number; layer:number; easing?:string;
}
export const flowPaperTransform = (p:FlowSample) =>
  'translate3d('+p.x+'px,'+p.y+'px,0) rotateX('+p.rx+'deg) rotateY('+p.ry+'deg) rotateZ('+p.rz+'deg) scale('+p.scale+')';

export function paperFlight(id:number) {
  const slot = selectedIds.indexOf(id);
  const selected = slot !== -1;
  const landingX = 1134 + Math.max(0,slot)*126;
  const landingY = 286 + (slot===1 ? 8 : 0);
  const sample=(ms:number,x:number,y:number,ry=0,rz=0,scale=1,opacity=1,layer=8,rx=0,easing?:string):FlowSample =>
    ({ms,x,y,rx,ry,rz,scale,opacity,layer,easing});
  const startX=185+(id%4)*29, startY=305+(id%3)*12;
  const samples=[
    sample(0,startX,startY+12,-16,-12,.72,0,4,8),
    sample(180,startX,startY-5,-14,-12,.8,1,4,8,'cubic-bezier(.2,.65,.35,1)'),
    sample(650,425,236,-8,-8,.96,1,8,5),
    sample(1250,604,252,-22,3,1,1,8,1),
    sample(1600,704,266,-62,2,1,1,10),
  ];
  if(selected) samples.push(
    sample(1830,762,267,-78,0,1,1,10),
    sample(2080,859,260,-29,-3,1,1,18,2,'cubic-bezier(.2,.55,.4,1)'),
    sample(2600,landingX-30,landingY-54,-8,4,1,1,18,1,'cubic-bezier(.45,0,.85,.6)'),
    sample(3000,landingX,landingY+5,0,-1.5,1,1,18,0,'cubic-bezier(.2,.65,.4,1)'),
    sample(3260,landingX,landingY,0,0,1,1,18),
    sample(11000,landingX,landingY,0,0,1,1,18),
    sample(11550,landingX,landingY+64,5,0,.97,.55,18),
    sample(11900,landingX,landingY+96,6,0,.96,0,2),
    sample(FLOW_DURATION,landingX,landingY+96,6,0,.96,0,2),
  );
  else samples.push(
    sample(1850,722,274,-68,-3,1,1,10,0,'cubic-bezier(.15,.4,.35,1)'),
    sample(2260,653,354,-30,-18,.97,1,7,14,'cubic-bezier(.4,0,.8,.55)'),
    sample(2820,582,449,-18,-31,.88,.75,5,34),
    sample(3280,536,488,-10,-35,.8,.12,3,57),
    sample(3500,524,496,-8,-35,.8,0,3,65),
    sample(FLOW_DURATION,524,496,-8,-35,.8,0,3,65),
  );
  const landed=sample(0,landingX,landingY,0,0,1,1,18);
  return {id,slot,selected,delay:id*PAPER_INTERVAL,samples,landed};
}

export function flightKeyframes(flight:ReturnType<typeof paperFlight>):Keyframe[] {
  return flight.samples.map(p=>({
    offset:p.ms/FLOW_DURATION,transform:flowPaperTransform(p),opacity:p.opacity,zIndex:p.layer,
    ...(flight.selected?{clipPath:p.ms>=2600
      ?'inset(-20px -20px '+Math.max(-20,p.y+158-446)+'px -20px)'
      :'inset(-20px)'}:{}),
    ...(p.easing?{easing:p.easing}:{}),
  }));
}

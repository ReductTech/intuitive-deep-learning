import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { photoUrl, type Box } from '../data';
import './PhotoStage.css';

export function PhotoStage({ file = '01-fuji-apple.jpg', children, imageStyle, className = '' }: { file?: string; children?: ReactNode; imageStyle?: CSSProperties; className?: string }) {
  return <div shuku-edit-id="e-673dadfa-5c96-4159-9ff2-b47c4eb9aa0b" className={`daa-photo-stage ${className}`}>
    <img shuku-edit-id="e-29e8ca5c-4497-4a0c-97a0-c1eace724baa" src={photoUrl(file)} alt="AI 生成水果教学图片" width={1536} height={1024} style={imageStyle} />
    {children}
  </div>;
}

export function BoxOverlay({ boxes, color = 'var(--ui-accent-alt)' }: { boxes: Box[]; color?: string }) {
  return <svg shuku-edit-id="e-f645c772-cf3b-4243-af7d-5498bfbcaf81" className="daa-photo-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="目标框示意">{boxes.map((b,i)=><rect shuku-edit-id="e-0216571b-0089-4ee1-b926-03022217ca19" key={i} x={b.x1*100} y={b.y1*100} width={(b.x2-b.x1)*100} height={(b.y2-b.y1)*100} fill="none" stroke={color} strokeWidth=".55" />)}</svg>;
}

export function BoxEditor({ box, onChange, file = '01-fuji-apple.jpg' }: { box: Box; onChange: (box: Box) => void; file?: string }) {
  const drag = useRef<keyof Box | null>(null);
  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (!drag.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const horizontal = drag.current.startsWith('x');
    const value = Math.max(0, Math.min(1, horizontal ? (e.clientX-rect.left)/rect.width : (e.clientY-rect.top)/rect.height));
    const next = { ...box, [drag.current]: value };
    if (next.x2-next.x1 > .06 && next.y2-next.y1 > .06) onChange(next);
  };
  return <PhotoStage file={file}><svg shuku-edit-id="e-f1b1456e-40f0-4c66-87b7-3f31280503fa" className="daa-photo-overlay daa-box-editor" viewBox="0 0 100 100" preserveAspectRatio="none"
    onPointerMove={move} onPointerUp={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}>
    <rect shuku-edit-id="e-4a03d329-c1c6-459e-bd2b-e8179ac7f18e" x={box.x1*100} y={box.y1*100} width={(box.x2-box.x1)*100} height={(box.y2-box.y1)*100} fill="none" stroke="var(--ui-accent-alt)" strokeWidth=".7" />
    {(['x1','x2','y1','y2'] as const).map(edge=><line shuku-edit-id="e-c0ffef06-8469-47e4-8702-bc969e7c3a4d" key={edge}
      x1={(edge==='x1'?box.x1:edge==='x2'?box.x2:box.x1)*100} x2={(edge==='x1'?box.x1:edge==='x2'?box.x2:box.x2)*100}
      y1={(edge==='y1'?box.y1:edge==='y2'?box.y2:box.y1)*100} y2={(edge==='y1'?box.y1:edge==='y2'?box.y2:box.y2)*100}
      stroke="transparent" strokeWidth="4" style={{cursor:edge.startsWith('x')?'ew-resize':'ns-resize'}}
      onPointerDown={e=>{drag.current=edge;e.currentTarget.parentElement?.setPointerCapture(e.pointerId);e.preventDefault();}} />)}
  </svg></PhotoStage>;
}

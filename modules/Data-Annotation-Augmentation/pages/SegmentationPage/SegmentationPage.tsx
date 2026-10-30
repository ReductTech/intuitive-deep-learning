import { useId, useMemo, useRef, useState, type PointerEvent } from 'react';
import { Button, Typography } from '../../../shared/react';
import { LessonPage } from '../../components/LessonPage';
import { PhotoStage } from '../../components/PhotoStage';
import { appleOutline, polygonPath } from '../../data';
import './SegmentationPage.css';

type Stroke = { erase: boolean; points: string[] };
function classGrid(strokes: Stroke[], example: boolean) {
  const layer = document.createElement('canvas'); layer.width = 600; layer.height = 400;
  const brush = layer.getContext('2d', { willReadFrequently: true })!;
  const labels = new Uint8Array(600 * 400);
  if (example) {
    brush.fill(new Path2D(polygonPath(appleOutline, 600, 400)));
    const coverage = brush.getImageData(0, 0, 600, 400).data;
    for (let i = 0; i < labels.length; i++) labels[i] = coverage[i * 4 + 3] >= 128 ? 1 : 0;
  }
  brush.lineWidth = 64; brush.lineCap = 'round'; brush.lineJoin = 'round';
  for (const stroke of strokes) {
    brush.clearRect(0, 0, 600, 400);
    brush.stroke(new Path2D(`M${stroke.points.join(' L')}`));
    const coverage = brush.getImageData(0, 0, 600, 400).data;
    for (let i = 0; i < labels.length; i++) if (coverage[i * 4 + 3] >= 128) labels[i] = stroke.erase ? 0 : 1;
  }
  // Partition the full edited mask into 36 × 24 teaching cells.
  const cells = Array.from({ length: 36 * 24 }, (_, i) => {
    const column = i % 36, row = Math.floor(i / 36);
    const x0 = Math.floor(column * 600 / 36), x1 = Math.floor((column + 1) * 600 / 36);
    const y0 = Math.floor(row * 400 / 24), y1 = Math.floor((row + 1) * 400 / 24);
    let count = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) count += labels[y * 600 + x];
    return count * 2 >= (x1 - x0) * (y1 - y0) ? 1 : 0;
  });
  return { cells, hasTarget: labels.some(value => value === 1) };
}
export function SegmentationPage() {
  const [confirmed, setConfirmed] = useState(false);
  const [erase, setErase] = useState(false);
  const [example, setExample] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const drawing = useRef(false);
  const maskId = useId();
  const { cells, hasTarget } = useMemo(() => classGrid(strokes, example), [strokes, example]);
  const point = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return `${Math.max(0, Math.min(600, (e.clientX - r.left) / r.width * 600))} ${Math.max(0, Math.min(400, (e.clientY - r.top) / r.height * 400))}`;
  };
  return <LessonPage id="07" subtitle="先亲手标注，再查看标注保存成什么形式。" takeaway={confirmed ? '掩膜标注保存的是二维类别编号：每个位置对应图像中的位置，0 表示背景，1 表示苹果。' : '把苹果区域涂出来，背景留空；完成后确认标注，查看对应的标签格式。'}>
    <div className={`daa-two daa-equal daa-segmentation${confirmed ? ' is-confirmed' : ''}`}>
      <div className="daa-center"><Typography variant="h3">{confirmed ? '你确认的标注' : '第一步：涂出苹果区域'}</Typography><PhotoStage>
        <svg className={`daa-photo-overlay${confirmed ? '' : ' daa-box-editor'}`} viewBox="0 0 600 400" aria-label="连续掩膜画笔" style={{ cursor: confirmed ? 'default' : 'crosshair' }}
          onPointerDown={e => { if (confirmed) return; e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); drawing.current = true; const p = point(e); setStrokes(s => [...s, { erase, points: [p, p] }]); }}
          onPointerMove={e => { if (!drawing.current || confirmed) return; const p = point(e); setStrokes(s => s.map((x, i) => i === s.length - 1 ? { ...x, points: [...x.points, p] } : x)); }}
          onPointerUp={() => { drawing.current = false; }} onLostPointerCapture={() => { drawing.current = false; }}>
          <defs><mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="400" style={{ maskType: 'luminance' }}>
            <rect width="600" height="400" fill="black" />{example && <path d={polygonPath(appleOutline, 600, 400)} fill="white" />}
            {strokes.map((s, i) => <path key={i} d={`M${s.points.join(' L')}`} fill="none" stroke={s.erase ? 'black' : 'white'} strokeWidth="64" strokeLinecap="round" strokeLinejoin="round" />)}
          </mask></defs>
          <rect width="600" height="400" fill="var(--ui-accent-alt)" opacity=".55" mask={`url(#${maskId})`} />
        </svg></PhotoStage><div className="daa-actions"><Typography variant="bodySmall" tone="muted">橙色：标为苹果的区域</Typography>{confirmed && <Button onClick={() => setConfirmed(false)}><Typography as="span" variant="bodySmall" tone="inherit">返回修改</Typography></Button>}</div></div>
      {confirmed ? <div className="daa-mask-result"><Typography variant="h3">第二步：查看数字掩膜</Typography>
        <div className="daa-mask-number-grid" role="img" aria-label="整张标注的 36 列 24 行类别编号网格">{cells.map((value, i) => <div key={i} data-class-id={value} className={value ? 'is-apple' : ''}><Typography as="span" variant="bodySmall" tone="inherit">{value}</Typography></div>)}</div>
        <Typography variant="bodySmall">灰色 0：背景　橙色 1：苹果</Typography>
        <Typography variant="bodySmall" tone="muted">为便于观察，合并为 36 × 24 格；实际标注逐像素保存。</Typography>
      </div> : <div className="daa-reading"><Typography variant="h2">先标数据，再看格式</Typography><Typography variant="body">按住拖动画笔涂出苹果；涂错的地方用橡皮擦擦掉。</Typography>
        <div className="daa-actions"><Button active={!erase} onClick={() => setErase(false)}><Typography as="span" variant="bodySmall" tone="inherit">画笔</Typography></Button><Button active={erase} onClick={() => setErase(true)}><Typography as="span" variant="bodySmall" tone="inherit">橡皮擦</Typography></Button></div>
        <div className="daa-actions"><Button onClick={() => { setExample(true); setStrokes([]); }}><Typography as="span" variant="bodySmall" tone="inherit">填入示例</Typography></Button><Button onClick={() => { setExample(false); setStrokes([]); }}><Typography as="span" variant="bodySmall" tone="inherit">清空标注</Typography></Button></div>
        <Button variant="primary" disabled={!hasTarget} onClick={() => { drawing.current = false; setConfirmed(true); }}><Typography as="span" variant="bodySmall" tone="inherit">确认标注，查看格式</Typography></Button>
      </div>}
    </div>
  </LessonPage>;
}

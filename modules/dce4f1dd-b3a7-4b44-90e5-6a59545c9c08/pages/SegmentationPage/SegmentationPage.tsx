import { useId, useMemo, useRef, useState, type PointerEvent } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
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
  return <LessonPage id="4e212d7f-60d1-4e02-9abc-c5fa348877fa" subtitle="先亲手标注，再查看标注保存成什么形式。" takeaway={confirmed ? '掩膜标注保存的是二维类别编号：每个位置对应图像中的位置，0 表示背景，1 表示苹果。' : '把苹果区域涂出来，背景留空；完成后确认标注，查看对应的标签格式。'}>
    <div shuku-edit-id="e-06f6eec0-e1bd-474f-9c3f-9cdab9249a00" className={`daa-two daa-equal daa-segmentation${confirmed ? ' is-confirmed' : ''}`}>
      <div shuku-edit-id="e-a14ea624-8321-40eb-85cd-46117ee9b88b" className="daa-center"><Typography shuku-edit-id="e-f1b15aa7-87ec-4216-9489-f6c5bb8e6c9f" variant="h3">{confirmed ? '你确认的标注' : '第一步：涂出苹果区域'}</Typography><PhotoStage>
        <svg shuku-edit-id="e-f37333c2-400b-4ca3-b660-6d3529fa90be" className={`daa-photo-overlay${confirmed ? '' : ' daa-box-editor'}`} viewBox="0 0 600 400" aria-label="连续掩膜画笔" style={{ cursor: confirmed ? 'default' : 'crosshair' }}
          onPointerDown={e => { if (confirmed) return; e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); drawing.current = true; const p = point(e); setStrokes(s => [...s, { erase, points: [p, p] }]); }}
          onPointerMove={e => { if (!drawing.current || confirmed) return; const p = point(e); setStrokes(s => s.map((x, i) => i === s.length - 1 ? { ...x, points: [...x.points, p] } : x)); }}
          onPointerUp={() => { drawing.current = false; }} onLostPointerCapture={() => { drawing.current = false; }}>
          <defs shuku-edit-id="e-a3c0d6fb-d051-4162-80f2-8e86f8d40b41"><mask shuku-edit-id="e-d5aa892d-33a3-4233-b864-3d751c2f1712" id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="400" style={{ maskType: 'luminance' }}>
            <rect shuku-edit-id="e-6d272404-c91d-4d87-aff9-223248ebfefc" width="600" height="400" fill="black" />{example && <path shuku-edit-id="e-822fbbbd-734c-47af-9169-7b5b2e87a1d8" d={polygonPath(appleOutline, 600, 400)} fill="white" />}
            {strokes.map((s, i) => <path shuku-edit-id="e-695568ed-c557-4cd1-9ef0-e2f63fb9f7ec" key={i} d={`M${s.points.join(' L')}`} fill="none" stroke={s.erase ? 'black' : 'white'} strokeWidth="64" strokeLinecap="round" strokeLinejoin="round" />)}
          </mask></defs>
          <rect shuku-edit-id="e-302502cc-4094-46ab-b764-8cfb246b3e19" width="600" height="400" fill="var(--ui-accent-alt)" opacity=".55" mask={`url(#${maskId})`} />
        </svg></PhotoStage><div shuku-edit-id="e-ae168086-b5e9-46c3-a2ed-f9020aa89d19" className="daa-actions"><Typography shuku-edit-id="e-482a35a6-fde5-4bdd-8979-512e8b27ef6f" variant="bodySmall" tone="muted">橙色：标为苹果的区域</Typography>{confirmed && <Button onClick={() => setConfirmed(false)}><Typography shuku-edit-id="e-5bca6507-466d-42a2-9802-ab78b46a1b9f" as="span" variant="bodySmall" tone="inherit">返回修改</Typography></Button>}</div></div>
      {confirmed ? <div shuku-edit-id="e-f19feb43-9a6d-4b2d-9031-68c1bc08d79f" className="daa-mask-result"><Typography shuku-edit-id="e-8d200704-dde9-4d01-83c2-bc05541bb58f" variant="h3">第二步：查看数字掩膜</Typography>
        <div shuku-edit-id="e-a83f2157-a529-467a-bfc0-a017f737a05a" className="daa-mask-number-grid" role="img" aria-label="整张标注的 36 列 24 行类别编号网格">{cells.map((value, i) => <div shuku-edit-id="e-9126088f-8c58-4bf7-aacf-053c2552de37" key={i} data-class-id={value} className={value ? 'is-apple' : ''}><Typography shuku-edit-id="e-0f2869a2-a33c-4cd0-bf6e-d73267554222" as="span" variant="bodySmall" tone="inherit">{value}</Typography></div>)}</div>
        <Typography shuku-edit-id="e-38ea63a7-b9a1-4620-9f18-1c661f735624" variant="bodySmall">灰色 0：背景　橙色 1：苹果</Typography>
        <Typography shuku-edit-id="e-3222141c-908c-411e-b6cd-417284ace3f4" variant="bodySmall" tone="muted">为便于观察，合并为 36 × 24 格；实际标注逐像素保存。</Typography>
      </div> : <div shuku-edit-id="e-f7fe3888-7c02-45cd-ab77-e719dca98292" className="daa-reading"><Typography shuku-edit-id="e-cdc0bd35-3d43-4b11-acf7-8dc1f59bcda3" variant="h2">先标数据，再看格式</Typography><Typography shuku-edit-id="e-92866d76-b23c-48ce-a7b8-ca12f8470600" variant="body">按住拖动画笔涂出苹果；涂错的地方用橡皮擦擦掉。</Typography>
        <div shuku-edit-id="e-64542a2c-8aa8-4123-a1c8-6bbe4ebf04c0" className="daa-actions"><Button active={!erase} onClick={() => setErase(false)}><Typography shuku-edit-id="e-50cdb86f-04ca-4a9a-a566-6d140ef46120" as="span" variant="bodySmall" tone="inherit">画笔</Typography></Button><Button active={erase} onClick={() => setErase(true)}><Typography shuku-edit-id="e-a0744a18-3ce0-4cfd-b3b4-fd179a23b63d" as="span" variant="bodySmall" tone="inherit">橡皮擦</Typography></Button></div>
        <div shuku-edit-id="e-878b6dc6-a0aa-45dc-b9b9-abfa03764479" className="daa-actions"><Button onClick={() => { setExample(true); setStrokes([]); }}><Typography shuku-edit-id="e-f8f1c4ec-e8b9-49b6-8ba0-99f3b0d4074d" as="span" variant="bodySmall" tone="inherit">填入示例</Typography></Button><Button onClick={() => { setExample(false); setStrokes([]); }}><Typography shuku-edit-id="e-841b7a0c-af28-4941-9fba-39bf00eaf1bd" as="span" variant="bodySmall" tone="inherit">清空标注</Typography></Button></div>
        <Button variant="primary" disabled={!hasTarget} onClick={() => { drawing.current = false; setConfirmed(true); }}><Typography shuku-edit-id="e-a50302e4-aaa7-42a8-badf-84d3934b65a5" as="span" variant="bodySmall" tone="inherit">确认标注，查看格式</Typography></Button>
      </div>}
    </div>
  </LessonPage>;
}

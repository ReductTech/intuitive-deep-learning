import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import { drawBeads, makePalette, photographCanvas, sampleBeads, type BeadGrid } from './beadModel';
import './BeadStudio.css';

const asset = (name: string) => moduleAssetUrl(`images/${name}`);
type Position = { x: number; y: number; columns: number; rows: number } | null;
const densities = [[48, 64], [24, 32], [16, 22]];
const labels = ['原图', '细密拼豆', '简化拼豆', '极简拼豆'];
const photos = [["alpine-lake-source.webp", '山湖'], ["coast-source.webp", '海岸'], ["fox-source.webp", '狐狸'], ["car-source.webp", '汽车'], ["cat-portrait.webp", '猫咪']];

function BeadBoard({ source, grid, position, onPoint }: { source: HTMLCanvasElement; grid?: BeadGrid; position: Position; onPoint: (p: Position) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    if (grid) drawBeads(context, grid, canvas.width, canvas.height, position);
    else {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
      if (position) {
        const dx = canvas.width / position.columns;
        const dy = canvas.height / position.rows;
        context.strokeStyle = '#f07e47';
        context.lineWidth = 3;
        context.strokeRect(Math.floor(position.x * position.columns) * dx, Math.floor(position.y * position.rows) * dy, dx, dy);
      }
    }
  }, [source, grid, position]);
  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    onPoint({ x: Math.max(0, Math.min(0.999, (event.clientX - bounds.left) / bounds.width)), y: Math.max(0, Math.min(0.999, (event.clientY - bounds.top) / bounds.height)), columns: grid?.columns ?? 16, rows: grid?.rows ?? 22 });
  };
  return <canvas shuku-edit-id="e-f3447c27-6885-4428-a28a-2c9c23b0cd89" ref={ref} width={480} height={640} data-columns={grid?.columns ?? 'photo'} data-rows={grid?.rows ?? 'photo'} aria-label={grid ? `${grid.columns}列${grid.rows}行，${grid.colors.length}颗实时计算的拼豆` : '用于采样的原图'} onPointerMove={point} onPointerLeave={() => onPoint(null)} />;
}

export function BeadOpeningPage() {
  const [url, setUrl] = useState(asset("car-source.webp"));
  const [source, setSource] = useState<HTMLCanvasElement | null>(null);
  const [position, setPosition] = useState<Position>(null);
  const [colorCount, setColorCount] = useState(24);
  const [coarse, setCoarse] = useState(false);
  const [error, setError] = useState('');
  const uploadRef = useRef<HTMLInputElement>(null);
  const objectUrl = useRef<string | null>(null);
  useEffect(() => {
    let active = true;
    setSource(null);
    setPosition(null);
    setError('');
    const image = new Image(); image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (!active) return;
      try { setSource(photographCanvas(image)); } catch { setError('无法读取这张照片，请换一张。'); }
    };
    image.onerror = () => { if (active) setError('照片加载失败，请重试或上传照片。'); };
    image.src = url;
    return () => { active = false; };
  }, [url]);
  useEffect(() => () => { if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); }, []);
  const palette = useMemo(() => source ? makePalette(source, colorCount) : [], [source, colorCount]);
  const grids = useMemo(() => source ? densities.map(([c, r], i) => sampleBeads(source, coarse && i === 2 ? 10 : c, coarse && i === 2 ? 14 : r, palette)) : [], [source, palette, coarse]);
  const selectedGrid = position ? grids.find(g => g.columns === position.columns && g.rows === position.rows) ?? grids[2] : null;
  const current = position && selectedGrid ? selectedGrid.colors[Math.min(selectedGrid.rows - 1, Math.floor(position.y * selectedGrid.rows)) * selectedGrid.columns + Math.min(selectedGrid.columns - 1, Math.floor(position.x * selectedGrid.columns))] : null;

  return <ContentBlock shuku-edit-id="e-613f00fe-c4ab-4c12-86d8-5acd169b7e2a" className="di-beads" headingLevel={1} title="照片，也可以拼出来吗？" subtitle="一张照片会失去什么，又保留什么？" style={{ '--di-studio': `url("${asset("craft-studio-background.webp")}")` } as CSSProperties}>
    <div shuku-edit-id="e-10ae796f-97fa-411a-8df3-177fb4ab719c" className="di-beads__body">
      <div shuku-edit-id="e-122031ba-d144-40af-a363-ecfde5d45723" className="di-beads__tools">
        <Button onClick={() => uploadRef.current?.click()}><Typography shuku-edit-id="e-ce65708f-82c4-4f0a-963a-68699a692679" as="span" variant="bodySmall" tone="inherit">↑ 上传照片</Typography></Button>
        <div shuku-edit-id="e-c1852c8e-6fed-4ead-8343-09da8d6545fb" className="di-beads__color-switch" role="group" aria-label="拼豆颜色数量">{[24, 8].map(count => <Button key={count} active={colorCount === count} onClick={() => setColorCount(count)}><Typography shuku-edit-id="e-797d379d-a625-4656-9b6a-654c7899a4ce" as="span" variant="bodySmall" tone="inherit">{count} 色</Typography></Button>)}</div>
        <input shuku-edit-id="e-7e632d52-3085-48a1-97da-2a35d8a69bec" ref={uploadRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={event => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (!file.type.startsWith('image/') || file.size > 12 * 1024 * 1024) { setError('请选择不超过 12 MB 的图片。'); return; }
          if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
          objectUrl.current = URL.createObjectURL(file);
          setUrl(objectUrl.current);
          event.target.value = '';
        }} />
      </div>
      <div shuku-edit-id="e-6411bac1-0419-4955-8049-2bd2b37976f0" className="di-beads__exhibit">
        <div shuku-edit-id="e-8496936a-407c-4f71-87f3-43343d41d4cb" className="di-beads__photo-rail" role="group" aria-label="选择照片">{photos.map(([file, label]) => <Button key={file} className="di-beads__choice" active={url === asset(file)} onClick={() => setUrl(asset(file))}><img shuku-edit-id="e-1f5e702c-da19-4406-82d6-efaf5f7dc9b8" src={asset(file)} alt="" /><Typography shuku-edit-id="e-0fab9f4c-84cc-493f-a543-448a449d2bda" as="span" variant="bodySmall" tone="inherit">{label}</Typography></Button>)}</div>
        {labels.map((label, i) => <figure shuku-edit-id="e-e17433d8-4364-4712-9b66-58e6bf304c2c" key={label} className={`di-beads__board di-beads__board--${i}`}>
          <div shuku-edit-id="e-6f9ef64a-9d8f-4c58-93d0-6385bce1d5b5" className="di-beads__mount"><div shuku-edit-id="e-b1531d1f-da70-44fd-8649-7addf09b9b5a" className="di-beads__picture-frame">
            {source ? <BeadBoard source={source} grid={i ? grids[i - 1] : undefined} position={position} onPoint={setPosition} /> : <div shuku-edit-id="e-a7e2a30a-04f0-4901-94d2-6ef414060952" className="di-beads__loading"><Typography shuku-edit-id="e-ab603d1a-9d2b-41c0-b2a5-ebfd9d0cc6cd" variant="bodySmall">{error || '正在准备照片…'}</Typography></div>}
            </div><div shuku-edit-id="e-be4e3c9c-53d1-41d0-be53-469d9b4f07b7" className="di-beads__stand" /><div shuku-edit-id="e-5c2124f4-a6f1-42d8-997e-b82173e97c1c" className="di-beads__feet" />
          </div>
          <figcaption shuku-edit-id="e-cab02f9d-ca47-4b77-a016-e4f848fd1193"><Typography shuku-edit-id="e-735b21f5-3d57-4988-8c71-d1ca37b177b9" variant="body" tone="accent">{label}</Typography>{i > 0 && grids[i - 1] && <Typography shuku-edit-id="e-089d0f16-e3db-47cd-bf8d-197932584517" variant="bodySmall" tone="muted">{grids[i - 1].colors.length.toLocaleString()} 颗</Typography>}</figcaption>
        </figure>)}
      </div>
      <div shuku-edit-id="e-7b21b62f-ef9f-47a2-b8ae-9b21f7e41a83" className="di-beads__timeline" aria-hidden="true"><span shuku-edit-id="e-14b0a228-5289-49f1-9add-300359f0dcf7" /><i shuku-edit-id="e-541a6b36-c9e3-4b2d-886f-b6b32bb5ab63" /><i shuku-edit-id="e-b3ce7e17-5c58-40ac-b40e-9b283d762452" /><i shuku-edit-id="e-3337fe4a-5f71-4562-8070-3bc4440647c3" /><i shuku-edit-id="e-41ba5229-7c6d-4bfb-b9a2-eec380c8442a" /><span shuku-edit-id="e-b256b2f4-aaaa-4fe6-b3f5-a8f2441ac890">→</span></div>
      <div shuku-edit-id="e-10e66b8c-d44e-4ad3-8635-4962c88f7b93" className="di-beads__footer">
        <div shuku-edit-id="e-587ce029-cc6b-4af4-98ba-b6aaf6d67fca" className="di-beads__observation" aria-live="polite">{current ? <><i shuku-edit-id="e-c5f26aed-d0c0-45f3-a28b-133634f58b13" style={{ background: `rgb(${current.join(',')})` }} /><Typography shuku-edit-id="e-0611e7ca-1ca5-47c6-835c-d89cf28c52a1" variant="bodySmall" tone="accent">取平均颜色，选一颗最接近的豆子。</Typography></> : <><span shuku-edit-id="e-f904eb39-8306-443d-8034-ff5e75a84f60" className="di-beads__question-mark" aria-hidden="true">⌕</span><Typography shuku-edit-id="e-9573fdac-18c3-4c76-b323-5b153ce54d3f" variant="body" tone="accent">豆子越少，哪些细节最先消失？</Typography></>}</div><span shuku-edit-id="e-8e1df1c8-f136-4e50-aa18-ec15896ed548" className="di-beads__footer-rule" />
        <Button className="di-beads__less" active={coarse} onClick={() => setCoarse(value => !value)} disabled={!source}><Typography shuku-edit-id="e-75e308c2-36a8-47c7-8852-e2d23b3dd13b" as="span" variant="body" tone="inherit">{coarse ? '恢复拼豆' : '再少一点'} →</Typography></Button>
      </div>
      {error && source && <Typography shuku-edit-id="e-40fa1f5f-1233-4e6d-8e38-5fe9ba97d680" variant="bodySmall" tone="danger">{error}</Typography>}
    </div>
  </ContentBlock>;
}

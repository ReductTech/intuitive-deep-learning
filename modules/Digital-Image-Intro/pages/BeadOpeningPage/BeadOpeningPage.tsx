import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Button, ContentBlock, moduleAssetUrl, Typography } from '../../../shared/react';
import { drawBeads, makePalette, photographCanvas, sampleBeads, type BeadGrid } from './beadModel';
import './BeadStudio.css';

const asset = (name: string) => moduleAssetUrl('10da7e16-ff24-449a-9978-b74b99524e47', `images/${name}`);
type Position = { x: number; y: number; columns: number; rows: number } | null;
const densities = [[48, 64], [24, 32], [16, 22]];
const labels = ['原图', '细密拼豆', '简化拼豆', '极简拼豆'];
const photos = [['alpine-lake-source.png', '山湖'], ['coast-source.png', '海岸'], ['fox-source.png', '狐狸'], ['car-source.png', '汽车'], ['cat-portrait.jpg', '猫咪']];

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
  return <canvas ref={ref} width={480} height={640} data-columns={grid?.columns ?? 'photo'} data-rows={grid?.rows ?? 'photo'} aria-label={grid ? `${grid.columns}列${grid.rows}行，${grid.colors.length}颗实时计算的拼豆` : '用于采样的原图'} onPointerMove={point} onPointerLeave={() => onPoint(null)} />;
}

export function BeadOpeningPage() {
  const [url, setUrl] = useState(asset('car-source.png'));
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
    const image = new Image();
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

  return <ContentBlock className="di-beads" headingLevel={1} title="照片，也可以拼出来吗？" subtitle="一张照片会失去什么，又保留什么？" style={{ '--di-studio': `url("${asset('craft-studio-background.png')}")` } as CSSProperties}>
    <div className="di-beads__body">
      <div className="di-beads__tools">
        <Button onClick={() => uploadRef.current?.click()}><Typography as="span" variant="bodySmall" tone="inherit">↑ 上传照片</Typography></Button>
        <div className="di-beads__color-switch" role="group" aria-label="拼豆颜色数量">{[24, 8].map(count => <Button key={count} active={colorCount === count} onClick={() => setColorCount(count)}><Typography as="span" variant="bodySmall" tone="inherit">{count} 色</Typography></Button>)}</div>
        <input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={event => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (!file.type.startsWith('image/') || file.size > 12 * 1024 * 1024) { setError('请选择不超过 12 MB 的图片。'); return; }
          if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
          objectUrl.current = URL.createObjectURL(file);
          setUrl(objectUrl.current);
          event.target.value = '';
        }} />
      </div>
      <div className="di-beads__exhibit">
        <div className="di-beads__photo-rail" role="group" aria-label="选择照片">{photos.map(([file, label]) => <Button key={file} className="di-beads__choice" active={url === asset(file)} onClick={() => setUrl(asset(file))}><img src={asset(file)} alt="" /><Typography as="span" variant="bodySmall" tone="inherit">{label}</Typography></Button>)}</div>
        {labels.map((label, i) => <figure key={label} className={`di-beads__board di-beads__board--${i}`}>
          <div className="di-beads__mount"><div className="di-beads__picture-frame">
            {source ? <BeadBoard source={source} grid={i ? grids[i - 1] : undefined} position={position} onPoint={setPosition} /> : <div className="di-beads__loading"><Typography variant="bodySmall">{error || '正在准备照片…'}</Typography></div>}
            </div><div className="di-beads__stand" /><div className="di-beads__feet" />
          </div>
          <figcaption><Typography variant="body" tone="accent">{label}</Typography>{i > 0 && grids[i - 1] && <Typography variant="bodySmall" tone="muted">{grids[i - 1].colors.length.toLocaleString()} 颗</Typography>}</figcaption>
        </figure>)}
      </div>
      <div className="di-beads__timeline" aria-hidden="true"><span /><i /><i /><i /><i /><span>→</span></div>
      <div className="di-beads__footer">
        <div className="di-beads__observation" aria-live="polite">{current ? <><i style={{ background: `rgb(${current.join(',')})` }} /><Typography variant="bodySmall" tone="accent">取平均颜色，选一颗最接近的豆子。</Typography></> : <><span className="di-beads__question-mark" aria-hidden="true">⌕</span><Typography variant="body" tone="accent">豆子越少，哪些细节最先消失？</Typography></>}</div><span className="di-beads__footer-rule" />
        <Button className="di-beads__less" active={coarse} onClick={() => setCoarse(value => !value)} disabled={!source}><Typography as="span" variant="body" tone="inherit">{coarse ? '恢复拼豆' : '再少一点'} →</Typography></Button>
      </div>
      {error && source && <Typography variant="bodySmall" tone="danger">{error}</Typography>}
    </div>
  </ContentBlock>;
}

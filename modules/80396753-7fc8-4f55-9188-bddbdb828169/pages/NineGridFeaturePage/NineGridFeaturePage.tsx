import { useEffect, useMemo, useState } from 'react';
import { Button, ContentBlock, ExplainPanelButton, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './NineGridFeaturePage.css';
import { NINE_GRID_EDGES, NINE_GRID_IMAGE_URL, nineGridCounts, nineGridRegionCells, readNineGridPixels } from '../../services/nineGridDigit';

const QUIZ_REGION = 3;

export function NineGridFeaturePage() {
  const [pixels, setPixels] = useState<boolean[] | null>(null);
  const [region, setRegion] = useState(0);
  const [counted, setCounted] = useState(0);
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active) return;
      setPixels(readNineGridPixels(image));
    };
    image.src = NINE_GRID_IMAGE_URL;
    return () => { active = false; image.onload = null; };
  }, []);

  const counts = useMemo(() => pixels ? nineGridCounts(pixels) : null, [pixels]);
  const shownRegion = Math.min(region, 8);
  const cells = useMemo(() => pixels ? nineGridRegionCells(pixels, shownRegion) : [], [pixels, shownRegion]);
  const cols = NINE_GRID_EDGES[shownRegion % 3 + 1] - NINE_GRID_EDGES[shownRegion % 3];
  const rows = NINE_GRID_EDGES[Math.floor(shownRegion / 3) + 1] - NINE_GRID_EDGES[Math.floor(shownRegion / 3)];
  const quiz = region === QUIZ_REGION && !solved;
  const finished = region === 9;

  useEffect(() => {
    if (!counts || region >= 9 || quiz) return;
    const target = counts[region];
    const timer = window.setTimeout(() => {
      if (counted < target) {
        setCounted((value) => value + 1);
      } else {
        setRegion((value) => value + 1);
        setCounted(0);
      }
    }, counted < target ? 85 : target === 0 ? 850 : 620);
    return () => window.clearTimeout(timer);
  }, [counts, region, counted, quiz]);

  function markCell(index: number) {
    if (!counts || !quiz || marked.has(index)) return;
    const next = new Set(marked);
    next.add(index);
    setMarked(next);
    if (next.size === counts[QUIZ_REGION]) {
      setSolved(true);
      setCounted(counts[QUIZ_REGION]);
    }
  }

  function replay() {
    setRegion(0);
    setCounted(0);
    setMarked(new Set());
    setSolved(false);
  }

  return <ContentBlock shuku-edit-id="e-4e21183a-1713-49a4-905d-a2067b63e6a0"
    className="vfl-nine-grid-page"
    headingLevel={1}
    title="九宫格区域统计特征"
    subtitle="将 28 × 28 图像划分为 3 × 3 个区域，用各区域的墨迹像素数描述空间分布。"
  >
    <div shuku-edit-id="e-76b835e2-bc40-40fd-bf63-5f416ef15985" className="vfl-nine-grid-main">
      <section shuku-edit-id="e-e4d442e3-d947-4fa7-b511-37f0554a16f3" className="vfl-nine-grid-source vfl-nine-grid-card" aria-label="完整图像和九个区域">
        <div shuku-edit-id="e-0d6abed9-c8bc-482f-a474-9090defcdec1" className="vfl-nine-grid-source-heading">
          <Typography shuku-edit-id="e-4c0f72a4-723e-4a1f-a0ba-e5cee079c157" as="h2" variant="h3" tone="accent">28 × 28 手写数字图像</Typography>
        </div>
        <div shuku-edit-id="e-9d64f58a-b132-4bf9-8d9f-1d50caa326fb" className="vfl-nine-grid-image">
          <img shuku-edit-id="e-f66dcf77-4466-47f8-9b12-16a85cf705be" src={NINE_GRID_IMAGE_URL} alt="真实 MNIST 手写数字 2，划分为九个区域" />
          <div shuku-edit-id="e-704d6095-95dc-451d-8f30-1223444a5b4a" className="vfl-nine-grid-regions" aria-label="按从左到右、从上到下编号的九个区域">
            {Array.from({ length: 9 }, (_, index) => <div shuku-edit-id="e-ade0346e-74f5-4878-a73a-249e37a60f75" key={index} className={`vfl-nine-grid-region ${index === region ? 'is-current' : ''}`}>
              <Typography shuku-edit-id="e-d87a1c21-7a6f-41c3-920d-545c3207ea66" as="span" variant="bodySmall" tone="inherit" className="vfl-nine-grid-region-number">{index + 1}</Typography>
              {counts && index < region && <Typography shuku-edit-id="e-99c66a09-bfba-4f6b-abe3-048a15b5ec90" as="span" variant="h3" tone="inherit" className="vfl-nine-grid-region-count">{counts[index]}</Typography>}
            </div>)}
          </div>
        </div>
      </section>
      <section shuku-edit-id="e-a405845a-ff51-4c95-9401-9060ef57e3de" className={`vfl-nine-grid-detail vfl-nine-grid-card ${quiz ? 'is-quiz' : ''}`} aria-label="放大的当前区域">
        <div shuku-edit-id="e-11a230e6-f545-4f5c-bb44-d2608e6b4ee2" className="vfl-nine-grid-detail-heading">
          <Typography shuku-edit-id="e-de6e6943-776c-455f-b4ed-5daaedde117b" as="span" variant="h2" tone="inherit" className="vfl-nine-grid-active-number">{shownRegion + 1}</Typography>
          <Typography shuku-edit-id="e-2b69d85b-de6c-42cc-84a8-9e12dbb71cfe" as="h2" variant="h2" tone="inherit">第 {shownRegion + 1} 区域 · 逐像素计数</Typography>
        </div>
        <div shuku-edit-id="e-2933842b-d448-4cec-8521-cf4dc9456943" className="vfl-nine-grid-detail-body">
          <div shuku-edit-id="e-fd143908-54e7-40a6-94da-f6cc7f92d3df" className="vfl-nine-grid-pixels" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }} role="group" aria-label={`第 ${shownRegion + 1} 格放大后的像素网格`}>
            {cells.map((cell, index) => {
              const lit = cell.ink && (quiz ? marked.has(index) : cell.rank < counted || finished);
              const className = `vfl-nine-grid-pixel ${cell.ink ? lit ? 'is-counted' : 'is-ink' : ''}`;
              return quiz && cell.ink ? <button shuku-edit-id="e-661ed3dd-d73c-4ab7-8ad1-f5e09c02742f" key={`${cell.x}-${cell.y}`} type="button" className={className}
                aria-label={`第 ${cell.y - NINE_GRID_EDGES[Math.floor(shownRegion / 3)] + 1} 行第 ${cell.x - NINE_GRID_EDGES[shownRegion % 3] + 1} 列墨迹${marked.has(index) ? '，已标记' : ''}`}
                aria-pressed={marked.has(index)} onClick={() => markCell(index)} /> : <div shuku-edit-id="e-97a92a25-4d11-4ed0-97b1-666a6d52a9a7" key={`${cell.x}-${cell.y}`} className={className} aria-hidden="true" />;
            })}
          </div>
          <div shuku-edit-id="e-d9994fe5-d9a3-4596-9916-f96865c79114" className={`vfl-nine-grid-counter ${quiz ? 'is-quiz' : ''}`} role="status" aria-live={quiz ? 'polite' : 'off'}>
            <Typography shuku-edit-id="e-94fe7072-23ab-4852-b2ac-1ce84a712cd6" variant="h3" tone="accent">{finished ? '统计完成' : quiz ? '请你来数' : '已计数'}</Typography>
            <Typography shuku-edit-id="e-8470e761-e435-47da-a257-e4f84f951041" as="strong" variant="display" tone="inherit" className="vfl-nine-grid-counter-value">{String(finished ? counts?.[8] ?? 0 : quiz ? marked.size : counted).padStart(2, '0')}</Typography>
            <div shuku-edit-id="e-a47ff09d-5ae8-4635-9dd0-4414e8a45179" className="vfl-nine-grid-counter-rule"/>
            <Typography shuku-edit-id="e-ae4c56b0-8ba6-40bb-a81f-24b226c60906" variant="bodySmall" tone="accent">{finished ? '九项区域计数，组成下方特征向量。' : quiz ? <>点击深色像素。<br shuku-edit-id="e-74274418-42dd-4d5b-9d72-a91db65e26f7"/>点完自动继续。</> : '橙色表示已计数的墨迹像素。'}</Typography>
            {finished && <Button onClick={replay}>重新播放</Button>}
          </div>
        </div>
      </section>
    </div>
    <div shuku-edit-id="e-c4ed009b-f621-44f2-8b5d-9403a398a1f3" className="vfl-nine-grid-footer">
      <div shuku-edit-id="e-e47c2db4-b2b9-4c51-b8b9-77a1488dda70" className="vfl-nine-grid-vector">
        <div shuku-edit-id="e-6726d590-2a94-4e77-872d-c5e34b83dc59" className="vfl-nine-grid-vector-label">
          <div shuku-edit-id="e-d4a08569-19f8-49ef-ab7f-90bee6474a6f"><Typography shuku-edit-id="e-35d6c70f-20ac-415f-bbb8-6ceae3ff8b21" as="span" variant="h3" tone="accent">九维特征向量</Typography><Typography shuku-edit-id="e-0eee0ae0-d0e7-4974-b62c-acaa253f29f7" variant="bodySmall" tone="accent">各区域墨迹像素数</Typography></div>
          <ExplainPanelButton label="说明九维特征向量及排列顺序">
            <Typography shuku-edit-id="e-eb7367c7-4366-424c-9994-2a33085e75eb" variant="bodySmall" tone="muted">每一维记录一个区域的前景像素数。</Typography>
            <Typography shuku-edit-id="e-8898c789-6348-474e-aa47-fa1d41a43420" variant="bodySmall" tone="muted">从左到右、从上到下只是常用约定。各维可以统一重新排列，但所有样本及训练、预测必须采用相同顺序，保证每一维对应同一区域。</Typography>
          </ExplainPanelButton>
        </div>
        <span shuku-edit-id="e-e84272a0-133e-4ce2-a3d8-e3f65cde8f4b" className="vfl-nine-grid-vector-arrow" aria-hidden="true" />
        <MathFormulaBlock className="vfl-nine-grid-vector-formula" ariaLabel="按区域一至九依次填入统计结果的九维特征向量">
          <MathFormulaStatic latex={'\\mathbf{x}=\\lbrack'} />
          {Array.from({ length: 9 }, (_, index) => {
            const complete = !!counts && (index < region || index === region && !quiz && counted >= counts[index]);
            return <span shuku-edit-id="e-033998de-32d6-49e0-9a28-68d33db9ec0a" key={index} className="vfl-nine-grid-vector-entry">
              <span shuku-edit-id="e-3503fff0-04b5-4524-8cfd-97497162bfd5" className={`vfl-nine-grid-vector-slot ${!complete && index === region ? 'is-pending' : ''}`} aria-label={`第 ${index + 1} 维：${complete ? counts![index] : '待统计'}`}>
                <MathFormulaStatic latex={complete ? String(counts![index]) : '\\underline{\\phantom{00}}'} />
              </span>
              {index < 8 && <MathFormulaStatic latex="," />}
            </span>;
          })}
          <MathFormulaStatic latex={'\\rbrack'} />
        </MathFormulaBlock>
      </div>
    </div>
  </ContentBlock>;
}

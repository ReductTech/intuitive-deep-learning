import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Feedback, Question, RangeControl, emitTelemetry, getTelemetryState } from '../../shared/react';

interface SegmentationDataBlockProps { onComplete?: () => void; }
interface SegmentationDataState { cropX?: number; aligned?: boolean; reached?: boolean; }
const stateKey = 'experiment:segmentation-aligned-crop-v1';

function PixelGrid({ label, cropX, mask }: { label: string; cropX: number; mask?: boolean }) {
  return (
    <div className="pvm-grid-panel">
      <strong>{label}</strong>
      <div className={`pvm-data-grid${mask ? ' is-mask' : ''}`} aria-hidden="true">
        {Array.from({ length: 36 }, (_, index) => <span key={index} className={index % 6 >= 2 && index % 6 <= 4 && Math.floor(index / 6) >= 1 ? 'is-object' : ''} />)}
        <i style={{ left: `${cropX * 10}%` }} />
      </div>
    </div>
  );
}

export function SegmentationDataBlock({ onComplete }: SegmentationDataBlockProps) {
  const [cropX, setCropX] = useState(0);
  const [aligned, setAligned] = useState(false);
  const [reached, setReached] = useState(false);
  const [questionCorrect, setQuestionCorrect] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    void getTelemetryState<SegmentationDataState>(stateKey).then((entry) => {
      if (!alive) return;
      if (Number.isFinite(entry?.state?.cropX)) setCropX(Number(entry?.state?.cropX));
      if (entry?.state?.aligned) setAligned(true);
      if (entry?.state?.reached) setReached(true);
      setHydrated(true);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!hydrated || !reached || !questionCorrect || completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [hydrated, onComplete, questionCorrect, reached]);

  function update(nextCropX: number, nextAligned: boolean) {
    const nextReached = reached || (nextAligned && nextCropX >= 2);
    setCropX(nextCropX); setAligned(nextAligned); setReached(nextReached);
    emitTelemetry('segmentation_crop_configure', null, { state_key: stateKey, crop_x: nextCropX, aligned: nextAligned, reached: nextReached, state: { cropX: nextCropX, aligned: nextAligned, reached: nextReached } });
  }

  return (
    <ContentBlock className="pvm-block pvm-data-block" title="分割标签本身也是一张图，几何变换必须与输入逐像素对齐" subtitle="移动裁剪窗口，并决定标签图是否复用同一组裁剪坐标。">
      <div className="pvm-crop-layout">
        <div className="pvm-crop-pair">
          <PixelGrid label="RGB 输入图像" cropX={cropX} />
          <PixelGrid label="颜色类别标签" cropX={aligned ? cropX : 0} mask />
        </div>
        <div className="pvm-crop-console">
          <RangeControl label="随机裁剪的水平起点" min={0} max={4} step={1} value={cropX} scale={['左', '中', '右']} hint={!reached} onChange={(event) => update(Number(event.currentTarget.value), aligned)} />
          <div className="pvm-align-buttons"><Button active={!aligned} onClick={() => update(cropX, false)}>标签单独裁剪</Button><Button active={aligned} hint={!reached} onClick={() => update(cropX, true)}>复用输入裁剪参数</Button></div>
          <Feedback status={aligned ? 'correct' : 'wrong'} message={aligned ? '两张图的裁剪框已经同步；裁剪后的每个输入像素仍对应正确类别。' : '裁剪窗口错位后，目标像素会被错误的背景或其他类别监督。'} />
        </div>
      </div>
      <Question
        type="choice"
        title="缩放语义分割标签图时，为什么通常使用最近邻插值而不是双线性插值？"
        options={[
          { key: 'A', value: 'discrete-labels', label: '类别编号是离散值；双线性插值会混合相邻类别，产生不存在的标签' },
          { key: 'B', value: 'more-colors', label: '因为标签图需要产生尽可能多的新颜色', wrongFeedback: '标签颜色对应固定类别，产生新颜色反而意味着非法类别。' },
          { key: 'C', value: 'blur-input', label: '因为最近邻插值会让 RGB 输入图像更平滑', wrongFeedback: '这里讨论的是离散标签图，而不是 RGB 输入图像的视觉平滑度。' },
        ]}
        answer="discrete-labels"
        feedback={{ correct: reached ? '正确。同步几何变换保证位置一致，最近邻插值保证类别编号仍是合法离散值。' : '判断正确；再同步两张图的裁剪框并移动到中间或右侧。' }}
        persistenceKey="segmentation-label-resize-v1"
        onCheck={(result) => setQuestionCorrect(result.ok)}
      />
    </ContentBlock>
  );
}

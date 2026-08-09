import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Feedback, NoticeStrip, Question, ValueTile, emitTelemetry, getTelemetryState } from '../../shared/react';

interface DetectionDatasetBlockProps {
  onComplete?: () => void;
}

interface DatasetState {
  normalized?: boolean;
  inspectedNormalized?: boolean;
}

const stateKey = 'experiment:detection-dataset-label-v1';
const pixelTarget = ['0', '48', '36', '208', '204'];
const normalizedTarget = ['0', '0.1875', '0.1406', '0.8125', '0.7969'];

export function DetectionDatasetBlock({ onComplete }: DetectionDatasetBlockProps) {
  const [normalized, setNormalized] = useState(false);
  const [inspectedNormalized, setInspectedNormalized] = useState(false);
  const [questionCorrect, setQuestionCorrect] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const completedRef = useRef(false);
  const target = normalized ? normalizedTarget : pixelTarget;

  useEffect(() => {
    let active = true;
    void getTelemetryState<DatasetState>(stateKey).then((entry) => {
      if (!active) return;
      if (entry?.state?.normalized) setNormalized(true);
      if (entry?.state?.inspectedNormalized) setInspectedNormalized(true);
      setHydrated(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated || !inspectedNormalized || !questionCorrect || completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [hydrated, inspectedNormalized, onComplete, questionCorrect]);

  function setCoordinateMode(nextNormalized: boolean) {
    const nextInspected = inspectedNormalized || nextNormalized;
    setNormalized(nextNormalized);
    setInspectedNormalized(nextInspected);
    emitTelemetry('detection_dataset_coordinate_mode', null, {
      state_key: stateKey,
      normalized: nextNormalized,
      inspected_normalized: nextInspected,
      state: { normalized: nextNormalized, inspectedNormalized: nextInspected },
    });
  }

  return (
    <ContentBlock
      className="dmm-block dmm-dataset-block"
      title="分类标签只说‘是什么’，检测标签还要说‘在哪里’"
      subtitle="观察一张 256×256 的香蕉图像，把类别和真实边界框整理成模型能够批量读取的标签。"
    >
      <NoticeStrip tone="blue" lead="标签顺序：">每个目标使用 5 个数表示：[类别, 左上角 x, 左上角 y, 右下角 x, 右下角 y]。</NoticeStrip>
      <div className="dmm-dataset-layout">
        <div className="dmm-banana-scene" role="img" aria-label="256 乘 256 图像中有一根香蕉，真实边界框从坐标 48, 36 延伸到 208, 204">
          <span className="dmm-banana" aria-hidden="true" />
          <span className="dmm-ground-truth" aria-hidden="true"><b>banana · class 0</b></span>
          <span className="dmm-scene-size" aria-hidden="true">256 × 256</span>
        </div>
        <div className="dmm-label-console">
          <div className="dmm-mode-switch" aria-label="坐标显示方式">
            <Button active={!normalized} onClick={() => setCoordinateMode(false)}>像素坐标</Button>
            <Button active={normalized} hint={!inspectedNormalized} onClick={() => setCoordinateMode(true)}>归一化坐标</Button>
          </div>
          <div className="dmm-label-row" aria-label={`当前目标标签 ${target.join(', ')}`}>
            {target.map((value, index) => (
              <span key={`${index}-${value}`}><small>{['class', 'x₁', 'y₁', 'x₂', 'y₂'][index]}</small><strong>{value}</strong></span>
            ))}
          </div>
          <div className="dmm-dataset-metrics">
            <ValueTile label="图像批量" value="(B,3,256,256)" tone="blue" />
            <ValueTile label="标签批量" value="(B,m,5)" tone="orange" />
          </div>
          <Feedback
            status={normalized ? 'correct' : 'hint'}
            message={normalized
              ? '坐标已经除以图像边长，落在 0–1。这样标签不再依赖当前像素尺寸。'
              : '切换到归一化坐标，观察四个位置值如何从像素尺度映射到 0–1。'}
          />
        </div>
      </div>
      <Question
        type="choice"
        title="同一批图像中目标数量不同，怎样把标签整理成统一的 (B, m, 5)？"
        options={[
          { key: 'A', value: 'pad-invalid', label: '取本批最大目标数 m，不足位置用 class = -1 的非法框填充' },
          { key: 'B', value: 'drop-extra', label: '每张图只保留一个最大的目标，其余目标全部删除', wrongFeedback: '删除真实目标会让监督信息缺失，模型会把它们误当成背景。' },
          { key: 'C', value: 'resize-label', label: '把标签重复拉伸到相同长度，允许坐标字段错位', wrongFeedback: '标签字段的语义与顺序必须保持固定，不能通过重复或拉伸改变。' },
        ]}
        answer="pad-invalid"
        feedback={{ correct: inspectedNormalized ? '正确。统一形状依靠填充，不依靠丢弃真实目标；有效坐标仍保持在 0–1。' : '批量整理判断正确；再切换一次归一化坐标，完成标签表示的观察。' }}
        persistenceKey="detection-dataset-padding-v1"
        onCheck={(result) => setQuestionCorrect(result.ok)}
      />
    </ContentBlock>
  );
}

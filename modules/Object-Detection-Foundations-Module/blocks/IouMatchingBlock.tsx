import { useEffect, useRef, useState } from 'react';
import { ContentBlock, Feedback, FormulaBlock, Question, RangeControl, ValueTile, emitTelemetry, getTelemetryState } from '../../shared/react';
import { boxArea, boxIou, intersectionArea, intersectionBox, type DetectionBox } from '../domain/boxGeometry';

interface IouMatchingBlockProps {
  onComplete?: () => void;
}

interface IouState {
  offset?: number;
  reached?: boolean;
}

const stateKey = 'experiment:detection-iou-matching-v1';
const groundTruth: DetectionBox = { x1: 22, y1: 18, x2: 70, y2: 78 };

function boxStyle(box: DetectionBox) {
  return {
    left: `${box.x1}%`,
    top: `${box.y1}%`,
    width: `${Math.max(0, box.x2 - box.x1)}%`,
    height: `${Math.max(0, box.y2 - box.y1)}%`,
  };
}

export function IouMatchingBlock({ onComplete }: IouMatchingBlockProps) {
  const [offset, setOffset] = useState(18);
  const [reached, setReached] = useState(false);
  const [questionCorrect, setQuestionCorrect] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const completedRef = useRef(false);
  const anchor: DetectionBox = { ...groundTruth, x1: groundTruth.x1 + offset, x2: groundTruth.x2 + offset };
  const overlap = intersectionBox(groundTruth, anchor);
  const overlapArea = intersectionArea(groundTruth, anchor);
  const unionArea = boxArea(groundTruth) + boxArea(anchor) - overlapArea;
  const iou = boxIou(groundTruth, anchor);

  useEffect(() => {
    let active = true;
    void getTelemetryState<IouState>(stateKey).then((entry) => {
      if (!active) return;
      if (Number.isFinite(entry?.state?.offset)) setOffset(Number(entry?.state?.offset));
      if (entry?.state?.reached) setReached(true);
      setHydrated(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated || !reached || !questionCorrect || completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [hydrated, onComplete, questionCorrect, reached]);

  function moveAnchor(nextOffset: number) {
    const nextAnchor = { ...groundTruth, x1: groundTruth.x1 + nextOffset, x2: groundTruth.x2 + nextOffset };
    const nextIou = boxIou(groundTruth, nextAnchor);
    const nextReached = reached || nextIou >= 0.65;
    setOffset(nextOffset);
    setReached(nextReached);
    emitTelemetry('iou_anchor_move', null, {
      state_key: stateKey,
      offset: nextOffset,
      iou: Number(nextIou.toFixed(3)),
      reached: nextReached,
      state: { offset: nextOffset, reached: nextReached },
    });
  }

  return (
    <ContentBlock
      className="odf-block odf-iou-block"
      title="锚框与真实框有多像，不能只靠目测"
      subtitle="移动蓝色锚框，让它与绿色真实框的 IoU 达到 0.65。观察交集、并集和最终比值怎样一起变化。"
    >
      <div className="odf-iou-layout">
        <div className="odf-iou-stage" role="img" aria-label={`真实框与锚框当前交并比为 ${iou.toFixed(2)}`}>
          <span className="odf-iou-object" aria-hidden="true" />
          <span className="odf-box odf-box--truth" style={boxStyle(groundTruth)}><b>真实框</b></span>
          <span className="odf-box odf-box--anchor" style={boxStyle(anchor)}><b>锚框</b></span>
          {overlapArea > 0 && <span className="odf-iou-overlap" style={boxStyle(overlap)} aria-hidden="true" />}
        </div>
        <div className="odf-iou-console">
          <RangeControl
            label="锚框水平偏移"
            min={-20}
            max={20}
            step={1}
            value={offset}
            suffix="%"
            scale={['向左', '重合', '向右']}
            hint={!reached}
            onChange={(event) => moveAnchor(Number(event.currentTarget.value))}
          />
          <div className="odf-iou-metrics">
            <ValueTile label="交集面积" value={Math.round(overlapArea)} tone="success" />
            <ValueTile label="并集面积" value={Math.round(unionArea)} tone="blue" />
            <ValueTile label="IoU" value={iou.toFixed(2)} tone={iou >= 0.65 ? 'success' : 'orange'} />
          </div>
          <FormulaBlock
            ariaLabel="交并比等于交集面积除以并集面积"
            fraction={{ numerator: `交集 ${Math.round(overlapArea)}`, denominator: `并集 ${Math.round(unionArea)}`, prefix: 'IoU =' }}
          />
          <Feedback
            status={iou >= 0.65 ? 'correct' : 'hint'}
            message={iou >= 0.65
              ? '达到匹配目标。锚框越贴近真实框，交集通常增大、并集相对减小，IoU 趋近 1。'
              : `还差 ${(0.65 - iou).toFixed(2)}。继续减少两个框中心位置的偏差。`}
          />
        </div>
      </div>
      <Question
        type="choice"
        title="为什么 IoU 的分母要用并集，而不能只用“交集 ÷ 真实框面积”？"
        options={[
          { key: 'A', value: 'penalize-oversize', label: '并集会惩罚过大的候选框，避免“只要盖住真实框就得满分”' },
          { key: 'B', value: 'larger-number', label: '因为并集一定能让最终数值大于 1', wrongFeedback: 'IoU 的范围是 0 到 1；并集作为分母不会让比值超过 1。' },
          { key: 'C', value: 'ignore-position', label: '因为使用并集后就不再受框位置影响', wrongFeedback: '位置会直接改变交集与并集，因此仍然显著影响 IoU。' },
        ]}
        answer="penalize-oversize"
        feedback={{ correct: reached ? '正确。IoU 同时约束“有没有盖住”和“有没有框得过大”。' : '判断正确；还需要在上方亲手找到 IoU ≥ 0.65 的位置。' }}
        persistenceKey="detection-iou-meaning-v1"
        onCheck={(result) => setQuestionCorrect(result.ok)}
      />
    </ContentBlock>
  );
}

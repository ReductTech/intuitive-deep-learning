import { useEffect, useRef, useState } from 'react';
import { ContentBlock, Feedback, NoticeStrip, Question, RangeControl, ValueTile, emitTelemetry, getTelemetryState } from '../../shared/react';
import { nonMaximumSuppression, type DetectionBox, type ScoredDetection } from '../domain/boxGeometry';

interface NonMaximumSuppressionBlockProps {
  onComplete?: () => void;
}

interface NmsState {
  threshold?: number;
  reached?: boolean;
}

const stateKey = 'experiment:detection-nms-v1';
const detections: ScoredDetection[] = [
  { id: 'A', label: '汽车', score: 0.94, x1: 10, y1: 18, x2: 48, y2: 82 },
  { id: 'B', label: '汽车', score: 0.86, x1: 14, y1: 20, x2: 52, y2: 84 },
  { id: 'C', label: '汽车', score: 0.72, x1: 8, y1: 12, x2: 44, y2: 76 },
  { id: 'D', label: '行人', score: 0.91, x1: 66, y1: 24, x2: 83, y2: 82 },
];

function boxStyle(box: DetectionBox) {
  return {
    left: `${box.x1}%`,
    top: `${box.y1}%`,
    width: `${box.x2 - box.x1}%`,
    height: `${box.y2 - box.y1}%`,
  };
}

export function NonMaximumSuppressionBlock({ onComplete }: NonMaximumSuppressionBlockProps) {
  const [threshold, setThreshold] = useState(0.8);
  const [reached, setReached] = useState(false);
  const [questionCorrect, setQuestionCorrect] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const completedRef = useRef(false);
  const kept = nonMaximumSuppression(detections, threshold);
  const keptIds = new Set(kept.map((item) => item.id));
  const suppressed = detections.filter((item) => !keptIds.has(item.id));

  useEffect(() => {
    let active = true;
    void getTelemetryState<NmsState>(stateKey).then((entry) => {
      if (!active) return;
      if (Number.isFinite(entry?.state?.threshold)) setThreshold(Number(entry?.state?.threshold));
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

  function changeThreshold(next: number) {
    const nextKept = nonMaximumSuppression(detections, next);
    const nextReached = reached || nextKept.length === 2;
    setThreshold(next);
    setReached(nextReached);
    emitTelemetry('nms_threshold_change', null, {
      state_key: stateKey,
      threshold: next,
      kept_ids: nextKept.map((item) => item.id),
      reached: nextReached,
      state: { threshold: next, reached: nextReached },
    });
  }

  return (
    <ContentBlock
      className="odf-block odf-nms-block"
      title="一个目标被预测出三个框，最终应该留下几个？"
      subtitle="模型会产生大量相似预测。调节 NMS 阈值，把同一辆车的重复框压制掉，同时保留画面中真正不同的行人。"
    >
      <NoticeStrip tone="blue" lead="NMS 规则：">按置信度从高到低保留预测；与已保留同类框的 IoU 高于阈值时，较低分框被抑制。</NoticeStrip>
      <div className="odf-nms-layout">
        <div className="odf-nms-scene" role="img" aria-label={`当前保留 ${kept.length} 个预测框，抑制 ${suppressed.length} 个预测框`}>
          <span className="odf-nms-car" aria-hidden="true" />
          <span className="odf-nms-person" aria-hidden="true" />
          {detections.map((detection) => (
            <span
              className={`odf-box odf-prediction-box is-${detection.id.toLowerCase()} ${keptIds.has(detection.id) ? 'is-kept' : 'is-suppressed'}`}
              style={boxStyle(detection)}
              key={detection.id}
            >
              <b>{detection.id} · {detection.score.toFixed(2)}</b>
            </span>
          ))}
        </div>
        <div className="odf-nms-console">
          <RangeControl
            label="NMS IoU 阈值"
            min={0.3}
            max={0.9}
            step={0.05}
            value={threshold}
            digits={2}
            scale={['更严格', '常用区域', '更宽松']}
            hint={!reached}
            onChange={(event) => changeThreshold(Number(event.currentTarget.value))}
          />
          <div className="odf-nms-metrics">
            <ValueTile label="保留预测" value={kept.length} tone={kept.length === 2 ? 'success' : 'blue'} />
            <ValueTile label="被抑制" value={suppressed.length} tone="orange" />
          </div>
          <div className="odf-nms-ledger" aria-label="NMS 处理结果">
            {detections.map((detection) => (
              <div className={keptIds.has(detection.id) ? 'is-kept' : 'is-suppressed'} key={detection.id}>
                <span>{detection.id}</span>
                <strong>{detection.label} · {detection.score.toFixed(2)}</strong>
                <em>{keptIds.has(detection.id) ? '保留' : '抑制'}</em>
              </div>
            ))}
          </div>
          <Feedback
            status={kept.length === 2 ? 'correct' : 'hint'}
            message={kept.length === 2
              ? '现在只留下汽车 A 和行人 D：重复框被清理，不同目标仍然存在。'
              : '阈值过宽松时，高度重合的低分框仍会留下。尝试降低阈值，直到只剩两个目标。'}
          />
        </div>
      </div>
      <Question
        type="choice"
        title="为什么 NMS 会保留汽车框 A，而抑制同类的 B、C？"
        options={[
          { key: 'A', value: 'greedy-confidence', label: 'A 的置信度最高；B、C 与它高度重合且分数更低' },
          { key: 'B', value: 'smallest-area', label: 'A 的面积一定最小，所以优先保留', wrongFeedback: 'NMS 的第一排序依据是置信度，不是面积大小。' },
          { key: 'C', value: 'different-class', label: '因为 A、B、C 属于不同类别', wrongFeedback: '这三个框都预测为汽车；正因为同类且高度重合，才需要去重。' },
        ]}
        answer="greedy-confidence"
        feedback={{ correct: reached ? '正确。NMS 是基于置信度排序与 IoU 阈值的贪心去重。' : '原理判断正确；还需要在上方调出只保留两个目标的结果。' }}
        persistenceKey="detection-nms-reason-v1"
        onCheck={(result) => setQuestionCorrect(result.ok)}
      />
    </ContentBlock>
  );
}

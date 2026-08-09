import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Feedback, NoticeStrip, Question, emitTelemetry, getTelemetryState } from '../../shared/react';
import type { DetectionBox } from '../domain/boxGeometry';

type CandidateId = '' | 'loose' | 'clipped' | 'tight';

interface BoundingBoxRepresentationBlockProps {
  onComplete?: () => void;
}

interface BoundingBoxState {
  candidate?: CandidateId;
}

const stateKey = 'experiment:detection-bounding-box-v1';
const candidates: Array<{ id: Exclude<CandidateId, ''>; label: string; detail: string; box: DetectionBox }> = [
  { id: 'loose', label: 'A · 框住周围背景', detail: '(48, 29, 352, 221)', box: { x1: 12, y1: 12, x2: 88, y2: 92 } },
  { id: 'clipped', label: 'B · 只框住主体一部分', detail: '(132, 72, 280, 187)', box: { x1: 33, y1: 30, x2: 70, y2: 78 } },
  { id: 'tight', label: 'C · 紧贴目标外缘', detail: '(96, 58, 304, 192)', box: { x1: 24, y1: 24, x2: 76, y2: 80 } },
];

function boxStyle(box: DetectionBox) {
  return {
    left: `${box.x1}%`,
    top: `${box.y1}%`,
    width: `${box.x2 - box.x1}%`,
    height: `${box.y2 - box.y1}%`,
  };
}

export function BoundingBoxRepresentationBlock({ onComplete }: BoundingBoxRepresentationBlockProps) {
  const [candidate, setCandidate] = useState<CandidateId>('');
  const [conversionCorrect, setConversionCorrect] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const completedRef = useRef(false);
  const selected = candidates.find((item) => item.id === candidate);
  const candidateCorrect = candidate === 'tight';

  useEffect(() => {
    let active = true;
    void getTelemetryState<BoundingBoxState>(stateKey).then((entry) => {
      if (!active) return;
      const restored = entry?.state?.candidate;
      if (restored && candidates.some((item) => item.id === restored)) setCandidate(restored);
      setHydrated(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated || !candidateCorrect || !conversionCorrect || completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [candidateCorrect, conversionCorrect, hydrated, onComplete]);

  function chooseCandidate(next: Exclude<CandidateId, ''>) {
    setCandidate(next);
    emitTelemetry('bounding_box_candidate_select', null, {
      state_key: stateKey,
      candidate: next,
      correct: next === 'tight',
      state: { candidate: next },
    });
  }

  return (
    <ContentBlock
      className="odf-block odf-bounding-block"
      title="识别是什么还不够：目标到底在哪里？"
      subtitle="目标检测需要同时输出类别与位置。先为画面中的车辆选择一个能完整覆盖目标、又尽量少带背景的边界框。"
    >
      <NoticeStrip tone="blue" lead="坐标约定：">画面宽 400、高 240；原点位于左上角，x 向右增大，y 向下增大。</NoticeStrip>
      <div className="odf-bounding-layout">
        <div className="odf-detection-scene" role="img" aria-label="道路画面中央有一辆橙色汽车，当前候选边界框覆盖在汽车周围">
          <span className="odf-road-line" aria-hidden="true" />
          <span className="odf-car" aria-hidden="true"><i /><i /></span>
          {selected && <span className={`odf-box odf-box--candidate is-${selected.id}`} style={boxStyle(selected.box)}><b>{selected.id.toUpperCase()}</b></span>}
          <span className="odf-axis odf-axis--x" aria-hidden="true">x →</span>
          <span className="odf-axis odf-axis--y" aria-hidden="true">y ↓</span>
        </div>
        <div className="odf-box-picker" aria-label="候选边界框">
          <header>
            <span>候选框</span>
            <strong>哪个框最适合作为真实边界框？</strong>
          </header>
          {candidates.map((item) => (
            <Button key={item.id} active={candidate === item.id} onClick={() => chooseCandidate(item.id)}>
              <span className="odf-candidate-button-copy"><strong>{item.label}</strong><small>{item.detail}</small></span>
            </Button>
          ))}
          {candidate && (
            <Feedback
              status={candidateCorrect ? 'correct' : 'wrong'}
              message={candidateCorrect
                ? '这个框既覆盖完整车辆，也没有引入过多道路背景。它的两角表示是 (x₁, y₁, x₂, y₂)。'
                : candidate === 'loose'
                  ? '框太松会把大量背景也当成目标区域，位置监督不够精确。'
                  : '框太紧并不等于好框；裁掉目标的一部分会让位置标签失真。'}
            />
          )}
        </div>
      </div>
      <Question
        type="choice"
        title="候选框 C 的两角坐标是 (96, 58, 304, 192)。转换为 (中心 x, 中心 y, 宽, 高) 后是哪一组？"
        options={[
          { key: 'A', value: 'center-correct', label: '(200, 125, 208, 134)' },
          { key: 'B', value: 'corner-repeat', label: '(96, 58, 304, 192)', wrongFeedback: '这仍然是左上角与右下角坐标，没有完成表示转换。' },
          { key: 'C', value: 'wrong-size', label: '(200, 125, 304, 192)', wrongFeedback: '宽和高要用右下角减左上角，而不是直接使用右下角坐标。' },
        ]}
        answer="center-correct"
        feedback={{ correct: candidateCorrect ? '正确。中心取两端平均，宽高取对应坐标之差。' : '换算正确；还需要在上方选出真正紧贴目标的候选框。' }}
        persistenceKey="detection-box-conversion-v1"
        onCheck={(result) => setConversionCorrect(result.ok)}
      />
    </ContentBlock>
  );
}

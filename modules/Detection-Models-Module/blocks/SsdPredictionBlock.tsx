import { useEffect, useRef, useState } from 'react';
import { ContentBlock, Feedback, NoticeStrip, Question, RangeControl, ValueTile, emitTelemetry, getTelemetryState } from '../../shared/react';

interface SsdPredictionBlockProps {
  onComplete?: () => void;
}

interface SsdState {
  anchors?: number;
  classes?: number;
  reached?: boolean;
}

const stateKey = 'experiment:ssd-prediction-head-v1';

function FeatureLevel({ size, title, target }: { size: number; title: string; target: string }) {
  return (
    <article className="dmm-feature-level">
      <div className="dmm-feature-grid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }} aria-hidden="true">
        {Array.from({ length: size * size }, (_, index) => <span key={index} />)}
      </div>
      <div><strong>{title}</strong><span>{target}</span></div>
    </article>
  );
}

export function SsdPredictionBlock({ onComplete }: SsdPredictionBlockProps) {
  const [anchors, setAnchors] = useState(2);
  const [classes, setClasses] = useState(1);
  const [reached, setReached] = useState(false);
  const [questionCorrect, setQuestionCorrect] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const completedRef = useRef(false);
  const classChannels = anchors * (classes + 1);
  const boxChannels = anchors * 4;
  const configured = anchors === 4 && classes === 3;

  useEffect(() => {
    let active = true;
    void getTelemetryState<SsdState>(stateKey).then((entry) => {
      if (!active) return;
      if (Number.isFinite(entry?.state?.anchors)) setAnchors(Number(entry?.state?.anchors));
      if (Number.isFinite(entry?.state?.classes)) setClasses(Number(entry?.state?.classes));
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

  function update(nextAnchors: number, nextClasses: number) {
    const nextReached = reached || (nextAnchors === 4 && nextClasses === 3);
    setAnchors(nextAnchors);
    setClasses(nextClasses);
    setReached(nextReached);
    emitTelemetry('ssd_prediction_head_configure', null, {
      state_key: stateKey,
      anchors: nextAnchors,
      classes: nextClasses,
      class_channels: nextAnchors * (nextClasses + 1),
      box_channels: nextAnchors * 4,
      reached: nextReached,
      state: { anchors: nextAnchors, classes: nextClasses, reached: nextReached },
    });
  }

  return (
    <ContentBlock
      className="dmm-block dmm-ssd-block"
      title="SSD 不逐个裁剪候选区，而是在多张特征图上同时预测"
      subtitle="把检测任务设为 3 个目标类别、每个位置 4 个锚框，配置预测头并观察类别与边界框通道数。"
    >
      <NoticeStrip tone="blue" lead="每个锚框两份输出：">q+1 个类别分数（额外的 1 是背景）和 4 个边界框偏移量。</NoticeStrip>
      <div className="dmm-ssd-layout">
        <div className="dmm-feature-pyramid" aria-label="SSD 的三层多尺度特征图">
          <FeatureLevel size={6} title="高分辨率特征" target="密集位置 · 小目标" />
          <FeatureLevel size={3} title="中分辨率特征" target="平衡位置 · 中目标" />
          <FeatureLevel size={1} title="低分辨率特征" target="大感受野 · 大目标" />
          <div className="dmm-merge-output"><strong>拼接全部尺度预测</strong><span>置信度过滤 → NMS → 最终框</span></div>
        </div>
        <div className="dmm-ssd-console">
          <RangeControl
            label="每个位置的锚框数 a"
            min={1}
            max={6}
            step={1}
            value={anchors}
            scale={['1', '3', '6']}
            hint={!reached}
            onChange={(event) => update(Number(event.currentTarget.value), classes)}
          />
          <RangeControl
            label="目标类别数 q"
            min={1}
            max={5}
            step={1}
            value={classes}
            scale={['1', '3', '5']}
            hint={!reached}
            onChange={(event) => update(anchors, Number(event.currentTarget.value))}
          />
          <div className="dmm-ssd-metrics">
            <ValueTile label="分类头通道 a(q+1)" value={classChannels} tone={configured ? 'success' : 'blue'} />
            <ValueTile label="边框头通道 4a" value={boxChannels} tone={configured ? 'success' : 'orange'} />
          </div>
          <Feedback
            status={configured ? 'correct' : 'hint'}
            message={configured
              ? '配置正确：4 个锚框 × 4 个类别（含背景）= 16 个分类通道；偏移头同样是 16 个通道。'
              : '目标配置是 a = 4、q = 3。两个预测头共享同一空间网格，但输出语义不同。'}
          />
        </div>
      </div>
      <Question
        type="choice"
        title="SSD 为什么使用保持高宽的卷积层输出预测，而不是把特征图展平后接一个巨大全连接层？"
        options={[
          { key: 'A', value: 'spatial-share', label: '卷积保持位置一一对应并共享参数，能在每个特征点预测其锚框' },
          { key: 'B', value: 'remove-background', label: '因为卷积层会自动删除背景类别', wrongFeedback: '背景仍是分类头中的一个显式类别，卷积不会自动删除它。' },
          { key: 'C', value: 'single-anchor', label: '因为卷积层限制每个位置只能生成一个锚框', wrongFeedback: '输出通道可以同时容纳多个锚框的类别和偏移预测。' },
        ]}
        answer="spatial-share"
        feedback={{ correct: reached ? '正确。卷积头保留空间坐标、控制参数量，并能把不同尺度的预测统一拼接。' : '原理判断正确；再把上方预测头配置到 a = 4、q = 3。' }}
        persistenceKey="ssd-convolutional-head-v1"
        onCheck={(result) => setQuestionCorrect(result.ok)}
      />
    </ContentBlock>
  );
}

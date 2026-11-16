import { useRef, useState } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import { RNNMemory3DEvolution } from './RNNMemory3DEvolution';
import './RNNMemoryEvolutionPage.css';

export interface RNNMemoryEvolutionPageProps {
  onComplete: () => void;
}

const phases = [
  { label: '识别一个输入', caption: '网络读入此刻的输入：昨天的天气，和记忆里上一步做的那道菜。' },
  { label: '沿时间复制', caption: '同一个网络单元在 t₁、t₂、t₃ 重复使用，每一步都读一次此刻的输入。' },
  { label: '传递隐状态', caption: 'h₁ → h₂ → h₃：前一天做的那道菜被带进隐状态，天气决定这一步输出哪道菜。' },
  { label: '合并为 2D', caption: '复杂网络收拢成三行 x → h → o 的展开表示。' },
  { label: '旋转为经典 RNN', caption: '同一组单元旋转 90°，变成经典的 o → h → x 结构。' },
] as const;

export function RNNMemoryEvolutionPage({ onComplete }: RNNMemoryEvolutionPageProps) {
  const [phase, setPhase] = useState(0);
  const completedRef = useRef(false);

  const setNextPhase = (index: number) => {
    if (index > phase + 1) return;
    setPhase(index);
    if (index === phases.length - 1 && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  return (
    <ContentBlock shuku-edit-id="e-7dd354da-269f-4843-bab2-cc479925a42b"
      headingLevel={1}
      className="nrnn-memory-evolution"
      title="RNN 如何获得记忆？"
      subtitle="不是换了一张更大的网络，而是让同一个网络沿时间重复工作，并把隐状态交给下一步。"
    >
      <div shuku-edit-id="e-50b45f38-c3ed-4de4-92a6-7c9acebde406" className="nrnn-memory-evolution__layout">
        <section shuku-edit-id="e-56012c1c-acc9-4d3e-a4e3-0764d53de313" className="nrnn-memory-evolution__stage" aria-label="从神经网络到 RNN 的三维演进">
          <RNNMemory3DEvolution phase={phase} />
          <div shuku-edit-id="e-2428e1f8-42c3-48ee-9d02-9d72db84ea02" className="nrnn-memory-evolution__stage-note">
            <Typography shuku-edit-id="e-caf23704-9602-44eb-a8e7-dc6b175b8b5a" as="span" variant="bodySmall" tone="muted">拖拽旋转 · 滚轮缩放</Typography>
            <Typography shuku-edit-id="e-7f890c40-64ed-4848-9bcb-ff61a838222d" as="span" variant="bodySmall" tone="accent">{phases[phase].caption}</Typography>
          </div>
        </section>

        <section shuku-edit-id="e-57fe3877-6b23-404d-a471-b6824a42f4c6" className="nrnn-memory-evolution__controls" aria-label="RNN 演进步骤">
          <div shuku-edit-id="e-a89ad35e-7ae1-441f-a064-56daba803034" className="nrnn-memory-evolution__controls-head">
            <Typography shuku-edit-id="e-91247dd2-0337-4259-859d-47b44982381c" as="span" variant="bodySmall" tone="warning">从第 10 页到第 12 页</Typography>
            <Typography shuku-edit-id="e-4015dedf-b2b4-482e-b0d5-d41fd5992c1d" as="span" variant="bodySmall" tone="muted">点击步骤，观看网络如何获得可传递的状态。</Typography>
          </div>
          <div shuku-edit-id="e-508a0da0-f79d-48d5-b203-e513981f774f" className="nrnn-memory-evolution__phase-list" role="list">
            {phases.map((item, index) => (
              <Button
                key={item.label}
                className={`nrnn-memory-evolution__phase${index < phase ? ' is-done' : ''}`}
                active={index === phase}
                disabled={index > phase + 1}
                hint={index === phase + 1}
                onClick={() => setNextPhase(index)}
              >
                <Typography shuku-edit-id="e-689f9d63-3a12-4f38-80a6-834c7807e0ee" as="span" variant="bodySmall" tone="inherit">{`0${index + 1}`}</Typography>
                <Typography shuku-edit-id="e-5c181719-4647-4809-9496-55c291ec9475" as="span" variant="body" tone="inherit">{item.label}</Typography>
              </Button>
            ))}
          </div>
        </section>
      </div>
    </ContentBlock>
  );
}

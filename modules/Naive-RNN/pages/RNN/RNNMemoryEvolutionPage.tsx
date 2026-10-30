import { useRef, useState } from 'react';
import { Button, ContentBlock, Typography } from '../../../shared/react';
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
    <ContentBlock
      headingLevel={1}
      className="nrnn-memory-evolution"
      title="RNN 如何获得记忆？"
      subtitle="不是换了一张更大的网络，而是让同一个网络沿时间重复工作，并把隐状态交给下一步。"
    >
      <div className="nrnn-memory-evolution__layout">
        <section className="nrnn-memory-evolution__stage" aria-label="从神经网络到 RNN 的三维演进">
          <RNNMemory3DEvolution phase={phase} />
          <div className="nrnn-memory-evolution__stage-note">
            <Typography as="span" variant="bodySmall" tone="muted">拖拽旋转 · 滚轮缩放</Typography>
            <Typography as="span" variant="bodySmall" tone="accent">{phases[phase].caption}</Typography>
          </div>
        </section>

        <section className="nrnn-memory-evolution__controls" aria-label="RNN 演进步骤">
          <div className="nrnn-memory-evolution__controls-head">
            <Typography as="span" variant="bodySmall" tone="warning">从第 10 页到第 12 页</Typography>
            <Typography as="span" variant="bodySmall" tone="muted">点击步骤，观看网络如何获得可传递的状态。</Typography>
          </div>
          <div className="nrnn-memory-evolution__phase-list" role="list">
            {phases.map((item, index) => (
              <Button
                key={item.label}
                className={`nrnn-memory-evolution__phase${index < phase ? ' is-done' : ''}`}
                active={index === phase}
                disabled={index > phase + 1}
                hint={index === phase + 1}
                onClick={() => setNextPhase(index)}
              >
                <Typography as="span" variant="bodySmall" tone="inherit">{`0${index + 1}`}</Typography>
                <Typography as="span" variant="body" tone="inherit">{item.label}</Typography>
              </Button>
            ))}
          </div>
        </section>
      </div>
    </ContentBlock>
  );
}

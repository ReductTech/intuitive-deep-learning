import { useEffect, useMemo, useRef, useState } from 'react';
import { ContentBlock, Feedback, NoticeStrip, Question, RangeControl, ValueTile, emitTelemetry, getTelemetryState } from '../../shared/react';

interface StyleLossMixerBlockProps { onComplete?: () => void; }
interface MixerState { content?: number; style?: number; smooth?: number; balanced?: boolean; }
const stateKey = 'experiment:style-loss-mixer-v1';

export function StyleLossMixerBlock({ onComplete }: StyleLossMixerBlockProps) {
  const [content, setContent] = useState(70);
  const [style, setStyle] = useState(20);
  const [smooth, setSmooth] = useState(5);
  const [questionCorrect, setQuestionCorrect] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const completedRef = useRef(false);
  const balanced = content >= 45 && content <= 75 && style >= 45 && style <= 75 && smooth >= 10 && smooth <= 35;
  const total = Math.max(1, content + style + smooth);
  const shares = useMemo(() => ({ content: Math.round(content / total * 100), style: Math.round(style / total * 100), smooth: Math.round(smooth / total * 100) }), [content, smooth, style, total]);

  useEffect(() => {
    let active = true;
    void getTelemetryState<MixerState>(stateKey).then((entry) => {
      if (!active) return;
      if (typeof entry?.state?.content === 'number') setContent(entry.state.content);
      if (typeof entry?.state?.style === 'number') setStyle(entry.state.style);
      if (typeof entry?.state?.smooth === 'number') setSmooth(entry.state.smooth);
      setHydrated(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated || !balanced || !questionCorrect || completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [balanced, hydrated, onComplete, questionCorrect]);

  function update(kind: 'content' | 'style' | 'smooth', value: number) {
    const next = { content, style, smooth, [kind]: value };
    setContent(next.content); setStyle(next.style); setSmooth(next.smooth);
    const nextBalanced = next.content >= 45 && next.content <= 75 && next.style >= 45 && next.style <= 75 && next.smooth >= 10 && next.smooth <= 35;
    emitTelemetry('style_loss_weight_change', null, { state_key: stateKey, changed: kind, balanced: nextBalanced, state: { ...next, balanced: nextBalanced } });
  }

  return (
    <ContentBlock className="vsc-block vsc-loss-block" title="风格迁移不是套滤镜，而是在三个目标之间寻找平衡" subtitle="调节内容、风格和全变分损失的权重，观察生成图像分别会丢掉什么。">
      <NoticeStrip tone="blue" lead="优化对象变了：">网络参数保持不动，直接更新合成图像的像素，让总损失逐步下降。</NoticeStrip>
      <div className="vsc-mixer-layout">
        <div className="vsc-style-canvas" style={{ '--vsc-content': content / 100, '--vsc-style': style / 100, '--vsc-smooth': smooth / 100 } as React.CSSProperties} role="img" aria-label="由三种损失权重共同控制的风格化山景预览">
          <span className="vsc-sun" /><span className="vsc-mountain vsc-mountain--back" /><span className="vsc-mountain vsc-mountain--front" /><span className="vsc-river" /><span className="vsc-texture" />
          <b>{balanced ? '结构、纹理与平滑度达到可用平衡' : content > style * 1.8 ? '结构清楚，但风格很弱' : style > content * 1.8 ? '纹理强烈，内容轮廓开始漂移' : smooth < 10 ? '细节丰富，但相邻像素有噪点' : '继续微调三个目标'}</b>
        </div>
        <div className="vsc-mixer-controls">
          <RangeControl label="内容损失权重" min="0" max="100" value={content} suffix="%" hint onChange={(event) => update('content', Number(event.currentTarget.value))} />
          <RangeControl label="风格损失权重" min="0" max="100" value={style} suffix="%" onChange={(event) => update('style', Number(event.currentTarget.value))} />
          <RangeControl label="全变分损失权重" min="0" max="60" value={smooth} suffix="%" onChange={(event) => update('smooth', Number(event.currentTarget.value))} />
          <div className="vsc-share-grid"><ValueTile label="内容占比" value={`${shares.content}%`} tone="blue" /><ValueTile label="风格占比" value={`${shares.style}%`} tone="orange" /><ValueTile label="平滑占比" value={`${shares.smooth}%`} tone="success" /></div>
          <Feedback status={balanced ? 'correct' : 'hint'} message={balanced ? '配方已进入平衡区间：内容与风格都足够强，并保留适量平滑约束。' : '目标：内容和风格各调到 45–75%，全变分调到 10–35%。'} />
        </div>
      </div>
      <Question type="choice" title="全变分损失在风格迁移中主要解决什么问题？" options={[{ value: 'smooth', label: '抑制相邻像素的剧烈变化，让结果更平滑自然' }, { value: 'classify', label: '决定图像属于哪个分类类别', wrongFeedback: '风格迁移不是分类任务，不需要类别标签。' }, { value: 'copy', label: '逐像素复制风格图的内容结构', wrongFeedback: '风格图提供纹理统计，而不是要复制其空间结构。' }]} answer="smooth" persistenceKey="style-total-variation-v1" feedback={{ correct: balanced ? '正确。三个条件都已完成。' : '正确。现在把上方三个权重调入平衡区间。' }} onCheck={(result) => setQuestionCorrect(result.ok)} />
    </ContentBlock>
  );
}

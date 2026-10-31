// @refresh reset
import { useState } from 'react';
import { Button, ContentBlock, Typography } from '../../../shared/react';
import { ParameterRange } from '../../components/ParameterRange/ParameterRange';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
import './FreezeFineTunePage.css';

export const FINE_TUNE_MODES = [
  { name: '冻结骨干', from: 5, who: '只训练新分类头', benefit: '复用已有表示，训练开销较小', cost: '骨干无法针对新任务调整' },
  { name: '部分微调', from: 4, who: 'Stage 4 ＋ 新分类头', benefit: '调整后段表示，同时保留前层经验', cost: '需要选择解冻范围' },
  { name: '全部微调', from: 0, who: 'Stem、Stage 1—4 ＋ 新分类头', benefit: '更多层可以适应新任务', cost: '开销更大，小数据时更需防过拟合' },
] as const;
export interface FreezeFineTunePageProps { onComplete?: () => void; }
export function FreezeFineTunePage({ onComplete }: FreezeFineTunePageProps) {
  const [mode, setMode] = useState(0), [seen, setSeen] = useState<number[]>([0]);
  const complete = seen.length === 3;
  useCompleteOnce(complete, onComplete);
  function choose(index: number) {
    if (!Number.isInteger(index) || index < 0 || index > 2) return;
    setMode(index); setSeen(previous => previous.includes(index) ? previous : [...previous, index]);
  }
  return <ContentBlock headingLevel={1} className="rtg-freeze" title="哪些参数正在学习？" subtitle="冻结骨干 · 部分微调 · 全部微调"
    data-mode={mode} data-seen={seen.join(',')} data-complete={complete}
    onKeyDown={event => { if ((event.key === 'Enter' || event.key === ' ') && (event.target as Element).closest('button')) {
      event.stopPropagation(); if (event.repeat) event.preventDefault();
    } }}>
    <div className="rtg-freeze__toolbar"><nav aria-label="比较三种参数更新范围">{FINE_TUNE_MODES.map((item, index) =>
      <Button key={item.name} data-mode-choice={index} variant={mode === index ? 'primary' : 'default'} aria-pressed={mode === index} onClick={() => choose(index)}>{item.name}</Button>)}</nav>
      </div>
    <section className="rtg-freeze__lab" aria-label="每组层的冻结或可训练状态">
      <ParameterRange trainableFrom={FINE_TUNE_MODES[mode].from} />
      <div className="rtg-freeze__who" role="status" aria-live="polite"><Typography variant="h3" tone="accent" align="center">{'谁在学：' + FINE_TUNE_MODES[mode].who}</Typography></div>
      <div className="rtg-freeze__tradeoff" role="status" aria-live="polite">
        <Typography variant="body" tone="accent" align="center" data-benefit>{'能获得什么：' + FINE_TUNE_MODES[mode].benefit}</Typography>
        <Typography variant="body" tone="warning" align="center" data-cost>{'主要代价：' + FINE_TUNE_MODES[mode].cost}</Typography>
      </div>
    </section>
    <footer className="rtg-freeze__footer"><Typography variant="bodySmall" tone="muted">冻结层仍参与前向计算，只是不更新参数。</Typography>
      <Button data-reset onClick={() => { setMode(0); setSeen([0]); }}>重新比较</Button></footer>
  </ContentBlock>;
}

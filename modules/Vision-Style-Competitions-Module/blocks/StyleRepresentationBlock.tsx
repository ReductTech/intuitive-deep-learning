import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Feedback, NoticeStrip, Question, emitTelemetry, getTelemetryState } from '../../shared/react';

type View = 'content' | 'style' | 'gram';
interface StyleRepresentationBlockProps { onComplete?: () => void; }
interface RepresentationState { view?: View; visitedGram?: boolean; }
const stateKey = 'experiment:style-feature-representation-v1';
const views: Record<View, { title: string; copy: string }> = {
  content: { title: '内容特征图', copy: '较深层特征保留物体布局和高层结构，用来约束“画的是什么、放在哪里”。' },
  style: { title: '多层风格特征', copy: '浅层偏颜色与边缘，深层偏更大尺度纹理；组合多层可描述更完整的风格。' },
  gram: { title: 'Gram 相关矩阵', copy: '对通道两两做内积，记录哪些纹理特征经常共同出现，不要求它们出现在固定位置。' },
};

export function StyleRepresentationBlock({ onComplete }: StyleRepresentationBlockProps) {
  const [view, setView] = useState<View>('content');
  const [visitedGram, setVisitedGram] = useState(false);
  const [questionCorrect, setQuestionCorrect] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const completedRef = useRef(false);
  useEffect(() => { let active = true; void getTelemetryState<RepresentationState>(stateKey).then((entry) => { if (!active) return; if (entry?.state?.view) setView(entry.state.view); if (entry?.state?.visitedGram) setVisitedGram(true); setHydrated(true); }); return () => { active = false; }; }, []);
  useEffect(() => { if (hydrated && visitedGram && questionCorrect && !completedRef.current) { completedRef.current = true; onComplete?.(); } }, [hydrated, onComplete, questionCorrect, visitedGram]);
  function inspect(next: View) { const seen = visitedGram || next === 'gram'; setView(next); setVisitedGram(seen); emitTelemetry('style_representation_inspect', null, { state_key: stateKey, view: next, visited_gram: seen, state: { view: next, visitedGram: seen } }); }
  return (
    <ContentBlock className="vsc-block vsc-representation-block" title="内容看空间布局，风格看通道之间的相关性" subtitle="沿着内容特征、风格特征和 Gram 矩阵走一遍，理解同一个卷积网络为何能提供两类约束。">
      <NoticeStrip tone="blue" lead="关键差别：">内容损失比较特征图本身；风格损失比较特征通道之间的统计关系。</NoticeStrip>
      <div className="vsc-view-tabs" aria-label="特征表示"><Button active={view === 'content'} onClick={() => inspect('content')}>内容特征</Button><Button active={view === 'style'} onClick={() => inspect('style')}>多层风格</Button><Button active={view === 'gram'} hint={!visitedGram} onClick={() => inspect('gram')}>Gram 矩阵</Button></div>
      <div className="vsc-feature-layout">
        <div className={`vsc-feature-visual is-${view}`} aria-label={views[view].title}>
          {view !== 'gram' ? Array.from({ length: 6 }, (_, index) => <i key={index} style={{ '--vsc-cell': index } as React.CSSProperties} />) : <div className="vsc-gram-grid">{[.95, .28, .62, .28, .82, .41, .62, .41, .9].map((value, index) => <span key={index} style={{ opacity: value }} />)}</div>}
        </div>
        <div className="vsc-feature-copy"><span>{view === 'gram' ? 'C × C' : 'C × H × W'}</span><h3>{views[view].title}</h3><p>{views[view].copy}</p><Feedback status={visitedGram ? 'correct' : 'hint'} message={visitedGram ? '你已经把空间特征压缩为通道相关统计。' : '打开 Gram 矩阵，观察空间维度为什么消失。'} /></div>
      </div>
      <Question type="choice" title="为什么 Gram 矩阵适合表示图像风格？" options={[{ value: 'correlation', label: '它保留特征通道的共现关系，却弱化纹理出现的精确位置' }, { value: 'pixels', label: '它完整保存每个像素的原始坐标', wrongFeedback: 'Gram 矩阵聚合了空间位置，恰好不会完整保存坐标。' }, { value: 'labels', label: '它把每个通道直接转换成分类标签', wrongFeedback: '通道相关性描述纹理统计，不是分类标签。' }]} answer="correlation" persistenceKey="style-gram-matrix-v1" feedback={{ correct: visitedGram ? '正确。你已经看过矩阵并理解了它的统计含义。' : '正确。再打开上方 Gram 矩阵完成观察。' }} onCheck={(result) => setQuestionCorrect(result.ok)} />
    </ContentBlock>
  );
}

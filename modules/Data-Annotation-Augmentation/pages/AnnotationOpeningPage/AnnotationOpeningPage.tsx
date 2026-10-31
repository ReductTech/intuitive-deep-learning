import { useState } from 'react';
import { Button, Question, Typography } from '../../../shared/react';
import './AnnotationOpeningPage.css';
import outline from '../../outlines.json';
import { photoUrl } from '../../data';

type Label = '苹果' | '梨';
const samples: { id: string; label: Label; file: string; variety: string; description: string }[] = [
  { id: '01', label: '苹果', file: '01-fuji-apple.png', variety: '富士苹果', description: '红黄条纹、顶部凹陷的圆形水果，AI 生成' },
  { id: '02', label: '梨', file: '02-bartlett-pear.png', variety: '巴特利特梨', description: '黄色带斑点、上窄下宽的水果，AI 生成' },
  { id: '03', label: '苹果', file: '03-granny-smith-apple.png', variety: '青苹果', description: '青绿色、顶部凹陷的圆形水果，AI 生成' },
  { id: '04', label: '梨', file: '04-bosc-pear.png', variety: '博斯克梨', description: '棕褐色粗糙果皮、细长颈部的水果，AI 生成' },
  { id: '05', label: '苹果', file: '05-golden-delicious-apple.png', variety: '金冠苹果', description: '金黄色、顶部凹陷的圆形水果，AI 生成' },
  { id: '06', label: '梨', file: '06-asian-pear.png', variety: '亚洲梨', description: '黄褐色、带细小斑点的扁圆形水果，AI 生成' },
];

function FruitPhoto({ sample }: { sample: typeof samples[number] }) {
  return <img src={photoUrl(sample.file)} alt={sample.description} width={1536} height={1024} decoding="async" />;
}

export function AnnotationOpeningPage() {
  const [intro, setIntro] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [judgment, setJudgment] = useState<boolean | null>(null);
  const [labels, setLabels] = useState<Record<string, Label>>({});
  const [checked, setChecked] = useState(false);
  const [focusId, setFocusId] = useState('01');
  const assigned = Object.keys(labels).length;
  const mistakes = samples.filter(sample => labels[sample.id] !== sample.label);
  const complete = checked && mistakes.length === 0;
  const focused = samples.find(sample => sample.id === focusId)!;

  const choose = (id: string, label: Label) => {
    setLabels(previous => ({ ...previous, [id]: label }));
    setFocusId(id);
    setChecked(false);
  };

  return <article className={`daa-opening${intro ? ' daa-opening-intro daa-opening-sack-scene' : ''}`} aria-label={outline.pages[0].title}>
    <img className="daa-station-background" src={photoUrl(intro ? '14-two-sorters-sacks.png' : '13-opening-fruit-station.png')} alt="" aria-hidden="true" />
    <header className="daa-station-header">
      <div><Typography variant="bodySmall" tone="accent">水果分拣站 · {intro ? '今日验收' : '标注工作台'}</Typography>
        <Typography as="h1" variant="h1" tone="accent">{intro ? '同一批水果，为什么分法不一样？' : '给这批水果写上答案'}</Typography></div>

    </header>
    {intro && <div className="daa-sack-labels" aria-label="左边按苹果和梨分袋；右边按圆形和长形分袋，圆形袋中也有圆梨。">
      {['苹果', '梨', '圆', '长'].map((label, i) => <div className={`daa-sack-label daa-sack-label-${i}`} key={label}><Typography variant="h3" tone="accent">{label}</Typography></div>)}
    </div>}
    {intro && <div className="daa-round-pear-focus" aria-label="重点：圆梨分别位于左边的梨袋与右边的圆袋">
      <svg viewBox="0 0 1600 900" aria-hidden="true"><g fill="none" stroke="white" strokeWidth="7"><ellipse cx="408" cy="547" rx="31" ry="28"/><ellipse cx="610" cy="547" rx="33" ry="30"/></g><g fill="none" stroke="var(--ui-accent)" strokeWidth="3"><ellipse cx="408" cy="547" rx="31" ry="28"/><ellipse cx="610" cy="547" rx="33" ry="30"/><path d="M408 501 V516 M610 501 V514"/></g></svg>
      <div className="daa-round-pear-caption daa-round-pear-caption-left"><Typography variant="bodySmall" tone="accent">圆梨</Typography></div>
      <div className="daa-round-pear-caption daa-round-pear-caption-right"><Typography variant="bodySmall" tone="accent">圆梨</Typography></div>
    </div>}
    <div className="daa-workspace">
      {intro ? <div className="daa-scene-space" /> : <div className="daa-samples" aria-label="六张待标注的水果图片">
        {samples.map(sample => {
          const wrong = !intro && checked && labels[sample.id] !== sample.label;
          return <article className={`daa-sample${labels[sample.id] ? ' is-labelled' : ''}${wrong ? ' is-wrong' : ''}${complete ? ' is-verified' : ''}`} key={sample.id} aria-label={`图片 ${sample.id}`}>
            <div className="daa-image">
              <Typography as="span" variant="bodySmall" tone="light" className="daa-image-index">{sample.id}</Typography>
              <FruitPhoto sample={sample} />
            </div>
            <div className="daa-label-options" role="group" aria-label={`图片 ${sample.id} 的类别`}>
              {(['苹果', '梨'] as const).map(label => <Button
                key={label}
                active={labels[sample.id] === label}
                aria-pressed={labels[sample.id] === label}
                aria-label={`将图片 ${sample.id} 标为${label}`}
                onClick={() => choose(sample.id, label)}
              ><Typography as="span" variant="bodySmall" tone="inherit">{label}</Typography></Button>)}
            </div>
          </article>;
        })}
      </div>}
      {intro ? <aside className="daa-task daa-intro-task">
        <Question className="daa-opening-question" typeLabel="你的判断" title="这两个人，谁分错了？" answer="unknown" instant showFeedback={false} options={[{value:'a',label:'左边分错了'},{value:'b',label:'右边分错了'},{value:'unknown',label:'现在还不能判断'}]} onCheck={result => { setRevealed(true); setJudgment(result.ok); }} />
        {judgment !== null && <Typography variant="bodySmall" tone={judgment ? 'success' : 'danger'} role="status">{judgment ? '✓ 判断正确：先明确任务。' : '✕ 先别判错：还要看任务。'}</Typography>}
        <Button variant="primary" disabled={!revealed} onClick={() => setIntro(false)}><Typography as="span" variant="bodySmall" tone="inherit">现在请你按种类标注</Typography></Button>
      </aside> : <aside className="daa-task">
        <div className="daa-task-intro">
          <Typography variant="bodySmall" tone="warning">你的任务</Typography>
          <Typography variant="h2" tone="accent">把答案<br />写进数据</Typography>
        </div>
        <div className="daa-task-action">
          <Typography variant="bodySmall" tone={complete ? 'success' : 'muted'} aria-live="polite">
            {complete ? '全部标注完成' : `已标注 ${assigned} / 6 张`}
          </Typography>
          <Button variant="primary" disabled={assigned !== 6} onClick={() => setChecked(true)}>
            <Typography as="span" variant="body" tone="inherit">{complete ? '再次检查' : '检查标注'}</Typography>
          </Button>
          <Button onClick={() => { setLabels({}); setChecked(false); setFocusId('01'); }}>
            <Typography as="span" variant="bodySmall" tone="inherit">重新标注</Typography>
          </Button>
          <Typography variant="bodySmall" tone="muted">AI 生成图片 · 可改选</Typography>
        </div>
      </aside>}
    </div>
    <div className={`daa-learning-result${complete ? ' is-complete' : ''}`} aria-live="polite">
      {intro ? <>
        <Typography variant="h3" tone="accent">{revealed ? '左边按种类，右边按形状：两种分法都可以对。' : '同一批水果，被装进了不同的麻袋。'}</Typography>
        <Typography variant="bodySmall" tone="muted">{revealed ? '左边分苹果和梨，右边分圆形和长形。标签要表达什么，先由任务决定。' : '你觉得谁分错了？先做出判断，再看看他们接到的任务。'}</Typography>
      </> : complete ? <>
        <div className="daa-pair">
          <div className="daa-mini-image"><FruitPhoto sample={focused} /></div>
          <Typography as="span" variant="body" tone="muted">图片 {focused.id}</Typography>
          <Typography as="span" variant="h3" tone="light" aria-hidden="true">＋</Typography>
          <Typography as="span" variant="body" tone="accent" className="daa-result-label">{labels[focusId]}</Typography>
          <Typography as="span" variant="h3" tone="light" aria-hidden="true">→</Typography>
          <Typography as="span" variant="body" tone="accent">一个训练样本</Typography>
        </div>
        <Typography variant="bodySmall" tone="success">你刚刚完成了数据标注：为输入指定学习目标。</Typography>
      </> : <>
        <Typography variant="h3" tone={checked ? 'warning' : 'accent'}>
          {checked ? `再看图片 ${mistakes.map(sample => sample.id).join('、')}` : '我们能认出水果，但训练数据还缺少答案。'}
        </Typography>
        <Typography variant="body" tone="muted">
          {checked ? mistakes.some(sample => sample.id === '06') ? '06 是圆形的亚洲梨；颜色和形状都不能单独决定类别。' : '结合果皮、果柄与轮廓判断，修改标签后再检查。' : '点选图片下方的类别，把你的判断变成模型可以学习的标签。'}
        </Typography>
      </>}
    </div>
  </article>;
}

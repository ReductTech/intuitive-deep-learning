import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, NoticeStrip, Typography } from '../../../shared/react';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
import { buildBlockConnections, type BlockConnections } from './connections';
import './BasicBlockPage.css';

const labels = ['学习修改量', '保留原输入', '两路相加', '激活与输出'];
const descriptions = [
  '先点橙色残差分支，观察需要学习的修改量。',
  '下一步：点下方快捷路径，保留同一个输入。',
  '下一步：点圆形加号，让两条路径逐元素相加。',
  '下一步：点 ReLU，观察激活后的块输出。',
  '已完成四步；仍可点击图中节点回看。',
];
const reviews = [
  '橙色高亮处可以点击，先观察上方残差分支。',
  '上路学习相对输入的修改量；本例的修正为负。',
  '下路原样传递同一输入，不经过上方卷积层。',
  '同一位置的输入与修正相加，结果可以为负。',
  '最后经过 ReLU：负数归零，得到块输出。',
];
const results = ['x=2', 'F(x)=-3', 'x=2', 'H=2+(-3)=-1', 'y=\\max(0,-1)=0'];
function Formula({ latex, label }: { latex: string; label: string }) {
  return <MathFormulaBlock className="rtg-basic-block__value" appearance="plain" ariaLabel={label}>
    <MathFormulaStatic latex={latex} />
  </MathFormulaBlock>;
}
function ClickCue({ label = '点击' }: { label?: string }) {
  return <span className="rtg-basic-block__click-cue" aria-hidden="true">
    <svg viewBox="0 0 28 30"><path d="M10 15V5a2 2 0 0 1 4 0v8l2-2 3 1 3 1 2 3v7l-4 5H12l-6-9a2 2 0 0 1 3-2l3 3M3 4l2 2M19 3l-2 2M4 11H1" /></svg>
    <Typography as="span" variant="bodySmall" tone="inherit">{label}</Typography>
  </span>;
}
export interface BasicBlockPageProps { onComplete?: () => void; }
export function BasicBlockPage({ onComplete }: BasicBlockPageProps) {
  const [{ stage, active }, setProgress] = useState({ stage: 0, active: 0 });
  const root = useRef<HTMLElement>(null), previousStage = useRef(0);
  const diagram = useRef<HTMLDivElement>(null);
  const [connections, setConnections] = useState<BlockConnections | null>(null);
  const complete = stage === 4, next = complete ? 0 : stage + 1;
  useCompleteOnce(complete, onComplete);
  useEffect(() => {
    const container = diagram.current;
    if (!container) return;
    const selectors = { input: 'input', branch: 'branch', shortcut: 'shortcut', sum: 'sum-circle', relu: 'relu', output: 'output' } as const;
    const targets = Object.entries(selectors).map(([key, part]) => [key, container.querySelector<HTMLElement>('.rtg-basic-block__' + part)] as const);
    if (targets.some(([, element]) => !element)) return;
    let observing = true;
    const measure = () => {
      if (!observing) return;
      const bounds = container.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      // SceneDeck scales the whole 1600 × 900 canvas. Convert all ports together.
      const scaleX = container.clientWidth / bounds.width, scaleY = container.clientHeight / bounds.height;
      const nodes = Object.fromEntries(targets.map(([key, element]) => {
        const box = element!.getBoundingClientRect();
        return [key, { left: (box.left - bounds.left) * scaleX, right: (box.right - bounds.left) * scaleX, top: (box.top - bounds.top) * scaleY, bottom: (box.bottom - bounds.top) * scaleY }];
      })) as Parameters<typeof buildBlockConnections>[2];
      const updated = buildBlockConnections(container.clientWidth, container.clientHeight, nodes);
      setConnections(previous => JSON.stringify(previous) === JSON.stringify(updated) ? previous : updated);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return () => { observing = false; };
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    targets.forEach(([, element]) => observer.observe(element!));
    return () => { observing = false; observer.disconnect(); };
  }, [stage]);
  useEffect(() => {
    if (previousStage.current === stage) return;
    previousStage.current = stage;
    root.current?.querySelector<HTMLElement>(stage < 4 ? '[data-block-node="' + (stage + 1) + '"]' : '[data-checkpoint]')?.focus({ preventScroll: true });
  }, [stage]);
  function inspect(value: number) {
    setProgress(previous => {
      if (!Number.isInteger(value) || value < 1 || value > 4 || value > previous.stage + 1) return previous;
      return previous.active === value && previous.stage >= value ? previous : { stage: Math.max(previous.stage, value), active: value };
    });
  }
  function restart() { setProgress({ stage: 0, active: 0 }); }
  function nodeClass(part: string, value: number) {
    return 'rtg-basic-block__' + part + (stage >= value ? ' is-on' : '') + (active === value ? ' is-current' : '') + (next === value ? ' is-next' : '');
  }
  return <ContentBlock ref={root} headingLevel={1} className="rtg-basic-block"
    data-stage={stage} data-active={active} data-next={next} data-complete={complete}
    title="一个残差块的两条路线：残差分支与快捷路径" subtitle="让同一个输入分路、相加，再经过激活；直接点击图中的节点观察。"
    onKeyDown={event => {
      if ((event.key === ' ' || event.key === 'Enter') && (event.target as Element).closest('button')) {
        event.stopPropagation(); if (event.repeat) event.preventDefault();
      }
    }}>
    <div className="rtg-basic-block__surface">
      <div className="rtg-basic-block__toolbar">
        <ol aria-label="残差块的四步观察">{labels.map((label, index) => <li key={label}
          aria-current={(active || next) === index + 1 ? 'step' : undefined}
          className={(active || next) === index + 1 ? 'is-current' : stage > index ? 'is-seen' : ''}>
          <Typography as="span" variant="bodySmall" tone="inherit">0{index + 1} · {label}</Typography>
        </li>)}</ol>
        <Button className="rtg-basic-block__reset" data-reset onClick={restart}>↶ 重新演示</Button>
      </div>
      <section className="rtg-basic-block__workbench" aria-label="点击橙色标记的下一节点推进，或回看已完成节点">
        <div ref={diagram} className="rtg-basic-block__diagram">
          {connections && <svg className="rtg-basic-block__connections" viewBox={`0 0 ${connections.width} ${connections.height}`} preserveAspectRatio="none" aria-hidden="true">
            {connections.routes.map(connection => {
              const reached = stage >= ({ input: 1, residual: 1, shortcut: 2, sum: 3, output: 4 }[connection.state]);
              return <g key={connection.id} data-connection={connection.id} className={reached ? 'is-' + connection.state : undefined}>
                <path d={connection.line} />{connection.arrow && <path d={connection.arrow} />}
              </g>;
            })}
            <circle className={stage >= 1 ? 'is-input' : undefined} cx={connections.fork.x} cy={connections.fork.y} r="3" />
          </svg>}
          <article className="rtg-basic-block__input"><Typography variant="bodySmall" tone="accent">同一输入</Typography><Formula latex="x=2" label="输入x等于2" /></article>
          <Button key={'branch-' + (next === 1)} data-block-node={1} hint={next === 1} className={nodeClass('branch', 1)}
            aria-pressed={active === 1} onClick={() => inspect(1)} aria-label="残差分支：点击学习修改量，或回看这一阶段">
            <span className="rtg-basic-block__node-head"><Typography as="span" variant="bodySmall" tone="inherit">残差分支</Typography>
              {next === 1 && <ClickCue />}<Formula latex={stage >= 1 ? 'F(x)=-3' : 'F(x)'} label={stage >= 1 ? '残差分支输出负3' : '待观察的修改量F(x)'} /></span>
            <span className="rtg-basic-block__layers">{['3×3 Conv', 'BN', 'ReLU', '3×3 Conv', 'BN'].map((label, index) => <Typography key={index} as="span" variant="bodySmall" tone="inherit">{label}</Typography>)}</span>
          </Button>
          <Button key={'shortcut-' + (next === 2)} data-block-node={2} hint={next === 2} disabled={stage < 1} className={nodeClass('shortcut', 2)}
            aria-pressed={active === 2} onClick={() => inspect(2)} aria-label="快捷路径：点击保留输入，或回看这一阶段">
            <Typography as="span" variant="bodySmall" tone="inherit">快捷路径 · 原样保留</Typography>{next === 2 && <ClickCue />}<Formula latex="x=2" label="快捷路径原样传递x等于2" />
          </Button>
          <Button key={'merge-' + (next === 3)} data-block-node={3} hint={next === 3} disabled={stage < 2} className={nodeClass('merge', 3)}
            aria-pressed={active === 3} onClick={() => inspect(3)} aria-label="相加节点：逐元素相加两条路径">
            <span className="rtg-basic-block__sum-circle"><Typography as="span" variant="h2" tone="inherit">+</Typography></span>
            <span className="rtg-basic-block__merge-label">{next === 3 ? <ClickCue label="点击相加" /> : <Typography as="span" variant="bodySmall" tone="inherit">逐元素相加</Typography>}</span>
          </Button>
          <Button key={'relu-' + (next === 4)} data-block-node={4} hint={next === 4} disabled={stage < 3} className={nodeClass('relu', 4)}
            aria-pressed={active === 4} onClick={() => inspect(4)} aria-label="ReLU：点击形成激活后输出">
            <Typography as="span" variant="body" tone="inherit">ReLU</Typography>{next === 4 ? <ClickCue label="点击激活" /> : <Typography as="span" variant="bodySmall" tone="inherit">负值归零</Typography>}
          </Button>
          <article className={'rtg-basic-block__output' + (complete ? ' is-on' : '')}><Typography variant="bodySmall" tone="accent">块输出</Typography><Formula latex={complete ? 'y=0' : 'y=?'} label={complete ? '激活后的块输出为0' : '块输出尚未形成'} /></article>
        </div>
        <div className="rtg-basic-block__formula">
          <Formula latex={stage >= 3 ? 'H=2+(-3)=-1' : 'H=x+F(x)'} label={stage >= 3 ? '相加结果为负1' : '先将输入与修改量相加'} />
          <Formula latex={complete ? 'y=\\operatorname{ReLU}(-1)=0' : 'y=\\operatorname{ReLU}(H)'} label={complete ? '负1经过ReLU得到0' : '再经过ReLU形成输出'} />
        </div>
      </section>
      <section className="rtg-basic-block__checkpoint" data-checkpoint data-description-step={active} tabIndex={-1} role="status" aria-live="polite" aria-atomic="true">
        <div className="rtg-basic-block__step-number"><Typography variant="h3" tone="inherit" align="center">{active ? '0' + active : '起点'}</Typography></div>
        <div key={'description-' + active} className="rtg-basic-block__step-copy">
          <Typography as="h2" variant="h3" tone="inherit">{active ? labels[active - 1] : '从残差分支开始'}</Typography>
          <Typography variant="bodySmall" tone="inherit">{reviews[active]}</Typography>
        </div>
        <Formula latex={results[active]} label={'当前观察结果：' + results[active]} />
      </section>
      <NoticeStrip tone={complete ? 'green' : 'orange'} role="status">{active < stage ? '正在回看已完成节点。' + descriptions[stage] : descriptions[stage]}</NoticeStrip>
    </div>
  </ContentBlock>;
}

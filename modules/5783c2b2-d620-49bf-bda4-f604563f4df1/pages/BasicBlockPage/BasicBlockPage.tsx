import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, NoticeStrip, Typography } from "@shuku/course-style/react";
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
  return <span shuku-edit-id="e-027c30bb-807d-4dd6-a379-1cff91ec2e12" className="rtg-basic-block__click-cue" aria-hidden="true">
    <svg shuku-edit-id="e-6c71af60-5689-42bd-b885-3ec49ffbdb03" viewBox="0 0 28 30"><path shuku-edit-id="e-c43d605f-b262-4065-982d-e04341140184" d="M10 15V5a2 2 0 0 1 4 0v8l2-2 3 1 3 1 2 3v7l-4 5H12l-6-9a2 2 0 0 1 3-2l3 3M3 4l2 2M19 3l-2 2M4 11H1" /></svg>
    <Typography shuku-edit-id="e-2f1d3a5d-f40d-4f96-9bd0-6cc77c8d65f7" as="span" variant="bodySmall" tone="inherit">{label}</Typography>
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
  return <ContentBlock shuku-edit-id="e-7bfc9b4d-ebc8-4079-87bc-40167fe8c37a" ref={root} headingLevel={1} className="rtg-basic-block"
    data-stage={stage} data-active={active} data-next={next} data-complete={complete}
    title="一个残差块的两条路线：残差分支与快捷路径" subtitle="让同一个输入分路、相加，再经过激活；直接点击图中的节点观察。"
    onKeyDown={event => {
      if ((event.key === ' ' || event.key === 'Enter') && (event.target as Element).closest('button')) {
        event.stopPropagation(); if (event.repeat) event.preventDefault();
      }
    }}>
    <div shuku-edit-id="e-acde4393-40f3-431f-a3f9-3d82605850a2" className="rtg-basic-block__surface">
      <div shuku-edit-id="e-7ad7448a-5ba0-44c2-af54-7d0b1cf51919" className="rtg-basic-block__toolbar">
        <ol shuku-edit-id="e-eeab596d-049b-4407-a006-580b3cc78bf6" aria-label="残差块的四步观察">{labels.map((label, index) => <li shuku-edit-id="e-9203a8e7-f3f6-4ba8-a597-e3609ed113d0" key={label}
          aria-current={(active || next) === index + 1 ? 'step' : undefined}
          className={(active || next) === index + 1 ? 'is-current' : stage > index ? 'is-seen' : ''}>
          <Typography shuku-edit-id="e-078125c8-23aa-405e-8750-497f2e2cb9d3" as="span" variant="bodySmall" tone="inherit">0{index + 1} · {label}</Typography>
        </li>)}</ol>
        <Button className="rtg-basic-block__reset" data-reset onClick={restart}>↶ 重新演示</Button>
      </div>
      <section shuku-edit-id="e-f2ec20cd-3d3d-47ac-ba38-13eca2e99bad" className="rtg-basic-block__workbench" aria-label="点击橙色标记的下一节点推进，或回看已完成节点">
        <div shuku-edit-id="e-90b066c2-1d77-4f48-adce-97c550802ef3" ref={diagram} className="rtg-basic-block__diagram">
          {connections && <svg shuku-edit-id="e-5ad8780e-7757-4a13-8c2c-c4cadf56ef6a" className="rtg-basic-block__connections" viewBox={`0 0 ${connections.width} ${connections.height}`} preserveAspectRatio="none" aria-hidden="true">
            {connections.routes.map(connection => {
              const reached = stage >= ({ input: 1, residual: 1, shortcut: 2, sum: 3, output: 4 }[connection.state]);
              return <g shuku-edit-id="e-33ab1f2c-5562-4050-8e3a-ac7c2a0cd3ab" key={connection.id} data-connection={connection.id} className={reached ? 'is-' + connection.state : undefined}>
                <path shuku-edit-id="e-9cfd9510-4d56-43fb-a037-ce053b1fdf2c" d={connection.line} />{connection.arrow && <path shuku-edit-id="e-5a30e6c2-3820-4344-a49c-99e691c9c3f1" d={connection.arrow} />}
              </g>;
            })}
            <circle shuku-edit-id="e-b719ad72-f770-4548-92c7-0adc13585bdf" className={stage >= 1 ? 'is-input' : undefined} cx={connections.fork.x} cy={connections.fork.y} r="3" />
          </svg>}
          <article shuku-edit-id="e-ce4b450d-9cc8-40e5-85df-dfe70ee345c7" className="rtg-basic-block__input"><Typography shuku-edit-id="e-6e251548-badd-4342-b192-94d8d07d2d4e" variant="bodySmall" tone="accent">同一输入</Typography><Formula latex="x=2" label="输入x等于2" /></article>
          <Button key={'branch-' + (next === 1)} data-block-node={1} hint={next === 1} className={nodeClass('branch', 1)}
            aria-pressed={active === 1} onClick={() => inspect(1)} aria-label="残差分支：点击学习修改量，或回看这一阶段">
            <span shuku-edit-id="e-5c4989a3-0270-40eb-999b-9d35d15dab34" className="rtg-basic-block__node-head"><Typography shuku-edit-id="e-d6190659-149c-48b8-a968-f48e4147d740" as="span" variant="bodySmall" tone="inherit">残差分支</Typography>
              {next === 1 && <ClickCue />}<Formula latex={stage >= 1 ? 'F(x)=-3' : 'F(x)'} label={stage >= 1 ? '残差分支输出负3' : '待观察的修改量F(x)'} /></span>
            <span shuku-edit-id="e-3b41f629-f7f8-478d-98f0-d56616e670a6" className="rtg-basic-block__layers">{['3×3 Conv', 'BN', 'ReLU', '3×3 Conv', 'BN'].map((label, index) => <Typography shuku-edit-id="e-307a2835-e49b-47d6-a3af-4cc8b5a85789" key={index} as="span" variant="bodySmall" tone="inherit">{label}</Typography>)}</span>
          </Button>
          <Button key={'shortcut-' + (next === 2)} data-block-node={2} hint={next === 2} disabled={stage < 1} className={nodeClass('shortcut', 2)}
            aria-pressed={active === 2} onClick={() => inspect(2)} aria-label="快捷路径：点击保留输入，或回看这一阶段">
            <Typography shuku-edit-id="e-2ec61543-64a0-4db0-83ad-64b360ada275" as="span" variant="bodySmall" tone="inherit">快捷路径 · 原样保留</Typography>{next === 2 && <ClickCue />}<Formula latex="x=2" label="快捷路径原样传递x等于2" />
          </Button>
          <Button key={'merge-' + (next === 3)} data-block-node={3} hint={next === 3} disabled={stage < 2} className={nodeClass('merge', 3)}
            aria-pressed={active === 3} onClick={() => inspect(3)} aria-label="相加节点：逐元素相加两条路径">
            <span shuku-edit-id="e-940c99bd-b0e5-4a7e-a0d9-378129c2bd83" className="rtg-basic-block__sum-circle"><Typography shuku-edit-id="e-49663640-332c-4bac-be11-53517cff6c1e" as="span" variant="h2" tone="inherit">+</Typography></span>
            <span shuku-edit-id="e-ba722fab-24e4-467f-909c-0e3ca84caff2" className="rtg-basic-block__merge-label">{next === 3 ? <ClickCue label="点击相加" /> : <Typography shuku-edit-id="e-4af79b0e-1613-4106-b278-7474f500a9e5" as="span" variant="bodySmall" tone="inherit">逐元素相加</Typography>}</span>
          </Button>
          <Button key={'relu-' + (next === 4)} data-block-node={4} hint={next === 4} disabled={stage < 3} className={nodeClass('relu', 4)}
            aria-pressed={active === 4} onClick={() => inspect(4)} aria-label="ReLU：点击形成激活后输出">
            <Typography shuku-edit-id="e-95380349-40b0-4e3d-93e6-b26271e4d6ac" as="span" variant="body" tone="inherit">ReLU</Typography>{next === 4 ? <ClickCue label="点击激活" /> : <Typography shuku-edit-id="e-723dda7d-3abe-4415-a814-41d299559b89" as="span" variant="bodySmall" tone="inherit">负值归零</Typography>}
          </Button>
          <article shuku-edit-id="e-cc047d6b-9546-4ec2-b184-da810b2ec686" className={'rtg-basic-block__output' + (complete ? ' is-on' : '')}><Typography shuku-edit-id="e-209b9c7d-781e-443e-9c83-3b3912805eeb" variant="bodySmall" tone="accent">块输出</Typography><Formula latex={complete ? 'y=0' : 'y=?'} label={complete ? '激活后的块输出为0' : '块输出尚未形成'} /></article>
        </div>
        <div shuku-edit-id="e-46447b3a-64ef-46b5-9767-22a89078f097" className="rtg-basic-block__formula">
          <Formula latex={stage >= 3 ? 'H=2+(-3)=-1' : 'H=x+F(x)'} label={stage >= 3 ? '相加结果为负1' : '先将输入与修改量相加'} />
          <Formula latex={complete ? 'y=\\operatorname{ReLU}(-1)=0' : 'y=\\operatorname{ReLU}(H)'} label={complete ? '负1经过ReLU得到0' : '再经过ReLU形成输出'} />
        </div>
      </section>
      <section shuku-edit-id="e-3a8f8229-f890-4274-a6dc-3016c6bf2bf8" className="rtg-basic-block__checkpoint" data-checkpoint data-description-step={active} tabIndex={-1} role="status" aria-live="polite" aria-atomic="true">
        <div shuku-edit-id="e-02cda000-7133-45e6-9ae8-98f7b45e029d" className="rtg-basic-block__step-number"><Typography shuku-edit-id="e-29a85951-7fe8-4874-9ea6-94a25ea6d1c0" variant="h3" tone="inherit" align="center">{active ? '0' + active : '起点'}</Typography></div>
        <div shuku-edit-id="e-2113de65-91b2-442e-bc5a-3a73a4ab4625" key={'description-' + active} className="rtg-basic-block__step-copy">
          <Typography shuku-edit-id="e-a2cfa5ee-fb03-404b-8b2a-7216589ce2b2" as="h2" variant="h3" tone="inherit">{active ? labels[active - 1] : '从残差分支开始'}</Typography>
          <Typography shuku-edit-id="e-66d32ab5-af64-4f77-919f-7782745d9e61" variant="bodySmall" tone="inherit">{reviews[active]}</Typography>
        </div>
        <Formula latex={results[active]} label={'当前观察结果：' + results[active]} />
      </section>
      <NoticeStrip tone={complete ? 'green' : 'orange'} role="status">{active < stage ? '正在回看已完成节点。' + descriptions[stage] : descriptions[stage]}</NoticeStrip>
    </div>
  </ContentBlock>;
}

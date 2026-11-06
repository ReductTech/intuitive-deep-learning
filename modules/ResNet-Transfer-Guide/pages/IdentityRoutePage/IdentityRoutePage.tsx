import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
// @refresh reset
import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
const bottle = moduleAssetUrl(moduleIdentity.id, "recycling/camera-views/bottle-front.png");
import { canVerify, constructedOutput, initialConstruction, originalRoute, transitionConstruction,
  type ConstructionAction, type LayerIndex } from './identityConstruction';
import './IdentityRoutePage.css';

const c = (name: string) => 'rtg-identity-route__' + name;
function Arrow() {
  return <svg className={c('arrow')} viewBox="0 0 48 22" aria-hidden="true"><path d="M2 11H44M35 3L44 11L35 19" fill="none" /></svg>;
}
function Layers({ added = false, head = false }: { added?: boolean; head?: boolean }) {
  return <svg className={c('layers') + (added ? ' is-added' : '') + (head ? ' is-head' : '')} viewBox="0 0 160 88" aria-hidden="true">
    {(added ? [0] : head ? [0, 1] : [0, 1, 2, 3]).map(index => <g key={index} transform={'translate(' + (added ? 53 : head ? 38 + index * 35 : 8 + index * 35) + ',0)'}>
      <path d="M3 20L14 11H34L23 20Z" fill="currentColor" opacity=".3" />
      <path d="M3 20L14 11V67L3 76Z" fill="currentColor" opacity=".6" />
      <path d="M3 20H23V76H3Z" fill="currentColor" opacity=".16" />
      <path d="M3 20H23V76H3ZM23 20L34 11V67L23 76" fill="none" stroke="currentColor" strokeWidth="1.6" />
      {[34, 48, 62].map(y => <path key={y} d={'M8 ' + y + 'H18'} stroke="currentColor" opacity=".5" />)}
    </g>)}
  </svg>;
}
function Photo() {
  const [failed, setFailed] = useState(false);
  return <div className={c('photo')}>{failed ? <Button onClick={() => setFailed(false)}>重试图片</Button>
    : <img src={bottle} width={632} height={821} alt="同一张塑料瓶输入照片" onError={() => setFailed(true)} />}</div>;
}
function Output({ values, verified, pending }: { values: readonly number[]; verified: boolean; pending: boolean }) {
  const scale = Math.max(...originalRoute().output);
  return <div className={c('output') + (verified ? ' is-equal' : '')}>
    {pending ? <Typography variant="h3" tone="muted">?</Typography> : <svg viewBox="0 0 110 78" role="img" aria-label="示意输出向量，非分类概率">
      {values.map((value, index) => <rect key={index} x={4} y={8 + index * 24} width={90 * value / scale} height={12} rx={3} fill="currentColor" />)}
    </svg>}
  </div>;
}
function Numbers({ label, values }: { label: string; values: readonly number[] }) {
  return <div className={c('numbers')}><Typography variant="bodySmall" tone="muted">{label}</Typography>
    <MathFormulaBlock appearance="plain" ariaLabel={label + '：' + values.join('、')}>
      <MathFormulaStatic latex={'[' + values.join(',\\,') + ']'} />
    </MathFormulaBlock></div>;
}
export function IdentityRoutePage({ onComplete }: { onComplete?: () => void }) {
  const [state, setState] = useState(initialConstruction);
  const root = useRef<HTMLElement>(null);
  const copied = state.parameters !== null;
  const count = state.identities.filter(Boolean).length;
  const ready = count === 3, verified = state.verified && canVerify(state);
  const complete = verified && state.optimizationSeen;
  const original = originalRoute(), output = constructedOutput(state);
  const selectedValues = original.features[2];
  useCompleteOnce(complete, onComplete);
  useEffect(() => {
    if (state.conclusion) root.current?.querySelector<HTMLElement>('[data-reasoning-heading]')?.focus({ preventScroll: true });
    else if (verified) root.current?.querySelector<HTMLElement>('[data-verified-summary]')?.focus({ preventScroll: true });
  }, [state.conclusion, verified]);
  function act(action: ConstructionAction) { setState(previous => transitionConstruction(previous, action)); }
  const step = state.conclusion ? 3 : !copied ? 0 : !ready ? 1 : 2;
  function network(upper: boolean) {
    return <div className={c('route') + (upper ? ' is-original' : ' is-constructed')} aria-label={upper ? '原有网络' : '在原有特征提取层末尾追加三层恒等映射'}>
      <div className={c('original-layers') + (!upper && !copied ? ' is-pending' : '')}>
        <Typography variant="bodySmall" tone="accent">{upper ? '原有特征提取层' : '原有层 · 参数不变'}</Typography>
        <Layers />
      </div><Arrow />
      {upper ? <div className={c('no-addition')}><div /><Typography variant="bodySmall" tone="muted">不加新层，直接传递</Typography></div>
        : <div className={c('appended')} aria-label="集中在原有层后面的三层恒等映射">{([0, 1, 2] as LayerIndex[]).map(index =>
          <Button key={index + (copied && count === index ? '-ready' : '-set')} className={c('identity') + (state.selected === index && state.identities[index] ? ' is-selected' : '')}
            variant={state.identities[index] ? 'default' : 'warn'} disabled={!copied || state.identities.slice(0, index).some(value => !value)}
            hint={copied && count === index} aria-pressed={state.identities[index]}
            aria-label={(state.identities[index] ? '查看' : '追加') + '第' + (index + 1) + '层恒等映射'}
            onClick={() => act({ type: 'identity', index })}>
            <Typography as="span" variant="bodySmall" tone="inherit">{(state.identities[index] ? '恒等层 ' : '＋ 新增层 ') + (index + 1)}</Typography>
            <Layers added />
          </Button>)}</div>}
      <Arrow /><div className={c('head') + (!upper && !copied ? ' is-pending' : '')}>
        <Typography variant="bodySmall" tone="accent">原分类头</Typography><Layers head />
      </div><Arrow />
      <div className={c('result')}><Output values={upper ? original.output : output ?? []} verified={verified} pending={!upper && !output} />
        <Typography variant="bodySmall" tone={verified ? 'success' : 'accent'}>{upper ? '原输出' : verified ? '✓ 输出一致' : ready ? '待验证' : '待构造'}</Typography>
      </div>
    </div>;
  }
  return <ContentBlock ref={root} headingLevel={1} className="rtg-identity-route" title="多加几层，也能保留原结果吗？"
    subtitle="保留原有层，在它们后面追加恒等映射；原分类头保持不变。"
    data-copied={copied} data-verified={verified} data-conclusion={state.conclusion} data-optimization-seen={state.optimizationSeen} data-complete={complete} data-count={count}
    onKeyDown={event => { if ((event.key === 'Enter' || event.key === ' ') && (event.target as Element).closest('button')) {
      event.stopPropagation(); if (event.repeat) event.preventDefault();
    } }}>
    <div className={c('steps')}><ol aria-label="构造与推理步骤">{['保留原有参数', '追加恒等层', '验证相同输出', '理解优化困难'].map((label, index) =>
      <li key={label} className={step === index ? 'is-current' : ''} aria-current={step === index ? 'step' : undefined}>
        <Typography variant="bodySmall" tone={step === index ? 'accent' : 'muted'}>{(index + 1) + ' · ' + label}</Typography>
      </li>)}</ol>
      {copied && count > 0 && <Button onClick={() => act({ type: 'undo' })}>撤销本层及后续</Button>}
      <Button onClick={() => act({ type: 'reset' })}>重新开始</Button>
    </div>
    <section className={c('scene') + (state.conclusion ? ' is-explaining' : '')} aria-label={state.conclusion ? '好解存在与优化困难的关系' : '原有网络与末尾追加恒等层后的网络对照'}>
      {state.conclusion ? <>
        <Typography as="h2" variant="h1" tone="accent" tabIndex={-1} data-reasoning-heading>好解存在，不等于训练能找到</Typography>
        <div className={c('reasoning-columns')}>
          <section className={c('proof')} aria-label="手工构造证明好解存在">
            <Typography as="h3" variant="body" tone="success">① 手工构造</Typography>
            <div className={c('witness')}><Numbers label="进入新增层" values={selectedValues} /><Arrow /><Numbers label="离开新增层" values={selectedValues} /></div>
            <Typography variant="bodySmall" tone="success">✓ 恒等层保留原输出。</Typography>
          </section>
          <section className={c('search')} aria-label="实际训练仍需要寻找合适参数">
            <Typography as="h3" variant="body" tone="accent">② 训练寻找</Typography>
            <div className={c('training-loop')}>
              <div><Typography variant="bodySmall" tone="accent" align="center">当前参数</Typography></div><Arrow />
              <div><Typography variant="bodySmall" tone="accent" align="center">计算损失</Typography></div><Arrow />
              <div><Typography variant="bodySmall" tone="accent" align="center">梯度更新</Typography></div>
            </div>
            <Typography variant="bodySmall" tone="muted">从初始化出发，按梯度反复更新。</Typography>
          </section>
        </div>
        <div className={c('optimization-evidence')} role="status">
          <Typography as="h3" variant="h2" tone="accent">优化困难，难在寻找参数。</Typography>
          <Typography variant="body" tone="muted">证据：更深普通网络的训练误差反而更高。</Typography>
        </div>
        <div className={c('review')}><Button onClick={() => act({ type: 'review' })}>返回恒等验证</Button></div>
      </> : <>
      <div className={c('comparison')}>
        <div className={c('source')}><Typography variant="bodySmall" tone="accent">同一张照片</Typography><Photo /></div>
        <svg className={c('fork')} viewBox="0 0 40 300" preserveAspectRatio="none" aria-hidden="true"><path d="M1 150H16V65H38M16 150V235H38M32 59L38 65L32 71M32 229L38 235L32 241" /></svg>
        <div className={c('routes')}>{network(true)}
        <div className={c('copy-row')}>
          <div className={c('copy-guide') + (copied ? ' is-copied' : '')} aria-hidden="true" />
          <div className={c('copy-control')}>{copied
            ? <Typography variant="bodySmall" tone="muted">原有层与分类头的参数全部保留</Typography>
            : <Button variant="primary" hint onClick={() => act({ type: 'copy' })}>保留原有网络 ↓</Button>}</div>
        </div>{network(false)}</div>
      </div>
      <div className={c('detail')} aria-live="polite">
        {count > 0 ? <><Numbers label="进入新增层的表示" values={selectedValues} /><Arrow />
            <div className={c('identity-label')}><Typography variant="bodySmall" tone="warning">{'第 ' + (state.selected + 1) + ' 层 · 恒等映射'}</Typography>
              <Typography variant="bodySmall" tone="muted">不改变表示</Typography></div><Arrow />
            <Numbers label="离开新增层的表示" values={selectedValues} /></>
            : <Typography className={c('detail-prompt')} variant="bodySmall" tone="muted">{copied
              ? '只在原有特征提取层后追加：先点击第一个橙色对象。' : '先保留原有网络，再在它的特征提取层末尾加层。'}</Typography>}
      </div>
      <div className={c('finding') + (verified ? ' is-equal' : '')} role="status" data-verified-summary={verified ? true : undefined} tabIndex={verified ? -1 : undefined}>
        <Typography variant="bodySmall" tone={verified ? 'success' : 'accent'}>{verified
          ? '✓ 表示不变，原分类头的输出一致。'
          : ready ? '新增层已全部接上，比较两条路径的输出。' : copied ? '蓝色为原有结构；橙色为末尾追加的层。' : '同一张照片，同一组原有参数。'}</Typography>
        {ready && !verified && <Button variant="primary" hint onClick={() => act({ type: 'verify' })}>验证输出一致</Button>}
        {verified && <Button variant="primary" data-show-reasoning hint={!state.optimizationSeen} onClick={() => act({ type: 'conclusion' })}>有这样的解，为什么还没训练好？ →</Button>}
      </div>
      </>}
    </section>
  </ContentBlock>;
}

import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
// @refresh reset
import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
const bottle = moduleAssetUrl("recycling/camera-views/bottle-front.jpg");
import { canVerify, constructedOutput, initialConstruction, originalRoute, transitionConstruction,
  type ConstructionAction, type LayerIndex } from './identityConstruction';
import './IdentityRoutePage.css';

const c = (name: string) => 'rtg-identity-route__' + name;
function Arrow() {
  return <svg shuku-edit-id="e-0f1c31b2-61bd-47c5-941b-b739abcff64b" className={c('arrow')} viewBox="0 0 48 22" aria-hidden="true"><path shuku-edit-id="e-3d65dfea-6e7c-4d17-9417-7152734883a6" d="M2 11H44M35 3L44 11L35 19" fill="none" /></svg>;
}
function Layers({ added = false, head = false }: { added?: boolean; head?: boolean }) {
  return <svg shuku-edit-id="e-594e87c0-9a7e-4202-8da5-01b21266dfe7" className={c('layers') + (added ? ' is-added' : '') + (head ? ' is-head' : '')} viewBox="0 0 160 88" aria-hidden="true">
    {(added ? [0] : head ? [0, 1] : [0, 1, 2, 3]).map(index => <g shuku-edit-id="e-7ea5dfab-6a85-4584-a57b-ee2811c48b51" key={index} transform={'translate(' + (added ? 53 : head ? 38 + index * 35 : 8 + index * 35) + ',0)'}>
      <path shuku-edit-id="e-e8a0bb1d-078a-40a4-80e2-36206858a2b4" d="M3 20L14 11H34L23 20Z" fill="currentColor" opacity=".3" />
      <path shuku-edit-id="e-33f14413-33c8-4ed1-be90-7ad0c6e58191" d="M3 20L14 11V67L3 76Z" fill="currentColor" opacity=".6" />
      <path shuku-edit-id="e-9a39707b-2e9d-4bff-8f7b-bd1dcb7c0e22" d="M3 20H23V76H3Z" fill="currentColor" opacity=".16" />
      <path shuku-edit-id="e-f71136e8-cc84-4fc9-9081-cdc206dff570" d="M3 20H23V76H3ZM23 20L34 11V67L23 76" fill="none" stroke="currentColor" strokeWidth="1.6" />
      {[34, 48, 62].map(y => <path shuku-edit-id="e-de9e6d02-e775-4ec0-8ebb-d90a7b0c931d" key={y} d={'M8 ' + y + 'H18'} stroke="currentColor" opacity=".5" />)}
    </g>)}
  </svg>;
}
function Photo() {
  const [failed, setFailed] = useState(false);
  return <div shuku-edit-id="e-4b1ff76e-7c18-4bf9-9745-23eddcc9d6d4" className={c('photo')}>{failed ? <Button onClick={() => setFailed(false)}>重试图片</Button>
    : <img shuku-edit-id="e-4bd3be05-6d54-4a5a-bf1c-763103436b01" src={bottle} width={632} height={821} alt="同一张塑料瓶输入照片" onError={() => setFailed(true)} />}</div>;
}
function Output({ values, verified, pending }: { values: readonly number[]; verified: boolean; pending: boolean }) {
  const scale = Math.max(...originalRoute().output);
  return <div shuku-edit-id="e-c1cb3d4f-627c-4e59-908c-a4c04e31c9cb" className={c('output') + (verified ? ' is-equal' : '')}>
    {pending ? <Typography shuku-edit-id="e-ccb586df-d674-4b16-a0e2-5569958d3952" variant="h3" tone="muted">?</Typography> : <svg shuku-edit-id="e-34892352-0000-454a-8372-42ab84fea64a" viewBox="0 0 110 78" role="img" aria-label="示意输出向量，非分类概率">
      {values.map((value, index) => <rect shuku-edit-id="e-8937d9df-b657-466c-a7dc-c99df017a146" key={index} x={4} y={8 + index * 24} width={90 * value / scale} height={12} rx={3} fill="currentColor" />)}
    </svg>}
  </div>;
}
function Numbers({ label, values }: { label: string; values: readonly number[] }) {
  return <div shuku-edit-id="e-87637c77-9e97-4fdc-bb17-6bdb28b983fe" className={c('numbers')}><Typography shuku-edit-id="e-23feba33-07fd-4407-b49a-3bcedffcdb85" variant="bodySmall" tone="muted">{label}</Typography>
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
    return <div shuku-edit-id="e-57d694ac-9bd6-4ac2-a3ce-3fece1097969" className={c('route') + (upper ? ' is-original' : ' is-constructed')} aria-label={upper ? '原有网络' : '在原有特征提取层末尾追加三层恒等映射'}>
      <div shuku-edit-id="e-4e6ee207-c945-46f1-93d8-e8102c959d6e" className={c('original-layers') + (!upper && !copied ? ' is-pending' : '')}>
        <Typography shuku-edit-id="e-49b48e59-28ec-467e-8dcc-63068bbcc7cb" variant="bodySmall" tone="accent">{upper ? '原有特征提取层' : '原有层 · 参数不变'}</Typography>
        <Layers />
      </div><Arrow />
      {upper ? <div shuku-edit-id="e-f42b0c00-d5a0-4d6d-9475-0742bb8afc39" className={c('no-addition')}><div shuku-edit-id="e-72690c37-78d3-488b-a86b-809d47563b10" /><Typography shuku-edit-id="e-48524f47-890f-4e8d-89de-76c3e0efbc93" variant="bodySmall" tone="muted">不加新层，直接传递</Typography></div>
        : <div shuku-edit-id="e-2f41a8d4-144e-4471-af1e-dc10fe3de1f2" className={c('appended')} aria-label="集中在原有层后面的三层恒等映射">{([0, 1, 2] as LayerIndex[]).map(index =>
          <Button key={index + (copied && count === index ? '-ready' : '-set')} className={c('identity') + (state.selected === index && state.identities[index] ? ' is-selected' : '')}
            variant={state.identities[index] ? 'default' : 'warn'} disabled={!copied || state.identities.slice(0, index).some(value => !value)}
            hint={copied && count === index} aria-pressed={state.identities[index]}
            aria-label={(state.identities[index] ? '查看' : '追加') + '第' + (index + 1) + '层恒等映射'}
            onClick={() => act({ type: 'identity', index })}>
            <Typography shuku-edit-id="e-3f15f1fc-24cf-44b6-98ce-bac5160a0af8" as="span" variant="bodySmall" tone="inherit">{(state.identities[index] ? '恒等层 ' : '＋ 新增层 ') + (index + 1)}</Typography>
            <Layers added />
          </Button>)}</div>}
      <Arrow /><div shuku-edit-id="e-43e151a3-d7d1-4e93-a6c1-8b2203872995" className={c('head') + (!upper && !copied ? ' is-pending' : '')}>
        <Typography shuku-edit-id="e-c0790421-fe73-4557-b502-1f9d46217537" variant="bodySmall" tone="accent">原分类头</Typography><Layers head />
      </div><Arrow />
      <div shuku-edit-id="e-7aac15a1-6f46-4d1c-82e9-95a692ad5c7d" className={c('result')}><Output values={upper ? original.output : output ?? []} verified={verified} pending={!upper && !output} />
        <Typography shuku-edit-id="e-5bfa67a3-1ef8-4c1c-b3c5-8caa607138ae" variant="bodySmall" tone={verified ? 'success' : 'accent'}>{upper ? '原输出' : verified ? '✓ 输出一致' : ready ? '待验证' : '待构造'}</Typography>
      </div>
    </div>;
  }
  return <ContentBlock shuku-edit-id="e-68eecda2-0938-4bce-be2f-77f9df0c17c7" ref={root} headingLevel={1} className="rtg-identity-route" title="多加几层，也能保留原结果吗？"
    subtitle="保留原有层，在它们后面追加恒等映射；原分类头保持不变。"
    data-copied={copied} data-verified={verified} data-conclusion={state.conclusion} data-optimization-seen={state.optimizationSeen} data-complete={complete} data-count={count}
    onKeyDown={event => { if ((event.key === 'Enter' || event.key === ' ') && (event.target as Element).closest('button')) {
      event.stopPropagation(); if (event.repeat) event.preventDefault();
    } }}>
    <div shuku-edit-id="e-b0ec5535-d611-4fc6-8213-88a4a5d18b06" className={c('steps')}><ol shuku-edit-id="e-05dade59-cd16-49ae-90f1-f4fd6078c24f" aria-label="构造与推理步骤">{['保留原有参数', '追加恒等层', '验证相同输出', '理解优化困难'].map((label, index) =>
      <li shuku-edit-id="e-51fb6866-f7c2-483d-86cc-24566dc67114" key={label} className={step === index ? 'is-current' : ''} aria-current={step === index ? 'step' : undefined}>
        <Typography shuku-edit-id="e-d68bdc2d-b72e-4809-b810-e512ff7dd38c" variant="bodySmall" tone={step === index ? 'accent' : 'muted'}>{(index + 1) + ' · ' + label}</Typography>
      </li>)}</ol>
      {copied && count > 0 && <Button onClick={() => act({ type: 'undo' })}>撤销本层及后续</Button>}
      <Button onClick={() => act({ type: 'reset' })}>重新开始</Button>
    </div>
    <section shuku-edit-id="e-dd22e588-2683-4100-b7ad-f7d3280d9888" className={c('scene') + (state.conclusion ? ' is-explaining' : '')} aria-label={state.conclusion ? '好解存在与优化困难的关系' : '原有网络与末尾追加恒等层后的网络对照'}>
      {state.conclusion ? <>
        <Typography shuku-edit-id="e-7a818f56-82e1-40d7-80ce-4893c4798a88" as="h2" variant="h1" tone="accent" tabIndex={-1} data-reasoning-heading>好解存在，不等于训练能找到</Typography>
        <div shuku-edit-id="e-baa56744-54b1-4b3a-8467-45762a5faffb" className={c('reasoning-columns')}>
          <section shuku-edit-id="e-6fa62207-44dd-4b6c-958c-369701f13ef9" className={c('proof')} aria-label="手工构造证明好解存在">
            <Typography shuku-edit-id="e-6f187e13-5336-41ad-b818-475b53ebffda" as="h3" variant="body" tone="success">① 手工构造</Typography>
            <div shuku-edit-id="e-e0075412-53e3-4efe-aeaf-d17f486df9f2" className={c('witness')}><Numbers label="进入新增层" values={selectedValues} /><Arrow /><Numbers label="离开新增层" values={selectedValues} /></div>
            <Typography shuku-edit-id="e-bb4815a3-5561-4133-917d-75b0b33149de" variant="bodySmall" tone="success">✓ 恒等层保留原输出。</Typography>
          </section>
          <section shuku-edit-id="e-30fcb9d5-e065-4520-99ef-294a6a693053" className={c('search')} aria-label="实际训练仍需要寻找合适参数">
            <Typography shuku-edit-id="e-690bd055-5127-4461-8405-7336fb98be60" as="h3" variant="body" tone="accent">② 训练寻找</Typography>
            <div shuku-edit-id="e-b6ed1589-81ab-4cf8-8249-80844872aa5a" className={c('training-loop')}>
              <div shuku-edit-id="e-00d3d0cd-32dc-4860-9832-c3b11e47b172"><Typography shuku-edit-id="e-6692329e-c11d-4177-9aef-706229f271fc" variant="bodySmall" tone="accent" align="center">当前参数</Typography></div><Arrow />
              <div shuku-edit-id="e-b798932d-295b-4222-9183-791a0286d2f6"><Typography shuku-edit-id="e-af59b5d3-d265-44ec-aec3-49a02ca8042c" variant="bodySmall" tone="accent" align="center">计算损失</Typography></div><Arrow />
              <div shuku-edit-id="e-57c94885-f670-47d5-bbbf-cd92563593ea"><Typography shuku-edit-id="e-7d70cec3-1fc6-435b-a9d5-0e8aa9d86b6f" variant="bodySmall" tone="accent" align="center">梯度更新</Typography></div>
            </div>
            <Typography shuku-edit-id="e-9c3998ca-709b-41f9-85f3-e0d60f8c1114" variant="bodySmall" tone="muted">从初始化出发，按梯度反复更新。</Typography>
          </section>
        </div>
        <div shuku-edit-id="e-3628e48a-0bd8-48f9-82a0-e4712c21d923" className={c('optimization-evidence')} role="status">
          <Typography shuku-edit-id="e-48c3a22f-21bb-4566-b097-03e7788d46dd" as="h3" variant="h2" tone="accent">优化困难，难在寻找参数。</Typography>
          <Typography shuku-edit-id="e-15630616-9251-4a01-95d8-f5881b820673" variant="body" tone="muted">证据：更深普通网络的训练误差反而更高。</Typography>
        </div>
        <div shuku-edit-id="e-18e5dd96-0a91-4a36-af6a-fabe4d8643d0" className={c('review')}><Button onClick={() => act({ type: 'review' })}>返回恒等验证</Button></div>
      </> : <>
      <div shuku-edit-id="e-ff2117c0-7b58-4519-9819-f0ba32e13288" className={c('comparison')}>
        <div shuku-edit-id="e-fb6a0529-a509-4b33-826f-b745ea2ef37c" className={c('source')}><Typography shuku-edit-id="e-a0af8a43-70ae-444e-9d4b-1204db02c2df" variant="bodySmall" tone="accent">同一张照片</Typography><Photo /></div>
        <svg shuku-edit-id="e-edacbb0c-4145-4c6b-9d8c-925ebccd1cd5" className={c('fork')} viewBox="0 0 40 300" preserveAspectRatio="none" aria-hidden="true"><path shuku-edit-id="e-44183c44-2d36-42c5-b450-3c1d74d37151" d="M1 150H16V65H38M16 150V235H38M32 59L38 65L32 71M32 229L38 235L32 241" /></svg>
        <div shuku-edit-id="e-f9e6afde-baba-44c4-982a-9c01d761a207" className={c('routes')}>{network(true)}
        <div shuku-edit-id="e-c0f84b1f-1873-43f1-95ef-22a42552fada" className={c('copy-row')}>
          <div shuku-edit-id="e-65156b30-8cf6-4d12-9cf6-6a33517a76d2" className={c('copy-guide') + (copied ? ' is-copied' : '')} aria-hidden="true" />
          <div shuku-edit-id="e-4aa5845c-0c08-4443-a4b7-2a22555bb150" className={c('copy-control')}>{copied
            ? <Typography shuku-edit-id="e-5242a252-5254-43bf-b0c9-35fd09a1ba44" variant="bodySmall" tone="muted">原有层与分类头的参数全部保留</Typography>
            : <Button variant="primary" hint onClick={() => act({ type: 'copy' })}>保留原有网络 ↓</Button>}</div>
        </div>{network(false)}</div>
      </div>
      <div shuku-edit-id="e-8febe5b2-cdf0-46c7-88ab-531c88c1d74f" className={c('detail')} aria-live="polite">
        {count > 0 ? <><Numbers label="进入新增层的表示" values={selectedValues} /><Arrow />
            <div shuku-edit-id="e-b603c610-e49d-40eb-a3e9-f36144527b7e" className={c('identity-label')}><Typography shuku-edit-id="e-34980dc4-53c5-423f-8dc0-bed718bd6981" variant="bodySmall" tone="warning">{'第 ' + (state.selected + 1) + ' 层 · 恒等映射'}</Typography>
              <Typography shuku-edit-id="e-cd332e7f-73f8-449b-aebf-e20636fd2cb5" variant="bodySmall" tone="muted">不改变表示</Typography></div><Arrow />
            <Numbers label="离开新增层的表示" values={selectedValues} /></>
            : <Typography shuku-edit-id="e-29f5520f-863e-42ef-8f07-f170c515978d" className={c('detail-prompt')} variant="bodySmall" tone="muted">{copied
              ? '只在原有特征提取层后追加：先点击第一个橙色对象。' : '先保留原有网络，再在它的特征提取层末尾加层。'}</Typography>}
      </div>
      <div shuku-edit-id="e-e1062c6e-db09-4046-a18b-711c52b32ee7" className={c('finding') + (verified ? ' is-equal' : '')} role="status" data-verified-summary={verified ? true : undefined} tabIndex={verified ? -1 : undefined}>
        <Typography shuku-edit-id="e-9bc309d6-51c8-415a-86cf-e3ed7a21315c" variant="bodySmall" tone={verified ? 'success' : 'accent'}>{verified
          ? '✓ 表示不变，原分类头的输出一致。'
          : ready ? '新增层已全部接上，比较两条路径的输出。' : copied ? '蓝色为原有结构；橙色为末尾追加的层。' : '同一张照片，同一组原有参数。'}</Typography>
        {ready && !verified && <Button variant="primary" hint onClick={() => act({ type: 'verify' })}>验证输出一致</Button>}
        {verified && <Button variant="primary" data-show-reasoning hint={!state.optimizationSeen} onClick={() => act({ type: 'conclusion' })}>有这样的解，为什么还没训练好？ →</Button>}
      </div>
      </>}
    </section>
  </ContentBlock>;
}

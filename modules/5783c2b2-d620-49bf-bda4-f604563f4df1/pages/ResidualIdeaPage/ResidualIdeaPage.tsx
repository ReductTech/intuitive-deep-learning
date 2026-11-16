import { useState } from 'react';
import { Button, ContentBlock, NoticeStrip, Typography } from "@shuku/course-style/react";
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
import './ResidualIdeaPage.css';

const steps = ['① 看网络学什么', '② 把输入加回来', '③ 用改稿打个比方'];
const inputTenths = 50;
const targetTenths = 51;
const residualTenths = targetTenths - inputTenths;
const number = (tenths: number) => (tenths / 10).toFixed(1);

function Arrow() {
  return <svg shuku-edit-id="e-11f444f4-b2a4-4f41-8b79-d4b1b8199d89" className="rtg-residual-idea__arrow" viewBox="0 0 44 24" aria-hidden="true"><path shuku-edit-id="e-d1c3b751-29bc-4baa-be1c-1b056a529cd9" d="M2 12H38 M30 4L38 12L30 20" /></svg>;
}

function Paper({ kind, label }: { kind: 'original' | 'correction' | 'final'; label: string }) {
  return <div shuku-edit-id="e-69ed8014-a5c4-402b-84c1-94be0e228666" className="rtg-residual-idea__paper-wrap">
    <div shuku-edit-id="e-08279cce-b028-4198-8773-a79be3c42127" className={`rtg-residual-idea__paper is-${kind}`} aria-hidden="true">
      {[0, 1, 2, 3, 4].map(i => <i shuku-edit-id="e-72d7cf17-43aa-405a-a547-6328e4cb4209" key={i} className={i === 1 || i === 3 ? 'is-changed' : undefined} />)}
    </div>
    <Typography shuku-edit-id="e-82c07576-5ccb-4434-acbf-9934bd819f81" variant="bodySmall" align="center" tone={kind === 'correction' ? 'warning' : kind === 'original' ? 'accent' : 'success'}>{label}</Typography>
  </div>;
}

export function ResidualIdeaPage({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(0);
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]));
  const added = step >= 1;
  useCompleteOnce(seen.size === 3, onComplete);
  return <ContentBlock shuku-edit-id="e-5c330e22-5c60-44ab-84a5-f8dccbfa9877" headingLevel={1} className="rtg-residual-idea" title="ResNet 的想法：不重写，只学修改量" subtitle="同样几层网络，改学相对输入的差值，再把输入加回来。" onKeyDown={event => { if (event.key === ' ' && event.target instanceof HTMLButtonElement) event.stopPropagation(); }}>
    <div shuku-edit-id="e-78659a71-8db0-4d39-a943-35a0c9a482a8" className="rtg-residual-idea__steps" role="group" aria-label="理解残差学习的三个步骤">
      {steps.map((label, index) => <Button key={index} variant={step === index ? 'primary' : 'default'} active={step === index} aria-pressed={step === index} onClick={() => { setStep(index); setSeen(previous => new Set([...previous, index])); }}><Typography shuku-edit-id="e-81c98b34-ea7f-472b-bde4-742f2aeab392" as="span" variant="bodySmall" tone="inherit">{label}</Typography></Button>)}
    </div>
    <section shuku-edit-id="e-5be66729-2dce-47c1-bb2c-3526fc42c865" className="rtg-residual-idea__comparison" aria-label="普通网络与 ResNet 的理想映射目标对比，数字为教学示例">
      <div shuku-edit-id="e-f3f0437a-5fc3-4b50-af71-9baa428e4bce" className="rtg-residual-idea__route is-plain">
        <div shuku-edit-id="e-7a82d1ea-51f3-40b6-aadf-abe9545b372c" className="rtg-residual-idea__name"><Typography shuku-edit-id="e-4d5a9eb6-b03c-40d3-b963-b11c48e956f4" variant="h3" tone="accent">普通网络</Typography><Typography shuku-edit-id="e-9c78b0d4-3601-43b2-8529-5f73ca84431f" variant="bodySmall" tone="muted">直接学完整输出</Typography></div>
        <div shuku-edit-id="e-76311cf7-5845-40a4-b62f-92590c0a275f" className="rtg-residual-idea__value"><Typography shuku-edit-id="e-53d803ee-f800-43ce-9876-24bb172c7932" variant="bodySmall" tone="accent">输入 x</Typography><Typography shuku-edit-id="e-f651c889-d4c5-4309-ba68-fc2622781440" variant="h3" tone="accent">{number(inputTenths)}</Typography></div>
        <Arrow />
        <div shuku-edit-id="e-ab6ee330-3db9-45f9-b99b-b7226d00ba03" className="rtg-residual-idea__layers"><Typography shuku-edit-id="e-869aa64c-03f5-40c4-83e9-dee7ae37a79f" variant="body" tone="accent" align="center">几层网络</Typography><Typography shuku-edit-id="e-06368bab-bba0-49c5-b3c8-781c29fa1e87" variant="bodySmall" tone="muted" align="center">学习目标映射 H(x)</Typography></div>
        <Arrow />
        <div shuku-edit-id="e-f02d5688-7087-41c0-9c25-c5c57922783c" className="rtg-residual-idea__value rtg-residual-idea__plain-output"><Typography shuku-edit-id="e-130da30b-dba9-4764-9185-e67350cca729" variant="bodySmall" tone="accent">要学的完整输出 H(x)</Typography><Typography shuku-edit-id="e-b46a9287-e694-4f95-b32f-3d4e30360a1d" variant="h3" tone="accent">{number(targetTenths)}</Typography></div>
      </div>
      <div shuku-edit-id="e-d0c688a7-a83c-4d54-bd5e-0174ad99d278" className={`rtg-residual-idea__route is-residual${added ? ' is-added' : ''}`}>
        <div shuku-edit-id="e-29904517-155e-4a82-82fe-96acd9ccd878" className="rtg-residual-idea__name"><Typography shuku-edit-id="e-cc5cad3f-9cac-41cd-bb8c-042cc447b4b4" variant="h3" tone="success">ResNet</Typography><Typography shuku-edit-id="e-8d68f2a6-61cb-4780-a9cf-319eb987aa42" variant="bodySmall" tone="muted">只学修改量</Typography></div>
        <div shuku-edit-id="e-f209ce02-a7a8-4250-8795-884217e16ad8" className="rtg-residual-idea__value"><Typography shuku-edit-id="e-aa3933d7-13a3-4e3f-825b-f90284785f4b" variant="bodySmall" tone="accent">输入 x</Typography><Typography shuku-edit-id="e-2b287382-352f-49b5-a69c-43738da92e90" variant="h3" tone="accent">{number(inputTenths)}</Typography></div>
        <Arrow />
        <div shuku-edit-id="e-69a16ec7-294e-4493-af97-deae16226c7a" className="rtg-residual-idea__layers"><Typography shuku-edit-id="e-196848e0-34e7-4b4a-8d48-95b71d981316" variant="body" tone="warning" align="center">几层网络</Typography><Typography shuku-edit-id="e-9f356813-3635-472e-a28c-fd9e6952884f" variant="bodySmall" tone="muted" align="center">学习残差 F(x)</Typography></div>
        <Arrow />
        <div shuku-edit-id="e-3dff2c61-dcdf-40ef-8380-a23c3885353b" className="rtg-residual-idea__value is-correction"><Typography shuku-edit-id="e-6547e5b4-94e5-46c2-96ad-00d49f39e69b" variant="bodySmall" tone="warning">修改量 F(x)</Typography><Typography shuku-edit-id="e-540cfcaf-8e0d-4d1d-b2f6-ad7be5ed7930" variant="h3" tone="warning">{number(residualTenths)}</Typography></div>
        <Typography shuku-edit-id="e-04a4dd6d-6f34-4ceb-939d-eb4e12b57c9c" as="span" variant="h2" tone={added ? 'success' : 'muted'} align="center" className="rtg-residual-idea__plus">+</Typography>
        <div shuku-edit-id="e-0069fb08-d94c-4c6f-ba87-65e642d5d653" className={`rtg-residual-idea__value is-result${added ? ' is-ready' : ''}`} aria-live="polite"><Typography shuku-edit-id="e-de8b8334-c74c-4357-b29b-43e53d9cdb9c" variant="bodySmall" tone={added ? 'success' : 'muted'}>最终输出 H(x)</Typography><Typography shuku-edit-id="e-6e74136f-5319-4e8e-a199-143e2d6df633" variant="h3" tone={added ? 'success' : 'muted'}>{added ? number(inputTenths + residualTenths) : '?'}</Typography></div>
        <div shuku-edit-id="e-9e857a04-3391-497d-814c-0316047de999" className="rtg-residual-idea__shortcut" aria-label={added ? '快捷路径已把原输入加回，5.0 加 0.1 得到 5.1' : '下一步点亮快捷路径，把原输入加回来'}>
          <svg shuku-edit-id="e-4a22394d-13b8-4d18-94de-913a9b55f499" viewBox="0 0 1000 90" preserveAspectRatio="none" aria-hidden="true"><path shuku-edit-id="e-69a9a05c-b9a0-4d9c-9563-0d56a09e282e" d="M10 2V20 Q10 50 50 50H950 Q990 50 990 20V2 M980 12L990 2L1000 12" /></svg>
          <Typography shuku-edit-id="e-03ce0961-4a47-455f-8a6e-1ba3da1f165b" variant="bodySmall" tone={added ? 'success' : 'muted'} align="center">{added ? '快捷路径：保留原输入 x，再加回来' : '修改量不等于最终输出：还需要加回 x'}</Typography>
        </div>
      </div>
    </section>
    <section shuku-edit-id="e-b96073f5-1f02-463d-9819-b287484d49b5" className="rtg-residual-idea__meaning" aria-live="polite">
      {step === 2 ? <div shuku-edit-id="e-55bc08d8-e573-400e-ad04-0492152b0699" className="rtg-residual-idea__analogy">
        <Paper kind="original" label="原稿 x" />
        <Typography shuku-edit-id="e-74a340ed-56e5-4c23-91c3-5d11a758a2ae" variant="h2" tone="muted" align="center">+</Typography>
        <Paper kind="correction" label="修改意见 F(x)" />
        <Typography shuku-edit-id="e-2e8119ef-d691-4150-b9c0-30fff9400a9f" variant="h2" tone="muted" align="center">=</Typography>
        <Paper kind="final" label="定稿 H(x)" />
        <div shuku-edit-id="e-5bc6c0de-fad2-4eb4-9e0f-25b47848d66a" className="rtg-residual-idea__analogy-note"><Typography shuku-edit-id="e-2293d4ae-a525-429c-840d-87ac4d5c7295" variant="h3" tone="accent">修改文章，不必整篇重写。</Typography><Typography shuku-edit-id="e-0855aba8-d622-42a4-8ab2-be31f949d79a" variant="bodySmall" tone="muted">保留原稿，只写需要改的部分；把修改合上去，得到完整定稿。</Typography></div>
      </div> : <div shuku-edit-id="e-2005d08b-dd4a-40b2-9b8b-a47e3cb4741b" className="rtg-residual-idea__formula">
        <Typography shuku-edit-id="e-96a91c04-8fe2-4c51-8503-1566d62c361d" variant="h2" tone={added ? 'success' : 'warning'}>{added ? 'H(x) = x + F(x)' : 'F(x) = H(x) − x'}</Typography>
        <Typography shuku-edit-id="e-90adcc80-053a-4ed9-8cc7-1481b79a01a7" variant="h3" tone="accent">{added ? `${number(inputTenths)} + ${number(residualTenths)} = ${number(targetTenths)}` : `${number(targetTenths)} − ${number(inputTenths)} = ${number(residualTenths)}`}</Typography>
        <Typography shuku-edit-id="e-e9802939-48f4-4398-b146-00e8f9907077" variant="bodySmall" tone="muted">{added ? '最终输出还是完整的 H(x)，但这几层只需学“在 x 的基础上改多少”。' : '例：已有表示是 5.0，目标是 5.1。残差分支的学习对象是修改量 0.1。'}</Typography>
      </div>}
    </section>
    <NoticeStrip tone={added ? 'green' : 'blue'}><Typography shuku-edit-id="e-5df56121-7662-418e-977f-3f64618c7d68" variant="bodySmall" tone="inherit">{step === 2 ? '比喻与数字均为教学示意；仍根据最终输出计算损失，整体训练。下一页认识残差块的两条路线。' : added ? '换的是学习映射的方式，不是最终任务目标。原输入与残差相加，组成完整输出。' : '残差是相对输入的修改量，不是损失。点击第 2 步，看看如何得到完整输出。'}</Typography></NoticeStrip>
  </ContentBlock>;
}

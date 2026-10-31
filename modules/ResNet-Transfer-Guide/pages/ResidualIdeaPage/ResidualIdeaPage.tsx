import { useState } from 'react';
import { Button, ContentBlock, NoticeStrip, Typography } from '../../../shared/react';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
import './ResidualIdeaPage.css';

const steps = ['① 看网络学什么', '② 把输入加回来', '③ 用改稿打个比方'];
const inputTenths = 50;
const targetTenths = 51;
const residualTenths = targetTenths - inputTenths;
const number = (tenths: number) => (tenths / 10).toFixed(1);

function Arrow() {
  return <svg className="rtg-residual-idea__arrow" viewBox="0 0 44 24" aria-hidden="true"><path d="M2 12H38 M30 4L38 12L30 20" /></svg>;
}

function Paper({ kind, label }: { kind: 'original' | 'correction' | 'final'; label: string }) {
  return <div className="rtg-residual-idea__paper-wrap">
    <div className={`rtg-residual-idea__paper is-${kind}`} aria-hidden="true">
      {[0, 1, 2, 3, 4].map(i => <i key={i} className={i === 1 || i === 3 ? 'is-changed' : undefined} />)}
    </div>
    <Typography variant="bodySmall" align="center" tone={kind === 'correction' ? 'warning' : kind === 'original' ? 'accent' : 'success'}>{label}</Typography>
  </div>;
}

export function ResidualIdeaPage({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(0);
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]));
  const added = step >= 1;
  useCompleteOnce(seen.size === 3, onComplete);
  return <ContentBlock headingLevel={1} className="rtg-residual-idea" title="ResNet 的想法：不重写，只学修改量" subtitle="同样几层网络，改学相对输入的差值，再把输入加回来。" onKeyDown={event => { if (event.key === ' ' && event.target instanceof HTMLButtonElement) event.stopPropagation(); }}>
    <div className="rtg-residual-idea__steps" role="group" aria-label="理解残差学习的三个步骤">
      {steps.map((label, index) => <Button key={index} variant={step === index ? 'primary' : 'default'} active={step === index} aria-pressed={step === index} onClick={() => { setStep(index); setSeen(previous => new Set([...previous, index])); }}><Typography as="span" variant="bodySmall" tone="inherit">{label}</Typography></Button>)}
    </div>
    <section className="rtg-residual-idea__comparison" aria-label="普通网络与 ResNet 的理想映射目标对比，数字为教学示例">
      <div className="rtg-residual-idea__route is-plain">
        <div className="rtg-residual-idea__name"><Typography variant="h3" tone="accent">普通网络</Typography><Typography variant="bodySmall" tone="muted">直接学完整输出</Typography></div>
        <div className="rtg-residual-idea__value"><Typography variant="bodySmall" tone="accent">输入 x</Typography><Typography variant="h3" tone="accent">{number(inputTenths)}</Typography></div>
        <Arrow />
        <div className="rtg-residual-idea__layers"><Typography variant="body" tone="accent" align="center">几层网络</Typography><Typography variant="bodySmall" tone="muted" align="center">学习目标映射 H(x)</Typography></div>
        <Arrow />
        <div className="rtg-residual-idea__value rtg-residual-idea__plain-output"><Typography variant="bodySmall" tone="accent">要学的完整输出 H(x)</Typography><Typography variant="h3" tone="accent">{number(targetTenths)}</Typography></div>
      </div>
      <div className={`rtg-residual-idea__route is-residual${added ? ' is-added' : ''}`}>
        <div className="rtg-residual-idea__name"><Typography variant="h3" tone="success">ResNet</Typography><Typography variant="bodySmall" tone="muted">只学修改量</Typography></div>
        <div className="rtg-residual-idea__value"><Typography variant="bodySmall" tone="accent">输入 x</Typography><Typography variant="h3" tone="accent">{number(inputTenths)}</Typography></div>
        <Arrow />
        <div className="rtg-residual-idea__layers"><Typography variant="body" tone="warning" align="center">几层网络</Typography><Typography variant="bodySmall" tone="muted" align="center">学习残差 F(x)</Typography></div>
        <Arrow />
        <div className="rtg-residual-idea__value is-correction"><Typography variant="bodySmall" tone="warning">修改量 F(x)</Typography><Typography variant="h3" tone="warning">{number(residualTenths)}</Typography></div>
        <Typography as="span" variant="h2" tone={added ? 'success' : 'muted'} align="center" className="rtg-residual-idea__plus">+</Typography>
        <div className={`rtg-residual-idea__value is-result${added ? ' is-ready' : ''}`} aria-live="polite"><Typography variant="bodySmall" tone={added ? 'success' : 'muted'}>最终输出 H(x)</Typography><Typography variant="h3" tone={added ? 'success' : 'muted'}>{added ? number(inputTenths + residualTenths) : '?'}</Typography></div>
        <div className="rtg-residual-idea__shortcut" aria-label={added ? '快捷路径已把原输入加回，5.0 加 0.1 得到 5.1' : '下一步点亮快捷路径，把原输入加回来'}>
          <svg viewBox="0 0 1000 90" preserveAspectRatio="none" aria-hidden="true"><path d="M10 2V20 Q10 50 50 50H950 Q990 50 990 20V2 M980 12L990 2L1000 12" /></svg>
          <Typography variant="bodySmall" tone={added ? 'success' : 'muted'} align="center">{added ? '快捷路径：保留原输入 x，再加回来' : '修改量不等于最终输出：还需要加回 x'}</Typography>
        </div>
      </div>
    </section>
    <section className="rtg-residual-idea__meaning" aria-live="polite">
      {step === 2 ? <div className="rtg-residual-idea__analogy">
        <Paper kind="original" label="原稿 x" />
        <Typography variant="h2" tone="muted" align="center">+</Typography>
        <Paper kind="correction" label="修改意见 F(x)" />
        <Typography variant="h2" tone="muted" align="center">=</Typography>
        <Paper kind="final" label="定稿 H(x)" />
        <div className="rtg-residual-idea__analogy-note"><Typography variant="h3" tone="accent">修改文章，不必整篇重写。</Typography><Typography variant="bodySmall" tone="muted">保留原稿，只写需要改的部分；把修改合上去，得到完整定稿。</Typography></div>
      </div> : <div className="rtg-residual-idea__formula">
        <Typography variant="h2" tone={added ? 'success' : 'warning'}>{added ? 'H(x) = x + F(x)' : 'F(x) = H(x) − x'}</Typography>
        <Typography variant="h3" tone="accent">{added ? `${number(inputTenths)} + ${number(residualTenths)} = ${number(targetTenths)}` : `${number(targetTenths)} − ${number(inputTenths)} = ${number(residualTenths)}`}</Typography>
        <Typography variant="bodySmall" tone="muted">{added ? '最终输出还是完整的 H(x)，但这几层只需学“在 x 的基础上改多少”。' : '例：已有表示是 5.0，目标是 5.1。残差分支的学习对象是修改量 0.1。'}</Typography>
      </div>}
    </section>
    <NoticeStrip tone={added ? 'green' : 'blue'}><Typography variant="bodySmall" tone="inherit">{step === 2 ? '比喻与数字均为教学示意；仍根据最终输出计算损失，整体训练。下一页认识残差块的两条路线。' : added ? '换的是学习映射的方式，不是最终任务目标。原输入与残差相加，组成完整输出。' : '残差是相对输入的修改量，不是损失。点击第 2 步，看看如何得到完整输出。'}</Typography></NoticeStrip>
  </ContentBlock>;
}

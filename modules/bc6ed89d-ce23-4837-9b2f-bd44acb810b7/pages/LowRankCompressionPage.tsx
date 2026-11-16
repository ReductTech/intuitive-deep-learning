import { useRef, useState, type ReactNode } from 'react';
import { Button, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './LowRankCompressionPage.css';
import './GuidedLowRankPage.css';

export function LowRankSymbol({ base, upper, lower }: { base: string; upper?: string; lower?: string }) {
  return <span shuku-edit-id="e-aedd3d00-5460-47f1-94a8-d71565a62c07" className="lrkc-symbol">{base}{(upper || lower) && <span shuku-edit-id="e-a44cf30a-b64a-48f8-b146-af0018e7033d" className="lrkc-scripts"><sup shuku-edit-id="e-9add283f-45c9-42ea-8e91-f3f971bb57bc">{upper || '\u00a0'}</sup><sub shuku-edit-id="e-366536b6-6b97-412b-9e7f-1f2d39cc1404">{lower || '\u00a0'}</sub></span>}</span>;
}

export function LowRankMatrix({ label, shape, width, height, columns, rows, color }: {
  label: ReactNode; shape: string; width: number; height: number; columns: number; rows: number; color: string;
}) {
  return <div shuku-edit-id="e-a7586fb7-9be8-4600-8765-a7eee6f867f2" className={`lrkc-matrix lrkc-matrix--${color}`}>
    <Typography shuku-edit-id="e-b4682bde-bf8f-4e6a-913e-20140ed91b0d" as="strong" variant="h3" tone="inherit">{label}</Typography>
    <div shuku-edit-id="e-25787781-c32e-4811-a8c0-cc7cee4bea33" className="lrkc-grid" style={{ width, height, gridTemplateColumns: `repeat(${columns}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }} aria-hidden="true">
      {Array.from({ length: columns * rows }, (_, index) => <span shuku-edit-id="e-bc619361-2412-4b39-b34e-d2fcf6b39154" key={index} />)}
    </div>
    <Typography shuku-edit-id="e-854a6ca8-1c3d-44ae-ab8a-f8dcc0bebb2b" as="span" variant="bodySmall" tone="muted" wrap="nowrap"><MathFormulaStatic latex={shape} /></Typography>
  </div>;
}

const GUIDED_CAPTIONS = [
  '同一组输入，经过三组不同投影，得到 Q、K、V。',
  '右下角的 t 表示 token 位置；这里 t = 3，对应「学」。',
  '将大投影矩阵分解为两个小矩阵；K、V 共享同一个下投影。',
  '同一个输入行，分别生成内容 K 和 V。',
  '代入旁边的低秩分解。',
  '依照矩阵乘法结合律，先计算两路相同部分。',
  '存下共同的潜在向量，代替内容 K、V 的缓存。',
] as const;

function GuidedSymbol({ base, upper, lower }: { base: string; upper?: string; lower?: string }) {
  return <MathFormulaStatic latex={`${base}${lower ? `_{${lower}}` : ''}${upper ? `^{${upper}}` : ''}`} />;
}

function TokenMatrix({ kind, selected }: { kind: 'X' | 'Q' | 'K' | 'V'; selected: boolean }) {
  const width = kind === 'X' ? 250 : 320;
  const height = kind === 'X' ? 260 : selected ? 80 : 96;
  return <div shuku-edit-id="e-6d33e1db-df55-44c4-a186-e239192508fb" className={`glr-token-matrix glr-token-matrix--${kind.toLowerCase()}`}>
    <Typography shuku-edit-id="e-a33b469d-62be-4c33-a5e4-bc354567084c" as="strong" variant="h3" tone="inherit"><GuidedSymbol base={kind} /></Typography>
    <div shuku-edit-id="e-f8b1a96b-0dd7-446a-a73f-deaaa7069c64" className="glr-token-body" style={{ width, height }}>
      {kind === 'X' && <div shuku-edit-id="e-672ba2a6-0c3c-49ba-96d2-ac8cb7e7d0a5" className="glr-token-labels">{['我','爱','学','习'].map(token => <Typography shuku-edit-id="e-42d6dd7e-618a-481e-8c65-c82de72c9ea1" as="span" variant="bodySmall" key={token}>{token}</Typography>)}</div>}
      <div shuku-edit-id="e-dc8b0142-a453-43aa-84b5-f06d34351a0d" className="glr-token-grid" aria-hidden="true">{Array.from({length:24},(_,i)=><span shuku-edit-id="e-6ab2b8ba-4f17-4ece-b394-063fd671d72d" key={i} />)}</div>
      {selected && <><div shuku-edit-id="e-32bf3339-f1a6-404f-9a29-9b43dddf9288" className="glr-row-ring" /><Typography shuku-edit-id="e-d23e8179-f43c-4aac-8162-cb8f4c24d6fb" as="strong" variant="h3" tone="danger" className="glr-row-tag"><GuidedSymbol base={kind === 'X' ? 'h' : kind.toLowerCase()} lower="t" /></Typography></>}
    </div>
    <Typography shuku-edit-id="e-7170e84f-6e49-4b79-81b3-6975210c46cc" as="span" variant="bodySmall" tone="muted"><MathFormulaStatic latex={kind === 'X' ? '[4, 7168]' : '[4, 16384]'} /></Typography>
  </div>;
}

function ProjectionScene({ selected }: { selected: boolean }) {
  return <div shuku-edit-id="e-a2b66a1f-dc58-482b-87b3-389cb61d4dd0" className={`glr-projection ${selected ? 'glr-projection--selected' : ''}`}>
    <svg shuku-edit-id="e-cd6e5ffd-844d-46a8-bb02-bd8e49da980d" className="glr-branches" viewBox="0 0 1420 610" aria-hidden="true"><defs shuku-edit-id="e-4905363a-7e71-469a-8318-e4eb1d5a4cbb"><marker shuku-edit-id="e-0360d528-495e-4705-91cd-a59fd510798d" id="glr-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path shuku-edit-id="e-ef42743e-7cfe-442b-a4a8-64dadad7d48a" d="M1 1 L7 4 L1 7" fill="none" stroke="currentColor" strokeWidth="1.5" /></marker></defs>
      {[97,302,507].map(y=><path shuku-edit-id="e-c0610156-f7a3-4100-9899-a8164d0bde2d" key={y} d={`M320 305 C375 305 370 ${y} 410 ${y}`} />)}
    </svg>
    <div shuku-edit-id="e-aacc0ce4-24e6-4755-98da-422f1b4d5d65" className="glr-x-stage"><TokenMatrix kind="X" selected={selected} /></div>
    {(['Q','K','V'] as const).map((kind,i)=><div shuku-edit-id="e-abf4170b-26f7-47a1-9349-80f8e7bcb0a7" className="glr-lane" style={{top:i*205}} key={kind}>
      <Typography shuku-edit-id="e-f4162590-4e8c-4cbf-a347-60b6d1a1a7b5" as="span" variant="h2">×</Typography>
      <LowRankMatrix label={<GuidedSymbol base="W" upper={kind} />} shape="[7168, 16384]" width={180} height={96} rows={4} columns={6} color={kind === 'Q' ? 'latent' : kind.toLowerCase()} />
      <Typography shuku-edit-id="e-61b25745-6d4a-4480-91cd-ac65d446334a" as="span" variant="h2">=</Typography>
      <TokenMatrix kind={kind} selected={selected} />
      {selected && <Typography shuku-edit-id="e-4fa88aa8-c589-4c08-a4a4-390f26412a4e" as="p" variant="h3" tone="inherit" className={`glr-row-formula glr-row-formula--${kind.toLowerCase()}`}><MathFormulaStatic latex={`h_tW^{${kind}}=${kind.toLowerCase()}_t`} /></Typography>}
    </div>)}
  </div>;
}

function FactorizationScene() {
  return <div shuku-edit-id="e-bf51c8d0-db63-453b-9f2e-a6651e194007" className="glr-factorizations">
    {(['K','V'] as const).map(kind=><div shuku-edit-id="e-aae96764-feb6-410e-b572-55c0ced08328" className="glr-factor-row" key={kind}>
      <LowRankMatrix label={<GuidedSymbol base="W" upper={kind} />} shape="[7168, 16384]" width={240} height={145} rows={6} columns={9} color={kind.toLowerCase()} />
      <Typography shuku-edit-id="e-bdcefec5-ca32-413d-8b2c-09b4c5223256" as="span" variant="h2">=</Typography>
      <LowRankMatrix label={<GuidedSymbol base="W" upper="DKV" />} shape="[7168, 512]" width={45} height={145} rows={6} columns={2} color="down" />
      <Typography shuku-edit-id="e-fba95423-33c7-4dd7-a590-135213a9bfd4" as="span" variant="h2">×</Typography>
      <LowRankMatrix label={<GuidedSymbol base="W" upper={`U${kind}`} />} shape="[512, 16384]" width={300} height={45} rows={2} columns={10} color={kind.toLowerCase()} />
    </div>)}
  </div>;
}

function DerivationScene({ step }: { step: number }) {
  return <div shuku-edit-id="e-3451fa1f-e220-4dae-aa7e-51ca806e0326" className={`glr-derivations glr-derivations--step-${step}`}>
    <div shuku-edit-id="e-97f7dab5-dc55-4100-8284-5f12d64e34b1" className="glr-derivation-columns">
      {(['K','V'] as const).map(kind=><div shuku-edit-id="e-552adb45-6975-4838-a445-ed6a9d7e06aa" className={`glr-derivation-route glr-derivation-route--${kind.toLowerCase()}`} key={kind}>
        <div shuku-edit-id="e-2c79f5d8-0c86-459f-9035-e2c5d72269b9" className={`glr-substitution ${step === 4 ? 'is-visible' : ''}`} aria-hidden={step !== 4}>
          <Typography shuku-edit-id="e-a899e2bc-cc5d-41a6-b0d2-8873a2c90662" as="p" variant="h2" tone="inherit"><MathFormulaStatic latex={`W^{${kind}}=W^{DKV}W^{U${kind}}`} /></Typography>
          {step === 4 && <svg shuku-edit-id="e-710799ee-24dc-4769-8ccd-034d758c6bf7" className="glr-substitution-arrow" viewBox="0 0 600 105" aria-hidden="true"><path shuku-edit-id="e-d6fd2396-e096-4283-add7-419eb9df051a" d="M390 8 C450 35 430 70 340 90" /><path shuku-edit-id="e-6f76722f-c511-466a-bf70-4034affadb6c" d="M350 78 L340 90 L355 94" /></svg>}
        </div>
        <Typography shuku-edit-id="e-6ddc95bd-14f2-4b59-a9b6-d1fc009c3a78" as="p" variant="display" className="glr-route-formula" aria-label={`${kind} 路的投影推导`}>
          <MathFormulaStatic className={`glr-color-${kind.toLowerCase()}`} latex={`${kind.toLowerCase()}_t=`} />
          {step === 3 ? <MathFormulaStatic latex={`h_tW^{${kind}}`} /> :
            step === 4 ? <MathFormulaStatic latex={String.raw`h_t\left(W^{DKV}W^{U${kind}}\right)`} /> :
            <><MathFormulaStatic className={`glr-shared-expression ${step === 6 ? 'is-extracted' : ''}`} latex={String.raw`\left(h_tW^{DKV}\right)`} /><MathFormulaStatic latex={`W^{U${kind}}`} /></>}
        </Typography>
      </div>)}
    </div>
    {step === 6 && <>
      <svg shuku-edit-id="e-54a836cd-5034-4e79-aad4-8d3a92a95e63" className="glr-extraction-lines" viewBox="0 0 1400 560" aria-hidden="true"><path shuku-edit-id="e-19740b29-63d2-492a-a310-586b183357af" d="M330 280 C330 330 580 315 680 390" /><path shuku-edit-id="e-cb58e955-8731-4b73-b8a4-26fab09545bd" d="M1030 280 C1030 330 820 315 720 390" /><path shuku-edit-id="e-7ea86bc8-1566-4290-92ea-06d4b2f3064b" d="M668 372 L680 390 L660 385 M732 372 L720 390 L740 385" /></svg>
      <div shuku-edit-id="e-b65097f7-86bb-45d0-9421-4ce295a718a3" className="glr-latent-definition">
        <Typography shuku-edit-id="e-679e48f9-abcf-415c-ab04-21d84b1a0df5" as="p" variant="display" tone="inherit"><MathFormulaStatic latex={'c_t^{KV}=h_tW^{DKV}'} /></Typography>
        <Typography shuku-edit-id="e-7df96042-fdf4-408f-a560-497981bfe5f4" as="span" variant="h3" tone="inherit">要存的潜在向量 · [1, 512]</Typography>
      </div>
    </>}
  </div>;
}

export function LowRankCompressionPage() {
  const [step,setStep] = useState(0);
  const lastAdvance = useRef(0);
  const lastDirection = useRef<number | null>(null);
  const navigate = (direction: -1 | 1) => {
    const now = Date.now();
    if (lastDirection.current === direction && now - lastAdvance.current < 900) return;
    lastAdvance.current = now;
    lastDirection.current = direction;
    setStep(current => direction === -1 ? Math.max(0, current - 1) : current === 6 ? 0 : current + 1);
  };
  const title = step < 2 ? '我们要减少 KV 占的显存，就要知道它是咋来的。' : step === 2 ? '我们对它的投影矩阵 WK 和 WV 进行低秩压缩' : '从数学原理推导过程';
  return <section shuku-edit-id="e-7ea0ee1d-d084-4199-937e-fbf4c3a2a646" className="lrkc-slide glr-slide" data-glr-step={step} aria-label="逐步推导 KV 潜在向量">
    <Typography shuku-edit-id="e-f51ddf77-30bc-4879-b1d6-e180a3965774" as="h1" variant={step >= 3 ? 'display' : 'h1'} align="center" aria-label={step >= 3 ? '我们通过存 c_t^{KV} 来代替存 k_t 和 v_t' : undefined}>{step >= 3 ? <span shuku-edit-id="e-ccb7ac49-a0b2-4d16-be31-bb15cba9e86e" className="glr-math-title">我们通过存 <MathFormulaStatic latex={'c_t^{KV}'} /> 来代替存 <MathFormulaStatic latex={'k_t'} /> 和 <MathFormulaStatic latex={'v_t'} /></span> : step === 2 ? <span shuku-edit-id="e-ab345c48-9b23-4471-b852-2b7cbe20c0e3" className="glr-math-title">我们对它的投影矩阵 <MathFormulaStatic latex={'W^K'} /> 和 <MathFormulaStatic latex={'W^V'} /> 进行低秩压缩</span> : title}</Typography>
    <main shuku-edit-id="e-f6145613-4b41-4200-b4d7-7445440bca3c" className="glr-stage" key={step}>
      {step < 2 ? <ProjectionScene selected={step === 1} /> : step === 2 ? <FactorizationScene /> : <DerivationScene step={step} />}
    </main>
    <footer shuku-edit-id="e-243c523d-3051-4069-b617-66b7572ba3f3" className="glr-footer">
      <Button className="glr-back" disabled={step === 0} onClick={event => { event.stopPropagation(); navigate(-1); }}>← 播放上一步</Button>
      <Typography shuku-edit-id="e-0aceef19-3dc1-4fee-b0d5-ea651a4113f9" as="p" variant={step >= 3 ? 'h2' : step === 2 ? 'body' : 'h3'} align="center" aria-live="polite">{GUIDED_CAPTIONS[step]}</Typography>
      <Button variant="primary" onClick={event=>{
        event.stopPropagation();
        navigate(1);
      }}>{step === 6 ? '重新播放' : '播放下一步'} →</Button>
    </footer>
  </section>;
}

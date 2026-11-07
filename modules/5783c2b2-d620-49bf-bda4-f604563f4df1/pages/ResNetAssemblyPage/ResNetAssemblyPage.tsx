// @refresh reset
import { useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, NoticeStrip, Typography } from '../../../shared/react';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
import './ResNetAssemblyPage.css';

export const ASSEMBLY_STEPS = [
  { name: 'Stem', shape: [56, 64], latex: '56\\times56\\times64', detail: '先卷积，再池化', explanation: '卷积以步长 2 提取线索，最大池化再缩小空间；得到 64 个通道。',
    change: '224\\xrightarrow{\\mathrm{Conv}}112\\xrightarrow{\\mathrm{Pool}}56' },
  { name: 'Stage 1', shape: [56, 64], latex: '56\\times56\\times64', detail: '两个块，保持形状', explanation: '一起接入两个 BasicBlock，每块包含两个卷积；空间大小与通道数保持不变。',
    change: '56\\times56\\times64\\ \\longrightarrow\\ 56\\times56\\times64' },
  { name: 'Stage 2', shape: [28, 128], latex: '28\\times28\\times128', detail: '首块改变形状，第二块保持', explanation: '第一块缩小空间、增加通道，快捷路径投影对齐；第二块保持新形状。',
    change: '56\\times56\\times64\\ \\longrightarrow\\ 28\\times28\\times128' },
  { name: 'Stage 3', shape: [14, 256], latex: '14\\times14\\times256', detail: '继续缩小空间、增加通道', explanation: '仍然一次接入两个块：第一块改变形状并投影对齐，第二块保持形状。',
    change: '28\\times28\\times128\\ \\longrightarrow\\ 14\\times14\\times256' },
  { name: 'Stage 4', shape: [7, 512], latex: '7\\times7\\times512', detail: '汇集到更小的空间', explanation: '最后两个 BasicBlock 得到 512 个通道；空间中还保留每个通道的局部响应。',
    change: '14\\times14\\times256\\ \\longrightarrow\\ 7\\times7\\times512' },
  { name: '分类头', shape: [1, 512], latex: '512\\to K', detail: '汇总特征，再给出类别分数', explanation: '全局平均池化把每个通道汇总为一个数，最终全连接层输出 K 个类别分数。K 是类别数。',
    change: '7\\times7\\times512\\xrightarrow{\\mathrm{GAP}}512\\xrightarrow{\\mathrm{FC}}K' },
] as const;
export interface AssemblyState { built: number; focus: number; }
export const INITIAL_ASSEMBLY: AssemblyState = { built: 0, focus: 0 };
export function assemblyTotals(built: number) {
  const progress = Math.max(0, Math.min(6, Math.trunc(built)));
  const stages = Math.max(0, Math.min(4, progress - 1));
  const blocks = stages * 2, stem = progress > 0 ? 1 : 0, fc = progress === 6 ? 1 : 0;
  return { stages, blocks, stem, blockConvs: blocks * 2, fc, layers: stem + blocks * 2 + fc };
}
export function assemblyTransition(state: AssemblyState, step: number): AssemblyState {
  if (!Number.isInteger(step) || step < 1 || step > 6 || step > state.built + 1) return state;
  return { built: Math.max(state.built, step), focus: step };
}
function InputIcon() {
  return <svg className="rtg-assembly__input-icon" viewBox="0 0 120 100" aria-label="RGB 输入图像示意" role="img">
    <rect x="12" y="8" width="96" height="84" rx="8" />
    <path d="M22 73L47 45L65 63L80 48L100 73Z" /><circle cx="81" cy="29" r="9" />
  </svg>;
}
function BlocksIcon({ projection = false }: { projection?: boolean }) {
  return <svg className="rtg-assembly__block-icon" viewBox="0 0 180 90" aria-hidden="true">
    {[0, 1].map(block => <g key={block} transform={'translate(' + (block * 92) + ',0)'}>
      <rect x="8" y="9" width="68" height="70" rx="8" className="rtg-assembly__block-frame" />
      <rect x="17" y="23" width="20" height="35" rx="3" /><rect x="47" y="23" width="20" height="35" rx="3" />
      <path d="M8 44H17M37 40H47M67 44H76" />
      <path className={projection && block === 0 ? 'is-projection' : ''} d="M11 48V68H72V48M67 53L72 48L77 53" fill="none" />
    </g>)}
  </svg>;
}
function SingleIcon({ head = false }: { head?: boolean }) {
  return <svg className="rtg-assembly__single-icon" viewBox="0 0 140 90" aria-hidden="true">
    {head ? <>{[20, 45, 70].map(y => <g key={y}><circle cx="26" cy={y} r="5" /><path d={'M32 ' + y + 'L106 30M32 ' + y + 'L106 60'} /></g>)}
      <circle cx="112" cy="30" r="8" /><circle cx="112" cy="60" r="8" /></>
      : <><rect x="22" y="12" width="58" height="64" rx="5" />
        {[1, 2, 3].map(i => <g key={i}><path d={'M22 ' + (12 + i * 16) + 'H80'} /><path d={'M' + (22 + i * 14.5) + ' 12V76'} /></g>)}
        <path d="M84 45H105M99 39L105 45L99 51" /><rect x="110" y="30" width="24" height="30" rx="3" /></>}
  </svg>;
}
function FeatureTransition({ focus }: { focus: number }) {
  const after = ASSEMBLY_STEPS[Math.max(0, focus - 1)].shape;
  const before = focus <= 1 ? [224, 3] : ASSEMBLY_STEPS[focus - 2].shape;
  return <div className="rtg-assembly__feature-transition" role="group" aria-label="当前模块前后特征形状：面大小表示空间尺寸，叠层厚度表示通道数量，叠层不按真实比例绘制">
    {[before, after].map((shape, index) => {
      const size = 24 + 70 * Math.sqrt(shape[0] / 224);
      const level = shape[1] <= 3 ? 0 : 1 + Math.log2(shape[1] / 64);
      const count = level === 0 ? 3 : 4 + level * 2, depth = level === 0 ? 10 : 22 + level * 14;
      const x = (180 - size - depth) / 2, y = (122 - size) / 2 + depth * .175;
      const expanded = index === 1 && shape[1] > before[1], pooled = focus === 6 && index === 1;
      return <figure className="rtg-assembly__tensor" key={index} data-tensor-side={index === 0 ? 'before' : 'after'} data-channels={shape[1]}>
        <svg className={'rtg-assembly__feature-stack' + (expanded ? ' is-expanded' : '')} viewBox="0 0 180 132" role="img" aria-label={shape[0] + '乘' + shape[0] + '空间，' + shape[1] + '个通道；叠层为数量示意'}>
          {Array.from({ length: count }, (_, layer) => {
            const offset = (count - 1 - layer) / (count - 1);
            return <rect key={layer} x={x + offset * depth} y={y - offset * depth * .35} width={size} height={size} rx="2" className={offset === 0 ? 'rtg-assembly__tensor-front' : 'rtg-assembly__tensor-plane'} />;
          })}
          {shape[0] > 1 && <path className="rtg-assembly__tensor-grid" d={[1, 2].map(line => 'M' + (x + size * line / 3) + ' ' + y + 'v' + size + 'M' + x + ' ' + (y + size * line / 3) + 'h' + size).join('')} />}
          <path className="rtg-assembly__channel-depth" d={'M' + x + ' ' + (y - 6) + 'l' + depth + ' ' + (-depth * .35) + 'M' + (x - 2) + ' ' + (y - 9) + 'l4 6M' + (x + depth - 2) + ' ' + (y - depth * .35 - 9) + 'l4 6'} />
        </svg>
        <Typography as="figcaption" variant="bodySmall" tone={expanded ? 'warning' : 'accent'}>{pooled ? '池化后 ' + shape[1] + ' 维' : shape[1] + ' 通道'}</Typography>
      </figure>;
    })}
    <svg className="rtg-assembly__feature-arrow" viewBox="0 0 36 36" aria-hidden="true"><path d="M4 18H30M22 10L30 18L22 26" /></svg>
  </div>;
}
export interface ResNetAssemblyPageProps { onComplete?: () => void; }
export function ResNetAssemblyPage({ onComplete }: ResNetAssemblyPageProps) {
  const [state, setState] = useState<AssemblyState>(INITIAL_ASSEMBLY);
  const totals = assemblyTotals(state.built), complete = state.built === 6;
  const current = state.focus > 0 ? ASSEMBLY_STEPS[state.focus - 1] : null;
  useCompleteOnce(complete, onComplete);
  function visit(step: number) { setState(previous => assemblyTransition(previous, step)); }
  return <ContentBlock headingLevel={1} className="rtg-assembly" title="用残差块，构建完整的 ResNet-18"
    subtitle="沿一条路线，同时看结构、形状与“18”的来由。"
    data-built={state.built} data-focus={state.focus} data-blocks={totals.blocks} data-count={totals.layers} data-complete={complete}
    onKeyDown={event => { if ((event.key === 'Enter' || event.key === ' ') && (event.target as Element).closest('button')) {
      event.stopPropagation(); if (event.repeat) event.preventDefault();
    } }}>
    <div className="rtg-assembly__toolbar"><Typography variant="bodySmall" tone="accent">
      {complete ? '网络已接通 · 点击任一模块回看' : '依次接入模块 · ' + state.built + ' / 6'}
    </Typography><Button onClick={() => setState(INITIAL_ASSEMBLY)}>重新开始</Button></div>
    <section className="rtg-assembly__lab" aria-label="一条路线同步装配、特征形状与命名计数">
      <div className="rtg-assembly__pipeline" aria-label="ResNet-18完整路径">
        <div className="rtg-assembly__input"><Typography variant="bodySmall" tone="accent">输入图像</Typography><InputIcon /><Typography variant="bodySmall" tone="muted">RGB</Typography></div>
        {ASSEMBLY_STEPS.map((stage, index) => {
          const step = index + 1, built = step <= state.built, next = step === state.built + 1;
          return <Button key={stage.name + (next ? '-next' : '-stable')}
            className={'rtg-assembly__node' + (built ? ' is-built' : '') + (next ? ' is-next' : '') + (state.focus === step ? ' is-current' : '')}
            variant={next ? 'warn' : 'default'} disabled={step > state.built + 1} hint={next}
            aria-label={(built ? '回看' : '接入') + stage.name} aria-pressed={state.focus === step} data-assembly-step={step}
            onClick={() => visit(step)}>
            <Typography as="strong" variant="bodySmall" tone="inherit">{stage.name}</Typography>
            <div className="rtg-assembly__shape">{built ? <MathFormulaBlock appearance="plain" ariaLabel={stage.name + '输出形状'} data-output-shape={stage.latex}>
              {step === 6 ? <MathFormulaStatic latex={stage.latex} /> : <>
                <MathFormulaStatic latex={stage.shape[0] + '\\times' + stage.shape[0]} />
                <MathFormulaStatic latex={'\\times' + stage.shape[1]} />
              </>}
            </MathFormulaBlock>
              : <Typography variant="bodySmall" tone="muted">·</Typography>}</div>
            {step >= 2 && step <= 5 ? <BlocksIcon projection={step >= 3} /> : <SingleIcon head={step === 6} />}
            <Typography as="span" variant="bodySmall" tone="inherit">{built ? step >= 2 && step <= 5 ? '2 个残差块' : step === 1 ? '卷积与池化' : '池化与 FC' : next ? '＋ 点击接入' : '等待前一模块'}</Typography>
          </Button>;
        })}
      </div>
      <div className="rtg-assembly__focus" aria-live="polite">
        {current ? <><FeatureTransition focus={state.focus} />
          <div className="rtg-assembly__focus-copy"><Typography variant="h3" tone="accent">{current.name + ' · ' + current.detail}</Typography>
            <MathFormulaBlock appearance="plain" ariaLabel="当前模块的形状变化"><MathFormulaStatic latex={current.change} /></MathFormulaBlock>
            <Typography variant="bodySmall" tone="muted">{current.explanation}</Typography></div></>
          : <div className="rtg-assembly__intro"><Typography variant="h3" tone="accent">从 Stem 开始，一次接通一个模块</Typography>
            <Typography variant="bodySmall" tone="muted">接入一个 Stage，就同时加入两个残差块，并看到特征形状与层数的变化。</Typography></div>}
      </div>
      <div className={'rtg-assembly__naming' + (complete ? ' is-complete' : '')} role="status">
        <div><Typography variant="bodySmall" tone={complete ? 'success' : 'muted'}>{complete ? '命名结论' : '命名层数 · 随装配同步累计'}</Typography>
          <Typography variant="h3" tone={complete ? 'success' : 'accent'}>{complete ? 'ResNet-18' : totals.layers + ' 层'}</Typography></div>
        <div className="rtg-assembly__count"><MathFormulaBlock appearance="plain" ariaLabel={complete ? '1个Stem卷积加16个块内卷积加1个全连接等于18层' : '当前命名计数'}>
          <MathFormulaStatic latex={complete ? '1+4\\times2\\times2+1=18' : totals.stem + '+' + totals.blockConvs + '+' + totals.fc + '=' + totals.layers} />
        </MathFormulaBlock><Typography variant="bodySmall" tone="muted">{complete
          ? '17 个卷积层 + 1 个全连接层；BN、ReLU、池化及捷径投影不计入该命名。'
          : 'Stem 卷积 + 块内卷积 + 最终全连接'}</Typography></div>
      </div>
    </section>
    <NoticeStrip tone={complete ? 'green' : 'blue'} role="status"><Typography variant="bodySmall" tone="inherit">{complete
      ? '4 个 Stage、每个 2 块，共 8 个 BasicBlock；“18”数的是命名中的层，不是残差块。'
      : state.built === 0 ? '点击高亮的 Stem；后续每次接入一个模块，不必重复切换模式。'
        : '接下来点击 ' + ASSEMBLY_STEPS[state.built].name + '；结构、特征形状与层数会一起更新。'}</Typography></NoticeStrip>
  </ContentBlock>;
}

import { useId, type CSSProperties } from 'react';
import { Button, Typography, type LessonStepContext } from '../../shared/react';
import { StepSequenceControl, useStepSequence } from '../components/LessonVisuals';
import { rainImage as sourceImage } from '../media';
import './InputBridgePage.css';

// All sixteen crops come from the same 4 × 4 demonstration grid.
function ImagePieces() {
  return <div className="vlm-bridge-pieces" role="img" aria-label="同一张图切开的十六个图块，第一块用橙色标出">
    {Array.from({length:16}, (_,i)=><div key={i} className={i===0?'is-first':undefined} style={{backgroundImage:`url(${sourceImage})`,backgroundSize:'400% 400%',backgroundPosition:`${i%4/3*100}% ${Math.floor(i/4)/3*100}%`}} />)}
  </div>;
}
function FlowArrow({ stageClass='' }: { stageClass?: string }) {
  return <Typography as="span" variant="body" tone="accent" className={`vlm-input-arrow ${stageClass}`} aria-hidden="true">→</Typography>;
}
function VectorSequence({ image=false }: { image?:boolean }) {
  const labels=image?['1','2','3','…','16']:['I','love','cats'];
  return <div className="vlm-bridge-vectors" role="img" aria-label={image?'图块一、二、三至十六各对应一条等长向量，色块仅作示意':'三个 token 各对应一条等长向量，色块仅作示意'}>
    {labels.map((label,row)=><div key={label} className={`vlm-bridge-vector ${image&&row===0?'is-first':''}`}>
      <Typography as="span" variant="bodySmall">{label}</Typography>
      {label==='…'?<Typography as="span" variant="bodySmall" className="vlm-bridge-ellipsis">⋮</Typography>:<div className="vlm-bridge-cells" aria-hidden="true">{Array.from({length:8},(_,column)=><i key={column} style={{'--cell-opacity':.3+((row*5+column*3)%8)/12} as CSSProperties}/>)}</div>}
    </div>)}
  </div>;
}
export function InputBridgePage({ context }: { context: LessonStepContext }) {
  const titleId=useId();
  const sequence=useStepSequence<HTMLElement>(7);
  const stage=sequence.step;
  const prompts=[
    '先看文本：一句话拆成 I、love、cats 三个 Token。',
    'Embedding 把每个文本 Token 映射成一条 D 维向量。',
    '向量序列送入 Transformer，让 Token 交换信息。',
    '再看图片：H×W×C 的像素还不是 Token 序列。',
    '先切成 4×4 个图块；橙色标出第一个图块。',
    '每块展平并投影成 D 维向量，再加入位置信息。',
    '视觉 Token 也能送入 Transformer，让图块交换信息。',
  ];
  return <article className="vlm-input-page ng-ppt-slide-surface" ref={sequence.hostRef} data-input-stage={stage} aria-labelledby={titleId}
    onKeyDown={event=>{if(event.target instanceof HTMLButtonElement&&event.key===' ')event.stopPropagation();}}>
    <header className="vlm-input-header"><Typography variant="bodySmall" tone="accent">ViT / 01　输入接口</Typography><Typography as="h1" variant="h1" id={titleId}>图片是 H×W×C，<br/>Transformer 要的是 Token 序列</Typography></header>
    <div className="vlm-input-body">
      <section className="vlm-bridge-lane vlm-bridge-text" aria-label="文本先成为数值向量序列">
        <div className="vlm-bridge-source stage-text"><Typography as="h2" variant="h3">文本 token</Typography><div className="vlm-word-row">{['I','love','cats'].map(word=><Typography as="span" variant="body" className="vlm-word" key={word}>{word}</Typography>)}</div></div>
        <FlowArrow stageClass="stage-embedding"/><div className="vlm-bridge-process stage-embedding"><Typography variant="body" tone="accent">Embedding（嵌入）</Typography><Typography variant="bodySmall">把每个 token 映射成<br/>一条 D 维向量</Typography></div><FlowArrow stageClass="stage-vectors"/>
        <div className="stage-vectors"><VectorSequence/><Typography variant="bodySmall">每个 token 一条向量</Typography></div>
        <FlowArrow stageClass="stage-vectors"/><div className="vlm-transformer stage-vectors"><Typography variant="body" tone="inherit">Transformer</Typography><Typography variant="bodySmall" tone="inherit">用注意力让<br/>Token 交换信息</Typography></div>
      </section>
      <section className="vlm-bridge-lane vlm-bridge-image stage-image" aria-label="图像先切成图块，再将每个图块转换为一个 Token">
        <div className="vlm-bridge-source"><Typography as="h2" variant="h3">图片</Typography><div className="vlm-rain-image"><img src={sourceImage} alt="原课件图片：女孩与龙猫站在雨中"/></div><Typography variant="bodySmall">H 高 × W 宽 × C 通道</Typography></div>
        <FlowArrow stageClass="stage-patches"/><div className="vlm-bridge-process stage-patches"><Typography variant="body" tone="accent">① 切成图块（Patch）</Typography><ImagePieces/><Typography variant="bodySmall">4×4 个图块，按顺序排列</Typography><Typography variant="bodySmall" tone="accent" className="stage-visual-tokens">② 展平 → 投影 → 加位置</Typography></div>
        <FlowArrow stageClass="stage-visual-tokens"/><div className="vlm-bridge-sequence stage-visual-tokens"><Typography as="h2" variant="h3">视觉 Token 序列</Typography><VectorSequence image/><Typography variant="bodySmall">每块 → 一条 D 维向量（示意）</Typography></div>
        <FlowArrow stageClass="stage-image-transformer"/><div className="vlm-transformer stage-image-transformer"><Typography variant="body" tone="inherit">Transformer</Typography><Typography variant="bodySmall" tone="inherit">用注意力让<br/>图块交换信息</Typography></div>
      </section>

    </div>
    <footer className="vlm-input-footer"><div aria-live="polite"><Typography variant="body" tone="accent">{prompts[stage]}</Typography><Typography variant="bodySmall" tone="muted">手动逐步展开 · 已出现的内容保留，便于对照</Typography></div><StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="输入接口"/><Button variant="primary" onClick={context.complete} disabled={context.isComplete}><Typography as="span" variant="bodySmall" tone="inherit">{context.isComplete?'已完成本页':'继续学习'}</Typography></Button></footer>
  </article>;
}


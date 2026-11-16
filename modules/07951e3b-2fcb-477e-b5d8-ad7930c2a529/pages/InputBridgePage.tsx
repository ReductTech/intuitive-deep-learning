import { useId, type CSSProperties } from 'react';
import { Button, Typography, type LessonStepContext } from "@shuku/course-style/react";
import { StepSequenceControl, useStepSequence } from '../components/LessonVisuals';
import { rainImage as sourceImage } from '../media';
import './InputBridgePage.css';

// All sixteen crops come from the same 4 × 4 demonstration grid.
function ImagePieces() {
  return <div shuku-edit-id="e-d26301b3-5641-4381-aead-bb8c240bdeed" className="vlm-bridge-pieces" role="img" aria-label="同一张图切开的十六个图块，第一块用橙色标出">
    {Array.from({length:16}, (_,i)=><div shuku-edit-id="e-990d69f2-da04-4abe-928c-3c10716d9ae3" key={i} className={i===0?'is-first':undefined} style={{backgroundImage:`url(${sourceImage})`,backgroundSize:'400% 400%',backgroundPosition:`${i%4/3*100}% ${Math.floor(i/4)/3*100}%`}} />)}
  </div>;
}
function FlowArrow({ stageClass='' }: { stageClass?: string }) {
  return <Typography shuku-edit-id="e-7f0ee362-67c8-4bf8-8721-b74a8f0d2428" as="span" variant="body" tone="accent" className={`vlm-input-arrow ${stageClass}`} aria-hidden="true">→</Typography>;
}
function VectorSequence({ image=false }: { image?:boolean }) {
  const labels=image?['1','2','3','…','16']:['I','love','cats'];
  return <div shuku-edit-id="e-56e63b7e-ae19-4fed-bfba-0e8e14dce0aa" className="vlm-bridge-vectors" role="img" aria-label={image?'图块一、二、三至十六各对应一条等长向量，色块仅作示意':'三个 token 各对应一条等长向量，色块仅作示意'}>
    {labels.map((label,row)=><div shuku-edit-id="e-0179cb07-5f95-4074-b558-4b27b7eaa506" key={label} className={`vlm-bridge-vector ${image&&row===0?'is-first':''}`}>
      <Typography shuku-edit-id="e-71f02330-8744-4dcd-b7e9-aa18373edbcc" as="span" variant="bodySmall">{label}</Typography>
      {label==='…'?<Typography shuku-edit-id="e-5f3335f9-399b-4ab7-907c-cf6bfad2a183" as="span" variant="bodySmall" className="vlm-bridge-ellipsis">⋮</Typography>:<div shuku-edit-id="e-3680b482-4276-45fd-bdc4-6daa3b95a9da" className="vlm-bridge-cells" aria-hidden="true">{Array.from({length:8},(_,column)=><i shuku-edit-id="e-572c77fb-4050-4762-bc33-49622ddcb39d" key={column} style={{'--cell-opacity':.3+((row*5+column*3)%8)/12} as CSSProperties}/>)}</div>}
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
  return <article shuku-edit-id="e-1b1e8e24-a3d4-4b0b-a914-306cd0d17f5f" className="vlm-input-page ng-ppt-slide-surface" ref={sequence.hostRef} data-input-stage={stage} aria-labelledby={titleId}
    onKeyDown={event=>{if(event.target instanceof HTMLButtonElement&&event.key===' ')event.stopPropagation();}}>
    <header shuku-edit-id="e-76f94392-8000-447c-bbef-47039dabc705" className="vlm-input-header"><Typography shuku-edit-id="e-be760ec3-b006-40bb-884d-5aac0c334b7c" variant="bodySmall" tone="accent">ViT / 01　输入接口</Typography><Typography shuku-edit-id="e-32823768-f2cb-4dfd-b2ce-23cc10c6f1fe" as="h1" variant="h1" id={titleId}>图片是 H×W×C，<br shuku-edit-id="e-22fa1633-179a-46a9-82a7-15a5b2c56133"/>Transformer 要的是 Token 序列</Typography></header>
    <div shuku-edit-id="e-12091de7-b95f-4759-a65d-6bb519b73f85" className="vlm-input-body">
      <section shuku-edit-id="e-cb6f787f-f437-4d70-b7b2-45447c330c17" className="vlm-bridge-lane vlm-bridge-text" aria-label="文本先成为数值向量序列">
        <div shuku-edit-id="e-ddd96b1f-9233-4ec7-b5cd-931e0cf454e8" className="vlm-bridge-source stage-text"><Typography shuku-edit-id="e-65ac6437-f8f2-4380-8999-a04e53373028" as="h2" variant="h3">文本 token</Typography><div shuku-edit-id="e-921319c2-6534-4d37-9aab-2245d523ef85" className="vlm-word-row">{['I','love','cats'].map(word=><Typography shuku-edit-id="e-9b27b313-c212-4ce8-8206-327fac9eef16" as="span" variant="body" className="vlm-word" key={word}>{word}</Typography>)}</div></div>
        <FlowArrow stageClass="stage-embedding"/><div shuku-edit-id="e-e3aaa163-cef5-493f-800e-186e9c07a619" className="vlm-bridge-process stage-embedding"><Typography shuku-edit-id="e-ec68fab1-7bf6-45c3-9d59-1bc98f482897" variant="body" tone="accent">Embedding（嵌入）</Typography><Typography shuku-edit-id="e-32caa671-5810-4eb4-9c67-ace141a6deb3" variant="bodySmall">把每个 token 映射成<br shuku-edit-id="e-70aa3827-4cdf-4667-8587-c959405fa47d"/>一条 D 维向量</Typography></div><FlowArrow stageClass="stage-vectors"/>
        <div shuku-edit-id="e-10dc7671-102f-4073-aac4-3724c28175d4" className="stage-vectors"><VectorSequence/><Typography shuku-edit-id="e-63f9d720-b89a-41e6-98ed-3c29be92f70c" variant="bodySmall">每个 token 一条向量</Typography></div>
        <FlowArrow stageClass="stage-vectors"/><div shuku-edit-id="e-4c4b2648-9c61-471b-a42b-d62505ba1635" className="vlm-transformer stage-vectors"><Typography shuku-edit-id="e-4e2f953d-39b2-4602-b935-856390d8099e" variant="body" tone="inherit">Transformer</Typography><Typography shuku-edit-id="e-dc2c3752-a918-4764-bb2e-afbafe2cc8cc" variant="bodySmall" tone="inherit">用注意力让<br shuku-edit-id="e-f4f8ef52-435b-4354-9961-765ad795cc4b"/>Token 交换信息</Typography></div>
      </section>
      <section shuku-edit-id="e-10306143-800e-487d-ac02-937f73cca8bb" className="vlm-bridge-lane vlm-bridge-image stage-image" aria-label="图像先切成图块，再将每个图块转换为一个 Token">
        <div shuku-edit-id="e-49269424-1b25-4bf7-913e-24766dd78223" className="vlm-bridge-source"><Typography shuku-edit-id="e-6f9326a0-e8a2-4565-8dd5-c344df3853a8" as="h2" variant="h3">图片</Typography><div shuku-edit-id="e-ff21a0f6-9048-4250-9b5b-de899b007055" className="vlm-rain-image"><img shuku-edit-id="e-b0d1ad8c-66e8-47df-99e9-daa2b4fa7d06" src={sourceImage} alt="原课件图片：女孩与龙猫站在雨中"/></div><Typography shuku-edit-id="e-60df39b3-5e0b-4468-9b06-e4bcf53f4f02" variant="bodySmall">H 高 × W 宽 × C 通道</Typography></div>
        <FlowArrow stageClass="stage-patches"/><div shuku-edit-id="e-1786eea7-098e-4182-a38c-fbfeeef90679" className="vlm-bridge-process stage-patches"><Typography shuku-edit-id="e-15b2ee4b-6884-4abe-9434-a6cd80ca594d" variant="body" tone="accent">① 切成图块（Patch）</Typography><ImagePieces/><Typography shuku-edit-id="e-94579652-dff1-4068-97d9-5fde36f4919a" variant="bodySmall">4×4 个图块，按顺序排列</Typography><Typography shuku-edit-id="e-1a86c027-f99b-44b8-a772-f8a6d51057f9" variant="bodySmall" tone="accent" className="stage-visual-tokens">② 展平 → 投影 → 加位置</Typography></div>
        <FlowArrow stageClass="stage-visual-tokens"/><div shuku-edit-id="e-b75ab0f5-e431-4e46-83ad-f4b392e93ea6" className="vlm-bridge-sequence stage-visual-tokens"><Typography shuku-edit-id="e-0d3f7702-00fc-4042-9de1-4305760150eb" as="h2" variant="h3">视觉 Token 序列</Typography><VectorSequence image/><Typography shuku-edit-id="e-2191219e-6a6c-4118-86ac-1cc1050f2f41" variant="bodySmall">每块 → 一条 D 维向量（示意）</Typography></div>
        <FlowArrow stageClass="stage-image-transformer"/><div shuku-edit-id="e-b6539389-799a-49b8-ad11-7f6d54472f92" className="vlm-transformer stage-image-transformer"><Typography shuku-edit-id="e-3e1b8b1c-4013-43b0-aef1-9bdffae5f6e7" variant="body" tone="inherit">Transformer</Typography><Typography shuku-edit-id="e-1d1b33da-4c49-423e-b3b3-484682bb198d" variant="bodySmall" tone="inherit">用注意力让<br shuku-edit-id="e-393758fd-564a-4567-a9b5-36e55a84c6f1"/>图块交换信息</Typography></div>
      </section>

    </div>
    <footer shuku-edit-id="e-41a6fdbb-f8b8-476f-98ef-1df08d477f67" className="vlm-input-footer"><div shuku-edit-id="e-413943a7-dd76-4dc2-800b-e55d363de3b7" aria-live="polite"><Typography shuku-edit-id="e-5e2d227f-e83e-40a7-9948-2dd02b7cbe31" variant="body" tone="accent">{prompts[stage]}</Typography><Typography shuku-edit-id="e-ca30f95e-edd8-496a-b944-bccc8450826c" variant="bodySmall" tone="muted">手动逐步展开 · 已出现的内容保留，便于对照</Typography></div><StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="输入接口"/><Button variant="primary" onClick={context.complete} disabled={context.isComplete}><Typography shuku-edit-id="e-045e7d26-9bc1-42c6-8e44-07eb0f167e08" as="span" variant="bodySmall" tone="inherit">{context.isComplete?'已完成本页':'继续学习'}</Typography></Button></footer>
  </article>;
}


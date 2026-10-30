import { useState } from "react";
import { Typography } from "../../shared/react";
import { Heading, Text, useStepSequence, StepSequenceControl } from "../components/LessonVisuals";
import {
  Features,
  ImageFocus,
  SourceCrop,
} from "../components/TeachingVisuals";
import { pairedSourceImage as pairedSource } from '../media';
import { normalize, projectToken } from '../model/teachingMath';
import "./SourceComparisons.css";
import "./ClipFeedback.css";

export function PairedSupervision() {
  const sequence=useStepSequence(4), stage=sequence.step;
  const [image, setImage] = useState(0);
  const [text, setText] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const rects: [number,number,number,number][]=[[47,211,306,192],[47,417,306,156],[47,588,306,161]];
  const captions=['雨中的女孩与龙猫','草地上的小狗','街边的红色汽车'];
  const rawImage = [[3, 1, 1], [1, 3, 1], [-3, 1, 1]][image];
  const rawText = [[2.8, 1.2, 1], [1.2, 2.8, 1], [-2.8, 1.2, 1]][text];
  const projections = [[[1, 0, .2], [0, 1, .1]], [[1, 0, .1], [0, 1, .2]]];
  const projected = [rawImage, rawText].map((v, i) => projectToken(projections[i], v));
  const points = projected.map(normalize);
  const vector = (v: number[]) => `[${v.map(n => n.toFixed(2)).join(', ')}]`;
  return <div className="clip-feedback-pair" ref={sequence.hostRef} data-pair-stage={stage}>
    <section className="clip-feedback-stack">
      <Heading>选图片，再选与它配对的句子</Heading>
      <div className="clip-feedback-picks">
        {captions.map((caption,i)=><div className="clip-feedback-pick-row" key={caption}>
          <button className="clip-feedback-button clip-feedback-photo" aria-label={`选择图片：${caption}`} aria-pressed={image===i} onClick={()=>{setImage(i);setAttempted(true);}}><SourceCrop src={pairedSource} rect={rects[i]} alt={caption}/></button>
          <Typography variant="body" align="center" tone="muted" aria-hidden="true">→</Typography>
          <button className="clip-feedback-button" aria-pressed={text===i} onClick={()=>{setText(i);setAttempted(true);}}><Typography variant="body">{caption}</Typography></button>
        </div>)}
      </div>
      <Typography variant="bodySmall" tone="accent" role="status">{attempted ? image===text ? '配对正确：训练目标是让这张图与这句话更匹配。' : '当前是非配对：请按画面内容重选句子；两条路径仍可编码。' : '默认选中雨景图文。可直接下一步，也可尝试其他配对。'}</Typography>
    </section>
    <section className="clip-feedback-stack">
      <Heading>{['① 追踪当前图文','② 两个编码器输出数值','③ 投影，再归一化','④ 向量成为 I / T 点'][stage]}</Heading>
      <div className="clip-feedback-streams">
        {['图像','文本'].map((kind,i)=><div className="clip-feedback-stream" key={kind}>
          <div className="clip-feedback-selected">{i===0?<SourceCrop src={pairedSource} rect={rects[image]} alt={`正在编码：图片${image+1}，${captions[image]}`}/>:<Typography variant="bodySmall">{captions[text]}</Typography>}</div>
          <div className={stage<1?'clip-feedback-hidden':''} aria-hidden={stage<1}><Typography variant="bodySmall">↓ {kind}编码器</Typography><Typography variant="bodySmall">{vector(i===0?rawImage:rawText)}</Typography></div>
          <div className={stage<2?'clip-feedback-hidden':''} aria-hidden={stage<2}>{stage!==3&&<><Typography variant="bodySmall">↓ 各自投影（3维 → 2维）</Typography><Typography variant="bodySmall">{vector(projected[i])}</Typography><Typography variant="bodySmall">↓ 除以长度 {Math.hypot(...projected[i]).toFixed(2)}</Typography></>}<Typography variant="bodySmall" tone="accent">{i===0?`I${image+1}`:`T${text+1}`} = {vector(points[i])}</Typography></div>
        </div>)}
      </div>
      <div className="clip-feedback-space" hidden={stage<3}>
        <svg viewBox="0 0 600 125" role="img" aria-label={`共同二维空间：蓝点 I${image+1}、橙点 T${text+1}，点的坐标就是上方归一化向量`}>
          <path d="M60 110H540M300 10V115" stroke="var(--ui-border)" fill="none"/>
          {points.map((p,i)=><g key={i}><path d={`M${i===0?150:450} 0V8L${300+p[0]*210} ${110-p[1]*95}`} stroke={i===0?'var(--ui-accent)':'var(--ui-accent-alt)'} strokeDasharray="4 4" fill="none"/><circle cx={300+p[0]*210} cy={110-p[1]*95} r={i===0?8:5} fill={i===0?'var(--ui-accent)':'var(--ui-accent-alt)'}/></g>)}
        </svg>
        <Typography variant="bodySmall">蓝点 I{image+1} ← 图像向量；橙点 T{text+1} ← 文本向量</Typography>
      </div>
    </section>
    <div className="clip-feedback-pair-footer"><Typography variant="bodySmall" tone="muted">人工数值示意，点代表向量。相同维度不会自动对齐语义；配对监督指导训练。</Typography><StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="图文进入共同空间"/></div>
  </div>;
}
export const openTextCandidates=[{label:'龙猫角色',description:'龙猫角色的动画画面',score:.84},{label:'猫',description:'猫的动画画面',score:.11},{label:'棕熊',description:'棕熊的动画画面',score:.05}];
export function ClipTextVector({seed=0}:{seed?:number}) {
  return <div className="clip-class-vector" aria-hidden="true">{Array.from({length:6},(_,j)=><i key={j} style={{opacity:.3+((seed+j)%5)/8}}/>)}</div>;
}
export function ClipCandidateComparison({match=false, vectors=true}:{match?:boolean; vectors?:boolean}) {
  return <div className="clip-open-candidate-grid" role="table" aria-label={match?'上一页候选向量与图像向量的匹配结果':'开放候选文本经编码得到三个向量'}>
    <Typography variant="bodySmall" role="columnheader">开放候选描述</Typography><Typography variant="bodySmall" role="columnheader">文本向量</Typography><Typography variant="bodySmall" role="columnheader">与 I 比较</Typography>
    {openTextCandidates.map((c,i)=><div className="clip-open-candidate-row" role="row" key={c.label}>
      <Typography variant="body" role="cell">{c.description}</Typography>
      <div className={`clip-open-candidate-vector ${vectors?'':'clip-feedback-hidden'}`} aria-hidden={!vectors} role="cell" data-candidate={c.description}><Typography variant="body" tone="accent">T{i+1}</Typography><ClipTextVector seed={i+84}/></div>
      {match&&<div role="cell" className={'clip-inference-score '+(i===0?'is-winner':'')} data-score={c.score}><Typography variant="body" tone={i===0?'accent':'main'}>{c.score.toFixed(2)}</Typography><div className="clip-inference-score-track"><i style={{width:`${c.score*100}%`}}/></div></div>}
    </div>)}
    {!match&&<div className="clip-open-candidate-next"><Typography variant="body" tone="accent">与图像向量 I 比较</Typography></div>}
  </div>;
}
export function ClipInferenceImage() {
  return <section className="clip-inference-image"><Heading>同一张图片</Heading><ImageFocus/><div className="clip-inference-image-output"><Text>图像编码器 →</Text><div><Typography variant="body" tone="accent">图像向量 I</Typography><Features rows={1} cols={6} orange seed={2}/></div></div></section>;
}
export function ZeroShotPipeline() {
  const sequence=useStepSequence(3), stage=sequence.step;
  const [answer, setAnswer]=useState<'yes'|'no'|null>(null);
  return <div className="clip-feedback-inference" data-clip-stage={stage} ref={sequence.hostRef}>
    <div className="clip-inference-main"><ClipInferenceImage/>
      <section className="clip-feedback-candidates"><Heading>沿用上一页的三个候选向量</Heading><Typography variant="bodySmall" tone="muted">候选位置不变：{stage===0?'先保留 T1、T2、T3。':'加入图像向量 I，逐一比较。'}</Typography><ClipCandidateComparison match={stage>=1}/><Typography className={stage<1?'clip-feedback-hidden':''} variant="h3" tone="accent">最高分：龙猫角色</Typography></section>
    </div>
    <div className="clip-feedback-check" aria-hidden={stage<2} style={{visibility:stage<2?'hidden':'visible'}}>
      <Typography variant="body">把候选换成“龙猫角色 / 雨伞”，必须重新训练吗？</Typography>
      <div className="clip-feedback-actions">{answer===null?<><button className="clip-feedback-button" onClick={()=>setAnswer('yes')}><Typography variant="bodySmall">需要重新训练</Typography></button><button className="clip-feedback-button" onClick={()=>setAnswer('no')}><Typography variant="bodySmall">不需要，重新编码候选</Typography></button></>:<><Typography variant="bodySmall" tone="accent" role="status">{answer==='yes'?'再想想：候选不是固定分类头的权重；文本编码器可直接编码新描述。':'正确：冻结编码器，重算新候选向量并与 I 比较；能比较不保证识别准确。'}</Typography><button className="clip-feedback-button" onClick={()=>setAnswer(null)}><Typography variant="bodySmall">重试</Typography></button></>}</div>
    </div>
    <div className="clip-feedback-bottom"><Typography variant="bodySmall" tone="muted">Zero-shot：本任务不更新参数。教学预设相似度，不是概率。</Typography><StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="保留候选 → 比较 → 判断"/></div>
  </div>;
}

import { useState } from "react";
import { Typography } from "@shuku/course-style/react";
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
  return <div shuku-edit-id="e-ad4a4e6f-3a27-4c18-8d5f-b8104d4cd803" className="clip-feedback-pair" ref={sequence.hostRef} data-pair-stage={stage}>
    <section shuku-edit-id="e-f530d984-8cea-4613-941b-8a306440afa2" className="clip-feedback-stack">
      <Heading>选图片，再选与它配对的句子</Heading>
      <div shuku-edit-id="e-10ee0a60-03f9-471d-9bff-cb6169727542" className="clip-feedback-picks">
        {captions.map((caption,i)=><div shuku-edit-id="e-9fa421a0-0185-4c21-a50a-d305a4e3640d" className="clip-feedback-pick-row" key={caption}>
          <button shuku-edit-id="e-2d7e8e65-2ee3-4f71-ab6b-e6632a6367ac" className="clip-feedback-button clip-feedback-photo" aria-label={`选择图片：${caption}`} aria-pressed={image===i} onClick={()=>{setImage(i);setAttempted(true);}}><SourceCrop src={pairedSource} rect={rects[i]} alt={caption}/></button>
          <Typography shuku-edit-id="e-052e0395-4e72-40ca-a429-8feb7a4c73a3" variant="body" align="center" tone="muted" aria-hidden="true">→</Typography>
          <button shuku-edit-id="e-40361b21-b33a-483c-b9a7-96e250f0f32c" className="clip-feedback-button" aria-pressed={text===i} onClick={()=>{setText(i);setAttempted(true);}}><Typography shuku-edit-id="e-166fd786-1e03-4e50-882b-498c2b6f6bf4" variant="body">{caption}</Typography></button>
        </div>)}
      </div>
      <Typography shuku-edit-id="e-bac6f272-737b-4b05-b02e-423dede26902" variant="bodySmall" tone="accent" role="status">{attempted ? image===text ? '配对正确：训练目标是让这张图与这句话更匹配。' : '当前是非配对：请按画面内容重选句子；两条路径仍可编码。' : '默认选中雨景图文。可直接下一步，也可尝试其他配对。'}</Typography>
    </section>
    <section shuku-edit-id="e-fc366820-1202-48bd-b450-5731581deae2" className="clip-feedback-stack">
      <Heading>{['① 追踪当前图文','② 两个编码器输出数值','③ 投影，再归一化','④ 向量成为 I / T 点'][stage]}</Heading>
      <div shuku-edit-id="e-3c5bde6f-9628-4899-9659-777d53606b2e" className="clip-feedback-streams">
        {['图像','文本'].map((kind,i)=><div shuku-edit-id="e-5780d43c-bda7-45c6-94a7-5763f732e7ea" className="clip-feedback-stream" key={kind}>
          <div shuku-edit-id="e-d8547454-f315-4944-9712-f372c870655e" className="clip-feedback-selected">{i===0?<SourceCrop src={pairedSource} rect={rects[image]} alt={`正在编码：图片${image+1}，${captions[image]}`}/>:<Typography shuku-edit-id="e-fb76641c-e1b2-43c0-b01f-c221e5d7f50f" variant="bodySmall">{captions[text]}</Typography>}</div>
          <div shuku-edit-id="e-97691ca3-7c9b-4a61-944b-e6b5e6fabdf6" className={stage<1?'clip-feedback-hidden':''} aria-hidden={stage<1}><Typography shuku-edit-id="e-b89e4afb-7680-4218-84e6-51816004f948" variant="bodySmall">↓ {kind}编码器</Typography><Typography shuku-edit-id="e-b84f83a3-3cc5-4e2b-ac69-a3b73eb99aca" variant="bodySmall">{vector(i===0?rawImage:rawText)}</Typography></div>
          <div shuku-edit-id="e-34b039d9-d34a-47fb-be57-9c6d7a1bbc1c" className={stage<2?'clip-feedback-hidden':''} aria-hidden={stage<2}>{stage!==3&&<><Typography shuku-edit-id="e-991cdc5c-797f-4a4b-8e5c-e3077ad63944" variant="bodySmall">↓ 各自投影（3维 → 2维）</Typography><Typography shuku-edit-id="e-b35d4dc4-5ea9-4bca-a363-fa26ef7623b3" variant="bodySmall">{vector(projected[i])}</Typography><Typography shuku-edit-id="e-fad041f9-78d2-419a-a4b3-94ec5f84861c" variant="bodySmall">↓ 除以长度 {Math.hypot(...projected[i]).toFixed(2)}</Typography></>}<Typography shuku-edit-id="e-2f492b1f-c989-4e67-8f63-fd3b58343d62" variant="bodySmall" tone="accent">{i===0?`I${image+1}`:`T${text+1}`} = {vector(points[i])}</Typography></div>
        </div>)}
      </div>
      <div shuku-edit-id="e-a49b2756-0f8f-4782-9d5a-f3793246e899" className="clip-feedback-space" hidden={stage<3}>
        <svg shuku-edit-id="e-e2c10696-7d1f-4597-9219-d59dc9cc56de" viewBox="0 0 600 125" role="img" aria-label={`共同二维空间：蓝点 I${image+1}、橙点 T${text+1}，点的坐标就是上方归一化向量`}>
          <path shuku-edit-id="e-939eb545-8026-4b71-813f-669e81702611" d="M60 110H540M300 10V115" stroke="var(--ui-border)" fill="none"/>
          {points.map((p,i)=><g shuku-edit-id="e-e1cbedaf-40a9-45fb-9e47-c4ccb94e88e6" key={i}><path shuku-edit-id="e-ac5d3c9a-d1a3-4c3b-9540-ad0d43b147c4" d={`M${i===0?150:450} 0V8L${300+p[0]*210} ${110-p[1]*95}`} stroke={i===0?'var(--ui-accent)':'var(--ui-accent-alt)'} strokeDasharray="4 4" fill="none"/><circle shuku-edit-id="e-d85d2df5-6065-4af6-adf2-231b1aa1b88e" cx={300+p[0]*210} cy={110-p[1]*95} r={i===0?8:5} fill={i===0?'var(--ui-accent)':'var(--ui-accent-alt)'}/></g>)}
        </svg>
        <Typography shuku-edit-id="e-d0f1ee09-4b2c-45d8-bb18-0f39c5413e0f" variant="bodySmall">蓝点 I{image+1} ← 图像向量；橙点 T{text+1} ← 文本向量</Typography>
      </div>
    </section>
    <div shuku-edit-id="e-31878197-7743-4da8-884e-c08463a64eb8" className="clip-feedback-pair-footer"><Typography shuku-edit-id="e-8069e7fd-7a71-4b9c-91c2-b6330921e782" variant="bodySmall" tone="muted">人工数值示意，点代表向量。相同维度不会自动对齐语义；配对监督指导训练。</Typography><StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="图文进入共同空间"/></div>
  </div>;
}
export const openTextCandidates=[{label:'龙猫角色',description:'龙猫角色的动画画面',score:.84},{label:'猫',description:'猫的动画画面',score:.11},{label:'棕熊',description:'棕熊的动画画面',score:.05}];
export function ClipTextVector({seed=0}:{seed?:number}) {
  return <div shuku-edit-id="e-4a8a0d01-ad52-4538-951b-87623f5032c3" className="clip-class-vector" aria-hidden="true">{Array.from({length:6},(_,j)=><i shuku-edit-id="e-9d8bec87-791b-4403-9989-b3f910edae77" key={j} style={{opacity:.3+((seed+j)%5)/8}}/>)}</div>;
}
export function ClipCandidateComparison({match=false, vectors=true}:{match?:boolean; vectors?:boolean}) {
  return <div shuku-edit-id="e-707de7bb-2946-4113-94a8-f21a59c812fb" className="clip-open-candidate-grid" role="table" aria-label={match?'上一页候选向量与图像向量的匹配结果':'开放候选文本经编码得到三个向量'}>
    <Typography shuku-edit-id="e-d4f6601c-3f2b-4d92-8833-17f8c2f4ee0e" variant="bodySmall" role="columnheader">开放候选描述</Typography><Typography shuku-edit-id="e-f699dee6-3abb-4c6c-8910-630bfa076739" variant="bodySmall" role="columnheader">文本向量</Typography><Typography shuku-edit-id="e-02ab62ab-7cdc-4950-b2fc-6902338f3298" variant="bodySmall" role="columnheader">与 I 比较</Typography>
    {openTextCandidates.map((c,i)=><div shuku-edit-id="e-e407774d-64db-45e0-8293-d80f03946549" className="clip-open-candidate-row" role="row" key={c.label}>
      <Typography shuku-edit-id="e-e9923b7d-fd57-48bd-9684-cb2190e5b480" variant="body" role="cell">{c.description}</Typography>
      <div shuku-edit-id="e-4916aba9-d590-4f3c-92c1-dcf32ef91c69" className={`clip-open-candidate-vector ${vectors?'':'clip-feedback-hidden'}`} aria-hidden={!vectors} role="cell" data-candidate={c.description}><Typography shuku-edit-id="e-f56e5d53-35b7-4cc7-b154-27001b8fdeea" variant="body" tone="accent">T{i+1}</Typography><ClipTextVector seed={i+84}/></div>
      {match&&<div shuku-edit-id="e-d22f5fce-4963-48e5-828c-309e9439fe91" role="cell" className={'clip-inference-score '+(i===0?'is-winner':'')} data-score={c.score}><Typography shuku-edit-id="e-a2785fc2-a655-4dc8-8cf5-2f21425f7829" variant="body" tone={i===0?'accent':'main'}>{c.score.toFixed(2)}</Typography><div shuku-edit-id="e-960c4c30-8fb4-4b95-b712-3d55d1647d5f" className="clip-inference-score-track"><i shuku-edit-id="e-9e2e92e8-afaf-48c9-b581-52d68b420529" style={{width:`${c.score*100}%`}}/></div></div>}
    </div>)}
    {!match&&<div shuku-edit-id="e-041089c4-6422-4438-9157-2857649155cd" className="clip-open-candidate-next"><Typography shuku-edit-id="e-a62bfb15-b806-4675-8c87-ef09e8a9d1ec" variant="body" tone="accent">与图像向量 I 比较</Typography></div>}
  </div>;
}
export function ClipInferenceImage() {
  return <section shuku-edit-id="e-b0dbad00-1770-4e40-8a04-18bd0e04c600" className="clip-inference-image"><Heading>同一张图片</Heading><ImageFocus/><div shuku-edit-id="e-90ac590e-3268-4f78-8c09-0b79b3d84a12" className="clip-inference-image-output"><Text>图像编码器 →</Text><div shuku-edit-id="e-d8fe9e34-a5e6-4130-bc9b-2b2f228169ae"><Typography shuku-edit-id="e-b3c4348a-b516-4178-894a-ca7d1abfc0e7" variant="body" tone="accent">图像向量 I</Typography><Features rows={1} cols={6} orange seed={2}/></div></div></section>;
}
export function ZeroShotPipeline() {
  const sequence=useStepSequence(3), stage=sequence.step;
  const [answer, setAnswer]=useState<'yes'|'no'|null>(null);
  return <div shuku-edit-id="e-c224b814-56b0-4c0a-90cb-3e3b755d6e73" className="clip-feedback-inference" data-clip-stage={stage} ref={sequence.hostRef}>
    <div shuku-edit-id="e-8f81769c-03f2-4c2a-bef0-597bc0236ef1" className="clip-inference-main"><ClipInferenceImage/>
      <section shuku-edit-id="e-747c5174-7792-445a-8ba6-db7edc119517" className="clip-feedback-candidates"><Heading>沿用上一页的三个候选向量</Heading><Typography shuku-edit-id="e-6e9831a1-c7d9-450b-8b5a-f45b903cd0ed" variant="bodySmall" tone="muted">候选位置不变：{stage===0?'先保留 T1、T2、T3。':'加入图像向量 I，逐一比较。'}</Typography><ClipCandidateComparison match={stage>=1}/><Typography shuku-edit-id="e-d7fa4319-8109-4c92-8cec-ee9a6890d370" className={stage<1?'clip-feedback-hidden':''} variant="h3" tone="accent">最高分：龙猫角色</Typography></section>
    </div>
    <div shuku-edit-id="e-61e32133-244c-4f97-b5e2-87ca96f9abd3" className="clip-feedback-check" aria-hidden={stage<2} style={{visibility:stage<2?'hidden':'visible'}}>
      <Typography shuku-edit-id="e-dcf058ea-2d88-4b14-b16f-ab250c2daa9f" variant="body">把候选换成“龙猫角色 / 雨伞”，必须重新训练吗？</Typography>
      <div shuku-edit-id="e-f1fee050-9122-4bbd-aec1-5f35cbf4dc1f" className="clip-feedback-actions">{answer===null?<><button shuku-edit-id="e-6c4b3ea4-aee0-4da7-8b0b-790bb231c3ee" className="clip-feedback-button" onClick={()=>setAnswer('yes')}><Typography shuku-edit-id="e-28688b97-9692-4eb5-b733-c3ed9bf914d9" variant="bodySmall">需要重新训练</Typography></button><button shuku-edit-id="e-68d07ca2-79a2-4871-b4bd-7d794c2c7616" className="clip-feedback-button" onClick={()=>setAnswer('no')}><Typography shuku-edit-id="e-1594a85c-48c1-4d3f-9a1e-27d6b806ce8e" variant="bodySmall">不需要，重新编码候选</Typography></button></>:<><Typography shuku-edit-id="e-1b432f47-e65a-48ab-9635-8fd9df51045d" variant="bodySmall" tone="accent" role="status">{answer==='yes'?'再想想：候选不是固定分类头的权重；文本编码器可直接编码新描述。':'正确：冻结编码器，重算新候选向量并与 I 比较；能比较不保证识别准确。'}</Typography><button shuku-edit-id="e-b0edcaf6-c35d-409e-9050-3f083f5d3afe" className="clip-feedback-button" onClick={()=>setAnswer(null)}><Typography shuku-edit-id="e-59b59d72-13a3-45ad-a050-1b2765b6433e" variant="bodySmall">重试</Typography></button></>}</div>
    </div>
    <div shuku-edit-id="e-6ef935ea-1d3a-4a61-9cd6-5b6255cd5a3f" className="clip-feedback-bottom"><Typography shuku-edit-id="e-7edf2827-81f3-41e4-93a7-09dcd99c8654" variant="bodySmall" tone="muted">Zero-shot：本任务不更新参数。教学预设相似度，不是概率。</Typography><StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="保留候选 → 比较 → 判断"/></div>
  </div>;
}

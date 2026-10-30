import { Typography } from '../../shared/react';
import { StepSequenceControl, useStepSequence, Equation, Heading, Text } from '../components/LessonVisuals';
import { SourceCrop, ImageFocus } from '../components/TeachingVisuals';
import { ensemble, initialToyEncoders, normalize, toyEncoderLoss, toyEncoderScores, toyEncoderStep, dot, softmax, encoderParameterProbe } from '../model/teachingMath';
import { pairedSourceImage } from '../media';
import './Experiments.css';
import './ClipFeedback.css';

const encoderUpdate=toyEncoderStep(initialToyEncoders);
const updatedToyEncoders=encoderUpdate.next;
const clipNames=['雨景','小狗','汽车'];
const clipCrops: [number,number,number,number][]=[[47,211,306,192],[47,417,306,156],[47,588,306,161]];
function ScorePicture({after}:{after:boolean}) {
  const scores=toyEncoderScores(after?updatedToyEncoders:initialToyEncoders);
  return <section className={`clip-step-score-picture ${after?'is-after':''}`}>
    <Typography variant="body" tone="accent">{after?'更新后':'更新前'}</Typography>
    <div className="clip-step-score-grid" role="table" aria-label={(after?'更新后':'更新前')+'图文相似度，行是图片，列是描述'}>
      <div/>{clipNames.map(name=><Typography key={name} variant="bodySmall" align="center">{name}</Typography>)}
      {scores.map((row,i)=><div className="clip-step-score-row" role="row" key={i}>
        <SourceCrop src={pairedSourceImage} rect={clipCrops[i]} alt={clipNames[i]+'图片行'}/>
        {row.map((score,j)=><div key={j} role="cell" aria-label={`${clipNames[i]}图片与${clipNames[j]}描述的相似度${score.toFixed(3)}${i===j?'，正确配对':''}`} data-score={score} className={`clip-step-score ${i===j?'is-pair':''}`} style={{backgroundColor:`color-mix(in srgb, var(--ui-accent) ${Math.max(0,score)*45}%, white)`}}><Typography variant="bodySmall" align="center">{score.toFixed(2)}</Typography></div>)}
      </div>)}
    </div>
  </section>;
}
export function ContrastiveExperiment() {
  const sequence=useStepSequence(6), stage=sequence.step;
  const workedSequence=useStepSequence(3);
  const [worked, setWorked]=useState(false);
  const state=stage>=4?updatedToyEncoders:initialToyEncoders;
  const outputState=stage>=5?updatedToyEncoders:initialToyEncoders;
  const before=toyEncoderLoss(initialToyEncoders).total, after=toyEncoderLoss(updatedToyEncoders).total;
  const row=toyEncoderScores(initialToyEncoders)[0], probability=softmax(row,.4)[0];
  const probe=encoderParameterProbe(initialToyEncoders,1e-4);
  const rowAfter=toyEncoderScores(updatedToyEncoders)[0], probabilityAfter=softmax(rowAfter,.4)[0];
  const stages=['① 配对输入不变','② 编码得到输出向量','③ 比较全部图文','④ 正确配对概率 → 损失','⑤ 梯度更新参数；输出仍是旧值','⑥ 重新编码，再比较'];
  return <div className="clip-step-training clip-feedback-training" ref={sequence.hostRef} data-stage={stage}>
    <div className="clip-feedback-toolbar"><Typography variant="body" tone="accent">{worked?'雨景这一行 → 整批损失 → 一个参数':stages[stage]}</Typography><button className="clip-feedback-button" aria-expanded={worked} aria-controls="clip-training-content" onClick={()=>setWorked(value=>!value)}><Typography variant="bodySmall">{worked?'收起小例，返回流程':'展开数值小例'}</Typography></button></div>
    {worked?<div className="clip-feedback-worked" id="clip-training-content">
      <section className="clip-feedback-stack" hidden={workedSequence.step!==0}>
        <Heading>正确配对概率怎样变成损失？</Heading>
        <Typography variant="bodySmall">固定输入：用 [1, 0, 0] 代理雨景图文；并非真实像素或文本。</Typography>
        <Typography variant="bodySmall">输出：雨景图片与三句描述的相似度 [{row.map(v=>v.toFixed(3)).join(', ')}]</Typography>
        <Typography variant="bodySmall">第一项为正配对；汽车描述的非配对分数更高。温度 τ = 0.4。</Typography>
        <Equation latex={`p_{11}=\\frac{e^{${row[0].toFixed(3)}/0.4}}{${row.map(v=>`e^{${v.toFixed(3)}/0.4}`).join('+')}}=${probability.toFixed(4)}`} label="对雨景图片这一行做温度为零点四的 Softmax，得到正确雨景描述的概率"/>
        <Equation latex={`\\ell_1=-\\ln p_{11}=${(-Math.log(probability)).toFixed(4)}`} label="这一行的交叉熵等于正确配对概率的负自然对数"/>
        <Typography variant="bodySmall">整批 L =（3 行 + 3 列损失）/ 6 = {before.toFixed(4)}；本例对称，数值恰与单行相同。</Typography>
      </section>
      <section className="clip-feedback-stack" hidden={workedSequence.step!==1}>
        <Heading>一个文本编码器参数怎样更新？</Heading>
        <Typography variant="bodySmall">参数 w = W₁₁ = {initialToyEncoders.text[0][0].toFixed(3)}；不是输入，也不是输出相似度。</Typography>
        <Typography variant="bodySmall">仅扰动 w，重算整批 L；ε = 0.0001：<br/>L(w−ε) = {probe.minus.toFixed(6)}<br/>L(w+ε) = {probe.plus.toFixed(6)}</Typography>
        <Equation latex={`g\\approx\\frac{L(w+\\varepsilon)-L(w-\\varepsilon)}{2\\varepsilon}=${encoderUpdate.textGradient[0][0].toFixed(4)}`} label="整批双向损失对参数的中心有限差分梯度"/>
        <Typography variant="bodySmall">梯度为负：局部增大 w 会降低整批损失。这里用有限差分，真实 CLIP 通常用自动微分。</Typography>
      </section>
      <section className="clip-feedback-stack" hidden={workedSequence.step!==2}>
        <Heading>沿着减小损失的方向更新，再重新编码</Heading>
        <Equation latex={`w'=0.300-${encoderUpdate.learningRate}\\times(${encoderUpdate.textGradient[0][0].toFixed(4)})=${updatedToyEncoders.text[0][0].toFixed(4)}`} label="新参数等于旧参数减学习率乘梯度"/>
        <Typography variant="bodySmall">这里只追踪一个参数；函数实际更新两套矩阵全部参数，再重新编码同一批输入。</Typography>
        <Typography variant="body" tone="accent">重算后 p₁₁ = {probabilityAfter.toFixed(4)}，整批 L = {after.toFixed(4)}</Typography>
        <Typography variant="bodySmall" tone="muted">有限差分教学模型；真实 CLIP 通常用自动微分。数值计算用全精度，显示值四舍五入。</Typography>
      </section>
    </div>:<div className="clip-step-main" id="clip-training-content">
      <section className={`clip-step-pairs ${stage===0?'is-current':''}`}>
        <Heading>输入：配对的图与描述</Heading>
        <div className="clip-step-hero"><SourceCrop src={pairedSourceImage} rect={clipCrops[0]} alt="雨中的女孩和龙猫，与描述配对的训练图片"/><Typography variant="bodySmall">“雨中的女孩与龙猫”</Typography></div>
        <div className="clip-step-other-pairs">{['草地上的狗','街边的红车'].map((text,i)=><div key={text}><SourceCrop src={pairedSourceImage} rect={clipCrops[i+1]} alt={text}/><Typography variant="bodySmall">“{text}”</Typography></div>)}</div>
      </section>
      <svg className="clip-step-forward" viewBox="0 0 30 300" aria-hidden="true"><path d="M0 90H26M19 83L26 90L19 97M0 230H26M19 223L26 230L19 237"/></svg>
      <section className={`clip-step-model ${stage===1||stage===4?'is-current':''} ${stage<1?'clip-feedback-hidden':''}`} aria-hidden={stage<1} data-updated={stage>=4}>
        <Heading>两套编码器</Heading>
        {(['image','text'] as const).map((kind)=><div className={`clip-step-encoder ${kind==='text'?'is-text':''}`} key={kind}>
          <Typography variant="body" tone="accent">{kind==='image'?'图像编码器':'文本编码器'}</Typography>
          <div className="clip-step-encoder-key"><Typography variant="bodySmall" tone="muted">参数</Typography><Typography variant="bodySmall" tone="muted">输出向量</Typography></div><div className="clip-step-encoder-picture">
            <div className="clip-step-parameters" role="img" aria-label={kind+'编码器的三乘三教学参数矩阵，损失梯度会更新全部参数'}>{state[kind].flatMap((row,r)=>row.map((w,c)=><i key={`${r}-${c}`} data-value={w} style={{opacity:.2+.7*Math.min(1,Math.abs(w))}}/>))}</div>
            <Typography variant="body" tone="muted" aria-hidden="true">→</Typography>
            <div className="clip-step-vectors" role="img" aria-label={stage===4?'旧输出：新参数尚未重新编码':'三个样本各自的归一化三维输出向量'}>{[0,1,2].map(i=><div key={i}>{normalize(outputState[kind].map(row=>row[i])).map((v,d)=><i key={d} style={{opacity:.2+.7*Math.abs(v)}}/>)}</div>)}</div>
          </div>
        </div>)}

      </section>
      <svg className="clip-step-forward" viewBox="0 0 30 300" aria-hidden="true"><path d="M0 90C20 90 0 150 26 150M0 230C20 230 0 150 26 150M19 143L26 150L19 157"/></svg>
      <section className={`clip-step-comparison ${stage===2||stage===5?'is-current':''} ${stage<2?'clip-feedback-hidden':''}`} aria-hidden={stage<2}>
        <Heading>正确配对更相似</Heading>
        <Typography variant="bodySmall" tone="muted">行：图片　列：描述</Typography>
        <div className="clip-step-score-comparison"><ScorePicture after={false}/><div className={stage<5?'clip-feedback-hidden':''} aria-hidden={stage<5}><ScorePicture after/></div></div>
        <Typography variant="bodySmall">橙框为正确配对；色越深，相似度越高。</Typography>
      </section>
    </div>}
    {!worked&&<div className={`clip-step-return ${stage===3||stage===4?'is-active':''} ${stage<3?'clip-feedback-hidden':''}`} aria-hidden={stage<3}>
      <svg viewBox="0 0 1400 100" preserveAspectRatio="none" aria-hidden="true"><path d="M1110 0V66H570V0M560 12L570 0L580 12"/></svg>
      <Typography className="clip-step-gradient-label" variant="bodySmall" tone="accent">损失 → 梯度 → 更新两套参数</Typography>
      <div className="clip-step-loss"><Typography variant="bodySmall">整批双向损失{stage===4?'（旧输出）':''}</Typography><Equation latex={stage>=5?`${before.toFixed(2)}\\;\\longrightarrow\\;${after.toFixed(2)}`:before.toFixed(2)} label={stage>=5?'重新编码后整批损失下降':'旧输出的整批损失'}/></div>
    </div>}
    <div className="clip-step-footer"><Typography variant="bodySmall" tone="muted">线性模型教学示意；一次更新不保证全部配对正确。</Typography>{worked?<StepSequenceControl step={workedSequence.step} steps={workedSequence.steps} onPrevious={workedSequence.previous} onNext={workedSequence.next} label="概率损失 → 梯度 → 更新"/>:<StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="一次训练过程"/>}</div>
  </div>;
}
const vectors=[[.7,.7],[.4,.92],[.98,.2]].map(normalize);
function EnsembleDirectionPlot({ image, average }: { image:number[]; average:number[] }) {
  const items=[
    {label:'T1',vector:vectors[0],x:300,y:67,elbow:[265,67],color:'var(--ui-accent)',kind:'text'},
    {label:'T2',vector:vectors[1],x:150,y:36,elbow:null,color:'var(--ui-accent)',kind:'text'},
    {label:'T3',vector:vectors[2],x:300,y:178,elbow:[280,178],color:'var(--ui-accent)',kind:'text'},
    {label:'集成向量',vector:average,x:350,y:126,elbow:[310,126],color:'var(--ui-accent-alt)',kind:'ensemble'},
    {label:'图像 I',vector:image,x:350,y:227,elbow:[315,227],color:'var(--ui-accent)',kind:'image'},
  ];
  return <div className="exp-ensemble-directions" role="img" aria-label="等比例二维单位向量示意：T1、T2、T3求平均再归一化，得到橙色集成向量；其与蓝色图像向量的夹角比T1更小，但比T3更大。">
    <svg viewBox="0 0 640 260" aria-hidden="true">
      <path d="M60 24V235H565" fill="none" stroke="var(--ui-border)" strokeWidth="1.5"/>
      <path d="M60 45A190 190 0 0 1 250 235" fill="none" stroke="var(--ui-border)" strokeDasharray="5 7"/>
      {items.map(item=>{
        const x=60+item.vector[0]*190,y=235-item.vector[1]*190;
        const dx=item.vector[0],dy=-item.vector[1];
        return <g key={item.label} className={'exp-ensemble-ray is-'+item.kind} data-x={item.vector[0]} data-y={item.vector[1]}>
          <path d={`M60 235L${x} ${y}`} stroke={item.color} strokeWidth={item.kind==='text'?2:4} fill="none"/>
          <path d={`M${x-dx*9-dy*4} ${y-dy*9+dx*4}L${x} ${y}L${x-dx*9+dy*4} ${y-dy*9-dx*4}`} stroke={item.color} strokeWidth="2" fill="none"/>
          {item.elbow&&<path className="exp-ensemble-leader" d={`M${x} ${y}L${item.elbow[0]} ${item.elbow[1]}H${item.x-8}`} stroke={item.color} strokeWidth="1" fill="none"/>}
        </g>;
      })}
    </svg>
    {items.map(item=><div key={item.label} className={'exp-ensemble-label is-'+item.kind} style={{left:`${item.x/640*100}%`,top:`${item.y/260*100}%`}}><Typography variant="body" tone="accent">{item.label}</Typography></div>)}
  </div>;
}
export function EnsembleExperiment() {
  const avg=ensemble(vectors), image=normalize([1,.08]);
  const prompts=['龙猫角色','龙猫角色的照片','龙猫角色的动画画面'];
  return <div className="vlm-two exp-prompt-lesson">
    <section className="exp-prompt-input">
      <Heading>同一张图，同一类别的三种说法</Heading>
      <div className="exp-prompt-photo"><ImageFocus/></div>
      <div className="exp-prompt-phrases">{prompts.map((text,i)=><div key={text}><Typography variant="body" tone="accent">T{i+1}</Typography><Text>“{text}”</Text></div>)}</div>
      <Typography variant="body" align="center" tone="muted">↓ 同一个文本编码器</Typography>
      <Text>表述不同，得到的文本向量也会不同。</Text>
      <Typography variant="bodySmall" tone="accent">三句话都描述同一类别，先分别编码，再平均同一类别的向量。</Typography>
    </section>
    <section className="exp-prompt-average">
      <Heading>方向越接近，相似度越高</Heading>
      <EnsembleDirectionPlot image={image} average={avg}/>
      <Equation latex={'\\bar T=\\operatorname{normalize}\\left((T_1+T_2+T_3)/3\\right)'} label="将同一类别的三个归一化文本向量求平均，再归一化，作为该类别的集成向量"/>
      <div className="exp-prompt-score-compare"><div><Typography variant="bodySmall">只用第一句 T₁</Typography><Typography variant="body" tone="accent">与 I 的相似度 {dot(image,vectors[0]).toFixed(2)}</Typography></div><div><Typography variant="bodySmall">三句向量集成</Typography><Typography variant="body" tone="accent">与 I 的相似度 {dot(image,avg).toFixed(2)}</Typography></div></div>
      <Typography variant="body" tone="accent">本例优于 T₁；不保证优于 T₃，也不代表每张图都更准。</Typography>
    </section>
  </div>;
}
import { useState } from 'react';

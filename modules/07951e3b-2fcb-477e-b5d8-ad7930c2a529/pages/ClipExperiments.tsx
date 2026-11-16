import { Typography } from "@shuku/course-style/react";
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
  return <section shuku-edit-id="e-7f90ecfa-b16d-4e9f-9c2e-dcce23f4adc7" className={`clip-step-score-picture ${after?'is-after':''}`}>
    <Typography shuku-edit-id="e-a3612b55-5058-4c83-9c7b-d9af7c41191b" variant="body" tone="accent">{after?'更新后':'更新前'}</Typography>
    <div shuku-edit-id="e-7f271a30-7949-46f1-b96c-49db71e2e328" className="clip-step-score-grid" role="table" aria-label={(after?'更新后':'更新前')+'图文相似度，行是图片，列是描述'}>
      <div shuku-edit-id="e-072574ea-2236-4c2f-9df7-281a44a9ef75"/>{clipNames.map(name=><Typography shuku-edit-id="e-7bafd65e-5a91-42a5-8759-3fdd5c520d55" key={name} variant="bodySmall" align="center">{name}</Typography>)}
      {scores.map((row,i)=><div shuku-edit-id="e-df000b0c-ed8b-45eb-a685-77e415f85f85" className="clip-step-score-row" role="row" key={i}>
        <SourceCrop src={pairedSourceImage} rect={clipCrops[i]} alt={clipNames[i]+'图片行'}/>
        {row.map((score,j)=><div shuku-edit-id="e-da14792b-3bf7-4de0-9f9e-be138a4ee417" key={j} role="cell" aria-label={`${clipNames[i]}图片与${clipNames[j]}描述的相似度${score.toFixed(3)}${i===j?'，正确配对':''}`} data-score={score} className={`clip-step-score ${i===j?'is-pair':''}`} style={{backgroundColor:`color-mix(in srgb, var(--ui-accent) ${Math.max(0,score)*45}%, white)`}}><Typography shuku-edit-id="e-82ea121b-549c-421a-a43f-9e3ff86e8e1c" variant="bodySmall" align="center">{score.toFixed(2)}</Typography></div>)}
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
  return <div shuku-edit-id="e-7e563153-816a-4865-b4ea-61277328a12d" className="clip-step-training clip-feedback-training" ref={sequence.hostRef} data-stage={stage}>
    <div shuku-edit-id="e-23244a77-a4d4-4c6c-b6f6-035a553952ac" className="clip-feedback-toolbar"><Typography shuku-edit-id="e-a332f8bf-90dc-4707-b14b-04f70cae3a7b" variant="body" tone="accent">{worked?'雨景这一行 → 整批损失 → 一个参数':stages[stage]}</Typography><button shuku-edit-id="e-0579f58f-f85e-4bc2-8290-0b2fe6e0e87d" className="clip-feedback-button" aria-expanded={worked} aria-controls="clip-training-content" onClick={()=>setWorked(value=>!value)}><Typography shuku-edit-id="e-5a6e8d4d-1fac-4dd6-b7ca-5b5b8c18e3a2" variant="bodySmall">{worked?'收起小例，返回流程':'展开数值小例'}</Typography></button></div>
    {worked?<div shuku-edit-id="e-bbb0ed41-da1a-4622-85e0-e5b446161e30" className="clip-feedback-worked" id="clip-training-content">
      <section shuku-edit-id="e-0b9d1f1d-dc51-459b-9c2d-5001cc0e8b03" className="clip-feedback-stack" hidden={workedSequence.step!==0}>
        <Heading>正确配对概率怎样变成损失？</Heading>
        <Typography shuku-edit-id="e-b5d2534a-2e23-4b78-8e45-b870b85cd398" variant="bodySmall">固定输入：用 [1, 0, 0] 代理雨景图文；并非真实像素或文本。</Typography>
        <Typography shuku-edit-id="e-892a86e5-1a95-481e-bf30-e5045aac97b0" variant="bodySmall">输出：雨景图片与三句描述的相似度 [{row.map(v=>v.toFixed(3)).join(', ')}]</Typography>
        <Typography shuku-edit-id="e-f1ed5681-ac02-4eff-80a8-7a1ffbdb41cd" variant="bodySmall">第一项为正配对；汽车描述的非配对分数更高。温度 τ = 0.4。</Typography>
        <Equation latex={`p_{11}=\\frac{e^{${row[0].toFixed(3)}/0.4}}{${row.map(v=>`e^{${v.toFixed(3)}/0.4}`).join('+')}}=${probability.toFixed(4)}`} label="对雨景图片这一行做温度为零点四的 Softmax，得到正确雨景描述的概率"/>
        <Equation latex={`\\ell_1=-\\ln p_{11}=${(-Math.log(probability)).toFixed(4)}`} label="这一行的交叉熵等于正确配对概率的负自然对数"/>
        <Typography shuku-edit-id="e-bef2a69d-007b-4e42-987f-7563c3ad53b1" variant="bodySmall">整批 L =（3 行 + 3 列损失）/ 6 = {before.toFixed(4)}；本例对称，数值恰与单行相同。</Typography>
      </section>
      <section shuku-edit-id="e-54faf2a4-b227-4e13-be6a-1821aecf8c92" className="clip-feedback-stack" hidden={workedSequence.step!==1}>
        <Heading>一个文本编码器参数怎样更新？</Heading>
        <Typography shuku-edit-id="e-f800e97c-f755-4010-b279-235e955b4ae2" variant="bodySmall">参数 w = W₁₁ = {initialToyEncoders.text[0][0].toFixed(3)}；不是输入，也不是输出相似度。</Typography>
        <Typography shuku-edit-id="e-038e4747-b58b-4376-840a-64662f77e5c6" variant="bodySmall">仅扰动 w，重算整批 L；ε = 0.0001：<br shuku-edit-id="e-a743fc8d-4f0b-4d5d-8bcc-fc7b9dac31bc"/>L(w−ε) = {probe.minus.toFixed(6)}<br shuku-edit-id="e-b05d2adf-8f2f-49e7-a781-b02f6bf1d6cc"/>L(w+ε) = {probe.plus.toFixed(6)}</Typography>
        <Equation latex={`g\\approx\\frac{L(w+\\varepsilon)-L(w-\\varepsilon)}{2\\varepsilon}=${encoderUpdate.textGradient[0][0].toFixed(4)}`} label="整批双向损失对参数的中心有限差分梯度"/>
        <Typography shuku-edit-id="e-1d0a4957-cd61-4f6d-86eb-4e773213c195" variant="bodySmall">梯度为负：局部增大 w 会降低整批损失。这里用有限差分，真实 CLIP 通常用自动微分。</Typography>
      </section>
      <section shuku-edit-id="e-36ce99d8-ad1f-4be1-af41-cc294ccc126d" className="clip-feedback-stack" hidden={workedSequence.step!==2}>
        <Heading>沿着减小损失的方向更新，再重新编码</Heading>
        <Equation latex={`w'=0.300-${encoderUpdate.learningRate}\\times(${encoderUpdate.textGradient[0][0].toFixed(4)})=${updatedToyEncoders.text[0][0].toFixed(4)}`} label="新参数等于旧参数减学习率乘梯度"/>
        <Typography shuku-edit-id="e-3b585131-7799-4df4-9263-3c109c06fb27" variant="bodySmall">这里只追踪一个参数；函数实际更新两套矩阵全部参数，再重新编码同一批输入。</Typography>
        <Typography shuku-edit-id="e-cfa0cfec-3dfd-423e-8e7b-e2ef36574ebc" variant="body" tone="accent">重算后 p₁₁ = {probabilityAfter.toFixed(4)}，整批 L = {after.toFixed(4)}</Typography>
        <Typography shuku-edit-id="e-0ea86043-1fa3-444a-9872-4c8b3a347831" variant="bodySmall" tone="muted">有限差分教学模型；真实 CLIP 通常用自动微分。数值计算用全精度，显示值四舍五入。</Typography>
      </section>
    </div>:<div shuku-edit-id="e-23d88bdf-be81-45e2-9d53-f79b27224e2a" className="clip-step-main" id="clip-training-content">
      <section shuku-edit-id="e-ce34f282-8b8c-4785-b26d-ad53b8b6de64" className={`clip-step-pairs ${stage===0?'is-current':''}`}>
        <Heading>输入：配对的图与描述</Heading>
        <div shuku-edit-id="e-5410ee49-3c38-4b90-b573-136f5d0675a9" className="clip-step-hero"><SourceCrop src={pairedSourceImage} rect={clipCrops[0]} alt="雨中的女孩和龙猫，与描述配对的训练图片"/><Typography shuku-edit-id="e-f5e273a6-28e9-498b-bc86-370b5beaec70" variant="bodySmall">“雨中的女孩与龙猫”</Typography></div>
        <div shuku-edit-id="e-9a85167a-e767-44d1-a1fb-2bf7fc07afc2" className="clip-step-other-pairs">{['草地上的狗','街边的红车'].map((text,i)=><div shuku-edit-id="e-61645fdb-f3c3-4c82-ad13-22d946fc4d3d" key={text}><SourceCrop src={pairedSourceImage} rect={clipCrops[i+1]} alt={text}/><Typography shuku-edit-id="e-4b503174-224a-4dc1-9721-0fcbcfdd0620" variant="bodySmall">“{text}”</Typography></div>)}</div>
      </section>
      <svg shuku-edit-id="e-4df85a9c-2ab9-48c4-8f53-6ca7de3a933d" className="clip-step-forward" viewBox="0 0 30 300" aria-hidden="true"><path shuku-edit-id="e-1dfa0f43-fee6-4c31-b546-7a039cafd11e" d="M0 90H26M19 83L26 90L19 97M0 230H26M19 223L26 230L19 237"/></svg>
      <section shuku-edit-id="e-b0338336-8a0e-4f06-8a59-a79da539b1d7" className={`clip-step-model ${stage===1||stage===4?'is-current':''} ${stage<1?'clip-feedback-hidden':''}`} aria-hidden={stage<1} data-updated={stage>=4}>
        <Heading>两套编码器</Heading>
        {(['image','text'] as const).map((kind)=><div shuku-edit-id="e-621f8cbd-d8b9-4f32-85e5-3181ee21b850" className={`clip-step-encoder ${kind==='text'?'is-text':''}`} key={kind}>
          <Typography shuku-edit-id="e-d6d6fbf2-255e-407e-af2c-a570d6b05cdc" variant="body" tone="accent">{kind==='image'?'图像编码器':'文本编码器'}</Typography>
          <div shuku-edit-id="e-64e98df3-b448-4d82-894b-c39ba0816532" className="clip-step-encoder-key"><Typography shuku-edit-id="e-4957f12b-6583-46c5-a6c2-4301aaf40e85" variant="bodySmall" tone="muted">参数</Typography><Typography shuku-edit-id="e-3667d1d0-d1e9-4bff-9897-dc1aa30cf246" variant="bodySmall" tone="muted">输出向量</Typography></div><div shuku-edit-id="e-78c6ef00-f14b-4043-9bb1-baad3c9c6cd7" className="clip-step-encoder-picture">
            <div shuku-edit-id="e-657aa5aa-89c9-48dc-83cd-0c413e79828d" className="clip-step-parameters" role="img" aria-label={kind+'编码器的三乘三教学参数矩阵，损失梯度会更新全部参数'}>{state[kind].flatMap((row,r)=>row.map((w,c)=><i shuku-edit-id="e-c8061167-d20f-47b5-b7d9-bf08c8bb7881" key={`${r}-${c}`} data-value={w} style={{opacity:.2+.7*Math.min(1,Math.abs(w))}}/>))}</div>
            <Typography shuku-edit-id="e-6f7acd26-beed-4cdf-883d-9f1a23770898" variant="body" tone="muted" aria-hidden="true">→</Typography>
            <div shuku-edit-id="e-5587b8c2-d864-464f-af7e-020352feb524" className="clip-step-vectors" role="img" aria-label={stage===4?'旧输出：新参数尚未重新编码':'三个样本各自的归一化三维输出向量'}>{[0,1,2].map(i=><div shuku-edit-id="e-1cfd3206-fb1d-40f3-9783-77e7975e91ba" key={i}>{normalize(outputState[kind].map(row=>row[i])).map((v,d)=><i shuku-edit-id="e-e29d181d-76be-47f5-9530-8e8b23eb7595" key={d} style={{opacity:.2+.7*Math.abs(v)}}/>)}</div>)}</div>
          </div>
        </div>)}

      </section>
      <svg shuku-edit-id="e-f5d68830-3f4f-4608-b990-9b9b88008ff9" className="clip-step-forward" viewBox="0 0 30 300" aria-hidden="true"><path shuku-edit-id="e-2a927d46-44d7-43a1-9613-4d7e937358cd" d="M0 90C20 90 0 150 26 150M0 230C20 230 0 150 26 150M19 143L26 150L19 157"/></svg>
      <section shuku-edit-id="e-b8ccef81-d6e3-4698-adc8-9c853cd8760c" className={`clip-step-comparison ${stage===2||stage===5?'is-current':''} ${stage<2?'clip-feedback-hidden':''}`} aria-hidden={stage<2}>
        <Heading>正确配对更相似</Heading>
        <Typography shuku-edit-id="e-dd3d9c19-207a-4701-8256-de4db168aa13" variant="bodySmall" tone="muted">行：图片　列：描述</Typography>
        <div shuku-edit-id="e-91c9d4e6-aa5a-4f03-9820-425a5d91b72f" className="clip-step-score-comparison"><ScorePicture after={false}/><div shuku-edit-id="e-66d12667-c49c-4108-b2d0-356e4cdf35d6" className={stage<5?'clip-feedback-hidden':''} aria-hidden={stage<5}><ScorePicture after/></div></div>
        <Typography shuku-edit-id="e-4830385a-14e1-44cf-9540-be28c7081e00" variant="bodySmall">橙框为正确配对；色越深，相似度越高。</Typography>
      </section>
    </div>}
    {!worked&&<div shuku-edit-id="e-76b36c3b-01a0-42ba-b944-911de7f44fae" className={`clip-step-return ${stage===3||stage===4?'is-active':''} ${stage<3?'clip-feedback-hidden':''}`} aria-hidden={stage<3}>
      <svg shuku-edit-id="e-f7273c7e-aed0-4ae0-a47e-fcad76424a19" viewBox="0 0 1400 100" preserveAspectRatio="none" aria-hidden="true"><path shuku-edit-id="e-d0c2d6c2-27f2-41c5-b70b-df4b9609f498" d="M1110 0V66H570V0M560 12L570 0L580 12"/></svg>
      <Typography shuku-edit-id="e-491b798c-7e92-431c-a277-c29de5e9f66a" className="clip-step-gradient-label" variant="bodySmall" tone="accent">损失 → 梯度 → 更新两套参数</Typography>
      <div shuku-edit-id="e-bc3dcb3a-d2e3-408b-987e-85240aa1c1fb" className="clip-step-loss"><Typography shuku-edit-id="e-8ee10b67-de26-452c-b328-580b5b89c3ed" variant="bodySmall">整批双向损失{stage===4?'（旧输出）':''}</Typography><Equation latex={stage>=5?`${before.toFixed(2)}\\;\\longrightarrow\\;${after.toFixed(2)}`:before.toFixed(2)} label={stage>=5?'重新编码后整批损失下降':'旧输出的整批损失'}/></div>
    </div>}
    <div shuku-edit-id="e-f50e20d2-f47c-470f-aaf7-4e17cd45bbee" className="clip-step-footer"><Typography shuku-edit-id="e-b548a655-b52c-4596-933d-b52dc54dbb66" variant="bodySmall" tone="muted">线性模型教学示意；一次更新不保证全部配对正确。</Typography>{worked?<StepSequenceControl step={workedSequence.step} steps={workedSequence.steps} onPrevious={workedSequence.previous} onNext={workedSequence.next} label="概率损失 → 梯度 → 更新"/>:<StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="一次训练过程"/>}</div>
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
  return <div shuku-edit-id="e-270ec207-0029-4fbd-aef6-ea28538e7d7b" className="exp-ensemble-directions" role="img" aria-label="等比例二维单位向量示意：T1、T2、T3求平均再归一化，得到橙色集成向量；其与蓝色图像向量的夹角比T1更小，但比T3更大。">
    <svg shuku-edit-id="e-5948a309-b239-47da-a2d9-eca9aa4a2342" viewBox="0 0 640 260" aria-hidden="true">
      <path shuku-edit-id="e-ef6076d4-ac40-4c2f-aa56-4adef1154a91" d="M60 24V235H565" fill="none" stroke="var(--ui-border)" strokeWidth="1.5"/>
      <path shuku-edit-id="e-ead7bce5-0dcd-4258-a0c8-fa67db0d71a2" d="M60 45A190 190 0 0 1 250 235" fill="none" stroke="var(--ui-border)" strokeDasharray="5 7"/>
      {items.map(item=>{
        const x=60+item.vector[0]*190,y=235-item.vector[1]*190;
        const dx=item.vector[0],dy=-item.vector[1];
        return <g shuku-edit-id="e-d368a088-a8e4-4d94-987e-8f7a159de10e" key={item.label} className={'exp-ensemble-ray is-'+item.kind} data-x={item.vector[0]} data-y={item.vector[1]}>
          <path shuku-edit-id="e-65e8ccc8-382b-4583-97dc-70c874e605be" d={`M60 235L${x} ${y}`} stroke={item.color} strokeWidth={item.kind==='text'?2:4} fill="none"/>
          <path shuku-edit-id="e-ea9fe05f-c00c-49ab-97bf-08f31be7cede" d={`M${x-dx*9-dy*4} ${y-dy*9+dx*4}L${x} ${y}L${x-dx*9+dy*4} ${y-dy*9-dx*4}`} stroke={item.color} strokeWidth="2" fill="none"/>
          {item.elbow&&<path shuku-edit-id="e-085a19cd-b6b0-4672-954a-f919fb2d02a1" className="exp-ensemble-leader" d={`M${x} ${y}L${item.elbow[0]} ${item.elbow[1]}H${item.x-8}`} stroke={item.color} strokeWidth="1" fill="none"/>}
        </g>;
      })}
    </svg>
    {items.map(item=><div shuku-edit-id="e-1abbd57b-4aca-493d-b9c6-370842736fc6" key={item.label} className={'exp-ensemble-label is-'+item.kind} style={{left:`${item.x/640*100}%`,top:`${item.y/260*100}%`}}><Typography shuku-edit-id="e-473c7479-f7ca-4990-9425-d2e776c68a01" variant="body" tone="accent">{item.label}</Typography></div>)}
  </div>;
}
export function EnsembleExperiment() {
  const avg=ensemble(vectors), image=normalize([1,.08]);
  const prompts=['龙猫角色','龙猫角色的照片','龙猫角色的动画画面'];
  return <div shuku-edit-id="e-d6893948-ba1e-445a-9389-8567613f6a44" className="vlm-two exp-prompt-lesson">
    <section shuku-edit-id="e-41867923-0c03-4377-b401-d3022814c806" className="exp-prompt-input">
      <Heading>同一张图，同一类别的三种说法</Heading>
      <div shuku-edit-id="e-59e36c31-a5d5-4e1b-848b-8b98ae7c1074" className="exp-prompt-photo"><ImageFocus/></div>
      <div shuku-edit-id="e-a458795a-21a9-42a8-b675-aff683be0317" className="exp-prompt-phrases">{prompts.map((text,i)=><div shuku-edit-id="e-1701c0cc-a32f-438c-a29c-e69b63c4fdc4" key={text}><Typography shuku-edit-id="e-21fd7307-625c-4c48-aa25-0c903aa82cea" variant="body" tone="accent">T{i+1}</Typography><Text>“{text}”</Text></div>)}</div>
      <Typography shuku-edit-id="e-564b8323-2d5b-4aad-ac59-7f59f2fae651" variant="body" align="center" tone="muted">↓ 同一个文本编码器</Typography>
      <Text>表述不同，得到的文本向量也会不同。</Text>
      <Typography shuku-edit-id="e-073e8092-ab9b-4fc6-9795-3bb8e551badc" variant="bodySmall" tone="accent">三句话都描述同一类别，先分别编码，再平均同一类别的向量。</Typography>
    </section>
    <section shuku-edit-id="e-e355b92d-9ebb-405f-a572-678fa1fa0a01" className="exp-prompt-average">
      <Heading>方向越接近，相似度越高</Heading>
      <EnsembleDirectionPlot image={image} average={avg}/>
      <Equation latex={'\\bar T=\\operatorname{normalize}\\left((T_1+T_2+T_3)/3\\right)'} label="将同一类别的三个归一化文本向量求平均，再归一化，作为该类别的集成向量"/>
      <div shuku-edit-id="e-ca67a29f-50b4-473e-a033-29e8a95e7979" className="exp-prompt-score-compare"><div shuku-edit-id="e-b525b7c3-f443-4967-b0b3-8cf3054ea90e"><Typography shuku-edit-id="e-30630110-1f87-4ff3-b451-6df60773bd26" variant="bodySmall">只用第一句 T₁</Typography><Typography shuku-edit-id="e-b83d9205-3f78-45b3-9247-9e7d4de4640e" variant="body" tone="accent">与 I 的相似度 {dot(image,vectors[0]).toFixed(2)}</Typography></div><div shuku-edit-id="e-2c5ef8ed-b280-4911-907c-f091d4eb5cfc"><Typography shuku-edit-id="e-9d95dc87-1530-41e7-93f7-f41d246e3e60" variant="bodySmall">三句向量集成</Typography><Typography shuku-edit-id="e-16844a1a-df5a-4505-a61e-8d4f15d2595b" variant="body" tone="accent">与 I 的相似度 {dot(image,avg).toFixed(2)}</Typography></div></div>
      <Typography shuku-edit-id="e-0c35cca8-4b82-4d60-b266-bd037684c011" variant="body" tone="accent">本例优于 T₁；不保证优于 T₃，也不代表每张图都更准。</Typography>
    </section>
  </div>;
}
import { useState } from 'react';

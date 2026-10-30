import { Typography } from "../../shared/react";
import {
  Heading,
  Text,
  Tokens,
  useStepSequence,
  StepSequenceControl,
} from "../components/LessonVisuals";
import { ImageFocus, SourceCrop } from "../components/TeachingVisuals";
import { catContextImage as cat, umbrellasImage as umbrellas, rainImage, pairedSourceImage } from '../media';
import "./SourceComparisons.css";
import "./ClipFeedback.css";

export function ContextComparison() {
  return <div className="source-context-lesson">
    <section className="source-context-column">
      <Heading>CNN：逐层获得更大范围</Heading>
      <div className="source-cats">
        {[
          ['眼周局部','近处纹理'],
          ['加入邻域','眼睛与耳朵'],
          ['更大范围','更多身体轮廓'],
        ].map(([label,detail],i)=><div key={label}>
          <div className="source-cat" role="img" aria-label={label} style={{backgroundImage:`url(${cat})`,backgroundPosition:`${i*50}% center`}}/>
          <Typography variant="body">{label}</Typography>
          <Typography variant="bodySmall" tone="muted">{detail}</Typography>
        </div>)}
      </div>
      <Typography variant="bodySmall" tone="muted">同一位置逐层融合邻域特征；裁切仅示意范围，不是每层重新裁切输入。</Typography>
    </section>
    <section className="source-context-column">
      <Heading>ViT：当前图块可联系全图</Heading>
      <div className="source-context-global">
        <div className="source-cat source-context-cat" role="img" aria-label="同一只猫，当前眼下图块直接连接眼睛、耳朵与身体轮廓，连线为教学示意" style={{backgroundImage:`url(${cat})`,backgroundPosition:'100% center'}}>
          <svg viewBox="0 0 200 300" aria-hidden="true">
            {[[100,140],[70,90],[94,249]].map(([x,y],i)=><g key={i}><path d={`M90 197 L${x} ${y}`} fill="none" stroke="var(--ui-accent-alt)" strokeWidth="3"/><rect x={x-10} y={y-10} width="20" height="20" fill="none" stroke="var(--ui-accent)" strokeWidth="2"/></g>)}
            <rect x="78" y="185" width="24" height="24" fill="none" stroke="var(--ui-accent-alt)" strokeWidth="3"/>
          </svg>
        </div>
        <div className="source-context-meaning">
          <Typography variant="body" tone="accent">当前图块</Typography>
          <Typography variant="body" tone="muted">↓ 可直接联系</Typography>
          <Tokens labels={['眼睛','耳朵','身体轮廓']}/>
          <Typography variant="bodySmall">关注哪些位置，由训练学习。</Typography>
        </div>
      </div>
      <Typography variant="bodySmall" tone="muted">连线为教学示意；可连接不代表一定关注。</Typography>
    </section>
  </div>;
}

export function RelationsComparison() {
  const local=[[244,160],[269,194],[260,145],[269,108]];
  return <div className="source-relations-lesson">
    <section className="source-relations-column">
      <Heading>CNN：沿邻域逐层传递</Heading>
      <div className="vit-umbrella-scene">
        <img src={umbrellas} alt="五位女孩与五把伞，女孩 B 是左数第二位"/>
        <svg viewBox="0 0 640 427" aria-hidden="true">
          <polyline points={local.map(p=>p.join(',')).join(' ')} fill="none" stroke="var(--ui-accent-alt)" strokeWidth="5"/>
          {local.map(([x,y],i)=><circle key={i} cx={x} cy={y} r="9" fill="var(--ui-bg-card)" stroke="var(--ui-accent-alt)" strokeWidth="3"/>)}
        </svg>
      </div>
      <Text>女孩 B → 手 → 伞柄 → 蓝伞</Text>
      <Typography variant="bodySmall" tone="muted">对象链是空间路径类比，非执行顺序。</Typography>
    </section>
    <section className="source-relations-column">
      <Heading>ViT：比较关联，按权重汇入</Heading>
      <div className="vit-umbrella-scene">
        <img src={umbrellas} alt="同一位女孩 B，与蓝伞、条纹伞和白伞建立联系"/>
        <svg viewBox="0 0 640 427" aria-hidden="true">
          <path d="M244 160 Q220 95 269 108" fill="none" stroke="var(--ui-accent-alt)" strokeWidth="8"/>
          <path d="M244 160 Q325 65 404 110" fill="none" stroke="var(--ui-accent)" strokeWidth="3"/>
          <path d="M244 160 Q390 32 515 95" fill="none" stroke="var(--ui-accent)" strokeWidth="1.5" strokeDasharray="6 4"/>
          <rect x="231" y="147" width="26" height="26" fill="none" stroke="var(--ui-accent-alt)" strokeWidth="3"/>
        </svg>
      </div>
      <div className="source-relation-legend"><Typography variant="body" tone="accent">蓝伞：汇入更多</Typography><Typography variant="body">其他伞：汇入较少</Typography></div>
      <Typography variant="bodySmall" tone="muted">线越粗，示意权重越大；不是模型实测。</Typography>
    </section>
  </div>;
}
export function TrainingObjectiveComparison() {
  const sequence=useStepSequence(3);
  const [cell,setCell]=useState(0);
  const names=['雨景','小狗','汽车'];
  const captions=['雨中的女孩与龙猫','草地上的小狗','街边的红色汽车'];
  const rects: [number,number,number,number][]=[[47,211,306,192],[47,417,306,156],[47,588,306,161]];
  const row=Math.floor(cell/3), column=cell%3;
  return <div className="clip-feedback-objectives" ref={sequence.hostRef}>
    <section className="clip-feedback-stack">
      <Heading>Caption：预测目标句子的词</Heading>
      <div className="source-caption-photo"><ImageFocus/></div>
      <div className="clip-feedback-generation">
        <Typography variant="body">前文：女孩与龙猫{sequence.step===2?'站在':''}</Typography>
        <Typography variant="body" tone="accent">↓ 图像 + 前文 → 生成模型</Typography>
        <Typography variant="body">下一片段：{sequence.step===0?'待预测':sequence.step===1?'站在':'雨中'}</Typography>
      </div>
      <Typography variant="bodySmall">训练给正确前文，可并行算损失。<br/>推理追加生成片段，逐步预测。</Typography>
      <StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="前文 → 预测 → 追加"/>
    </section>
    <section className="clip-feedback-stack">
      <Heading>CLIP：学习整批图文配对</Heading>
      <table className="clip-feedback-matrix" aria-label="三张图片与三段描述的九种配对">
        <thead><tr><th><Typography variant="bodySmall">图 / 文</Typography></th>{['雨中场景','草地小狗','街边红车'].map((caption,i)=><th scope="col" key={caption} aria-label={captions[i]}><Typography variant="bodySmall">{caption}</Typography></th>)}</tr></thead>
        <tbody>{names.map((name,i)=><tr key={name}><th scope="row"><SourceCrop src={pairedSourceImage} rect={rects[i]} alt={name+'图片'}/></th>{names.map((caption,j)=><td key={caption}><button className={`clip-feedback-button ${i===j?'is-positive':''}`} aria-pressed={cell===i*3+j} aria-label={`${name}图片与${captions[j]}，${i===j?'正配对':'批内非配对'}`} onClick={()=>setCell(i*3+j)}><Typography variant="bodySmall">{i===j?'正配对':'非配对'}</Typography></button></td>)}</tr>)}</tbody>
      </table>
      <div className="clip-feedback-cell" aria-live="polite"><SourceCrop src={pairedSourceImage} rect={rects[row]} alt={`选中图片：${names[row]}`}/><div><Typography variant="bodySmall">↔ “{captions[column]}”</Typography><Typography variant="bodySmall" tone="accent">{row===column?'正配对：这句话就是该图的训练描述。':'负样本：这句话属于本批另一张图，而非当前图的配对描述。'}</Typography></div></div>
      <Typography variant="bodySmall" tone="muted">3 个正配对、6 个批内非配对。非配对可能是假负样本。</Typography>
    </section>
  </div>;
}
function UmbrellaEvidence({ red }: { red:boolean }) {
  const region=red?{x:.26,y:.47,w:.30,h:.25}:{x:.51,y:0,w:.30,h:.25};
  return <div className={`source-evidence-detail ${red?'is-red':''}`}>
    <div className="source-evidence-crop" role="img" aria-label={red?'放大女孩的红色伞面':'放大龙猫上方的深色伞面'} style={{aspectRatio:'1920 / 865',backgroundImage:`url(${rainImage})`,backgroundSize:`${100/region.w}% ${100/region.h}%`,backgroundPosition:`${region.x/(1-region.w)*100}% ${region.y/(1-region.h)*100}%`}}/>
    <Typography variant="body" align="center">{red?'红色伞面':'深色伞面'}</Typography>
  </div>;
}
export function EvidenceComparison() {
  return <div className="source-evidence-lesson">
    <div className="source-evidence-layout">
      <section className="source-evidence-photo">
        <Heading>画面里有几把红伞？</Heading>
        <ImageFocus><div className="source-evidence-region is-red" style={{left:'30%',top:'53%',width:'20%',height:'25%'}} aria-label="女孩手中的红伞"/><div className="source-evidence-region" style={{left:'54%',top:'2%',width:'27%',height:'20%'}} aria-label="龙猫上方的深色伞"/></ImageFocus>
        <Typography variant="bodySmall" tone="muted">右侧放大两处伞面，核对颜色。</Typography>
      </section>
      <section className="source-evidence-reasoning">
        <Typography variant="bodySmall" tone="muted">模型回答示例</Typography>
        <div className="source-evidence-wrong"><Heading>回答：有两把红伞</Heading></div>
        <div className="source-evidence-details"><UmbrellaEvidence red/><UmbrellaEvidence red={false}/></div>
        <div className="source-evidence-supported"><Typography variant="bodySmall" tone="accent">两把伞，只有一把是红色</Typography><Typography variant="h3">依据画面：一把红伞。</Typography></div>
        <div className="source-evidence-checks"><Typography variant="bodySmall" tone="accent">核对回答</Typography><Typography variant="bodySmall">① 检查颜色　② 检查数量　③ 定位图像依据</Typography></div>
      </section>
    </div>
    <div className="source-evidence-definition"><Typography variant="body" tone="accent">视觉幻觉</Typography><div><Typography variant="body">回答与图像不一致。核对颜色、数量和位置；无法确认时保留不确定。</Typography><Typography variant="bodySmall" tone="muted">可能与视觉信息读取不足或语言先验有关；本例无法确定具体原因。</Typography></div></div>
  </div>;
}
import { useState } from "react";

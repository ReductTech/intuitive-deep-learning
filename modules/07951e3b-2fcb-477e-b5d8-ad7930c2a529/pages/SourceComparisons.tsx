import { Typography } from "@shuku/course-style/react";
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
  return <div shuku-edit-id="e-4ab6a9c1-ab67-4bfa-9d5f-79c4a94ab15e" className="source-context-lesson">
    <section shuku-edit-id="e-2931d3c9-4786-4986-af51-226b6eba5d1d" className="source-context-column">
      <Heading>CNN：逐层获得更大范围</Heading>
      <div shuku-edit-id="e-40722969-7493-4069-ab2f-d3fdc6df5abf" className="source-cats">
        {[
          ['眼周局部','近处纹理'],
          ['加入邻域','眼睛与耳朵'],
          ['更大范围','更多身体轮廓'],
        ].map(([label,detail],i)=><div shuku-edit-id="e-cff7459b-df1e-4d1d-9b47-f435b68efb65" key={label}>
          <div shuku-edit-id="e-5622d721-aa61-4ee9-a237-432112e28e8b" className="source-cat" role="img" aria-label={label} style={{backgroundImage:`url(${cat})`,backgroundPosition:`${i*50}% center`}}/>
          <Typography shuku-edit-id="e-f8a2cdb7-ed47-4665-b90a-997cf8d0462e" variant="body">{label}</Typography>
          <Typography shuku-edit-id="e-6a10e9af-d5d3-46de-8337-593ac307c49c" variant="bodySmall" tone="muted">{detail}</Typography>
        </div>)}
      </div>
      <Typography shuku-edit-id="e-0dab40d3-8afa-47f9-9c69-c6a30c4268f5" variant="bodySmall" tone="muted">同一位置逐层融合邻域特征；裁切仅示意范围，不是每层重新裁切输入。</Typography>
    </section>
    <section shuku-edit-id="e-61a2ccb6-75c8-4539-82ea-432d6f6287e7" className="source-context-column">
      <Heading>ViT：当前图块可联系全图</Heading>
      <div shuku-edit-id="e-f2f0e384-acad-42d1-a37c-80fa6c504486" className="source-context-global">
        <div shuku-edit-id="e-ceab789a-fc87-4729-a476-e64e11bae89d" className="source-cat source-context-cat" role="img" aria-label="同一只猫，当前眼下图块直接连接眼睛、耳朵与身体轮廓，连线为教学示意" style={{backgroundImage:`url(${cat})`,backgroundPosition:'100% center'}}>
          <svg shuku-edit-id="e-481bb56a-f8db-4035-9339-66dd98676a0b" viewBox="0 0 200 300" aria-hidden="true">
            {[[100,140],[70,90],[94,249]].map(([x,y],i)=><g shuku-edit-id="e-f96cb564-e869-4fbb-9626-96988a63f745" key={i}><path shuku-edit-id="e-41ed2209-a436-46af-b4c9-e059a7e5a558" d={`M90 197 L${x} ${y}`} fill="none" stroke="var(--ui-accent-alt)" strokeWidth="3"/><rect shuku-edit-id="e-4d74a671-a1df-438b-b54e-7ff46f7bae35" x={x-10} y={y-10} width="20" height="20" fill="none" stroke="var(--ui-accent)" strokeWidth="2"/></g>)}
            <rect shuku-edit-id="e-5682e76e-73e4-4276-833c-226976442b51" x="78" y="185" width="24" height="24" fill="none" stroke="var(--ui-accent-alt)" strokeWidth="3"/>
          </svg>
        </div>
        <div shuku-edit-id="e-5dc1b7df-c4eb-4323-9541-07be5da13d29" className="source-context-meaning">
          <Typography shuku-edit-id="e-59324481-7b93-4008-898f-81cc61eb8ecc" variant="body" tone="accent">当前图块</Typography>
          <Typography shuku-edit-id="e-c27cd808-dde3-44a5-a810-6f89375e78d8" variant="body" tone="muted">↓ 可直接联系</Typography>
          <Tokens labels={['眼睛','耳朵','身体轮廓']}/>
          <Typography shuku-edit-id="e-1fef5112-5241-4e9f-b4ad-1f7f0c4716d0" variant="bodySmall">关注哪些位置，由训练学习。</Typography>
        </div>
      </div>
      <Typography shuku-edit-id="e-60b010d8-408f-4231-a47f-fc51f5b2742e" variant="bodySmall" tone="muted">连线为教学示意；可连接不代表一定关注。</Typography>
    </section>
  </div>;
}

export function RelationsComparison() {
  const local=[[244,160],[269,194],[260,145],[269,108]];
  return <div shuku-edit-id="e-aa77adb0-abbe-4a63-8f4c-1f301cb71b99" className="source-relations-lesson">
    <section shuku-edit-id="e-78151311-8fc2-4174-99ef-c1ca898ee6bc" className="source-relations-column">
      <Heading>CNN：沿邻域逐层传递</Heading>
      <div shuku-edit-id="e-25ef0cd8-ed3b-4388-9e45-90b13d788c93" className="vit-umbrella-scene">
        <img shuku-edit-id="e-b16c28f5-2e1f-4653-a790-01bd6a99627b" src={umbrellas} alt="五位女孩与五把伞，女孩 B 是左数第二位"/>
        <svg shuku-edit-id="e-a29d27b2-145d-49e6-8598-4faf87224781" viewBox="0 0 640 427" aria-hidden="true">
          <polyline shuku-edit-id="e-5b6fb0cd-e6db-491c-88e8-43a401c75d3d" points={local.map(p=>p.join(',')).join(' ')} fill="none" stroke="var(--ui-accent-alt)" strokeWidth="5"/>
          {local.map(([x,y],i)=><circle shuku-edit-id="e-d4fb8618-a93f-4308-8256-a4a3b2fa46ae" key={i} cx={x} cy={y} r="9" fill="var(--ui-bg-card)" stroke="var(--ui-accent-alt)" strokeWidth="3"/>)}
        </svg>
      </div>
      <Text>女孩 B → 手 → 伞柄 → 蓝伞</Text>
      <Typography shuku-edit-id="e-9f0635b4-ceb6-4b65-ac9a-a1bb3db08386" variant="bodySmall" tone="muted">对象链是空间路径类比，非执行顺序。</Typography>
    </section>
    <section shuku-edit-id="e-da5d987d-c92d-41de-ae9f-961c420bb4e7" className="source-relations-column">
      <Heading>ViT：比较关联，按权重汇入</Heading>
      <div shuku-edit-id="e-b383be6b-a9bc-4743-be9f-96c92f2195bf" className="vit-umbrella-scene">
        <img shuku-edit-id="e-69e0fac2-f79f-4113-875f-247fba2c6539" src={umbrellas} alt="同一位女孩 B，与蓝伞、条纹伞和白伞建立联系"/>
        <svg shuku-edit-id="e-da3377a1-6d18-4a41-af63-371200a5040a" viewBox="0 0 640 427" aria-hidden="true">
          <path shuku-edit-id="e-7a279da7-6494-491f-8459-2e838963a247" d="M244 160 Q220 95 269 108" fill="none" stroke="var(--ui-accent-alt)" strokeWidth="8"/>
          <path shuku-edit-id="e-b419ea25-a0d8-4b31-9a99-07d7e9d86634" d="M244 160 Q325 65 404 110" fill="none" stroke="var(--ui-accent)" strokeWidth="3"/>
          <path shuku-edit-id="e-59949066-8669-47ad-9186-02bcffb7935c" d="M244 160 Q390 32 515 95" fill="none" stroke="var(--ui-accent)" strokeWidth="1.5" strokeDasharray="6 4"/>
          <rect shuku-edit-id="e-5255d591-161e-4a71-9aea-4c968052843a" x="231" y="147" width="26" height="26" fill="none" stroke="var(--ui-accent-alt)" strokeWidth="3"/>
        </svg>
      </div>
      <div shuku-edit-id="e-38289754-a5e4-48e6-a08b-2b251e66792a" className="source-relation-legend"><Typography shuku-edit-id="e-23ff86c5-b69c-48ba-8a47-6a9c05b06071" variant="body" tone="accent">蓝伞：汇入更多</Typography><Typography shuku-edit-id="e-20c69a12-bace-46f5-bacc-306d62c52b6b" variant="body">其他伞：汇入较少</Typography></div>
      <Typography shuku-edit-id="e-727099b7-237c-4375-b1bd-c1a3fd9eebca" variant="bodySmall" tone="muted">线越粗，示意权重越大；不是模型实测。</Typography>
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
  return <div shuku-edit-id="e-323a3e58-e18c-4fa1-9863-2aafed2e7946" className="clip-feedback-objectives" ref={sequence.hostRef}>
    <section shuku-edit-id="e-6e6a7047-9574-4416-9666-35f4cd6fd462" className="clip-feedback-stack">
      <Heading>Caption：预测目标句子的词</Heading>
      <div shuku-edit-id="e-17e10a71-528d-4fc4-96ee-73ab33780067" className="source-caption-photo"><ImageFocus/></div>
      <div shuku-edit-id="e-f0faecb0-204e-4902-b9af-a773649ae4ac" className="clip-feedback-generation">
        <Typography shuku-edit-id="e-6b088c9f-9a14-4bca-89f8-6584598cf0b3" variant="body">前文：女孩与龙猫{sequence.step===2?'站在':''}</Typography>
        <Typography shuku-edit-id="e-c0733f29-2648-411b-b376-e7c943415344" variant="body" tone="accent">↓ 图像 + 前文 → 生成模型</Typography>
        <Typography shuku-edit-id="e-99b78e1b-db1b-4d6b-8a7f-a7a8a764c2e3" variant="body">下一片段：{sequence.step===0?'待预测':sequence.step===1?'站在':'雨中'}</Typography>
      </div>
      <Typography shuku-edit-id="e-863af1f2-5ba1-49c7-9bd3-8cae245ee39b" variant="bodySmall">训练给正确前文，可并行算损失。<br shuku-edit-id="e-fd2345b6-d072-46da-8413-80e49e1a8dc4"/>推理追加生成片段，逐步预测。</Typography>
      <StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="前文 → 预测 → 追加"/>
    </section>
    <section shuku-edit-id="e-85b4ec8f-3c8e-4e71-9a19-8a3443b6edef" className="clip-feedback-stack">
      <Heading>CLIP：学习整批图文配对</Heading>
      <table shuku-edit-id="e-db38ad84-f941-4720-9032-bd22a09a1912" className="clip-feedback-matrix" aria-label="三张图片与三段描述的九种配对">
        <thead shuku-edit-id="e-ccf597f4-ec69-4328-b474-1e45aee2403c"><tr shuku-edit-id="e-bff3ee79-34d7-4b09-bd80-c4737ad1d1cb"><th shuku-edit-id="e-9e26f4ac-0bf5-4d3a-bc71-e0322a745450"><Typography shuku-edit-id="e-c8fda63c-6ce7-41ae-a1c9-2e7d235e9e94" variant="bodySmall">图 / 文</Typography></th>{['雨中场景','草地小狗','街边红车'].map((caption,i)=><th shuku-edit-id="e-23f3e3c3-563c-4c72-a00b-cc1b7b3e6993" scope="col" key={caption} aria-label={captions[i]}><Typography shuku-edit-id="e-81005df2-a03e-4f24-be38-e14c66973def" variant="bodySmall">{caption}</Typography></th>)}</tr></thead>
        <tbody shuku-edit-id="e-e0577322-b36f-44d2-8011-64e00581f2ac">{names.map((name,i)=><tr shuku-edit-id="e-bc0c8b64-4d70-4d8d-a862-f232a2b147b9" key={name}><th shuku-edit-id="e-8706e406-8e77-4ee3-bec3-5f82370a4535" scope="row"><SourceCrop src={pairedSourceImage} rect={rects[i]} alt={name+'图片'}/></th>{names.map((caption,j)=><td shuku-edit-id="e-0a186c2b-9da1-424d-ace8-9cf2a707d77d" key={caption}><button shuku-edit-id="e-9d796c5b-f7a0-4fe8-ac4a-bd95721fec4b" className={`clip-feedback-button ${i===j?'is-positive':''}`} aria-pressed={cell===i*3+j} aria-label={`${name}图片与${captions[j]}，${i===j?'正配对':'批内非配对'}`} onClick={()=>setCell(i*3+j)}><Typography shuku-edit-id="e-6b180056-2913-431d-8290-511b08c67f43" variant="bodySmall">{i===j?'正配对':'非配对'}</Typography></button></td>)}</tr>)}</tbody>
      </table>
      <div shuku-edit-id="e-5c30444f-14f2-4d4a-b682-9228f46be7f4" className="clip-feedback-cell" aria-live="polite"><SourceCrop src={pairedSourceImage} rect={rects[row]} alt={`选中图片：${names[row]}`}/><div shuku-edit-id="e-5c336575-9a8f-43f3-b9e3-e50991249b98"><Typography shuku-edit-id="e-5fcc2eb1-0a85-4807-8c28-7483b1b0543c" variant="bodySmall">↔ “{captions[column]}”</Typography><Typography shuku-edit-id="e-31b16274-48c1-4824-b782-ec5a51ffe1c2" variant="bodySmall" tone="accent">{row===column?'正配对：这句话就是该图的训练描述。':'负样本：这句话属于本批另一张图，而非当前图的配对描述。'}</Typography></div></div>
      <Typography shuku-edit-id="e-ab42828e-7072-49e8-9572-0aafecd34069" variant="bodySmall" tone="muted">3 个正配对、6 个批内非配对。非配对可能是假负样本。</Typography>
    </section>
  </div>;
}
function UmbrellaEvidence({ red }: { red:boolean }) {
  const region=red?{x:.26,y:.47,w:.30,h:.25}:{x:.51,y:0,w:.30,h:.25};
  return <div shuku-edit-id="e-c10e3de4-7ea6-4df5-bd57-3f5f46ac0c90" className={`source-evidence-detail ${red?'is-red':''}`}>
    <div shuku-edit-id="e-04d3de78-798c-42fc-8ee8-f07db4ef3d27" className="source-evidence-crop" role="img" aria-label={red?'放大女孩的红色伞面':'放大龙猫上方的深色伞面'} style={{aspectRatio:'1920 / 865',backgroundImage:`url(${rainImage})`,backgroundSize:`${100/region.w}% ${100/region.h}%`,backgroundPosition:`${region.x/(1-region.w)*100}% ${region.y/(1-region.h)*100}%`}}/>
    <Typography shuku-edit-id="e-2121ac08-d217-4d23-8b0c-953f815b8911" variant="body" align="center">{red?'红色伞面':'深色伞面'}</Typography>
  </div>;
}
export function EvidenceComparison() {
  return <div shuku-edit-id="e-faa1ac11-8550-4888-8ac3-18bbf0d55e4a" className="source-evidence-lesson">
    <div shuku-edit-id="e-92158a1b-f3e7-4f77-b8b3-4af24b6289a2" className="source-evidence-layout">
      <section shuku-edit-id="e-cf90112e-8980-428e-bf38-f5fa1b7968b0" className="source-evidence-photo">
        <Heading>画面里有几把红伞？</Heading>
        <ImageFocus><div shuku-edit-id="e-66023775-761f-4cbd-b034-048c8e792fe7" className="source-evidence-region is-red" style={{left:'30%',top:'53%',width:'20%',height:'25%'}} aria-label="女孩手中的红伞"/><div shuku-edit-id="e-6126717c-6294-48a4-b6ce-ec81009a5ad0" className="source-evidence-region" style={{left:'54%',top:'2%',width:'27%',height:'20%'}} aria-label="龙猫上方的深色伞"/></ImageFocus>
        <Typography shuku-edit-id="e-0c673c1e-0d42-4f22-848f-22ba74618272" variant="bodySmall" tone="muted">右侧放大两处伞面，核对颜色。</Typography>
      </section>
      <section shuku-edit-id="e-f4e2cd99-cd70-46e7-9a9c-cd9e1999ea83" className="source-evidence-reasoning">
        <Typography shuku-edit-id="e-51063792-9b2c-4898-8525-1f2b083b6ced" variant="bodySmall" tone="muted">模型回答示例</Typography>
        <div shuku-edit-id="e-f6405b73-9120-4ef8-baba-66d61efdb8a1" className="source-evidence-wrong"><Heading>回答：有两把红伞</Heading></div>
        <div shuku-edit-id="e-abac1b78-a92b-44f3-aa4f-4c92b7fb7f0b" className="source-evidence-details"><UmbrellaEvidence red/><UmbrellaEvidence red={false}/></div>
        <div shuku-edit-id="e-7e041e5a-6675-424c-9dad-090a0d9018db" className="source-evidence-supported"><Typography shuku-edit-id="e-13a3551a-f830-4826-8cd1-fab0a87f9910" variant="bodySmall" tone="accent">两把伞，只有一把是红色</Typography><Typography shuku-edit-id="e-6ff95f9c-d999-42ec-8444-99400f637642" variant="h3">依据画面：一把红伞。</Typography></div>
        <div shuku-edit-id="e-a6c40cdd-598a-47c5-a8a9-f9355f244bc8" className="source-evidence-checks"><Typography shuku-edit-id="e-6b7591ff-4abd-4d09-b629-ac91ed6ce653" variant="bodySmall" tone="accent">核对回答</Typography><Typography shuku-edit-id="e-2aff307f-b532-49be-b1d7-95eedd43c8fa" variant="bodySmall">① 检查颜色　② 检查数量　③ 定位图像依据</Typography></div>
      </section>
    </div>
    <div shuku-edit-id="e-513bc596-5d37-429b-9b2a-f8685b577f0b" className="source-evidence-definition"><Typography shuku-edit-id="e-e6720e25-b0ae-4086-8695-8908ce751d8b" variant="body" tone="accent">视觉幻觉</Typography><div shuku-edit-id="e-608ff96d-c2f1-4f82-bbe6-3df879837a99"><Typography shuku-edit-id="e-045b05c0-ff47-4797-a926-4019cfe12ca9" variant="body">回答与图像不一致。核对颜色、数量和位置；无法确认时保留不确定。</Typography><Typography shuku-edit-id="e-563b2027-cc7e-4e1f-87c0-693bb77254ce" variant="bodySmall" tone="muted">可能与视觉信息读取不足或语言先验有关；本例无法确定具体原因。</Typography></div></div>
  </div>;
}
import { useState } from "react";

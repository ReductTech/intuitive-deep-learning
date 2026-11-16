import { EmbeddingExperiment, AttentionExperiment } from "./VitExperiments";
import { vitPaperImage as paperFigure, spatialComparisonImage as spatial, catContextImage, pairedSourceImage } from '../media';
import { ContextComparison, RelationsComparison } from "./SourceComparisons";
import { Typography } from "@shuku/course-style/react";
import { StepSequenceControl, useStepSequence, Equation, Heading, PatchGrid, Photo, Text } from "../components/LessonVisuals";
import { Patch, Features, SourceCrop } from "../components/TeachingVisuals";
import { patchStats } from "../model/teachingMath";
import "./VitPages.css";
import "./ViTFeedback.css";

function PatchSizeBody() {
  return <div shuku-edit-id="e-8bb9cff7-506d-45f9-8515-6aa1f22f778f" className="vit-patch-static">
    <Text>224×224 图像：若每个像素占一个 Token，会有 50,176 个。</Text>
    <div shuku-edit-id="e-0c215f80-62d7-445d-91ee-25ce9beb2a05" className="vit-patch-examples">
      {[8,16,32].map(p=>{
        const stats=patchStats(224,p);
        return <section shuku-edit-id="e-c8b996f4-d3af-4433-a502-afd94eaa4ec6" key={p} className="vit-patch-example">
          <Heading>{p}×{p} 像素一块</Heading>
          <Photo square><PatchGrid side={stats.side}/></Photo>
          <Typography shuku-edit-id="e-1e5e9c1d-9ba0-4ae1-9893-1c86ccd2cb7a" variant="body" tone="accent">{stats.side}×{stats.side} 块 = {stats.tokens} 个 Token</Typography>
        </section>;
      })}
    </div>
    <div shuku-edit-id="e-af4b6d07-dcd8-44dd-933f-1197f1e1adb0" className="vit-feedback-cost">
      <Typography shuku-edit-id="e-c97bcc2c-faca-4988-8a0b-6e09a445c29f" variant="body">N = (H/P)(W/P)；每个 Token 与其他 Token 比较，分数格数为 N²（不含 CLS）。</Typography>
      <Equation latex={'P:16\\to32\\qquad N:196\\to49\\qquad N^2:196^2=38416\\;\\to\\;49^2=2401'} label="块边长16变32，Token数196变49，分数格数38416变2401"/>
      <Typography shuku-edit-id="e-d7066782-5bce-434b-901c-8c5b36974e3d" variant="bodySmall" tone="accent">块边长加倍：Token 数为 1/4，分数格数为 1/16；划分更粗，不等于实际运行快 16 倍。</Typography>
    </div>
  </div>;
}function PatchifyBody() {
  const sequence=useStepSequence(16);
  const selected=Math.min(sequence.step,15);
  const row=Math.floor(selected/14), col=selected%14;
  const windowStart=Math.max(0,selected-2);
  return <div shuku-edit-id="e-ef74d187-e3b3-4d36-b125-ee0e41bb8c86" className="vit-reading-lesson" ref={sequence.hostRef} data-patch={selected+1}>
    <div shuku-edit-id="e-9b44f0ed-8bfe-4cac-9759-3007f956f515" className="vlm-two">
      <div shuku-edit-id="e-c4ee5b2b-f1a5-4608-84d2-ea0871243902" className="vlm-stack">
        <Heading>固定 16×16：14 行 × 14 列</Heading>
        <Photo square><PatchGrid side={14}/><div shuku-edit-id="e-c9e0d84d-7134-4a54-a528-5190268d789e" className="vit-reading-marker" aria-hidden="true" style={{left:`${col/14*100}%`,top:`${row/14*100}%`,width:`${100/14}%`,height:`${100/14}%`}}/></Photo>
        <Text>从左到右读完一行，再读下一行。</Text>
      </div>
      <div shuku-edit-id="e-63794169-aa29-4ecb-873d-5e873a713ee5" className="vlm-stack">
        <Heading>同一块，放到序列中的同一位置</Heading>
        <div shuku-edit-id="e-8d0a0734-acfa-4cf5-bd23-311c4ec098ef" className="tv-horizontal"><Patch index={selected} size={140}/><div shuku-edit-id="e-db0cf33d-996e-4579-837f-b07a7f49cf5e"><Heading>第 {selected+1} 块</Heading><Text>第 {row+1} 行，第 {col+1} 列</Text><Text>16 × 16 × 3 像素</Text></div></div>
        <div shuku-edit-id="e-9b53a984-1237-4eed-86e4-1d5efcf558a1" className="vit-filmstrip">{[0,1,2,3,4].map(offset=>{const i=windowStart+offset;return <div shuku-edit-id="e-57c2659d-2276-4054-bab8-988209e389d0" key={i} className={i===selected?'is-current':''}><Patch index={i} size={74}/><Text>{i+1}</Text></div>;})}</div>
        <Text>196 个图块按顺序排列，还未变成 D 维向量。</Text>
        <Equation latex={'224\\times224\\times3\\rightarrow196\\times(16\\times16\\times3)'} label="图像切成一百九十六个十六乘十六乘三的图块"/>
      </div>
    </div>
    <StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="按行读取逐步演示"/>
  </div>;
}
function PositionBody() {
  const content=[1.5,3.5,2.5];
  return <div shuku-edit-id="e-f4aaba67-04c6-4adb-8925-0a9ef801b348" className="vit-position-lesson">
    <div shuku-edit-id="e-91e6b95a-3049-4634-9b3f-866719de4709" className="vit-position-example">
      <section shuku-edit-id="e-93607576-952c-4d6b-83b2-31fc6a1bf4f7" className="vit-position-meaning">
        <Heading>相同内容，位置会改变关系</Heading>
        <div shuku-edit-id="e-9a6f976d-dafc-471e-8a2d-142bf48bc2ba" className="vit-position-scenes">{['位置 A','位置 B'].map((label,i)=><div shuku-edit-id="e-c534b4ce-0f8d-4c06-a397-d4cef09ad5e7" className="vit-position-scene" key={label}><div shuku-edit-id="e-40c63b16-bad7-4274-8d0c-0fcb4ea22ca8" className="vit-position-art" role="img" aria-label={label+'的空间关系示意'} style={{backgroundImage:`url(${spatial})`,backgroundPosition:`${i*100}% center`}}/><Typography shuku-edit-id="e-2f8ee581-bfed-421b-a178-2702a26553ef" variant="body">{label}</Typography></div>)}</div>
        <Text>同一内容，位置不同，输入向量也不同。</Text>
      </section>
      <section shuku-edit-id="e-503fe039-81bd-4dca-8964-bb67131d5ad9" className="vit-position-compute">
        <Heading>沿用第 7 页的同一内容向量</Heading>
        <Equation latex={`c=[${content.join(',')}]`} label="同一图块的内容向量为一点五、三点五、二点五"/>
        {[{index:1,pos:[.1,.2,.3]},{index:4,pos:[.5,.1,.2]}].map(({index,pos})=><div shuku-edit-id="e-44608b03-ee13-4fd2-81bb-e093c8278752" className="vit-position-placement" key={index}>
          <div shuku-edit-id="e-29dfdd6e-86ec-47db-ae48-3fa20196caa7" className="vit-position-demo-grid" role="img" aria-label={`同一个示意图块放到二维网格的位置${index}`}>{[1,2,3,4].map(i=><div shuku-edit-id="e-d0f47ced-e488-43d9-9344-c238f0fa608b" key={i} className={i===index?'is-content':''}>{i===index?<div shuku-edit-id="e-ee19bed8-6e4d-497b-9fda-e0d53d17282c" className="vit-position-pixel-values">{[1,2,3,4].map(value=><Typography shuku-edit-id="e-c845c711-3646-4fdb-b069-05698cc7c148" key={value} variant="bodySmall" tone="inherit">{value}</Typography>)}</div>:null}</div>)}</div>
          <div shuku-edit-id="e-4189904c-1564-43d8-b966-619d185a9446"><Typography shuku-edit-id="e-26bcae9c-69f4-45c1-8fc8-9be1f70b0446" variant="bodySmall" tone="accent">位置 {index}：使用该位置的 D 维向量</Typography><Equation latex={`\\begin{aligned}e_${index}&=[${pos.join(',')}]\\\\z_${index}&=c+e_${index}=[${content.map((v,d)=>(v+pos[d]).toFixed(1)).join(',')}]\\end{aligned}`} label={`位置${index}的向量为${pos.join('、')}，内容c逐元素相加后得到输入z${index}：${content.map((v,d)=>(v+pos[d]).toFixed(1)).join('、')}`}/></div>
        </div>)}
        <Typography shuku-edit-id="e-531a5e95-488f-4d8a-b568-9c1ee7badc58" variant="bodySmall">内容不变，位置不同，Encoder 收到的向量不同。</Typography>
      </section>
    </div>
    <Typography shuku-edit-id="e-e0d280c3-05d4-47fe-8785-6c03f3ca8f01" variant="bodySmall" tone="muted">教学示意：位置向量是可学习的，真实 ViT 在 D 维向量上逐元素相加。</Typography>
  </div>;
}

function VitPipelineBody() {
  const patches=[0,78,195];
  return <div shuku-edit-id="e-9756517c-4b79-45eb-8092-dad4ddba7f33" className="vit-overview">
    <div shuku-edit-id="e-b32399f1-c0bd-409d-bbb2-d31b8efd16fc" className="vit-overview-flow">
      <section shuku-edit-id="e-9db29df0-73c9-4d4d-9a4c-47bd1126596f" className="vit-overview-image">
        <Heading>图像切块</Heading>
        <Photo square><PatchGrid side={14}/></Photo>
        <Equation latex={'224\\times224\\times3'} label="图像尺寸224乘224乘3"/>
        <Typography shuku-edit-id="e-bb791a69-84ab-497c-97be-5bd98a2f8edd" variant="bodySmall">196 个图块</Typography>
      </section>
      <Typography shuku-edit-id="e-f438eb43-3262-47e4-8013-cc29a5b68481" className="vit-overview-arrow" variant="h3" tone="muted" aria-hidden="true">→</Typography>
      <section shuku-edit-id="e-3048b323-ab96-480d-a440-59958dd1ba5f" className="vit-overview-input">
        <Heading>图块变成向量</Heading>
        <div shuku-edit-id="e-e005d43b-156c-444f-9610-82a8c513ca67" className="vit-overview-patches">{patches.map((index,i)=><div shuku-edit-id="e-0b40aa3e-9a84-4f2f-b22f-4d00040e9ed9" key={index}><Patch index={index} size={74}/><Typography shuku-edit-id="e-f617f46b-de39-474e-aa17-afe7a2ca3b79" variant="bodySmall" align="center">{[1,79,196][i]}</Typography></div>)}</div>
        <Typography shuku-edit-id="e-fd606cb7-6569-4e82-b573-a7cacd1dbf4f" variant="bodySmall" align="center">↓ 投影、拼接 CLS、加位置</Typography>
        <div shuku-edit-id="e-f72b52d5-3092-475e-90ba-9088a8857ae4" className="vit-overview-sequence" role="group" aria-label="初始CLS与196个图块向量，橙色CLS不对应图块">
          <div shuku-edit-id="e-0d172450-3bce-4aec-aecd-7815b9fd0720" className="vit-overview-vector is-cls"><Typography shuku-edit-id="e-d5af99f7-3291-4655-9908-cd5f7eedd76d" variant="bodySmall" tone="accent">CLS</Typography><Features rows={1} cols={6} orange seed={1}/></div>
          {[1,79,196].map((n,i)=><div shuku-edit-id="e-dd431be8-54b7-4368-a0eb-99067110e39a" className="vit-overview-vector" key={n}><Typography shuku-edit-id="e-295cd105-d950-427c-bbd7-7ff82868bfe3" variant="bodySmall">P{n}</Typography><Features rows={1} cols={6} seed={i+1}/></div>)}
        </div>
        <Typography shuku-edit-id="e-c37cbeeb-3355-4913-9034-3e30ac8e6ef7" variant="bodySmall" tone="accent">CLS（分类 Token）：额外的可学习起始向量，不对应图块。</Typography>
      </section>
      <Typography shuku-edit-id="e-ac915a9b-8c3c-493a-8a17-bdd8536edfe6" className="vit-overview-arrow" variant="h3" tone="muted" aria-hidden="true">→</Typography>
      <section shuku-edit-id="e-d9040141-498e-4d89-aa9d-a89346083d63" className="vit-overview-encode">
        <Heading>编码 12 层</Heading>
        <div shuku-edit-id="e-95a57f32-cd79-409d-bbe6-881d0afab981" className="vit-overview-layer-stack" role="img" aria-label="12层Transformer编码器示意，每层保持197个Token，通过注意力交换信息">
          <div shuku-edit-id="e-9cc53bc7-059b-4d34-9966-29c5fe10b683" className="vit-overview-layer-back back-two"/>
          <div shuku-edit-id="e-73e70244-b8c7-40ea-9277-77f4ea9e3c30" className="vit-overview-layer-back back-one"/>
          <div shuku-edit-id="e-4ffbbba9-bf7a-474a-9f45-1c41486d959b" className="vit-overview-layer">
            <Typography shuku-edit-id="e-e694c6b4-2359-40ab-ac49-e8f0779d9462" variant="body" align="center" tone="accent">Attention</Typography>
            <div shuku-edit-id="e-c34d82dc-196d-48ea-b9b5-7914769a1893" className="vit-overview-attention-picture">
              <div shuku-edit-id="e-c058d03b-a067-4cec-a835-b99124e57105" className="vit-overview-mini-vectors">{[0,1,2].map(i=><Features key={i} rows={1} cols={5} orange={i===0} seed={i}/>)}</div>
              <svg shuku-edit-id="e-04f75c20-631e-45d3-9824-b769171df5b9" viewBox="0 0 100 120" aria-hidden="true">{[0,1,2].flatMap(i=>[0,1,2].map(j=><path shuku-edit-id="e-93f4b9c2-23de-4c9e-b708-e41a89da9fe7" key={`${i}-${j}`} d={`M0 ${20+i*40} C45 ${20+i*40},55 ${20+j*40},100 ${20+j*40}`} className={j===0?'is-cls':''}/>))}</svg>
              <div shuku-edit-id="e-69eca4c4-ebfb-4cb9-8c86-a9b4fc27f08e" className="vit-overview-mini-vectors">{[0,1,2].map(i=><Features key={i} rows={1} cols={5} orange={i===0} seed={i+7}/>)}</div>
            </div>
            <Typography shuku-edit-id="e-720e1a13-c987-4c3d-856e-a3762fb29a29" variant="bodySmall" align="center" tone="muted">↓</Typography>
            <div shuku-edit-id="e-62882472-3499-4b0d-a6d1-9352577ec172" className="vit-overview-mlp"><Typography shuku-edit-id="e-3532464c-e481-44dc-bb8e-c5b40c61ad0f" variant="body" align="center" tone="accent">MLP</Typography><div shuku-edit-id="e-bc7fbb40-12ad-40b1-b096-5c13b9299a08" className="vit-overview-mlp-vectors">{[0,1,2].map(i=><Features key={i} rows={1} cols={6} orange={i===0} seed={i+4}/>)}</div></div>
          </div>
        </div>
        <Equation latex={'197\\times768\\;\\to\\;197\\times768'} label="每层编码前后仍为197个Token，每个768维"/>
        <Typography shuku-edit-id="e-b9b687a3-6269-4c93-82cf-31663d6a2af6" variant="bodySmall" align="center">MLP：对每个 Token 独立加工的前馈网络。</Typography>
      </section>
      <Typography shuku-edit-id="e-7793d448-ffe5-4663-8bf8-1e28e3526716" className="vit-overview-arrow is-cls" variant="h3" tone="accent" aria-hidden="true">→</Typography>
      <section shuku-edit-id="e-c9af850f-9952-4d21-9787-60495db498f2" className="vit-overview-output">
        <Heading>只取最终 CLS</Heading>
        <Typography shuku-edit-id="e-f88ff7ac-81ec-4818-b7fa-09218e18b2fb" variant="bodySmall">多层注意力汇入图块信息后，用于分类读出。</Typography>
        <div shuku-edit-id="e-44ba9030-69e7-4b62-889a-6afc563518b0" className="vit-overview-final-cls"><Typography shuku-edit-id="e-b86d70af-7ad1-4ca4-9cff-5fc0fbb2f3b6" variant="body" tone="accent">CLS</Typography><Features rows={1} cols={6} orange seed={9}/></div>
        <svg shuku-edit-id="e-1129bb7e-0813-4993-860e-101e9e357383" className="vit-overview-down" viewBox="0 0 40 24" aria-hidden="true"><path shuku-edit-id="e-b1ac9142-c993-48fb-b154-e033605adf12" d="M20 0V20M13 13L20 20L27 13"/></svg>
        <div shuku-edit-id="e-ce1c3ba0-390f-4209-8576-79938d653174" className="vit-overview-head"><Typography shuku-edit-id="e-631cadc4-7bcf-41d6-873b-b87af9a87dd5" variant="body" align="center">分类头</Typography></div>
        <svg shuku-edit-id="e-858b063e-31e0-42c7-bdb5-e59c158497f1" className="vit-overview-down" viewBox="0 0 40 24" aria-hidden="true"><path shuku-edit-id="e-0fefdb7a-c8aa-4c40-b215-9f31e634b7f7" d="M20 0V20M13 13L20 20L27 13"/></svg>
        <div shuku-edit-id="e-c5806e2b-2247-4d8a-8e21-ddedf060b5ea" className="vit-overview-class-scores" role="group" aria-label="猫狗汽车三个固定输出通道，未展示预测数值">{['猫','狗','汽车'].map((label,i)=><div shuku-edit-id="e-42682d8c-d295-4dc8-bf0b-e42dfa5ccf34" key={label}>{i===0?<div shuku-edit-id="e-2844916c-e542-4eb6-a503-f38cb8d555e2" className="vit-overview-class-photo" role="img" aria-label="猫类别示意图" style={{backgroundImage:`url(${catContextImage})`}}/>:<SourceCrop src={pairedSourceImage} rect={i===1?[47,417,306,156]:[47,588,306,161]} alt={label+'类别示意图'}/>}<Typography shuku-edit-id="e-2e25bcfa-b855-4355-9f68-6d1773d89990" variant="bodySmall" align="center">{label}</Typography></div>)}</div>
        <Typography shuku-edit-id="e-b4bca64b-5509-4152-b0f0-af4147f89fc9" variant="bodySmall" align="center">类别分数（示意）</Typography>
      </section>
    </div>
    <div shuku-edit-id="e-01bff49e-2060-4a66-af31-7064fedf6dd6" className="vit-overview-caption"><Typography shuku-edit-id="e-f63ba12c-43dd-4e54-85e2-28c9785f9950" variant="bodySmall" tone="muted">ViT-B/16 结构示意 · 橙色为额外 CLS；省略归一化与残差。</Typography><a shuku-edit-id="e-3eca281a-ab39-4b56-82af-5c8903bf30a3" href={paperFigure} target="_blank" rel="noreferrer"><Typography shuku-edit-id="e-e1de4950-b2f8-4afa-9c93-2746fab79a29" as="span" variant="bodySmall">原论文架构图 ↗</Typography></a></div>
  </div>;
}
export const vitLessons = {
  context: {
    Body: ContextComparison,
    mission: "比较同一处局部纹理，CNN 与 ViT 分别怎样取得更大范围的信息。",
    takeaway: "CNN 扩大邻域；ViT 从全图选线索。",
    note: "沿用原稿猫的局部到整体图像；图块、连线与对象标签都是教学示意。卷积的空间感受野随层数和结构变化，自注意力允许当前 Token 与全图 Token 直接关联。可关联不代表训练后一定产生强权重，也不保证卷积需要固定层数才能辨认对象。具体注意力计算在第九页展开。",
  },
  relations: {
    Body: RelationsComparison,
    mission: "沿着女孩 B 的手和伞柄追踪，比较局部传播与全图相关性加权。",
    takeaway: "全图可连接；哪些信息汇入更多，由注意力权重决定。",
    note: "原图包含五位女孩与五把伞，B 为左数第二位蓝裙女孩。CNN 对象链只是空间传播路径的类比，不是模型按人物、手、伞柄依次执行。ViT 连线粗细只表示构造的相对注意力权重，不是模型实测。权重用于汇入 Value 信息，不是伞归属的分类概率；实际图像 Token 是图块，不预先对应完整语义对象。下一页转向输入构造：全图直接联系要求控制 Token 数量，继而解释切块。",
  },
  "patch-size": {
    Body: PatchSizeBody,
    mission: "同时比较三种 Patch 边长，理解切块如何缩短输入序列。",
    takeaway: "块边长加倍 → Token 数变为 1/4；空间划分也更粗。",
    note: "示意输入为 224×224，块为不重叠正方形，H/W 均被 P 整除；统计不含 CLS。8/16/32 边长对应 784/196/49 个图块。每个像素当 Token 的比较只是输入长度对比，通道值仍须共同编码。注意力分数矩阵随 N² 变化，但 N² 不是总 FLOPs 或实际耗时；注意力的具体计算在第九页解释。下一页固定 P=16，跟踪其中一个图块怎样进入序列。",
  },
  patchify: {
    Body: PatchifyBody,
    mission: "逐步追踪图块按行编号，观察一行读完后怎样进入下一行。",
    takeaway: "每个位置仍是一块像素；接着把它变成等长的向量。",
    note: "图像中心正方形裁切示意；224×224 输入，P=16，按行编号。",
  },
  embedding: {
    Body: EmbeddingExperiment,
    mission: "逐列查看计算，核对每个输出维度怎样由整块图的像素值计算出来。",
    takeaway: "同一个 E 投影每块；E 的一列算出 Token 的一维。",
    note: "从第六页的像素块进入投影过程。为看清逐项乘加，将图块简化成 2×2 单通道，像素按行取 1、2、3、4；共享投影 E 为 4×3 的构造权重，得到 1.5、3.5、2.5。每列与全部输入像素做点积，得到一个输出维度。逐步高亮只表示讲解当前列，不表示线性层实际串行计算。真实 16×16×3 图块展平为 768 维，投影到 D 维；投影是可训练的。",
  },
  position: {
    Body: PositionBody,
    mission: "追踪同一图块移到不同位置时，内容不变而位置向量改变。",
    takeaway: "内容向量＋位置向量：既带着内容，也带着它在图中的位置。",
    note: "对象级内容是教学类比，不能声称两幅真实图片的全部 Patch 内容相同。真实 ViT 为每个 Patch 序列位置加入可学习位置嵌入；后续网络仍须学习空间关系。",
  },
  "attention-cls": {
    Body: AttentionExperiment,
    mission: "看女孩区域怎样根据匹配权重，汇入其他区域的信息。",
    takeaway: "Q 与 K 算出权重，权重加权 V，得到汇入的信息。",
    note: "区域级教学示意，非单个 Patch 的精确可解释语义，权重条不是实测。输入 X 分别通过 W_Q、W_K、W_V 投影得到 Q、K、V；QKᵀ 得到分数，逐行 softmax 后再加权 V。只画两个来源，真实自注意力包含自身及 CLS。参考 Attention Is All You Need §3.2.1。",
  },
  "vit-pipeline": {
    Body: VitPipelineBody,
    mission: "顺着四个阶段核对 196、197 与最终 1 个 CLS 分别指什么。",
    takeaway: "像素变成序列，序列交换信息，最终 CLS 进入分类头。",
    note: "以 ViT-B/16 为例：P=16、D=768、L=12，224×224 输入含 CLS 后为 197×768。ViT 原式先对 Patch 投影，再拼接可学习 CLS，给整段序列加位置，经含归一化、注意力、MLP 和残差的多层编码器，最终从 CLS 读出。示例分类头仅列猫、狗、汽车，与下一页沿用同一类别表；不是原始预训练类别表或模型实测输出。类别名由训练时的标签定义，不是 ViT 编码器自动生成。",
  },
};






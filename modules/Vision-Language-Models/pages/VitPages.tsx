import { EmbeddingExperiment, AttentionExperiment } from "./VitExperiments";
import { vitPaperImage as paperFigure, spatialComparisonImage as spatial, catContextImage, pairedSourceImage } from '../media';
import { ContextComparison, RelationsComparison } from "./SourceComparisons";
import { Typography } from "../../shared/react";
import { StepSequenceControl, useStepSequence, Equation, Heading, PatchGrid, Photo, Text } from "../components/LessonVisuals";
import { Patch, Features, SourceCrop } from "../components/TeachingVisuals";
import { patchStats } from "../model/teachingMath";
import "./VitPages.css";
import "./ViTFeedback.css";

function PatchSizeBody() {
  return <div className="vit-patch-static">
    <Text>224×224 图像：若每个像素占一个 Token，会有 50,176 个。</Text>
    <div className="vit-patch-examples">
      {[8,16,32].map(p=>{
        const stats=patchStats(224,p);
        return <section key={p} className="vit-patch-example">
          <Heading>{p}×{p} 像素一块</Heading>
          <Photo square><PatchGrid side={stats.side}/></Photo>
          <Typography variant="body" tone="accent">{stats.side}×{stats.side} 块 = {stats.tokens} 个 Token</Typography>
        </section>;
      })}
    </div>
    <div className="vit-feedback-cost">
      <Typography variant="body">N = (H/P)(W/P)；每个 Token 与其他 Token 比较，分数格数为 N²（不含 CLS）。</Typography>
      <Equation latex={'P:16\\to32\\qquad N:196\\to49\\qquad N^2:196^2=38416\\;\\to\\;49^2=2401'} label="块边长16变32，Token数196变49，分数格数38416变2401"/>
      <Typography variant="bodySmall" tone="accent">块边长加倍：Token 数为 1/4，分数格数为 1/16；划分更粗，不等于实际运行快 16 倍。</Typography>
    </div>
  </div>;
}function PatchifyBody() {
  const sequence=useStepSequence(16);
  const selected=Math.min(sequence.step,15);
  const row=Math.floor(selected/14), col=selected%14;
  const windowStart=Math.max(0,selected-2);
  return <div className="vit-reading-lesson" ref={sequence.hostRef} data-patch={selected+1}>
    <div className="vlm-two">
      <div className="vlm-stack">
        <Heading>固定 16×16：14 行 × 14 列</Heading>
        <Photo square><PatchGrid side={14}/><div className="vit-reading-marker" aria-hidden="true" style={{left:`${col/14*100}%`,top:`${row/14*100}%`,width:`${100/14}%`,height:`${100/14}%`}}/></Photo>
        <Text>从左到右读完一行，再读下一行。</Text>
      </div>
      <div className="vlm-stack">
        <Heading>同一块，放到序列中的同一位置</Heading>
        <div className="tv-horizontal"><Patch index={selected} size={140}/><div><Heading>第 {selected+1} 块</Heading><Text>第 {row+1} 行，第 {col+1} 列</Text><Text>16 × 16 × 3 像素</Text></div></div>
        <div className="vit-filmstrip">{[0,1,2,3,4].map(offset=>{const i=windowStart+offset;return <div key={i} className={i===selected?'is-current':''}><Patch index={i} size={74}/><Text>{i+1}</Text></div>;})}</div>
        <Text>196 个图块按顺序排列，还未变成 D 维向量。</Text>
        <Equation latex={'224\\times224\\times3\\rightarrow196\\times(16\\times16\\times3)'} label="图像切成一百九十六个十六乘十六乘三的图块"/>
      </div>
    </div>
    <StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="按行读取逐步演示"/>
  </div>;
}
function PositionBody() {
  const content=[1.5,3.5,2.5];
  return <div className="vit-position-lesson">
    <div className="vit-position-example">
      <section className="vit-position-meaning">
        <Heading>相同内容，位置会改变关系</Heading>
        <div className="vit-position-scenes">{['位置 A','位置 B'].map((label,i)=><div className="vit-position-scene" key={label}><div className="vit-position-art" role="img" aria-label={label+'的空间关系示意'} style={{backgroundImage:`url(${spatial})`,backgroundPosition:`${i*100}% center`}}/><Typography variant="body">{label}</Typography></div>)}</div>
        <Text>同一内容，位置不同，输入向量也不同。</Text>
      </section>
      <section className="vit-position-compute">
        <Heading>沿用第 7 页的同一内容向量</Heading>
        <Equation latex={`c=[${content.join(',')}]`} label="同一图块的内容向量为一点五、三点五、二点五"/>
        {[{index:1,pos:[.1,.2,.3]},{index:4,pos:[.5,.1,.2]}].map(({index,pos})=><div className="vit-position-placement" key={index}>
          <div className="vit-position-demo-grid" role="img" aria-label={`同一个示意图块放到二维网格的位置${index}`}>{[1,2,3,4].map(i=><div key={i} className={i===index?'is-content':''}>{i===index?<div className="vit-position-pixel-values">{[1,2,3,4].map(value=><Typography key={value} variant="bodySmall" tone="inherit">{value}</Typography>)}</div>:null}</div>)}</div>
          <div><Typography variant="bodySmall" tone="accent">位置 {index}：使用该位置的 D 维向量</Typography><Equation latex={`\\begin{aligned}e_${index}&=[${pos.join(',')}]\\\\z_${index}&=c+e_${index}=[${content.map((v,d)=>(v+pos[d]).toFixed(1)).join(',')}]\\end{aligned}`} label={`位置${index}的向量为${pos.join('、')}，内容c逐元素相加后得到输入z${index}：${content.map((v,d)=>(v+pos[d]).toFixed(1)).join('、')}`}/></div>
        </div>)}
        <Typography variant="bodySmall">内容不变，位置不同，Encoder 收到的向量不同。</Typography>
      </section>
    </div>
    <Typography variant="bodySmall" tone="muted">教学示意：位置向量是可学习的，真实 ViT 在 D 维向量上逐元素相加。</Typography>
  </div>;
}

function VitPipelineBody() {
  const patches=[0,78,195];
  return <div className="vit-overview">
    <div className="vit-overview-flow">
      <section className="vit-overview-image">
        <Heading>图像切块</Heading>
        <Photo square><PatchGrid side={14}/></Photo>
        <Equation latex={'224\\times224\\times3'} label="图像尺寸224乘224乘3"/>
        <Typography variant="bodySmall">196 个图块</Typography>
      </section>
      <Typography className="vit-overview-arrow" variant="h3" tone="muted" aria-hidden="true">→</Typography>
      <section className="vit-overview-input">
        <Heading>图块变成向量</Heading>
        <div className="vit-overview-patches">{patches.map((index,i)=><div key={index}><Patch index={index} size={74}/><Typography variant="bodySmall" align="center">{[1,79,196][i]}</Typography></div>)}</div>
        <Typography variant="bodySmall" align="center">↓ 投影、拼接 CLS、加位置</Typography>
        <div className="vit-overview-sequence" role="group" aria-label="初始CLS与196个图块向量，橙色CLS不对应图块">
          <div className="vit-overview-vector is-cls"><Typography variant="bodySmall" tone="accent">CLS</Typography><Features rows={1} cols={6} orange seed={1}/></div>
          {[1,79,196].map((n,i)=><div className="vit-overview-vector" key={n}><Typography variant="bodySmall">P{n}</Typography><Features rows={1} cols={6} seed={i+1}/></div>)}
        </div>
        <Typography variant="bodySmall" tone="accent">CLS（分类 Token）：额外的可学习起始向量，不对应图块。</Typography>
      </section>
      <Typography className="vit-overview-arrow" variant="h3" tone="muted" aria-hidden="true">→</Typography>
      <section className="vit-overview-encode">
        <Heading>编码 12 层</Heading>
        <div className="vit-overview-layer-stack" role="img" aria-label="12层Transformer编码器示意，每层保持197个Token，通过注意力交换信息">
          <div className="vit-overview-layer-back back-two"/>
          <div className="vit-overview-layer-back back-one"/>
          <div className="vit-overview-layer">
            <Typography variant="body" align="center" tone="accent">Attention</Typography>
            <div className="vit-overview-attention-picture">
              <div className="vit-overview-mini-vectors">{[0,1,2].map(i=><Features key={i} rows={1} cols={5} orange={i===0} seed={i}/>)}</div>
              <svg viewBox="0 0 100 120" aria-hidden="true">{[0,1,2].flatMap(i=>[0,1,2].map(j=><path key={`${i}-${j}`} d={`M0 ${20+i*40} C45 ${20+i*40},55 ${20+j*40},100 ${20+j*40}`} className={j===0?'is-cls':''}/>))}</svg>
              <div className="vit-overview-mini-vectors">{[0,1,2].map(i=><Features key={i} rows={1} cols={5} orange={i===0} seed={i+7}/>)}</div>
            </div>
            <Typography variant="bodySmall" align="center" tone="muted">↓</Typography>
            <div className="vit-overview-mlp"><Typography variant="body" align="center" tone="accent">MLP</Typography><div className="vit-overview-mlp-vectors">{[0,1,2].map(i=><Features key={i} rows={1} cols={6} orange={i===0} seed={i+4}/>)}</div></div>
          </div>
        </div>
        <Equation latex={'197\\times768\\;\\to\\;197\\times768'} label="每层编码前后仍为197个Token，每个768维"/>
        <Typography variant="bodySmall" align="center">MLP：对每个 Token 独立加工的前馈网络。</Typography>
      </section>
      <Typography className="vit-overview-arrow is-cls" variant="h3" tone="accent" aria-hidden="true">→</Typography>
      <section className="vit-overview-output">
        <Heading>只取最终 CLS</Heading>
        <Typography variant="bodySmall">多层注意力汇入图块信息后，用于分类读出。</Typography>
        <div className="vit-overview-final-cls"><Typography variant="body" tone="accent">CLS</Typography><Features rows={1} cols={6} orange seed={9}/></div>
        <svg className="vit-overview-down" viewBox="0 0 40 24" aria-hidden="true"><path d="M20 0V20M13 13L20 20L27 13"/></svg>
        <div className="vit-overview-head"><Typography variant="body" align="center">分类头</Typography></div>
        <svg className="vit-overview-down" viewBox="0 0 40 24" aria-hidden="true"><path d="M20 0V20M13 13L20 20L27 13"/></svg>
        <div className="vit-overview-class-scores" role="group" aria-label="猫狗汽车三个固定输出通道，未展示预测数值">{['猫','狗','汽车'].map((label,i)=><div key={label}>{i===0?<div className="vit-overview-class-photo" role="img" aria-label="猫类别示意图" style={{backgroundImage:`url(${catContextImage})`}}/>:<SourceCrop src={pairedSourceImage} rect={i===1?[47,417,306,156]:[47,588,306,161]} alt={label+'类别示意图'}/>}<Typography variant="bodySmall" align="center">{label}</Typography></div>)}</div>
        <Typography variant="bodySmall" align="center">类别分数（示意）</Typography>
      </section>
    </div>
    <div className="vit-overview-caption"><Typography variant="bodySmall" tone="muted">ViT-B/16 结构示意 · 橙色为额外 CLS；省略归一化与残差。</Typography><a href={paperFigure} target="_blank" rel="noreferrer"><Typography as="span" variant="bodySmall">原论文架构图 ↗</Typography></a></div>
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






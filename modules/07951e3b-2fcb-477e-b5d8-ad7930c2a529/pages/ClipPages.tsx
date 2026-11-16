import { ContrastiveExperiment, EnsembleExperiment } from "./ClipExperiments";
import { PairedSupervision, ZeroShotPipeline, ClipCandidateComparison, ClipTextVector } from "./SourceAlignment";
import { TrainingObjectiveComparison } from "./SourceComparisons";

import { Typography } from "@shuku/course-style/react";

import { Heading, Text, useStepSequence, StepSequenceControl } from "../components/LessonVisuals";
import { ImageFocus } from "../components/TeachingVisuals";

import "./ClipPages.css";
import "./ClipFeedback.css";

function FixedClassesBody() {

  return (
    <div shuku-edit-id="e-29ed6c7e-0234-45f8-9f41-f8a3c805675e" className="vlm-two">
      <div shuku-edit-id="e-62e3e0e6-7e15-4fc9-82ad-eed1ba0e74de" className="vlm-stack">
        <Heading>测试时：图中出现“龙猫角色”</Heading>
        <ImageFocus region={{ x: 49, y: 7, w: 31, h: 85 }} />
      </div>
      <div shuku-edit-id="e-e4e0ac39-5525-4d10-a47c-0104cb744dbf" className="vlm-stack clip-fixed-right">
        <Heading>训练时：分类头只学了 3 类</Heading>
        <div shuku-edit-id="e-347924f1-b253-4905-8e43-279548ccda9f" className="clip-head clip-fixed-head">
          {["猫", "狗", "汽车"].map((label, i) => (
            <div shuku-edit-id="e-85179a43-cc1b-4633-8126-6354e2599be8" className="clip-weight-row" key={label}>
              <Text>{label}</Text>
              <Text>第 {i + 1} 组分类权重</Text>
            </div>
          ))}

        </div>
        <Text>分类头只有这三个输出通道。</Text>
        <Typography shuku-edit-id="e-449dbfab-db70-486b-84f3-126f9be0b21c" variant="body" tone="accent">类别表外：龙猫角色，没有对应分类权重。</Typography>
      </div>
    </div>
  );
}

function DynamicClassifierBody() {
  const sequence=useStepSequence(3), stage=sequence.step;
  return <div shuku-edit-id="e-1ec9e449-46bf-4d31-b498-ce5da94ff261" className="clip-feedback-inference" data-clip-stage={stage} ref={sequence.hostRef}>
    <div shuku-edit-id="e-9a8fe72c-aafa-4c72-a2fc-2c3166d2bc8e" className="clip-inference-main">
      <section shuku-edit-id="e-99393327-7dec-4deb-8366-3f6bfabb7ef0" className="clip-caption-source"><Heading>已有的配对 Caption</Heading><div shuku-edit-id="e-a5f1768f-54af-4929-b2f3-23ff81a61a54" className="clip-caption-photo"><ImageFocus/></div><Text>女孩撑着红伞，与龙猫站在雨中。</Text><div shuku-edit-id="e-1b26ae43-ffb9-4c52-9985-8fc2cb19da00" className="clip-caption-encoding"><Typography shuku-edit-id="e-2ffbf0ee-1591-485c-b46f-9fa620b1db7a" variant="bodySmall" tone="accent">文本编码器 → 一个文本向量</Typography><ClipTextVector seed={1}/></div></section>
      <section shuku-edit-id="e-defdff13-3a80-4a71-b405-ef5a634c66c8" className="clip-feedback-candidates"><Heading>匹配时提供的开放文本</Heading><Typography shuku-edit-id="e-21fe6ea0-9ece-49d9-ab76-dfa19f3296f5" variant="bodySmall" tone="muted">{stage===0?'① 提供候选描述。':'② 同一个已训练文本编码器：每段文字 → 一个向量。'}</Typography><ClipCandidateComparison vectors={stage>=1}/><Typography shuku-edit-id="e-162529f9-fc45-490f-9fcc-8a7acef01efa" variant="h3" tone="accent" className={stage<2?'clip-feedback-hidden':''}>保留 T1、T2、T3，下一页加入 I</Typography></section>
    </div>
    <div shuku-edit-id="e-db0d15c6-c143-46fb-8010-333f198811c8" className="clip-feedback-check"><Typography shuku-edit-id="e-45b10a12-ea39-4736-a91a-7c28982a3833" variant="bodySmall" tone="muted">左侧 Caption 来自训练配对；右侧候选由使用者提供。色块只示意向量结构。</Typography></div>
    <div shuku-edit-id="e-ac0ca3ec-7897-44b5-ad5d-66bf50fe9467" className="clip-feedback-bottom"><Typography shuku-edit-id="e-74fc9962-ae52-4be4-a364-2d52443836a7" variant="bodySmall" tone="muted">保持编码器参数不变，把开放文字变为可比较的向量。</Typography><StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="候选 → 编码 → 保留"/></div>
  </div>;
}
export const clipLessons = {
  "fixed-classes": {
    Body: FixedClassesBody,
    mission: "对照图中对象和固定类别表，理解训练类别决定输出通道。",
    takeaway: "输出空间固定时，新增类别需要新的分类权重。",
  },
  "dual-encoder": {
    Body: PairedSupervision,
    mission: "同屏追踪三对图片和自然语言描述，各自通过编码器形成可比较的向量。",
    takeaway: "监督从固定类别变成图文配对，两个编码器学习共同表示。",
    note: "沿用原稿的雨景、小狗、汽车图文对。图片和文字由两套编码器独立编码，通过各自投影与归一化进入共同表示空间；I/T 点的位置只作配对目标示意，不显示模型实测。已知配对提供训练目标，并不保证未训练的向量已经正确对齐。下一页沿用同一三对关系，使用 one-hot 代理输入与小型线性编码器计算一次更新。",
  },
  "contrastive-loss": {
    Body: ContrastiveExperiment,
    mission: "让一个 batch 经过双编码器，执行参数更新，观察配对相似度与损失怎样变化。",
    takeaway: "损失指导两套编码器更新参数，重新编码后再比较。",
    note: "沿用雨景、小狗、汽车三对图文，内容以 one-hot 代理输入替代。两套 3×3 线性编码器经归一化形成余弦分数，温度为 0.4，计算整批行列交叉熵平均，用有限差分得到损失梯度并更新两套参数，再重新计算向量、相似度和损失。画面中的色块表示参数及输出向量，更新时两套参数与向量都变化；右侧并列显示重算前后的余弦分数。推导留在讲者备注：文本参数 W11 从 0.300 变为约 0.469，梯度约 -0.677，学习率 0.25。实际教学函数更新全矩阵，不是只修改显示分数。使用上一步、下一步查看一次更新，最终状态停留。非真实 CLIP 架构、数据或参数；CLIP 通常通过自动微分训练，并学习温度。",
  },
  "batch-negatives": {
    Body: TrainingObjectiveComparison,
    mission: "区分生成目标词的训练与选择正确图文配对的训练，数出同一三对数据产生的正负样本。",
    takeaway: "Caption 学习词的预测；CLIP 学习整批图文的配对关系。",
    note: "可能存在假负样本。Caption 推理逐 Token 生成；训练可用 teacher forcing 并行计算。",
  },
  "dynamic-classifier": {
    Body: DynamicClassifierBody,
    mission: "对照配对Caption与匹配时使用者提供的开放文本，说明文本向量的来源。",
    takeaway: "开放候选得到 T1、T2、T3；下一页继续用它们与图像向量 I 比较。",
    note: "按用户最新要求对照两种文本来源。左侧Caption指图文训练中与图片配对的一条自然语言描述，送入文本编码器得到向量；右侧为已训练CLIP在匹配时使用者提供的候选文本，分别编码成T1/T2/T3。这里不是把Caption生成模型画成整句向量分类器；CLIP的图文训练同样可使用caption配对。开放文本不代表输出不受词表或上下文长度约束，也不表示模型已见过或能准确识别所有概念。下一页用右侧三个候选与图像向量比较。",
  },
  "zero-shot": {
    Body: ZeroShotPipeline,
    mission: "沿同一图像与三段候选描述的两条路径，读出一次完整 Zero-shot 分类。",
    takeaway: "在给定候选中选择最高相似度，不需要为本任务重新训练。",
    note: "相似度为教学预设，非概率；Zero-shot 不意味着预训练未见相关概念。",
  },
  "prompt-ensemble": {
    Body: EnsembleExperiment,
    mission: "比较同一类别的三个表述，观察文本向量怎样在空间中取平均。",

    takeaway: "Prompt 改变比较语境；多个表述在向量空间里集成。",
    note: "人工二维向量，集成实时计算；不保证每次都提高准确率。",
  },
};




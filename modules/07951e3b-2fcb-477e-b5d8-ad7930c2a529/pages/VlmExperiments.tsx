import { type CSSProperties } from 'react';
import { Typography } from "@shuku/course-style/react";
import { StepSequenceControl, Heading, Text, Tokens, useStepSequence } from '../components/LessonVisuals';
import { Features, ImageFocus } from '../components/TeachingVisuals';
import { jointConnectorStep } from '../model/teachingMath';
import './Experiments.css';
import './VlmFeedback.css';

export function ConnectorExperiment() {
  const sequence=useStepSequence(5), stage=sequence.step;
  const nodes=[
    {name:'视觉输入',shape:'1024 维',seed:295,detail:'编码器输出的一行特征'},
    {name:'第一层 Linear',shape:'1024 → 4096',seed:296,detail:'使用共享参数扩展宽度'},
    {name:'GELU',shape:'4096 → 4096',seed:297,detail:'逐元素非线性变换'},
    {name:'第二层 Linear',shape:'4096 → 4096',seed:298,detail:'组合变换后的特征'},
    {name:'接口输出',shape:'4096 维',seed:298,detail:'作为一个视觉位置送入 LLM'}
  ];
  const explanations=[
    '固定追踪位置 295。输入共有 576 行；这里放大其中一行。',
    '第一层把这一行从 1024 维扩展到 4096 维；其他位置也使用同一套参数。',
    '为什么需要 GELU？只叠加线性层仍可合并为一个线性层；GELU 增加非线性表达能力。',
    '第二层继续变换同一位置的特征；宽度仍是 4096，不会把位置 295 合并到其他位置。',
    '576×1024 → 576×4096：位置数保持不变。宽度匹配只是接口，参数仍需通过训练学习对齐。'
  ];
  return <div shuku-edit-id="e-c4785a68-25df-4007-8823-8f65de930aee" className="vlm-connector-trace" ref={sequence.hostRef} data-connector-stage={stage}>
    <Typography shuku-edit-id="e-cfd4c787-2283-4ec9-9984-26c46390a128" variant="body" tone="accent">LLaVA-1.5-7B · 同一批 576 个位置，每行从 1024 维映射到 4096 维</Typography>
    <div shuku-edit-id="e-c1c6c808-ebeb-4f95-9c8a-af048ec464ba" className="vlm-connector-trace-nodes">{nodes.map((node,i)=><section shuku-edit-id="e-2a8cdd20-14bf-4355-af38-802003cd4214" key={node.name} className="vlm-trace-node" data-revealed={i<=stage} data-current={i===stage} aria-hidden={i>stage}>
      <Typography shuku-edit-id="e-5797e602-b215-4a85-b779-1f6fd6dcddfb" variant="body" tone={i===stage?'accent':'main'}>{i+1}. {node.name}</Typography>
      <Typography shuku-edit-id="e-73d2108c-edee-4108-b10b-2b41023f10f4" variant="bodySmall">位置 295</Typography><Features rows={1} cols={i===0?6:8} seed={node.seed} orange={i>0}/>
      <Typography shuku-edit-id="e-a3f6136d-c736-4ed8-babe-1909761078c8" variant="body">{node.shape}</Typography><Typography shuku-edit-id="e-a7188efe-52b0-4900-a8e2-e80c834fc2cf" variant="bodySmall">{node.detail}</Typography>
      {i<4&&<Typography shuku-edit-id="e-f0cc0c73-a662-4754-b4f8-4b9d7cb46a2e" className="vlm-trace-arrow" variant="body" aria-hidden="true">→</Typography>}
    </section>)}</div>
    <div shuku-edit-id="e-6fe8ab9b-8983-4f7e-89eb-9fe05f54f2a2" className="vlm-connector-explanation" role="status"><Text>{explanations[stage]}</Text>{stage>=2&&<Typography shuku-edit-id="e-c4edd411-73e2-4697-8a6a-94ab7f04f2dc" variant="bodySmall" tone="accent">GELU 不改变宽度；让两层映射不再等价于单次线性变换。</Typography>}</div>
    <Typography shuku-edit-id="e-845bda0c-a68b-420c-8eda-04af92dcd18e" variant="bodySmall" tone="muted">本页只解决输入宽度；第 25 页用回答损失训练映射。色块仅示结构，不表示模型已能正确回答。</Typography><StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="查看 Connector 映射"/>
  </div>;
}

export function ContextExperiment() {
  const sequence=useStepSequence(6), generated=Math.min(sequence.step,5);
  const pieces=['女孩','撑着红伞，','与龙猫','站在','雨中。'];
  return <div shuku-edit-id="e-e2f1ef48-1968-491e-bca2-a1dfc3c7e307" className="exp-context-lesson" ref={sequence.hostRef} data-generated={generated} style={{'--generation-play':'paused'} as CSSProperties}>
    <div shuku-edit-id="e-3f814c42-4539-4d48-9a50-8783228f2c9d" className="exp-context-intro"><Typography shuku-edit-id="e-c7bb3328-1d25-4151-a0aa-e3f2e296149f" variant="body" tone="accent">每一步都以视觉、问题和已生成回答为条件，预测下一片段。</Typography><StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="自回归生成示意"/></div>
    <div shuku-edit-id="e-f2286627-1093-41b3-82b3-831fa60904ea" className="exp-context-main">
      <section shuku-edit-id="e-745b9521-1d17-4d55-9491-52522d50e00a" className="exp-context-input"><Heading>当前上下文</Heading><div shuku-edit-id="e-6bdd659d-cc5b-4512-9dd9-1a670df2b6a0" className="exp-context-part"><Typography shuku-edit-id="e-4941dbb9-b63f-4437-8fa9-b4da98e181f8" variant="bodySmall">来自第 22 页：映射后的视觉向量</Typography><div shuku-edit-id="e-1f22de23-8a1b-4bad-9ae2-83aa1f7070b7" className="exp-context-visual"><Tokens labels={['z₁','z₂₉₅','…','z₅₇₆']}/></div></div><div shuku-edit-id="e-db41f805-8de4-456d-b496-dcf5894e4d0c" className="exp-context-part"><Typography shuku-edit-id="e-3264dc0b-68a5-42a0-ab7f-b98b992f2562" variant="bodySmall">问题文字的向量 · 分段示意</Typography><Tokens labels={['图中','发生了','什么？']}/></div><div shuku-edit-id="e-d92ce91d-9446-4417-9426-ffef3b0ffbfd" className="exp-context-part"><Typography shuku-edit-id="e-8517a796-8870-47d5-a8a4-a666b3df1876" variant="bodySmall" tone="accent">已生成的回答 · 参与下一步预测</Typography><div shuku-edit-id="e-c4be608d-dec2-4df5-8455-229b176ec6ba" className="exp-context-answer" aria-label={`已生成 ${generated} 个回答片段`}>{generated===0?<Typography shuku-edit-id="e-39244174-9beb-4863-9dcb-0ddd23c15f78" variant="bodySmall">尚无回答，先预测第一片段。</Typography>:pieces.slice(0,generated).map((piece,i)=><Typography shuku-edit-id="e-5e067b0f-15a3-4fb5-a369-be1bb1f62c44" key={piece} variant="bodySmall" className={i===generated-1?'exp-context-piece is-latest':'exp-context-piece'}>{piece}</Typography>)}</div></div></section>
      <section shuku-edit-id="e-deb9151b-9048-4480-9481-7f05563cfabb" className="exp-context-model"><Heading>语言模型</Heading><div shuku-edit-id="e-45a3ab4e-62de-4459-9943-b321d2a6858d"><Typography shuku-edit-id="e-6f66edd7-3f19-4167-8237-a03ec449cb50" variant="h3" tone="inherit">LLM</Typography></div><Typography shuku-edit-id="e-81c94682-2bc2-4604-8a94-498494f7d1e7" variant="bodySmall">读取当前上下文，预测下一个 Token。</Typography></section>
      <section shuku-edit-id="e-a26037b6-fd71-413e-ae8f-03021e9b21dc" className="exp-context-next"><Heading>{generated===5?'回答完成':'下一片段'}</Heading><div shuku-edit-id="e-24918c02-18b8-4efb-b614-0a813bd5d884" className="exp-context-next-piece"><Typography shuku-edit-id="e-3445664f-d2da-4ea8-91ef-8ed12504dcee" variant="h3" tone="accent">{pieces[generated]??'结束标记'}</Typography></div><Typography shuku-edit-id="e-bd63c8b3-049e-4a1e-9cf7-43a18861be50" variant="bodySmall">{generated===5?'结束生成，可用上一步回看。':'生成后追加到回答中，再预测下一片段。'}</Typography></section>
    </div>
    <div shuku-edit-id="e-d25b12e2-eda2-401e-a100-7d0d81d589b7" className="exp-context-feedback"><svg shuku-edit-id="e-d81f4293-07d6-433b-9cb9-1be99b467e2d" viewBox="0 0 1400 100" preserveAspectRatio="none" aria-hidden="true"><path shuku-edit-id="e-fedbe4b8-4af5-4483-9106-414c70a0ce4f" d="M1230 0V74H330V0"/><path shuku-edit-id="e-db84894f-83b5-4e50-92a8-68e81d443832" className={generated<5?'is-traveling':''} d="M1230 0V74H330V0"/><path shuku-edit-id="e-40eb7896-b21a-4c75-9774-1174fe831779" className="exp-context-return-arrow" d="M320 12L330 0L340 12"/></svg><Typography shuku-edit-id="e-4e84d924-6562-4be3-a532-4c022a273cc5" variant="bodySmall" align="center">把新片段加入上下文，再送入语言模型</Typography></div>
    <Typography shuku-edit-id="e-33dfe202-6f1b-48ee-8e6b-733d66795c79" variant="bodySmall" tone="muted">完整示意句：女孩撑着红伞，与龙猫站在雨中。按片段查看，不对应真实 tokenizer，也不是模型实测推理。</Typography>
  </div>;
}
const alignmentStep=jointConnectorStep(.2);
const instructionStep=jointConnectorStep(alignmentStep.nextWeight,alignmentStep.nextLanguageWeight,true);
export function TrainingExperiment() {
  const sequence=useStepSequence(9), cursor=sequence.step-1;
  const phase=cursor<4?0:1, beat=cursor%4+1, step=phase*5+beat;
  const training=phase===0?alignmentStep:instructionStep, updated=beat>=3, recomputed=beat>=4;
  const prediction=recomputed?training.after:training.before;

  return <div shuku-edit-id="e-2b11e48b-6be8-46bd-b809-2f726a98b822" className="exp-vlm-training" ref={sequence.hostRef} data-training-step={step} data-training-phase={phase+1} data-training-state={sequence.step}>
    <div shuku-edit-id="e-8620321f-b808-4a11-aa19-12b6b34782b2" className="exp-vlm-training-toolbar"><div shuku-edit-id="e-4b3770cf-2b6b-4987-ab5e-6ca9958bf33b" className="vlm-training-phases">{['阶段 1 · 图像描述','阶段 2 · 图像问答'].map((name,i)=><Typography shuku-edit-id="e-d2f53e29-fc25-46a3-8c25-e98ab39b2c97" key={name} variant="bodySmall" tone={i===phase?'accent':'muted'}>{name}</Typography>)}</div><div shuku-edit-id="e-514066b6-363e-4af8-9e98-7217c4088609" className="vlm-training-navigation"><StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="训练过程"/></div></div>
    <div shuku-edit-id="e-564d507a-ba6b-4f35-8675-9d7556ecb4c9" className="vlm-training-main">
      <section shuku-edit-id="e-86ce4aa7-55b6-406d-8eb2-b3dd42998c7c" className="vlm-training-sample"><Heading>{phase===0?'图像＋描述':'图像＋问答'}</Heading><ImageFocus/><Text>{phase===0?'女孩撑着红色的伞。':'女孩的伞是什么颜色？'}</Text><Typography shuku-edit-id="e-eb251a8d-e409-4c13-bfe7-e0e65f6cf697" variant="body" tone="accent">目标词：红色</Typography></section>
      <div shuku-edit-id="e-d10216ba-b8ca-4741-be2d-113c9be00c7c" className="vlm-training-process">
        <Typography shuku-edit-id="e-96286e33-ac2b-4f45-a9e4-a53c1bf4259c" variant="bodySmall" tone="accent">{phase===0?'阶段目标：用图像描述学习视觉输入接口；语言模型仍运行，但始终冻结。':'阶段目标：用视觉问答指令，让接口与语言模型共同学习如何响应问题。'}</Typography>
        <div shuku-edit-id="e-73913397-929f-4f35-8f49-d080053ccbf3" className="vlm-training-modules">{[{name:'视觉编码器',train:false,param:'保持冻结，仍提取特征'},{name:'Connector',train:true,param:beat>=3?`参数 w：${training.weight.toFixed(3)} → ${training.nextWeight.toFixed(3)}`:'等待更新'},{name:'语言模型',train:phase===1,param:phase===0?'保持冻结，参数不变':beat>=3?`参数 a：${training.languageWeight.toFixed(3)} → ${training.nextLanguageWeight.toFixed(3)}`:'等待更新'}].map((m,i)=><section shuku-edit-id="e-9c006495-6ca5-494a-86a4-be5a22cdb300" key={m.name} className={'vlm-training-module '+(m.train?'is-trainable':'is-frozen')} data-updated={m.train&&updated}><Typography shuku-edit-id="e-6575886e-d7b6-4261-931c-c934399118c3" variant="body">{m.name}</Typography><Typography shuku-edit-id="e-1d9abd96-7487-4ebb-8bfd-a5a2252da6e1" variant="bodySmall" tone={m.train?'accent':'muted'}>{m.train?'更新参数':'冻结参数'}</Typography>{m.param&&<Typography shuku-edit-id="e-283f9812-a1f7-497e-80b4-99c7c07ad501" variant="bodySmall">{m.param}</Typography>}{i<2&&<Typography shuku-edit-id="e-b1539878-f16f-4309-9bb8-fdf6f1e30e24" className="vlm-training-module-arrow" variant="body" tone="muted" aria-hidden="true">→</Typography>}</section>)}</div>
        <div shuku-edit-id="e-71699d4f-cb8b-4cbd-ae51-d2a8363f0892" className="vlm-training-results">
          {beat>=1&&<section shuku-edit-id="e-dcd258e5-2502-4ac9-8ce3-c6d2440f39b1" className="vlm-training-prediction"><Heading>{recomputed?'④ 更新后再预测':'① 预测目标词'}</Heading><div shuku-edit-id="e-1978d32a-fe50-4460-92a6-1b49658fc27f" className="exp-training-probs">{['红色（目标）','蓝色'].map((word,i)=><div shuku-edit-id="e-aeba9db8-ce1d-4e5d-9d78-97cc9f2ab8de" key={word}><div shuku-edit-id="e-567f82ea-9eae-4d12-8242-3cd6f7e60832" className="exp-training-prob-label"><Text>{word}</Text><Text>{(prediction.probabilities[i]*100).toFixed(1)}%</Text></div><div shuku-edit-id="e-8579ae92-543e-41a3-8c31-d63f27ca4c40" className="exp-training-prob-track"><i shuku-edit-id="e-cea145ac-fe94-43b7-9340-3ed64795b976" style={{width:`${prediction.probabilities[i]*100}%`}}/></div></div>)}</div></section>}
          {beat>=2&&<section shuku-edit-id="e-65820940-d041-4265-96bb-1e3fb6c6800a" className="vlm-training-loss"><Heading>{beat===2?'② 计算目标词损失':'与目标比较'}</Heading><Typography shuku-edit-id="e-e94dc5df-7cc2-4fa0-99c5-75df6b98af3f" variant="body">损失 {prediction.loss.toFixed(3)}</Typography><Typography shuku-edit-id="e-c368a7b0-2761-4e6c-ad31-429077b6bb19" variant="bodySmall" tone="muted">−ln P(红色)：目标词概率越高，损失越低。</Typography></section>}
        </div>
        <div shuku-edit-id="e-174f278f-74d7-4253-bcfe-9fe1a66a83ae" className="vlm-training-manual-steps" aria-label="当前训练过程">{['① 预测','② 算损失','③ 更新参数','④ 再预测'].map((name,i)=><Typography shuku-edit-id="e-a37d9a38-dafc-4824-a2f2-4f52a881b7b6" key={name} variant="bodySmall" tone={i===beat-1?'accent':'muted'}>{name}</Typography>)}</div>
      </div>
    </div>
    <Typography shuku-edit-id="e-fc835831-0acb-4d60-b996-8eeb5d8b6198" variant="bodySmall" tone="muted">{beat===0?'点击“下一步”预测，再按顺序观察概率、损失和参数变化。':recomputed?'已重新预测：现在显示更新后的概率。':updated?'参数已更新，当前概率仍是更新前的预测；点击“下一步”再预测，刷新结果。':'LLaVA-1.5 的冻结策略；标量参数和双词概率为教学示意，非真实模型。'}</Typography>
  </div>;
}

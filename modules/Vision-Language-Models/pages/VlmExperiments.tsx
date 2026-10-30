import { type CSSProperties } from 'react';
import { Typography } from '../../shared/react';
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
  return <div className="vlm-connector-trace" ref={sequence.hostRef} data-connector-stage={stage}>
    <Typography variant="body" tone="accent">LLaVA-1.5-7B · 同一批 576 个位置，每行从 1024 维映射到 4096 维</Typography>
    <div className="vlm-connector-trace-nodes">{nodes.map((node,i)=><section key={node.name} className="vlm-trace-node" data-revealed={i<=stage} data-current={i===stage} aria-hidden={i>stage}>
      <Typography variant="body" tone={i===stage?'accent':'main'}>{i+1}. {node.name}</Typography>
      <Typography variant="bodySmall">位置 295</Typography><Features rows={1} cols={i===0?6:8} seed={node.seed} orange={i>0}/>
      <Typography variant="body">{node.shape}</Typography><Typography variant="bodySmall">{node.detail}</Typography>
      {i<4&&<Typography className="vlm-trace-arrow" variant="body" aria-hidden="true">→</Typography>}
    </section>)}</div>
    <div className="vlm-connector-explanation" role="status"><Text>{explanations[stage]}</Text>{stage>=2&&<Typography variant="bodySmall" tone="accent">GELU 不改变宽度；让两层映射不再等价于单次线性变换。</Typography>}</div>
    <Typography variant="bodySmall" tone="muted">本页只解决输入宽度；第 25 页用回答损失训练映射。色块仅示结构，不表示模型已能正确回答。</Typography><StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="查看 Connector 映射"/>
  </div>;
}

export function ContextExperiment() {
  const sequence=useStepSequence(6), generated=Math.min(sequence.step,5);
  const pieces=['女孩','撑着红伞，','与龙猫','站在','雨中。'];
  return <div className="exp-context-lesson" ref={sequence.hostRef} data-generated={generated} style={{'--generation-play':'paused'} as CSSProperties}>
    <div className="exp-context-intro"><Typography variant="body" tone="accent">每一步都以视觉、问题和已生成回答为条件，预测下一片段。</Typography><StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="自回归生成示意"/></div>
    <div className="exp-context-main">
      <section className="exp-context-input"><Heading>当前上下文</Heading><div className="exp-context-part"><Typography variant="bodySmall">来自第 22 页：映射后的视觉向量</Typography><div className="exp-context-visual"><Tokens labels={['z₁','z₂₉₅','…','z₅₇₆']}/></div></div><div className="exp-context-part"><Typography variant="bodySmall">问题文字的向量 · 分段示意</Typography><Tokens labels={['图中','发生了','什么？']}/></div><div className="exp-context-part"><Typography variant="bodySmall" tone="accent">已生成的回答 · 参与下一步预测</Typography><div className="exp-context-answer" aria-label={`已生成 ${generated} 个回答片段`}>{generated===0?<Typography variant="bodySmall">尚无回答，先预测第一片段。</Typography>:pieces.slice(0,generated).map((piece,i)=><Typography key={piece} variant="bodySmall" className={i===generated-1?'exp-context-piece is-latest':'exp-context-piece'}>{piece}</Typography>)}</div></div></section>
      <section className="exp-context-model"><Heading>语言模型</Heading><div><Typography variant="h3" tone="inherit">LLM</Typography></div><Typography variant="bodySmall">读取当前上下文，预测下一个 Token。</Typography></section>
      <section className="exp-context-next"><Heading>{generated===5?'回答完成':'下一片段'}</Heading><div className="exp-context-next-piece"><Typography variant="h3" tone="accent">{pieces[generated]??'结束标记'}</Typography></div><Typography variant="bodySmall">{generated===5?'结束生成，可用上一步回看。':'生成后追加到回答中，再预测下一片段。'}</Typography></section>
    </div>
    <div className="exp-context-feedback"><svg viewBox="0 0 1400 100" preserveAspectRatio="none" aria-hidden="true"><path d="M1230 0V74H330V0"/><path className={generated<5?'is-traveling':''} d="M1230 0V74H330V0"/><path className="exp-context-return-arrow" d="M320 12L330 0L340 12"/></svg><Typography variant="bodySmall" align="center">把新片段加入上下文，再送入语言模型</Typography></div>
    <Typography variant="bodySmall" tone="muted">完整示意句：女孩撑着红伞，与龙猫站在雨中。按片段查看，不对应真实 tokenizer，也不是模型实测推理。</Typography>
  </div>;
}
const alignmentStep=jointConnectorStep(.2);
const instructionStep=jointConnectorStep(alignmentStep.nextWeight,alignmentStep.nextLanguageWeight,true);
export function TrainingExperiment() {
  const sequence=useStepSequence(9), cursor=sequence.step-1;
  const phase=cursor<4?0:1, beat=cursor%4+1, step=phase*5+beat;
  const training=phase===0?alignmentStep:instructionStep, updated=beat>=3, recomputed=beat>=4;
  const prediction=recomputed?training.after:training.before;

  return <div className="exp-vlm-training" ref={sequence.hostRef} data-training-step={step} data-training-phase={phase+1} data-training-state={sequence.step}>
    <div className="exp-vlm-training-toolbar"><div className="vlm-training-phases">{['阶段 1 · 图像描述','阶段 2 · 图像问答'].map((name,i)=><Typography key={name} variant="bodySmall" tone={i===phase?'accent':'muted'}>{name}</Typography>)}</div><div className="vlm-training-navigation"><StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="训练过程"/></div></div>
    <div className="vlm-training-main">
      <section className="vlm-training-sample"><Heading>{phase===0?'图像＋描述':'图像＋问答'}</Heading><ImageFocus/><Text>{phase===0?'女孩撑着红色的伞。':'女孩的伞是什么颜色？'}</Text><Typography variant="body" tone="accent">目标词：红色</Typography></section>
      <div className="vlm-training-process">
        <Typography variant="bodySmall" tone="accent">{phase===0?'阶段目标：用图像描述学习视觉输入接口；语言模型仍运行，但始终冻结。':'阶段目标：用视觉问答指令，让接口与语言模型共同学习如何响应问题。'}</Typography>
        <div className="vlm-training-modules">{[{name:'视觉编码器',train:false,param:'保持冻结，仍提取特征'},{name:'Connector',train:true,param:beat>=3?`参数 w：${training.weight.toFixed(3)} → ${training.nextWeight.toFixed(3)}`:'等待更新'},{name:'语言模型',train:phase===1,param:phase===0?'保持冻结，参数不变':beat>=3?`参数 a：${training.languageWeight.toFixed(3)} → ${training.nextLanguageWeight.toFixed(3)}`:'等待更新'}].map((m,i)=><section key={m.name} className={'vlm-training-module '+(m.train?'is-trainable':'is-frozen')} data-updated={m.train&&updated}><Typography variant="body">{m.name}</Typography><Typography variant="bodySmall" tone={m.train?'accent':'muted'}>{m.train?'更新参数':'冻结参数'}</Typography>{m.param&&<Typography variant="bodySmall">{m.param}</Typography>}{i<2&&<Typography className="vlm-training-module-arrow" variant="body" tone="muted" aria-hidden="true">→</Typography>}</section>)}</div>
        <div className="vlm-training-results">
          {beat>=1&&<section className="vlm-training-prediction"><Heading>{recomputed?'④ 更新后再预测':'① 预测目标词'}</Heading><div className="exp-training-probs">{['红色（目标）','蓝色'].map((word,i)=><div key={word}><div className="exp-training-prob-label"><Text>{word}</Text><Text>{(prediction.probabilities[i]*100).toFixed(1)}%</Text></div><div className="exp-training-prob-track"><i style={{width:`${prediction.probabilities[i]*100}%`}}/></div></div>)}</div></section>}
          {beat>=2&&<section className="vlm-training-loss"><Heading>{beat===2?'② 计算目标词损失':'与目标比较'}</Heading><Typography variant="body">损失 {prediction.loss.toFixed(3)}</Typography><Typography variant="bodySmall" tone="muted">−ln P(红色)：目标词概率越高，损失越低。</Typography></section>}
        </div>
        <div className="vlm-training-manual-steps" aria-label="当前训练过程">{['① 预测','② 算损失','③ 更新参数','④ 再预测'].map((name,i)=><Typography key={name} variant="bodySmall" tone={i===beat-1?'accent':'muted'}>{name}</Typography>)}</div>
      </div>
    </div>
    <Typography variant="bodySmall" tone="muted">{beat===0?'点击“下一步”预测，再按顺序观察概率、损失和参数变化。':recomputed?'已重新预测：现在显示更新后的概率。':updated?'参数已更新，当前概率仍是更新前的预测；点击“下一步”再预测，刷新结果。':'LLaVA-1.5 的冻结策略；标量参数和双词概率为教学示意，非真实模型。'}</Typography>
  </div>;
}

import { Typography } from '../../../shared/react';
import { AttentionActivity, Formula, LessonCheck, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { SemanticWeightTable } from '../../components/SemanticWeightTable';
import { computeSemanticSoftmax, SEMANTIC_ITEMS } from '../../model/semanticScoring';
import { AttentionReadingFlow } from '../../components/AttentionReadingFlow';
import './AttentionSoftmaxPage.css';

export function AttentionSoftmaxPage(props:ActivityProps){
  const [done,setDone]=useActivityState('C10-check',false);
  const [selected,setSelected]=useActivityState('C10-inspect',2,(v):v is number=>Number.isInteger(v)&&Number(v)>=0&&Number(v)<4);
  const calculation=computeSemanticSoftmax('where');
  const item=SEMANTIC_ITEMS[selected];
  return <AttentionActivity {...props} number={10} title="Softmax：把分数变成权重" learningFlow={<AttentionReadingFlow active="weight"/>} eyebrow="小明去了哪里？ · 四个候选" done={done} footerHeight={230} className="attn-softmax-page" footer={<LessonCheck id="C10" title="这些权重有什么共同特征？" answer="distribution" correct="权重非负，总和为 1；按 w 汇聚 V 得到结果 r。" done={done} onDone={()=>setDone(true)} options={[{value:'distribution',label:'非负，且总和为 1'},{value:'winner',label:'只保留最高的一项',wrongFeedback:'其余三项仍大于0，并没有被丢弃。'},{value:'scores',label:'等于原来的分数',wrongFeedback:'例如地点Score=2.4，归一化后权重约0.703。'}]}/>}> 
    <div className="attn-softmax-main"><Typography variant="bodySmall" tone="accent">当前 Q：小明去了哪里？ · 手设评分示意</Typography>
      <SemanticWeightTable {...calculation} selectedIndex={selected} onSelect={setSelected} hideTotals/>
      <div className="attn-softmax-calculation" aria-label="归一化规则与所选候选的计算">
        <section><Typography variant="bodySmall" tone="muted">权重 w 即 ATT，后面也记作 α</Typography><Formula label="注意力权重的归一化公式" latex={String.raw`w_i=\frac{e^{s_i}}{\sum_{j=1}^{4}e^{s_j}}`}/></section>
        <section><Typography variant="bodySmall" tone="accent">{item.label} · 读取比例</Typography><Formula label={`${item.label}的指数值除以共同分母，得到读取比例`} latex={String.raw`\frac{${calculation.exps[selected].toFixed(3)}}{${calculation.denominator.toFixed(3)}}\approx ${(calculation.weights[selected]*100).toFixed(1)}\%`}/></section>
      </div>
    </div>
  </AttentionActivity>;
}

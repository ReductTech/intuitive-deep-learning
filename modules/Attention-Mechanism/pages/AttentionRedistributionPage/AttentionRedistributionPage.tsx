import { MathFormulaStatic, Typography } from '../../../shared/react';
import { AttentionActivity, ChoiceButtons, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { SEMANTIC_ITEMS, SEMANTIC_QUERIES, computeSemanticChain, type SemanticQueryId } from '../../model/semanticScoring';
import './AttentionRedistributionPage.css';
const math=(latex:string)=><MathFormulaStatic className="attn-inline-math" latex={latex}/>;
const row=(values:readonly number[],digits=1)=>'\\begin{bmatrix}'+values.map(v=>v.toFixed(digits)).join('&')+'\\end{bmatrix}';
const values=SEMANTIC_ITEMS.map((_,i)=>SEMANTIC_ITEMS.map((_,j)=>i===j?1:0));
const dimensions=['人物','原因','地点','物品'];
export function AttentionRedistributionPage(props:ActivityProps) {
  const [task,setTask]=useActivityState<SemanticQueryId>('C12-full-task','where',(v):v is SemanticQueryId=>typeof v==='string'&&Object.hasOwn(SEMANTIC_QUERIES,v));
  const [done,setDone]=useActivityState('C12-full-done',false);
  const data=computeSemanticChain(task);
  const activeDimension=data.query.findIndex(v=>v===1);
  const output=values[0].map((_,j)=>values.reduce((sum,v,i)=>sum+data.weights[i]*v[j],0));
  return <AttentionActivity {...props} number={12} title="小明买水：注意力的完整计算" eyebrow="手工向量示例 · 维度：人物 / 原因 / 地点 / 物品" done={done} footerHeight={132}
    footer={<div className="attn-full-output"><div><Typography variant="h3">加权读取 → 结果向量</Typography><Typography variant="bodySmall" tone="muted">更突出「{SEMANTIC_QUERIES[task].answer}」，其余信息仍参与。</Typography></div><Typography variant="h3" tone="accent">{math('\\boldsymbol r=\\sum_{i=1}^{4}\\alpha_i\\boldsymbol v_i\\approx'+row(output,3))}</Typography></div>}>
    <div className="attn-full-main">
      <Typography variant="bodySmall" tone="muted">小明口渴，去商店买冰水。K 四维表示线索强度（手工设定，非概率）。</Typography>
      <div className="attn-full-query"><ChoiceButtons label="切换查询问题" options={Object.entries(SEMANTIC_QUERIES).map(([value,q])=>({value,label:q.label}))} value={task} onChange={v=>{setTask(v as SemanticQueryId);setDone(true);}}/><div className="attn-full-query-vector"><Typography variant="h3" tone="accent" title="真实模型的各维由训练学得，通常没有固定的语义名称。">{math('\\boldsymbol q='+row(data.query,0))}</Typography><Typography variant="bodySmall" tone="accent">本次匹配第 {activeDimension+1} 维：{dimensions[activeDimension]}线索</Typography></div></div>
      <div className="attn-full-table" role="table" aria-label="Q与固定K和V的完整计算">
        <div className="attn-full-row attn-full-head" role="row">
          <Typography variant="bodySmall" tone="muted" role="columnheader">句中信息</Typography>
          <div role="columnheader"><Typography variant="bodySmall">{math('\\boldsymbol k_i')} · 匹配索引</Typography><div className="attn-full-dimensions">{dimensions.map((d,i)=><Typography key={d} variant="bodySmall" tone={i===activeDimension?'accent':'muted'}>{d}</Typography>)}</div></div>
          <div role="columnheader"><Typography variant="bodySmall">匹配分数</Typography><Typography variant="bodySmall" tone="accent">{math('s_i=\\frac{\\boldsymbol q^{\\mathsf T}\\boldsymbol k_i}{\\sqrt{4}}')}</Typography></div>
          <div role="columnheader"><Typography variant="bodySmall">读取比例</Typography><Typography variant="bodySmall" tone="accent">{math('\\alpha_i=\\frac{e^{s_i}}{\\sum_j e^{s_j}}')}</Typography></div>
          <Typography variant="bodySmall" role="columnheader">{math('\\boldsymbol v_i')} · 读取内容</Typography>
        </div>
        {SEMANTIC_ITEMS.map((item,i)=><div className={'attn-full-row'+(i===data.bestIndex?' is-focused':'')} role="row" key={item.id}>
          <Typography role="cell" variant="h3">{item.value}</Typography>
          <Typography role="cell" variant="bodySmall">{math(row(item.key))}</Typography>
          <Typography role="cell" variant="h3">{math(data.rawScores[i].toFixed(1)+'\\div2='+data.scores[i].toFixed(2))}</Typography>
          <div className="attn-full-weight" role="cell" aria-label={item.value+'读取比例'+(data.weights[i]*100).toFixed(1)+'%'}><div className="attn-full-track" aria-hidden="true"><i style={{width:(data.weights[i]*100)+'%'}}/></div><Typography variant="h3" tone="accent">{(data.weights[i]*100).toFixed(1)}%</Typography></div>
          <Typography role="cell" variant="bodySmall">{math(row(values[i],0))}</Typography>
        </div>)}
      </div>
    </div>
  </AttentionActivity>;
}

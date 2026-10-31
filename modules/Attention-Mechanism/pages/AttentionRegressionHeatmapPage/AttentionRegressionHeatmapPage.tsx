import { MathFormulaStatic, RangeControl, Typography } from '../../../shared/react';
import { AttentionActivity, LessonCheck, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { AttentionHeatmap, WeightStrip } from '../../components/AttentionHeatmap';
import { ATTENTION_DATASET, ATTENTION_BEFORE_HEATMAP, ATTENTION_AFTER_HEATMAP, attentionHeatmapComparison, attentionQueryRowIndex, regressionPriceYuan } from '../../model/attentionRegression';
import './AttentionRegressionHeatmapPage.css';
import '../../components/AttentionRange.css';
const beforeMatrix=ATTENTION_BEFORE_HEATMAP.map(row=>row.weights);const afterMatrix=ATTENTION_AFTER_HEATMAP.map(row=>row.weights);
const rowLabels=ATTENTION_BEFORE_HEATMAP.map(row=>row.query.toFixed(1));const columnLabels=ATTENTION_DATASET.train.map((_,i)=>String(i+1));const positions=ATTENTION_DATASET.train.map(s=>s.x);
export function AttentionRegressionHeatmapPage(props:ActivityProps){
 const[q,setQ]=useActivityState('C16-query',2.5,(v):v is number=>typeof v==='number'&&attentionQueryRowIndex(v)>=0);const[moved,setMoved]=useActivityState('C16-moved',false);const[checked,setChecked]=useActivityState('C16-checked',false);const data=attentionHeatmapComparison(q);
 const change=(value:number)=>{if(value!==q&&attentionQueryRowIndex(value)>=0){setQ(value);setMoved(true);}};
 return <AttentionActivity {...props} number={16} title="价格估计的注意力热力图" eyebrow="同日沿街的 50 条合成报价" done={moved&&checked} footerHeight={180} className="attn-reg-heat-page" footer={<div className="attn-reg-heat-footer"><RangeControl controlClassName="attn-linked-range" prefix="= " label="待估店铺位置 q（km）" aria-label="热图查询 Q" value={q} min={0} max={4.9} step={.1} digits={1} scale={['0.0','4.9']} onChange={event=>change(event.currentTarget.valueAsNumber)}/>{moved?<LessonCheck id="C16" title="热图的一行是什么？" options={[{value:'query',label:'一个 Q 对全部 K 的权重'},{value:'epoch',label:'一次训练的结果',wrongFeedback:'上下移动的是查询位置Q，训练轮次没有变化。'}]} answer="query" correct="一行对应一个查询，沿这一行读取全部观测。" done={checked} onDone={()=>setChecked(true)}/>:<Typography variant="body" tone="muted">选一行，看看权重与预测。</Typography>}</div>}>
 <div className="attn-reg-heat-main">{[{label:'训练前',epoch:0,model:data.before,matrix:beforeMatrix},{label:'第 5 轮',epoch:5,model:data.after,matrix:afterMatrix}].map(item=><section key={item.epoch} className="attn-reg-heat-comparison" aria-label={item.label}>
 <div className="attn-reg-heat-heading"><div className="attn-row"><Typography variant="h3" tone="accent">{item.label}</Typography><Typography variant="bodySmall">{item.epoch===0?'初始 ':''}<MathFormulaStatic className="attn-inline-math" role="math" aria-label={`范围参数 w 等于${item.model.w.toFixed(2)}`} latex={`w=${item.model.w.toFixed(2)}`}/></Typography></div><Typography variant="bodySmall" tone="muted">{item.epoch===0?'距离评分 → Softmax':'训练更新参考范围'}</Typography></div>
 <AttentionHeatmap compact rowAxisLabel="店铺位置 q" columnAxisLabel="观测序号" matrix={item.matrix} selectedRow={data.rowIndex} onSelectRow={row=>change(row/10)} rowLabels={rowLabels} columnLabels={columnLabels} label={`${item.label}50乘50权重热图，纵轴查询位置，横轴按x排序的观测记录`} maxValue={.12}/>
 <WeightStrip compact weights={item.model.weights} positions={positions} label={`${item.label}，查询${q}的全部50项权重`} maxValue={.22}/>
 <div className="attn-reg-heat-result"><Typography variant="bodySmall" tone="accent">该行 ATT → 估计售价（元）</Typography><Typography variant="h3" tone="accent"><MathFormulaStatic className="attn-inline-math" role="math" aria-label={`店铺位置${q.toFixed(1)}千米的估计售价${regressionPriceYuan(item.model.prediction).toFixed(2)}元`} latex={String.raw`\hat{p}(q)=${regressionPriceYuan(item.model.prediction).toFixed(2)}`}/></Typography></div>
 </section>)}</div></AttentionActivity>;
}

import {useMemo,useState} from 'react';
import {RangeControl,Typography} from '../../shared/react';
import {PilotStage,PT,PH,Eq,Table} from '../components/PilotStage';
import {PilotChart} from '../components/PilotChart';
import './PilotInteractions.css';
export function Page(){
 const [count,setCount]=useState(1000);
 const pair=count*Math.log2(count);
 const option=useMemo(()=>({animation:false,legend:{top:0},grid:{top:52,left:88,right:54,bottom:48},tooltip:{show:false},xAxis:{type:'value',min:0,max:10000,interval:2500},yAxis:{type:'value',min:0,max:140000,axisLabel:{formatter:(v:number)=>v/1000+'k'}},series:[{name:'单篇回归 / NAIPv2',type:'line',symbol:'none',data:Array.from({length:101},(_,i)=>[i*100,i*100]),lineStyle:{width:3,color:'#278b6c'},itemStyle:{color:'#278b6c'},markPoint:{symbol:'circle',symbolSize:12,label:{show:false},data:[{coord:[count,count]}]}},{name:'成对拼接',type:'line',symbol:'none',data:Array.from({length:101},(_,i)=>[i*100,i?i*100*Math.log2(i*100):0]),lineStyle:{width:3,color:'#f07e47'},itemStyle:{color:'#f07e47'},markPoint:{symbol:'circle',symbolSize:12,label:{show:false},data:[{coord:[count,pair]}]},markLine:{symbol:'none',label:{show:false},lineStyle:{color:'#68778f',type:'dashed'},data:[{xAxis:count}]}}]}),[count,pair]);
 return <PilotStage title="学习范式对比与推理复杂度" subtitle="把成对监督留在训练阶段，部署时仍按单篇打分" className="naipv2-paradigms-interactive">
 <Table headers={['范式','AUC ↑','Spearman ρ ↑','理论复杂度']} widths={['34%','18%','22%','26%']} rows={[["单篇回归（Pointwise）",'.633','.237',<Eq latex={'O(C)'} label="线性复杂度"/>],["成对拼接（Pairwise Concat）",'.720','.351',<Eq latex={'O(C\\log C)'} label="排序比较复杂度"/>],["NAIPv2",'.782','.432',<Eq latex={'O(C)'} label="NAIPv2线性复杂度"/>]]} highlight={2}/>
 <div className="naipi-cost"><section className="naipi-cost-controls"><PH>拖动数量，观察增长趋势</PH><RangeControl label="候选论文数量 C" min={100} max={10000} step={100} digits={0} value={count} onChange={e=>setCount(Number(e.currentTarget.value))}/><div className="naipi-cost-values" aria-live="polite"><div><PT small>单篇推理增长值</PT><Typography variant="h3" tone="success">{count.toLocaleString()}</Typography></div><div><PT small>成对拼接增长值</PT><Typography variant="h3" tone="accent">{Math.round(pair).toLocaleString()}</Typography></div></div></section><section className="naipi-cost-chart"><PilotChart option={option} label="候选论文数量与理论增长趋势，虚线标记当前数量"/><PT small muted>横轴：候选论文数；纵轴：理论增长值</PT></section></div>
 <PT small muted>教学示意省略常数，以二为对数底；数值不代表实际调用次数或耗时。表中复杂度与性能为源报告口径。</PT>
 </PilotStage>;
}

import {useMemo} from 'react';
import {PlotlyChart,Typography,type PlotlyTrace,type PlotlyLayout} from '../../../shared/react';
import type {TsneFrame} from '../../services/digitTsneRecord';
import {TrainingIcon} from './TrainingIcon';

const lossColor='#2784f6',accuracyColor='#ff892d';
const chartConfig={scrollZoom:false};
export function MetricChart({frames,index}:{frames:TsneFrame[];index:number}){

 const data=useMemo<PlotlyTrace[]>(()=>{
  const visible=frames.slice(0,index+1);
  return [
   {name:'训练损失',key:'train_loss',axis:'y',color:lossColor,dash:'solid'},
   {name:'验证损失',key:'val_loss',axis:'y',color:lossColor,dash:'dash'},
   {name:'训练准确率',key:'train_accuracy',axis:'y2',color:accuracyColor,dash:'solid'},
   {name:'验证准确率',key:'val_accuracy',axis:'y2',color:accuracyColor,dash:'dash'},
  ].map(({name,key,axis,color,dash})=>({
   type:'scatter',mode:'lines+markers',name,yaxis:axis,
   x:visible.map(frame=>frame.epoch),y:visible.map(frame=>frame[key as keyof TsneFrame]),
   line:{color,width:2.5,dash},marker:{color,size:5},
   hovertemplate:`${name}：%{y${axis==='y2'?':.2%':':.4f'}}<extra></extra>`,
  }));
 },[frames,index]);
 const layout=useMemo<PlotlyLayout>(()=>({
  paper_bgcolor:'#ffffff',plot_bgcolor:'#fbfdff',
  margin:{l:76,r:70,t:62,b:68},
  font:{family:'Inter, Segoe UI, sans-serif',color:'#27446e',size:20},
  hovermode:'x unified',hoverlabel:{font:{size:22}},dragmode:false,
  legend:{orientation:'h',x:0.5,xanchor:'center',y:1.14,yanchor:'top',font:{size:18}},
  xaxis:{title:{text:'训练轮次',font:{size:24}},range:[0,15],dtick:3,gridcolor:'#dfe6f1',zerolinecolor:'#68778f',linecolor:'#9fb0c8',showline:true,fixedrange:true},
  yaxis:{title:{text:'交叉熵损失',font:{size:24,color:lossColor}},range:[0,Math.max(2.5,...frames.flatMap(frame=>[frame.train_loss,frame.val_loss]))*1.05],gridcolor:'#dfe6f1',zerolinecolor:'#68778f',linecolor:'#9fb0c8',showline:true,fixedrange:true},
  yaxis2:{title:{text:'准确率',font:{size:24,color:accuracyColor}},overlaying:'y',side:'right',range:[0,1],dtick:0.2,tickformat:'.0%',showgrid:false,zeroline:false,linecolor:'#9fb0c8',showline:true,fixedrange:true},
 }),[frames]);
 return <section className="vfl-tsne-metric">
  <div className="vfl-tsne-panel-title"><span className="vfl-tsne-icon-tile"><TrainingIcon kind="metrics"/></span><Typography variant="h3" tone="accent">训练指标</Typography></div>
  <PlotlyChart data={data} layout={layout} config={chartConfig} minHeight={0} aria-label="损失和准确率随训练轮次变化，左轴为损失，右轴为准确率"/>
 </section>;
}

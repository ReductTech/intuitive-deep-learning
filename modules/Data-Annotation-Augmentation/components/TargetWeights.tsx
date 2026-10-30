import { defaultTheme, EChartsChart, Typography } from '../../shared/react';
import './TargetWeights.css';

export function TargetWeights({apple}:{apple:number}) {
  const color=(token:string)=>defaultTheme.colors.find(c=>c.token===token)!.value;
  const values=[apple,1-apple];
  return <div className="daa-target-weights" aria-label="分类训练目标，类别顺序为苹果、梨">
    <div className="daa-target-plot"><Typography className="daa-target-tick daa-target-tick-top" variant="bodySmall" tone="muted">1</Typography><Typography className="daa-target-tick daa-target-tick-bottom" variant="bodySmall" tone="muted">0</Typography><EChartsChart className="daa-target-chart" minHeight={112} style={{height:112}} role="img" aria-label={`标签权重，固定刻度 0 到 1：苹果 ${apple.toFixed(3)}，梨 ${(1-apple).toFixed(3)}`} option={{
      animation:false,
      grid:{left:28,right:12,top:18,bottom:18},
      xAxis:{type:'category',data:['苹果','梨'],show:false},
      yAxis:{type:'value',min:0,max:1,interval:.5,axisLabel:{show:false},axisLine:{show:false},axisTick:{show:false},splitLine:{lineStyle:{color:color('--ui-grid')}}},
      series:[{type:'bar',barWidth:64,data:values.map((value,i)=>({value,itemStyle:{color:color(i===0?'--ui-accent-alt':'--ui-accent'),borderRadius:[4,4,0,0]}}))}]
    }}/></div>
    <div className="daa-target-labels">{values.map((value,i)=><Typography key={i} variant="bodySmall">{i===0?'苹果':'梨'} {Math.round(value*1000)/10}%</Typography>)}</div>
    <Typography as="code" variant="bodySmall">{`target = [${apple.toFixed(3)}, ${(1-apple).toFixed(3)}]`}</Typography>
  </div>;
}

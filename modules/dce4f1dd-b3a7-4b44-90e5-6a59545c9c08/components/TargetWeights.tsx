import { defaultTheme, EChartsChart, Typography } from "@shuku/course-style/react";
import './TargetWeights.css';

export function TargetWeights({apple}:{apple:number}) {
  const color=(token:string)=>defaultTheme.colors.find(c=>c.token===token)!.value;
  const values=[apple,1-apple];
  return <div shuku-edit-id="e-4c3288dd-ea3f-4f1b-949b-6c46e625c6a2" className="daa-target-weights" aria-label="分类训练目标，类别顺序为苹果、梨">
    <div shuku-edit-id="e-ea0ce5ae-7414-41ac-9bbb-84084c08edea" className="daa-target-plot"><Typography shuku-edit-id="e-881c4af3-e4c2-49d6-86e4-4ae1342363cd" className="daa-target-tick daa-target-tick-top" variant="bodySmall" tone="muted">1</Typography><Typography shuku-edit-id="e-d533dcbe-67b6-470b-8484-db40eec282d5" className="daa-target-tick daa-target-tick-bottom" variant="bodySmall" tone="muted">0</Typography><EChartsChart className="daa-target-chart" minHeight={112} style={{height:112}} role="img" aria-label={`标签权重，固定刻度 0 到 1：苹果 ${apple.toFixed(3)}，梨 ${(1-apple).toFixed(3)}`} option={{
      animation:false,
      grid:{left:28,right:12,top:18,bottom:18},
      xAxis:{type:'category',data:['苹果','梨'],show:false},
      yAxis:{type:'value',min:0,max:1,interval:.5,axisLabel:{show:false},axisLine:{show:false},axisTick:{show:false},splitLine:{lineStyle:{color:color('--ui-grid')}}},
      series:[{type:'bar',barWidth:64,data:values.map((value,i)=>({value,itemStyle:{color:color(i===0?'--ui-accent-alt':'--ui-accent'),borderRadius:[4,4,0,0]}}))}]
    }}/></div>
    <div shuku-edit-id="e-cb5603e8-3ac2-4065-a4ed-38a1e3c38cde" className="daa-target-labels">{values.map((value,i)=><Typography shuku-edit-id="e-dc8842fd-4ab8-4174-96a2-ffa107f60f5c" key={i} variant="bodySmall">{i===0?'苹果':'梨'} {Math.round(value*1000)/10}%</Typography>)}</div>
    <Typography shuku-edit-id="e-1fb78290-76dc-4b58-b0f4-2c5a19e3332d" as="code" variant="bodySmall">{`target = [${apple.toFixed(3)}, ${(1-apple).toFixed(3)}]`}</Typography>
  </div>;
}

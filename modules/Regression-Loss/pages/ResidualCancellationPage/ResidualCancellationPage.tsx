import { useRecordedData } from '../../regressionData';
import { useMemo } from 'react';
import { ContentBlock, EChartsChart, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import './ResidualCancellationPage.css';

const positive = '#ed7047';
const negative = '#427ee0';
const signed = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}`;

export function ResidualCancellationPage() {
  const data = useRecordedData();
  const model = useMemo(()=>{
    if(!data.length)return {w:.016,b:0};
    const mx=data.reduce((sum,p)=>sum+p.mass,0)/data.length;
    const my=data.reduce((sum,p)=>sum+p.depth,0)/data.length;
    const xx=data.reduce((sum,p)=>sum+(p.mass-mx)**2,0);
    const w=xx?data.reduce((sum,p)=>sum+(p.mass-mx)*(p.depth-my),0)/xx:.016;
    return {w,b:my-w*mx};
  },[data]);
  const modelIntercept = model.b;
  const samples = useMemo(()=>data.map(p=>{
    const prediction=Math.round((model.w*p.mass+model.b)*10)/10;
    return {x:p.mass,y:p.depth,prediction,e:Math.round((p.depth-prediction)*10)/10};
  }),[data,model]);
  const errors = samples.map(p=>p.e);
  const sum = Math.round(errors.reduce((a,e)=>a+e,0)*10)/10;
  const scatter = useMemo(() => ({
    animation: false,
    grid: { left: 74, right: 30, top: 60, bottom: 70 },
    xAxis: { type: 'value', min: 0, max: 1700, interval: 500, name: '载重（千克）', nameLocation: 'middle', nameGap: 40, nameTextStyle: { fontSize: 25, color: '#27446e' }, axisLabel: { fontSize: 22, color: '#526582' }, axisLine: { show: true }, splitLine: { show: false } },
    yAxis: { type: 'value', min: 0, max: 36, interval: 10, name: '下沉深度（厘米）', nameGap: 23, nameTextStyle: { fontSize: 25, color: '#27446e', align: 'left' }, axisLabel: { fontSize: 22, color: '#526582' }, axisLine: { show: true }, splitLine: { lineStyle: { color: '#e4ebf3' } } },
    series: [
      { type: 'line', symbol: 'none', data: [[0, modelIntercept], [1700, model.w*1700+modelIntercept]], lineStyle: { color: '#168c97', width: 3 }, silent: true },
      ...samples.map(p => ({ type: 'line', symbol: 'none', data: [[p.x, p.prediction], [p.x, p.y]], lineStyle: { color: p.e > 0 ? positive : negative, width: 2, type: 'dashed' }, silent: true })),
      { type: 'scatter', symbolSize: 15, data: samples.map(p => ({ value: [p.x, p.y], label: { position: p.e > 0 ? 'top' : 'bottom', formatter: signed(p.e), color: p.e > 0 ? positive : negative, fontSize: 22, distance: 9 } })), itemStyle: { color: '#427ee0', borderColor: '#fff', borderWidth: 1 }, label: { show: true }, silent: true, z: 5 },
    ],
  }), [samples]);
  const bars = useMemo(() => ({
    animation: false,
    grid: { left: 48, right: 20, top: 40, bottom: 48 },
    xAxis: { type: 'category', data: errors.map((_, i) => `${i + 1}`), axisLabel: { fontSize: 20, color: '#526582' }, axisTick: { show: false }, axisLine: { onZero: false, lineStyle: { color: '#718098' } }, name: '样本', nameLocation: 'middle', nameGap: 29, nameTextStyle: { fontSize: 21, color: '#27446e' } },
    yAxis: { type: 'value', min: -Math.max(8,Math.ceil(Math.max(...errors.map(Math.abs)))), max: Math.max(8,Math.ceil(Math.max(...errors.map(Math.abs)))), interval: 8, name: '误差（厘米）', nameGap: 20, nameTextStyle: { fontSize: 23, color: '#27446e', align: 'left' }, axisLabel: { show: false }, axisTick: { show: false }, axisLine: { show: false }, splitLine: { show: false } },
    series: [{ type: 'bar', barMaxWidth: 30, data: errors.map(e => ({ value: e, itemStyle: { color: e > 0 ? positive : negative, borderRadius: e > 0 ? [5, 5, 0, 0] : [0, 0, 5, 5] }, label: { position: e > 0 ? 'top' : 'bottom', formatter: signed(e), color: e > 0 ? positive : negative } })), label: { show: true, fontSize: 20, distance: 8 }, markLine: { silent: true, symbol: 'none', label: { show: false }, lineStyle: { color: '#526582', width: 1, type: 'solid' }, data: [{ yAxis: 0 }] } }],
  }), [errors]);
  if(!data.length)return <ContentBlock title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock headingLevel={1} title="误差不能直接相加" subtitle="正负误差可能相互抵消，求和不能反映整体偏差大小。" className="rl-cancel-page">
    <div className="rl-cancel-layout">
      <section className="rl-cancel-observations" aria-label="各样本的有向误差"><Typography variant="h3" tone="accent">每个样本的误差</Typography><EChartsChart className="rl-cancel-chart" option={scatter} minHeight={0} aria-label="称象实验记录的观测点、预测直线和正负误差" /><div className="rl-cancel-legend"><Typography variant="bodySmall" tone="muted">● 观测值</Typography><Typography variant="bodySmall" tone="muted">━ 预测直线</Typography></div></section>
      <section className="rl-cancel-summary" aria-label="误差抵消与总和">
        <Typography variant="h3" tone="accent">正负误差相抵</Typography>
        <EChartsChart className="rl-cancel-chart" option={bars} minHeight={0} aria-label={`本次实验误差之和为${sum.toFixed(1)}厘米`} />
        <div className="rl-cancel-total"><Typography variant="body" tone="accent">直接相加的结果</Typography><MathFormulaBlock appearance="plain" ariaLabel={`本次实验误差求和等于${sum.toFixed(1)}厘米`}><MathFormulaStatic latex={`\\textstyle\\sum_{i=1}^{${data.length}} e_i = ${sum.toFixed(1)}\\;\\mathrm{cm}`} /></MathFormulaBlock></div>
      </section>
      <div className="rl-cancel-takeaway"><Typography variant="body" tone="inherit">误差总和接近零，甚至等于零，也不能说明预测准确。</Typography></div>
    </div>
  </ContentBlock>;
}


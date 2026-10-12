import { useMemo } from 'react';
import { Tips } from '@icon-park/react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from '../../../shared/react';
import { useRecordedData } from '../../regressionData';
import { MseBowlDiagram } from './MseBowlDiagram';
import './ConvexMsePage.css';

export function ConvexMsePage() {
  const data=useRecordedData();
  const unique=useMemo(()=>data.some(p=>p.mass!==data[0]?.mass),[data]);
  if(!data.length) return <ContentBlock title="请先完成称象记录" subtitle="本页说明 MSE 关于模型参数的凸性。" />;
  const properties=[
    unique?'曲面像一个碗，是凸函数。':'曲面像一个槽，仍然是凸的。',
    unique?'输入不全相同，最低点唯一。':'输入全部相同，最低点不唯一。',
    '局部最小值就是全局最小值。',
    '令梯度为零，求出最优参数。',
  ];
  return <ContentBlock headingLevel={1} title="MSE 关于参数是凸的" subtitle="把参数 w 和 b 排成一个平面，为每组参数计算 MSE，就得到损失曲面。" className="rl-convex-page">
    <div className="rl-convex-layout">
      <section className="rl-convex-visual">
        <MseBowlDiagram unique={unique} />
        <div className="rl-convex-labels"><div><Typography variant="body" tone="accent">每个点 = 一组参数</Typography><MathFormulaBlock appearance="plain"><MathFormulaStatic latex="(w,b)" /></MathFormulaBlock></div><div><Typography variant="body" tone="accent">高度 = MSE</Typography></div></div>
      </section>
      <section className="rl-convex-explanation">
        <Typography variant="h2" tone="accent">凸函数有什么性质？</Typography>
        <MathFormulaBlock appearance="plain" className="rl-convex-formula"><MathFormulaTerm latex="\mathrm{MSE}(w,b)=\frac1n\sum_i\bigl(y_i-(wx_i+b)\bigr)^2" tooltip="对全部观测的残差平方求平均。左图用没有数值刻度的二次曲面示意凸性；曲面外形没有按本批观测的参数单位绘制。" /></MathFormulaBlock>
        <div className="rl-convex-properties">{properties.map((property,index)=><div className="rl-convex-property" key={index}><span className="rl-convex-number"><Typography variant="h3" tone="accent">{index+1}</Typography></span><Typography variant="h3" tone="accent">{property}</Typography></div>)}</div>
        <div className="rl-convex-conclusion"><Tips theme="two-tone" size="58" fill={['#367de8','#dbeaff']} /><Typography variant="h3" tone="accent">MSE 关于参数是凸的，<br/>求出的最小值就是全局最小值。</Typography></div>
      </section>
    </div>
  </ContentBlock>;
}

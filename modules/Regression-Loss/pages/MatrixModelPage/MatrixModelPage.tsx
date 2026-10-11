import { useMemo, useState } from 'react';
import { ContentBlock, EChartsChart, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from '../../../shared/react';
import { useRecordedData } from '../../regressionData';
import './MatrixModelPage.css';

export function MatrixModelPage() {
  const data = useRecordedData();
  const [activeRow, setActiveRow] = useState<string | null>('2');
  const [activeParameter, setActiveParameter] = useState<'w' | 'b' | null>(null);
  const rows = ['1', '2', 'n'];
  const rowEvents = (row: string) => ({ onMouseEnter: () => setActiveRow(row), onMouseLeave: () => setActiveRow(null), onFocus: () => setActiveRow(row), onBlur: () => setActiveRow(null) });
  const parameterEvents = (parameter: 'w' | 'b') => ({ onMouseEnter: () => setActiveParameter(parameter), onMouseLeave: () => setActiveParameter(null), onFocus: () => setActiveParameter(parameter), onBlur: () => setActiveParameter(null) });
  const model = useMemo(() => {
    const n = data.length;
    const mx = n ? data.reduce((s, p) => s + p.mass, 0) / n : 0;
    const my = n ? data.reduce((s, p) => s + p.depth, 0) / n : 0;
    const xx = data.reduce((s, p) => s + (p.mass - mx) ** 2, 0);
    const w = xx ? data.reduce((s, p) => s + (p.mass - mx) * (p.depth - my), 0) / xx : 0;
    return { w, b: my - w * mx };
  }, [data]);
  const option = useMemo(() => ({
    animation: false, tooltip: { trigger: 'item' },
    grid: { left: 51, right: 18, top: 48, bottom: 60 },
    xAxis: { type: 'value', min: 0, max: 1600, interval: 500, name: '石重（千克）', nameLocation: 'middle', nameGap: 31, nameTextStyle: { fontSize: 19, color: '#27446e' }, axisLabel: { fontSize: 17 }, splitLine: { show: false } },
    yAxis: { type: 'value', min: Math.min(0, Math.floor(model.b / 10) * 10), max: Math.max(30, Math.ceil(Math.max(...data.map(p => p.depth)) / 10) * 10), interval: 10, name: '深度（厘米）', nameTextStyle: { fontSize: 19, color: '#27446e', align: 'left' }, axisLabel: { fontSize: 17 }, splitLine: { lineStyle: { color: '#e3edf8' } } },
    series: [
      { type: 'line', symbol: 'none', data: [[0, model.b], [1500, model.w * 1500 + model.b]], lineStyle: { color: '#009eaa', width: 3 }, silent: true },
      { type: 'scatter', symbolSize: 11, data: data.map((p, i) => ({ value: [p.mass, p.depth], itemStyle: { color: activeRow === String(i + 1) || (activeRow === 'n' && i === data.length - 1) ? '#ed8a34' : '#367de8' } })), z: 5 },
    ],
  }), [data, model, activeRow]);
  if (!data.length) return <ContentBlock title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  const rowName = (row: string) => row === 'n' ? '最后一条' : `第 ${row} 条`;
  return <ContentBlock headingLevel={1} title="从两个参数到矩阵形式" subtitle="将逐条预测统一写成矩阵运算。" className="rl-matrix-page">
    <div className="rl-matrix-layout">
      <section className="rl-matrix-scalar-panel">
        <Typography variant="h3" tone="accent">逐条预测 · 每条记录一个公式</Typography>
        <div className="rl-matrix-scalar-content">
          <div className="rl-matrix-scalar-list">{rows.map((row, i) => <div key={row}>{i === 2 && <MathFormulaBlock appearance="plain"><MathFormulaTerm latex="\vdots" tooltip="中间各条记录采用相同的计算规则，这里省略展示。" /></MathFormulaBlock>}<MathFormulaBlock appearance="plain" className={`rl-matrix-scalar-row${activeRow === row ? ' is-row-active' : ''}`} {...rowEvents(row)} ariaLabel={`${rowName(row)}记录的预测`}><MathFormulaTerm latex={`\\hat{y}_{${row}}`} tooltip={`${rowName(row)}记录的预测深度，对应预测向量的这一行。`} {...rowEvents(row)} /><MathFormulaStatic latex="=" /><MathFormulaTerm latex="w" tooltip="所有记录共用的斜率参数，乘在累计石重上；矩阵表达中它与第一列相乘。" {...parameterEvents('w')} /><MathFormulaTerm latex={`x_${row}`} tooltip={`${rowName(row)}记录的累计石重，对应设计矩阵第一列中的这一项。`} {...rowEvents(row)} /><MathFormulaStatic latex="+" /><MathFormulaTerm latex="b" tooltip="所有记录共用的截距。设计矩阵第二列都是1，使每条预测都加上同一个b。" {...parameterEvents('b')} /></MathFormulaBlock></div>)}</div>
          <EChartsChart option={option} minHeight={0} className="rl-matrix-chart" aria-label="实际观测与同一条二维预测直线" />
        </div>
        <Typography variant="bodySmall" tone="muted">每条记录使用同一组斜率与截距。</Typography>
      </section>
      <section className="rl-matrix-unified-panel">
        <Typography variant="h3" tone="accent">矩阵形式 · 一次写完所有记录</Typography>
        <MathFormulaBlock appearance="plain" className="rl-matrix-model" ariaLabel="预测向量等于设计矩阵乘参数向量"><MathFormulaTerm latex="\hat{\mathbf y}" tooltip="由n条预测深度组成的列向量，维度n×1；区别于实测观测向量y。" /><MathFormulaStatic latex="=" /><MathFormulaTerm latex="X" tooltip="设计矩阵，维度n×2。每行是一条记录，每列对应一个参数：石重对应w，常数1对应b。" /><MathFormulaTerm latex="\theta" tooltip="参数列向量，维度2×1，按顺序包含斜率w与截距b。" /></MathFormulaBlock>
        <div className="rl-matrix-product">
          <div className="rl-matrix-object"><div className="rl-matrix-bracket rl-matrix-prediction">{['1', '2', 'dots', 'n'].map(row => <MathFormulaBlock appearance="plain" className={activeRow === row ? 'is-row-active' : ''} key={row}>{row === 'dots' ? <MathFormulaTerm latex="\vdots" tooltip="省略中间记录的预测分量。" /> : <MathFormulaTerm latex={`\\hat{y}_{${row}}`} tooltip={`${rowName(row)}记录的预测值，由矩阵相同行的x与1分别乘w、b后相加得到。`} {...rowEvents(row)} />}</MathFormulaBlock>)}</div><Typography variant="bodySmall" tone="accent">预测向量</Typography><MathFormulaBlock appearance="plain" className="rl-matrix-dimension"><MathFormulaTerm latex="n\times1" tooltip="n行对应n条记录；每条记录有一个预测输出，所以只有1列。" /></MathFormulaBlock></div>
          <MathFormulaBlock appearance="plain" className="rl-matrix-operator"><MathFormulaStatic latex="=" /></MathFormulaBlock>
          <div className="rl-matrix-object"><div className="rl-matrix-bracket rl-matrix-design">{['1', '2', 'dots', 'n'].map(row => <div className={`rl-matrix-design-row${activeRow === row ? ' is-row-active' : ''}`} key={row}><MathFormulaBlock appearance="plain" className={activeParameter === 'w' ? 'is-column-active' : ''}>{row === 'dots' ? <MathFormulaTerm latex="\vdots" tooltip="第一列继续存放各条记录的累计石重。" /> : <MathFormulaTerm latex={`x_${row}`} tooltip={`${rowName(row)}记录的输入石重。这个元素乘斜率w，构成预测中的wx项。`} {...rowEvents(row)} />}</MathFormulaBlock><MathFormulaBlock appearance="plain" className={activeParameter === 'b' ? 'is-column-active' : ''}>{row === 'dots' ? <MathFormulaTerm latex="\vdots" tooltip="第二列的每一行都等于1，用来引入截距。" /> : <MathFormulaTerm latex="1" tooltip={`${rowName(row)}记录的常数特征，乘截距b得到b。它不是另一项实测石重。`} {...rowEvents(row)} />}</MathFormulaBlock></div>)}</div><Typography variant="bodySmall" tone="accent">设计矩阵</Typography><MathFormulaBlock appearance="plain" className="rl-matrix-dimension"><MathFormulaTerm latex="n\times2" tooltip="n行对应记录，2列分别对应斜率和截距。这两列必须与参数向量的顺序一致。" /></MathFormulaBlock></div>
          <MathFormulaBlock appearance="plain" className="rl-matrix-operator"><MathFormulaTerm latex="\times" tooltip="矩阵乘法：每行[xᵢ,1]与参数列[w,b]做内积，得到wxᵢ+b；不是逐元素相乘。" /></MathFormulaBlock>
          <div className="rl-matrix-object"><div className="rl-matrix-bracket rl-matrix-parameters"><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="w" tooltip="参数向量的第一项，与设计矩阵的石重列相乘。" {...parameterEvents('w')} /></MathFormulaBlock><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="b" tooltip="参数向量的第二项，与常数1列相乘，给每条预测加上截距。" {...parameterEvents('b')} /></MathFormulaBlock></div><Typography variant="bodySmall" tone="accent">参数向量</Typography><MathFormulaBlock appearance="plain" className="rl-matrix-dimension"><MathFormulaTerm latex="2\times1" tooltip="两个待估参数构成一列。矩阵乘法的内部维度2一致，最终输出n×1。" /></MathFormulaBlock></div>
        </div>
      </section>
      <section className="rl-matrix-bottom">
        <div className="rl-matrix-objective"><Typography variant="h3" tone="accent">同一个最小二乘目标</Typography><MathFormulaBlock appearance="plain" ariaLabel="平方误差之和写成二范数的平方"><MathFormulaTerm latex="S(\theta)" tooltip="以全部参数为自变量的平方误差之和，和前面的S(w,b)是同一个目标。" tooltipPlacement="top" /><MathFormulaStatic latex="=" /><MathFormulaTerm latex="\Vert" tooltip="双竖线表示向量范数，不是矩阵行列式或逐元素绝对值。" tooltipPlacement="top" /><MathFormulaTerm latex="X" tooltip="固定的设计矩阵，将参数映射为全部记录的预测。" tooltipPlacement="top" /><MathFormulaTerm latex="\theta" tooltip="待估参数向量；Xθ是预测向量。" tooltipPlacement="top" /><MathFormulaTerm latex="-" tooltip="逐条计算预测值减观测值，与观测减预测平方后完全相同。" tooltipPlacement="top" /><MathFormulaTerm latex="\mathbf y" tooltip="实际观测深度构成的n×1列向量，不是预测值。" tooltipPlacement="top" /><MathFormulaTerm latex="\Vert_2^2" tooltip="二范数平方：先对每个分量平方，再求和；没有再开平方。" tooltipPlacement="top" /></MathFormulaBlock><Typography variant="bodySmall" tone="muted">所有记录的平方误差之和。</Typography></div>
        <div className="rl-matrix-normal"><Typography variant="h3" tone="accent">令梯度为零，得到正规方程</Typography><MathFormulaBlock appearance="plain" className="rl-matrix-gradient" ariaLabel="平方和梯度为零的条件"><MathFormulaTerm latex="\nabla_\theta S" tooltip="对两个参数分别求偏导，组成2×1梯度向量；其中包含对w和对b的导数。" tooltipPlacement="top" /><MathFormulaStatic latex="=" /><MathFormulaTerm latex="2" tooltip="来自平方项的求导，令梯度为零时可约去这个非零常数。" tooltipPlacement="top" /><MathFormulaTerm latex="X^\top" tooltip="转置后的设计矩阵，维度2×n；把n条记录的误差汇总为两个参数的导数。" tooltipPlacement="top" /><MathFormulaStatic latex="(" /><MathFormulaTerm latex="X" tooltip="设计矩阵，维度n×2；将两个参数映射到n条预测。" tooltipPlacement="top" /><MathFormulaTerm latex="\theta" tooltip="两个待估参数构成的列向量；Xθ是全部预测，维度n×1。" tooltipPlacement="top" /><MathFormulaTerm latex="-" tooltip="用每条预测减去对应观测，形成误差向量。" tooltipPlacement="top" /><MathFormulaTerm latex="\mathbf y" tooltip="全部实测深度组成的n×1观测向量，在优化中固定。" tooltipPlacement="top" /><MathFormulaStatic latex=")=" /><MathFormulaTerm latex="\mathbf0" tooltip="2×1零向量，表示对w和对b的偏导同时为零；并不要求每条记录的误差为零。" tooltipPlacement="top" /></MathFormulaBlock><MathFormulaBlock appearance="plain" className="rl-matrix-normal-result" ariaLabel="正规方程"><MathFormulaTerm latex="X^\top" tooltip="X的转置，维度2×n。" tooltipPlacement="top" /><MathFormulaTerm latex="X" tooltip="与转置相乘得到2×2矩阵XᵀX，描述输入列的内积关系。" tooltipPlacement="top" /><MathFormulaTerm latex="\theta" tooltip="待求参数向量，乘积XᵀXθ的维度为2×1。" tooltipPlacement="top" /><MathFormulaStatic latex="=" /><MathFormulaTerm latex="X^\top" tooltip="将观测与设计矩阵各列做内积。" tooltipPlacement="top" /><MathFormulaTerm latex="\mathbf y" tooltip="固定观测向量，右侧Xᵀy为2×1。这是线性方程组，下一页解释其最优性。" tooltipPlacement="top" /></MathFormulaBlock></div>
      </section>
    </div>
  </ContentBlock>;
}


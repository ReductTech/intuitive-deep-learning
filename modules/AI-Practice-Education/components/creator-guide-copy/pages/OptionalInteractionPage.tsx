import { useState } from 'react';
import { Typography, MathFormulaBlock, MathFormulaStatic } from '../../../../shared/react';
import './OptionalInteractionPage.css';

function Weight({ index }: { index:number }) { return <Typography as="span" variant="h2" tone="inherit" className="aipe-replay-cg-optional-weight"><i>w</i><sub>{index+1}</sub></Typography>; }
export function OptionalInteractionPage(){
  const [revealed,setRevealed]=useState<number[]>([0,1]);
  return <article className="aipe-replay-cg-optional-page aipe-replay-cg-creator-typography" aria-labelledby="aipe-replay-cg-optional-title">
    <header><Typography as="h1" variant="display" tone="inherit" id="aipe-replay-cg-optional-title">交互是可选项，<span>理解</span>才是目的</Typography><Typography variant="subtitle" tone="inherit">例子：一个单通道 3 × 3 卷积核，有多少个权重？</Typography></header>
    <div className="aipe-replay-cg-optional-panels"><section className="aipe-replay-cg-optional-panel aipe-replay-cg-optional-extra"><div className="aipe-replay-cg-optional-panel-heading"><Typography as="h2" variant="h2" tone="inherit">为了交互，先把信息藏起来</Typography><Typography as="span" variant="bodySmall" tone="inherit" className="aipe-replay-cg-optional-tag">多了操作</Typography></div>
      <div className="aipe-replay-cg-optional-hidden-grid" aria-label="逐个点击查看九个权重">{Array.from({length:9},(_,i)=><button type="button" key={i} aria-label={revealed.includes(i)?`权重 ${i+1} 已显示`:`查看权重 ${i+1}`} aria-pressed={revealed.includes(i)} onClick={()=>setRevealed(current=>current.includes(i)?current:[...current,i])}>{revealed.includes(i)?<Weight index={i}/>:<Typography as="span" variant="h2" tone="inherit">?</Typography>}</button>)}</div>
      <Typography variant="bodySmall" tone="inherit" className="aipe-replay-cg-optional-click-note">点击格子，逐个查看</Typography>
      <div className="aipe-replay-cg-optional-progress" aria-live="polite"><div aria-hidden="true">{Array.from({length:9},(_,i)=><span key={i} className={revealed.includes(i)?'is-revealed':''}/>)}</div><Typography variant="bodySmall" tone="inherit">已查看 {revealed.length} / 9</Typography></div>
      <Typography variant="body" tone="inherit" className="aipe-replay-cg-optional-panel-takeaway">点了九次，只是看到了九个权重。</Typography>
    </section><section className="aipe-replay-cg-optional-panel aipe-replay-cg-optional-direct"><div className="aipe-replay-cg-optional-panel-heading"><Typography as="h2" variant="h2" tone="inherit">直接展示，也能讲清楚</Typography><Typography as="span" variant="bodySmall" tone="inherit" className="aipe-replay-cg-optional-tag">无需交互</Typography></div>
      <div className="aipe-replay-cg-optional-visible-grid" aria-label="三行三列共九个权重">{Array.from({length:9},(_,i)=><div key={i}><Weight index={i}/></div>)}</div>
      <div className="aipe-replay-cg-optional-column-bracket"><Typography variant="bodySmall" tone="inherit">3 列</Typography></div><div className="aipe-replay-cg-optional-row-bracket"><Typography variant="bodySmall" tone="inherit">3 行</Typography></div>
      <div className="aipe-replay-cg-optional-equation"><MathFormulaBlock appearance="plain" ariaLabel="三乘三等于九"><MathFormulaStatic latex="3 \times 3 = 9"/></MathFormulaBlock><Typography variant="bodySmall" tone="inherit">每个格子，对应一个<br/>可学习权重</Typography></div>
      <Typography variant="body" tone="inherit" className="aipe-replay-cg-optional-panel-takeaway">关系看得见，不需要逐格点开。</Typography>
    </section></div>
    <svg className="aipe-replay-cg-optional-arrow" viewBox="0 0 80 60" aria-hidden="true"><path d="M3 19h41V5l32 25-32 25V41H3Z" fill="#b8d7fa"/></svg>
    <footer><Typography variant="h2" tone="inherit">如果交互没有增加理解，就可以不加。</Typography><Typography variant="body" tone="inherit">用不用交互，取决于它是否帮助学习者看清关系、验证猜想或发现规律。</Typography></footer>
  </article>;
}

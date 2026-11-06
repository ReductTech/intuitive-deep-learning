import { useEffect, useMemo, useState } from 'react';
import { Button, ContentBlock, EChartsChart, MathFormulaBlock, MathFormulaTerm, TextInput, Typography } from '../../../shared/react';
import { advance, encode, evaluate, initialTraining, passengerInputs, samples, score, sigmoid, type Inputs } from './model';
import './TitanicTrainingPage.css';
const names=['年龄','性别','舱位','票价'];
const fmt=(v:number)=>v.toFixed(3);
function Formula({latex,tip}:{latex:string;tip?:string}) { return <MathFormulaBlock appearance="plain"><MathFormulaTerm latex={latex} tooltip={tip}/></MathFormulaBlock>; }
function Heading({n,title}:{n:number;title:string}) { return <div className="rl-tr-heading"><Typography as="span" variant="body" tone="inherit" className="rl-tr-number">{n}</Typography><Typography variant="h3" tone="accent">{title}</Typography></div>; }
export function TitanicTrainingPage() {
  const [training,setTraining]=useState(initialTraining);
  const [running,setRunning]=useState(false);
  const [inference,setInference]=useState(false);
  const [inputs,setInputs]=useState<Inputs>(passengerInputs(0));
  useEffect(()=>{ if(!running||inference||training.complete) return; const id=window.setInterval(()=>setTraining(s=>advance(s,10)),60); return ()=>window.clearInterval(id); },[running,inference,training.complete]);
  useEffect(()=>{ if(training.complete) setRunning(false); },[training.complete]);
  const index=training.iteration%samples.length;
  const person=samples[index];
  const current=inference?inputs:passengerInputs(index);
  const x=encode(current), z=score(training.weights,x), probability=sigmoid(z);
  const metrics=useMemo(()=>evaluate(training.weights),[training.weights]);
  const chart=useMemo(()=>({animation:false,grid:{left:48,right:20,top:14,bottom:32},xAxis:{type:'value',name:'迭代次数',nameLocation:'middle',nameGap:22,min:0,max:Math.max(1,training.iteration)},yAxis:{type:'value',min:0,max:.5},series:[{type:'line',showSymbol:training.iteration<8,data:training.history.filter((_,i)=>i%Math.max(1,Math.floor(training.history.length/160))===0||i===training.history.length-1),lineStyle:{color:'#267cf3',width:3},areaStyle:{color:'#edf5ff'}}]}),[training.history,training.iteration]);
  function enter() {setRunning(false);setInputs(passengerInputs(index));setInference(true);}
  function change(key:keyof Inputs,value:number) {setInputs(s=>({...s,[key]:value}));}
  const values=[String(current.age),current.male?'男':'女',['一等','二等','三等'][current.cabin-1],`£${current.fare.toFixed(2)}`];
  const hints=[`÷ 80 → ${x[1].toFixed(3)}`,`女 0 · 男 1 → ${current.male}`,`→ ${current.cabin}`,`÷ 100 → ${x[4].toFixed(4)}`];
  return <ContentBlock headingLevel={1} title="逻辑回归的参数估计" subtitle="乘客资料转为数字输入，通过梯度下降估计参数。" className="rl-tr-page">
    <div className="rl-tr-layout">
      <div className="rl-tr-context"><Typography variant="bodySmall" tone="accent" wrap="truncate">{inference?'推理：调整乘客资料':`样本 ${person.PassengerId} · ${person.Name}`}</Typography><Typography variant="bodySmall" tone="muted">{inference?'参数已固定':`第 ${training.iteration} 次迭代 · ${training.complete?'已收敛':'全批量更新'}`}</Typography></div>
      <div className="rl-tr-network">
        <section className="rl-tr-panel rl-tr-input"><Heading n={1} title="样本输入"/>
          {names.map((name,i)=><div className="rl-tr-feature" key={name}><Typography variant="bodySmall" tone="accent">{name}</Typography>
            {inference?(i===0||i===3?<TextInput aria-label={name} type="number" min={0} max={i===0?100:600} step={i===0?1:.25} value={i===0?current.age:current.fare} onChange={e=>{const v=Number(e.target.value);change(i===0?'age':'fare',Math.max(0,Math.min(i===0?100:600,Number.isFinite(v)?v:0)));}}/>:<div className="rl-tr-options">{(i===1?[0,1]:[1,2,3]).map(v=><Button key={v} active={(i===1?current.male:current.cabin)===v} aria-pressed={(i===1?current.male:current.cabin)===v} onClick={()=>change(i===1?'male':'cabin',v)}>{i===1?(v?'男':'女'):v}</Button>)}</div>):<Typography variant="bodySmall" tone="accent">{values[i]}</Typography>}
            <Typography variant="bodySmall" tone="muted">{hints[i]}</Typography></div>)}
        </section>
        <section className={`rl-tr-panel rl-tr-weights ${inference?'rl-tr-fixed':''}`}><Heading n={2} title="线性组合"/>
          {names.map((name,i)=><div className="rl-tr-weight" key={name}><Formula latex={`w_${i+1}`} tip={`${name}对应的权重。左侧为上次迭代值，右侧为当前值。`}/>{!inference&&<><Typography variant="bodySmall" tone="muted">{fmt(training.previous[i+1])}</Typography><span aria-hidden="true">→</span></>}<Typography variant="body" tone="accent">{fmt(training.weights[i+1])}</Typography></div>)}
          <div className="rl-tr-weight rl-tr-bias"><Formula latex="b" tip="偏置不乘以乘客特征，直接加入线性分数。"/>{!inference&&<><Typography variant="bodySmall" tone="muted">{fmt(training.previous[0])}</Typography><span aria-hidden="true">→</span></>}<Typography variant="body" tone="accent">{fmt(training.weights[0])}</Typography></div>
        </section>
        <section className="rl-tr-panel rl-tr-sum"><Heading n={3} title="加权求和"/>
          <div className="rl-tr-sum-visual"><svg className="rl-tr-connections" viewBox="0 0 220 180" aria-hidden="true"><defs><marker id="rl-tr-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#267cf3"/></marker></defs>{[15,60,105,150].map(y=><line key={y} x1="2" y1={y} x2="80" y2="85" stroke="#267cf3" strokeWidth="2" markerEnd="url(#rl-tr-arrow)"/>)}<circle cx="145" cy="85" r="62" fill="#edf5ff" stroke="#267cf3" strokeWidth="2"/></svg>
          <div className="rl-tr-sigma"><Formula latex="\Sigma"/></div></div><Formula latex={`z=${z.toFixed(3)}`} tip="每个数字输入乘以对应权重，将四项相加，再加上偏置。"/><Formula latex="z=\mathbf w^\top\mathbf x+b"/>
        </section>
        <section className="rl-tr-panel rl-tr-sigmoid"><Heading n={4} title="Sigmoid"/>
          <svg viewBox="0 0 220 170" aria-hidden="true"><path d="M20 15 V150 H210" fill="none" stroke="#9aabc3" strokeWidth="2"/><path d={Array.from({length:81},(_,i)=>{const xx=i/80*12-6;return `${i?'L':'M'}${20+i/80*180},${145-sigmoid(xx)*120}`;}).join(' ')} fill="none" stroke="#267cf3" strokeWidth="3"/></svg><Formula latex="p=\frac{1}{1+e^{-z}}" tip="Sigmoid把线性分数映射为存活概率。"/>
        </section>
        <section className="rl-tr-panel rl-tr-result"><Heading n={5} title="预测结果"/>
          <div className="rl-tr-probability"><Typography variant="bodySmall" tone="success">存活概率</Typography><Typography variant="h1" tone="success">{(probability*100).toFixed(1)}%</Typography><Typography variant="body" tone="success">{probability>=.5?'预测：存活':'预测：未存活'}</Typography></div>
          {!inference&&<div className="rl-tr-gt"><Typography variant="bodySmall" tone="muted">实际标签</Typography><Typography variant="body" tone={person.Survived?'success':'danger'}>{person.Survived?'1 · 存活':'0 · 未存活'}</Typography></div>}
        </section>
      </div>
      <div className="rl-tr-bottom">
        <section className="rl-tr-monitor"><div className="rl-tr-monitor-title"><Typography variant="h3" tone="accent">MAE 变化</Typography><Typography variant="body" tone="accent">{metrics.mae.toFixed(3)}</Typography></div><EChartsChart option={chart} minHeight={0} className="rl-tr-chart" aria-label="全体训练样本平均绝对误差随迭代的变化"/></section>
        <section className="rl-tr-update"><Typography variant="h3" tone="accent">{inference?'固定参数，计算预测':'参数更新'}</Typography><Formula latex={inference?String.raw`p=\sigma(\mathbf w^\top\mathbf x+b)`:String.raw`w_j\leftarrow w_j-\eta\frac{1}{n}\sum_i(p_i-y_i)x_{ij}`} tip={inference?'推理只改变输入，权重与偏置保持不变。':'对全部714位年龄非缺失乘客求平均梯度，学习率η=0.4。优化目标是平均负对数似然，即极大似然估计；偏置同样更新，对应输入恒为1。'}/><Typography variant="bodySmall" tone="muted">{inference?'调整输入，观察存活概率。':'预测与标签的偏差 → 梯度 → 更新权重'}</Typography><Typography variant="bodySmall" tone="muted">{inference?'以 0.5 为分类阈值。':'拟合：极大似然 · 观察：MAE'}</Typography></section>
        <div className="rl-tr-controls">{inference?<><Button variant="primary" onClick={()=>setInference(false)}>返回参数估计</Button><Button onClick={()=>setInputs(passengerInputs(index))}>恢复乘客资料</Button><Button onClick={()=>{setRunning(false);setInference(false);setTraining(initialTraining());}}>重新估计</Button></>:<><Button variant="primary" disabled={running||training.complete} onClick={()=>setTraining(s=>advance(s))}>迭代一步</Button><Button disabled={training.complete} onClick={()=>setRunning(v=>!v)}>{running?'暂停迭代':training.complete?'迭代完成':'连续迭代'}</Button><Button onClick={enter}>进入推理</Button></>}</div>
      </div>
    </div>
  </ContentBlock>;
}

import { useEffect, useMemo, useState } from 'react';
import { Button, ContentBlock, EChartsChart, MathFormulaBlock, MathFormulaTerm, TextInput, Typography } from "@shuku/course-style/react";
import { advance, encode, evaluate, initialTraining, passengerInputs, samples, score, sigmoid, type Inputs } from './model';
import './TitanicTrainingPage.css';
const names=['年龄','性别','舱位','票价'];
const fmt=(v:number)=>v.toFixed(3);
function Formula({latex,tip}:{latex:string;tip?:string}) { return <MathFormulaBlock appearance="plain"><MathFormulaTerm latex={latex} tooltip={tip}/></MathFormulaBlock>; }
function Heading({n,title}:{n:number;title:string}) { return <div shuku-edit-id="e-85502e1b-2c27-4557-b2b0-8c96b39db7a9" className="rl-tr-heading"><Typography shuku-edit-id="e-39d0baa2-87dc-4bef-9fef-acb2a3247c55" as="span" variant="body" tone="inherit" className="rl-tr-number">{n}</Typography><Typography shuku-edit-id="e-3daa8180-e019-43a3-8141-9bc80b4f9fe5" variant="h3" tone="accent">{title}</Typography></div>; }
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
  return <ContentBlock shuku-edit-id="e-d4c5bf80-cddc-4d50-9f18-e19f5d98a2e8" headingLevel={1} title="逻辑回归的参数估计" subtitle="乘客资料转为数字输入，通过梯度下降估计参数。" className="rl-tr-page">
    <div shuku-edit-id="e-c7d1410c-4c93-47b3-928b-159252b29e99" className="rl-tr-layout">
      <div shuku-edit-id="e-fb58710e-bdf2-4264-96af-eed0056e83f5" className="rl-tr-context"><Typography shuku-edit-id="e-cca1e850-9d45-4e72-8d04-ee490082d8fe" variant="bodySmall" tone="accent" wrap="truncate">{inference?'推理：调整乘客资料':`样本 ${person.PassengerId} · ${person.Name}`}</Typography><Typography shuku-edit-id="e-c55783a8-605f-4fee-940b-c0a165956529" variant="bodySmall" tone="muted">{inference?'参数已固定':`第 ${training.iteration} 次迭代 · ${training.complete?'已收敛':'全批量更新'}`}</Typography></div>
      <div shuku-edit-id="e-7aefb6ca-f5b1-4eab-ae2e-81e7ee3240b8" className="rl-tr-network">
        <section shuku-edit-id="e-55266a21-4bce-4199-8026-e4b39f5158a9" className="rl-tr-panel rl-tr-input"><Heading n={1} title="样本输入"/>
          {names.map((name,i)=><div shuku-edit-id="e-d64f6e88-b4cc-432e-a309-5a0ad9f33905" className="rl-tr-feature" key={name}><Typography shuku-edit-id="e-29962b12-4261-43ee-83df-5b2d486141f3" variant="bodySmall" tone="accent">{name}</Typography>
            {inference?(i===0||i===3?<TextInput aria-label={name} type="number" min={0} max={i===0?100:600} step={i===0?1:.25} value={i===0?current.age:current.fare} onChange={e=>{const v=Number(e.target.value);change(i===0?'age':'fare',Math.max(0,Math.min(i===0?100:600,Number.isFinite(v)?v:0)));}}/>:<div shuku-edit-id="e-f5e03063-26e3-4ff5-994f-28d01182259d" className="rl-tr-options">{(i===1?[0,1]:[1,2,3]).map(v=><Button key={v} active={(i===1?current.male:current.cabin)===v} aria-pressed={(i===1?current.male:current.cabin)===v} onClick={()=>change(i===1?'male':'cabin',v)}>{i===1?(v?'男':'女'):v}</Button>)}</div>):<Typography shuku-edit-id="e-d86d8bc8-adfa-49c3-b722-d1422993f316" variant="bodySmall" tone="accent">{values[i]}</Typography>}
            <Typography shuku-edit-id="e-ae9922dd-d5bf-41b7-8616-a31b12da610d" variant="bodySmall" tone="muted">{hints[i]}</Typography></div>)}
        </section>
        <section shuku-edit-id="e-836b8917-245a-488c-a243-884d44f9d2ea" className={`rl-tr-panel rl-tr-weights ${inference?'rl-tr-fixed':''}`}><Heading n={2} title="线性组合"/>
          {names.map((name,i)=><div shuku-edit-id="e-785e192b-1fa4-41b3-a8ae-cc88d28511be" className="rl-tr-weight" key={name}><Formula latex={`w_${i+1}`} tip={`${name}对应的权重。左侧为上次迭代值，右侧为当前值。`}/>{!inference&&<><Typography shuku-edit-id="e-c1867e16-e07e-434b-b7d1-3558f9223697" variant="bodySmall" tone="muted">{fmt(training.previous[i+1])}</Typography><span shuku-edit-id="e-7e9d0416-b51d-42ca-9cf1-4be63d4b6769" aria-hidden="true">→</span></>}<Typography shuku-edit-id="e-9e203113-50dc-4cdf-8f29-89a9b316fd2d" variant="body" tone="accent">{fmt(training.weights[i+1])}</Typography></div>)}
          <div shuku-edit-id="e-6bcb101f-a719-46b1-82a5-b82a55372767" className="rl-tr-weight rl-tr-bias"><Formula latex="b" tip="偏置不乘以乘客特征，直接加入线性分数。"/>{!inference&&<><Typography shuku-edit-id="e-1a7b47bb-d2b2-4e3e-a5f6-ee16ef433930" variant="bodySmall" tone="muted">{fmt(training.previous[0])}</Typography><span shuku-edit-id="e-3ee785b8-0bcc-46da-8394-df4cd6ba34ba" aria-hidden="true">→</span></>}<Typography shuku-edit-id="e-12fca6f6-2f3a-4713-8f5b-0e2504fc1f87" variant="body" tone="accent">{fmt(training.weights[0])}</Typography></div>
        </section>
        <section shuku-edit-id="e-5c2eed31-5cdc-4301-acb1-8e9b334c3237" className="rl-tr-panel rl-tr-sum"><Heading n={3} title="加权求和"/>
          <div shuku-edit-id="e-6875f2a9-2f57-4bdd-b588-d1c54b222ee9" className="rl-tr-sum-visual"><svg shuku-edit-id="e-273a2676-cbe4-42e5-bc1a-d9f85b1181c8" className="rl-tr-connections" viewBox="0 0 220 180" aria-hidden="true"><defs shuku-edit-id="e-43836a87-6802-439e-83f2-1623bd085027"><marker shuku-edit-id="e-54def566-1071-49ca-89af-1518c4bebd58" id="rl-tr-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path shuku-edit-id="e-42874df0-4804-4617-b0f2-35a89a4d4637" d="M0,0 L6,3 L0,6" fill="#267cf3"/></marker></defs>{[15,60,105,150].map(y=><line shuku-edit-id="e-582e57a3-0762-48d6-8401-4cdfd9dffd11" key={y} x1="2" y1={y} x2="80" y2="85" stroke="#267cf3" strokeWidth="2" markerEnd="url(#rl-tr-arrow)"/>)}<circle shuku-edit-id="e-b8048f54-bc3a-4459-a556-e89c2f22409e" cx="145" cy="85" r="62" fill="#edf5ff" stroke="#267cf3" strokeWidth="2"/></svg>
          <div shuku-edit-id="e-950b27f6-e4ac-4dc4-85d7-1b902dcf0b0b" className="rl-tr-sigma"><Formula latex="\Sigma"/></div></div><Formula latex={`z=${z.toFixed(3)}`} tip="每个数字输入乘以对应权重，将四项相加，再加上偏置。"/><Formula latex="z=\mathbf w^\top\mathbf x+b"/>
        </section>
        <section shuku-edit-id="e-fba5d3ac-5515-4211-8f52-fc908c6703ac" className="rl-tr-panel rl-tr-sigmoid"><Heading n={4} title="Sigmoid"/>
          <svg shuku-edit-id="e-3d463613-b073-4ba8-a144-837916c2015f" viewBox="0 0 220 170" aria-hidden="true"><path shuku-edit-id="e-1978099e-a3bf-40c3-8e51-fc1d13223e48" d="M20 15 V150 H210" fill="none" stroke="#9aabc3" strokeWidth="2"/><path shuku-edit-id="e-f9dd7ec2-73b9-421b-a898-f76dbe08dd04" d={Array.from({length:81},(_,i)=>{const xx=i/80*12-6;return `${i?'L':'M'}${20+i/80*180},${145-sigmoid(xx)*120}`;}).join(' ')} fill="none" stroke="#267cf3" strokeWidth="3"/></svg><Formula latex="p=\frac{1}{1+e^{-z}}" tip="Sigmoid把线性分数映射为存活概率。"/>
        </section>
        <section shuku-edit-id="e-ef8d1046-95ef-46b4-a7ba-a8b0bd50dcd3" className="rl-tr-panel rl-tr-result"><Heading n={5} title="预测结果"/>
          <div shuku-edit-id="e-19ebf7b5-8e8d-40d1-815b-c2d3d566f20a" className="rl-tr-probability"><Typography shuku-edit-id="e-ad95e5f1-7343-4cba-a1fc-baf947edb5ee" variant="bodySmall" tone="success">存活概率</Typography><Typography shuku-edit-id="e-7ac073d4-9ed9-4a95-9152-e8a7627e71e7" variant="h1" tone="success">{(probability*100).toFixed(1)}%</Typography><Typography shuku-edit-id="e-1e139d39-16e2-4d89-b9d3-d19fe3819785" variant="body" tone="success">{probability>=.5?'预测：存活':'预测：未存活'}</Typography></div>
          {!inference&&<div shuku-edit-id="e-5ec2931d-95d1-4809-8823-d02ae44c7628" className="rl-tr-gt"><Typography shuku-edit-id="e-3e900285-37f7-4593-9641-5facce51cc1b" variant="bodySmall" tone="muted">实际标签</Typography><Typography shuku-edit-id="e-e6b6b3d3-55ac-42ca-baf8-32f9bf83a565" variant="body" tone={person.Survived?'success':'danger'}>{person.Survived?'1 · 存活':'0 · 未存活'}</Typography></div>}
        </section>
      </div>
      <div shuku-edit-id="e-e352835d-3395-422b-94c9-615f87649396" className="rl-tr-bottom">
        <section shuku-edit-id="e-eab05145-845d-48e2-8cde-32d14bb387d3" className="rl-tr-monitor"><div shuku-edit-id="e-8db98bac-127b-4641-9aa9-7275ec8abef6" className="rl-tr-monitor-title"><Typography shuku-edit-id="e-eb43dacc-e050-4651-a065-4fe922ce38c3" variant="h3" tone="accent">MAE 变化</Typography><Typography shuku-edit-id="e-249dd055-836e-4044-94a9-d33ec511ddfd" variant="body" tone="accent">{metrics.mae.toFixed(3)}</Typography></div><EChartsChart option={chart} minHeight={0} className="rl-tr-chart" aria-label="全体训练样本平均绝对误差随迭代的变化"/></section>
        <section shuku-edit-id="e-bccf47a6-f7d9-48aa-85c1-c75b68817c42" className="rl-tr-update"><Typography shuku-edit-id="e-621d0d43-4c9c-4439-afca-a9a29b1155bf" variant="h3" tone="accent">{inference?'固定参数，计算预测':'参数更新'}</Typography><Formula latex={inference?String.raw`p=\sigma(\mathbf w^\top\mathbf x+b)`:String.raw`w_j\leftarrow w_j-\eta\frac{1}{n}\sum_i(p_i-y_i)x_{ij}`} tip={inference?'推理只改变输入，权重与偏置保持不变。':'对全部714位年龄非缺失乘客求平均梯度，学习率η=0.4。优化目标是平均负对数似然，即极大似然估计；偏置同样更新，对应输入恒为1。'}/><Typography shuku-edit-id="e-bc9da651-8b8b-478e-aeb3-e43e54108ac1" variant="bodySmall" tone="muted">{inference?'调整输入，观察存活概率。':'预测与标签的偏差 → 梯度 → 更新权重'}</Typography><Typography shuku-edit-id="e-77aee3ff-445a-4e70-b536-a14ad099f0f6" variant="bodySmall" tone="muted">{inference?'以 0.5 为分类阈值。':'拟合：极大似然 · 观察：MAE'}</Typography></section>
        <div shuku-edit-id="e-b83f45e8-f520-49b3-8205-c14a2d3246e4" className="rl-tr-controls">{inference?<><Button variant="primary" onClick={()=>setInference(false)}>返回参数估计</Button><Button onClick={()=>setInputs(passengerInputs(index))}>恢复乘客资料</Button><Button onClick={()=>{setRunning(false);setInference(false);setTraining(initialTraining());}}>重新估计</Button></>:<><Button variant="primary" disabled={running||training.complete} onClick={()=>setTraining(s=>advance(s))}>迭代一步</Button><Button disabled={training.complete} onClick={()=>setRunning(v=>!v)}>{running?'暂停迭代':training.complete?'迭代完成':'连续迭代'}</Button><Button onClick={enter}>进入推理</Button></>}</div>
      </div>
    </div>
  </ContentBlock>;
}

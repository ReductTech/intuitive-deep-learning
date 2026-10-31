import { MathFormulaStatic, Typography } from '../../../shared/react';
import { useLayoutEffect, useRef, useState } from 'react';
import { AttentionReadingFlow } from '../../components/AttentionReadingFlow';
import { AttentionActivity, ChoiceButtons, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { useAttentionLesson } from '../../model/AttentionLessonContext';
import { QKV_TASKS } from '../../model/qkvRole';
import './AttentionKeyValuePurposePage.css';
const replacements=['小红','饿了','超市','果汁'];
export function AttentionKeyValuePurposePage(props: ActivityProps) {
  const {qkv}=useAttentionLesson();
  const [changed,setChanged]=useActivityState('C26-value-changed',false);
  const current=QKV_TASKS.find(t=>t.id===qkv.task)??QKV_TASKS[2];
  const queryRef=useRef<HTMLElement>(null);
  const keyRef=useRef<HTMLDivElement>(null);
  const wireRef=useRef<SVGSVGElement>(null);
  const [wire,setWire]=useState<{path:string;head:string}|null>(null);
  useLayoutEffect(()=>{
    const update=()=>{
      const svg=wireRef.current?.getBoundingClientRect(),q=queryRef.current?.getBoundingClientRect(),k=keyRef.current?.getBoundingClientRect();
      if(!svg||!q||!k||!svg.width||!svg.height)return;
      const x1=(q.right-svg.left)/svg.width*100,y1=(q.top+q.height/2-svg.top)/svg.height*100;
      const x2=(k.left-svg.left)/svg.width*100,y2=(k.top+k.height/2-svg.top)/svg.height*100;
      const bend=(x1+x2)/2;
      setWire({path:`M${x1} ${y1}C${bend} ${y1} ${bend} ${y2} ${x2} ${y2}`,head:`M${x2-.6} ${y2-1.6}L${x2} ${y2}L${x2-.6} ${y2+1.6}`});
    };
    update();const observer=new ResizeObserver(update);
    for(const element of [wireRef.current,queryRef.current,keyRef.current])if(element)observer.observe(element);
    return()=>observer.disconnect();
  },[current.id]);
  return <AttentionActivity {...props} number={26} title="Q、K、V：问题、索引与内容" learningFlow={<AttentionReadingFlow/>} eyebrow="同一条记录 · 两种用途" done={changed} footerHeight={200}
    footer={<div className="attn-kv-purpose-footer"><Typography variant="h3" tone="accent">只改 V：K、w 不变，结果 r 改变。</Typography><ChoiceButtons label="改变当前记录的值" value={changed?'changed':'original'} options={[{value:'original',label:'原来的 V'},{value:'changed',label:'改变 V'}]} onChange={v=>setChanged(v==='changed')}/><div className="attn-kv-purpose-result" aria-label="实际加权读取结果"><Typography variant="bodySmall" tone="accent">结果 r · 读取份额（手设示意）</Typography><div>{QKV_TASKS.map((t,i)=><Typography key={t.id} variant="bodySmall" tone={t.id===current.id?'success':'muted'}>{t.id===current.id?'70%':'10%'} · {changed&&t.id===current.id?replacements[i]:t.content}</Typography>)}</div></div></div>}>
    <div className="attn-kv-purpose-main" role="group" aria-label="K保留内容的匹配信息，V提供读取内容">
      <section ref={queryRef} className="attn-kv-purpose-query"><Typography variant="bodySmall" tone="accent">Q · 问题</Typography><Typography variant="h3">{current.question}</Typography></section>
      <div className="attn-kv-purpose-query-arrow" aria-hidden="true"><svg ref={wireRef} viewBox="0 0 100 100" preserveAspectRatio="none">{wire&&<><path d={wire.path} vectorEffect="non-scaling-stroke"/><path d={wire.head} vectorEffect="non-scaling-stroke"/></>}</svg></div>
      <div className="attn-kv-purpose-pairs">
        <Typography variant="bodySmall" tone="accent">K · 匹配索引</Typography><Typography variant="bodySmall" tone="muted" align="center">w</Typography><Typography variant="bodySmall" tone="success">V · 对应内容</Typography>
        {QKV_TASKS.map((t,i)=><div className="attn-kv-purpose-pair" key={t.id}>
          <div ref={t.id===current.id?keyRef:undefined} className={'attn-kv-purpose-cell is-key'+(t.id===current.id?' is-selected':'')}><Typography variant="h3" tone="inherit">{t.clue}</Typography></div>
          <Typography variant="bodySmall" tone={t.id===current.id?'accent':'muted'} align="center">{t.id===current.id?'70%':'10%'}</Typography>
          <div className={'attn-kv-purpose-cell is-value'+(t.id===current.id?' is-selected':'')}><Typography variant="h3" tone="inherit">{changed&&t.id===current.id?replacements[i]:t.content}</Typography></div>
        </div>)}
        <Typography variant="bodySmall" tone="accent" className="attn-kv-purpose-caption"><MathFormulaStatic className="attn-inline-math" latex={String.raw`\boldsymbol w=f(\boldsymbol q,K)\qquad\boldsymbol r=\sum_iw_i\boldsymbol v_i`}/></Typography>
      </div>
    </div>
  </AttentionActivity>;
}

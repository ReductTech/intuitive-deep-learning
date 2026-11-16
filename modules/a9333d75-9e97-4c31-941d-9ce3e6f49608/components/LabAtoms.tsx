import { useEffect, useId, useState, type ReactNode } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { brokenProgram, clockText, newClock, pauseClock, startClock, tickClock, type ClockState, type Program } from '../model/labModel';

export function LabText({children, variant = 'body', tone = 'main', className = ''}: {
  children: ReactNode; variant?: 'body'|'bodySmall'|'h3'|'display'|'subtitle';
  tone?: 'main'|'muted'|'accent'|'success'|'warning'|'danger'|'inherit'; className?: string;
}) { return <Typography shuku-edit-id="e-2eec4bc5-6326-443d-bc43-f11abac3e64b" as="div" variant={variant} tone={tone} className={className}>{children}</Typography>; }
export function LabStatus({children, state = 'idle'}: {children: ReactNode; state?: 'idle'|'busy'|'pass'|'fail'|'warn'}) {
  return <div shuku-edit-id="e-490859c2-82f0-459b-a69c-116569e6e46a" className={`actlab-status is-${state}`}><i shuku-edit-id="e-386c09a7-4f1e-43f8-8346-df235f3adb05"/><LabText variant="bodySmall" tone="inherit">{children}</LabText></div>;
}
export function CodeLines({lines, active = -1}: {lines: string[]; active?: number}) {
  return <div shuku-edit-id="e-9457445f-67f3-44a3-8a75-2ccbd4da31e1" className="actlab-code">{lines.map((line,i)=><div shuku-edit-id="e-9b08366c-faf7-44e6-b082-453d62210210" className={active===i?'is-current':''} key={`${i}-${line}`}><LabText variant="bodySmall" tone="inherit" className="actlab-line-number">{String(i+1).padStart(2,'0')}</LabText><Typography shuku-edit-id="e-17e37fa3-c3a3-4b90-87e1-0f66528ca1bc" as="code" variant="bodySmall" tone="inherit">{line || ' '}</Typography></div>)}</div>;
}
export function ClockDial({state, label, ghost}: {state: ClockState; label?: string; ghost?: number|null}) {
  const id=useId().replace(/:/g,'');
  const progress=state.remaining/state.duration;
  return <div shuku-edit-id="e-5b07b171-cf3c-4552-9b40-0720df4407ac" className={`actlab-dial ${state.running?'is-running':''} ${!state.running&&state.callbackRegistered?'is-leaking':''}`}>
    <svg shuku-edit-id="e-88a7872d-d04e-44f1-8023-5f9f8273c179" viewBox="0 0 260 260" aria-hidden="true"><defs shuku-edit-id="e-9e747d9f-435f-4527-bd77-37035dab87d2"><linearGradient shuku-edit-id="e-9085424a-7ec4-4c77-937c-8400d594e4cf" id={id}><stop shuku-edit-id="e-f7dcbd3b-aeae-4b9a-b079-6419af778ee2" stopColor="var(--ui-accent-alt)"/><stop shuku-edit-id="e-f3ddb615-4385-4ce7-b4f6-8e8e0ed4c53a" offset="1" stopColor="#f4b16e"/></linearGradient></defs><circle shuku-edit-id="e-da4510a0-e699-4311-862e-9265fbe36bfc" className="actlab-dial-track" cx="130" cy="130" r="113"/>
      <circle shuku-edit-id="e-07c45284-1ca4-4446-89e5-d99f4f4f9c28" className="actlab-dial-progress" cx="130" cy="130" r="113" stroke={`url(#${id})`} strokeDasharray="710" strokeDashoffset={710*(1-progress)} transform="rotate(-90 130 130)"/>
      {ghost!==null&&ghost!==undefined&&<circle shuku-edit-id="e-6fbef787-fd6a-4319-a720-0e21615dddc0" className="actlab-dial-ghost" cx={130+113*Math.sin(ghost/state.duration*2*Math.PI)} cy={130-113*Math.cos(ghost/state.duration*2*Math.PI)} r="8"/>}
    </svg><div shuku-edit-id="e-be6eccb8-1caf-460d-aa27-a9a2dd007fed" className="actlab-dial-copy"><LabText variant="display">{clockText(state.remaining)}</LabText><LabText variant="bodySmall" tone="muted">{label ?? (state.completed?'本轮完成':state.running?'专注中':state.callbackRegistered?'界面已暂停':state.remaining<state.duration?'已暂停':'准备开始')}</LabText></div>
  </div>;
}
export function WorkingTimer({program = brokenProgram, onPause, compact = false}: {
  program?: Program; onPause?: (before: ClockState, after: ClockState) => void; compact?: boolean;
}) {
  const [state,setState]=useState(()=>newClock());
  const [automatic,setAutomatic]=useState(true);
  useEffect(()=>{
    if(!automatic||!state.callbackRegistered)return;
    const timer=window.setTimeout(()=>setState(s=>tickClock(s,program)),1000);
    return()=>window.clearTimeout(timer);
  },[automatic,state,program]);
  return <div shuku-edit-id="e-aec3f341-77e0-40d2-a134-a631af58d81a" className={`actlab-working-timer ${compact?'is-compact':''}`}><ClockDial state={state}/><div shuku-edit-id="e-69e657aa-0cc4-406d-a356-805eb4c3abc4" className="actlab-controls">
    <Button variant="primary" disabled={state.running} onClick={()=>setState(s=>startClock(s,program))}>{state.completed?'再来一轮':state.remaining<5?'继续':'开始'}</Button>
    <Button disabled={!state.running} onClick={()=>{const after=pauseClock(state,program);setState(after);onPause?.(state,after)}}>暂停</Button>
    <Button onClick={()=>setState(newClock())}>重置</Button></div>{!compact&&<div shuku-edit-id="e-ece95660-4d72-49a7-a146-310d9dc31ae2" className="actlab-controls"><Button active={!automatic} onClick={()=>setAutomatic(v=>!v)}>手动时钟</Button><Button disabled={automatic||!state.callbackRegistered} onClick={()=>setState(s=>tickClock(s,program))}>推进 1 秒</Button></div>}
    <LabText variant="bodySmall" tone="muted">教学预览：一轮 5 秒 · 完成 {state.rounds} 轮</LabText>
  </div>;
}

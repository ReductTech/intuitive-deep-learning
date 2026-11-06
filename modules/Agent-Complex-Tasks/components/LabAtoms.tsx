import { useEffect, useId, useState, type ReactNode } from 'react';
import { Button, Typography } from '../../shared/react';
import { brokenProgram, clockText, newClock, pauseClock, startClock, tickClock, type ClockState, type Program } from '../model/labModel';

export function LabText({children, variant = 'body', tone = 'main', className = ''}: {
  children: ReactNode; variant?: 'body'|'bodySmall'|'h3'|'display'|'subtitle';
  tone?: 'main'|'muted'|'accent'|'success'|'warning'|'danger'|'inherit'; className?: string;
}) { return <Typography as="div" variant={variant} tone={tone} className={className}>{children}</Typography>; }
export function LabStatus({children, state = 'idle'}: {children: ReactNode; state?: 'idle'|'busy'|'pass'|'fail'|'warn'}) {
  return <div className={`actlab-status is-${state}`}><i/><LabText variant="bodySmall" tone="inherit">{children}</LabText></div>;
}
export function CodeLines({lines, active = -1}: {lines: string[]; active?: number}) {
  return <div className="actlab-code">{lines.map((line,i)=><div className={active===i?'is-current':''} key={`${i}-${line}`}><LabText variant="bodySmall" tone="inherit" className="actlab-line-number">{String(i+1).padStart(2,'0')}</LabText><Typography as="code" variant="bodySmall" tone="inherit">{line || ' '}</Typography></div>)}</div>;
}
export function ClockDial({state, label, ghost}: {state: ClockState; label?: string; ghost?: number|null}) {
  const id=useId().replace(/:/g,'');
  const progress=state.remaining/state.duration;
  return <div className={`actlab-dial ${state.running?'is-running':''} ${!state.running&&state.callbackRegistered?'is-leaking':''}`}>
    <svg viewBox="0 0 260 260" aria-hidden="true"><defs><linearGradient id={id}><stop stopColor="var(--ui-accent-alt)"/><stop offset="1" stopColor="#f4b16e"/></linearGradient></defs><circle className="actlab-dial-track" cx="130" cy="130" r="113"/>
      <circle className="actlab-dial-progress" cx="130" cy="130" r="113" stroke={`url(#${id})`} strokeDasharray="710" strokeDashoffset={710*(1-progress)} transform="rotate(-90 130 130)"/>
      {ghost!==null&&ghost!==undefined&&<circle className="actlab-dial-ghost" cx={130+113*Math.sin(ghost/state.duration*2*Math.PI)} cy={130-113*Math.cos(ghost/state.duration*2*Math.PI)} r="8"/>}
    </svg><div className="actlab-dial-copy"><LabText variant="display">{clockText(state.remaining)}</LabText><LabText variant="bodySmall" tone="muted">{label ?? (state.completed?'本轮完成':state.running?'专注中':state.callbackRegistered?'界面已暂停':state.remaining<state.duration?'已暂停':'准备开始')}</LabText></div>
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
  return <div className={`actlab-working-timer ${compact?'is-compact':''}`}><ClockDial state={state}/><div className="actlab-controls">
    <Button variant="primary" disabled={state.running} onClick={()=>setState(s=>startClock(s,program))}>{state.completed?'再来一轮':state.remaining<5?'继续':'开始'}</Button>
    <Button disabled={!state.running} onClick={()=>{const after=pauseClock(state,program);setState(after);onPause?.(state,after)}}>暂停</Button>
    <Button onClick={()=>setState(newClock())}>重置</Button></div>{!compact&&<div className="actlab-controls"><Button active={!automatic} onClick={()=>setAutomatic(v=>!v)}>手动时钟</Button><Button disabled={automatic||!state.callbackRegistered} onClick={()=>setState(s=>tickClock(s,program))}>推进 1 秒</Button></div>}
    <LabText variant="bodySmall" tone="muted">教学预览：一轮 5 秒 · 完成 {state.rounds} 轮</LabText>
  </div>;
}

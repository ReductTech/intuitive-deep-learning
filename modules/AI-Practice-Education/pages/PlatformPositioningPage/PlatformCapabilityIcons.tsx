import { useId } from 'react';

export function PlatformCapabilityIcon({ index }: { index: number }) {
  const id = `aipf-icon-${useId().replaceAll(':','')}`;
  return <svg className="aipf-icon" viewBox="0 0 180 160" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-navy`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4b6b9c"/><stop offset="1" stopColor="#244579"/></linearGradient>
      <linearGradient id={`${id}-blue`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4b9cf7"/><stop offset="1" stopColor="#236fdb"/></linearGradient>
      <linearGradient id={`${id}-pale`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#b9d9ff"/><stop offset="1" stopColor="#7cafea"/></linearGradient>
      <linearGradient id={`${id}-amber`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d9ad4b"/><stop offset="1" stopColor="#c58d26"/></linearGradient>
    </defs>
    {index === 0 ? <>
      <path d="M108 66V34q0-12-12-12H44Q32 22 32 34v90q0 12 12 12h40" fill="#fff" stroke={`url(#${id}-navy)`} strokeWidth="7" strokeLinecap="round"/>
      <path d="M52 47h41M52 69h24M52 91h24" fill="none" stroke={`url(#${id}-navy)`} strokeWidth="7" strokeLinecap="round"/>
      <circle cx="115" cy="111" r="27" fill="#eff7ff" stroke={`url(#${id}-blue)`} strokeWidth="8"/>
      <path d="m135 132 22 22" stroke={`url(#${id}-blue)`} strokeWidth="9" strokeLinecap="round"/>
      <path d="M97 108a18 18 0 0 1 22-15" fill="none" stroke="#d5e9ff" strokeWidth="3" strokeLinecap="round"/>
    </> : index === 1 ? <>
      <path d="m90 89 67 32-67 33-67-33Z" fill={`url(#${id}-pale)`} opacity=".65"/>
      <path d="m90 63 67 32-67 33-67-33Z" fill={`url(#${id}-pale)`}/>
      <path d="m90 27 67 36-67 35-67-35Z" fill={`url(#${id}-blue)`}/>
      <path d="m25 64 65 34 65-34" fill="none" stroke="#edf6ff" strokeWidth="2.3" strokeLinejoin="round"/>
      <path d="m25 96 65 32 65-32M25 122l65 32 65-32" fill="none" stroke="#edf6ff" strokeWidth="2.3" strokeLinejoin="round"/>
    </> : index === 2 ? <>
      <rect x="18" y="31" width="142" height="108" rx="6" fill="#fff" stroke="#729bd0" strokeWidth="5"/>
      <path d="M18 56V37q0-7 7-7h128q7 0 7 7v19Z" fill={`url(#${id}-navy)`}/>
      {[32,46,60].map(x=><circle key={x} cx={x} cy="43" r="4" fill="#f5f9ff"/>)}
      <path d="m55 77-17 17 17 17m28-34 17 17-17 17M74 74l-11 42" stroke={`url(#${id}-navy)`} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {[0,1,2].map(i=><rect key={i} x={106+i*16} y={121-i*19} width="12" height={18+i*19} rx="2" fill={`url(#${id}-blue)`}/>)}
    </> : <>
      {[0,1,2].map(i=><rect key={i} x={37+i*38} y={107-i*25} width="27" height={34+i*25} rx="3" fill={`url(#${id}-${i===0?'pale':'blue'})`}/>)}
      <path d="M38 84q51-9 84-51" stroke={`url(#${id}-amber)`} strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="m111 31 27-6-8 28-5-16Z" fill={`url(#${id}-amber)`}/>
    </>}
  </svg>;
}

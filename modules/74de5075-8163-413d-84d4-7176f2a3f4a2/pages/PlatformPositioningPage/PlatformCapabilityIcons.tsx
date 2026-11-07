import { useId, type CSSProperties } from 'react';

const delay = (index: number) => ({ '--icon-delay': `${index * .2}s` } as CSSProperties);

export function PlatformCapabilityIcon({ index }: { index: number }) {
  const id = `aip-icon-${useId().replaceAll(':', '')}`;
  return <svg className="aipe-platform-icon" viewBox="0 0 180 180" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-blue`} x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#6db9ff"/><stop offset="1" stopColor="#2373db"/></linearGradient>
      <linearGradient id={`${id}-navy`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#28528c"/><stop offset="1" stopColor="#113361"/></linearGradient>
      <linearGradient id={`${id}-pale`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#cce8ff"/><stop offset="1" stopColor="#80bbf5"/></linearGradient>
      <linearGradient id={`${id}-white`} x1="0" y1="0" x2=".5" y2="1"><stop stopColor="#fff"/><stop offset="1" stopColor="#f0f8ff"/></linearGradient>
      <linearGradient id={`${id}-orange`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffce60"/><stop offset="1" stopColor="#fa9829"/></linearGradient>
    </defs>
    {index === 0 ? <>
      <rect x="66" y="21" width="74" height="103" rx="10" fill="#c2e1ff" transform="rotate(9 103 72)"/>
      <rect x="52" y="30" width="77" height="108" rx="10" fill={`url(#${id}-pale)`}/>
      <rect x="25" y="42" width="83" height="111" rx="9" fill={`url(#${id}-white)`} stroke="#c1dfff" strokeWidth="2"/>
      <path d="M39 61h27" stroke="#ffb447" strokeWidth="6" strokeLinecap="round"/>
      {[0, 1, 2, 3].map(i => <path key={i} d={`M39 ${79 + i * 15}h${i === 3 ? 26 : 51}`} stroke="#b0d6ff" strokeWidth="5" strokeLinecap="round"/>)}
      <g className="aip-icon-lens">
        <path d="m132 136 20 23" stroke={`url(#${id}-navy)`} strokeWidth="14" strokeLinecap="round"/>
        <circle cx="113" cy="119" r="29" fill={`url(#${id}-blue)`} stroke="#2c76cb" strokeWidth="3"/>
        <circle cx="113" cy="119" r="20" fill="#c4e6ff" stroke="#effaff" strokeWidth="3"/>
        <path d="M101 117q0-10 10-12" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round"/>
      </g>
    </> : index === 1 ? <>
      <rect x="20" y="31" width="141" height="120" rx="10" fill={`url(#${id}-white)`} stroke="#bbdcff" strokeWidth="2"/>
      <path d="M20 54V41q0-10 10-10h121q10 0 10 10v13Z" fill={`url(#${id}-blue)`}/>
      {['#ffc15d', '#8cddcb', '#c9e9ff'].map((color, i) => <circle key={color} cx={33 + i * 12} cy="42" r="3.5" fill={color}/>)}
      {[0, 1, 2, 3].map(i => <path key={i} d={`M34 ${72 + i * 15}h${i % 2 ? 26 : 35}`} stroke="#b5d9ff" strokeWidth="5" strokeLinecap="round"/>)}
      <path className="aip-icon-link" d="m95 105 22-30 26 29-22 29-26-28 48-1M117 75l4 58" stroke="#88bdf6" strokeWidth="3" fill="none"/>
      {[[95,105],[117,75],[143,104],[121,133]].map(([cx,cy], i) => <circle key={i} className="aip-icon-node" style={delay(i)} cx={cx} cy={cy} r="10" fill={i === 2 ? `url(#${id}-orange)` : `url(#${id}-blue)`}/>)}
      <path d="M38 137q13-6 26 1 13-7 26-1v23q-13-5-26 1-13-6-26-1Z" fill="#fff" stroke="#79b7f5" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M64 139v21" stroke="#79b7f5" strokeWidth="2"/>
    </> : index === 2 ? <>
      <rect x="20" y="33" width="141" height="115" rx="10" fill={`url(#${id}-white)`} stroke="#b9dbff" strokeWidth="2"/>
      <path d="M20 57V43q0-10 10-10h121q10 0 10 10v14Z" fill={`url(#${id}-navy)`}/>
      {['#ffbf62', '#80d3cf', '#9dc9ff'].map((color, i) => <circle key={color} cx={34+i*12} cy="45" r="3.5" fill={color}/>)}
      <path className="aip-icon-code" d="m58 73-12 10 12 10m28-20 12 10-12 10M77 70l-9 27" stroke="#285b99" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {[0, 1, 2].map(i => <rect key={i} className="aip-icon-bar" style={delay(i)} x={101+i*17} y={128-i*16} width="12" height={21+i*16} rx="4" fill={`url(#${id}-${i===2?'orange':'blue'})`}/>)}
      <path d="M37 110h25m-20 0v19l-13 27q-4 8 5 8h34q9 0 5-8l-15-27v-19" fill="#e8f7ff" stroke="#72b5f3" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>
      <path d="m37 147-5 11q-1 3 3 3h32q4 0 2-3l-6-11Z" fill={`url(#${id}-blue)`}/>
      <circle className="aip-icon-node" cx="50" cy="140" r="3" fill="#74bcff"/>
    </> : index === 3 ? <>
      <rect x="20" y="35" width="141" height="119" rx="12" fill={`url(#${id}-white)`} stroke="#c0ddfc" strokeWidth="2"/>
      <circle cx="52" cy="65" r="20" fill={`url(#${id}-navy)`}/>
      <circle cx="52" cy="60" r="6" fill="#fff"/>
      <path d="M40 77q0-12 12-12t12 12" fill="#fff"/>
      <path d="M84 55h54M84 69h39" stroke="#a8d1ff" strokeWidth="5" strokeLinecap="round"/>
      {[0, 1, 2].map(i => <g key={i}>
        <circle cx="40" cy={100+i*17} r="6.5" fill={`url(#${id}-blue)`}/>
        <path className="aip-icon-check" style={delay(i)} d={`m37 ${100+i*17} 2 2 4-5`} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d={`M55 ${100+i*17}h${i===1?27:37}`} stroke="#b5d9ff" strokeWidth="5" strokeLinecap="round"/>
      </g>)}
      {[0, 1, 2].map(i => <rect key={i} className="aip-icon-bar" style={delay(i)} x={106+i*14} y={126-i*11} width="10" height={15+i*11} rx="3" fill={['#7bc9d1','#67a9f9',`url(#${id}-orange)`][i]}/>)}
    </> : <>
      <path d="M16 158q0-46 39-46 37 0 40 46" fill={`url(#${id}-blue)`}/>
      <path d="m43 111 12 18 12-18 8 47H35Z" fill="#eef8ff"/>
      <path d="m53 132-4 23 7 6 6-6-6-23" fill="#2d619d"/>
      <rect x="47" y="98" width="17" height="20" rx="6" fill="#f4bf9c"/>
      <ellipse cx="55" cy="82" rx="23" ry="27" fill="#ffcfad"/>
      <path d="M31 85V69q1-25 24-23 24-2 25 23l-9 11-4-18q-13 11-27 6l-1 18Z" fill={`url(#${id}-navy)`}/>
      <path d="M36 81h15v10H38Zm20 0h15v10H58Zm-5 3h6" fill="none" stroke="#285587" strokeWidth="2.5" strokeLinejoin="round"/>
      <path className="aip-icon-mentor" d="m79 137 19-16 3-19q1-5 5-3l2 15 5-8q3-4 5 0l-6 22-22 23Z" fill="#ffcfad"/>
      <path d="M112 158q-2-36 26-36 28 0 30 36" fill={`url(#${id}-pale)`}/>
      <rect x="131" y="112" width="13" height="14" rx="5" fill="#f3bb97"/>
      <ellipse cx="138" cy="101" rx="19" ry="22" fill="#ffcfad"/>
      <path d="M118 102V88q0-16 20-16 23-1 22 19l-9 11-4-15q-9 9-22 5v13Z" fill={`url(#${id}-navy)`}/>
      <path d="m54 133 54 2 12 33H65Z" fill={`url(#${id}-navy)`} stroke="#4f8acb" strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="86" cy="151" r="4" fill="#80bdff"/>
      <path d="M63 169h66" stroke="#528cc8" strokeWidth="4" strokeLinecap="round"/>
      <g className="aip-icon-bulb">
        <path d="M132 30a16 16 0 0 1 32 0c0 8-8 12-9 19h-14c-1-7-9-11-9-19Z" fill={`url(#${id}-orange)`}/>
        <path d="m143 30 5 6 5-6m-5 6v13" fill="none" stroke="#fff5c5" strokeWidth="2" strokeLinecap="round"/>
        <path d="M142 52h12m-10 5h8" stroke="#688db1" strokeWidth="3" strokeLinecap="round"/>
      </g>
      <path className="aip-icon-rays" d="M148 4v-6m-26 15-5-4m7 24h-7m54-20 5-4m-4 24h7" fill="none" stroke="#f7b74e" strokeWidth="3" strokeLinecap="round"/>
    </>}
  </svg>;
}

export function PlatformLearnerIcon() {
  const id = `aip-learner-${useId().replaceAll(':', '')}`;
  return <svg className="aipe-platform-learner" viewBox="0 0 160 160" aria-hidden="true">
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#acd9ff"/><stop offset="1" stopColor="#5fa3eb"/></linearGradient></defs>
    <path d="M23 154q0-50 34-59h46q34 9 34 59" fill={`url(#${id})`}/>
    <path d="M65 79h30v24q-15 17-30 0Z" fill="#f5bf9b"/>
    <path d="M54 49q3-24 31-22 32-1 32 30v15q0 25-23 25-25 0-31-28Z" fill="#ffd0ad"/>
    <path d="M52 72q-10-13-6-31 1-14 14-18 0-13 17-14 14 1 20-2 19-8 24 5 4 11-10 18 3 14-8 21l-10 6q-14 13-17 32H62Z" fill="#214b82"/>
    <path d="M56 96q21 19 48 1l10 17q-34 24-68 0Z" fill="#c7e5ff" stroke="#8cc4f8" strokeWidth="2"/>
    <path d="M43 130v24m75-24v24" stroke="#7cb9f0" strokeWidth="2"/>
    <path d="m36 24-5-9m48-18v-9m46 28 7-9" fill="none" stroke="#8ac4fb" strokeWidth="5" strokeLinecap="round"/>
  </svg>;
}

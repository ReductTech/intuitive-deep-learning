import { useId } from 'react';

/** Two views of the same shop in Xiao Ming's story; only the shelf stock changes. */
export function DeskVectorScene({ roundTwo = false }: { roundTwo?: boolean }) {
  const id = useId();
  const wallId = `attention-shop-wall-${id}`;
  const shadowId = `attention-shop-shadow-${id}`;
  const bottleCount = roundTwo ? 3 : 2;
  return <svg className="attn-desk-vector" viewBox="0 0 820 440" role="img"
    aria-label={`小明走进商店，货架上有 ${bottleCount} 瓶蓝色冰水，旁边还有果汁和水果。`}>
    <defs>
      <linearGradient id={wallId} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e8f4ff"/><stop offset="1" stopColor="#f8fbff"/></linearGradient>
      <filter id={shadowId}><feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#31506f" floodOpacity=".15"/></filter>
    </defs>
    <rect width="820" height="440" rx="24" fill={`url(#${wallId})`}/>
    <rect x="0" y="352" width="820" height="88" fill="#e7d6bd"/>
    <path d="M0 352H820" stroke="#c5ac89" strokeWidth="6"/>
    <rect x="238" y="112" width="542" height="20" rx="7" fill="#8bafc5"/>
    <rect x="238" y="283" width="542" height="20" rx="7" fill="#8bafc5"/>
    <rect x="253" y="132" width="511" height="150" fill="#f1f8fc"/>
    <g filter={`url(#${shadowId})`}>
      {Array.from({ length: bottleCount }, (_, index) => <g key={index} transform={`translate(${292 + index * 105} 149)`}>
        <rect x="26" y="0" width="35" height="16" rx="4" fill="#1f6bb5"/>
        <path d="M25 15H62L72 35V119Q72 130 60 130H27Q15 130 15 119V35Z" fill="#69c8ec" stroke="#2078b8" strokeWidth="4"/>
        <path d="M17 65H70V103H17Z" fill="#d8f6ff"/>
        <path d="M28 75H59M34 86H54" stroke="#74bad6" strokeWidth="5" strokeLinecap="round"/>
      </g>)}
      <g transform={`translate(${roundTwo ? 645 : 555} 184)`}>
        <rect x="0" y="0" width="62" height="95" rx="8" fill="#f6a553" stroke="#cb7840" strokeWidth="4"/>
        <path d="M12 18H50M13 68H49" stroke="#fff1d7" strokeWidth="6"/>
      </g>
      <g transform="translate(673 319)"><circle cx="0" cy="0" r="26" fill="#ed7562"/><circle cx="51" cy="2" r="25" fill="#f4ca5c"/><path d="M-5-26q10-13 20-6" fill="none" stroke="#65a66e" strokeWidth="7"/></g>
    </g>
    <g transform="translate(125 155)" filter={`url(#${shadowId})`}>
      <circle cx="0" cy="0" r="37" fill="#f4c49a"/>
      <path d="M-34-8q-4-50 36-48 35 0 37 39-25-14-56-6Z" fill="#273e58"/>
      <path d="M-39 58Q0 34 39 58L51 160H-51Z" fill="#e7755d"/>
      <path d="M27 80Q87 76 110 119" fill="none" stroke="#f4c49a" strokeWidth="19" strokeLinecap="round"/>
      <path d="M-20 161L-31 206M23 161L34 206" stroke="#355474" strokeWidth="24" strokeLinecap="round"/>
    </g>
  </svg>;
}

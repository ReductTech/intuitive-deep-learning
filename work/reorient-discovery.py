from pathlib import Path
p=Path(r'C:/Users/Ocean/Documents/GitHub/intuitive-deep-learning/modules/Creator-Guide/pages/DiscoveryLearningPage.tsx')
s=p.read_text();a=s.index('function ResidualDiagram(');b=s.index('function PlainChain(',a)
s=s[:a]+'''function ResidualDiagram({teal=false}:{teal?:boolean}){
  const id=useId().replaceAll(':','');
  return <div className={`cg-discovery-residual${teal?' is-teal':''}`} role="img" aria-label="上方两个网络层组成残差分支，学习改动F(x)；下方直线捷径保留输入x，最后相加得到输出y">
    <svg viewBox="0 0 360 235" aria-hidden="true"><defs><marker id={`${id}teal`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#149b99"/></marker><marker id={`${id}blue`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#1b75ee"/></marker></defs>
    <path d="M23 160H277M311 160H340" stroke="#1b75ee" strokeWidth="2.8" fill="none" markerEnd={`url(#${id}blue)`}/>
    <path d="M33 160V83q0-5 5-5h24M146 78H171M255 78h34q5 0 5 5v60" stroke="#149b99" strokeWidth="2.5" fill="none" markerEnd={`url(#${id}teal)`}/>
    <rect x="62" y="52" width="84" height="52" rx="6" fill="#d2f1ef" stroke="#149b99" strokeWidth="1.6"/><rect x="171" y="52" width="84" height="52" rx="6" fill="#d2f1ef" stroke="#149b99" strokeWidth="1.6"/>
    <circle cx="294" cy="160" r="17" stroke="#183967" strokeWidth="2" fill="white"/><path d="M286 160h16M294 152v16" stroke="#183967" strokeWidth="2"/><circle cx="33" cy="160" r="3" fill="#1b75ee"/>
    </svg>
    <Typography as="span" variant="h3" tone="inherit" className="cg-discovery-x">x</Typography><Typography as="span" variant="h3" tone="inherit" className="cg-discovery-y">y</Typography><Typography variant="bodySmall" tone="inherit" className="cg-discovery-layer cg-discovery-layer-one">网络层</Typography><Typography variant="bodySmall" tone="inherit" className="cg-discovery-layer cg-discovery-layer-two">网络层</Typography>
    <Typography variant="bodySmall" tone="inherit" className="cg-discovery-residual-label">残差分支 · 学习改动 F(x)</Typography><Typography variant="bodySmall" tone="inherit" className="cg-discovery-shortcut-label">捷径 · 保留输入 x</Typography>
  </div>;
}
''' +s[b:]
a=s.index('<div className="cg-discovery-identity-diagram">');b=s.index('<Typography variant="body" tone="inherit" className="cg-discovery-step-caption">',a)
s=s[:a]+'''<div className="cg-discovery-identity-diagram" role="img" aria-label="输入x从左到右通过新增网络层，理想输出仍为x"><svg viewBox="0 0 310 160" aria-hidden="true"><path d="M25 92H64M245 92H283M137 92H158" stroke="#224977" strokeWidth="2.3"/><path d="M57 87l8 5-8 5M276 87l8 5-8 5M151 87l8 5-8 5" fill="#224977"/><rect x="67" y="58" width="175" height="67" rx="9" fill="white" stroke="#72a6d7" strokeDasharray="3 3"/><rect x="80" y="72" width="57" height="41" rx="5" fill="#d6eaff" stroke="#94b3d9"/><rect x="158" y="72" width="57" height="41" rx="5" fill="#d6eaff" stroke="#94b3d9"/></svg><Typography variant="h3" tone="inherit" className="cg-discovery-identity-input">x</Typography><Typography variant="bodySmall" tone="inherit" className="cg-discovery-new-layers">新增的网络层</Typography><Typography variant="h3" tone="inherit" className="cg-discovery-preserved">x</Typography><Typography variant="bodySmall" tone="inherit" className="cg-discovery-unchanged">输出不变</Typography></div>''' +s[b:]
p.write_text(s,encoding='utf-8')

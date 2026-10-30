from pathlib import Path
p=Path(r'C:/Users/Ocean/Documents/GitHub/intuitive-deep-learning/modules/Creator-Guide/pages/DiscoveryLearningPage.tsx');s=p.read_text()
a=s.index('function PlainChain(')
orig='''function OriginalResidualDiagram(){
  const id=useId().replaceAll(':','');
  return <div className="cg-discovery-residual cg-discovery-original" role="img" aria-label="原始残差结构：网络层输出F(x)，上方捷径传递输入x，汇合相加">
    <svg viewBox="0 0 360 235" aria-hidden="true"><defs><marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#284b7a"/></marker></defs><path d="M23 125H62M146 125H171M255 125H277M311 125H340" stroke="#284b7a" strokeWidth="2.3" fill="none" markerEnd={`url(#${id})`}/><path d="M33 125V43q0-5 5-5h251q5 0 5 5v65" stroke="#1b75ee" strokeWidth="3" fill="none" markerEnd={`url(#${id})`}/><rect x="62" y="99" width="84" height="52" rx="6" fill="#dce6f5" stroke="#7590b8" strokeWidth="1.6"/><rect x="171" y="99" width="84" height="52" rx="6" fill="#dce6f5" stroke="#7590b8" strokeWidth="1.6"/><circle cx="294" cy="125" r="17" stroke="#183967" strokeWidth="2" fill="white"/><path d="M286 125h16M294 117v16" stroke="#183967" strokeWidth="2"/><path d="M63 163q0 10 10 10h76q8 0 9 7 1-7 9-7h76q10 0 10-10" fill="none" stroke="#8099ba" strokeWidth="1.5"/></svg>
    <Typography as="span" variant="h3" tone="inherit" className="cg-discovery-x">x</Typography><Typography as="span" variant="h3" tone="inherit" className="cg-discovery-y">y</Typography><Typography variant="bodySmall" tone="inherit" className="cg-discovery-layer cg-discovery-layer-one">网络层</Typography><Typography variant="bodySmall" tone="inherit" className="cg-discovery-layer cg-discovery-layer-two">网络层</Typography><Typography variant="h3" tone="inherit" className="cg-discovery-f">F(x)</Typography>
  </div>;
}
'''
s=s[:a]+orig+s[a:];s=s.replace('<ResidualDiagram/>','<OriginalResidualDiagram/>')
s=s.replace('普通网络加深后<br/>更难训练','加深了网络，<br/>训练却更难').replace('如果新增层什么也不改，<br/>理想结果应该保留输入 x','新增层不改输入，<br/>就应保留原有结果').replace('ResNet 的想法：<br/>保留输入，只学习改动 F(x)','保留输入，<br/>让新增层只学改动')
s=s.replace('更深的网络 · 训练误差反而更高','更深的网络 · 误差更高').replace('更深的模型，至少应该<br/>能做到不比原来更差，<br/>即：<strong>保留输入 x。</strong>','如果新增层保持原样，<br/>更深的模型就应该<br/><strong>保留原有的效果。</strong>')
s=s.replace('<ResidualDiagram teal/><div className="cg-discovery-zero">','<ResidualDiagram teal/><div className="cg-discovery-step-caption cg-discovery-answer-note"><div className="cg-discovery-zero">').replace('不需要改动时，让','无需改动时，').replace('把学习任务变成“改动的部分”，<br/>帮助更深的模型更容易优化。</Typography></div>','新增层学习改动，<br/>原来的输入直接保留。</Typography></div></div>')
p.write_text(s,encoding='utf-8')

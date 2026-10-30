from pathlib import Path
p=Path('modules/Creator-Guide/pages/ProgressiveDisclosurePage.tsx')
s=p.read_text(encoding='utf-8-sig')
s=s.replace('aria-label={`第${Math.floor(i/size)+1}行第${i%size+1}列，响应${formatResponse(v)}`}', 'aria-label={`第${Math.floor(i/size)+1}行第${i%size+1}列，${i<=current?`响应${formatResponse(v)}`:\'待计算\'}`}')
s=s.replace("className={i===current?'is-selected':undefined} style={{background:responseColor(v,settings)}}", "className={[i<=current?'is-computed':'',i===current?'is-selected':''].filter(Boolean).join(' ')} style={{background:i<=current?responseColor(v,settings):'#f5f7fb'}}")
s=s.replace("onClick={()=>exp.select(i)}><svg viewBox=", "onClick={()=>exp.select(i)}>{i<=current&&<svg viewBox=")
s=s.replace("formatResponse(settings.response==='absolute'?Math.abs(v):v)}</Typography></svg></button>", "formatResponse(settings.response==='absolute'?Math.abs(v):v)}</Typography></svg>}</button>")
p.write_text(s,encoding='utf-8')
p=Path('modules/Creator-Guide/pages/ProgressiveDisclosurePage.css')
s=p.read_text(encoding='utf-8-sig')
s+='''\n.cg-disclosure-output button.is-computed>svg{animation:cg-disclosure-reveal .13s ease-out both;}
@keyframes cg-disclosure-reveal{from{opacity:0;transform:scale(.88);}to{opacity:1;transform:scale(1);}}
@media(prefers-reduced-motion:reduce){.cg-disclosure-output button.is-computed>svg{animation:none;}}
'''
p.write_text(s,encoding='utf-8')

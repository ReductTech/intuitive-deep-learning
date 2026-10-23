from pathlib import Path
p=Path('modules/Creator-Guide/pages/ProgressiveDisclosurePage.tsx')
s=p.read_text(encoding='utf-8-sig')
s=s.replace('style={{gridTemplateColumns:`repeat(${size},minmax(0,1fr))`}} role="group"', 'style={{gridTemplateColumns:`repeat(${size},minmax(0,1fr))`,gridTemplateRows:`repeat(${size},minmax(0,1fr))`}} role="group"')
p.write_text(s,encoding='utf-8')
p=Path('modules/Creator-Guide/pages/ProgressiveDisclosurePage.css')
s=p.read_text(encoding='utf-8-sig')
s+='\n.cg-disclosure-output button{min-height:0;min-width:0;width:100%;height:100%;}\n.cg-disclosure-output button>svg{min-height:0;min-width:0;}\n'
p.write_text(s,encoding='utf-8')

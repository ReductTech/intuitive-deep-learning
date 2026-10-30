from pathlib import Path
p=Path('modules/Creator-Guide/pages/ProgressiveDisclosurePage.tsx');s=p.read_text(encoding='utf-8-sig')
s=s.replace("useState<'size'|'view'|null>(null)", 'useState(false)')
a=s.index('        <div className="cg-disclosure-extra"><Button');b=s.index('\n      </div></section>',a)
s=s[:a]+'''        <div className="cg-disclosure-extra"><Button className="cg-disclosure-expand" aria-expanded={expanded} aria-controls="cg-disclosure-more-settings" onClick={()=>setExpanded(value=>!value)}><Typography as="span" variant="bodySmall" tone="inherit">更多设置</Typography><Typography as="span" variant="bodySmall" tone="inherit" aria-hidden="true">{expanded?'⌃':'›'}</Typography></Button>{expanded&&<div id="cg-disclosure-more-settings" className="cg-disclosure-extra-controls"><SizeControls exp={right}/><ViewControls exp={right}/></div>}</div>'''+s[b:]
s=s.replace("const kernelOptions =", 'const controlText = (text: string) => <Typography as="span" variant="bodySmall" tone="inherit">{text}</Typography>;\nconst kernelOptions =')
s=s.replace("label:'竖直边缘'", "label:controlText('竖直边缘')").replace("label:'水平边缘'", "label:controlText('水平边缘')").replace("label:'均值平滑'", "label:controlText('均值平滑')")
for label in ['竖直分界','水平分界','转角','保留正负','只看强度']:
    s=s.replace("label:'"+label+"'", "label:controlText('"+label+"')")
p.write_text(s,encoding='utf-8')
p=Path('modules/Creator-Guide/pages/ProgressiveDisclosurePage.css');s=p.read_text(encoding='utf-8-sig')
s=s.replace('justify-content:center;min-height:0;gap:12px;background:', 'justify-content:center;min-height:0;gap:12px;container-type:size;background:')
s=s.replace('align-items:center;gap:8px;min-height:0;}','align-items:center;gap:8px;min-height:0;flex:1;}')
s=s.replace('.cg-disclosure-image svg{display:block;width:100%;max-height:210px;aspect-ratio:1;}', '.cg-disclosure-image svg{display:block;width:min(100%,clamp(132px,calc(100cqh - 100px),210px));height:clamp(132px,calc(100cqh - 100px),210px);flex:none;}')
s=s.replace('.cg-disclosure-kernel-grid{width:100%;', '.cg-disclosure-kernel-grid{width:min(100%,132px);')
s=s.replace('.cg-disclosure-output{display:grid;width:100%;aspect-ratio:1;gap:2px;max-height:210px;}', '.cg-disclosure-output{display:grid;width:min(100%,clamp(132px,calc(100cqh - 100px),210px));height:clamp(132px,calc(100cqh - 100px),210px);flex:none;aspect-ratio:1;gap:2px;}')
s=s.replace('.cg-disclosure-readout{display:flex;', '.cg-disclosure-readout{flex:none;display:flex;')
s+='\n.cg-disclosure-settings>.edu-control{gap:0;}\n.cg-disclosure-page .edu-label{margin:0;}\n'
p.write_text(s,encoding='utf-8')

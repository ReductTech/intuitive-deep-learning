from pathlib import Path
p=Path('modules/Creator-Guide/pages/SkillConstraintsPage.tsx')
s=p.read_text(encoding='utf-8')
s=s.replace("import { useEffect, useId, useRef, useState } from 'react';", "import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';").replace("import { Button, Select, Typography }", "import { Button, Typography }").replace("import documents from 'virtual:creator-skill-documents';\n",'')
s=s.replace("  const [selectedPath, setSelectedPath] = useState('SKILL.md');", "  const [active, setActive] = useState(0);")
s=s.replace("(preview === 1 || preview === 2 || preview === 3) ? 100 : 280", '350')
a=s.index('  const selectedDocument =');b=s.index('  {preview !== null &&',a)
s=s[:a]+'''  const selectSkill = (index: number) => { cancelClose(); setPreview(null); setActive((index + groups.length) % groups.length); };
  const selected = groups[active];
  const positions = [
    { x: 0, y: 0, scale: 1.08, turn: 0, depth: 5 },
    { x: 295, y: -12, scale: .92, turn: -12, depth: 4 },
    { x: 565, y: -45, scale: .84, turn: -18, depth: 3 },
    { x: -565, y: -45, scale: .84, turn: 18, depth: 3 },
    { x: -295, y: -12, scale: .92, turn: 12, depth: 4 },
  ];
  return <article className="cg-constraints-page cg-creator-typography" aria-labelledby="cg-constraints-title" onKeyDown={event => {
    if (event.key === 'Escape' && preview !== null) { event.stopPropagation(); cancelClose(); setPreview(null); }
    if (event.target instanceof Element && event.target.closest('.cg-constraints-carousel') && ['ArrowLeft', 'ArrowRight', 'Home', 'End', ' '].includes(event.key)) {
      event.stopPropagation();
      if (event.key !== ' ') { event.preventDefault(); selectSkill(event.key === 'Home' ? 0 : event.key === 'End' ? 4 : active + (event.key === 'ArrowLeft' ? -1 : 1)); }
    }
  }}>
    <header><Typography as="h1" id="cg-constraints-title" variant="display" tone="inherit">Creator Skill：五类技能协同创作</Typography><Typography variant="bodySmall" tone="inherit">平台默认协同工作，让创作者专注知识内容与教学设计。</Typography></header>
    <section className="cg-constraints-detail" aria-label="当前技能说明" style={{ '--skill-color': selected.color, '--skill-background': selected.background } as CSSProperties}>
      <div className="cg-constraints-detail-icon"><ConstraintIcon kind={selected.icon}/></div>
      <div className="cg-constraints-detail-copy"><Typography as="h2" variant="h2" tone="inherit">{selected.title}</Typography><Typography variant="bodySmall" tone="muted">{selected.description}</Typography></div>
      <div className="cg-constraints-checks">{selected.items.map(item => <div key={item}><span aria-hidden="true">✓</span><Typography variant="bodySmall" tone="inherit">{item}</Typography></div>)}</div>
      <Typography className="cg-constraints-count" variant="bodySmall" tone="muted">{String(active + 1).padStart(2, '0')} / 05</Typography>
    </section>
    <div className="cg-constraints-connector" aria-hidden="true"/>
    <section className="cg-constraints-carousel" aria-label="五类技能转盘" aria-roledescription="轮播">
      <div className="cg-constraints-platform" aria-hidden="true"/>
      <div className="cg-constraints-orbit" aria-hidden="true"/>
      {groups.map((g, index) => {
        const position = positions[(index - active + groups.length) % groups.length];
        return <section key={g.title} className={'cg-constraints-card' + (index === active ? ' is-active' : '')} aria-label={g.title} style={{ '--skill-color': g.color, '--skill-background': g.background, '--card-x': `${position.x}px`, '--card-y': `${position.y}px`, '--card-scale': position.scale, '--card-turn': `${position.turn}deg`, zIndex: position.depth } as CSSProperties}>
          <Button className="cg-constraints-card-select" aria-label={`选择${g.title}`} aria-pressed={index === active} onClick={() => selectSkill(index)}>
            <span className="cg-constraints-icon"><ConstraintIcon kind={g.icon}/></span>
            <Typography as="span" variant="h3" tone="inherit">{g.title}</Typography>
            <Typography as="span" variant="bodySmall" tone="inherit">{g.english}</Typography>
          </Button>
          <Button className="cg-constraints-example-button" aria-label={`查看${g.title}示例`} aria-expanded={preview === index} aria-controls={preview === index ? previewId : undefined} onMouseEnter={() => showPreview(index)} onMouseLeave={closePreview} onFocus={() => showPreview(index)} onBlur={event => { if (event.relatedTarget instanceof Element && event.relatedTarget.closest('.cg-constraints-preview')) cancelClose(); else closePreview(); }} onClick={() => showPreview(index)}><Typography as="span" variant="bodySmall" tone="inherit">{g.example}</Typography></Button>
        </section>;
      })}
      <Button className="cg-constraints-rotate is-previous" aria-label="上一个技能" onClick={() => selectSkill(active - 1)}><Typography as="span" variant="h3" tone="inherit">‹</Typography></Button>
      <Button className="cg-constraints-rotate is-next" aria-label="下一个技能" onClick={() => selectSkill(active + 1)}><Typography as="span" variant="h3" tone="inherit">›</Typography></Button>
    </section>
    <Typography className="cg-constraints-hint" variant="bodySmall" tone="muted" align="center">点击技能或左右切换 · 悬停按钮查看示例</Typography>
''' + s[b:]
s=s.replace('<div className="cg-constraints-preview-heading">', '<div className="cg-constraints-preview-heading">')
s=s.replace('</div>\n    {preview === 0 || preview === 4 ?', '<Button className="cg-constraints-preview-close" aria-label="关闭技能示例" onClick={() => { cancelClose(); setPreview(null); }}>×</Button></div>\n    {preview === 0 || preview === 4 ?')
p.write_text(s,encoding='utf-8')
p=Path('modules/Creator-Guide/pages/SkillConstraintsPage.css');s=p.read_text(encoding='utf-8');start=s.index('.cg-constraints-preview {');s=s[start:]
# Drop obsolete row and English rules; retain all existing demonstration styling.
a=s.index('.cg-constraints-group-heading {');b=s.index('.cg-constraints-visual-options {',a);s=s[:a]+s[b:]
s=s.replace('left:42px;top:164px;', 'left:235px;top:155px;').replace('.cg-constraints-preview.cg-visual-preview {width:1460px;', '.cg-constraints-preview.cg-visual-preview {left:70px;width:1460px;')
prefix='''.cg-constraints-page{position:relative;width:1600px;height:900px;flex:none;background:#fcfdff;color:#102350;user-select:text;}
.cg-constraints-page *{box-sizing:border-box;min-width:0;max-width:100%;}
.cg-constraints-page>header{position:absolute;left:42px;top:24px;width:1516px;}
.cg-constraints-page>header p{margin-top:12px;color:#50617e;}
.cg-constraints-detail{position:absolute;left:310px;top:185px;width:980px;display:grid;grid-template-columns:108px minmax(0,1fr) 100px;gap:22px;align-items:center;}
.cg-constraints-detail-icon{width:108px;height:108px;border-radius:28px;display:grid;place-items:center;color:var(--skill-color);background:var(--skill-background);}
.cg-constraints-detail-icon svg{width:72px;height:72px;}
.cg-constraints-detail-copy p{margin-top:8px;}
.cg-constraints-count{grid-column:3;grid-row:1;text-align:right;}
.cg-constraints-checks{grid-column:1 / -1;display:flex;justify-content:center;gap:50px;color:#405b80;}
.cg-constraints-checks>div{display:flex;align-items:center;gap:12px;}
.cg-constraints-checks span{width:27px;height:27px;display:grid;place-items:center;flex:none;background:var(--skill-color);border-radius:50%;color:white;}
.cg-constraints-connector{position:absolute;left:799px;top:362px;height:58px;border-left:2px dashed #b9d0fa;}
.cg-constraints-carousel{position:absolute;left:0;top:430px;width:1600px;height:420px;perspective:1600px;}
.cg-constraints-platform{position:absolute;left:85px;top:210px;width:1430px;height:190px;border:1px solid #b8cae6;border-bottom:15px solid #afc2df;border-radius:50%;background:linear-gradient(180deg,#f6f9fe 20%,#e8f0fb 75%,#d7e4f5);box-shadow:0 18px 28px #17345a12,inset 0 0 0 12px #ffffffb5;}
.cg-constraints-orbit{position:absolute;left:40px;top:204px;width:1520px;height:190px;border:1px solid #c4d8fb;border-radius:50%;}
.cg-constraints-card{position:absolute;left:660px;top:0;width:280px;height:340px;border-radius:25px;border:1px solid color-mix(in srgb,var(--skill-color) 32%,white);border-right-width:7px;border-bottom-width:8px;background:linear-gradient(135deg,white,var(--skill-background));color:var(--skill-color);box-shadow:0 13px 25px #15396814;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:23px 14px 21px;transform:translate(var(--card-x),var(--card-y)) scale(var(--card-scale)) rotateY(var(--card-turn));transform-origin:center bottom;transition:transform .5s cubic-bezier(.2,.7,.2,1),background .3s,box-shadow .3s;}
.cg-constraints-card.is-active{background:linear-gradient(145deg,var(--skill-color),color-mix(in srgb,var(--skill-color) 83%,white));color:white;border-color:color-mix(in srgb,var(--skill-color) 70%,white);box-shadow:0 16px 30px color-mix(in srgb,var(--skill-color) 20%,transparent);}
.cg-constraints-card-select.edu-btn{width:100%;border:0;background:transparent;color:inherit;padding:0;box-shadow:none;}
.cg-constraints-card-select.edu-btn>span{display:flex;flex-direction:column;align-items:center;gap:10px;}
.cg-constraints-card-select .ui-typography{white-space:nowrap;}
.cg-constraints-icon{display:grid;place-items:center;width:88px;height:88px;border-radius:22px;background:color-mix(in srgb,currentColor 9%,transparent);margin-bottom:6px;}
.cg-constraints-icon svg{width:65px;height:65px;}
.cg-constraints-example-button.edu-btn{min-height:44px;padding:3px 15px;border-radius:24px;border-color:currentColor;background:#ffffffd9;color:var(--skill-color);cursor:pointer;}
.cg-constraints-example-button:hover,.cg-constraints-example-button[aria-expanded="true"]{background:white;box-shadow:0 4px 12px #20345420;}
.cg-constraints-rotate.edu-btn{position:absolute;top:215px;z-index:7;width:56px;height:56px;padding:0;border-radius:50%;background:white;color:#1648a0;border:1px solid #cedcf4;display:grid;place-items:center;box-shadow:0 5px 12px #17468212;}
.cg-constraints-rotate.is-previous{left:22px;}.cg-constraints-rotate.is-next{right:22px;}
.cg-constraints-hint{position:absolute;left:200px;bottom:12px;width:1200px;}
.cg-constraints-preview-close.edu-btn{margin-left:auto;flex:none;width:40px;height:40px;padding:0;}
@media(prefers-reduced-motion:reduce){.cg-constraints-card{transition:none;}}
'''
p.write_text(prefix+s,encoding='utf-8')

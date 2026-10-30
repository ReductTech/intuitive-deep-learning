from pathlib import Path
p=Path('modules/Creator-Guide/pages/ProgressiveDisclosurePage.tsx');s=p.read_text(encoding='utf-8-sig').replace("import { useState } from 'react';", "import { useEffect, useRef, useState } from 'react';")
s=s.replace('function useExperiment() {', 'function useExperiment(active: boolean) {')
s=s.replace('const [position,setPosition] = useState(6);', 'const [position,setPosition] = useState(0);\n  const [playing,setPlaying] = useState(true);')
s=s.replace("const change = <K extends keyof Settings>(key: K, value: Settings[K]) => { setSettings(current => ({...current,[key]:value})); setPosition(0); };\n  return {settings, output, current, change, select: setPosition, next: () => setPosition(value => (Math.min(value,size*size-1)+1)%(size*size))};", """useEffect(() => {
    if (!active || !playing) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setPosition(value => (value+1)%(size*size)), current === size*size-1 ? 450 : reduced ? 900 : 130);
    return () => window.clearTimeout(timer);
  }, [active,playing,current,size]);
  const change = <K extends keyof Settings>(key: K, value: Settings[K]) => { setSettings(current => ({...current,[key]:value})); setPosition(0); setPlaying(true); };
  const select = (position: number) => { setPosition(position); setPlaying(false); };
  return {settings, output, current, change, select, playing, toggle: () => setPlaying(value => !value)};""")
old="return <rect key={i} x={c*210/gridSize+.6} y={r*210/gridSize+.6} width={210/gridSize-1.2} height={210/gridSize-1.2} rx=\"1\" fill={padded?'#f1f3f6':input[r-settings.padding][c-settings.padding]?'#3280d9':'#d8eaff'} stroke={padded?'#d2d9e3':'none'} strokeDasharray={padded?'2 2':undefined}/>;"
new="""const value=padded?0:input[r-settings.padding][c-settings.padding];return <g key={i}><rect x={c*210/gridSize+.6} y={r*210/gridSize+.6} width={210/gridSize-1.2} height={210/gridSize-1.2} rx="1" fill={padded?'#f1f3f6':value?'#3280d9':'#d8eaff'} stroke={padded?'#d2d9e3':'none'} strokeDasharray={padded?'2 2':undefined}/><Typography as="text" variant="bodySmall" tone="inherit" x={(c+.5)*210/gridSize} y={(r+.5)*210/gridSize} textAnchor="middle" dominantBaseline="central" className={value?'cg-disclosure-digit is-one':'cg-disclosure-digit'}>{value}</Typography></g>;"""
assert old in s;s=s.replace(old,new)
s=s.replace('fill="#fff3" stroke="#175fed"', 'fill="none" stroke="#175fed"')
s=s.replace('onClick={()=>exp.select(i)}/>', '''onClick={()=>exp.select(i)}><svg viewBox={Number.isInteger(v)?'0 0 44 44':'0 0 62 44'} aria-hidden="true"><Typography as="text" variant="bodySmall" tone="inherit" x={Number.isInteger(v)?22:31} y="22" textAnchor="middle" dominantBaseline="central">{formatResponse(settings.response==='absolute'?Math.abs(v):v)}</Typography></svg></button>''')
s=s.replace("? '响应强度' : '当前位置响应'", "? '响应强度 =' : '相乘求和 ='")
s=s.replace('const left=useExperiment(),right=useExperiment();', '''const root=useRef<HTMLElement>(null);
  const [visible,setVisible]=useState(false);
  const [pageVisible,setPageVisible]=useState(() => !document.hidden);
  useEffect(() => {
    if (!root.current) return;
    const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:.2});
    observer.observe(root.current);
    const visibility=()=>setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange',visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange',visibility); };
  }, []);
  const left=useExperiment(visible && pageVisible),right=useExperiment(visible && pageVisible);''')
s=s.replace('<article className="cg-disclosure-page', '<article ref={root} className="cg-disclosure-page')
s=s.replace('onClick={left.next}', 'onClick={left.toggle}').replace('onClick={right.next}', 'onClick={right.toggle}')
# Both controls clearly reflect the default automatic state and support inspection.
s=s.replace('>移动窗口</Typography></Button>', ">{left.playing?'暂停扫描':'继续扫描'}</Typography></Button>",1)
s=s.replace('>移动窗口</Typography></Button>', ">{right.playing?'暂停扫描':'继续扫描'}</Typography></Button>",1)
p.write_text(s,encoding='utf-8')
p=Path('modules/Creator-Guide/pages/ProgressiveDisclosurePage.css');s=p.read_text(encoding='utf-8-sig')
s+='''\n.cg-disclosure-digit{pointer-events:none;fill:#294b73;color:#294b73;}
.cg-disclosure-digit.is-one{fill:#fff;color:#fff;}
.cg-disclosure-output button{display:grid;place-items:center;}
.cg-disclosure-output button>svg{display:block;width:100%;height:100%;pointer-events:none;}
'''
p.write_text(s,encoding='utf-8')

from pathlib import Path
p=Path('modules/Creator-Guide/pages/ProgressiveDisclosurePage.tsx')
s=p.read_text(encoding='utf-8-sig')
s=s.replace("const timer = window.setTimeout(() => setPosition(value => (value+1)%(size*size)), current === size*size-1 ? 450 : reduced ? 900 : 130);", "if (current === size*size-1) { setPlaying(false); return; }\n    const timer = window.setTimeout(() => setPosition(value => Math.min(value+1,size*size-1)), reduced ? 900 : 130);")
s=s.replace("return {settings, output, current, change, select, playing, toggle: () => setPlaying(value => !value)};", "return {settings, output, current, change, select, playing, finished: current === size*size-1, toggle: () => { if (current === size*size-1) { setPosition(0); setPlaying(true); } else setPlaying(value => !value); }};")
s=s.replace("{left.playing?'暂停扫描':'继续扫描'}", "{left.finished?'重新扫描':left.playing?'暂停扫描':'继续扫描'}")
s=s.replace("{right.playing?'暂停扫描':'继续扫描'}", "{right.finished?'重新扫描':right.playing?'暂停扫描':'继续扫描'}")
p.write_text(s,encoding='utf-8')

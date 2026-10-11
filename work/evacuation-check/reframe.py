from pathlib import Path
p=Path('modules/Gradient-Descent/pages/EvacuationPage/EvacuationPage.tsx')
s=p.read_text(encoding='utf-8')
s=s.replace('Button, ContentBlock, Typography', 'Button, Typography')
s=s.replace("onReady: () => { setReady(true); const ps: Record<string, { x: number; y: number }> = { exit: api.project(EXIT, .8) }; PICKUPS.forEach(p => { ps[p.id] = api.project(p.point, 1.7); }); setLabels(ps); }", "onReady: () => setReady(true), onView: setLabels")
s=s.replace('return <ContentBlock className="gd-page" title="能逃出这片禁区吗？" subtitle="一台瞬移装置，一个未知的落点。先活着离开。">', 'return <section className="gd-page" aria-label="禁区撤离">')
s=s.replace('</ContentBlock>', '</section>')
s=s.replace('穿过禁区，抵达救援信标', '寻找信号，离开禁区')
s=s.replace('撤离行动 / SECTOR 07', '禁区 / SECTOR 07')
s=s.replace('拖拽小球，松手瞬移。寻找补给和装备，在防护耗尽之前抵达撤离点。', '东北方向传来微弱的救援信号。拖拽小球、松手瞬移，穿过这片未知的禁区。')
s=s.replace('按住小球向后拉，松手瞬移 · 也可用方向键瞄准、空格瞬移', '拖拽瞬移 · 滚轮缩放 · 方向键瞄准 / 空格瞬移')
s=s.replace('按住小球向后拉，松手瞬移。先去寻找金色补给箱。', '镜头会跟随你。拉住小球向后拖，先寻找金色补给箱。')
p.write_text(s,encoding='utf-8')
p=Path('modules/Gradient-Descent/guide.css')
p.write_text('''.gd-guide { display: flex; min-height: 100vh; align-items: flex-start; justify-content: center; background: #10232d; }
.gd-guide-frame { width: 100%; max-width: 1600px; min-width: 0; }
.gd-slide-surface { background: #10232d; }
''',encoding='utf-8')

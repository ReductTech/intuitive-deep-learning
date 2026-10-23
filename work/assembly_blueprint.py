from pathlib import Path
p=Path('modules/Creator-Guide/components/assembly/assemblyTimeline.ts');s=p.read_text(encoding='utf-8')
s=s.replace("frame.className = 'cg-assembly-expanding-frame'; overlay.append(frame); nodes.push(frame);", """frame.className = 'cg-assembly-expanding-frame'; overlay.append(frame); nodes.push(frame);
      const blueprint = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      blueprint.setAttribute('viewBox', '0 0 1600 900'); blueprint.classList.add('cg-assembly-blueprint');
      for (const d of ['M40 40h300v115H40Z M40 212h270 M40 264h240', 'M432 43h795v820H432Z', 'M1248 120h320v670h-320Z M1270 390h274v76h-274Z']) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d); path.setAttribute('pathLength', '1'); blueprint.append(path);
        animate(path, [{ strokeDashoffset: '1' }, { strokeDashoffset: '0' }], 200, 1200, 'ease-in-out');
      }
      frame.append(blueprint);""")
s=s.replace("{ backgroundColor: '#fff', borderColor: '#b3cbe9', boxShadow: '0 10px 40px #27446e18' }, { backgroundColor: 'transparent', borderColor: 'transparent', boxShadow: '0 0 0 transparent' }", "{ opacity: 1, borderColor: '#b3cbe9' }, { opacity: 0, borderColor: 'transparent' }")
p.write_text(s,encoding='utf-8')
p=Path('modules/Creator-Guide/components/assembly/AssemblyShowcase.css');s=p.read_text(encoding='utf-8').replace('border:1px solid #b3cbe9;background:white;', 'border:1px solid #b3cbe9;background:transparent;');s+='\n.cg-assembly-blueprint{width:100%;height:100%;display:block;fill:none;stroke:#9fbadb;stroke-width:1.2;}\n.cg-assembly-blueprint path{stroke-dasharray:1;}\n';p.write_text(s,encoding='utf-8')
p=Path('modules/Creator-Guide/outlines.json');s=p.read_text(encoding='utf-8').replace('点击组装一个教学页面播放约3.7秒动画', '点击组装一个教学页面播放约4.1秒动画').replace('文字配色、页面结构和选择控件移动到成品位置，再加入背景、棋盘与本地对弈逻辑。', '模板轮廓连续展开为整页骨架，成品文字与选择控件等比移动归位；棋盘网格逐线绘制，背景与对弈面板随后融入。').replace('动画是预设的组合演示，不会现场生成代码；', '动画使用统一时间轴编排真实页面元素的位移、骨架展开与网格绘制，不会现场生成代码；');p.write_text(s,encoding='utf-8')

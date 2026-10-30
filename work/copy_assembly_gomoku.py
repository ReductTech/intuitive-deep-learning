from pathlib import Path
import re, shutil
root=Path('.')
dest=root/'modules/Creator-Guide/components/assembly';dest.mkdir(parents=True,exist_ok=True)
source=root/'modules/Convolution-Kernel-Intro/pages/GomokuPlayPage/GomokuPlayPage.tsx'
s=source.read_text(encoding='utf-8')
s=s.replace("from '../../../shared/react'", "from '../../../shared/react'") # Same nesting depth in the independent copy.
s=s.replace("import { useGomokuOutcome } from '../../LessonContext';\n",'').replace("from '../../gomokuEngine'", "from './gomokuEngine'").replace("import './GomokuPlayPage.css';", "import './AssemblyGomoku.css';\nimport outline from '../../outlines.json';")
s=s.replace("moduleAssetUrl('38cd1c79-d8b7-462a-b208-a567c5cd89c4', 'bg_video.mp4')", "moduleAssetUrl(outline.moduleIdentity.id, 'assembly/gomoku-bg.mp4')")
s=s.replace('GomokuPlayPage','AssemblyGomoku').replace('ck-gomoku-play','cg-built-gomoku')
s=s.replace('  const { recordOutcome } = useGomokuOutcome();\n','')
s=re.sub(r'    recordOutcome\(\{.*?\n    \}\);\n','',s,flags=re.S).replace('    recordOutcome(null);\n','').replace(', recordOutcome]',']').replace('}, [recordOutcome]);','}, []);')
s=s.replace('// 分出胜负后把终局交给 LessonContext，后面的页面继续用同一盘棋。', '// This standalone demonstration keeps the entire game local to Creator-Guide.')
s=s.replace("    if (step) {\n      event.preventDefault();", "    if (step) {\n      event.stopPropagation();\n      event.preventDefault();").replace("    if (event.key === 'Enter' || event.key === ' ') {\n      event.preventDefault();", "    if (event.key === 'Enter' || event.key === ' ') {\n      event.stopPropagation();\n      event.preventDefault();")
s=s.replace('autoPlay muted loop playsInline aria-hidden="true"', 'autoPlay muted loop playsInline preload="auto" aria-hidden="true"')
(dest/'AssemblyGomoku.tsx').write_text(s,encoding='utf-8')
shutil.copyfile(root/'modules/Convolution-Kernel-Intro/gomokuEngine.ts',dest/'gomokuEngine.ts')
s=(root/'modules/Convolution-Kernel-Intro/pages/GomokuPlayPage/GomokuPlayPage.css').read_text(encoding='utf-8')
s=s.replace('ck-gomoku-play','cg-built-gomoku').replace('.course-shell ','.cg-kit-result-shell ').replace('.course-page-surface ','.cg-kit-result-shell ')
s=s[:s.index('@media (max-width: 1050px)')]
s=s.replace('min-height: 720px; overflow: hidden;', 'width:1600px;height:900px;min-height:0;').replace('.cg-kit-result-shell .cg-built-gomoku__play-icon { font-size: 1.1em; }\n','')
s+='''
.cg-kit-result-shell .cg-built-gomoku{border:0;border-radius:0;}
.cg-kit-result-shell .cg-built-gomoku *{box-sizing:border-box;min-width:0;max-width:100%;}
.cg-kit-result-shell .cg-built-gomoku__rail{padding-top:40px;}
'''
(dest/'AssemblyGomoku.css').write_text(s,encoding='utf-8')
asset=root/'assets/444f8951-dd2e-42dc-94e5-c5a878618631/assembly';asset.mkdir(parents=True,exist_ok=True)
shutil.copyfile(root/'assets/38cd1c79-d8b7-462a-b208-a567c5cd89c4/bg_video.mp4',asset/'gomoku-bg.mp4')
p=root/'modules/Creator-Guide/pages/UIKitPage.tsx';s=p.read_text(encoding='utf-8').replace('export function UIKitPage(){','export function UIKitCatalog(){')
p.write_text(s,encoding='utf-8')

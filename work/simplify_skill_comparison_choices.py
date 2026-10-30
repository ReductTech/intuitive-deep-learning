from pathlib import Path
import re
p=Path('modules/Creator-Guide/pages/SkillConstraintsPage.tsx')
s=p.read_text(encoding='utf-8-sig')
s=s.replace('  const [visualCategory, setVisualCategory] = useState(0);\n','')
s=s.replace('const showPreview = (index:number) => { cancelClose(); if (preview !== index) setVisualCategory(index === 4 ? 3 : 0); setPreview(index); };', 'const showPreview = (index:number) => { cancelClose(); setPreview(index); };')
s=re.sub(r'\{\(preview === 0 \|\| preview === 4\) && <div className="cg-constraints-visual-options".*?</div>\}', '', s)
s=s.replace('<WeightSharingAblation key={`${preview}-${visualCategory}`} category={visualCategory}/>', '<WeightSharingAblation key={preview} category={preview === 4 ? 3 : 1}/>')
p.write_text(s,encoding='utf-8')

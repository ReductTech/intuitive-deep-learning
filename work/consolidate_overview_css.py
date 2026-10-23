from pathlib import Path
p=Path('modules/Creator-Guide/pages/SkillOverviewPage.css')
s=p.read_text(encoding='utf-8-sig')
# Fold final layout adjustments into their original rules.
extra=s.index('\n.cg-overview-panel{padding:14px')
s=s[:extra]+'\n'
s=s.replace('padding:18px 20px;', 'padding:14px 20px 10px;').replace('margin-top:10px;grid-template-columns:', 'margin-top:6px;grid-template-columns:').replace('.cg-overview-panel-caption{margin-top:10px;', '.cg-overview-panel-caption{margin-top:4px;').replace('top:267px;width:192px;', 'top:250px;width:192px;').replace('padding:8px 3px;', 'padding:4px 3px;').replace('column;gap:2px;}', 'column;gap:0;}')
s=s.replace('.cg-overview-right-content{grid-template-columns:', '.cg-overview-scaffold{gap:2px;}\n.cg-overview-right-content{grid-template-columns:')
s=s.replace('.cg-overview-specimen{border:', '.cg-overview-specimen{min-height:0;border:').replace('space-between;gap:7px;', 'space-between;gap:4px;').replace('padding:5px 10px;background:white;', 'padding:0 10px;background:white;').replace('height:30px;flex:none;', 'height:26px;flex:none;').replace('padding:3px 0;color:#fff;', 'padding:0;color:#fff;').replace('aspect-ratio:16/9;', 'height:78px;flex:none;').replace('background:#fff;padding:14px;', 'background:#fff;padding:8px;').replace('height:72px;background:#e1edff;', 'height:52px;background:#e1edff;').replace('.cg-overview-template-lines{display:flex;flex-direction:column;gap:8px;}', '.cg-overview-template-lines{display:flex;flex-direction:column;gap:6px;}')
p.write_text(s,encoding='utf-8')

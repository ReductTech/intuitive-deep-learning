from pathlib import Path
p=Path('modules/Creator-Guide/pages/CreationWorkflowPage.tsx');s=p.read_text(encoding='utf-8');s=s.replace('onClick={() => setPage(item.index)}','onClick={() => { setPage(item.index); setBrowsing(revised); }}');s=s.replace('reviewed={completed >= 7}/>', 'reviewed={completed >= 7} browsing={browsing}/>');p.write_text(s,encoding='utf-8')

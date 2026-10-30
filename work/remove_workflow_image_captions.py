from pathlib import Path
import re
p=Path('modules/Creator-Guide/components/workflow/WorkflowSimulationPreview.tsx')
s=p.read_text(encoding='utf-8')
s=re.sub(r'<figcaption>.*?</figcaption>', '', s)
p.write_text(s,encoding='utf-8')
p=Path('modules/Creator-Guide/pages/CreationWorkflowPage.css')
s=p.read_text(encoding='utf-8')
s='\n'.join(line for line in s.splitlines() if '.cg-sim-design figcaption' not in line)+'\n'
p.write_text(s,encoding='utf-8')

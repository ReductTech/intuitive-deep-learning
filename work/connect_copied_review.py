from pathlib import Path
p=Path('modules/Creator-Guide/components/workflow/WorkflowSimulationPreview.tsx');s=p.read_text(encoding='utf-8').replace('<CopiedCoursePreview page={page}/>','<CopiedCoursePreview page={page} reviewed={reviewed}/>');p.write_text(s,encoding='utf-8')

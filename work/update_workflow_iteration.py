from pathlib import Path
p=Path('modules/Creator-Guide/pages/CreationWorkflowPage.tsx');s=p.read_text(encoding='utf-8-sig')
s=s.replace('simulationOutline, simulationStages', 'simulationOutline, walkthroughTurns')
a=s.index('const turns =');b=s.index('function Glyph',a)
s=s[:a]+'const turns = walkthroughTurns;\n'+s[b:]
a=s.index('  const stage =');b=s.index('\n\n  useEffect',a)
s=s[:a]+'''  const view = completed ? turns[completed - 1].view : 'empty';
  const revised = completed >= 2;
'''+s[b:]
s=s.replace('const steps = workSteps[completed];','const steps = turn.steps;')
s=s.replace('        if (completed === 6 || completed === 7) setPage(1);', '        if (turn.page !== undefined) setPage(turn.page);\n        else setPage(0);')
s=s.replace("{ready ? '从五子棋到卷积核' : '新建课件'}", "{revised ? '从五子棋到卷积核' : ready ? '卷积核入门' : '新建课件'}")
s=s.replace("{stage === 0 ? '课程大纲' : '幻灯片'}", "{completed >= 5 ? '幻灯片' : '课程大纲'}")
s=s.replace('simulationOutline(completed >= 2 ? 2 : 1)', 'simulationOutline(revised)')
s=s.replace('<WorkflowSimulationPreview key={`${stage}-${page}`} stage={stage} page={page} revision={revision}/>', '<WorkflowSimulationPreview key={completed >= 5 ? `produced-${page}` : `${view}-${page}`} view={view} page={page} reviewed={completed >= 7}/>')
s=s.replace('workSteps[i].map', 'turns[i].steps.map').replace("workSteps[i][Math.min(message.steps - 1, workSteps[i].length - 1)]", "turns[i].steps[Math.min(message.steps - 1, turns[i].steps.length - 1)]")
p.write_text(s,encoding='utf-8')

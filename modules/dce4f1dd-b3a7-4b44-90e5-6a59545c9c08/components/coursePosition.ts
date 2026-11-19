import outline from '../outlines.json';

export function stageTitle(stage: number) {
  return outline.stages.find(item => item.id === stage)?.title ?? '';
}

export function coursePosition(id: string) {
  const page = outline.pages.find(page=>page.id===id)!;
  return page.stage === 0 ? page.focus : `环节 ${page.stage}/${outline.stages.length} · ${stageTitle(page.stage)}｜${page.focus}`;
}

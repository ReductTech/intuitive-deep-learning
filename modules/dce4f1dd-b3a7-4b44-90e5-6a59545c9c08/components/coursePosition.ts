import outline from '../outlines.json';

export function coursePosition(id: string) {
  const page = outline.pages.find(page=>page.id===id)!;
  return page.stage === 0 ? page.focus : `环节 ${page.stage}/6 · ${page.section}｜${page.focus}`;
}

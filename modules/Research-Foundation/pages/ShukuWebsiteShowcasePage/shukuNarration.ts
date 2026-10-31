/** Seconds from the moment the course library becomes visible. */
export const shukuNarration = [
  {start:0,end:7,view:'点击左侧分类 → 恢复全部课程 → 滑动浏览',text:'术库支持按学科筛选课程，并提供自主学习与教学展示。'},
] as const;

export const shukuDuration = shukuNarration.at(-1)!.end * 1000;

/** Browse after the visible pointer finishes the two sidebar actions. */
export function shukuScrollAt(seconds:number, destination:number) {
  const t=Math.max(0,Math.min(1,(seconds-2.79)/2.85));
  return destination*t*t*(3-2*t);
}

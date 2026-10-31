import { FoundationChapter } from '../../components/FoundationChapter';

export function FoundationThreeTitlePage({ onComplete }: { onComplete?: () => void }) {
  return <FoundationChapter number="三" index="03" title="交互教学基础" description="把抽象原理转化为可观察、可操作的教学内容" topics={['交互原型', '动态演示', '直观理解']} onComplete={onComplete} />;
}

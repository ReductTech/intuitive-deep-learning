import { FoundationChapter } from '../../components/FoundationChapter';

export function FoundationFiveTitlePage({ onComplete }: { onComplete?: () => void }) {
  return <FoundationChapter number="五" index="05" title="教育实践基础" description="人工智能赋能研究生培养的前期实践" topics={['培养场景', '典型案例', '实践积累']} onComplete={onComplete} />;
}

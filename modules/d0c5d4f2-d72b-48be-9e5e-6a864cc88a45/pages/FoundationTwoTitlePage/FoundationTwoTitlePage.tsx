import { FoundationChapter } from '../../components/FoundationChapter';

export function FoundationTwoTitlePage({ onComplete }: { onComplete?: () => void }) {
  return <FoundationChapter number="二" index="02" title="算法基础" description="论文评价与多模态理解的方法积累" topics={['论文评价', '视频理解', '多模态学习']} onComplete={onComplete} />;
}

import { FoundationChapter } from '../../components/FoundationChapter';

export function FoundationOneTitlePage({ onComplete }: { onComplete?: () => void }) {
  return <FoundationChapter number="一" index="01" title="数据基础" description="规模化文献处理与结构化数据积累" topics={['文献获取', '结构化解析', '数据积累']} onComplete={onComplete} />;
}

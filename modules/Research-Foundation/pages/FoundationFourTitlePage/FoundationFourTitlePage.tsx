import { FoundationChapter } from '../../components/FoundationChapter';

export function FoundationFourTitlePage({ onComplete }: { onComplete?: () => void }) {
  return <FoundationChapter number="四" index="04" title="平台与用户基础" description="科研信息服务平台与真实用户积累" topics={['平台建设', '学习用户', '应用验证']} onComplete={onComplete} />;
}

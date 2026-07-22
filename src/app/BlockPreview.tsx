import { useState, type ReactNode } from 'react';
import { Button, Callout, ModuleShell } from '../../modules/shared/react';

export interface BlockPreviewProps {
  title: string;
  subtitle?: string;
  children: (context: { complete: () => void; reset: () => void }) => ReactNode;
}

/** Development-only shell for exercising one lesson block without its full LessonFlow. */
export function BlockPreview({ title, subtitle = '独立调试此内容块；不加载完整课程流程。', children }: BlockPreviewProps) {
  const [instance, setInstance] = useState(0);
  const [complete, setComplete] = useState(false);

  const reset = () => {
    setComplete(false);
    setInstance((value) => value + 1);
  };

  return (
    <ModuleShell title={`内容块预览：${title}`} subtitle={subtitle}>
      <div className="app-block-preview-actions">
        <Button onClick={reset}>重置内容块</Button>
      </div>
      {children({ complete: () => setComplete(true), reset })}
      {complete && <Callout tone="green" label="预览事件" text="该内容块已调用 onComplete()。完整课程中 LessonFlow 会据此解锁下一步。" />}
    </ModuleShell>
  );
}

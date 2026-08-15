import { Button, LessonStage } from '../../shared/react';

interface MlpTransitionBlockProps {
  opened?: boolean;
  onComplete: () => void;
}

export function MlpTransitionBlock({
  opened = false,
  onComplete,
}: MlpTransitionBlockProps) {
  return (
    <LessonStage
      className="mlp-react-block mlp-react-transition"
      title="当边界越来越复杂，交给 MLP 自动寻找"
      description="你刚才通过观察和尝试手动画出了分类边界。MLP 会通过训练不断调整权重，让橙色边界自动靠近更合适的位置。"
      variant="featured"
      actions={(
        <Button
          variant="primary"
          onClick={onComplete}
          disabled={opened}
          data-telemetry-manual
        >
          {opened ? 'MLP 实验已展开' : '展开 MLP 实验'}
        </Button>
      )}
    />
  );
}

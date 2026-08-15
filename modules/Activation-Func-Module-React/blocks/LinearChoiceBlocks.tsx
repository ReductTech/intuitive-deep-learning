import { Fragment } from 'react';
import { LessonStage, PanelChoiceQuestion, Typography, type PanelChoiceOption } from '../../shared/react';
import {
  Function2DChoicePlot,
  Surface3DChoicePlot,
} from '../components/ActivationCharts';

export interface LinearChoiceBlockProps {
  onComplete: () => void;
}

interface ConfiguredLinearChoiceProps extends LinearChoiceBlockProps {
  dimension: '2d' | '3d';
  showFeedback?: boolean;
}

function choiceConfig(dimension: ConfiguredLinearChoiceProps['dimension']): {
  persistenceKey: string;
  typeLabel: string;
  title: string;
  help: string;
  correctId: string;
  options: PanelChoiceOption[];
  initialFeedback: string;
  wrongFeedback: string;
  correctFeedback: string;
} {
  if (dimension === '2d') {
    return {
      persistenceKey: 'activation-linear-2d',
      typeLabel: '二维判断',
      title: '下面三个函数，只有一个是线性的',
      help: '先观察图像的形状：哪一个始终沿着同一个方向、以固定速度变化？',
      correctId: '2d-line',
      options: [
        {
          value: '2d-line',
          key: 'A',
          title: 'y = 0.72x - 0.18',
          media: <Function2DChoicePlot type="line2d" />,
        },
        {
          value: '2d-curve',
          key: 'B',
          title: 'y = 0.75x² - 0.35',
          media: <Function2DChoicePlot type="parabola2d" />,
        },
        {
          value: '2d-fold',
          key: 'C',
          title: 'y = max(0, x)',
          media: <Function2DChoicePlot type="fold2d" />,
        },
      ],
      initialFeedback: '先看形状：直线才是这一关要找的线性函数。',
      wrongFeedback: '还不是。它的形状已经弯了或折了，所以不是这一关要找的线性函数。',
      correctFeedback: '选对了。二维里线性的图像是一条直线；现在进入三维。',
    };
  }

  return {
    persistenceKey: 'activation-linear-3d',
    typeLabel: '三维判断',
    title: '到了三维，只有一个图形仍然是线性的',
    help: '参考二维直线的直觉：三维里的线性形状应该是一整张平面。',
    correctId: '3d-plane',
    options: [
      {
        value: '3d-bowl',
        key: 'A',
        title: 'z = 0.65(x² + y²) - 0.58',
        media: <Surface3DChoicePlot type="bowl3d" />,
      },
      {
        value: '3d-plane',
        key: 'B',
        title: 'z = 0.55x - 0.30y + 0.05',
        media: <Surface3DChoicePlot type="plane3d" />,
      },
      {
        value: '3d-fold',
        key: 'C',
        title: 'z = max(0, x + 0.55y) - 0.42',
        media: <Surface3DChoicePlot type="fold3d" />,
      },
    ],
    initialFeedback: '可以拖动任意三维图旋转视角。看清楚后，选出唯一的平面。',
    wrongFeedback: '还不是。三维里的线性形状应该是一整张平面，而不是弯曲或折起来的表面。',
    correctFeedback: '选对了。三维里线性的图像是一张平面。接下来看看只堆线性神经元会怎样。',
  };
}

/** The same configured interaction renders both 2D and 3D panel questions. */
export function LinearChoiceBlock({
  dimension,
  onComplete,
  showFeedback = true,
}: ConfiguredLinearChoiceProps) {
  const config = choiceConfig(dimension);
  return (
    <PanelChoiceQuestion
      persistenceKey={config.persistenceKey}
      typeLabel={config.typeLabel}
      title={(
        <span className="af-react-question-line">
          <Typography as="span" variant="body">{config.title}</Typography>
          <Typography as="span" variant="bodySmall" tone="muted">{config.help}</Typography>
        </span>
      )}
      answer={config.correctId}
      options={config.options}
      feedback={{
        initial: config.initialFeedback,
        wrong: config.wrongFeedback,
        correct: config.correctFeedback,
      }}
      showFeedback={showFeedback}
      onCheck={(result) => { if (result.ok) onComplete(); }}
    />
  );
}

export function Linear2DChoiceBlock({ onComplete }: LinearChoiceBlockProps) {
  return (
    <Fragment>
      <LessonStage
        className="af-react-definition"
        title="什么是线性？先看它怎样变化"
        variant="featured"
      >
        <p className="af-react-definition-copy">
          先不用记公式。在线性关系里，输入每次增加相同的一步，输出也会按照固定的幅度变化。
          它的变化方向和速度不会突然改变，所以画在二维坐标中就是一条直线。
          这条直线可以倾斜、平移、变陡或变平；只要没有弯曲和折点，这一关就把它看作线性。
        </p>
      </LessonStage>
      <LinearChoiceBlock dimension="2d" onComplete={onComplete} />
    </Fragment>
  );
}

export function Linear3DChoiceBlock({ onComplete }: LinearChoiceBlockProps) {
  return <LinearChoiceBlock dimension="3d" onComplete={onComplete} />;
}

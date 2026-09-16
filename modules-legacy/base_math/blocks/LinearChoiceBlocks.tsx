import { PanelChoiceQuestion, Typography, type PanelChoiceOption } from '../../shared/react';
import { Function2DChoicePlot, Surface3DChoicePlot } from '../components/LinearChoiceCharts';

export function LinearChoiceBlock({ dimension, onComplete }: { dimension: '2d' | '3d'; onComplete: () => void }) {
  const is2d = dimension === '2d';
  const options: PanelChoiceOption[] = is2d ? [
    { value: '2d-line', key: 'A', title: 'y = 0.72x - 0.18', media: <Function2DChoicePlot type="line2d" /> },
    { value: '2d-curve', key: 'B', title: 'y = 0.75x² - 0.35', media: <Function2DChoicePlot type="parabola2d" /> },
    { value: '2d-fold', key: 'C', title: 'y = max(0, x)', media: <Function2DChoicePlot type="fold2d" /> },
  ] : [
    { value: '3d-bowl', key: 'A', title: 'z = 0.65(x² + y²) - 0.58', media: <Surface3DChoicePlot type="bowl3d" /> },
    { value: '3d-plane', key: 'B', title: 'z = 0.55x - 0.30y + 0.05', media: <Surface3DChoicePlot type="plane3d" /> },
    { value: '3d-fold', key: 'C', title: 'z = max(0, x + 0.55y) - 0.42', media: <Surface3DChoicePlot type="fold3d" /> },
  ];

  return <PanelChoiceQuestion
    persistenceKey={`base-math-linear-${dimension}-v1`}
    typeLabel={is2d ? '二维判断' : '三维判断'}
    title={<span className="bm-linear-question-line"><Typography as="span" variant="body">{is2d ? '下面三个函数，只有一个是线性的' : '到了三维，只有一个图形仍然是线性的'}</Typography><Typography as="span" variant="bodySmall" tone="muted">{is2d ? '哪一个始终沿同一方向、以固定速度变化？' : '沿用二维直线的直觉：三维中应该是一整张平面。'}</Typography></span>}
    answer={is2d ? '2d-line' : '3d-plane'} options={options} showFeedback={false}
    feedback={{ initial: '', wrong: '', correct: '' }} onCheck={(result) => { if (result.ok) onComplete(); }}
  />;
}

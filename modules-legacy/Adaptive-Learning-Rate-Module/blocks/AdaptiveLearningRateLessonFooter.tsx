import { LessonFooter } from '../../shared/react';

export function AdaptiveLearningRateLessonFooter() {
  return (
    <LessonFooter
      className="alr-footer"
      title="你已经能按训练现象选择优化器了"
      description="SGD 提供基础更新；Momentum 平滑方向；AdaGrad 按参数缩放步长；Adam 同时利用方向趋势与梯度尺度。实际训练中还要结合验证结果调学习率。"
      back={{ href: '/', label: '返回课程目录' }}
      next={{ href: '/modules/fitting-module', label: '下一课：拟合与泛化' }}
    />
  );
}

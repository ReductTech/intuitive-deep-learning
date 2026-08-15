import { Button, LessonStage } from '../../shared/react';

export interface LinearConclusionBlockProps {
  onComplete: () => void;
}

export function LinearConclusionBlock({ onComplete }: LinearConclusionBlockProps) {
  return (
    <LessonStage
      className="af-react-conclusion"
      title="线性运算的线性叠加，永远还是线性的"
      description="没有激活函数时，神经元只是不断做加权求和与加偏置。一个线性层、很多个神经元、甚至 5 层 MLP，最后都可以合并成一个大的线性变换：二维里还是直线，三维里还是平面。"
      variant="featured"
      data-telemetry-manual
    >
      <Button variant="primary" className="af-react-continue" onClick={onComplete}>
        给神经元加上 ReLU
      </Button>
    </LessonStage>
  );
}

import { ModuleShell } from '../shared/react';
import { LinearRecognitionBlock } from './blocks/LinearRecognitionBlock';
import './base-math.css';

export function BaseMathPage() {
  return (
    <ModuleShell
      title="认识线性"
      subtitle="刚才的人工神经元先完成加权求和。接下来先判断：什么样的关系可以称为线性？"
      shellClassName="base-math-shell"
    >
      <LinearRecognitionBlock />
    </ModuleShell>
  );
}

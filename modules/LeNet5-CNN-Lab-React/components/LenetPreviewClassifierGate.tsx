import { useEffect, useState, type ReactNode } from 'react';
import { Button, Callout } from '../../shared/react';
import { kernelSignature } from '../model/fixedKernelMath';
import type { FixedKernelId, LenetClassifierSession } from '../model/lenetTypes';
import { trainFixedKernel } from '../services/lenetServices';

interface LenetPreviewClassifierGateProps {
  children: (session: LenetClassifierSession) => ReactNode;
}

const PREVIEW_KERNELS: FixedKernelId[] = [
  'edge',
  'vertical',
  'horizontal',
  'diag_down',
  'diag_up',
  'center',
];

/** Supplies a real trained classifier to isolated sequence and detection previews. */
export function LenetPreviewClassifierGate({ children }: LenetPreviewClassifierGateProps) {
  const [attempt, setAttempt] = useState(0);
  const [session, setSession] = useState<LenetClassifierSession | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setSession(null);
    setError('');
    void trainFixedKernel({ kernels: PREVIEW_KERNELS, signal: controller.signal })
      .then((result) => {
        if (!result.classifier) throw new Error('训练服务没有返回可用于调试的分类器。');
        const trainAccuracy = Number(result.train_accuracy);
        const valAccuracy = Number(result.val_accuracy);
        if (!Number.isFinite(trainAccuracy) || !Number.isFinite(valAccuracy) || valAccuracy <= 0.9) {
          throw new Error('调试分类器未达到验证准确率 > 0.9，请重新训练。');
        }
        setSession({
          signature: kernelSignature(PREVIEW_KERNELS),
          selectedKernels: [...PREVIEW_KERNELS],
          classifier: result.classifier,
          trainAccuracy,
          valAccuracy,
          trainedAt: Date.now(),
        });
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return;
        setError(reason instanceof Error ? reason.message : '无法准备内容块调试所需的真实分类器。');
      });
    return () => controller.abort();
  }, [attempt]);

  if (session) return <>{children(session)}</>;

  return (
    <div className="lenet-preview-gate">
      <Callout
        tone={error ? 'red' : 'blue'}
        label={error ? '前置服务不可用' : '正在准备真实分类器'}
        text={error || '序列识别和目标检测依赖第一幕训练出的分类器，单内容块调试会先调用真实 LeNet 训练服务。'}
      />
      {error && <Button onClick={() => setAttempt((value) => value + 1)}>重新训练</Button>}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Button, Callout, ContentBlock, Typography, ValueTile } from '../../../shared/react';
import { FeatureMap } from '../../components/FeatureMap';
import { KernelGrid } from '../../components/KernelGrid';
import { MnistDigit } from '../../components/MnistDigit';
import { useMnistSample } from '../../hooks/useMnistSample';
import { useKernelLesson } from '../../LessonContext';
import { KERNEL_SIZE, verticalKernel } from '../../model/kernelLab';
import {
  featureSizeFor,
  featureValuesOf,
  formatResponse,
  userKernelReady,
} from '../../model/mnistLab';
import '../ck-pages.css';
import './MnistScanPage.css';

/** 整张特征图扫完的时长，以及画面刷新间隔。按时间推进，慢机器上也不会越扫越久。 */
const SCAN_DURATION_MS = 4200;
const TICK_MS = 60;

export interface MnistScanPageProps {
  /** 整张特征图扫描完成后进入读响应的下一页。 */
  onComplete: () => void;
}

export function MnistScanPage({ onComplete }: MnistScanPageProps) {
  const { designKernel } = useKernelLesson();
  const { label, pixels, status, error, shuffle } = useMnistSample();
  const hasOwnKernel = userKernelReady(designKernel);
  const kernel = useMemo(
    () => (hasOwnKernel ? designKernel : verticalKernel(KERNEL_SIZE)),
    [designKernel, hasOwnKernel],
  );
  const featureValues = useMemo(
    () => (pixels ? featureValuesOf(pixels, kernel) : []),
    [kernel, pixels],
  );
  const size = featureSizeFor(kernel);
  const total = size * size;
  const [step, setStep] = useState(0);
  const [runId, setRunId] = useState(0);

  // 换图或换核都要从头开始扫描。
  useEffect(() => {
    setStep(0);
    setRunId((value) => value + 1);
  }, [featureValues]);

  useEffect(() => {
    if (status !== 'ready' || pixels === null || total <= 0) return undefined;
    const startedAt = window.performance.now();
    const timer = window.setInterval(() => {
      const elapsed = window.performance.now() - startedAt;
      const next = Math.min(total, Math.floor((elapsed / SCAN_DURATION_MS) * total));
      setStep(next);
      if (next >= total) window.clearInterval(timer);
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [pixels, runId, status, total]);

  const restartScan = () => {
    setStep(0);
    setRunId((value) => value + 1);
  };

  const currentIndex = step > 0 ? step - 1 : null;
  const windowRow = currentIndex === null ? null : Math.floor(currentIndex / size);
  const windowCol = currentIndex === null ? null : currentIndex % size;
  const currentValue = currentIndex === null ? null : featureValues[currentIndex];
  const done = total > 0 && step >= total;
  const shownValues = useMemo(
    () => featureValues.map((value, index) => (index < step ? value : null)),
    [featureValues, step],
  );

  const statusText = status === 'loading'
    ? '正在加载数字图片……'
    : status === 'error'
      ? '图片加载失败：' + error
      : done
        ? '扫描完成。右边这张特征图，就是同一个卷积核在 ' + total + ' 个位置留下的响应。'
        : '滑动窗口正在扫描：每移动一格，就算一次乘积之和。';

  return (
    <ContentBlock
      headingLevel={1}
      className="ck-page ck-page--mnist-scan"
      title="让卷积核扫过这张手写数字"
      subtitle="滑动窗口会自动移动，每到一个位置就计算一个值，并把它写进右边的特征图。窗口内的乘积之和越大，那个位置就越像卷积核要找的模式。"
    >
      <div className="ck-split">
        <section className="ck-figure-column" aria-label="正在被扫描的数字">
          <Typography variant="bodySmall" tone="muted">
            橙色方框是滑动窗口当前的位置。
          </Typography>
          <div className="ck-figure-area">
            <div className="ck-square-frame">
              <MnistDigit
                pixels={pixels}
                windowTop={windowRow}
                windowLeft={windowCol}
                windowSize={kernel.length}
                label="正在被扫描的手写数字"
              />
            </div>
          </div>
          <div className="ck-tile-row">
            <ValueTile label="标签" value={status === 'ready' ? label : '—'} tone="blue" />
            <ValueTile
              label="窗口位置"
              value={windowRow === null || windowCol === null
                ? '—'
                : String(windowCol + 1).padStart(2, '0') + ',' + String(windowRow + 1).padStart(2, '0')}
            />
            <ValueTile
              label="响应强度"
              value={currentValue === null ? '—' : formatResponse(currentValue)}
              tone="orange"
            />
          </div>
        </section>

        <aside className="ck-side">
          <section className="ck-card">
            <Typography as="h2" variant="h3" tone="accent">卷积核与特征图</Typography>
            <div className="ck-pair">
              <div className="ck-pair-slot">
                <KernelGrid matrix={kernel} label="正在使用的卷积核" className="ck-mnist-kernel" />
                <Typography variant="bodySmall" tone="muted">
                  {hasOwnKernel ? '你在上一幕设计的 5 × 5 核。' : '还没有自己设计过核，先用一个竖线核演示。'}
                </Typography>
              </div>
              <div className="ck-pair-slot">
                <FeatureMap
                  values={shownValues}
                  size={size}
                  currentIndex={currentIndex}
                  label="卷积输出的特征图"
                  className="ck-mnist-feature"
                />
              </div>
            </div>
            <Typography variant="bodySmall" tone="muted">
              {done
                ? size + ' × ' + size + ' = ' + total + ' 个响应值已经全部写好。'
                : '已经写好了 ' + step + ' / ' + total + ' 个响应值。'}
            </Typography>
          </section>

          <Callout tone={done ? 'green' : 'blue'} label="扫描状态" text={statusText} />

          <div className="ck-actions">
            <Button onClick={shuffle}>随机换一张</Button>
            <Button disabled={status !== 'ready'} onClick={restartScan}>重放扫描</Button>
            <Button variant="primary" disabled={!done} onClick={onComplete}>继续</Button>
          </div>
        </aside>
      </div>
    </ContentBlock>
  );
}

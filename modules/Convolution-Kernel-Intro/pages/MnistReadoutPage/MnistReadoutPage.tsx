import { useEffect, useMemo, useState } from 'react';
import { Button, Callout, ContentBlock, Typography, ValueTile } from '../../../shared/react';
import { FeatureMap } from '../../components/FeatureMap';
import { KernelGrid } from '../../components/KernelGrid';
import { MnistDigit } from '../../components/MnistDigit';
import { useMnistSample } from '../../hooks/useMnistSample';
import { useKernelLesson } from '../../LessonContext';
import type { Matrix } from '../../model/kernelLab';
import {
  CUSTOM_KERNEL_SIZE,
  MNIST_KERNELS,
  defaultCustomKernel,
  featureSizeFor,
  featureValuesOf,
  formatResponse,
  kernelFor,
  kernelKeyLabel,
  type MnistKernelKey,
} from '../../model/mnistLab';
import '../ck-pages.css';
import './MnistReadoutPage.css';

const PRESET_TABS: ReadonlyArray<{ key: MnistKernelKey; label: string }> = [
  { key: 'vertical', label: '竖线' },
  { key: 'horizontal', label: '横线' },
  { key: 'edge', label: '边缘' },
];

export interface MnistReadoutPageProps {
  /** 看过不同卷积核的响应之后收束整门课。 */
  onComplete: () => void;
}

export function MnistReadoutPage({ onComplete }: MnistReadoutPageProps) {
  const { designKernel } = useKernelLesson();
  const { label, pixels, status, error, shuffle } = useMnistSample();
  const hasOwnKernel = designKernel.some((line) => line.some((value) => value !== 0));
  const [choice, setChoice] = useState<MnistKernelKey>(hasOwnKernel ? 'user' : 'vertical');
  const [custom, setCustom] = useState<Matrix>(() => defaultCustomKernel());
  const [selected, setSelected] = useState<number | null>(null);
  const [switched, setSwitched] = useState(false);

  const kernel = kernelFor(choice, designKernel, custom);
  const featureValues = useMemo(
    () => (pixels ? featureValuesOf(pixels, kernel) : []),
    [kernel, pixels],
  );
  const size = featureSizeFor(kernel);
  const selectedValue = selected !== null && selected < featureValues.length ? featureValues[selected] : null;
  const selectedRow = selected === null ? null : Math.floor(selected / size);
  const selectedCol = selected === null ? null : selected % size;

  useEffect(() => {
    setSelected(null);
  }, [featureValues]);

  const pickKernel = (key: MnistKernelKey) => {
    setChoice(key);
    setSwitched(true);
  };

  const summary = choice === 'user'
    ? '这是你在算子实验里设计的 5 × 5 核。'
    : choice === 'custom'
      ? '点方格修改这个 3 × 3 核，特征图会立刻重算。'
      : MNIST_KERNELS[choice].summary;

  const readout = selectedValue === null || selectedRow === null || selectedCol === null
    ? '点一下右边的特征图方格：它会告诉你这个位置对应图像上的哪个窗口、响应强度是多少。'
    : '特征图第 ' + (selectedRow + 1) + ' 行第 ' + (selectedCol + 1) + ' 列，来自图像上以第 '
      + (selectedCol + 1) + ' 列第 ' + (selectedRow + 1) + ' 行为左上角的窗口，响应强度 '
      + formatResponse(selectedValue) + '。';

  return (
    <ContentBlock
      headingLevel={1}
      className="ck-page ck-page--mnist-readout"
      title="换一个卷积核，它就会去找别的特征"
      subtitle="同一张数字图，同一个扫描过程，只把卷积核换掉：有的核突出竖线，有的核突出横线，有的核只对边缘有反应。"
    >
      <div className="ck-split">
        <section className="ck-figure-column" aria-label="被扫描的数字">
          <Typography variant="bodySmall" tone="muted">
            橙色方框是当前选中响应对应的窗口。
          </Typography>
          <div className="ck-figure-area">
            <div className="ck-square-frame">
              <MnistDigit
                pixels={pixels}
                windowTop={selectedRow}
                windowLeft={selectedCol}
                windowSize={kernel.length}
                label="被扫描的手写数字"
              />
            </div>
          </div>
          <div className="ck-tile-row">
            <ValueTile label="标签" value={status === 'ready' ? label : '—'} tone="blue" />
            <ValueTile label="当前卷积核" value={kernelKeyLabel(choice)} />
            <ValueTile
              label="响应强度"
              value={selectedValue === null ? '—' : formatResponse(selectedValue)}
              tone="orange"
            />
          </div>
        </section>

        <aside className="ck-side">
          <div className="ck-switch" role="group" aria-label="选择卷积核">
            {hasOwnKernel && (
              <Button active={choice === 'user'} onClick={() => pickKernel('user')}>你的核</Button>
            )}
            {PRESET_TABS.map((tab) => (
              <Button key={tab.key} active={choice === tab.key} onClick={() => pickKernel(tab.key)}>
                {tab.label}
              </Button>
            ))}
            <Button active={choice === 'custom'} onClick={() => pickKernel('custom')}>
              {'自定义 ' + CUSTOM_KERNEL_SIZE + ' × ' + CUSTOM_KERNEL_SIZE}
            </Button>
          </div>

          <section className="ck-card">
            <Typography as="h2" variant="h3" tone="accent">卷积核与特征图</Typography>
            <div className="ck-pair">
              <div className="ck-pair-slot">
                {choice === 'custom' ? (
                  <KernelGrid
                    matrix={custom}
                    editable
                    onToggle={(row, col) => setCustom((current) => current.map((line, r) => (
                      line.map((value, c) => (r === row && c === col ? (value ? 0 : 1) : value))
                    )))}
                    label="可编辑的三乘三卷积核"
                    className="ck-mnist-kernel"
                  />
                ) : (
                  <KernelGrid matrix={kernel} label="当前卷积核" className="ck-mnist-kernel" />
                )}
                <Typography variant="bodySmall" tone="muted">{summary}</Typography>
              </div>
              <div className="ck-pair-slot">
                <FeatureMap
                  values={featureValues.map((value) => (status === 'ready' ? value : null))}
                  size={size}
                  selectedIndex={selected}
                  interactive={status === 'ready'}
                  onSelect={setSelected}
                  label="可以点击查看响应强度的特征图"
                  className="ck-mnist-feature"
                />
              </div>
            </div>
          </section>

          <Callout tone={selectedValue === null ? 'blue' : 'green'} label="响应读数" text={readout} />

          <div className="ck-actions">
            <Button onClick={shuffle}>随机换一张</Button>
            <Button variant="primary" disabled={selected === null} onClick={onComplete}>继续</Button>
            {selected === null && (
              <Typography variant="bodySmall" tone="muted">
                {status === 'error' ? '图片加载失败：' + error : '点一个特征图方格以后继续。'}
              </Typography>
            )}
            {switched && selected === null && (
              <Typography variant="bodySmall" tone="muted">已经换过卷积核：同一张图，特征图完全不同。</Typography>
            )}
          </div>
        </aside>
      </div>
    </ContentBlock>
  );
}


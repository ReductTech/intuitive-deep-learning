import { useEffect, useState } from 'react';
import { Button, Callout, ContentBlock, Typography, ValueTile } from '../../../shared/react';
import { MnistDigit } from '../../components/MnistDigit';
import { useMnistSample } from '../../hooks/useMnistSample';
import { MNIST_IMAGE_SIZE } from '../../model/mnistLab';
import '../ck-pages.css';
import './MnistInputPage.css';

const POINTS: readonly string[] = [
  '一张手写数字图，就是 28 × 28 = 784 个 0 到 1 之间的数字：0 是黑，1 是白。',
  '卷积不去看整张图，它每次只看一个小窗口，比如 5 × 5。',
  '同一个卷积核在所有位置重复使用，所以参数数量不随图像变大而增加。',
];

export interface MnistInputPageProps {
  /** 读过像素之后进入扫描动画。 */
  onComplete: () => void;
}

export function MnistInputPage({ onComplete }: MnistInputPageProps) {
  const { label, pixels, status, error, shuffle } = useMnistSample();
  const [picked, setPicked] = useState<{ row: number; col: number } | null>(null);

  useEffect(() => {
    setPicked(null);
  }, [pixels]);

  const pickedValue = picked && pixels ? pixels[picked.row][picked.col] : null;
  const hintText = picked && pickedValue !== null
    ? '第 ' + picked.row + ' 行第 ' + picked.col + ' 列的像素值是 ' + pickedValue.toFixed(2) + '。'
    : '点一下左边的方格，就能读出那个像素的数值。';
  const canContinue = Boolean(picked) || status === 'error';

  return (
    <ContentBlock
      headingLevel={1}
      className="ck-page ck-page--mnist-input"
      title="换一张手写数字，看看卷积的输入"
      subtitle="这一幕的输入不再是棋盘，而是一张 MNIST 数字图像。它同样是数字表格，只是每个格子的取值从 0 / 1 变成了 0 到 1 之间的灰度。"
    >
      <div className="ck-split">
        <section className="ck-figure-column" aria-label="手写数字输入">
          <Typography variant="bodySmall" tone="muted">
            {status === 'loading' && '正在加载数字图片……'}
            {status === 'ready' && '点击任意方格，读出这个像素的数值。'}
            {status === 'error' && '图片加载失败：' + error}
          </Typography>
          <div className="ck-figure-area">
            <div className="ck-square-frame">
              <MnistDigit
                pixels={pixels}
                selected={picked}
                showGrid
                onPickPixel={(row, col) => setPicked({ row, col })}
                label="手写数字的二十八乘二十八像素，点击可以读数值"
              />
            </div>
          </div>
          <div className="ck-tile-row">
            <ValueTile label="标签" value={status === 'ready' ? label : '—'} tone="blue" />
            <ValueTile label="尺寸" value={MNIST_IMAGE_SIZE + ' × ' + MNIST_IMAGE_SIZE} />
            <ValueTile
              label={picked ? '第 ' + picked.row + ' 行第 ' + picked.col + ' 列' : '当前像素值'}
              value={pickedValue === null ? '—' : pickedValue.toFixed(2)}
              tone="orange"
            />
          </div>
        </section>

        <aside className="ck-side">
          <section className="ck-card">
            <Typography as="h2" variant="h3" tone="accent">这一张图，就是 784 个数</Typography>
            <ul className="ck-points">
              {POINTS.map((point) => (
                <Typography as="li" key={point} variant="bodySmall" tone="muted">{point}</Typography>
              ))}
            </ul>
          </section>

          <Callout tone="blue" label="读到的数值" text={hintText} />

          <div className="ck-actions">
            <Button onClick={shuffle}>随机换一张</Button>
            <Button variant="primary" disabled={!canContinue} onClick={onComplete}>继续</Button>
            {!canContinue && (
              <Typography variant="bodySmall" tone="muted">先点一个方格读出数值，再看卷积核怎么扫过它。</Typography>
            )}
          </div>
        </aside>
      </div>
    </ContentBlock>
  );
}


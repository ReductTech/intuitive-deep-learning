import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, moduleAssetUrl, Typography } from '../../../shared/react';
import { DIGITS, IMAGE_SIZE, initialModel, makeSample, predictWithLabeledResponses, trainWithReplay, type KernelModel, type LabeledDigit } from '../../services/learnableKernelDemo';
import './LearnableKernelPage.css';

const ASSET_ID = '80396753-7fc8-4f55-9188-bddbdb828169';
const RESPONSE_SIZE = IMAGE_SIZE - 2;

function kernelColor(weight: number) {
  const strength = Math.min(1, Math.abs(weight) / 1.4);
  return weight >= 0
    ? `rgba(239, 119, 57, ${0.12 + strength * .55})`
    : `rgba(77, 139, 215, ${0.12 + strength * .48})`;
}

export function LearnableKernelPage() {
  const [images, setImages] = useState<number[][] | null>(null);
  const [loadingError, setLoadingError] = useState(false);
  const [model, setModel] = useState<KernelModel>(initialModel);
  const [sampleIndex, setSampleIndex] = useState(0);
  const [recentCorrect, setRecentCorrect] = useState<boolean[]>([]);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const labeledExamples = useRef<LabeledDigit[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all(DIGITS.map(digit => new Promise<number[]>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = IMAGE_SIZE;
        canvas.height = IMAGE_SIZE;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) { reject(new Error('Canvas unavailable')); return; }
        context.drawImage(image, 0, 0, IMAGE_SIZE, IMAGE_SIZE);
        const rgba = context.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE).data;
        resolve(Array.from({ length: IMAGE_SIZE * IMAGE_SIZE }, (_, index) => rgba[index * 4] / 255));
      };
      image.onerror = () => reject(new Error(`MNIST image unavailable: ${digit.file}`));
      image.src = moduleAssetUrl(ASSET_ID, `mnist/${digit.file}`);
    }))).then(data => { if (active) setImages(data); }).catch(() => { if (active) setLoadingError(true); });
    return () => { active = false; if (timer.current) clearTimeout(timer.current); };
  }, []);

  const sample = useMemo(() => images ? makeSample(images, sampleIndex) : null, [images, sampleIndex]);
  const prediction = useMemo(() => sample ? predictWithLabeledResponses(model, sample.pixels, labeledExamples.current) : null, [model, sample]);
  const isCorrect = sample && prediction ? prediction.label === sample.label : false;
  const recentHits = recentCorrect.filter(Boolean).length;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sample) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const imageData = context.createImageData(IMAGE_SIZE, IMAGE_SIZE);
    sample.pixels.forEach((pixel, index) => {
      const value = Math.round(pixel * 255);
      const position = index * 4;
      imageData.data[position] = value;
      imageData.data[position + 1] = value;
      imageData.data[position + 2] = value;
      imageData.data[position + 3] = 255;
    });
    context.putImageData(imageData, 0, 0);
  }, [sample]);

  function chooseLabel(label: number) {
    if (busy || !sample || !prediction || !images) return;
    const examples = [...labeledExamples.current, { basePixels: images[sample.label], label }];
    const updated = trainWithReplay(model, examples);
    labeledExamples.current = examples;
    setRecentCorrect(previous => [...previous, prediction.label === sample.label].slice(-8));
    setLastUpdate(Math.max(...updated.kernel.map((value, index) => Math.abs(value - model.kernel[index]))));
    setModel(updated);
    setFeedback(label === sample.label ? '卷积核参数已更新，随后显示下一张样本。' : '错误标签同样会影响训练结果。');
    setBusy(true);
    timer.current = setTimeout(() => {
      setSampleIndex(index => index + 1);
      setBusy(false);
      setFeedback('');
      timer.current = null;
    }, 1200);
  }

  const responseMax = prediction ? Math.max(.001, ...prediction.response) : 1;

  return <ContentBlock
    className="vfl-learn-page"
    headingLevel={1}
    title="可学习卷积核"
    subtitle="使用 3、5、8、9 各一张真实 MNIST 图像，考察标注对卷积核及预测结果的影响。"
  >
    <div className="vfl-learn-flow">
      <section className="vfl-learn-panel" aria-label="真实 MNIST 输入与卷积响应">
        <div className="vfl-learn-panel-head"><Typography as="h2" variant="h3" tone="accent">输入与响应</Typography></div>
        <div className="vfl-learn-image-area">
          <div className="vfl-learn-image-stack" role="img" aria-label={sample ? `MNIST 数字 ${DIGITS[sample.label].value} 与卷积响应热图叠加` : '正在读取 MNIST 样本'}>
            <canvas ref={canvasRef} width={IMAGE_SIZE} height={IMAGE_SIZE} />
            {prediction && <div className="vfl-learn-response-grid" aria-hidden="true">
              {Array.from({ length: IMAGE_SIZE * IMAGE_SIZE }, (_, position) => {
                const x = position % IMAGE_SIZE;
                const y = Math.floor(position / IMAGE_SIZE);
                const response = x > 0 && x < IMAGE_SIZE - 1 && y > 0 && y < IMAGE_SIZE - 1
                  ? prediction.response[(y - 1) * RESPONSE_SIZE + x - 1] : 0;
                const level = Math.sqrt(response / responseMax);
                return <span key={position} style={{ backgroundColor: level < .12 ? 'transparent' : `rgba(255, 105, 24, ${(level * .72).toFixed(3)})` }} />;
              })}
            </div>}
          </div>
        </div>
        <Typography as="p" variant="body" tone="muted" className="vfl-learn-panel-note">
          {loadingError ? 'MNIST 图像加载失败' : sample ? `第 ${sampleIndex + 1} 张 · 仅平移原图` : '正在读取 MNIST 原图…'}
        </Typography>
        <Typography as="p" variant="body" tone="warning" className="vfl-learn-heat-note">橙色越亮，卷积响应越强</Typography>
      </section>

      <span className="vfl-learn-flow-arrow" aria-hidden="true">→</span>

      <section className="vfl-learn-panel vfl-learn-kernel-panel" aria-label="正在学习的卷积核">
        <div className="vfl-learn-panel-head"><Typography as="h2" variant="h3" tone="accent">3 × 3 可学习卷积核</Typography></div>
        <div className="vfl-learn-kernel-content">
          <Typography as="p" variant="body" tone="muted">同一个卷积核扫描整张图像</Typography>
          <MathFormulaBlock className={`vfl-learn-kernel-formula ${busy ? 'is-updated' : ''}`} ariaLabel="当前三乘三卷积核的九个可训练权重">
            <div className="vfl-learn-weight-grid">
              {model.kernel.map((weight, index) => <div key={index} style={{ backgroundColor: kernelColor(weight) }}>
                <Typography as="span" variant="body" tone={weight >= 0 ? 'warning' : 'accent'}>{weight.toFixed(2)}</Typography>
              </div>)}
            </div>
          </MathFormulaBlock>
          <div className="vfl-learn-update">
            <Typography as="p" variant="body" tone="muted">蓝色为负权重 · 橙色为正权重</Typography>
            <Typography as="p" variant="body" tone="accent">
              {lastUpdate === null ? '等待第一次标注' : `${busy ? '本轮' : '上轮'}最大变化 ${lastUpdate.toFixed(3)}`}
            </Typography>
          </div>
        </div>
        <div className="vfl-learn-kernel-footer"><Typography as="p" variant="body" tone="warning">每次标注后重复训练已标注样本</Typography></div>
      </section>

      <span className="vfl-learn-flow-arrow" aria-hidden="true">→</span>

      <section className="vfl-learn-panel" aria-label="预测与标注">
        <div className="vfl-learn-panel-head"><Typography as="h2" variant="h3" tone="accent">预测与正确标签</Typography></div>
        <div className="vfl-learn-prediction">
          <Typography as="p" variant="body" tone="muted">
            {busy ? '训练后预测：' : '当前预测：'}
            <Typography as="strong" variant="h3" tone="accent">{prediction ? DIGITS[prediction.label].value : '—'}</Typography>
            {prediction && <Typography as="span" variant="body" tone={isCorrect ? 'success' : 'danger'} className="vfl-learn-verdict">{isCorrect ? '✓ 正确' : '✕ 错误'}</Typography>}
          </Typography>
          <Typography as="p" variant="body" tone="muted">
            {recentCorrect.length ? `近 ${recentCorrect.length} 张预测正确 ${recentHits} 张` : '标注后显示预测记录'}
          </Typography>
        </div>
        <Typography as="p" variant="body" tone="accent" className="vfl-learn-choice-title">请选择当前图像的类别标签</Typography>
        <div className="vfl-learn-choices">
          {DIGITS.map((digit, index) => <Button
            key={digit.value}
            type="button"
            variant="default"
            disabled={busy || !images}
            onClick={() => chooseLabel(index)}
            className="vfl-learn-choice"
            aria-label={`将当前数字标注为 ${digit.value}`}
          ><Typography as="span" variant="h3" tone="inherit">{digit.value}</Typography></Button>)}
        </div>
        <Typography as="p" variant="body" tone="muted" className="vfl-learn-feedback" role="status">{feedback || '预测依据与已标注样本的卷积响应比较。'}</Typography>
      </section>
    </div>

    <div className="vfl-learn-takeaway">
      <Typography as="strong" variant="h3" tone="warning">过拟合实验</Typography>
      <Typography as="p" variant="body" tone="accent">每类仅使用一张 MNIST 原图及其平移副本；本实验说明有限样本的拟合，不评价泛化性能。</Typography>
    </div>
  </ContentBlock>;
}

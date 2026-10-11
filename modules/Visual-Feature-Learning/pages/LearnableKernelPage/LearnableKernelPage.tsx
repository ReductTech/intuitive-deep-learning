import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, moduleAssetUrl, Typography } from '../../../shared/react';
import { DIGITS, IMAGE_SIZE, initialModel, makeSample, predict, trainOnLabel, classActivationMap, type KernelModel, type LabeledDigit } from '../../services/learnableKernelDemo';
import './LearnableKernelPage.css';

const ASSET_ID = '80396753-7fc8-4f55-9188-bddbdb828169';
const CAM_GRID_SIZE = 6;

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
  const [busy, setBusy] = useState(false);
  const [labelError, setLabelError] = useState(false);
  const [rejectedLabel, setRejectedLabel] = useState<number | null>(null);
  const [rejectionAttempt, setRejectionAttempt] = useState(0);
  
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

  const sample = useMemo(() => {
    if (!images) return null;
    const original = makeSample(images, sampleIndex);
    let seed = 731 + sampleIndex * 97;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const pixels = original.pixels.map(value => {
      const speckle = random() < .065 ? .18 + random() * .27 : random() * .065;
      return Math.min(1, value + speckle);
    });
    return { ...original, pixels };
  }, [images, sampleIndex]);
  const prediction = useMemo(() => sample ? predict(model, sample.pixels) : null, [model, sample]);
  const isCorrect = sample && prediction ? prediction.label === sample.label : false;

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

  function learnStep(label: number) {
    if (busy || !sample || !images) return;
    if (label !== sample.label) {
      setLabelError(true);
      setRejectedLabel(label);
      setRejectionAttempt(value => value + 1);
      return;
    }
    setLabelError(false);
    setRejectedLabel(null);
    const examples = [...labeledExamples.current.filter(item => item.label !== label), { basePixels: sample.pixels, label }];
    labeledExamples.current = examples;
    setBusy(true);
    let current = model;
    let step = 0;
    const advance = () => {
      const previous = current;
      for (const example of examples) current = trainOnLabel(current, example.basePixels, example.label);
      setLastUpdate(Math.max(...current.kernel.map((value, index) => Math.abs(value - previous.kernel[index]))));
      setModel(current);
      step += 1;
      if (step < 8) timer.current = setTimeout(advance, 140);
      else {
        timer.current = setTimeout(() => {
          setSampleIndex(index => index + 1);
          setLastUpdate(null);
          setBusy(false);
          timer.current = null;
        }, 700);
      }
    };
    advance();
  }


  const cam = useMemo(() => prediction ? classActivationMap(model, prediction) : [], [model, prediction]);
  // Fixed display scale allows comparison during learning without amplifying tiny noise.
  const camScale = .5;

  return <ContentBlock
    className="vfl-learn-page"
    headingLevel={1}
    title="可学习卷积核"
    subtitle="为含噪数字标注，观察网络关注哪些区域。"
  >
    <div className="vfl-learn-flow">
      <section className="vfl-learn-panel" aria-label="输入图像与网络关注区域">
        <div className="vfl-learn-panel-head"><Typography as="h2" variant="h3" tone="accent">网络关注区域</Typography></div>
        <div className="vfl-learn-image-area">
          <div className="vfl-learn-image-stack" role="img" aria-label={sample ? `MNIST 数字 ${DIGITS[sample.label].value} 与网络关注区域叠加` : '正在读取 MNIST 样本'}>
            <canvas ref={canvasRef} width={IMAGE_SIZE} height={IMAGE_SIZE} />
            {prediction && <div className="vfl-learn-response-grid" aria-hidden="true">
              {Array.from({ length: IMAGE_SIZE * IMAGE_SIZE }, (_, position) => {
                const x = position % IMAGE_SIZE;
                const y = Math.floor(position / IMAGE_SIZE);
                const row = Math.min(CAM_GRID_SIZE - 1, Math.floor(Math.max(0, y - 1) * CAM_GRID_SIZE / 26));
                const col = Math.min(CAM_GRID_SIZE - 1, Math.floor(Math.max(0, x - 1) * CAM_GRID_SIZE / 26));
                const evidence = x > 0 && x < 27 && y > 0 && y < 27 ? cam[row * CAM_GRID_SIZE + col] : 0;
                const level = Math.sqrt(Math.min(1, evidence / camScale));
                return <span key={position} style={{ backgroundColor: level < .12 ? 'transparent' : `rgba(255, 105, 24, ${(level * .72).toFixed(3)})` }} />;
              })}
            </div>}
          </div>
        </div>
        {loadingError && <Typography variant="bodySmall" tone="danger">图像加载失败</Typography>}
        <Typography as="p" variant="body" tone="warning" className="vfl-learn-heat-note">橙色：支持当前预测的区域</Typography>
      </section>

      <span className="vfl-learn-flow-arrow" aria-hidden="true">→</span>

      <section className="vfl-learn-panel vfl-learn-kernel-panel" aria-label="正在学习的卷积核">
        <div className="vfl-learn-panel-head"><Typography as="h2" variant="h3" tone="accent">卷积核权重</Typography></div>
        <div className="vfl-learn-kernel-content">
          <MathFormulaBlock className={`vfl-learn-kernel-formula ${busy ? 'is-updated' : ''}`} ariaLabel="当前三乘三卷积核的九个可训练权重">
            <div className="vfl-learn-weight-grid">
              {model.kernel.map((weight, index) => <div key={`${index}-${weight}`} style={{ backgroundColor: kernelColor(weight) }}>
                <Typography as="span" variant="body" tone={weight >= 0 ? 'warning' : 'accent'}>{weight.toFixed(2)}</Typography>
              </div>)}
            </div>
          </MathFormulaBlock>
          <div className="vfl-learn-update">
            <Typography as="p" variant="body" tone="accent">
              {lastUpdate === null ? '等待学习' : `权重变化 ${lastUpdate < .001 ? lastUpdate.toExponential(1) : lastUpdate.toFixed(3)}`}
            </Typography>
          </div>
        </div>
      </section>

      <span className="vfl-learn-flow-arrow" aria-hidden="true">→</span>

      <section className="vfl-learn-panel" aria-label="预测与真实值">
        <div className="vfl-learn-panel-head"><Typography as="h2" variant="h3" tone="accent">预测与真实值</Typography></div>
        <div className="vfl-learn-comparison" aria-live="polite">
          <div><Typography variant="body" tone="muted">预测值</Typography><Typography variant="h1" tone={prediction ? (isCorrect ? 'success' : 'danger') : 'muted'}>{prediction ? DIGITS[prediction.label].value : '—'}</Typography></div>
          <div><Typography variant="body" tone="muted">真实值</Typography><Typography variant="h1" tone="success">{sample ? DIGITS[sample.label].value : '—'}</Typography></div>
        </div>
        <Typography variant="bodySmall" tone={labelError ? "danger" : "accent"} className="vfl-learn-choice-title" role="status">{labelError ? "标签不符，请重新选择" : "标注这个数字"}</Typography>
        <div className="vfl-learn-choices">
          {DIGITS.map((digit, label) => <Button key={`${digit.value}-${rejectedLabel === label ? rejectionAttempt : 0}`} className={rejectedLabel === label ? "vfl-learn-label-rejected" : undefined} disabled={busy || !images} onClick={() => learnStep(label)} aria-label={`将当前数字标注为 ${digit.value}`}><Typography as="span" variant="h3" tone="inherit">{digit.value}</Typography></Button>)}
        </div>

      </section>
    </div>

    <div className="vfl-learn-takeaway">
      <Typography as="strong" variant="h3" tone="warning">标注 → 学习</Typography>
      <Typography as="p" variant="body" tone="accent">观察：学习后，网络是否更关注数字笔画？</Typography>
    </div>
  </ContentBlock>;
}

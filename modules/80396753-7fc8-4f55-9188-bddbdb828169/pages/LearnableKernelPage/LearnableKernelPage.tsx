import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, Typography } from "@shuku/course-style/react";
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
      image.src = moduleAssetUrl(`mnist/${digit.file}`);
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

  return <ContentBlock shuku-edit-id="e-14d3e790-2792-4cd8-9627-d9fb733ce0b7"
    className="vfl-learn-page"
    headingLevel={1}
    title="可学习卷积核"
    subtitle="为含噪数字标注，观察网络关注哪些区域。"
  >
    <div shuku-edit-id="e-189a8612-b539-43df-973d-5b4c2c15d1c2" className="vfl-learn-flow">
      <section shuku-edit-id="e-48c5a407-8514-48a8-b936-35315497e01c" className="vfl-learn-panel" aria-label="输入图像与网络关注区域">
        <div shuku-edit-id="e-c7617554-f0a4-4f70-9e8f-a2675e2ee37a" className="vfl-learn-panel-head"><Typography shuku-edit-id="e-c387fcc0-b6f6-46a1-b25d-1232f0790992" as="h2" variant="h3" tone="accent">网络关注区域</Typography></div>
        <div shuku-edit-id="e-e119312b-2913-4c39-a68d-50f305d07356" className="vfl-learn-image-area">
          <div shuku-edit-id="e-b671ef1e-65d3-455d-b5fc-78fd1b0b942f" className="vfl-learn-image-stack" role="img" aria-label={sample ? `MNIST 数字 ${DIGITS[sample.label].value} 与网络关注区域叠加` : '正在读取 MNIST 样本'}>
            <canvas shuku-edit-id="e-6dd10cfb-efa6-4fac-8050-0f06a0cdd28d" ref={canvasRef} width={IMAGE_SIZE} height={IMAGE_SIZE} />
            {prediction && <div shuku-edit-id="e-f8891293-5125-42f9-8740-0bf79b9773a2" className="vfl-learn-response-grid" aria-hidden="true">
              {Array.from({ length: IMAGE_SIZE * IMAGE_SIZE }, (_, position) => {
                const x = position % IMAGE_SIZE;
                const y = Math.floor(position / IMAGE_SIZE);
                const row = Math.min(CAM_GRID_SIZE - 1, Math.floor(Math.max(0, y - 1) * CAM_GRID_SIZE / 26));
                const col = Math.min(CAM_GRID_SIZE - 1, Math.floor(Math.max(0, x - 1) * CAM_GRID_SIZE / 26));
                const evidence = x > 0 && x < 27 && y > 0 && y < 27 ? cam[row * CAM_GRID_SIZE + col] : 0;
                const level = Math.sqrt(Math.min(1, evidence / camScale));
                return <span shuku-edit-id="e-c1d092cf-8c2e-4fb6-89eb-7e144702e1c6" key={position} style={{ backgroundColor: level < .12 ? 'transparent' : `rgba(255, 105, 24, ${(level * .72).toFixed(3)})` }} />;
              })}
            </div>}
          </div>
        </div>
        {loadingError && <Typography shuku-edit-id="e-af543ef3-5b59-442b-b133-d0e8f69bb477" variant="bodySmall" tone="danger">图像加载失败</Typography>}
        <Typography shuku-edit-id="e-2344a5f9-e934-4b8a-b2e8-c11535f97f06" as="p" variant="body" tone="warning" className="vfl-learn-heat-note">橙色：支持当前预测的区域</Typography>
      </section>

      <span shuku-edit-id="e-3bb6bfbd-2595-48e4-aff7-403db32d53df" className="vfl-learn-flow-arrow" aria-hidden="true">→</span>

      <section shuku-edit-id="e-1f87ca00-f912-48e0-a585-a73ba3c58c58" className="vfl-learn-panel vfl-learn-kernel-panel" aria-label="正在学习的卷积核">
        <div shuku-edit-id="e-c155d0a7-cba9-4e8c-b1e7-9059e70aa92a" className="vfl-learn-panel-head"><Typography shuku-edit-id="e-8a6fe88a-5ec5-4584-ae6d-86e30d0a1111" as="h2" variant="h3" tone="accent">卷积核权重</Typography></div>
        <div shuku-edit-id="e-e42b6b8b-2ea3-4d1f-a1ad-c839cc75111e" className="vfl-learn-kernel-content">
          <MathFormulaBlock className={`vfl-learn-kernel-formula ${busy ? 'is-updated' : ''}`} ariaLabel="当前三乘三卷积核的九个可训练权重">
            <div shuku-edit-id="e-2a25b866-c96e-4cb2-a3bc-33d2b6bd1d98" className="vfl-learn-weight-grid">
              {model.kernel.map((weight, index) => <div shuku-edit-id="e-413b68f0-6341-4f22-a3bc-5b5961203d23" key={`${index}-${weight}`} style={{ backgroundColor: kernelColor(weight) }}>
                <Typography shuku-edit-id="e-20824d06-b082-4217-a858-7cc3e22d73ee" as="span" variant="body" tone={weight >= 0 ? 'warning' : 'accent'}>{weight.toFixed(2)}</Typography>
              </div>)}
            </div>
          </MathFormulaBlock>
          <div shuku-edit-id="e-351d7601-6d02-48d2-9848-09a533700334" className="vfl-learn-update">
            <Typography shuku-edit-id="e-f1c90f4d-ea59-4902-ac07-d85c4fde372a" as="p" variant="body" tone="accent">
              {lastUpdate === null ? '等待学习' : `权重变化 ${lastUpdate < .001 ? lastUpdate.toExponential(1) : lastUpdate.toFixed(3)}`}
            </Typography>
          </div>
        </div>
      </section>

      <span shuku-edit-id="e-e48d293f-bf33-4609-a8bd-8349915cd783" className="vfl-learn-flow-arrow" aria-hidden="true">→</span>

      <section shuku-edit-id="e-490b8f3a-ac77-4600-be74-aea5dd70f7fc" className="vfl-learn-panel" aria-label="预测与真实值">
        <div shuku-edit-id="e-9a7a4551-2d4b-48f6-b814-f0a6bb24de1c" className="vfl-learn-panel-head"><Typography shuku-edit-id="e-8f5ecbe4-4f62-4604-923f-f9720027570c" as="h2" variant="h3" tone="accent">预测与真实值</Typography></div>
        <div shuku-edit-id="e-2b63d647-1164-4175-8f89-11dedaec9e95" className="vfl-learn-comparison" aria-live="polite">
          <div shuku-edit-id="e-db7939ad-06d2-4d10-a868-e6eb445ecb4a"><Typography shuku-edit-id="e-f605121c-e415-40aa-b2c3-b83f7cb34f61" variant="body" tone="muted">预测值</Typography><Typography shuku-edit-id="e-a1e9eb51-6f8c-4bd3-89b1-6df67b825ffd" variant="h1" tone={prediction ? (isCorrect ? 'success' : 'danger') : 'muted'}>{prediction ? DIGITS[prediction.label].value : '—'}</Typography></div>
          <div shuku-edit-id="e-f049d47b-53c0-4eb6-98d1-40abdcecd42c"><Typography shuku-edit-id="e-8fae3995-e4d4-4645-933e-ca313e286911" variant="body" tone="muted">真实值</Typography><Typography shuku-edit-id="e-19c0a7b8-30b2-477c-bcae-93ee8bd6cd66" variant="h1" tone="success">{sample ? DIGITS[sample.label].value : '—'}</Typography></div>
        </div>
        <Typography shuku-edit-id="e-fa019a5d-b2cf-4047-ae40-8abd05541025" variant="bodySmall" tone={labelError ? "danger" : "accent"} className="vfl-learn-choice-title" role="status">{labelError ? "标签不符，请重新选择" : "标注这个数字"}</Typography>
        <div shuku-edit-id="e-d0325909-f03f-4afd-92f4-e43ee2f7381e" className="vfl-learn-choices">
          {DIGITS.map((digit, label) => <Button key={`${digit.value}-${rejectedLabel === label ? rejectionAttempt : 0}`} className={rejectedLabel === label ? "vfl-learn-label-rejected" : undefined} disabled={busy || !images} onClick={() => learnStep(label)} aria-label={`将当前数字标注为 ${digit.value}`}><Typography shuku-edit-id="e-e16aa3d6-cd50-466c-8dab-59c9c9f4671a" as="span" variant="h3" tone="inherit">{digit.value}</Typography></Button>)}
        </div>

      </section>
    </div>

    <div shuku-edit-id="e-eb1c5ed8-17ea-42d8-9352-b56a1270dbef" className="vfl-learn-takeaway">
      <Typography shuku-edit-id="e-f4778388-980f-4ed0-81ba-15c8b35d3512" as="strong" variant="h3" tone="warning">标注 → 学习</Typography>
      <Typography shuku-edit-id="e-42c83120-799a-4e10-9b30-c8e697ca7aa2" as="p" variant="body" tone="accent">观察：学习后，网络是否更关注数字笔画？</Typography>
    </div>
  </ContentBlock>;
}

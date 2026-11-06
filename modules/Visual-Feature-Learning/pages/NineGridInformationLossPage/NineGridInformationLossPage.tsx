import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ContentBlock, Typography } from '../../../shared/react';
import { NINE_GRID_EDGES, NINE_GRID_IMAGE_SIZE, NINE_GRID_IMAGE_URL, nineGridCounts, readNineGridPixels } from '../../services/nineGridDigit';
import { ManualClassifierNetwork } from '../../components/ManualClassifierNetwork';
import { getLatestManualClassifier, subscribeManualClassifier, predictManualDigit, trainManualClassifier, type ManualTrainingResult } from '../../services/manualFeatureClassifier';
import './NineGridInformationLossPage.css';
import { MNIST_INK_THRESHOLD } from '../../services/mnistFeatures';

type Comparison = { original: number[]; rearranged: number[]; rearrangedUrl: string };

function rearrangeWithinRegions(image: HTMLImageElement, seed: number): Comparison | null {
  const canvas = document.createElement('canvas');
  canvas.width = NINE_GRID_IMAGE_SIZE;
  canvas.height = NINE_GRID_IMAGE_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const pixels = readNineGridPixels(image);
  if (!context || !pixels) return null;
  context.drawImage(image, 0, 0, NINE_GRID_IMAGE_SIZE, NINE_GRID_IMAGE_SIZE);
  const source = context.getImageData(0, 0, NINE_GRID_IMAGE_SIZE, NINE_GRID_IMAGE_SIZE);
  const result = context.createImageData(NINE_GRID_IMAGE_SIZE, NINE_GRID_IMAGE_SIZE);
  result.data.set(source.data);
  let randomState = (seed * 2654435761) >>> 0;
  const random = () => {
    randomState ^= randomState << 13;
    randomState ^= randomState >>> 17;
    randomState ^= randomState << 5;
    return (randomState >>> 0) / 4294967296;
  };

  for (let region = 0; region < 9; region += 1) {
    const row = Math.floor(region / 3);
    const col = region % 3;
    const positions: number[] = [];
    for (let y = NINE_GRID_EDGES[row]; y < NINE_GRID_EDGES[row + 1]; y += 1) {
      for (let x = NINE_GRID_EDGES[col]; x < NINE_GRID_EDGES[col + 1]; x += 1) {
        positions.push(y * NINE_GRID_IMAGE_SIZE + x);
      }
    }
    const shuffled = [...positions];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const partner = Math.floor(random() * (index + 1));
      [shuffled[index], shuffled[partner]] = [shuffled[partner], shuffled[index]];
    }
    positions.forEach((destination, index) => {
      const origin = shuffled[index];
      for (let channel = 0; channel < 4; channel += 1) {
        result.data[destination * 4 + channel] = source.data[origin * 4 + channel];
      }
    });
  }
  context.putImageData(result, 0, 0);
  const rearrangedPixels = Array.from({ length: NINE_GRID_IMAGE_SIZE * NINE_GRID_IMAGE_SIZE }, (_, index) => {
    const offset = index * 4;
    return (result.data[offset] + result.data[offset + 1] + result.data[offset + 2]) / 3 >= MNIST_INK_THRESHOLD;
  });
  return {
    original: nineGridCounts(pixels),
    rearranged: nineGridCounts(rearrangedPixels),
    rearrangedUrl: canvas.toDataURL('image/png'),
  };
}

export function NineGridInformationLossPage() {
  const [seed, setSeed] = useState(0);
  const [motion, setMotion] = useState(0);
  const [outputReady, setOutputReady] = useState(true);
  const sourceImage = useRef<HTMLImageElement | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [model, setModel] = useState<ManualTrainingResult | null>(getLatestManualClassifier);
  const [error, setError] = useState('');
  useEffect(() => subscribeManualClassifier(setModel), []);
  useEffect(() => {
    const abort = new AbortController();
    if (!model) trainManualClassifier(0, abort.signal, () => {}).then(({ result }) => {
      if (!abort.signal.aborted) setModel(result);
    }).catch(failure => { if (!abort.signal.aborted) setError(failure instanceof Error ? failure.message : '分类器加载失败'); });
    return () => abort.abort();
  }, [model]);
  useEffect(() => {
    let active = true;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (!active) return;
      try { sourceImage.current = image; setComparison(rearrangeWithinRegions(image, 1)); }
      catch { setError('无法读取图像，请检查图片跨域配置。'); }
    };
    image.onerror = () => { if (active) setError('图像加载失败，请刷新重试。'); };
    image.src = NINE_GRID_IMAGE_URL;
    return () => { active = false; image.onload = null; image.onerror = null; };
  }, []);
  const switchImage = () => {
    if (!sourceImage.current) return;
    if (seed === 0) {
      const randomSeed = Math.floor(Math.random() * 0x7ffffffe) + 1;
      const next = rearrangeWithinRegions(sourceImage.current, randomSeed);
      if (!next) return;
      setComparison(next);
      setSeed(randomSeed);
    } else setSeed(0);
    setOutputReady(false);
    setMotion(current => current + 1);
  };
  const originalPrediction = useMemo(() => model && comparison ? predictManualDigit(comparison.original, model.classifier) : null, [model, comparison]);
  const prediction = useMemo(() => model && comparison ? predictManualDigit(seed === 0 ? comparison.original : comparison.rearranged, model.classifier) : null, [model, comparison, seed]);
  const same = prediction !== null && originalPrediction !== null && prediction.every((value, i) => value === originalPrediction[i]);
  const counts = seed === 0 ? comparison?.original : comparison?.rearranged;
  return <ContentBlock className="vfl-loss-page" headingLevel={1} title="九宫格特征的信息损失"
    subtitle="分类器依据九项区域计数进行预测；区域内部的笔画排列未被保留。">
    <div key={motion} className={`vfl-loss-flow${motion ? ' vfl-loss-flow--animate' : ''}`}>
      <section className="vfl-loss-stage" aria-label="可切换的输入图像">
        <Typography as="h2" variant="h3" tone="accent">输入图像</Typography>
        <div className="vfl-loss-image">
          <img src={seed === 0 ? NINE_GRID_IMAGE_URL : comparison?.rearrangedUrl ?? NINE_GRID_IMAGE_URL} alt={seed === 0 ? '原始 MNIST 数字 2' : '数字 2 的随机区域内像素重排'} />
          <div className="vfl-loss-grid" aria-hidden="true">{Array.from({length:9},(_,i)=><span key={i}/>)}</div>
        </div>
        <Typography variant="body" tone="muted">{seed === 0 ? '原始数字 2' : '区域内像素重排'}</Typography>
        <Button variant="primary" disabled={!comparison} onClick={switchImage}><Typography as="span" variant="body" tone="inherit">切换</Typography></Button>
      </section>
      <span className="vfl-loss-arrow" aria-hidden="true"/>
      <section className="vfl-loss-stage vfl-loss-features" aria-label="保持相同的九维特征">
        <Typography as="h2" variant="h3" tone="accent">九维特征</Typography>
        <div className="vfl-loss-vector">{Array.from({length:9},(_,i)=><Typography as="span" variant="bodySmall" tone="accent" key={i}>{counts?.[i] ?? '—'}</Typography>)}</div>
        <Typography variant="bodySmall" tone="warning">区域计数不变</Typography>
      </section>
      <span className="vfl-loss-arrow" aria-hidden="true"/>
      <section className="vfl-loss-stage vfl-loss-classifier" aria-label="上一页的同一个全连接分类器">
        <Typography as="h2" variant="h3" tone="accent">同一个分类器</Typography>
        <ManualClassifierNetwork/>
        <div className="vfl-loss-layers"><Typography variant="bodySmall" tone="accent">输入 9</Typography><Typography variant="bodySmall" tone="warning">隐藏 32</Typography><Typography variant="bodySmall" tone="accent">输出 10</Typography></div>
        <Typography variant="bodySmall" tone="muted">权重保持不变</Typography>
      </section>
      <span className="vfl-loss-arrow" aria-hidden="true"/>
      <section className={`vfl-loss-stage vfl-loss-output${outputReady ? ' vfl-loss-output--ready' : ''}`} aria-label="十类预测概率" onAnimationEnd={event => { if (event.target === event.currentTarget && event.animationName === 'vfl-loss-stage-pulse') setOutputReady(true); }}>
        <Typography as="h2" variant="h3" tone="accent">Softmax 概率</Typography>
        <div className="vfl-loss-probabilities">{Array.from({length:10},(_,digit)=><div key={digit}><Typography as="span" variant="bodySmall" tone="accent">{digit}</Typography><span className="vfl-loss-track"><span style={{width:`${(outputReady ? prediction?.[digit] ?? 0 : 0)*100}%`}}/></span><Typography as="span" variant="bodySmall" tone="muted">{outputReady && prediction ? `${(prediction[digit]*100).toFixed(1)}%` : '—'}</Typography></div>)}</div>
        <Typography variant="body" tone="accent">{outputReady && prediction ? `预测数字：${prediction.indexOf(Math.max(...prediction))}` : error ? '分类器暂不可用' : !model ? '正在加载分类器…' : outputReady ? '正在计算…' : '等待信号到达'}</Typography>
      </section>
    </div>
    <div className="vfl-loss-conclusion" aria-live="polite"><Typography as="h2" variant="body" tone="accent">{motion === 0 ? '观察：区域内像素重排后，分类器能否区分两种图像？' : !outputReady ? '保持区域计数与网络权重不变，比较两种图像的预测结果。' : same ? '特征相同，预测相同：训练分类器无法恢复已丢失的笔画结构。' : '正在计算预测结果…'}</Typography><Typography variant="bodySmall" tone="muted">要描述笔画的局部结构，下一步将使用固定卷积核提取特征。</Typography></div>
    {error && <Typography variant="bodySmall" tone="muted" role="alert">{error}</Typography>}
  </ContentBlock>;
}

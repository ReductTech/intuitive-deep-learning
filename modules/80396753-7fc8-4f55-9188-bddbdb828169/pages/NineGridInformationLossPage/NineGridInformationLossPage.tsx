import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
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
  return <ContentBlock shuku-edit-id="e-c182d2df-4df0-4dd3-bf7b-f2f5e85c8b3a" className="vfl-loss-page" headingLevel={1} title="九宫格特征的信息损失"
    subtitle="分类器依据九项区域计数进行预测；区域内部的笔画排列未被保留。">
    <div shuku-edit-id="e-f4e87c42-92cb-46db-bbc7-0d48645fee98" key={motion} className={`vfl-loss-flow${motion ? ' vfl-loss-flow--animate' : ''}`}>
      <section shuku-edit-id="e-401536ad-d60b-440e-90ec-3ae08f1d4971" className="vfl-loss-stage" aria-label="可切换的输入图像">
        <Typography shuku-edit-id="e-a4435f52-0db3-490f-8b82-d14079f2f116" as="h2" variant="h3" tone="accent">输入图像</Typography>
        <div shuku-edit-id="e-61cea3ab-46a7-4eaf-b18e-9a811f32c912" className="vfl-loss-image">
          <img shuku-edit-id="e-76ce10d9-221c-4c0f-a0da-1af15599e096" src={seed === 0 ? NINE_GRID_IMAGE_URL : comparison?.rearrangedUrl ?? NINE_GRID_IMAGE_URL} alt={seed === 0 ? '原始 MNIST 数字 2' : '数字 2 的随机区域内像素重排'} />
          <div shuku-edit-id="e-86f04071-db54-4ac7-b75f-a3a1aa08b254" className="vfl-loss-grid" aria-hidden="true">{Array.from({length:9},(_,i)=><span shuku-edit-id="e-d73e12a7-a639-4952-a124-ea672d5a79a1" key={i}/>)}</div>
        </div>
        <Typography shuku-edit-id="e-c673072f-7a87-40b0-9a42-3e2d2425a7a4" variant="body" tone="muted">{seed === 0 ? '原始数字 2' : '区域内像素重排'}</Typography>
        <Button variant="primary" disabled={!comparison} onClick={switchImage}><Typography shuku-edit-id="e-4241f9b2-a7c8-4b94-b0ff-bb67690d4d6f" as="span" variant="body" tone="inherit">切换</Typography></Button>
      </section>
      <span shuku-edit-id="e-8a5e1d2f-cd1a-48fc-b48c-576fb8c95a19" className="vfl-loss-arrow" aria-hidden="true"/>
      <section shuku-edit-id="e-1815f1f1-7ae3-4fa9-bcc2-c53d609a6b4c" className="vfl-loss-stage vfl-loss-features" aria-label="保持相同的九维特征">
        <Typography shuku-edit-id="e-89241e0c-1ef9-4d64-bbe1-28da40a01d08" as="h2" variant="h3" tone="accent">九维特征</Typography>
        <div shuku-edit-id="e-31f4a338-f7ff-4e47-bdc4-8f4fa271c978" className="vfl-loss-vector">{Array.from({length:9},(_,i)=><Typography shuku-edit-id="e-d142f6b4-867a-4565-8d14-a552cd66056e" as="span" variant="bodySmall" tone="accent" key={i}>{counts?.[i] ?? '—'}</Typography>)}</div>
        <Typography shuku-edit-id="e-70926a62-c8d0-447b-9846-6923d81d6e9e" variant="bodySmall" tone="warning">区域计数不变</Typography>
      </section>
      <span shuku-edit-id="e-35fe5e62-15d1-45c6-aec1-230c54d40dc1" className="vfl-loss-arrow" aria-hidden="true"/>
      <section shuku-edit-id="e-e3d69f20-721d-4f61-ae86-7a1fdbca96ef" className="vfl-loss-stage vfl-loss-classifier" aria-label="上一页的同一个全连接分类器">
        <Typography shuku-edit-id="e-0af9630b-df57-4dd1-a6a5-16a87291e8cb" as="h2" variant="h3" tone="accent">同一个分类器</Typography>
        <ManualClassifierNetwork/>
        <div shuku-edit-id="e-37b306f6-4867-44ec-83ad-36c1cf9bc993" className="vfl-loss-layers"><Typography shuku-edit-id="e-50bc49ef-5f1e-4592-843c-dc568cdb0f62" variant="bodySmall" tone="accent">输入 9</Typography><Typography shuku-edit-id="e-c821ff5b-bdb0-418a-881f-28d533f167b3" variant="bodySmall" tone="warning">隐藏 32</Typography><Typography shuku-edit-id="e-8152b4f3-9524-43d0-b21b-8524aee5ce72" variant="bodySmall" tone="accent">输出 10</Typography></div>
        <Typography shuku-edit-id="e-945318c1-4aba-4968-97f7-62d355a6ce1f" variant="bodySmall" tone="muted">权重保持不变</Typography>
      </section>
      <span shuku-edit-id="e-67be9aaf-e468-47c9-9eb3-663392b7ca8a" className="vfl-loss-arrow" aria-hidden="true"/>
      <section shuku-edit-id="e-cabe67e7-04b1-43a8-8f4b-7ed79706b57f" className={`vfl-loss-stage vfl-loss-output${outputReady ? ' vfl-loss-output--ready' : ''}`} aria-label="十类预测概率" onAnimationEnd={event => { if (event.target === event.currentTarget && event.animationName === 'vfl-loss-stage-pulse') setOutputReady(true); }}>
        <Typography shuku-edit-id="e-1d23ff06-aa4b-44a8-a03a-8a7f98273df1" as="h2" variant="h3" tone="accent">Softmax 概率</Typography>
        <div shuku-edit-id="e-cccd39d0-43eb-42bd-910e-7e904dae415f" className="vfl-loss-probabilities">{Array.from({length:10},(_,digit)=><div shuku-edit-id="e-c184c56c-a172-41a4-bf6d-e580799cba42" key={digit}><Typography shuku-edit-id="e-ddccbaee-edd3-4778-bb41-6bd31e109900" as="span" variant="bodySmall" tone="accent">{digit}</Typography><span shuku-edit-id="e-519239a1-e5b8-4f8d-bd6d-57c82574534c" className="vfl-loss-track"><span shuku-edit-id="e-0c156bba-cf72-46d6-a4b1-56bdd52538c3" style={{width:`${(outputReady ? prediction?.[digit] ?? 0 : 0)*100}%`}}/></span><Typography shuku-edit-id="e-4a8760b0-fdf7-47e3-936b-4f26d4e6b1aa" as="span" variant="bodySmall" tone="muted">{outputReady && prediction ? `${(prediction[digit]*100).toFixed(1)}%` : '—'}</Typography></div>)}</div>
        <Typography shuku-edit-id="e-1d84f63f-626b-4bf5-8e15-7c5caa6f793a" variant="body" tone="accent">{outputReady && prediction ? `预测数字：${prediction.indexOf(Math.max(...prediction))}` : error ? '分类器暂不可用' : !model ? '正在加载分类器…' : outputReady ? '正在计算…' : '等待信号到达'}</Typography>
      </section>
    </div>
    <div shuku-edit-id="e-f749b828-a02d-4d68-9636-d0c50c6aec5e" className="vfl-loss-conclusion" aria-live="polite"><Typography shuku-edit-id="e-bfdad105-5e51-4218-b7cc-da1585f5c1b3" as="h2" variant="body" tone="accent">{motion === 0 ? '观察：区域内像素重排后，分类器能否区分两种图像？' : !outputReady ? '保持区域计数与网络权重不变，比较两种图像的预测结果。' : same ? '特征相同，预测相同：训练分类器无法恢复已丢失的笔画结构。' : '正在计算预测结果…'}</Typography><Typography shuku-edit-id="e-16f31009-8d44-4606-ba5a-45240a7d4318" variant="bodySmall" tone="muted">要描述笔画的局部结构，下一步将使用固定卷积核提取特征。</Typography></div>
    {error && <Typography shuku-edit-id="e-4ad7ae8a-dab2-4f97-bd7d-451bebd72529" variant="bodySmall" tone="muted" role="alert">{error}</Typography>}
  </ContentBlock>;
}

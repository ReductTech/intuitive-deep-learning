import { useEffect, useState } from 'react';
import { Button, ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import './ManualFeatureClassifierPage.css';
import { nineGridCounts, readNineGridPixels } from '../../services/nineGridDigit';

const samples = [
  { label: 6, file: 'mnist/6/60011.png' },
  { label: 2, file: 'mnist/2/60035.png' },
  { label: 3, file: 'mnist/3/60018.png' },
] as const;
const assetId = '80396753-7fc8-4f55-9188-bddbdb828169';
const inputY = Array.from({ length: 9 }, (_, index) => 36 + index * 43);
const hiddenY = [52, 98, 144, 276, 322, 368];
const outputY = Array.from({ length: 10 }, (_, index) => 27 + index * 39);

function NetworkDiagram() {
  return <svg viewBox="0 0 400 414" className="vfl-manual-network-svg" role="img" aria-label="九个输入、三十二个隐藏神经元与十个输出组成的全连接网络结构示意">
    <g stroke="#a9bfdf" strokeWidth="1" opacity=".72">
      {inputY.flatMap((from, input) => hiddenY.map((to, hidden) => <line key={`i-${input}-${hidden}`} x1="46" y1={from} x2="200" y2={to} />))}
      {hiddenY.flatMap((from, hidden) => outputY.map((to, output) => <line key={`o-${hidden}-${output}`} x1="200" y1={from} x2="354" y2={to} />))}
    </g>
    {inputY.map((y, index) => <circle key={`input-${index}`} cx="46" cy={y} r="13" fill="#eaf3ff" stroke="#2769c4" strokeWidth="2.4" />)}
    {hiddenY.map((y, index) => <circle key={`hidden-${index}`} cx="200" cy={y} r="13" fill="#fff4e6" stroke="#e79026" strokeWidth="2.4" />)}
    {outputY.map((y, index) => <circle key={`output-${index}`} cx="354" cy={y} r="12" fill="#fff0f1" stroke="#df5661" strokeWidth="2.4" />)}
    <circle cx="200" cy="185" r="2.3" fill="#173a6a" />
    <circle cx="200" cy="196" r="2.3" fill="#173a6a" />
    <circle cx="200" cy="207" r="2.3" fill="#173a6a" />
  </svg>;
}

export function ManualFeatureClassifierPage() {
  const [sampleIndex, setSampleIndex] = useState(0);
  const [counts, setCounts] = useState<number[] | null>(null);
  const sample = samples[sampleIndex];
  const imageUrl = moduleAssetUrl(assetId, sample.file);

  useEffect(() => {
    let active = true;
    const image = new Image();
    setCounts(null);
    image.onload = () => {
      if (!active) return;
      const pixels = readNineGridPixels(image);
      if (pixels) setCounts(nineGridCounts(pixels));
    };
    image.src = imageUrl;
    return () => { active = false; image.onload = null; };
  }, [imageUrl]);

  return <ContentBlock className="vfl-manual-page" headingLevel={1}
    title="基于人工特征的数字分类"
    subtitle="将九宫格统计值作为输入，由分类器学习特征与数字类别之间的关系。">
    <div className="vfl-manual-toolbar" aria-label="训练与推理状态">
      <Button variant="primary" disabled title="训练功能尚未接入"><span className="vfl-manual-play" aria-hidden="true"/><Typography as="span" variant="body" tone="inherit">开始训练</Typography></Button>
      <div className="vfl-manual-training-state"><span className="vfl-manual-status-dot" aria-hidden="true"/><Typography as="span" variant="body" tone="muted">未训练</Typography></div>
      <div className="vfl-manual-toolbar-metric"><span className="vfl-manual-chart-icon" aria-hidden="true"><i/><i/><i/></span><Typography as="span" variant="body" tone="muted">准确率 —</Typography></div>
      <div className="vfl-manual-toolbar-metric"><svg viewBox="0 0 24 28" aria-hidden="true"><rect x="3" y="2" width="18" height="24" rx="2"/><path d="M7 9h10M7 14h10M7 19h6"/></svg><Typography as="span" variant="body" tone="muted">Epoch 0 / 20</Typography></div>
      <Button disabled title="训练与推理功能尚未接入"><Typography as="span" variant="body" tone="inherit">推理 →</Typography></Button>
    </div>
    <div className="vfl-manual-flow">
      <section className="vfl-manual-stage" aria-label="输入图像和人工特征">
        <div className="vfl-manual-stage-heading"><Typography as="span" variant="h2" tone="inherit" className="vfl-manual-stage-number">1</Typography><Typography as="h2" variant="h2" tone="accent">输入特征</Typography></div>
        <div className="vfl-manual-input-body">
          <div className="vfl-manual-image-column"><Typography variant="bodySmall" tone="muted">3 × 3 区域像素统计</Typography>
            <div className="vfl-manual-image" aria-label={`真实 MNIST 数字 ${sample.label}，带九宫格划分`}>
              <img src={imageUrl} alt={`MNIST 手写数字 ${sample.label}`} />
              <div className="vfl-manual-image-grid" aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <span key={index}/>)}</div>
            </div>
          </div>
          <span className="vfl-manual-arrow vfl-manual-input-arrow" aria-hidden="true"/>
          <div className="vfl-manual-vector"><Typography variant="bodySmall" tone="accent">九维特征向量</Typography><div className="vfl-manual-vector-values">{Array.from({ length: 9 }, (_, index) => <Typography as="span" key={index} variant="bodySmall" tone="accent">{counts?.[index] ?? '—'}</Typography>)}</div></div>
        </div>
        <div className="vfl-manual-input-controls">
          <Button variant="primary" active><Typography as="span" variant="bodySmall" tone="inherit">示例数字</Typography></Button>
          <Button disabled title="手写输入尚未接入"><Typography as="span" variant="bodySmall" tone="inherit">手写输入</Typography></Button>
          <Button onClick={() => setSampleIndex((current) => (current + 1) % samples.length)}><Typography as="span" variant="bodySmall" tone="inherit">↻ 切换样本</Typography></Button>
        </div>
      </section>
      <span className="vfl-manual-arrow vfl-manual-stage-arrow first" aria-hidden="true"/>
      <section className="vfl-manual-stage vfl-manual-classifier" aria-label="全连接分类器结构">
        <div className="vfl-manual-stage-heading"><Typography as="span" variant="h2" tone="inherit" className="vfl-manual-stage-number">2</Typography><Typography as="h2" variant="h2" tone="accent">全连接分类器</Typography></div>
        <div className="vfl-manual-network"><div className="vfl-manual-network-values" aria-label="网络的九维输入">{Array.from({length:9},(_,index)=><Typography as="span" variant="bodySmall" tone="accent" key={index}>{counts?.[index] ?? '—'}</Typography>)}</div><NetworkDiagram/></div>
        <div className="vfl-manual-layers"><Typography as="span" variant="bodySmall" tone="accent">输入 9</Typography><Typography as="span" variant="bodySmall" tone="inherit">隐藏 32</Typography><Typography as="span" variant="bodySmall" tone="inherit">输出 10</Typography></div>
      </section>
      <span className="vfl-manual-arrow vfl-manual-stage-arrow second" aria-hidden="true"/>
      <section className="vfl-manual-stage" aria-label="分类结果占位">
        <div className="vfl-manual-stage-heading"><Typography as="span" variant="h2" tone="inherit" className="vfl-manual-stage-number">3</Typography><Typography as="h2" variant="h2" tone="accent">分类结果</Typography></div>
        <div className="vfl-manual-results" aria-label="类别零至九的概率，尚未训练">{Array.from({length:10},(_,digit)=><div className="vfl-manual-result" key={digit}><Typography as="span" variant="bodySmall" tone="accent">{digit}</Typography><span className="vfl-manual-probability-track" aria-hidden="true"/><Typography as="span" variant="bodySmall" tone="muted">—</Typography></div>)}</div>
        <div className="vfl-manual-result-hint"><Typography as="span" variant="bodySmall" tone="muted">ⓘ 训练后显示概率</Typography></div>
      </section>
    </div>
  </ContentBlock>;
}

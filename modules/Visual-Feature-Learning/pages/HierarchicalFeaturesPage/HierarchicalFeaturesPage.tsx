import { useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography, moduleAssetUrl } from '../../../shared/react';
import manifest from '../../../../assets/80396753-7fc8-4f55-9188-bddbdb828169/feature-hierarchy/mobilenet-v3-small/manifest.json';
import './HierarchicalFeaturesPage.css';

const ASSET_ID = '80396753-7fc8-4f55-9188-bddbdb828169';
const PREFIX = 'feature-hierarchy/mobilenet-v3-small/';
const asset = (path: string) => moduleAssetUrl(ASSET_ID, PREFIX + path);
const NAMES: Record<string, string> = { airplane: '飞机', automobile: '汽车', bird: '鸟', cat: '猫', deer: '鹿', dog: '狗', frog: '青蛙', horse: '马', ship: '船', truck: '卡车' };
const LEVELS = [
  { key: 'deep', symbol: 'h_3', label: '深层特征', heading: '深层：任务相关的表示', lines: ['综合更大范围的结构信息。', '形成与训练任务相关的特征表示。'] },
  { key: 'middle', symbol: 'h_2', label: '中间层特征', heading: '中间层：结构组合', lines: ['将局部特征组合成更复杂的结构。', '通常覆盖更大的图像区域。'] },
  { key: 'shallow', symbol: 'h_1', label: '浅层特征', heading: '浅层：局部细节', lines: ['常对边缘、方向和局部纹理响应。', '通常关注较小的图像区域。'] },
] as const;

export function HierarchicalFeaturesPage() {
  const [sampleId, setSampleId] = useState('mnist-5-0');
  const [failedSample, setFailedSample] = useState<string | null>(null);
  const sample = manifest.samples.find(item => item.id === sampleId)!;
  const name = sample.dataset === 'mnist' ? `数字 ${sample.label}` : NAMES[sample.label];
  function select(id: string) { setSampleId(id); setFailedSample(null); }
  return <ContentBlock className="vfl-hierarchy-page" headingLevel={1} title="从浅层特征到深层特征" subtitle="上一层的输出，成为下一层的输入；简单特征逐层组合。">
    <div className="vfl-hierarchy-scene" aria-label="浅层、中间层与深层特征的层次关系">
      <div className="vfl-hierarchy-depth"><span aria-hidden="true" /><Typography variant="bodySmall" tone="accent">特征逐层组合</Typography></div>
      {LEVELS.map(level => <section className={`vfl-hierarchy-level vfl-hierarchy-${level.key}`} key={level.key}>
        <div className="vfl-hierarchy-tier-area">
          <div className="vfl-hierarchy-tier"><Typography variant="h3" tone="inherit">{level.label}</Typography><MathFormulaBlock><MathFormulaStatic latex={level.symbol} /></MathFormulaBlock></div>
          <span className="vfl-hierarchy-leader" aria-hidden="true" />
          {level.key !== 'shallow' && <span className="vfl-hierarchy-up" aria-hidden="true">↑</span>}
        </div>
        <div className="vfl-hierarchy-responses" aria-label={`${name}的${level.label}`}>
          {sample.features[level.key].map(feature => <figure key={feature.channel}>
            <img key={`${sampleId}-${level.key}-${feature.channel}`} src={asset(feature.image)} alt={`${name}，${level.label}，通道 ${feature.channel}`} onError={() => setFailedSample(sampleId)} />
            <Typography as="figcaption" variant="bodySmall" tone="muted">通道 {feature.channel}</Typography>
          </figure>)}
        </div>
        <div className="vfl-hierarchy-description"><Typography variant="h3" tone="accent">{level.heading}</Typography>{level.lines.map(line => <Typography variant="bodySmall" key={line}>{line}</Typography>)}</div>
      </section>)}
    </div>
    <div className="vfl-hierarchy-input-row">
      <div className="vfl-hierarchy-input"><img src={asset(sample.modelInput)} alt={`当前输入：${name}`} onError={() => setFailedSample(sampleId)} /><div><Typography variant="bodySmall" tone="muted">输入图像</Typography><Typography variant="h3" tone="accent">{name}</Typography><MathFormulaBlock><MathFormulaStatic latex="x" /></MathFormulaBlock></div></div>
      <div className="vfl-hierarchy-choices" role="group" aria-label="切换输入图像">
        <div><Typography variant="bodySmall" tone="muted">手写数字</Typography><div>{manifest.samples.filter(item => item.dataset === 'mnist').map(item => <Button key={item.id} active={sampleId === item.id} aria-pressed={sampleId === item.id} aria-label={`查看数字 ${item.label}`} onClick={() => select(item.id)}>{item.label}</Button>)}</div></div>
        <div><Typography variant="bodySmall" tone="muted">CIFAR-10</Typography><div>{manifest.samples.filter(item => item.dataset === 'cifar10').map(item => <Button key={item.id} active={sampleId === item.id} aria-pressed={sampleId === item.id} aria-label={`查看${NAMES[item.label]}`} onClick={() => select(item.id)}>{NAMES[item.label]}</Button>)}</div></div>
      </div>
    </div>
    <Typography className="vfl-hierarchy-note" variant="bodySmall" tone={failedSample === sampleId ? 'danger' : 'muted'} aria-live="polite">{failedSample === sampleId ? '图片加载失败，请刷新页面重试。' : '真实响应 · MobileNet V3 Small（ImageNet 预训练）· 同层固定通道与灰度范围。'}</Typography>
    <div className="vfl-hierarchy-composition"><div><Typography variant="h3" tone="accent">函数复合：把各层首尾相连</Typography><Typography variant="bodySmall" tone="muted">每一阶段继续处理前一阶段的特征。</Typography></div><div><MathFormulaBlock><MathFormulaStatic latex={'h_3=f_3\\bigl(f_2(f_1(x))\\bigr)'} /></MathFormulaBlock><Typography variant="bodySmall" tone="muted">这里的三个函数分别概括浅层、中间层、深层的处理过程。</Typography></div></div>
  </ContentBlock>;
}

import { useState, type CSSProperties } from 'react';
import { Button, ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import manifest from '../../../../assets/80396753-7fc8-4f55-9188-bddbdb828169/feature-hierarchy/mobilenet-v3-small/manifest.json';
import lessonChannels from '../../../../assets/80396753-7fc8-4f55-9188-bddbdb828169/feature-hierarchy/mobilenet-v3-small/lesson-channels.json';
import './HierarchicalFeaturesPage.css';

const ASSET_ID = '80396753-7fc8-4f55-9188-bddbdb828169';
const PREFIX = 'feature-hierarchy/mobilenet-v3-small/';
const asset = (path: string) => moduleAssetUrl(ASSET_ID, PREFIX + path);
const LEVELS = [
  { key: 'deep', label: '深层', heading: '高层表示', note: '综合更大范围的信息' },
  { key: 'middle', label: '中间层', heading: '结构组合', note: '组合笔画与弯曲结构' },
  { key: 'shallow', label: '浅层', heading: '局部细节', note: '提取边缘与方向' },
] as const;

export function HierarchicalFeaturesPage() {
  const [sampleId, setSampleId] = useState('mnist-5-0');
  const [failedSample, setFailedSample] = useState<string | null>(null);
  const sample = manifest.samples.find(item => item.id === sampleId) ?? manifest.samples.find(item => item.dataset === 'mnist')!;
  const name = `数字 ${sample.label}`;
  const features = (lessonChannels.samples as Record<string, Record<string, { channel: number; image: string }[]>>)[sample.id] ?? sample.features;
  return <ContentBlock className="vfl-hierarchy-page" headingLevel={1} title="从浅层特征到深层特征" subtitle="上一层的输出，成为下一层的输入。">
    <div className="vfl-hierarchy-scene">
      <aside className="vfl-hierarchy-pyramid" aria-label="由输入到浅层、中间层、深层">
        <div className="vfl-hierarchy-depth"><span aria-hidden="true"/><Typography variant="bodySmall" tone="muted">逐层组合</Typography></div>
        {LEVELS.map(level => <div className={`vfl-hierarchy-tier-row vfl-hierarchy-${level.key}`} key={level.key}>
          <div className="vfl-hierarchy-stack">{features[level.key].map((feature,index) => <img key={feature.channel} src={asset(feature.image)} alt={`${level.label}通道 ${feature.channel}`} style={{ '--plane': index } as CSSProperties} onError={() => setFailedSample(sampleId)}/>)}</div>
          <div className="vfl-hierarchy-tier-label"><Typography variant="h3" tone="inherit">{level.label}特征</Typography><Typography variant="bodySmall" tone="muted">{manifest.stages[level.key].shapeCHW[1]} × {manifest.stages[level.key].shapeCHW[2]} × {manifest.stages[level.key].shapeCHW[0]}</Typography></div>
        </div>)}
        <div className="vfl-hierarchy-input"><img src={asset(sample.input)} alt={`输入：${name}`}/><Typography variant="bodySmall" tone="accent">输入 · {name}</Typography></div>
      </aside>
      <div className="vfl-hierarchy-levels">
        {LEVELS.map(level => <section className={`vfl-hierarchy-level vfl-hierarchy-${level.key}`} key={level.key}>
          <div className="vfl-hierarchy-level-heading"><Typography as="h2" variant="h3" tone="inherit">{level.label} · {level.heading}</Typography><Typography variant="bodySmall" tone="muted">{level.note}</Typography></div>
          <div className="vfl-hierarchy-responses">{features[level.key].map(feature => <figure key={feature.channel}><img key={`${sampleId}-${level.key}-${feature.channel}`} src={asset(feature.image)} alt={`${name}的${level.label}响应，通道 ${feature.channel}`} onError={() => setFailedSample(sampleId)}/><Typography as="figcaption" variant="bodySmall" tone="muted">通道 {feature.channel}</Typography></figure>)}</div>
        </section>)}
      </div>
    </div>
    <div className="vfl-hierarchy-footer">
      <div className="vfl-hierarchy-choices" role="group" aria-label="选择输入数字"><Typography variant="bodySmall" tone="accent">切换数字</Typography><div>{manifest.samples.filter(item => item.dataset === 'mnist').map(item => <Button key={item.id} active={sampleId === item.id} aria-pressed={sampleId === item.id} aria-label={`查看数字 ${item.label}`} onClick={() => { setSampleId(item.id); setFailedSample(null); }}><img src={asset(item.input)} alt=""/></Button>)}</div></div>
      <Typography variant="body" tone="accent">局部细节 → 结构组合 → 高层表示</Typography>
    </div>
    <Typography className="vfl-hierarchy-source" variant="bodySmall" tone={failedSample === sampleId ? 'danger' : 'muted'} aria-live="polite">{failedSample === sampleId ? '图片加载失败，请刷新重试。' : '预训练网络的真实响应 · 每层展示五个固定通道'}</Typography>
  </ContentBlock>;
}

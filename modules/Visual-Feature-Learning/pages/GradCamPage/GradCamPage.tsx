import {useEffect, useState} from 'react';
import {Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography, moduleAssetUrl} from '../../../shared/react';
import './GradCamPage.css';

type Mode = 'classification' | 'recognition';
type Result = {heat: string; hasPositiveSupport: boolean; channels: {index: number; alpha: number; image: string}[]};
type Sample = {id: string; name: string; input: string; classification: Result; recognition: Result};
type RecordData = {samples: Sample[]};
const asset = (path: string) => moduleAssetUrl('80396753-7fc8-4f55-9188-bddbdb828169', `gradcam/${path}`);

export function GradCamPage() {
  const [record, setRecord] = useState<RecordData | null>(null);
  const [error, setError] = useState(false);
  const [sampleIndex, setSampleIndex] = useState(0);
  const [showHeat, setShowHeat] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    fetch(asset('pretrained-record.json'), {signal: controller.signal})
      .then(response => {if (!response.ok) throw Error('asset'); return response.json();})
      .then(setRecord)
      .catch(reason => {if (reason.name !== 'AbortError') setError(true);});
    return () => controller.abort();
  }, []);
  const sample = record?.samples[sampleIndex];
  const photo = (filename: string) => asset(`${sample?.id}/${filename}`);
  const result = sample?.classification;
  const maxWeight = Math.max(...(result?.channels.map(channel => Math.abs(channel.alpha)) ?? [1]), 1e-12);
  const status = error ? '照片与热图未能加载，请刷新。' : '正在加载照片与热图…';

  return <ContentBlock className="vfl-cam-page" headingLevel={1}
    title="Grad-CAM：不同训练目标关注哪里？"
    subtitle="用梯度找出影响模型判断的区域，观察图像分类与人脸识别模型的关注位置。">
    <div className="vfl-cam-stage">
      <section className="vfl-cam-principle">
        <Typography variant="h3" tone="accent">Grad-CAM 怎样得到热图？</Typography>
        <div className="vfl-cam-process">
          <div className="vfl-cam-step">
            <div className="vfl-cam-step-copy"><Typography variant="body" tone="accent">① 提取卷积特征</Typography><Typography variant="bodySmall" tone="muted">不同通道响应不同图像线索</Typography></div>
            <div className="vfl-cam-channels">{result?.channels.map(channel => <img key={channel.index} src={photo(channel.image)} alt={`卷积通道 ${channel.index} 的响应`} />)}{!result && <Typography variant="bodySmall" tone="muted">{status}</Typography>}</div>
          </div>
          <div className="vfl-cam-step">
            <div className="vfl-cam-step-copy"><Typography variant="body" tone="accent">② 梯度衡量通道作用</Typography><Typography variant="bodySmall" tone="muted">响应增强时，得分升还是降？</Typography></div>
            <div className="vfl-cam-weights">{result?.channels.map(channel => <div key={channel.index}>
              <Typography variant="bodySmall" tone="muted">通道 {channel.index}</Typography>
              <div className="vfl-cam-track"><span className={channel.alpha < 0 ? 'negative' : ''} style={{width: `${Math.abs(channel.alpha) / maxWeight * 100}%`}} /></div>
              <Typography variant="bodySmall" tone="muted">{channel.alpha < 0 ? '降低得分' : '提高得分'}</Typography>
            </div>)}</div>
          </div>
          <div className="vfl-cam-step">
            <div className="vfl-cam-step-copy"><Typography variant="body" tone="accent">③ 加权合成热图</Typography><Typography variant="bodySmall" tone="muted">保留支持当前判断的区域</Typography></div>
            <div className="vfl-cam-heat">{result && <img src={photo(result.heat)} alt="全部卷积通道加权合成的 Grad-CAM 热图" />}</div>
          </div>
        </div>
        <MathFormulaBlock className="vfl-cam-formula"><MathFormulaStatic latex={String.raw`M = \mathrm{ReLU}\!\left(\sum_k \alpha_k A^k\right)`} /></MathFormulaBlock>
      </section>
      <section className="vfl-cam-results">
        <Typography variant="h3" tone="accent">同一张脸，关注的位置不同</Typography>
        <div className="vfl-cam-comparison">
          {(['classification', 'recognition'] as Mode[]).map(mode => <section key={mode} className={`vfl-cam-result result-${mode}`}>
            <div className="vfl-cam-card-heading"><Typography variant="h3" tone="accent">{mode === 'classification' ? '图像分类' : '人脸识别'}</Typography><Typography variant="bodySmall" tone="muted">{mode === 'classification' ? 'MobileNetV3-Small' : 'MobileFaceNet · SFace'}</Typography></div>
            <div className="vfl-cam-picture">{sample ? <>
              <img src={photo(sample.input)} alt={`${sample.name}的输入照片`} />
              <img className="vfl-cam-color" style={{opacity: showHeat ? .8 : 0}} src={photo(sample[mode].heat)} alt={`${mode === 'classification' ? '图像分类' : '人脸识别'}的 Grad-CAM 热图`} />
              {showHeat && !sample[mode].hasPositiveSupport && <div className="vfl-cam-empty"><Typography variant="bodySmall">无正向热区</Typography></div>}
            </> : <Typography variant="bodySmall" tone="muted">{status}</Typography>}</div>
          </section>)}
        </div>
        <div className="vfl-cam-legend"><span aria-hidden="true" /><Typography variant="bodySmall" tone="accent">暖色：更支持当前判断的区域</Typography></div>
        <div className="vfl-cam-controls">
          <div className="vfl-cam-people">{['成龙', '艾薇儿'].map((name,index) => <Button key={name} active={sampleIndex === index} aria-pressed={sampleIndex === index} onClick={() => setSampleIndex(index)}>{name}</Button>)}</div>
          <Button active={!showHeat} aria-pressed={!showHeat} onClick={() => setShowHeat(value => !value)}>{showHeat ? '查看原图' : '查看热图'}</Button>
        </div>
      </section>
    </div>
  </ContentBlock>;
}
import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { AtlasImage } from '../../components/AtlasImage';
import {useEffect, useState} from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import './GradCamPage.css';

type Mode = 'classification' | 'recognition';
type Result = {heat: string; hasPositiveSupport: boolean; channels: {index: number; alpha: number; image: string}[]};
type Sample = {id: string; name: string; input: string; classification: Result; recognition: Result};
type RecordData = {samples: Sample[]};
const asset = (path: string) => moduleAssetUrl(`gradcam/${path}`);

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
  const result = sample?.classification;
  const photo = (filename: string) => asset(`${sample?.id}/${filename}`);
  const status = error ? '照片与热图未能加载，请刷新。' : '正在加载照片与热图…';

  return <ContentBlock shuku-edit-id="e-98c82a63-06a0-412a-b668-0fc927551088" className="vfl-cam-page" headingLevel={1}
    title="Grad-CAM：不同训练目标关注哪里？"
    subtitle="用梯度找出影响模型判断的区域，观察图像分类与人脸识别模型的关注位置。">
    <div shuku-edit-id="e-70d2ed0b-6ba0-487d-908f-2819a48b5c5d" className="vfl-cam-stage">
      <section shuku-edit-id="e-c63aebea-a74a-499c-9ec7-681ec5466e6c" className="vfl-cam-principle">
        <Typography shuku-edit-id="e-5328c51d-2d42-4bf9-acb5-7a6566a39831" variant="h3" tone="accent">Grad-CAM 怎样得到热图？</Typography>
        <div shuku-edit-id="e-fed06b83-cbb4-4406-becc-1cc1539c4626" className="vfl-cam-process">
          <div shuku-edit-id="e-5d517f9a-7ca1-470c-825b-bd63c4fad5fb" className="vfl-cam-step">
            <div shuku-edit-id="e-58e21bff-d7c7-426e-9025-e539aa4fcb71" className="vfl-cam-step-copy"><Typography shuku-edit-id="e-3603fe11-a43c-417d-9fd6-9a657331d89e" variant="body" tone="accent">① 提取卷积特征</Typography><Typography shuku-edit-id="e-126c4824-1bee-47c1-aaa0-f6aca7a3a518" variant="bodySmall" tone="muted">不同通道响应不同图像线索</Typography></div>
            <div shuku-edit-id="e-a5ef97cd-9df5-4690-94db-b3d995adbee6" className="vfl-cam-channels">{result?.channels.map(channel => <AtlasImage key={channel.index} src={photo(channel.image)} alt={`卷积通道 ${channel.index} 的响应`} />)}{!result && <Typography shuku-edit-id="e-10078892-7798-401c-9703-abadb4724bdf" variant="bodySmall" tone="muted">{status}</Typography>}</div>
          </div>
          <div shuku-edit-id="e-5cc9598d-0d8b-43c0-945e-1b0e630aa17b" className="vfl-cam-step vfl-cam-weight-step">
            <Typography shuku-edit-id="e-535038e9-44dc-4f79-8e7e-67362b814c28" variant="body" tone="accent">② 给每张特征图算一个权重</Typography>
            <Typography shuku-edit-id="e-1fa769a5-51bf-4d87-bf49-0a92e2787e02" variant="bodySmall" tone="accent">对各位置的梯度取平均，得到这张图的权重。</Typography>
            <MathFormulaBlock className="vfl-cam-weight-formula" ariaLabel="通道权重等于该通道各位置梯度的平均值">
              <MathFormulaTerm latex={String.raw`\alpha_k`} tooltip="α：通道权重；k：第几张特征图（通道）。" tooltipPlacement="top"/>
              <MathFormulaStatic latex="="/>
              <MathFormulaTerm latex={String.raw`\frac{1}{Z}`} tooltip="Z：一张特征图的位置总数。除以 Z 就是取平均。" tooltipPlacement="top"/>
              <MathFormulaTerm latex={String.raw`\sum_{i,j}`} tooltip="Σ：把各位置的数值加起来；i：行位置，j：列位置。" tooltipPlacement="top"/>
              <MathFormulaTerm latex={String.raw`\frac{\partial s}{\partial A^k_{ij}}`} tooltip="s：要解释的目标得分；A：卷积特征图的响应；k：通道；i、j：行、列位置。∂s/∂A 是梯度，表示该响应变化时，目标得分如何变化。" tooltipPlacement="top"/>
            </MathFormulaBlock>
            <Typography shuku-edit-id="e-908b49a6-63ff-48bc-b028-4acc1de1dfca" variant="bodySmall" tone="muted">乘上面的图再相加：正权重加，负权重减。</Typography>
          </div>
          <div shuku-edit-id="e-24d9b72b-1d8c-40c1-8304-50db63e33d12" className="vfl-cam-step">
            <div shuku-edit-id="e-91174295-fadc-48c9-a024-39eef0265155" className="vfl-cam-step-copy"><Typography shuku-edit-id="e-d2b4de91-8d51-4b94-94a6-b5a314873015" variant="body" tone="accent">③ 加权合成热图</Typography><Typography shuku-edit-id="e-3f70c0c9-ce8c-4561-b048-c7fcbf76290d" variant="bodySmall" tone="muted">保留支持当前判断的区域</Typography></div>
            <div shuku-edit-id="e-728ed014-0a3c-4b3f-b867-0a7632cc756d" className="vfl-cam-heat">{result && <AtlasImage src={photo(result.heat)} alt="全部卷积通道加权合成的 Grad-CAM 热图" />}</div>
          </div>
        </div>
        <MathFormulaBlock className="vfl-cam-formula"><MathFormulaStatic latex={String.raw`M = \mathrm{ReLU}\!\left(\sum_k \alpha_k A^k\right)`} /></MathFormulaBlock>
      </section>
      <section shuku-edit-id="e-7b5d41d8-150d-44c2-beb6-b0e95f123811" className="vfl-cam-results">
        <Typography shuku-edit-id="e-fcaba6a0-e70c-4c8f-9143-701dbc6f1675" variant="h3" tone="accent">同一张脸，关注的位置不同</Typography>
        <div shuku-edit-id="e-ddcd16d2-2869-4ab4-9eca-e1eb5b190058" className="vfl-cam-comparison">
          {(['classification', 'recognition'] as Mode[]).map(mode => <section shuku-edit-id="e-989c06ac-bde8-46fe-b229-7f87bb471719" key={mode} className={`vfl-cam-result result-${mode}`}>
            <div shuku-edit-id="e-48643975-3c5f-407d-8080-ab36377804ea" className="vfl-cam-card-heading"><Typography shuku-edit-id="e-f07ca2b1-ce0d-4caa-a5c6-6db83e0abec9" variant="h3" tone="accent">{mode === 'classification' ? '图像分类' : '人脸识别'}</Typography><Typography shuku-edit-id="e-8e222883-4899-4a5a-a8dc-9a07b4b26342" variant="bodySmall" tone="muted">{mode === 'classification' ? 'MobileNetV3-Small' : 'MobileFaceNet · SFace'}</Typography></div>
            <div shuku-edit-id="e-33801df4-d4d5-43a1-b446-d73757cc4fa9" className="vfl-cam-picture">{sample ? <>
              <AtlasImage src={photo(sample.input)} alt={`${sample.name}的输入照片`} />
              <AtlasImage className="vfl-cam-color" style={{opacity: showHeat ? .8 : 0}} src={photo(sample[mode].heat)} alt={`${mode === 'classification' ? '图像分类' : '人脸识别'}的 Grad-CAM 热图`} />
              {showHeat && !sample[mode].hasPositiveSupport && <div shuku-edit-id="e-32ecf433-feb9-4bf2-8bcf-0e02edc4b936" className="vfl-cam-empty"><Typography shuku-edit-id="e-c9b7395e-528a-4aab-a2ce-9a8c69365d26" variant="bodySmall">无正向热区</Typography></div>}
            </> : <Typography shuku-edit-id="e-6dfdc2ea-8afa-428d-aff0-3a1f764f71cf" variant="bodySmall" tone="muted">{status}</Typography>}</div>
          </section>)}
        </div>
        <div shuku-edit-id="e-367addec-98eb-4c67-ab93-44141b461ca8" className="vfl-cam-legend"><span shuku-edit-id="e-ad78ac4e-647b-4d5b-8426-5706e3a94ae1" aria-hidden="true" /><Typography shuku-edit-id="e-fcde1924-6d63-4382-8523-2851567292c6" variant="bodySmall" tone="accent">暖色：更支持当前判断的区域</Typography></div>
        <div shuku-edit-id="e-41b605b7-fd20-4c3a-8634-41c6c4c0d7f3" className="vfl-cam-controls">
          <div shuku-edit-id="e-a7993c52-b5b5-4978-9952-7b16937984c1" className="vfl-cam-people">{['成龙', '艾薇儿'].map((name,index) => <Button key={name} active={sampleIndex === index} aria-pressed={sampleIndex === index} onClick={() => setSampleIndex(index)}>{name}</Button>)}</div>
          <Button active={!showHeat} aria-pressed={!showHeat} onClick={() => setShowHeat(value => !value)}>{showHeat ? '查看原图' : '查看热图'}</Button>
        </div>
      </section>
    </div>
  </ContentBlock>;
}
import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { Fragment, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { channelAt, channelColors, channelNames, demosaic, SIDE, useSensorSamples } from './sensorModel';
import './CameraOpeningPage.css';

const imageUrl = moduleAssetUrl("images/cat-portrait.webp");
const stages = ['世界中的光', 'Bayer 采样', '电信号', '二进制编码', 'RGB 重建', '屏幕发光'];
const titles = ['从这张头像的拍摄开始', '每个位置，先只测一种颜色', '光变成了可以测量的电信号', '8 个二进制位，怎样得到 255？', '一个数，怎样变成三个数？', '数字让屏幕重新发出光'];
const descriptions = [
  '镜头把场景中的光投到传感器上。按下快门，开始追踪这张图像的形成。',
  '滤色阵列按 R、G、G、B 重复排列。每个感光单元只记录自己滤色片对应的响应。',
  '感光单元积累电荷，读出电路将它转成电压。此时响应大小还没有被编码成整数。',
  '模数转换器把连续响应量化，再用二进制编码。二进制与十进制是同一个整数的两种写法。',
  '这个位置只测到一个通道。去马赛克借助邻近位置，估计缺少的另外两个通道。',
  '图像中的 RGB 编码控制红、绿、蓝子像素的发光。离远一点看，它们合成一个颜色。',
];
const nextLabels = ['◎ 拍一张', '读出电信号 →', '把测量值数字化 →', '重建彩色图像 →', '送到显示器 →', '↺ 再拍一次'];
const weights = [128, 64, 32, 16, 8, 4, 2, 1];

export function CameraOpeningPage() {
  const { samples, failed } = useSensorSamples(imageUrl);
  const [stage, setStage] = useState(0);
  const [unlocked, setUnlocked] = useState(0);
  const [selected, setSelected] = useState(9 * SIDE + 8);
  const [edits, setEdits] = useState<Record<number, number>>({});
  const [showSubpixels, setShowSubpixels] = useState(false);
  const ready = samples.length > 0;
  const raw = samples.map((v, i) => edits[i] ?? Math.round(v * 255));
  const rgb = ready ? demosaic(raw) : [];
  const channel = channelAt(selected);
  const value = raw[selected] ?? 0;
  const color = channelColors[channel];
  const bits = value.toString(2).padStart(8, '0');
  const pixel = rgb[selected] ?? [0, 0, 0];
  const next = () => {
    if (stage === 5) { setStage(0); setUnlocked(0); setEdits({}); setShowSubpixels(false); return; }
    setStage(stage + 1);
    setUnlocked(Math.max(unlocked, stage + 1));
  };

  return <ContentBlock shuku-edit-id="e-9246ff97-a82c-49e3-b4ae-8fe5034ca6b8" className={`di-chain di-chain--stage-${stage}`} headingLevel={1} title="一张照片，怎样从世界走进屏幕？" subtitle="按下快门，跟着同一个像素走完这条链路。">
    <div shuku-edit-id="e-a734117a-4c42-4cbb-97df-0dc615a69fd5" className="di-chain__body">
      <nav shuku-edit-id="e-d3bf8959-05f1-46f5-8afa-ddf66386ea0f" className="di-chain__route" aria-label="成像链路">
        {stages.map((name, i) => <Fragment key={name}>
          {i > 0 && <Typography shuku-edit-id="e-177fe538-6682-4299-849a-b228b8162e46" as="span" variant="body" tone="light" aria-hidden="true">→</Typography>}
          <Button active={stage === i} disabled={i > unlocked} onClick={() => setStage(i)} className="di-chain__station">
            <Typography shuku-edit-id="e-50c87408-6971-4c0f-875a-0a250fc1a530" as="span" variant="bodySmall" tone="inherit">{name}</Typography>
          </Button>
        </Fragment>)}
      </nav>
      <div shuku-edit-id="e-d8be2369-149f-459f-b026-f08e5b34f4a0" className="di-chain__lesson">
        <div shuku-edit-id="e-5aba1474-7f53-4135-a9d8-a698b612032c" className={`di-chain__visual di-chain__visual--${stage}`}>
          <div shuku-edit-id="e-f7bc602f-9612-4f9a-a78e-d5a8debba1c1" className="di-chain__image-area">
            {stage === 0 ? <><img shuku-edit-id="e-b60ad32d-a9dd-42ca-b274-39966e24e987" src={imageUrl} className="di-chain__photo" alt="作为拍摄示例的猫头像" /><div shuku-edit-id="e-a8a14539-ead3-4828-840c-9a33d1a27f11" className="di-chain__focus" aria-hidden="true" /></> :
              <div shuku-edit-id="e-b5ccab67-3156-42c6-b601-eaea118bff1c" className="di-chain__grid" aria-label={stage < 4 ? 'Bayer传感器取样网格' : '重建的图像像素'}>
                {raw.map((v, i) => {
                  const c = channelAt(i);
                  const components = stage >= 4 ? rgb[i] : [0, 0, 0].map((_, ci) => ci === c ? v : 0);
                  const background = stage === 2 || stage === 3 ? `rgb(${v},${v},${v})` : `rgb(${components.join(',')})`;
                  return <Button key={i} aria-label={`第${Math.floor(i / SIDE) + 1}行第${i % SIDE + 1}列，${channelNames[c]}通道，编码${v}`} active={selected === i} onClick={() => setSelected(i)} className="di-chain__cell" style={{ background, color: v > 150 ? '#182b4b' : 'white' }}>
                    {stage === 1 && <Typography shuku-edit-id="e-f2f11c5f-52d4-487c-8c2a-af46df53bb59" as="span" variant="bodySmall" tone="inherit">{channelNames[c]}</Typography>}
                    {stage === 5 && showSubpixels && <span shuku-edit-id="e-b4b5dd2a-db8c-46e9-87d7-1463d30c3439" className="di-chain__subpixels" aria-hidden="true">{components.map((component, ci) => <i shuku-edit-id="e-d45e3c22-8bd2-4771-8e4a-116c3cad2cc0" key={ci} style={{ background: `rgb(${[0, 0, 0].map((_, k) => k === ci ? component : 0).join(',')})` }} />)}</span>}
                  </Button>;
                })}
              </div>}
          </div>
          <Typography shuku-edit-id="e-a05a45c0-f4da-48ee-88eb-906e68e74804" variant="bodySmall" tone="muted" align="center">{stage === 0 ? '自然场景 → 镜头 → 传感器' : stage === 1 ? '放大的 RGGB 阵列 · 点击一个感光位置' : stage < 4 ? '同一组测量 · 灰度表示响应大小' : stage === 4 ? '邻域插值后的彩色图像' : showSubpixels ? '放大的 RGB 条纹子像素示意' : '合成观看：屏幕上的彩色图像'}</Typography>
        </div>
        <div shuku-edit-id="e-5021033d-faa6-4dec-9b81-8feef11558dc" className="di-chain__explanation" aria-live="polite">
          <Typography shuku-edit-id="e-5a2dc766-8aea-4bef-b1bd-9b7a277fe4e1" as="h2" variant="h3" tone="accent">{titles[stage]}</Typography>
          <Typography shuku-edit-id="e-2e7e8706-2a22-40ca-b525-865193c5288e" variant="body" tone="muted">{descriptions[stage]}</Typography>
          <div shuku-edit-id="e-9a2d5c81-5cc3-43b8-bf58-e1921d374ad0" className="di-chain__detail">
            {stage === 0 && <div shuku-edit-id="e-4dc01e5d-48da-42cc-b620-2399079c0714" className="di-chain__capture">
              <div shuku-edit-id="e-5a71bd6f-0bd4-42b3-b21a-451cb61ed132" className="di-chain__lens" aria-hidden="true"><i shuku-edit-id="e-b69c21b1-a29c-46a9-b60f-6b06bc6f6d69" /></div>
              <Typography shuku-edit-id="e-63d8c465-b48f-4ed7-ab3d-1029cb44b3fe" variant="body" tone="accent">场景中的光，还不是图像文件。</Typography>
            </div>}
            {stage === 1 && <><div shuku-edit-id="e-b7cf8eb2-6365-477a-8003-94553f7caca4" className="di-chain__bayer-pattern">{[0, 1, 1, 2].map((c, i) => <div shuku-edit-id="e-c6c7b564-3285-47fe-8654-be7294d0b7fb" key={i} style={{ background: channelColors[c] }}><Typography shuku-edit-id="e-93b5f0b3-c58f-4dbe-bdda-b06c2e25d14a" variant="h3" tone="inherit">{channelNames[c]}</Typography></div>)}</div>
              <Typography shuku-edit-id="e-99e8628c-0ebe-4a93-897a-92ca3e6de87d" variant="body">空间采样：连续的光分布，被有限个感光位置测量。</Typography>
              <Typography shuku-edit-id="e-41281b4d-bc9f-4311-a113-4fb20becb579" variant="bodySmall" tone="muted">每个单元在有限面积、曝光时间内积累响应，并非一个位置直接测到完整 RGB。</Typography></>}
            {stage === 2 && <><Typography shuku-edit-id="e-181baea7-73ad-4f1b-a6fd-871757aaeb16" variant="bodySmall" tone="muted">当前 {channelNames[channel]} 感光单元的归一化响应</Typography>
              <Typography shuku-edit-id="e-6ff577fb-0062-491d-b245-ad233daeaa98" variant="display" tone="accent">{(samples[selected] ?? 0).toFixed(3)}</Typography>
              <div shuku-edit-id="e-c8155b87-f961-4363-bb4e-6b7ab18fdf71" className="di-chain__analog"><i shuku-edit-id="e-504598fc-2004-4a58-937b-e86452eacd8c" style={{ width: `${(samples[selected] ?? 0) * 100}%`, background: color }} /></div>
              <div shuku-edit-id="e-3191c4cf-57fa-4732-bf5a-355a1e29c046" className="di-chain__range"><Typography shuku-edit-id="e-962a3bcf-ace4-46a2-9cd7-fc4c9305facd" variant="bodySmall">弱</Typography><Typography shuku-edit-id="e-13d9c0fc-519d-473e-89a1-58cad2359eee" variant="bodySmall">强</Typography></div>
              <Typography shuku-edit-id="e-5195ec18-50a1-4d54-b583-7addb83bfc51" variant="body">接下来，必须决定：用哪个有限的整数表示这个响应？</Typography></>}
            {stage === 3 && <><div shuku-edit-id="e-7b2911f8-e2fd-4192-ae68-2aa04fa1db19" className="di-chain__bit-row">{bits.split('').map((bit, i) => <div shuku-edit-id="e-2640ba21-7161-46a6-8ec7-d55add90848b" key={i}>
              <Button active={bit === '1'} onClick={() => setEdits({ ...edits, [selected]: value ^ weights[i] })} aria-label={`切换位权${weights[i]}的二进制位`}><Typography shuku-edit-id="e-0ac29600-fa2a-4802-a6c2-c90890571e1d" variant="h3" tone="inherit">{bit}</Typography></Button>
              <Typography shuku-edit-id="e-3bfcf781-63bb-40b8-9eaa-91da22293dd8" variant="bodySmall" tone="muted" align="center">{weights[i]}</Typography>
            </div>)}</div>
              <MathFormulaBlock appearance="plain"><MathFormulaStatic latex={`${bits}_{(2)}=${value}_{(10)}`} /></MathFormulaBlock>
              <div shuku-edit-id="e-e309b6c6-e66c-43b3-99d4-ccceaae119df" className="di-chain__limits"><Button onClick={() => setEdits({ ...edits, [selected]: 0 })}><Typography shuku-edit-id="e-e5a7ed94-0c93-4a35-826e-b4c8751e7fc2" as="span" variant="bodySmall" tone="inherit">全部置 0</Typography></Button><Button onClick={() => setEdits({ ...edits, [selected]: 255 })}><Typography shuku-edit-id="e-c3b27082-1a77-4fcd-ba98-349baac3c395" as="span" variant="bodySmall" tone="inherit">全部置 1</Typography></Button></div>
              <MathFormulaBlock appearance="plain"><MathFormulaStatic latex={'2^8=256\\text{ 个等级},\\quad 0\\ldots255'} /></MathFormulaBlock>
              <Typography shuku-edit-id="e-52eaeab8-42a9-4974-8ab6-adf8156efdf3" variant="bodySmall" tone="muted">点动二进制位，观察编码和对应感光位置的数值变化。位下方是位权。</Typography></>}
            {stage === 4 && <><Typography shuku-edit-id="e-db73b1a7-5b41-4175-90e4-30ea62a65216" variant="bodySmall" tone="muted">同一位置：实测一个通道，估计另外两个</Typography>
              <div shuku-edit-id="e-5abc910a-f81d-4dc9-84e3-0e03efb72c6e" className="di-chain__rgb">{pixel.map((v, c) => <div shuku-edit-id="e-0e718047-a490-4211-b8bf-45b3991194f0" key={c} style={{ borderColor: channelColors[c] }}><Typography shuku-edit-id="e-db0b5723-0329-48ef-afde-9b00343462f3" variant="body" style={{ color: channelColors[c] }}>{channelNames[c]}</Typography><Typography shuku-edit-id="e-767aa67e-aae2-4387-bd98-d8af186522fa" variant="h2">{v}</Typography><Typography shuku-edit-id="e-fb665fde-1915-4513-a991-bf837d838bdf" variant="bodySmall" tone="muted">{c === channel ? '实测' : '邻域估计'}</Typography></div>)}</div>
              <Typography shuku-edit-id="e-2bd9e1e9-f2ec-4654-a8ac-d31f0da60dd6" variant="body">传感器的一个测量值，变成彩色像素的三个通道值。</Typography>
              <Typography shuku-edit-id="e-48025b27-408d-4eae-9383-3d9555f76440" variant="bodySmall" tone="muted">实际相机还会做白平衡、颜色与色调处理，再生成适合显示的编码。</Typography></>}
            {stage === 5 && <><div shuku-edit-id="e-11564a94-7fbd-461b-acdb-1f9a687ec8f0" className="di-chain__screen-pixel">{pixel.map((v, c) => <div shuku-edit-id="e-9966f8c9-9829-4714-8694-a2b0a5a9dd0f" key={c} style={{ background: `rgb(${pixel.map((_, k) => k === c ? v : 0).join(',')})` }}><Typography shuku-edit-id="e-aa3d3db6-57ff-4349-ab2c-972513ca80a8" variant="body" tone="inherit">{channelNames[c]}</Typography><Typography shuku-edit-id="e-2610a840-cd0f-4882-97c7-78d7e9e7f6ce" variant="h3" tone="inherit">{v}</Typography></div>)}</div>
              <div shuku-edit-id="e-12208c90-8ffd-4511-92a4-b4678ac68045" className="di-chain__combined"><i shuku-edit-id="e-23b20cbb-2a52-498a-b9e7-4ce07ed54da6" style={{ background: `rgb(${pixel.join(',')})` }} /><Typography shuku-edit-id="e-a5b21542-e5cc-4e45-b40e-f9e178805188" variant="body">三个子像素 → 一个像素的颜色</Typography></div>
              <div shuku-edit-id="e-74660532-caa3-4e31-8094-1e5b707b6a86"><Button onClick={() => setShowSubpixels(value => !value)}><Typography shuku-edit-id="e-79ef2933-d55a-4cfa-a3b1-995d3fed17e7" as="span" variant="bodySmall" tone="inherit">{showSubpixels ? '退远观看' : '放大子像素'}</Typography></Button></div>
              <Typography shuku-edit-id="e-3cd2a3d5-bdfe-4e05-b7dd-1653b9fd891a" variant="bodySmall" tone="muted">传感器用滤色片分开测量光；显示器用子像素共同呈现颜色。</Typography></>}
          </div>
        </div>
      </div>
      <footer shuku-edit-id="e-f0ea6a53-ec11-4b76-999e-d66a1097eecf" className="di-chain__footer">
        <div shuku-edit-id="e-2a232357-abcd-4b35-b4f4-5796148fb3fe"><Typography shuku-edit-id="e-883cc215-a02f-457f-a2a7-71c56a0db8ca" variant="body" tone="accent">{stage < 3 ? '光 → 电信号 → 数字' : '光被测量成数字，数字又控制屏幕发光。'}</Typography>
          <Typography shuku-edit-id="e-3c2e30b5-eadb-4bee-82d1-cb58ea4cccd6" variant="bodySmall" tone="muted">教学示意：照片模拟入射光，使用 8 位量化与简化插值；实际 RAW 常采用更高位深。</Typography></div>
        <Button variant="primary" disabled={!ready} onClick={next}><Typography shuku-edit-id="e-fd6c1acf-8a16-44b7-823c-0cfb5c5dae71" as="span" variant="body" tone="inherit">{failed ? '图片加载失败' : !ready ? '加载中…' : nextLabels[stage]}</Typography></Button>
      </footer>
    </div>
  </ContentBlock>;
}

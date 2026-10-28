import { ContentBlock, MathFormulaBlock, MathFormulaStatic, moduleAssetUrl, Typography } from '../../../shared/react';
import { WormholeBenefit } from '../../components/WormholeLessonFrame';
import outline from '../../outlines.json';
import './ConvolutionDefinitionPage.css';

function Formula({ latex, label }: { latex: string; label: string }) {
  return <MathFormulaBlock appearance="plain" ariaLabel={label}><MathFormulaStatic latex={latex} /></MathFormulaBlock>;
}

export function ConvolutionDefinitionPage() {
  return <ContentBlock className="llmpe-def-page" headingLevel={1} title={outline.pages[6].title}
    subtitle="从彩色图像张量，到多通道求和与输出尺寸" bodyClassName="llmpe-def-body">
    <div className="llmpe-def-content">
      <section className="llmpe-def-model" aria-label="卷积的专业定义">
        <div className="llmpe-def-tensors">
          <div className="llmpe-def-input">
            <img src={moduleAssetUrl(outline.moduleIdentity.id, 'images/edge-examples/building.jpg')} alt="包含红绿蓝三个通道的彩色建筑图像" />
            <div className="llmpe-def-channels" aria-label="红、绿、蓝三个通道"><i /><i /><i /></div>
          </div>
          <div className="llmpe-def-shapes">
            <Typography as="h3" variant="h3" tone="accent">彩色输入与卷积核</Typography>
            <Formula label="输入图像与卷积核张量维度" latex={String.raw`I\in\mathbb{R}^{H\times W\times C_{\mathrm{in}}},\quad K\in\mathbb{R}^{k_h\times k_w\times C_{\mathrm{in}}\times C_{\mathrm{out}}}`} />
            <Formula label="RGB 输入三个通道，输出张量维度" latex={String.raw`C_{\mathrm{in}}=3\ (\mathrm{RGB}),\qquad Y\in\mathbb{R}^{H_{\mathrm{out}}\times W_{\mathrm{out}}\times C_{\mathrm{out}}}`} />
          </div>
        </div>
        <div className="llmpe-def-main">
          <Typography as="h3" variant="h3" tone="accent">多通道卷积（零填充，膨胀率为 1）</Typography>
          <Formula label="多通道二维卷积，采用互相关约定" latex={String.raw`\displaystyle Y_{r,c,o}=b_o+\sum_{q=0}^{C_{\mathrm{in}}-1}\sum_{i=0}^{k_h-1}\sum_{j=0}^{k_w-1}K_{i,j,q,o}\,\widetilde I_{r s_h+i-p_h,\,c s_w+j-p_w,\,q}`} />
          <Typography variant="bodySmall" tone="muted">互相关约定　s：步长　p：填充　b：偏置</Typography>
        </div>
        <div className="llmpe-def-details">
          <div className="llmpe-def-dimensions">
            <Typography as="h3" variant="h3" tone="accent">输出尺寸</Typography>
            <Formula label="输出图像高度" latex={String.raw`H_{\mathrm{out}}=\lfloor\tfrac{H+2p_h-k_h}{s_h}\rfloor+1`} />
            <Formula label="输出图像宽度" latex={String.raw`W_{\mathrm{out}}=\lfloor\tfrac{W+2p_w-k_w}{s_w}\rfloor+1`} />
            
          </div>
          <div className="llmpe-def-gray">
            <Typography as="h3" variant="h3" tone="accent">与前页边缘检测的联系</Typography>
            <Formula label="从 RGB 转换为灰度亮度" latex={String.raw`I_{\mathrm{gray}}=0.299I_R+0.587I_G+0.114I_B`} />
            <Formula label="灰度图像卷积与边缘强度" latex={String.raw`R=I_{\mathrm{gray}}*K,\qquad E=|R|`} />
            
          </div>
        </div>
      </section>
      <aside className="llmpe-def-sidebar">
        <Typography as="h2" variant="h2" tone="accent">专业教育的优势</Typography>
        <WormholeBenefit kind="book" title="体系完整">定义、维度与计算</WormholeBenefit>
        <WormholeBenefit kind="formula" title="理论严谨">索引、边界与约定</WormholeBenefit>
        <WormholeBenefit kind="eye" title="可以深挖">通道、尺度与参数</WormholeBenefit>
        <div className="llmpe-def-question"><Typography as="h3" variant="h3" tone="accent">第一次接触时</Typography><Typography variant="bodySmall" tone="muted">符号与维度很多<br />仍需建立直观对应</Typography></div>
      </aside>
    </div>
    <footer className="llmpe-def-conclusion"><Typography variant="body" tone="accent" align="center">表达可以很严谨，理解仍需要把符号与具体过程联系起来</Typography></footer>
  </ContentBlock>;
}


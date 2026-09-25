import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import type { ReactNode } from 'react';
import buildingImage from '../../assets/xiandaijianzhu.png';
import './ConvolutionPropertiesPage.css';

const INPUT_GRID = Array.from({ length: 25 }, (_, index) => index);
const OUTPUT_GRID = Array.from({ length: 9 }, (_, index) => index);
const KERNEL_GRID = Array.from({ length: 9 }, (_, index) => index);

function Grid({ kind, active = [], label, image = false }: { kind: 'input' | 'output' | 'kernel'; active?: number[]; label: string; image?: boolean }) {
  const items = kind === 'input' ? INPUT_GRID : kind === 'output' ? OUTPUT_GRID : KERNEL_GRID;
  return (
    <div
      className={`ck-properties__grid ck-properties__grid--${kind} ${image ? 'is-image' : ''}`}
      role="img"
      aria-label={label}
      style={{ backgroundImage: image ? `url(${buildingImage})` : undefined }}
    >
      {items.map((index) => <span className={active.includes(index) ? 'is-active' : ''} key={index} />)}
    </div>
  );
}

function PropertyPanel({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <article className="ck-properties__panel">
      <header className="ck-properties__panel-head">
        <span className="ck-properties__number"><Typography as="span" variant="h3" tone="light">{number}</Typography></span>
        <Typography as="h2" variant="h3" tone="accent">{title}</Typography>
      </header>
      {children}
    </article>
  );
}

export function ConvolutionPropertiesPage() {
  return (
    <ContentBlock
      headingLevel={1}
      className="ck-properties"
      title="卷积的三大性质"
      subtitle="局部连接限定感受野，参数共享控制模型规模，平移等变描述特征图的位置响应。"
    >
      <div className="ck-properties__panels">
        <PropertyPanel number="1" title="稀疏连接（局部连接）">
          <Typography variant="bodySmall" tone="muted" className="ck-properties__description">每个输出位置只依赖输入中的一个局部区域，而非整幅图像。</Typography>
          <div className="ck-properties__local-diagram">
            <div className="ck-properties__diagram-node">
              <Typography variant="bodySmall" tone="accent">输入 <MathFormulaStatic latex="X" /></Typography>
              <Grid kind="input" active={[6, 7, 8, 11, 12, 13, 16, 17, 18]} label="输入网格，中央 3 乘 3 局部区域高亮" image />
              <Typography variant="bodySmall" tone="muted"><MathFormulaStatic latex="H\times W\times C_{in}" /></Typography>
            </div>
            <Typography as="span" variant="h2" tone="accent" className="ck-properties__flow-arrow" aria-hidden="true">→</Typography>
            <div className="ck-properties__diagram-middle">
              <Typography variant="bodySmall" tone="accent">局部感受野</Typography>
              <Grid kind="kernel" label="局部感受野范围" />
              <Typography as="span" variant="bodySmall" tone="accent" className="ck-properties__flow-arrow" aria-hidden="true">×</Typography>
              <Grid kind="kernel" label="卷积核权重 W" active={KERNEL_GRID} />
              <Typography variant="bodySmall" tone="muted"><MathFormulaStatic latex="k_h\times k_w\times C_{in}" /></Typography>
            </div>
            <Typography as="span" variant="h2" tone="accent" className="ck-properties__flow-arrow" aria-hidden="true">→</Typography>
            <div className="ck-properties__diagram-node">
              <Typography variant="bodySmall" tone="accent">一个输出位置</Typography>
              <Grid kind="output" active={[4]} label="输出特征图的一个位置被选中" />
              <Typography variant="bodySmall" tone="muted"><MathFormulaStatic latex="Y_{i,j}" /></Typography>
            </div>
          </div>
          <div className="ck-properties__formula">
            <Typography variant="bodySmall" tone="accent">单个输出只汇总对应窗口内的输入：</Typography>
            <MathFormulaBlock ariaLabel="局部连接的二维卷积公式">
              <MathFormulaStatic latex={String.raw`Y_{i,j}=\sum_{u,v}W_{u,v}X_{i+u,j+v}`} />
            </MathFormulaBlock>
          </div>
        </PropertyPanel>

        <PropertyPanel number="2" title="参数共享">
          <Typography variant="bodySmall" tone="muted" className="ck-properties__description">同一个卷积核在不同空间位置重复使用，所有位置共享同一组权重。</Typography>
          <div className="ck-properties__sharing-diagram">
            <div className="ck-properties__sharing-input">
              <Typography variant="bodySmall" tone="accent">输入图像 <MathFormulaStatic latex="X" /></Typography>
              <Grid kind="input" active={[1, 2, 3, 6, 7, 8, 11, 12, 13, 16, 17, 18]} label="输入网格中的三个卷积窗口位置" image />
              <div className="ck-properties__position-key"><span /><Typography variant="bodySmall" tone="muted">多个位置</Typography></div>
            </div>
            <div className="ck-properties__shared-kernel">
              <Typography variant="bodySmall" tone="accent">共享权重 <MathFormulaStatic latex="W" /></Typography>
              <Grid kind="kernel" active={KERNEL_GRID} label="所有位置重复使用的同一个卷积核 W" />
              <Typography variant="bodySmall" tone="muted">同一组权重</Typography>
            </div>
            <div className="ck-properties__sharing-output">
              <Typography variant="bodySmall" tone="accent">特征图 <MathFormulaStatic latex="Y" /></Typography>
              <Grid kind="output" active={[1, 4, 7]} label="由三个位置共享计算得到的特征图响应" />
              <Typography variant="bodySmall" tone="muted">位置对应响应</Typography>
            </div>
          </div>
          <div className="ck-properties__formula ck-properties__formula--sharing">
            <Typography variant="bodySmall" tone="accent">权重数量由卷积核大小与通道数决定：</Typography>
            <MathFormulaBlock ariaLabel="卷积层参数数量公式">
              <MathFormulaStatic latex={String.raw`k_hk_wC_{in}C_{out}+C_{out}`} />
            </MathFormulaBlock>
            <Typography variant="bodySmall" tone="muted">不随输入图像的空间尺寸 <MathFormulaStatic latex="H,W" /> 增长。</Typography>
          </div>
        </PropertyPanel>

        <PropertyPanel number="3" title="平移等变性">
          <Typography variant="bodySmall" tone="muted" className="ck-properties__description">输入图像发生平移，特征图中的对应响应也发生相同平移。</Typography>
          <div className="ck-properties__equivariance">
            <div className="ck-properties__translation-pair">
              <figure>
                <Typography variant="bodySmall" tone="accent">输入 <MathFormulaStatic latex="X" /></Typography>
                <div className="ck-properties__photo"><img src={buildingImage} alt="建筑图像输入" /><span className="ck-properties__object-marker" /></div>
              </figure>
              <Typography as="span" variant="h2" tone="accent" aria-hidden="true">→</Typography>
              <figure>
                <Typography variant="bodySmall" tone="accent">平移后 <MathFormulaStatic latex="T_{\Delta}X" /></Typography>
                <div className="ck-properties__photo"><img src={buildingImage} alt="向右下平移后的建筑图像" /><span className="ck-properties__object-marker is-shifted" /></div>
              </figure>
            </div>
            <div className="ck-properties__translation-pair ck-properties__translation-pair--output">
              <figure>
                <Typography variant="bodySmall" tone="accent">响应 <MathFormulaStatic latex="f(X)" /></Typography>
                <div className="ck-properties__response-map"><span /></div>
              </figure>
              <Typography as="span" variant="h2" tone="accent" aria-hidden="true">→</Typography>
              <figure>
                <Typography variant="bodySmall" tone="accent">平移后的响应 <MathFormulaStatic latex="f(T_{\Delta}X)" /></Typography>
                <div className="ck-properties__response-map"><span className="is-shifted" /></div>
              </figure>
            </div>
            <div className="ck-properties__equivariance-formula">
              <Typography variant="bodySmall" tone="accent">对应关系</Typography>
              <MathFormulaBlock ariaLabel="卷积的平移等变关系">
                <MathFormulaStatic latex={String.raw`f(T_{\Delta}X)=T_{\Delta}f(X)`} />
              </MathFormulaBlock>
            </div>
          </div>
          <Typography variant="bodySmall" tone="muted" className="ck-properties__caveat">等变表示响应随位置移动；它不表示输出数值不变。</Typography>
        </PropertyPanel>
      </div>
      <footer className="ck-properties__summary">
        <Typography as="span" variant="h3" tone="accent">总结：</Typography>
        <Typography variant="body">局部连接减少无关连接，参数共享复用权重，平移等变保持位置对应。</Typography>
      </footer>
    </ContentBlock>
  );
}

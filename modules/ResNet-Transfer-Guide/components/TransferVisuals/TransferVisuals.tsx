import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
import { MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
const bottle = moduleAssetUrl(moduleIdentity.id, "recycling/intro-samples/bottle-tall.jpg");
const can = moduleAssetUrl(moduleIdentity.id, "recycling/intro-samples/can-red.jpg");
const carton = moduleAssetUrl(moduleIdentity.id, "recycling/intro-samples/carton-sealed.jpg");
import './TransferVisuals.css';

export const TRANSFER_SAMPLES = [
  { name: '塑料瓶', image: bottle }, { name: '易拉罐', image: can }, { name: '纸盒', image: carton },
] as const;
export function TransferArrow() {
  return <svg className="rtg-transfer-arrow" viewBox="0 0 80 32" aria-hidden="true"><path d="M2 16H72M59 3L72 16L59 29" /></svg>;
}
export function TransferLock({ open = false }: { open?: boolean }) {
  return <svg className={'rtg-transfer-lock' + (open ? ' is-open' : '')} viewBox="0 0 32 34" role="img" aria-label={open ? '方案已锁定，可独立评估' : '锁定：不参与当前操作'}>
    <path d={open ? 'M10 15V9a6 6 0 0 1 11-3' : 'M10 15V9a6 6 0 0 1 12 0v6'} />
    <rect x="6" y="15" width="20" height="16" rx="3" /><path d="M16 20v6" />
  </svg>;
}
export function TransferSlabs({ count = 5, tone = 'original' }: { count?: 1 | 5; tone?: 'original' | 'frozen' | 'trainable' | 'empty' }) {
  return <svg className={'rtg-transfer-slabs is-' + tone} viewBox={count === 1 ? '0 0 120 220' : '0 0 560 220'} aria-hidden="true">
    {Array.from({ length: count }, (_, index) => <g key={index} transform={'translate(' + index * 104 + ',0)'}>
      <path className="slab-top" d="M10 54L50 16H104L64 54Z" /><path className="slab-side" d="M64 54L104 16V164L64 202Z" /><path className="slab-front" d="M10 54H64V202H10Z" />
    </g>)}
  </svg>;
}
export function WeightCheckpoint() {
  return <div className="rtg-transfer-checkpoint" aria-label="预训练权重文件">
    <svg viewBox="0 0 180 210" aria-hidden="true"><path d="M16 4H116L174 62V198Q174 206 166 206H16Q6 206 6 196V14Q6 4 16 4Z" /><path className="file-fold" d="M116 4V62H174" /></svg>
    <MathFormulaBlock appearance="plain" ariaLabel="theta星，预训练参数"><MathFormulaStatic latex="\theta^{*}" /></MathFormulaBlock>
  </div>;
}
export function PhotoStack({ label = '带标签的训练集' }: { label?: string }) {
  return <figure className="rtg-transfer-photos"><div>{TRANSFER_SAMPLES.map(sample => <img key={sample.name} src={sample.image} alt={sample.name + '样本示意'} />)}</div>
    <Typography as="figcaption" variant="bodySmall" tone="accent" align="center">{label}</Typography></figure>;
}
export function DatasetSplit({ frame = 3, active, testOpen = false }: { frame?: number; active?: 'train' | 'validation' | 'test'; testOpen?: boolean }) {
  return <div className="rtg-transfer-datasets" data-frame={frame} aria-label="独立样本划分；训练、验证、测试三组均包含三类，不按类别分组">
    {(['train', 'validation', 'test'] as const).map((id, index) => <figure key={id} data-split={id} className={(index < frame ? 'is-ready ' : '') + (active === id ? 'is-active' : '')}>
      <svg className="rtg-transfer-datasets__bucket" viewBox="0 0 110 118" aria-hidden="true">
        <path className="bucket-body" d="M8 24H102V101Q55 118 8 101Z" /><ellipse className="bucket-top" cx="55" cy="24" rx="47" ry="15" />
        <g className="sample-set">
          <rect className="sample-card" x="15" y="43" width="25" height="55" rx="3" /><path className="sample-icon" d="M24 52H31V59L35 66V89H20V66L24 59ZM24 49H31" />
          <rect className="sample-card" x="43" y="43" width="25" height="55" rx="3" /><rect className="sample-icon" x="49" y="55" width="13" height="34" rx="5" /><path className="sample-icon" d="M49 59H62M49 85H62" />
          <rect className="sample-card" x="71" y="43" width="25" height="55" rx="3" /><path className="sample-icon" d="M76 63L84 58L91 63V85L84 90L76 85ZM76 63L84 68L91 63M84 68V90" />
        </g>
      </svg>
      <Typography as="figcaption" variant="bodySmall" tone="accent" align="center">{['训练', '验证', '测试'][index]}</Typography>
      {id === 'test' && <span className="rtg-transfer-datasets__lock"><TransferLock open={testOpen} /></span>}
    </figure>)}
  </div>;
}
export function ValidationPaths({ frame = 0, scope = 5 }: { frame?: number; scope?: number }) {
  return <div className="rtg-transfer-validation" data-loop-frame={frame} data-test-open={frame === 3} aria-label="两条条件分支按验证结果择一；方案确定后才独立测试，非实际训练结果">
    <div className={'rtg-transfer-validation__origin' + (frame >= 1 ? ' is-lit' : '')}>
      <svg viewBox="0 0 40 44" aria-hidden="true"><ellipse cx="20" cy="9" rx="16" ry="6" /><path d="M4 9V31C4 39 36 39 36 31V9M4 20C4 28 36 28 36 20" /></svg>
      <Typography variant="bodySmall" tone="accent">验证集比较</Typography>
    </div>
    <svg className="rtg-transfer-validation__fork" viewBox="0 0 60 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60C24 60 24 26 58 26M0 60C24 60 24 94 58 94M50 18L58 26L50 34M50 86L58 94L50 102" /></svg>
    <div className={'rtg-transfer-validation__branches' + (frame >= 2 ? ' is-lit' : '')}>
      <Typography variant="bodySmall" tone="accent">{scope === 5 ? '满足要求：保留基线' : '满足要求：保留方案'}</Typography>
      <Typography variant="bodySmall" tone="accent">{scope === 5 ? '仍有空间：比较后段微调' : '仍有空间：对照基线再调整'}</Typography>
    </div>
    <svg className="rtg-transfer-validation__fork" viewBox="0 0 60 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 26C30 26 30 60 58 60M0 94C30 94 30 60 58 60M50 52L58 60L50 68" /></svg>
    <div className={'rtg-transfer-validation__test' + (frame === 3 ? ' is-lit' : '')}>
      <TransferLock open={frame === 3} /><Typography variant="bodySmall" tone="accent">方案确定后<br />独立测试</Typography>
    </div>
  </div>;
}

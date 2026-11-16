import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
const bottle = moduleAssetUrl("recycling/intro-samples/bottle-tall.jpg");
const can = moduleAssetUrl("recycling/intro-samples/can-red.jpg");
const carton = moduleAssetUrl("recycling/intro-samples/carton-sealed.jpg");
import './TransferVisuals.css';

export const TRANSFER_SAMPLES = [
  { name: '塑料瓶', image: bottle }, { name: '易拉罐', image: can }, { name: '纸盒', image: carton },
] as const;
export function TransferArrow() {
  return <svg shuku-edit-id="e-decc77f7-f10f-46c7-91dd-7077f18a1b54" className="rtg-transfer-arrow" viewBox="0 0 80 32" aria-hidden="true"><path shuku-edit-id="e-ad22f9da-f5b9-465d-95f7-25ea09c1ac49" d="M2 16H72M59 3L72 16L59 29" /></svg>;
}
export function TransferLock({ open = false }: { open?: boolean }) {
  return <svg shuku-edit-id="e-744e983d-5b6b-4588-9395-754908009032" className={'rtg-transfer-lock' + (open ? ' is-open' : '')} viewBox="0 0 32 34" role="img" aria-label={open ? '方案已锁定，可独立评估' : '锁定：不参与当前操作'}>
    <path shuku-edit-id="e-87569bdc-9779-4bab-b05c-3ad774f5e415" d={open ? 'M10 15V9a6 6 0 0 1 11-3' : 'M10 15V9a6 6 0 0 1 12 0v6'} />
    <rect shuku-edit-id="e-f2852149-2674-44c1-8a3f-8ccbce4b0cd4" x="6" y="15" width="20" height="16" rx="3" /><path shuku-edit-id="e-cd3e39c9-b9c3-4245-b83c-bd13abbd272f" d="M16 20v6" />
  </svg>;
}
export function TransferSlabs({ count = 5, tone = 'original' }: { count?: 1 | 5; tone?: 'original' | 'frozen' | 'trainable' | 'empty' }) {
  return <svg shuku-edit-id="e-a1d1aaf7-848c-4e66-8ded-773d1a80394c" className={'rtg-transfer-slabs is-' + tone} viewBox={count === 1 ? '0 0 120 220' : '0 0 560 220'} aria-hidden="true">
    {Array.from({ length: count }, (_, index) => <g shuku-edit-id="e-f3a7cc9a-1936-4a29-8288-77753e558351" key={index} transform={'translate(' + index * 104 + ',0)'}>
      <path shuku-edit-id="e-33d2b05f-b083-43c6-a71b-27a5264c8168" className="slab-top" d="M10 54L50 16H104L64 54Z" /><path shuku-edit-id="e-9624181c-f1b7-4167-bbfd-a6b1897fc074" className="slab-side" d="M64 54L104 16V164L64 202Z" /><path shuku-edit-id="e-53353402-381d-4e41-9910-3b3956a7c5b0" className="slab-front" d="M10 54H64V202H10Z" />
    </g>)}
  </svg>;
}
export function WeightCheckpoint() {
  return <div shuku-edit-id="e-8e57c6bd-99b0-4250-83b8-8a0871df552c" className="rtg-transfer-checkpoint" aria-label="预训练权重文件">
    <svg shuku-edit-id="e-c269ef04-81e6-468c-9db7-01f0f6219b4f" viewBox="0 0 180 210" aria-hidden="true"><path shuku-edit-id="e-1504aa09-1e4b-4aba-83fa-38db0e02a84d" d="M16 4H116L174 62V198Q174 206 166 206H16Q6 206 6 196V14Q6 4 16 4Z" /><path shuku-edit-id="e-85f119c9-8036-4a16-95cd-023b624b2d12" className="file-fold" d="M116 4V62H174" /></svg>
    <MathFormulaBlock appearance="plain" ariaLabel="theta星，预训练参数"><MathFormulaStatic latex="\theta^{*}" /></MathFormulaBlock>
  </div>;
}
export function PhotoStack({ label = '带标签的训练集' }: { label?: string }) {
  return <figure shuku-edit-id="e-e53ad870-4e16-49eb-b44f-096aad93a5f1" className="rtg-transfer-photos"><div shuku-edit-id="e-614fb1b0-b353-4eb1-92ea-11780078c4a0">{TRANSFER_SAMPLES.map(sample => <img shuku-edit-id="e-0f51f73c-50fc-4754-8516-f9967bd6a4e4" key={sample.name} src={sample.image} alt={sample.name + '样本示意'} />)}</div>
    <Typography shuku-edit-id="e-7f1aaf64-326e-49eb-91aa-d4167305ecbe" as="figcaption" variant="bodySmall" tone="accent" align="center">{label}</Typography></figure>;
}
export function DatasetSplit({ frame = 3, active, testOpen = false }: { frame?: number; active?: 'train' | 'validation' | 'test'; testOpen?: boolean }) {
  return <div shuku-edit-id="e-46aab1a5-68fc-480a-b928-78482f34c591" className="rtg-transfer-datasets" data-frame={frame} aria-label="独立样本划分；训练、验证、测试三组均包含三类，不按类别分组">
    {(['train', 'validation', 'test'] as const).map((id, index) => <figure shuku-edit-id="e-8e20fd0c-7704-4bf7-b60b-c9d32d9e7257" key={id} data-split={id} className={(index < frame ? 'is-ready ' : '') + (active === id ? 'is-active' : '')}>
      <svg shuku-edit-id="e-3c4d4bad-d734-40b2-a0f8-97c2c3c40dd7" className="rtg-transfer-datasets__bucket" viewBox="0 0 110 118" aria-hidden="true">
        <path shuku-edit-id="e-3e2e4100-4688-4166-9acb-cbacc35cddd6" className="bucket-body" d="M8 24H102V101Q55 118 8 101Z" /><ellipse shuku-edit-id="e-a0f1332b-3be7-48d3-941f-85b04154141e" className="bucket-top" cx="55" cy="24" rx="47" ry="15" />
        <g shuku-edit-id="e-34e7ec65-f13b-4aad-b688-48c25a901868" className="sample-set">
          <rect shuku-edit-id="e-79ebfed6-c8df-4afc-a63a-c75e4f2ff8f2" className="sample-card" x="15" y="43" width="25" height="55" rx="3" /><path shuku-edit-id="e-9abcbc51-4010-46c8-89a1-ff112efd2e79" className="sample-icon" d="M24 52H31V59L35 66V89H20V66L24 59ZM24 49H31" />
          <rect shuku-edit-id="e-7681f864-6efb-4e0d-88e1-7162a17a9e1f" className="sample-card" x="43" y="43" width="25" height="55" rx="3" /><rect shuku-edit-id="e-2cd3c272-c8cd-40e6-90e5-4a1931f8977d" className="sample-icon" x="49" y="55" width="13" height="34" rx="5" /><path shuku-edit-id="e-8e438773-1a30-4d6e-b7c2-6635d0855de5" className="sample-icon" d="M49 59H62M49 85H62" />
          <rect shuku-edit-id="e-e38f5f1d-58c5-4ee8-8648-f72b52d255c9" className="sample-card" x="71" y="43" width="25" height="55" rx="3" /><path shuku-edit-id="e-510cb839-22be-4995-aac7-018c41c6509f" className="sample-icon" d="M76 63L84 58L91 63V85L84 90L76 85ZM76 63L84 68L91 63M84 68V90" />
        </g>
      </svg>
      <Typography shuku-edit-id="e-577dfa4c-389d-4338-9daf-76e9e2716499" as="figcaption" variant="bodySmall" tone="accent" align="center">{['训练', '验证', '测试'][index]}</Typography>
      {id === 'test' && <span shuku-edit-id="e-840e0791-8352-4c85-8589-2c78494b95ce" className="rtg-transfer-datasets__lock"><TransferLock open={testOpen} /></span>}
    </figure>)}
  </div>;
}
export function ValidationPaths({ frame = 0, scope = 5 }: { frame?: number; scope?: number }) {
  return <div shuku-edit-id="e-551f7065-7e69-4a50-848c-11a728391e31" className="rtg-transfer-validation" data-loop-frame={frame} data-test-open={frame === 3} aria-label="两条条件分支按验证结果择一；方案确定后才独立测试，非实际训练结果">
    <div shuku-edit-id="e-42a3cf1e-3535-4ee3-885b-9e5bf0edb4db" className={'rtg-transfer-validation__origin' + (frame >= 1 ? ' is-lit' : '')}>
      <svg shuku-edit-id="e-493d6f4c-9b2e-4833-8473-aa0476473568" viewBox="0 0 40 44" aria-hidden="true"><ellipse shuku-edit-id="e-4274f1cb-3a3e-47af-a722-d375006a32e5" cx="20" cy="9" rx="16" ry="6" /><path shuku-edit-id="e-b378af9e-e7b0-452f-b134-253668a52250" d="M4 9V31C4 39 36 39 36 31V9M4 20C4 28 36 28 36 20" /></svg>
      <Typography shuku-edit-id="e-11eac816-f6af-4f33-ada5-1ae96dcad15c" variant="bodySmall" tone="accent">验证集比较</Typography>
    </div>
    <svg shuku-edit-id="e-2ebb98f5-d3ae-43b1-911a-c606c3729d32" className="rtg-transfer-validation__fork" viewBox="0 0 60 120" preserveAspectRatio="none" aria-hidden="true"><path shuku-edit-id="e-39b12f9f-3c16-4969-8f38-ecb28b0276ef" d="M0 60C24 60 24 26 58 26M0 60C24 60 24 94 58 94M50 18L58 26L50 34M50 86L58 94L50 102" /></svg>
    <div shuku-edit-id="e-2ce6fb74-68f1-44c2-b019-6f7d09417086" className={'rtg-transfer-validation__branches' + (frame >= 2 ? ' is-lit' : '')}>
      <Typography shuku-edit-id="e-d4a71bf6-47ab-4f2e-beb8-dbd17b04759e" variant="bodySmall" tone="accent">{scope === 5 ? '满足要求：保留基线' : '满足要求：保留方案'}</Typography>
      <Typography shuku-edit-id="e-d8d995a7-13fb-4711-aee3-b8c64fbf5710" variant="bodySmall" tone="accent">{scope === 5 ? '仍有空间：比较后段微调' : '仍有空间：对照基线再调整'}</Typography>
    </div>
    <svg shuku-edit-id="e-78f5dd5d-bb3b-4584-9cc3-bd534d5cbff8" className="rtg-transfer-validation__fork" viewBox="0 0 60 120" preserveAspectRatio="none" aria-hidden="true"><path shuku-edit-id="e-e82da69c-13b2-4b7c-8ecb-3974496f31b5" d="M0 26C30 26 30 60 58 60M0 94C30 94 30 60 58 60M50 52L58 60L50 68" /></svg>
    <div shuku-edit-id="e-79dd67f2-717a-4922-a80c-026d897dfa84" className={'rtg-transfer-validation__test' + (frame === 3 ? ' is-lit' : '')}>
      <TransferLock open={frame === 3} /><Typography shuku-edit-id="e-7188cde2-7bc3-4e7c-80a8-438a1eb7d3d5" variant="bodySmall" tone="accent">方案确定后<br shuku-edit-id="e-07a72b8b-460d-47f8-865c-8b477b87b0ef" />独立测试</Typography>
    </div>
  </div>;
}

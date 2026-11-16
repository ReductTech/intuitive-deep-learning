import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import './BiologicalNeuronPage.css';

const moduleAssetId = '9acfbca1-b881-457e-add6-21e0b6b855a0';
const dendriteImage = moduleAssetUrl('1.png');
const synapseImage = moduleAssetUrl('2.png');
const somaImage = moduleAssetUrl('3.png');
const axonImage = moduleAssetUrl('4.png');

const abstractions = [
  { index: '1', tone: 'blue', structure: '树突', biology: '接收信号', math: '输入', symbol: 'x₁, x₂, …, xₙ', image: dendriteImage },
  { index: '2', tone: 'green', structure: '突触', biology: '连接强弱决定影响', math: '权重', symbol: 'w₁, w₂, …, wₙ', image: synapseImage },
  { index: '3', tone: 'orange', structure: '细胞体 / 轴丘', biology: '整合信号，决定触发', math: '加权和与阈值', symbol: 'Σwᵢxᵢ ≥ θ ?', image: somaImage },
  { index: '4', tone: 'purple', structure: '轴突', biology: '把响应传向下游', math: '输出', symbol: 'y = 1 或 0', image: axonImage },
] as const;

export function BiologicalNeuronPage() {
  return (
    <ContentBlock shuku-edit-id="e-40ae47d2-80d8-4bb5-81a8-5ac97f63d816"
      headingLevel={1}
      className="ngtw-lecture-stage ngtw-biological-model"
      title="人工神经元，从生物神经元获得灵感"
      subtitle="它没有复制神经细胞，而是抽象了它处理信息的过程：接收、加权、汇总、输出。"
    >
      <ol shuku-edit-id="e-1d8cd291-0037-4364-8a26-23b2b2d870f7" className="ngtw-biological-model__steps grid grid-cols-[repeat(4,_minmax(0,_1fr))] gap-[18px] min-w-0 m-0 p-0" aria-label="从生物结构到人工神经元的四步抽象">
        {abstractions.map((item) => (
          <li shuku-edit-id="e-f14b4929-b334-41bf-aabf-fce3af1e066b" className={`ngtw-biological-model__step relative grid min-w-0 grid-rows-[112px_minmax(180px,_1fr)_166px] overflow-visible rounded-[12px] bg-[#fff] ngtw-biological-model__step--${item.tone}`} key={item.index}>
            <header shuku-edit-id="e-f1d6d0b1-b620-4018-916a-64cc920de85b" className="ngtw-biological-model__step-head grid grid-cols-[46px_minmax(0,_1fr)] items-center gap-[10px] rounded-[11px_11px_0_0] p-[8px_14px]">
              <Typography shuku-edit-id="e-2563c33f-030c-4e65-aeab-b6b4a7a0329f" as="span" variant="bodySmall" tone="inherit" className="ngtw-biological-model__step-index">{item.index}</Typography>
              <div shuku-edit-id="e-56cddb22-6388-4649-a7f2-a6c2b6ba14d1">
                <Typography shuku-edit-id="e-0612d106-a21d-48ca-bac6-f08ee17993e8" as="strong" variant="h3" tone="accent">{item.structure}</Typography>
                <Typography shuku-edit-id="e-8cf3b30d-474e-4f3e-88ef-069f865bdd4a" as="span" variant="bodySmall" tone="main">{item.biology}</Typography>
              </div>
            </header>
            <figure shuku-edit-id="e-f95cb2ff-9587-4944-b559-12bd2df73e4e" className="ngtw-biological-model__image grid min-w-0 min-h-0 place-items-center overflow-hidden m-0 p-[4px_8px]">
              <img shuku-edit-id="e-0ceb070e-402e-4660-8db1-c1d54c1e137b" src={item.image} alt={`${item.structure}：${item.biology}`} />
            </figure>
            <div shuku-edit-id="e-97d394ba-e79a-41af-be46-b2c761f3b9d2" className="ngtw-biological-model__detail grid min-w-0 content-center gap-[4px] bg-[var(--step-soft)] p-[12px_16px] ngtw-biological-model__detail--math rounded-[0_0_11px_11px]">
              <Typography shuku-edit-id="e-fc1245ba-e8f9-4ccc-9923-48b2c7017e9c" as="strong" variant="bodySmall" tone="warning">对应环节</Typography>
              <Typography shuku-edit-id="e-e5421f6b-4cdb-4ff0-9eed-612eeb4a1074" as="strong" variant="h3" tone="accent">{item.math}</Typography>
              <Typography shuku-edit-id="e-1f313a08-86f3-4643-a38e-a225bcf3f6a9" as="code" variant="body" tone="main">{item.symbol}</Typography>
            </div>
          </li>
        ))}
      </ol>
      <footer shuku-edit-id="e-27243767-150c-4445-a045-a2c699610e04" className="ngtw-biological-model__footer flex min-w-0 min-h-[76px] items-center justify-center gap-[20px] rounded-[10px] bg-[#edf4fb] p-[14px_24px]">
        <Typography shuku-edit-id="e-c278ff36-ac83-45a3-bb62-d17fbece996d" as="span" variant="bodySmall" tone="inherit" className="ngtw-biological-model__year">1943</Typography>
        <Typography shuku-edit-id="e-0a8ad1c8-865f-4eb5-9df4-1bf172ea72cd" as="strong" variant="h3" tone="accent">McCulloch × Pitts</Typography>
        <span shuku-edit-id="e-8f99f279-da87-44e4-a264-3428bad5a9d4" className="ngtw-biological-model__divider w-[1px] h-[36px] bg-[rgba(39,_68,_110,_.2)]" aria-hidden="true" />
        <Typography shuku-edit-id="e-65521371-2036-4fe6-893d-9b9ea3b85e92" variant="body" tone="main">他们把这条生物信号链写成了早期人工神经元模型。</Typography>
      </footer>
    </ContentBlock>
  );
}


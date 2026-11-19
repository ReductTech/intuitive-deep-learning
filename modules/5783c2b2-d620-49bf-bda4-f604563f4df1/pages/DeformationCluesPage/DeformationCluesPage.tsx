import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useRef, useState } from 'react';
import { Button, ContentBlock, NoticeStrip, Typography } from "@shuku/course-style/react";
const bottleUpright = moduleAssetUrl("recycling/bottle-upright.webp");
const bottleCrushedSevere = moduleAssetUrl("recycling/bottle-crushed-severe.webp");
const canUpright = moduleAssetUrl("recycling/can-upright.webp");
const canCrushed = moduleAssetUrl("recycling/can-crushed.webp");
import './DeformationCluesPage.css';

type Decision = 'changed' | 'same';
type ClueId = 'bottle-mouth' | 'bottle-surface' | 'can-opening' | 'can-material';

const clueLabels: Record<ClueId, string> = {
  'bottle-mouth': '瓶口结构仍在',
  'bottle-surface': '透明曲面仍像瓶身',
  'can-opening': '罐口与拉环仍在',
  'can-material': '金属反光仍明显',
};

export interface DeformationCluesPageProps {
  onComplete?: () => void;
}

export function DeformationCluesPage({ onComplete }: DeformationCluesPageProps) {
  const completedRef = useRef(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [discoveredClues, setDiscoveredClues] = useState<ClueId[]>([]);

  const hasBottleClue = discoveredClues.some((clue) => clue.startsWith('bottle-'));
  const hasCanClue = discoveredClues.some((clue) => clue.startsWith('can-'));
  const mastered = decision === 'same' && hasBottleClue && hasCanClue;

  const chooseDecision = (nextDecision: Decision) => {
    setDecision(nextDecision);
    if (nextDecision === 'changed') {
      setDiscoveredClues([]);
    }
  };

  const discoverClue = (clue: ClueId) => {
    if (decision !== 'same') return;
    setDiscoveredClues((current) => {
      if (current.includes(clue)) return current;
      const next = [...current, clue];
      const bottleReady = next.some((item) => item.startsWith('bottle-'));
      const canReady = next.some((item) => item.startsWith('can-'));
      if (bottleReady && canReady && !completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
      return next;
    });
  };

  const reset = () => {
    setDecision(null);
    setDiscoveredClues([]);
  };

  let feedback = '先判断：外观发生明显变化后，物体类别一定会改变吗？';
  let feedbackTone: 'blue' | 'green' | 'orange' = 'blue';

  if (decision === 'changed') {
    feedback = '外轮廓确实变了，但瓶口与罐口仍能说明物体身份。类别不由标准姿态决定。';
    feedbackTone = 'orange';
  } else if (decision === 'same' && !hasBottleClue && !hasCanClue) {
    feedback = '判断正确。现在分别在变形瓶和变形罐上点出一处仍有帮助的线索。';
  } else if (decision === 'same' && hasBottleClue && !hasCanClue) {
    feedback = '瓶子的线索找到了。再观察易拉罐，哪处结构或材质仍然明显？';
  } else if (decision === 'same' && !hasBottleClue && hasCanClue) {
    feedback = '易拉罐的线索找到了。再观察塑料瓶，哪处结构仍能帮助判断？';
  } else if (mastered) {
    feedback = '外观变化不等于类别变化。有效表示会尽量保留与类别有关的线索。';
    feedbackTone = 'green';
  }

  const renderHotspot = (
    clue: ClueId,
    positionClass: string,
  ) => {
    const discovered = discoveredClues.includes(clue);
    return (
      <button shuku-edit-id="e-b66c2f40-8f8e-415a-ae81-9b41e6cf6142"
        type="button"
        className={'rtg-deformation-clues__hotspot ' + positionClass + (discovered ? ' is-discovered' : '')}
        aria-label={'点出线索：' + clueLabels[clue]}
        aria-pressed={discovered}
        onClick={() => discoverClue(clue)}
      >
        <span shuku-edit-id="e-46d9cb4d-252e-4b41-8ff4-129cec276de5" className="rtg-deformation-clues__hotspot-ring" aria-hidden="true" />
        {discovered && (
          <span shuku-edit-id="e-25810ffc-11d0-416f-abb5-9ea7d60de016" className="rtg-deformation-clues__hotspot-label">
            <Typography shuku-edit-id="e-f2504159-8c42-481a-a985-d5fa9d0a79e3" as="span" variant="bodySmall" tone="accent">{clueLabels[clue]}</Typography>
          </span>
        )}
      </button>
    );
  };

  return (
    <ContentBlock shuku-edit-id="e-b6e2257b-5179-4bc6-9e6f-f95a6119fb1c"
      headingLevel={1}
      className="rtg-deformation-clues"
      title="压扁以后，你还能认出来吗？"
      subtitle="把正常外观和变形外观放在一起。先判断类别，再找出支撑判断的线索。"
    >
      <div shuku-edit-id="e-e1d12030-fc4a-4ef7-8b8c-45019c8cd6fc" className="rtg-deformation-clues__stage">
        <section shuku-edit-id="e-cd54ac94-9ce6-490d-989f-2575aa3f8a67" className="rtg-deformation-clues__comparison" aria-labelledby="rtg-bottle-comparison-title">
          <div shuku-edit-id="e-56205544-7625-417d-ad01-944dcebcb0dd" className="rtg-deformation-clues__comparison-head">
            <Typography shuku-edit-id="e-a0a5da09-f049-4b7d-8b3a-122684738652" as="span" variant="bodySmall" tone="warning">塑料瓶</Typography>
            <Typography shuku-edit-id="e-58ddcdd7-46ff-407c-acf5-e5e329a4a0f5" as="h2" variant="h3" tone="accent" id="rtg-bottle-comparison-title">形状改变，物体还在</Typography>
          </div>

          <div shuku-edit-id="e-ac01963b-194b-4071-aad0-027e6dc692b6" className="rtg-deformation-clues__pair">
            <figure shuku-edit-id="e-ca8a9962-c49b-48f9-9d93-1480e6077728" className="rtg-deformation-clues__object">
              <div shuku-edit-id="e-b0e72ed6-0b79-4cba-b277-270682d211ed" className="rtg-deformation-clues__object-visual">
                <img shuku-edit-id="e-bbe1efd0-f224-4016-a7c5-a113af6dc0f0" src={bottleUpright} alt="正常直立的透明塑料瓶" />
              </div>
              <figcaption shuku-edit-id="e-e2be355a-8836-4084-9215-7e3c051d2dbe">
                <Typography shuku-edit-id="e-43c690c4-4bd1-471f-9f7a-306019a7ac2d" as="strong" variant="body" tone="main">正常外观</Typography>
              </figcaption>
            </figure>

            <div shuku-edit-id="e-0417e08a-416f-42c5-9597-fae2700bd827" className="rtg-deformation-clues__morph" aria-hidden="true">
              <span shuku-edit-id="e-d43bc832-227f-43ef-bdef-1b640e671bf6" />
            </div>

            <figure shuku-edit-id="e-20c7ab1c-e38b-48b7-8d8a-6d3ec6d3aef3" className="rtg-deformation-clues__object rtg-deformation-clues__object--changed">
              <div shuku-edit-id="e-f0191204-c490-4f33-879e-327617f8a874" className="rtg-deformation-clues__object-visual">
                <img shuku-edit-id="e-af2d1f2b-3bbe-4cf5-9411-9329a284e7ba" className="rtg-deformation-clues__bottle-crushed" src={bottleCrushedSevere} alt="瓶身严重塌缩的透明塑料瓶" />
                {decision === 'same' && (
                  <div shuku-edit-id="e-573dbfef-a652-4832-9ec1-95155cf9b995" className="rtg-deformation-clues__hotspots" aria-label="塑料瓶的可选线索">
                    {renderHotspot('bottle-mouth', 'rtg-deformation-clues__hotspot--bottle-mouth')}
                    {renderHotspot('bottle-surface', 'rtg-deformation-clues__hotspot--bottle-surface')}
                  </div>
                )}
              </div>
              <figcaption shuku-edit-id="e-ab227f51-a27d-4abf-800b-2aad60003662">
                <Typography shuku-edit-id="e-5cea1e68-9259-4bba-a490-732229efdaad" as="strong" variant="body" tone="main">发生变形</Typography>
              </figcaption>
            </figure>
          </div>
        </section>

        <section shuku-edit-id="e-9e1804da-1571-4a66-a5e2-0c61d17fe238" className="rtg-deformation-clues__comparison" aria-labelledby="rtg-can-comparison-title">
          <div shuku-edit-id="e-1cb0aa9a-ff4d-48fa-bde6-701aaf2231d0" className="rtg-deformation-clues__comparison-head">
            <Typography shuku-edit-id="e-82cef4c3-4aa0-4cf2-a71d-5eb8528ae57b" as="span" variant="bodySmall" tone="warning">易拉罐</Typography>
            <Typography shuku-edit-id="e-bb25c26f-fa68-49fd-be4c-0a0c2ac422a1" as="h2" variant="h3" tone="accent" id="rtg-can-comparison-title">轮廓凹陷，线索仍在</Typography>
          </div>

          <div shuku-edit-id="e-f5f72ed7-636c-43e7-96d6-36d08691e789" className="rtg-deformation-clues__pair">
            <figure shuku-edit-id="e-ee89cddd-9368-4c5a-bab6-e5589469c5ee" className="rtg-deformation-clues__object">
              <div shuku-edit-id="e-fe14c716-c608-4935-80e3-099b7e64de76" className="rtg-deformation-clues__object-visual">
                <img shuku-edit-id="e-733de8f0-c016-4106-b4ab-58818652d86d" src={canUpright} alt="正常直立的银色易拉罐" />
              </div>
              <figcaption shuku-edit-id="e-a7678a4d-8670-42f3-b1c1-6226736d8d9d">
                <Typography shuku-edit-id="e-57bbdea8-4ecd-4f14-9810-fa0e22a69da5" as="strong" variant="body" tone="main">正常外观</Typography>
              </figcaption>
            </figure>

            <div shuku-edit-id="e-a981b3e9-54f7-4ecc-bfde-6ff08dfd7ee0" className="rtg-deformation-clues__morph" aria-hidden="true">
              <span shuku-edit-id="e-f1c6eb5d-b945-4724-bd31-47674b92aba4" />
            </div>

            <figure shuku-edit-id="e-86b81083-6721-4928-9bc3-97b3379efccb" className="rtg-deformation-clues__object rtg-deformation-clues__object--changed">
              <div shuku-edit-id="e-a1a66cde-2179-4193-837c-737a95ee63b6" className="rtg-deformation-clues__object-visual">
                <img shuku-edit-id="e-d05995c9-028e-42be-aaa1-290bcba6205e" className="rtg-deformation-clues__can-crushed" src={canCrushed} alt="被压扁的银色易拉罐" />
                {decision === 'same' && (
                  <div shuku-edit-id="e-6550b066-e6b5-430f-a673-94051f5a2b76" className="rtg-deformation-clues__hotspots" aria-label="易拉罐的可选线索">
                    {renderHotspot('can-opening', 'rtg-deformation-clues__hotspot--can-opening')}
                    {renderHotspot('can-material', 'rtg-deformation-clues__hotspot--can-material')}
                  </div>
                )}
              </div>
              <figcaption shuku-edit-id="e-35f380c5-476a-460f-9c41-0421095b1a49">
                <Typography shuku-edit-id="e-afc1b96b-86cf-4c89-a419-9c06dfbc75a3" as="strong" variant="body" tone="main">发生变形</Typography>
              </figcaption>
            </figure>
          </div>
        </section>
      </div>

      <div shuku-edit-id="e-8327307f-0124-4223-8ec7-4258fc94ad19" className="rtg-deformation-clues__question">
        <div shuku-edit-id="e-141217f6-8f03-434c-beb8-ea9d944cbe95">
          <Typography shuku-edit-id="e-a32a4ed1-0ce5-48f4-92b1-c0a68ad18efa" as="h3" variant="h3" tone="main">外观变了，类别一定变了吗？</Typography>
          <Typography shuku-edit-id="e-19b68ac4-3ed3-4191-8e4d-421225549ea3" variant="bodySmall" tone="muted">选完答案后，在两件变形物体上寻找线索。</Typography>
        </div>
        <div shuku-edit-id="e-c167c72a-71c4-4c29-b277-efd90b3d7226" className="rtg-deformation-clues__decision-options" role="group" aria-label="类别是否改变">
          <Button
            variant={decision === 'changed' ? 'warn' : 'default'}
            active={decision === 'changed'}
            aria-pressed={decision === 'changed'}
            onClick={() => chooseDecision('changed')}
          >
            <Typography shuku-edit-id="e-2af98522-143e-4710-9284-65d9dffe9658" as="span" variant="body" tone="inherit">类别变了</Typography>
          </Button>
          <Button
            variant={decision === 'same' ? 'primary' : 'default'}
            active={decision === 'same'}
            aria-pressed={decision === 'same'}
            onClick={() => chooseDecision('same')}
          >
            <Typography shuku-edit-id="e-a9815a19-6cb1-4c2b-8c42-1a10a68d8a2d" as="span" variant="body" tone="inherit">类别没变</Typography>
          </Button>
        </div>
      </div>

      <div shuku-edit-id="e-9526ad30-3d1c-40b2-89be-8076e6570d1d" className="rtg-deformation-clues__feedback">
        <NoticeStrip tone={feedbackTone} role="status" aria-live="polite">
          <Typography shuku-edit-id="e-b5c2c1de-f05f-4fa0-b399-1e22bf7c2e26" variant="body" tone="inherit">{feedback}</Typography>
        </NoticeStrip>
        {mastered && (
          <Button variant="default" onClick={reset}>
            <Typography shuku-edit-id="e-abc3a9f1-b746-43ab-a8b0-b060426b4016" as="span" variant="body" tone="inherit">重新观察</Typography>
          </Button>
        )}
      </div>
    </ContentBlock>
  );
}

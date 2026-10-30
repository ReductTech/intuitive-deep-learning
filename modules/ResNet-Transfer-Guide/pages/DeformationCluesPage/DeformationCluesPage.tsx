import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
import { useRef, useState } from 'react';
import { Button, ContentBlock, NoticeStrip, Typography } from '../../../shared/react';
const bottleUpright = moduleAssetUrl(moduleIdentity.id, "recycling/bottle-upright.png");
const bottleCrushedSevere = moduleAssetUrl(moduleIdentity.id, "recycling/bottle-crushed-severe.png");
const canUpright = moduleAssetUrl(moduleIdentity.id, "recycling/can-upright.png");
const canCrushed = moduleAssetUrl(moduleIdentity.id, "recycling/can-crushed.png");
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
      <button
        type="button"
        className={'rtg-deformation-clues__hotspot ' + positionClass + (discovered ? ' is-discovered' : '')}
        aria-label={'点出线索：' + clueLabels[clue]}
        aria-pressed={discovered}
        onClick={() => discoverClue(clue)}
      >
        <span className="rtg-deformation-clues__hotspot-ring" aria-hidden="true" />
        {discovered && (
          <span className="rtg-deformation-clues__hotspot-label">
            <Typography as="span" variant="bodySmall" tone="accent">{clueLabels[clue]}</Typography>
          </span>
        )}
      </button>
    );
  };

  return (
    <ContentBlock
      headingLevel={1}
      className="rtg-deformation-clues"
      title="压扁以后，你还能认出来吗？"
      subtitle="把正常外观和变形外观放在一起。先判断类别，再找出支撑判断的线索。"
    >
      <div className="rtg-deformation-clues__stage">
        <section className="rtg-deformation-clues__comparison" aria-labelledby="rtg-bottle-comparison-title">
          <div className="rtg-deformation-clues__comparison-head">
            <Typography as="span" variant="bodySmall" tone="warning">塑料瓶</Typography>
            <Typography as="h2" variant="h3" tone="accent" id="rtg-bottle-comparison-title">形状改变，物体还在</Typography>
          </div>

          <div className="rtg-deformation-clues__pair">
            <figure className="rtg-deformation-clues__object">
              <div className="rtg-deformation-clues__object-visual">
                <img src={bottleUpright} alt="正常直立的透明塑料瓶" />
              </div>
              <figcaption>
                <Typography as="strong" variant="body" tone="main">正常外观</Typography>
              </figcaption>
            </figure>

            <div className="rtg-deformation-clues__morph" aria-hidden="true">
              <span />
            </div>

            <figure className="rtg-deformation-clues__object rtg-deformation-clues__object--changed">
              <div className="rtg-deformation-clues__object-visual">
                <img className="rtg-deformation-clues__bottle-crushed" src={bottleCrushedSevere} alt="瓶身严重塌缩的透明塑料瓶" />
                {decision === 'same' && (
                  <div className="rtg-deformation-clues__hotspots" aria-label="塑料瓶的可选线索">
                    {renderHotspot('bottle-mouth', 'rtg-deformation-clues__hotspot--bottle-mouth')}
                    {renderHotspot('bottle-surface', 'rtg-deformation-clues__hotspot--bottle-surface')}
                  </div>
                )}
              </div>
              <figcaption>
                <Typography as="strong" variant="body" tone="main">发生变形</Typography>
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="rtg-deformation-clues__comparison" aria-labelledby="rtg-can-comparison-title">
          <div className="rtg-deformation-clues__comparison-head">
            <Typography as="span" variant="bodySmall" tone="warning">易拉罐</Typography>
            <Typography as="h2" variant="h3" tone="accent" id="rtg-can-comparison-title">轮廓凹陷，线索仍在</Typography>
          </div>

          <div className="rtg-deformation-clues__pair">
            <figure className="rtg-deformation-clues__object">
              <div className="rtg-deformation-clues__object-visual">
                <img src={canUpright} alt="正常直立的银色易拉罐" />
              </div>
              <figcaption>
                <Typography as="strong" variant="body" tone="main">正常外观</Typography>
              </figcaption>
            </figure>

            <div className="rtg-deformation-clues__morph" aria-hidden="true">
              <span />
            </div>

            <figure className="rtg-deformation-clues__object rtg-deformation-clues__object--changed">
              <div className="rtg-deformation-clues__object-visual">
                <img className="rtg-deformation-clues__can-crushed" src={canCrushed} alt="被压扁的银色易拉罐" />
                {decision === 'same' && (
                  <div className="rtg-deformation-clues__hotspots" aria-label="易拉罐的可选线索">
                    {renderHotspot('can-opening', 'rtg-deformation-clues__hotspot--can-opening')}
                    {renderHotspot('can-material', 'rtg-deformation-clues__hotspot--can-material')}
                  </div>
                )}
              </div>
              <figcaption>
                <Typography as="strong" variant="body" tone="main">发生变形</Typography>
              </figcaption>
            </figure>
          </div>
        </section>
      </div>

      <div className="rtg-deformation-clues__question">
        <div>
          <Typography as="h3" variant="h3" tone="main">外观变了，类别一定变了吗？</Typography>
          <Typography variant="bodySmall" tone="muted">选完答案后，在两件变形物体上寻找线索。</Typography>
        </div>
        <div className="rtg-deformation-clues__decision-options" role="group" aria-label="类别是否改变">
          <Button
            variant={decision === 'changed' ? 'warn' : 'default'}
            active={decision === 'changed'}
            aria-pressed={decision === 'changed'}
            onClick={() => chooseDecision('changed')}
          >
            <Typography as="span" variant="body" tone="inherit">类别变了</Typography>
          </Button>
          <Button
            variant={decision === 'same' ? 'primary' : 'default'}
            active={decision === 'same'}
            aria-pressed={decision === 'same'}
            onClick={() => chooseDecision('same')}
          >
            <Typography as="span" variant="body" tone="inherit">类别没变</Typography>
          </Button>
        </div>
      </div>

      <div className="rtg-deformation-clues__feedback">
        <NoticeStrip tone={feedbackTone} role="status" aria-live="polite">
          <Typography variant="body" tone="inherit">{feedback}</Typography>
        </NoticeStrip>
        {mastered && (
          <Button variant="default" onClick={reset}>
            <Typography as="span" variant="body" tone="inherit">重新观察</Typography>
          </Button>
        )}
      </div>
    </ContentBlock>
  );
}

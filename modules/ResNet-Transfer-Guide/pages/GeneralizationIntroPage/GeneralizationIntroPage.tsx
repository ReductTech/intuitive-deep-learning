import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
import { useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
const bottleTall = moduleAssetUrl(moduleIdentity.id, "recycling/intro-samples/bottle-tall.jpg");
const bottleCrumpled = moduleAssetUrl(moduleIdentity.id, "recycling/intro-samples/bottle-crumpled.jpg");
const canRed = moduleAssetUrl(moduleIdentity.id, "recycling/intro-samples/can-red.jpg");
const canFlattened = moduleAssetUrl(moduleIdentity.id, "recycling/intro-samples/can-flattened.jpg");
const cartonSealed = moduleAssetUrl(moduleIdentity.id, "recycling/intro-samples/carton-sealed.jpg");
const cartonDented = moduleAssetUrl(moduleIdentity.id, "recycling/intro-samples/carton-dented.jpg");
import './GeneralizationIntroPage.css';

// Appearance examples, not a recording of one physical object being crushed.
const specimens = [
  {
    id: 'bottle', label: '塑料瓶',
    normal: { src: bottleTall, width: 390, height: 612 },
    changed: { src: bottleCrumpled, width: 424, height: 612 },
    clues: [
      { id: 'bottle-mouth', label: '瓶口结构仍在', x: 56, y: 10 },
      { id: 'bottle-surface', label: '透明塑料瓶身', x: 46, y: 50 },
    ],
  },
  {
    id: 'can', label: '易拉罐',
    normal: { src: canRed, width: 412, height: 612 },
    changed: { src: canFlattened, width: 612, height: 404 },
    clues: [
      { id: 'can-opening', label: '罐口与拉环仍在', x: 54, y: 31 },
      { id: 'can-surface', label: '金属表面的反光', x: 38, y: 69 },
    ],
  },
  {
    id: 'carton', label: '纸盒',
    normal: { src: cartonSealed, width: 612, height: 408 },
    changed: { src: cartonDented, width: 612, height: 408 },
    clues: [
      { id: 'carton-flap', label: '盒口与翻盖仍在', x: 73, y: 27 },
      { id: 'carton-surface', label: '纸板表面的纹理', x: 22, y: 51 },
    ],
  },
] as const;

type SpecimenId = typeof specimens[number]['id'];

function ReplayIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9a8 8 0 1 1 0 6M4 4v5h5" /></svg>;
}

export interface GeneralizationIntroPageProps { onComplete?: () => void; }

export function GeneralizationIntroPage({ onComplete }: GeneralizationIntroPageProps) {
  const [changed, setChanged] = useState<SpecimenId[]>([]);
  const [discovered, setDiscovered] = useState<string[]>([]);
  const [activeClues, setActiveClues] = useState<Partial<Record<SpecimenId, string>>>({});
  const [hasExplored, setHasExplored] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const photoButtons = useRef<Partial<Record<SpecimenId, HTMLButtonElement | null>>>({});
  const firstClues = useRef<Partial<Record<SpecimenId, HTMLButtonElement | null>>>({});
  const hasClue = discovered.length > 0;
  const phase = hasClue ? 'question' : hasExplored ? 'observe' : 'task';
  useCompleteOnce(hasClue, onComplete);

  function showAppearance(id: SpecimenId, label: string, showChanged: boolean, keyboard = false) {
    setChanged(current => showChanged ? current.includes(id) ? current : [...current, id] : current.filter(item => item !== id));
    if (showChanged) setHasExplored(true);
    setAnnouncement(`${label}：${showChanged ? '变形外观。点击局部标记，寻找支撑判断的线索。' : '正常外观。'}`);
    // Keep focus meaningful when a thumbnail or clue becomes hidden.
    if (keyboard) requestAnimationFrame(() => {
      if (showChanged) firstClues.current[id]?.focus();
      else photoButtons.current[id]?.focus();
    });
  }

  function discover(specimenId: SpecimenId, id: string, label: string) {
    setDiscovered(current => current.includes(id) ? current : [...current, id]);
    setActiveClues(current => ({ ...current, [specimenId]: id }));
    setAnnouncement(`你找到的线索：${label}。人能抓住线索，模型怎样才能学会？`);
  }

  function reset() {
    setChanged([]);
    setDiscovered([]);
    setActiveClues({});
    setHasExplored(false);
    setAnnouncement('已恢复正常外观，可以重新观察。');
    photoButtons.current.bottle?.focus();
  }

  return (
    <ContentBlock headingLevel={1}
      className={'rtg-generalization-intro rtg-generalization-intro--merged is-' + phase} data-phase={phase}
      title="只有 300 张照片，怎样识别可回收物？"
      subtitle="塑料瓶、易拉罐、纸盒：用有限的照片，训练一个能识别新照片的分类模型。"
      onKeyDown={event => {
        // Keep native activation local: SceneDeck uses Space to change slides.
        if (event.key === ' ' && (event.target as Element).closest('button')) event.stopPropagation();
      }}>
      <div className="rtg-generalization-intro__gallery" role="group" aria-label="三类可回收物的正常与变形外观对照">
        {specimens.map((specimen, index) => {
          const isChanged = changed.includes(specimen.id);
          const foundCount = specimen.clues.filter(clue => discovered.includes(clue.id)).length;
          const togglePhoto = (event: MouseEvent<HTMLButtonElement>) => showAppearance(specimen.id, specimen.label, !isChanged, event.detail === 0);
          return <article key={specimen.id}
            className={'rtg-generalization-intro__specimen' + (isChanged ? ' is-changed' : '') + (foundCount ? ' has-clue' : '')}
            data-specimen={specimen.id} data-appearance={isChanged ? 'changed' : 'normal'}
            aria-labelledby={'rtg-intro-' + specimen.id + '-title'}>
            <header className="rtg-generalization-intro__specimen-head">
              <Typography as="span" variant="bodySmall" tone="muted" className="rtg-generalization-intro__index">0{index + 1}</Typography>
              <Typography as="h2" variant="h3" tone="accent" id={'rtg-intro-' + specimen.id + '-title'}>{specimen.label}</Typography>
              <span className="rtg-generalization-intro__identity-mark" aria-hidden="true" />
            </header>
            <div className="rtg-generalization-intro__photo-stage">
              <div className="rtg-generalization-intro__ground" aria-hidden="true" />
              {[false, true].map(changedLayer => {
                const photo = changedLayer ? specimen.changed : specimen.normal;
                const active = changedLayer === isChanged;
                return <div key={String(changedLayer)} className={'rtg-generalization-intro__image-layer' + (active ? ' is-visible' : '')} aria-hidden={!active}>
                  <div className="rtg-generalization-intro__artwork" style={{ '--photo-ratio': photo.width / photo.height } as CSSProperties}>
                    <img src={photo.src} width={photo.width} height={photo.height} draggable={false} alt={`${specimen.label}的${changedLayer ? '变形' : '正常'}外观样例`} />
                    {changedLayer && isChanged && specimen.clues.map((clue, clueIndex) => {
                      const found = discovered.includes(clue.id);
                      return <button key={clue.id} type="button"
                        ref={element => { if (clueIndex === 0) firstClues.current[specimen.id] = element; }}
                        className={'rtg-generalization-intro__clue' + (found ? ' is-discovered' : '')}
                        style={{ left: `${clue.x}%`, top: `${clue.y}%` }}
                        data-clue={clue.id} data-label-placement={clue.y > 60 ? 'above' : 'below'}
                        aria-label={`观察${specimen.label}线索：${clue.label}`} aria-pressed={found}
                        onClick={() => discover(specimen.id, clue.id, clue.label)}>
                        <span className="rtg-generalization-intro__clue-dot" aria-hidden="true">{found && <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m5 10 3 3 7-7" /></svg>}</span>
                        {found && activeClues[specimen.id] === clue.id && <Typography as="span" variant="bodySmall" tone="accent" className="rtg-generalization-intro__clue-label">{clue.label}</Typography>}
                      </button>;
                    })}
                  </div>
                </div>;
              })}
              <button ref={element => { photoButtons.current[specimen.id] = element; }} type="button" className="rtg-generalization-intro__photo-hit"
                aria-label={`查看${specimen.label}的${isChanged ? '正常' : '变形'}外观`} aria-pressed={isChanged}
                onClick={togglePhoto} />
              {isChanged && <button type="button" className="rtg-generalization-intro__reference" aria-label={`对照${specimen.label}的正常外观`}
                onClick={event => showAppearance(specimen.id, specimen.label, false, event.detail === 0)}>
                <img src={specimen.normal.src} alt="" draggable={false} />
                <Typography as="span" variant="bodySmall" tone="muted">正常外观</Typography>
              </button>}
            </div>
            <div className="rtg-generalization-intro__specimen-caption">
              <span className="rtg-generalization-intro__appearance"><span aria-hidden="true" />
                <Typography as="span" variant="bodySmall" tone={isChanged ? 'warning' : 'muted'}>{isChanged ? '变形外观' : '正常外观'}</Typography>
              </span>
              <Typography as="span" variant="bodySmall" tone="muted">{isChanged ? foundCount ? `发现 ${foundCount} 处线索` : '点局部标记，找线索' : '点照片，看另一种模样'}</Typography>
            </div>
          </article>;
        })}
      </div>
      <section className="rtg-generalization-intro__inquiry" aria-labelledby="rtg-intro-course-question">
        <div className="rtg-generalization-intro__question">
          <Typography as="span" variant="bodySmall" tone="warning">{hasClue ? '贯穿整堂课的问题' : hasExplored ? '从你的识别经验出发' : '三类物品，一个任务'}</Typography>
          <Typography as="h2" variant="h2" tone="accent" id="rtg-intro-course-question">
            {hasClue ? '你能抓住线索，模型怎样才能学会？' : hasExplored ? '模样变了，你为什么还能认出来？' : '先用你的眼睛，试一试。'}
          </Typography>
          <Typography variant="bodySmall" tone="muted">{hasClue ? '我们要训练的，不是记住旧照片，而是识别没见过的新照片。' : hasExplored ? '形状、颜色、材质、局部结构……哪些信息支撑了你的判断？' : '目标不只是认对这几张，而是认出没见过的新照片。'}</Typography>
        </div>
        {hasExplored && <button type="button" className="rtg-generalization-intro__reset" onClick={reset}><ReplayIcon /><Typography as="span" variant="bodySmall" tone="inherit">重新观察</Typography></button>}
      </section>
      <span className="rtg-generalization-intro__sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
    </ContentBlock>
  );
}

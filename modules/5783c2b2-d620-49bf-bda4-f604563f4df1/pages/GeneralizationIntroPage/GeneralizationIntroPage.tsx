import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
const bottleTall = moduleAssetUrl("recycling/intro-samples/bottle-tall.jpg");
const bottleCrumpled = moduleAssetUrl("recycling/intro-samples/bottle-crumpled.jpg");
const canRed = moduleAssetUrl("recycling/intro-samples/can-red.jpg");
const canFlattened = moduleAssetUrl("recycling/intro-samples/can-flattened.jpg");
const cartonSealed = moduleAssetUrl("recycling/intro-samples/carton-sealed.jpg");
const cartonDented = moduleAssetUrl("recycling/intro-samples/carton-dented.jpg");
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
  return <svg shuku-edit-id="e-87f944f5-4f8c-451a-b7cf-5df568834b5c" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path shuku-edit-id="e-ce87e0ad-8122-44d8-a208-e6e91d4295b4" d="M4 9a8 8 0 1 1 0 6M4 4v5h5" /></svg>;
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
    <ContentBlock shuku-edit-id="e-dfd9d163-0b07-47d1-9e2a-265439cef621" headingLevel={1}
      className={'rtg-generalization-intro rtg-generalization-intro--merged is-' + phase} data-phase={phase}
      title="只有 300 张照片，怎样识别可回收物？"
      subtitle="塑料瓶、易拉罐、纸盒：用有限的照片，训练一个能识别新照片的分类模型。"
      onKeyDown={event => {
        // Keep native activation local: SceneDeck uses Space to change slides.
        if (event.key === ' ' && (event.target as Element).closest('button')) event.stopPropagation();
      }}>
      <div shuku-edit-id="e-236d634d-0eed-4fdb-9ea7-cc0a663c150e" className="rtg-generalization-intro__gallery" role="group" aria-label="三类可回收物的正常与变形外观对照">
        {specimens.map((specimen, index) => {
          const isChanged = changed.includes(specimen.id);
          const foundCount = specimen.clues.filter(clue => discovered.includes(clue.id)).length;
          const togglePhoto = (event: MouseEvent<HTMLButtonElement>) => showAppearance(specimen.id, specimen.label, !isChanged, event.detail === 0);
          return <article shuku-edit-id="e-8349ef58-bc85-4288-8cc4-4bce987a454b" key={specimen.id}
            className={'rtg-generalization-intro__specimen' + (isChanged ? ' is-changed' : '') + (foundCount ? ' has-clue' : '')}
            data-specimen={specimen.id} data-appearance={isChanged ? 'changed' : 'normal'}
            aria-labelledby={'rtg-intro-' + specimen.id + '-title'}>
            <header shuku-edit-id="e-c6d86323-703f-4ed6-bc7f-10cf43394968" className="rtg-generalization-intro__specimen-head">
              <Typography shuku-edit-id="e-64699489-f297-49e0-a80d-77f485e1fab7" as="span" variant="bodySmall" tone="muted" className="rtg-generalization-intro__index">0{index + 1}</Typography>
              <Typography shuku-edit-id="e-b43a4eba-41b6-4449-8bf7-97446c7e89e0" as="h2" variant="h3" tone="accent" id={'rtg-intro-' + specimen.id + '-title'}>{specimen.label}</Typography>
              <span shuku-edit-id="e-02e35b50-5d02-4531-b76c-daf0badccabe" className="rtg-generalization-intro__identity-mark" aria-hidden="true" />
            </header>
            <div shuku-edit-id="e-619a1c5e-d85b-469b-a38b-2f82eea8bf22" className="rtg-generalization-intro__photo-stage">
              <div shuku-edit-id="e-b5cb1cf7-3bef-4229-b375-9a5a508751da" className="rtg-generalization-intro__ground" aria-hidden="true" />
              {[false, true].map(changedLayer => {
                const photo = changedLayer ? specimen.changed : specimen.normal;
                const active = changedLayer === isChanged;
                return <div shuku-edit-id="e-10ef853c-bdc3-453a-8e84-902bf021148a" key={String(changedLayer)} className={'rtg-generalization-intro__image-layer' + (active ? ' is-visible' : '')} aria-hidden={!active}>
                  <div shuku-edit-id="e-16452e26-91a7-4e6d-87ee-5f2f926a4d0b" className="rtg-generalization-intro__artwork" style={{ '--photo-ratio': photo.width / photo.height } as CSSProperties}>
                    <img shuku-edit-id="e-dc27ecac-de57-40ae-b6aa-13ff34c91450" src={photo.src} width={photo.width} height={photo.height} draggable={false} alt={`${specimen.label}的${changedLayer ? '变形' : '正常'}外观样例`} />
                    {changedLayer && isChanged && specimen.clues.map((clue, clueIndex) => {
                      const found = discovered.includes(clue.id);
                      return <button shuku-edit-id="e-5ae9859e-b4e5-48e9-88a7-f3136675e2bd" key={clue.id} type="button"
                        ref={element => { if (clueIndex === 0) firstClues.current[specimen.id] = element; }}
                        className={'rtg-generalization-intro__clue' + (found ? ' is-discovered' : '')}
                        style={{ left: `${clue.x}%`, top: `${clue.y}%` }}
                        data-clue={clue.id} data-label-placement={clue.y > 60 ? 'above' : 'below'}
                        aria-label={`观察${specimen.label}线索：${clue.label}`} aria-pressed={found}
                        onClick={() => discover(specimen.id, clue.id, clue.label)}>
                        <span shuku-edit-id="e-c19e8183-4735-4ad6-bab4-73f0eb9fb49a" className="rtg-generalization-intro__clue-dot" aria-hidden="true">{found && <svg shuku-edit-id="e-4581f109-961c-4a8e-9b11-b73fdf103156" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path shuku-edit-id="e-d950e8e8-5c58-4651-8600-fb9142864ef6" d="m5 10 3 3 7-7" /></svg>}</span>
                        {found && activeClues[specimen.id] === clue.id && <Typography shuku-edit-id="e-6e3964cf-83f1-4ecd-8125-51b8475b4827" as="span" variant="bodySmall" tone="accent" className="rtg-generalization-intro__clue-label">{clue.label}</Typography>}
                      </button>;
                    })}
                  </div>
                </div>;
              })}
              <button shuku-edit-id="e-f3e2e844-140f-4cf3-9e05-72f989e8af6b" ref={element => { photoButtons.current[specimen.id] = element; }} type="button" className="rtg-generalization-intro__photo-hit"
                aria-label={`查看${specimen.label}的${isChanged ? '正常' : '变形'}外观`} aria-pressed={isChanged}
                onClick={togglePhoto} />
              {isChanged && <button shuku-edit-id="e-c3e279dd-9985-4ec9-a120-2988e9170594" type="button" className="rtg-generalization-intro__reference" aria-label={`对照${specimen.label}的正常外观`}
                onClick={event => showAppearance(specimen.id, specimen.label, false, event.detail === 0)}>
                <img shuku-edit-id="e-57e23704-851b-4eb3-be01-889b87701120" src={specimen.normal.src} alt="" draggable={false} />
                <Typography shuku-edit-id="e-a82eda06-fd66-4aae-8805-c54600ff0524" as="span" variant="bodySmall" tone="muted">正常外观</Typography>
              </button>}
            </div>
            <div shuku-edit-id="e-1f25f333-54a9-4920-9d9d-3f8759f4fe1e" className="rtg-generalization-intro__specimen-caption">
              <span shuku-edit-id="e-5ed3f947-2d2e-4f43-9c96-3ebdefeef124" className="rtg-generalization-intro__appearance"><span shuku-edit-id="e-d6d5faf8-ea8e-475c-a34e-7f732b5456a5" aria-hidden="true" />
                <Typography shuku-edit-id="e-26fccbbf-4c40-45ff-ab1f-227f40695d4c" as="span" variant="bodySmall" tone={isChanged ? 'warning' : 'muted'}>{isChanged ? '变形外观' : '正常外观'}</Typography>
              </span>
              <Typography shuku-edit-id="e-e3f9a2bd-fb8e-46f4-9196-22bb1e834b04" as="span" variant="bodySmall" tone="muted">{isChanged ? foundCount ? `发现 ${foundCount} 处线索` : '点局部标记，找线索' : '点照片，看另一种模样'}</Typography>
            </div>
          </article>;
        })}
      </div>
      <section shuku-edit-id="e-1dd34f89-dcb8-4f23-94ce-067591d4d0ce" className="rtg-generalization-intro__inquiry" aria-labelledby="rtg-intro-course-question">
        <div shuku-edit-id="e-5ef95de5-04d3-4a56-9aa9-ea9c0c59ba39" className="rtg-generalization-intro__question">
          <Typography shuku-edit-id="e-3c304a6f-7af2-40f8-ba60-dc9dd37418fc" as="span" variant="bodySmall" tone="warning">{hasClue ? '贯穿整堂课的问题' : hasExplored ? '从你的识别经验出发' : '三类物品，一个任务'}</Typography>
          <Typography shuku-edit-id="e-dabba3f7-4435-43ae-86c7-3050ed0f3dd0" as="h2" variant="h2" tone="accent" id="rtg-intro-course-question">
            {hasClue ? '你能抓住线索，模型怎样才能学会？' : hasExplored ? '模样变了，你为什么还能认出来？' : '先用你的眼睛，试一试。'}
          </Typography>
          <Typography shuku-edit-id="e-7a0de8aa-cdf1-4a8d-8323-8f3127141ebe" variant="bodySmall" tone="muted">{hasClue ? '我们要训练的，不是记住旧照片，而是识别没见过的新照片。' : hasExplored ? '形状、颜色、材质、局部结构……哪些信息支撑了你的判断？' : '目标不只是认对这几张，而是认出没见过的新照片。'}</Typography>
        </div>
        {hasExplored && <button shuku-edit-id="e-ebda6d41-6cfa-4ffe-a68e-6b2af6d51518" type="button" className="rtg-generalization-intro__reset" onClick={reset}><ReplayIcon /><Typography shuku-edit-id="e-ea9dd8c1-72ef-4238-9488-b4f264f7d781" as="span" variant="bodySmall" tone="inherit">重新观察</Typography></button>}
      </section>
      <span shuku-edit-id="e-afde4171-223f-458e-931f-b6a61585ae90" className="rtg-generalization-intro__sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
    </ContentBlock>
  );
}

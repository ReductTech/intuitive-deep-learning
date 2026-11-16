import { useEffect, useRef, useState } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import { DishIcon, type DishId } from './DishIcon';
import { RNNImageSlices } from './RNNImageSlices';
import './RNNSequencePage.css';

export interface RNNSequencePageProps {
  onComplete: () => void;
}

type Modality = 'text' | 'image' | 'event';

const textCharacters = Array.from('我喜欢学习');
const imageSlices = ['7', '+', '3'];
const stepDuration = 850;

const modalities: Array<{ id: Modality; name: string; caption: string }> = [
  { id: 'text', name: '文本预测', caption: '按阅读顺序到来' },
  { id: 'image', name: '图像识别', caption: '按空间顺序排列' },
  { id: 'event', name: '事件预测', caption: '按发生顺序推测未来' },
];

const eventChoices: DishId[] = ['pie', 'steak', 'burger'];
const dishLabels: Record<DishId, string> = { pie: '苹果派', steak: '牛排', burger: '汉堡' };

export function RNNSequencePage({ onComplete }: RNNSequencePageProps) {
  const [modality, setModality] = useState<Modality>('text');
  const [textStep, setTextStep] = useState(0);
  const [imageStep, setImageStep] = useState(0);
  const [cuts, setCuts] = useState<[boolean, boolean]>([false, false]);
  const [rejected, setRejected] = useState(false);
  const [eventStep, setEventStep] = useState(0);
  const [eventSolved, setEventSolved] = useState(false);
  const [eventWrong, setEventWrong] = useState<DishId | null>(null);
  const completedRef = useRef(false);

  const cutReady = cuts[0] && cuts[1];

  const done: Record<Modality, boolean> = {
    text: textStep >= textCharacters.length,
    image: imageStep >= imageSlices.length,
    event: eventSolved,
  };

  /** 1. 文本预测：无需操控，上来就自动循环播放「我喜欢学习」 */
  useEffect(() => {
    if (modality !== 'text') return undefined;
    const timer = window.setInterval(() => {
      setTextStep((prev) => {
        // 当读完所有字（5个字）时，多停留一段时间后循环回到起点 0
        if (prev >= textCharacters.length + 1) {
          return 0;
        }
        return prev + 1;
      });
    }, stepDuration);
    return () => window.clearInterval(timer);
  }, [modality]);

  /** 2. 图像识别：切好两刀后，无需按钮，自动按时间进入网络 */
  useEffect(() => {
    if (modality !== 'image' || !cutReady) return undefined;
    const timer = window.setInterval(() => {
      setImageStep((prev) => {
        if (prev >= imageSlices.length) {
          window.clearInterval(timer);
          return imageSlices.length;
        }
        return prev + 1;
      });
    }, 900);
    return () => window.clearInterval(timer);
  }, [modality, cutReady]);

  /** 3. 事件预测：苹果派和牛排依次进入时间线，再让学习者预测明天。 */
  useEffect(() => {
    if (modality !== 'event' || eventSolved || eventStep >= 2) return undefined;
    const timer = window.setTimeout(() => setEventStep((value) => Math.min(value + 1, 2)), eventStep === 0 ? 320 : 760);
    return () => window.clearTimeout(timer);
  }, [eventSolved, eventStep, modality]);

  const switchModality = (next: Modality) => {
    setRejected(false);
    setEventWrong(null);
    setModality(next);
    if (next === 'text') setTextStep(0);
    if (next === 'image') setImageStep(0);
    if (next === 'event' && !eventSolved) setEventStep(0);
  };

  const toggleCut = (index: number) => {
    setRejected(false);
    setImageStep(0);
    setCuts((previous) => previous.map((value, position) => (position === index ? !value : value)) as [boolean, boolean]);
  };

  const predictEvent = (dish: DishId) => {
    if (eventStep < 2 || eventSolved) return;
    if (dish !== 'burger') {
      setEventWrong(dish);
      window.setTimeout(() => setEventWrong((current) => (current === dish ? null : current)), 460);
      return;
    }
    setEventWrong(null);
    setEventSolved(true);
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  const status = (() => {
    if (modality === 'text') {
      const currentIdx = Math.min(textStep, textCharacters.length - 1);
      if (textStep >= textCharacters.length) {
        return { text: '五个字循环读入中：文本的序列，就是按阅读顺序一个一个字到来并累积记忆。', tone: 'success' };
      }
      return { text: `当前正在预测「${textCharacters[currentIdx]}」，前面读到的文字均已保存在记忆中。`, tone: 'info' };
    }
    if (modality === 'image') {
      if (rejected) return { text: '这一刀切进了字形。切片要落在字与字之间。', tone: 'warning' };
      if (!cutReady) return { text: '在这张图上切两刀，把它分成 7 / + / 3 三段。切好后将自动按时间进入网络。', tone: 'info' };
      if (imageStep < imageSlices.length) return { text: `切片自动按时间步推演：当前进入网络的是「${imageSlices.slice(0, imageStep + 1).join(' ')}」。`, tone: 'info' };
      return { text: '一张静态图片被切成了 t₁ → t₂ → t₃：图像按空间顺序切分，也能成为序列。', tone: 'success' };
    }
    if (eventSolved) return { text: '事件按顺序发生，记住前面发生了什么，才能预测下一步。如果只知道今天，还能一直预测准确吗？', tone: 'success' };
    if (eventWrong) return { text: '再看一次发生顺序：昨天的卡片先出现，今天的卡片接在后面。', tone: 'warning' };
    if (eventStep < 2) return { text: '昨天和今天发生的事情正在按时间顺序进入记忆。', tone: 'info' };
    return { text: '观察昨天和今天的顺序，从三张菜品卡片中预测明天。', tone: 'info' };
  })();

  return (
    <ContentBlock shuku-edit-id="e-d7358cb0-8625-4b51-8aa3-ea569106de35"
      headingLevel={1}
      className="nrnn-sequence"
      title="记忆的研究对象：序列"
      subtitle="处理当前信息时，往往需要记住此前发生了什么。文字、图像和事件，都可以按顺序成为序列。"
    >
      <ol shuku-edit-id="e-6eb2a2d4-66ab-4940-8ff7-9465a9cdcb3e" className="nrnn-sequence__modalities">
        {modalities.map((item, index) => (
          <li shuku-edit-id="e-ff69e991-e8b2-4047-bfd6-68caac38c5ef" key={item.id}>
            <button shuku-edit-id="e-fd974f30-a1df-43d5-9690-e9df82d6eca7"
              type="button"
              className={`nrnn-sequence__modality${item.id === modality ? ' is-active' : ''}${done[item.id] ? ' is-done' : ''}`}
              aria-pressed={item.id === modality}
              onClick={() => switchModality(item.id)}
            >
              <span shuku-edit-id="e-932bc143-f99b-47e6-afd5-a60048fabe91" className="nrnn-sequence__modality-index">
                <Typography shuku-edit-id="e-0c369007-e0b0-4716-a53b-0895a6a2231c" as="span" variant="bodySmall" tone="inherit">{done[item.id] ? '✓' : index + 1}</Typography>
              </span>
              <span shuku-edit-id="e-94b47d28-d9d2-4db7-bd08-b77e8287f924" className="nrnn-sequence__modality-copy">
                <Typography shuku-edit-id="e-752bf5d6-2085-44ec-b400-001ff6f656fd" as="span" variant="body" tone="inherit">{item.name}</Typography>
                <Typography shuku-edit-id="e-6737db8e-850b-46cd-b686-e229c1fae063" as="span" variant="bodySmall" tone="inherit">{item.caption}</Typography>
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div shuku-edit-id="e-72fb587e-157b-4c8a-9487-976ef5d6a56d" className="nrnn-sequence__stage">
        {modality === 'text' && (
          <div shuku-edit-id="e-dbee4c03-54ec-411d-ac75-b267032dcf0c" className="nrnn-sequence__text">
            <div shuku-edit-id="e-b15f9108-6ad7-4bb6-a771-b26fbaeeb117" className="nrnn-sequence__text-head">
              <Typography shuku-edit-id="e-72ce811b-3fdb-4821-a9bf-f54c50f4fae1" as="span" variant="bodySmall" tone="warning">阅读顺序 → (自动循环播放)</Typography>
              <Typography shuku-edit-id="e-45122239-83e1-4fca-a0bd-357a9c49ee4f" as="span" variant="bodySmall" tone="muted">字符从左到右依次到来，一次只到一份。</Typography>
            </div>
            <div shuku-edit-id="e-7398a295-2f53-452c-867c-2a8440b0f027" className="nrnn-sequence__cards">
              {textCharacters.map((character, index) => {
                const currentDisplayStep = textStep >= textCharacters.length ? textCharacters.length : textStep;
                return (
                  <div shuku-edit-id="e-946908f6-f627-42dd-9125-2e123d1bc8aa"
                    key={`${character}-${index}`}
                    className={`nrnn-sequence__card${index < currentDisplayStep ? ' is-read' : ''}${index === currentDisplayStep ? ' is-current' : ''}`}
                  >
                    <Typography shuku-edit-id="e-904c8daf-98a8-4ca2-b92f-024ca8c2d2cf" as="span" variant="display" tone="inherit">{character}</Typography>
                  </div>
                );
              })}
            </div>
            <div shuku-edit-id="e-438677f1-7956-49c0-aba0-26ff9dfa0086" className="nrnn-sequence__memory">
              <Typography shuku-edit-id="e-0bc2cb7d-ea88-44fd-a494-1e0cee1c1071" as="span" variant="bodySmall" tone="muted" className="nrnn-sequence__memory-label">已经读进记忆</Typography>
              <div shuku-edit-id="e-75017ce8-e788-48f9-9858-9430e538ec61" className="nrnn-sequence__memory-chips">
                {textCharacters.map((character, index) => {
                  const currentDisplayStep = textStep >= textCharacters.length ? textCharacters.length : textStep;
                  return (
                    <span shuku-edit-id="e-4c0aeccf-91b8-463f-b452-608a957c9b55" key={`${character}-memory-${index}`} className={`nrnn-sequence__memory-chip${index < currentDisplayStep ? '' : ' is-empty'}`}>
                      <Typography shuku-edit-id="e-c2e52572-e92a-4064-b9cb-7123f7fa22ac" as="span" variant="bodySmall" tone="inherit">{index < currentDisplayStep ? character : '·'}</Typography>
                    </span>
                  );
                })}
              </div>
              <Typography shuku-edit-id="e-a1a3fab5-9c7d-4df9-a39e-970ae0bbed16" as="span" variant="bodySmall" tone="muted">每读一个字，就保留在记忆里，供后续预测共同决策。</Typography>
            </div>
          </div>
        )}

        {modality === 'image' && (
          <RNNImageSlices
            cuts={cuts}
            rejected={rejected}
            arrived={imageStep}
            onToggleCut={toggleCut}
            onRejectCut={() => setRejected(true)}
          />
        )}

        {modality === 'event' && (
          <section shuku-edit-id="e-1b103c34-d988-4a3b-8f7a-0b404d8faf5f" className="nrnn-sequence__event" aria-label="根据昨天和今天预测明天的事件">
            <header shuku-edit-id="e-708bc3b2-d9e0-4390-a2df-ac69f08a4cb5" className="nrnn-sequence__event-head">
              <Typography shuku-edit-id="e-391acbb4-af1f-428d-a92e-f32778620d7a" as="span" variant="bodySmall" tone="warning">事件按发生顺序进入记忆</Typography>
              <Typography shuku-edit-id="e-0b87c9d9-3278-4bed-89be-b08aebc163da" as="span" variant="bodySmall" tone="muted">观察过去，预测下一步</Typography>
            </header>
            <div shuku-edit-id="e-592f2816-ba48-4f0c-8488-57c6838829cb" className="nrnn-sequence__event-line">
              <div shuku-edit-id="e-6b4e9713-5442-4637-a6ec-4b7baca7d3ce" className={`nrnn-sequence__event-slot${eventStep >= 1 ? ' is-visible' : ''}`}>
                <Typography shuku-edit-id="e-819e5c80-0391-4415-a953-223465b3dcb6" as="span" variant="bodySmall" tone="muted">昨天</Typography>
                <div shuku-edit-id="e-f70c2f0e-07c6-41e3-995a-d0a47c9e4013" className="nrnn-sequence__dish-card"><DishIcon dish="pie" label="苹果派" /></div>
              </div>
              <Typography shuku-edit-id="e-52aa356a-1387-443d-a219-29fffe832ce9" as="span" variant="h2" tone="light" className="nrnn-sequence__event-arrow">→</Typography>
              <div shuku-edit-id="e-f36975ac-830c-45e9-b1fa-bab91ab41e1b" className={`nrnn-sequence__event-slot${eventStep >= 2 ? ' is-visible' : ''}`}>
                <Typography shuku-edit-id="e-88ae1b9a-1930-4431-a7a0-3ec5fa1de8c8" as="span" variant="bodySmall" tone="muted">今天</Typography>
                <div shuku-edit-id="e-d6f77eea-4df1-41cf-a02b-e19c36f1ac78" className="nrnn-sequence__dish-card"><DishIcon dish="steak" label="牛排" /></div>
              </div>
              <Typography shuku-edit-id="e-49af1306-9ed4-4e67-ac34-06556c03904e" as="span" variant="h2" tone="light" className="nrnn-sequence__event-arrow">→</Typography>
              <div shuku-edit-id="e-e15ec71c-dd0a-4cae-9566-6d0514d982c9" className={`nrnn-sequence__event-slot is-future${eventSolved ? ' is-solved' : ''}`}>
                <Typography shuku-edit-id="e-a3772692-2836-4400-b7af-7d174e2dab1b" as="span" variant="bodySmall" tone="muted">明天</Typography>
                <div shuku-edit-id="e-31257bea-43bc-4c11-acfb-8c3f6dc8f86a" className="nrnn-sequence__dish-card">
                  {eventSolved ? <DishIcon dish="burger" label="汉堡" /> : <Typography shuku-edit-id="e-06c33763-18cf-4cd7-8f1c-4390f3145fe6" as="span" variant="display" tone="light">?</Typography>}
                </div>
              </div>
            </div>
            <div shuku-edit-id="e-9ed1c55b-9011-4a5d-94d4-55a1cc66bb53" className={`nrnn-sequence__event-choices${eventStep >= 2 && !eventSolved ? ' is-ready' : ''}`} aria-label="选择明天的菜品">
              {eventChoices.map((dish) => (
                <button shuku-edit-id="e-569c4bff-e11d-4030-8947-3fac81dc3816"
                  type="button"
                  key={dish}
                  aria-label={dishLabels[dish]}
                  className={`nrnn-sequence__event-choice${eventWrong === dish ? ' is-wrong' : ''}`}
                  disabled={eventStep < 2 || eventSolved}
                  onClick={() => predictEvent(dish)}
                >
                  <DishIcon dish={dish} />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      <div shuku-edit-id="e-3574da9d-2d75-46a9-8182-ad28d9c9a0b2" className={`nrnn-sequence__status is-${status.tone}`}>
        <Typography shuku-edit-id="e-376a9081-8cd3-4837-9fcf-83452d13ad8b" as="p" variant="body" tone="inherit">{status.text}</Typography>
      </div>
    </ContentBlock>
  );
}

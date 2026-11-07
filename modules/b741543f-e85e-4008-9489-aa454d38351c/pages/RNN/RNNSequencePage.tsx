import { useEffect, useRef, useState } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
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
    <ContentBlock
      headingLevel={1}
      className="nrnn-sequence"
      title="记忆的研究对象：序列"
      subtitle="处理当前信息时，往往需要记住此前发生了什么。文字、图像和事件，都可以按顺序成为序列。"
    >
      <ol className="nrnn-sequence__modalities">
        {modalities.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              className={`nrnn-sequence__modality${item.id === modality ? ' is-active' : ''}${done[item.id] ? ' is-done' : ''}`}
              aria-pressed={item.id === modality}
              onClick={() => switchModality(item.id)}
            >
              <span className="nrnn-sequence__modality-index">
                <Typography as="span" variant="bodySmall" tone="inherit">{done[item.id] ? '✓' : index + 1}</Typography>
              </span>
              <span className="nrnn-sequence__modality-copy">
                <Typography as="span" variant="body" tone="inherit">{item.name}</Typography>
                <Typography as="span" variant="bodySmall" tone="inherit">{item.caption}</Typography>
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div className="nrnn-sequence__stage">
        {modality === 'text' && (
          <div className="nrnn-sequence__text">
            <div className="nrnn-sequence__text-head">
              <Typography as="span" variant="bodySmall" tone="warning">阅读顺序 → (自动循环播放)</Typography>
              <Typography as="span" variant="bodySmall" tone="muted">字符从左到右依次到来，一次只到一份。</Typography>
            </div>
            <div className="nrnn-sequence__cards">
              {textCharacters.map((character, index) => {
                const currentDisplayStep = textStep >= textCharacters.length ? textCharacters.length : textStep;
                return (
                  <div
                    key={`${character}-${index}`}
                    className={`nrnn-sequence__card${index < currentDisplayStep ? ' is-read' : ''}${index === currentDisplayStep ? ' is-current' : ''}`}
                  >
                    <Typography as="span" variant="display" tone="inherit">{character}</Typography>
                  </div>
                );
              })}
            </div>
            <div className="nrnn-sequence__memory">
              <Typography as="span" variant="bodySmall" tone="muted" className="nrnn-sequence__memory-label">已经读进记忆</Typography>
              <div className="nrnn-sequence__memory-chips">
                {textCharacters.map((character, index) => {
                  const currentDisplayStep = textStep >= textCharacters.length ? textCharacters.length : textStep;
                  return (
                    <span key={`${character}-memory-${index}`} className={`nrnn-sequence__memory-chip${index < currentDisplayStep ? '' : ' is-empty'}`}>
                      <Typography as="span" variant="bodySmall" tone="inherit">{index < currentDisplayStep ? character : '·'}</Typography>
                    </span>
                  );
                })}
              </div>
              <Typography as="span" variant="bodySmall" tone="muted">每读一个字，就保留在记忆里，供后续预测共同决策。</Typography>
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
          <section className="nrnn-sequence__event" aria-label="根据昨天和今天预测明天的事件">
            <header className="nrnn-sequence__event-head">
              <Typography as="span" variant="bodySmall" tone="warning">事件按发生顺序进入记忆</Typography>
              <Typography as="span" variant="bodySmall" tone="muted">观察过去，预测下一步</Typography>
            </header>
            <div className="nrnn-sequence__event-line">
              <div className={`nrnn-sequence__event-slot${eventStep >= 1 ? ' is-visible' : ''}`}>
                <Typography as="span" variant="bodySmall" tone="muted">昨天</Typography>
                <div className="nrnn-sequence__dish-card"><DishIcon dish="pie" label="苹果派" /></div>
              </div>
              <Typography as="span" variant="h2" tone="light" className="nrnn-sequence__event-arrow">→</Typography>
              <div className={`nrnn-sequence__event-slot${eventStep >= 2 ? ' is-visible' : ''}`}>
                <Typography as="span" variant="bodySmall" tone="muted">今天</Typography>
                <div className="nrnn-sequence__dish-card"><DishIcon dish="steak" label="牛排" /></div>
              </div>
              <Typography as="span" variant="h2" tone="light" className="nrnn-sequence__event-arrow">→</Typography>
              <div className={`nrnn-sequence__event-slot is-future${eventSolved ? ' is-solved' : ''}`}>
                <Typography as="span" variant="bodySmall" tone="muted">明天</Typography>
                <div className="nrnn-sequence__dish-card">
                  {eventSolved ? <DishIcon dish="burger" label="汉堡" /> : <Typography as="span" variant="display" tone="light">?</Typography>}
                </div>
              </div>
            </div>
            <div className={`nrnn-sequence__event-choices${eventStep >= 2 && !eventSolved ? ' is-ready' : ''}`} aria-label="选择明天的菜品">
              {eventChoices.map((dish) => (
                <button
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

      <div className={`nrnn-sequence__status is-${status.tone}`}>
        <Typography as="p" variant="body" tone="inherit">{status.text}</Typography>
      </div>
    </ContentBlock>
  );
}

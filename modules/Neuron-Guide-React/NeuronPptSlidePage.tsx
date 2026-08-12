import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { BiasThresholdTheoryBlock } from './blocks/BiasThresholdTheoryBlock';
import { BiologicalNeuronBlock } from './blocks/BiologicalNeuronBlock';
import { ExtraInputsBlock } from './blocks/ExtraInputsBlock';
import { NematodeResponseBlock } from './blocks/NematodeResponseBlock';
import { NeuronCompletionBlock, NeuronLessonFooter } from './blocks/NeuronLessonFooter';
import { NeuronDecisionBridgeBlock } from './blocks/NeuronDecisionBridgeBlock';
import { SignalDiscoveryBlock } from './blocks/SignalDiscoveryBlock';
import { WeightedSumBlock } from './blocks/WeightedSumBlock';
import { WeightedContributionTheoryBlock } from './blocks/WeightedContributionTheoryBlock';
import { NeuronLessonProvider } from './model/NeuronLessonContext';
import './neuron-guide-react.css';

const PPT_WIDTH = 1600;
const PPT_HEIGHT = 900;

interface NeuronPptSlideDefinition {
  id: string;
  title: string;
  section: string;
  render: (complete: () => void) => ReactNode;
}

export const neuronPptSlides: NeuronPptSlideDefinition[] = [
  { id: 'nematode-response', title: '只有 302 个神经元，它为什么能完成这么多行为？', section: '神经系统', render: () => <NematodeResponseBlock /> },
  { id: 'biological-structure', title: '1943 年，神经元被写成了数学模型', section: '生物学引入', render: () => <BiologicalNeuronBlock /> },
  { id: 'decision-bridge', title: '神经元究竟在做什么？', section: '从简单响应到复杂决策', render: () => <NeuronDecisionBridgeBlock /> },
  { id: 'signal-discovery', title: '让神经元帮你做一次判断', section: '输入信号', render: (complete) => <SignalDiscoveryBlock onComplete={complete} /> },
  { id: 'weighted-sum', title: '把一个现实因素，翻译成神经元能处理的输入', section: '输入信号', render: (complete) => <WeightedSumBlock onComplete={complete} /> },
  { id: 'extra-inputs', title: '从一个因素，到三个因素', section: '输入信号', render: (complete) => <ExtraInputsBlock onComplete={complete} /> },
  { id: 'weighted-contribution', title: '从加权求和到矩阵表示', section: '矩阵形式', render: () => <WeightedContributionTheoryBlock /> },
  { id: 'bias-theory', title: '从神经元的角度得到最终判断', section: '最终判断', render: () => <BiasThresholdTheoryBlock /> },
  { id: 'ending', title: '你已经搭出了一个人工神经元', section: '课程结尾', render: () => <NeuronCompletionBlock /> },
  { id: 'resources', title: '推荐资源', section: '课程结尾', render: () => <NeuronLessonFooter /> },
];

function useCanvasScale() {
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const update = () => setScale(Math.min(window.innerWidth / PPT_WIDTH, window.innerHeight / PPT_HEIGHT));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return scale;
}

function PptContentFit({ children }: { children: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const surface = surfaceRef.current;
    if (!viewport || !surface) return;

    const update = () => {
      const naturalWidth = Math.max(surface.scrollWidth, 1);
      const naturalHeight = Math.max(surface.scrollHeight, 1);
      setScale(Math.min(1, viewport.clientWidth / naturalWidth, viewport.clientHeight / naturalHeight));
    };

    update();
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(viewport);
    resizeObserver.observe(surface);
    const mutationObserver = new MutationObserver(update);
    mutationObserver.observe(surface, { childList: true, subtree: true, attributes: true });
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [children]);

  return (
    <div className="ng-ppt-slide-viewport" ref={viewportRef}>
      <div
        className="ng-ppt-slide-surface"
        ref={surfaceRef}
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

export function NeuronPptSlidePage() {
  const slideId = new URLSearchParams(window.location.search).get('slide') ?? neuronPptSlides[0].id;
  const slideIndex = Math.max(0, neuronPptSlides.findIndex((slide) => slide.id === slideId));
  const slide = neuronPptSlides[slideIndex];
  const canvasScale = useCanvasScale();
  const complete = useCallback(() => undefined, []);

  useEffect(() => {
    document.body.classList.add('ng-ppt-body');
    document.title = `${slideIndex + 1}. ${slide.title}`;
    return () => document.body.classList.remove('ng-ppt-body');
  }, [slide.title, slideIndex]);

  return (
    <div className="ng-ppt-root" data-ppt-react-slide>
      <main
        className="ng-ppt-canvas ng-react-shell"
        data-ppt-canvas
        style={{ transform: `translate(-50%, -50%) scale(${canvasScale})` }}
      >
        <PptContentFit>
          <NeuronLessonProvider>{slide.render(complete)}</NeuronLessonProvider>
        </PptContentFit>
      </main>
    </div>
  );
}

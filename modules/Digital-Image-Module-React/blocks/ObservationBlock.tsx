import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  LessonStage,
  Question,
  type QuestionCheckResult,
} from '../../shared/react';
import { ObservationCanvas } from '../components/ObservationCanvas';
import { usePersistedActivity } from '../components/usePersistedActivity';
import { reviewPixelObservation } from '../services/observationFeedback';

interface ObservationState {
  magnifierEnabled: boolean;
}

interface ObservationBlockProps {
  onComplete?: () => void;
  lessonStepComplete?: boolean;
}

function normalizeObservationState(value: unknown): ObservationState | null {
  if (typeof value !== 'object' || value === null) return null;
  return {
    magnifierEnabled:
      (value as Partial<ObservationState>).magnifierEnabled === true,
  };
}

export function ObservationBlock({
  onComplete,
  lessonStepComplete = false,
}: ObservationBlockProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [submitted, setSubmitted] = useState(lessonStepComplete);
  const observation = usePersistedActivity<ObservationState>({
    stateKey: 'activity:digital-image-observation',
    createInitial: () => ({ magnifierEnabled: false }),
    normalizeState: normalizeObservationState,
    getElement: () => rootRef.current,
  });

  const handleComplete = useCallback((result: QuestionCheckResult) => {
    if (result.empty) return;
    setSubmitted(true);
  }, []);

  useEffect(() => {
    if (submitted && !lessonStepComplete) onComplete?.();
  }, [lessonStepComplete, onComplete, submitted]);

  if (!observation.hydrated || !observation.state) {
    return (
      <LessonStage
        className="di-stage"
        title="请先用手机摄像头靠近这张图"
        description="正在准备观察画布。"
        aria-busy="true"
      />
    );
  }

  return (
    <LessonStage
      ref={rootRef}
      className="di-stage"
      title="请先用手机摄像头靠近这张图"
      description="打开手机摄像头，尽量放大并对准图像的白色和彩色区域。观察后，用一句话记录你看到的细节。"
      data-state-key="activity:digital-image-observation"
      data-telemetry-manual
    >
      <div className="di-observe-layout">
        <section className="edu-panel di-target-panel" aria-label="屏幕观察图像">
          <ObservationCanvas
            magnifierEnabled={observation.state.magnifierEnabled}
            onToggleMagnifier={() => {
              observation.commit(
                'digital_image_magnifier_toggle',
                (current) => ({
                  ...current,
                  magnifierEnabled: !current.magnifierEnabled,
                }),
                {
                  enabled: !observation.stateRef.current?.magnifierEnabled,
                },
              );
            }}
          />
        </section>
        <aside id="observationQuestion" aria-label="记录观察结果">
          <Question
            type="short"
            className={`di-observation-question${submitted ? '' : ' is-submit-hint'}`}
            title="把摄像头尽量靠近屏幕后，原本连续的颜色发生了什么变化？请具体描述你是否看到了小点、格子，或红、绿、蓝三种子像素。"
            submitText="提交观察"
            feedback={{
              empty: '请具体写下靠近屏幕后看到的结构，例如颜色是否变成小点、格子或红绿蓝子像素。',
            }}
            review={reviewPixelObservation}
            persistenceKey="digital-image-observation"
            onCheck={handleComplete}
          />
        </aside>
      </div>
    </LessonStage>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Feedback,
  FormulaBlock,
  FormulaTerm,
  LessonStage,
  Question,
  type QuestionCheckResult,
} from '../../shared/react';
import { ProbabilityBars } from '../components/ProbabilityBars';
import { ExplainedFormulaText } from '../components/ExplainedFormulaText';
import {
  formatPercent,
  INDEPENDENT_LOGITS,
  sigmoid,
  softmax,
} from '../model/lossGuideMath';

export interface MulticlassSoftmaxBlockProps {
  onComplete: () => void;
  lessonStepComplete?: boolean;
}

export function MulticlassSoftmaxBlock({
  onComplete,
  lessonStepComplete = false,
}: MulticlassSoftmaxBlockProps) {
  const completionReportedRef = useRef(false);
  const questionInteractionRef = useRef(false);
  const [softmaxRevealed, setSoftmaxRevealed] = useState(
    lessonStepComplete,
  );
  const independentProbabilities = useMemo(
    () => INDEPENDENT_LOGITS.map(sigmoid),
    [],
  );
  const normalizedProbabilities = useMemo(
    () => softmax(INDEPENDENT_LOGITS),
    [],
  );
  const independentTotal = independentProbabilities.reduce(
    (sum, value) => sum + value,
    0,
  );

  useEffect(() => {
    if (lessonStepComplete) setSoftmaxRevealed(true);
  }, [lessonStepComplete]);

  const handleAnswer = (result: QuestionCheckResult) => {
    const fromUser = questionInteractionRef.current;
    questionInteractionRef.current = false;
    if (!result.ok) return;
    setSoftmaxRevealed(true);
    if (
      !fromUser
      || lessonStepComplete
      || completionReportedRef.current
    ) {
      return;
    }
    completionReportedRef.current = true;
    onComplete();
  };

  return (
    <LessonStage
      className="lg2-block lg2-multiclass-block"
      title="为什么多个类别不能分别使用 Sigmoid？"
      description="以天气预测为例：晴、阴、雨只能选一个，三个类别的概率应合计 100%。"
    >
      <section
        className="lg2-independent-demo"
        aria-label="三个独立 Sigmoid 用于互斥天气类别的错误示范"
      >
        <div className="lg2-independent-output">
          <h3>每个类别独立使用 Sigmoid</h3>
          <FormulaBlock
            className="lg2-output-formula"
            ariaLabel="第 i 类概率等于第 i 类原始分数的 Sigmoid"
          >
            <FormulaTerm tooltip="p：模型输出的概率">p</FormulaTerm>
            <sub>
              <FormulaTerm tooltip="i：当前正在计算的天气类别编号">
                i
              </FormulaTerm>
            </sub>
            <ExplainedFormulaText text=" = " />
            <FormulaTerm tooltip="σ：Sigmoid 函数，各类别分别独立计算">
              σ
            </FormulaTerm>
            {'('}
            <FormulaTerm tooltip="z：模型给某个类别的原始分数">
              z
            </FormulaTerm>
            <sub>
              <FormulaTerm tooltip="i：当前天气类别编号">i</FormulaTerm>
            </sub>
            {')'}
          </FormulaBlock>
          <p className="lg2-formula-note">
            三个 Sigmoid 互不约束，总和可能超过 100%。
          </p>
          <ProbabilityBars
            probabilities={independentProbabilities}
            showTotal
            totalLabel="概率总和"
            totalNote="三选一应为 100%"
          />
          <Feedback
            status="wrong"
            label={`概率合计 ${formatPercent(independentTotal)}`}
            message="每一项虽然都在 0～1 之间，但三项合起来超过了 100%，不能表示晴、阴、雨三选一。"
          />
        </div>

        <fieldset
          disabled={softmaxRevealed}
          style={{ border: 0, margin: 0, minWidth: 0, padding: 0 }}
          aria-disabled={softmaxRevealed || undefined}
          onClickCapture={(event) => {
            const target = event.target;
            questionInteractionRef.current = (
              target instanceof Element
              && Boolean(target.closest('.dl-question-option'))
            );
          }}
        >
          <Question
            type="choice"
            typeLabel="单选题"
            title={`三个天气类别分别使用 Sigmoid 后，概率合计为 ${formatPercent(independentTotal)}。这能表示晴、阴、雨三选一的结果吗？`}
            options={[
              {
                key: 'A',
                value: 'no',
                label: '不能。总和超过 100%，不是有效的三选一概率分布',
              },
              {
                key: 'B',
                value: 'yes',
                label: '能。只要每一项都在 0～1 之间就可以',
              },
            ]}
            answer="no"
            feedback={{
              correct: `正确。三选一的概率和必须是 100%，而这组是 ${formatPercent(independentTotal)}。`,
              wrong: '不对。每项在 0～1 之间还不够，三项总和也必须是 100%。',
            }}
            persistenceKey="loss-guide-2-independent-sigmoid-validity"
            onCheck={handleAnswer}
          />
        </fieldset>

        {softmaxRevealed && (
          <section
            className="lg2-softmax-reveal"
            aria-label="Softmax 概率对比"
          >
            <h3>Softmax 如何让多个类别共同竞争？</h3>
            <p>
              Softmax 会把三个原始分数（logit）一起归一化，得到总和为
              100% 的类别概率。
            </p>
            <FormulaBlock
              className="lg2-softmax-formula"
              ariaLabel="Softmax 公式，当前类别指数分数除以所有类别指数分数之和"
              fraction={{
                prefix: (
                  <>
                    <FormulaTerm tooltip="p：Softmax 输出的类别概率">
                      p
                    </FormulaTerm>
                    <sub>
                      <FormulaTerm tooltip="k：当前正在计算的类别">
                        k
                      </FormulaTerm>
                    </sub>
                    <ExplainedFormulaText text=" = " />
                  </>
                ),
                numerator: (
                  <>
                    <ExplainedFormulaText text="e" />
                    <sup>
                      <FormulaTerm tooltip="z：类别的原始分数">z</FormulaTerm>
                      <sub>
                        <FormulaTerm tooltip="k：当前类别">k</FormulaTerm>
                      </sub>
                    </sup>
                  </>
                ),
                denominator: (
                  <>
                    <ExplainedFormulaText text="e" />
                    <sup>
                      <ExplainedFormulaText text="z" />
                      <sub>晴</sub>
                    </sup>
                    <ExplainedFormulaText text=" + e" />
                    <sup>
                      <ExplainedFormulaText text="z" />
                      <sub>阴</sub>
                    </sup>
                    <ExplainedFormulaText text=" + e" />
                    <sup>
                      <ExplainedFormulaText text="z" />
                      <sub>雨</sub>
                    </sup>
                  </>
                ),
              }}
            />
            <p className="lg2-formula-note">
              共同的分母保证三个概率之和为 1。
            </p>
            <div
              className="wp-softmax-preview"
              aria-label="Softmax 会让三个天气概率和为 100%"
            >
              <div className="wp-softmax-head">
                <span>同一组原始分数（logit）使用 Softmax</span>
              </div>
              <ProbabilityBars
                probabilities={normalizedProbabilities}
                showTotal
                totalLabel="概率总和"
                totalNote="晴、阴、雨共享这一份 100%"
              />
            </div>
          </section>
        )}
      </section>
    </LessonStage>
  );
}

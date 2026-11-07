import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import { useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { useAttentionLesson } from '../../model/AttentionLessonContext';
import { QKV_TASKS, type QkvTask } from '../../model/qkvRole';
import './AttentionQkvPage.css';

export function AttentionQkvPage({ onComplete, isComplete }: ActivityProps) {
  const { qkv, dispatchQkv } = useAttentionLesson();
  const [operated, setOperated] = useActivityState('C03-campus-weight-explored', false);
  const [active, setActive] = useState(false);
  const [mathReady, setMathReady] = useState(false);
  const root = useRef<HTMLElement>(null);
  const current = QKV_TASKS.find(task => task.id === qkv.task) ?? QKV_TASKS[2];
  // Bars, formulas and accessible values all read the same illustrative weights.
  const values = QKV_TASKS.map(task => ({ ...task, weight: task.id === current.id ? 0.7 : 0.1 }));

  useEffect(() => {
    let mounted = true;
    void customElements.whenDefined('math-field').then(() => { if (mounted) setMathReady(true); });
    return () => { mounted = false; };
  }, []);

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const syncVisibility = () => {
      const hidden = Boolean(element.closest('[aria-hidden="true"], [hidden]'));
      element.inert = hidden;
      setActive(!hidden && !document.hidden);
    };
    const observer = new MutationObserver(syncVisibility);
    for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
      observer.observe(ancestor, { attributes: true, attributeFilter: ['aria-hidden', 'hidden'] });
    }
    document.addEventListener('visibilitychange', syncVisibility);
    syncVisibility();
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', syncVisibility); };
  }, []);

  useEffect(() => {
    if (active && operated && !isComplete) onComplete();
  }, [active, operated, isComplete, onComplete]);

  const selectTask = (task: QkvTask) => {
    if (!active || task === current.id) return;
    dispatchQkv({ type: 'select-task', task });
    setOperated(true);
  };

  return <ContentBlock ref={root} title="用权重表示关注程度" headingLevel={1}
    subtitle="记录不变，读取比例怎样变？"
    className="attn-weight-model-page" bodyClassName="attn-weight-model-body"
    data-activity="C03" data-activity-complete={operated} data-weight-task={current.id}
    data-capture-ready={mathReady} aria-busy={!mathReady}>
    <div className="attn-weight-model-questions">
      <Typography variant="bodySmall" tone="accent">问题 Q</Typography>
      <div className="attn-weight-model-options" role="group" aria-label="问题 Q" onKeyDown={event => {
        if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.stopPropagation();
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        const focusedTask = (event.target as Element).closest<HTMLElement>('[data-weight-option]')?.dataset.weightOption ?? current.id;
        const index = Math.max(0, QKV_TASKS.findIndex(task => task.id === focusedTask));
        const next = QKV_TASKS[(index + (event.key === 'ArrowRight' ? 1 : QKV_TASKS.length - 1)) % QKV_TASKS.length].id;
        selectTask(next);
        root.current?.querySelector<HTMLElement>('[data-weight-option="' + next + '"]')?.focus();
      }}>
        {QKV_TASKS.map(task => <Button key={task.id} active={current.id === task.id}
          aria-pressed={current.id === task.id} data-weight-option={task.id}
          aria-label={task.question} onClick={() => selectTask(task.id)}>
          <Typography as="span" variant="body" tone="inherit">{task.question}</Typography>
        </Button>)}
      </div>
    </div>
    <div className="attn-weight-model-values" role="group" aria-label="四项内容不变，权重随问题改变"
      data-weight-sum={values.reduce((sum, value) => sum + value.weight, 0).toFixed(2)}>
      {values.map((value, index) => <section key={value.id}
        className={value.id === current.id ? 'is-emphasized' : ''}
        data-weight-content={value.id} data-weight-value={value.weight.toFixed(2)}>
        <MathFormulaBlock appearance="plain" ariaLabel={'内容向量 v ' + (index + 1)}>
          <MathFormulaStatic latex={'v_' + (index + 1)} />
        </MathFormulaBlock>
        <Typography variant="h3" tone="accent" className="attn-weight-model-content">{value.content}</Typography>
        <div className="attn-weight-model-track" role="meter"
          aria-label={value.content + '的示意权重'} aria-valuemin={0} aria-valuemax={1} aria-valuenow={value.weight}>
          <div style={{ width: value.weight * 100 + '%' }} />
        </div>
        <MathFormulaBlock appearance="plain" ariaLabel={'权重 w ' + (index + 1) + ' 等于 ' + value.weight.toFixed(2)}>
          <MathFormulaStatic latex={'w_' + (index + 1) + '=' + value.weight.toFixed(2)} />
        </MathFormulaBlock>
      </section>)}
    </div>
    <div className="attn-weight-model-result">
      <MathFormulaBlock appearance="plain" className="attn-weight-model-result-formula" ariaLabel="读取结果 r 等于各内容向量乘以对应权重再求和">
        <MathFormulaStatic latex={'\\boldsymbol{r}=\\sum_i w_i\\boldsymbol{v}_i'} />
      </MathFormulaBlock>
      <Typography variant="body" tone="accent" aria-live="polite">更关注「{current.content}」，仍读取全部。</Typography>
    </div>
    <footer className="attn-weight-model-footer">
      <div className="attn-weight-model-footer-top">
        <MathFormulaBlock appearance="plain" ariaLabel="权重 w 是问题 q 与内容集合 V 的函数">
          <MathFormulaStatic latex={'\\boldsymbol{w}=f(\\boldsymbol{q},V)'} />
        </MathFormulaBlock>
      </div>
      <Typography variant="bodySmall" tone="muted">手设权重，文字代表内容向量。</Typography>
    </footer>
  </ContentBlock>;
}

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import { OBSERVATION_RECORD_EVENT, OBSERVATION_RECORD_KEY, readObservationRecord } from '../AttentionGorillaExperimentPage/observationRecord';
import { CourseMaterialImage } from '../../components/CourseMaterialImage';
import './AttentionObservationCoverPage.css';

export function AttentionObservationCoverPage({ onComplete, isComplete }: { onComplete: () => void; isComplete: boolean }) {
  const [record, setRecord] = useState(readObservationRecord);
  const [completedHere, setCompletedHere] = useState(false);
  const root = useRef<HTMLElement>(null);
  const done = isComplete || completedHere;
  const hasRecall = Boolean(record.recall.trim());

  useEffect(() => {
    const refresh = () => setRecord(readObservationRecord());
    const onStorage = (event: StorageEvent) => {
      if (event.key === OBSERVATION_RECORD_KEY || event.key === null) refresh();
    };
    window.addEventListener(OBSERVATION_RECORD_EVENT, refresh);
    window.addEventListener('storage', onStorage);
    refresh();
    return () => {
      window.removeEventListener(OBSERVATION_RECORD_EVENT, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const syncVisibility = () => {
      element.inert = Boolean(element.closest('[aria-hidden="true"], [hidden]'));
      if (!element.inert) setRecord(readObservationRecord());
    };
    const observer = new MutationObserver(syncVisibility);
    for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
      observer.observe(ancestor, { attributes: true, attributeFilter: ['aria-hidden', 'hidden'] });
    }
    syncVisibility();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (completedHere && !isComplete && !document.hidden && !root.current?.closest('[aria-hidden="true"], [hidden]')) onComplete();
  }, [completedHere, isComplete, onComplete]);

  const complete = () => {
    if (done || document.hidden || !root.current
      || root.current.closest('[aria-hidden="true"], [hidden]')) return;
    setCompletedHere(true);

  };

  return <ContentBlock ref={root} headingLevel={1}
    title="同一段录像，留下了哪些信息？"
    subtitle="比较任务与观察记录。"
    className="attn-reflection-page" bodyClassName="attn-reflection-body"
    data-observation-reflection="true" data-complete={done} data-capture-ready="true">
    <div className="attn-reflection-panel">
      <div className="attn-reflection-comparison">
        <section className="attn-reflection-record" aria-label="你的记录">
          <Typography as="h2" variant="bodySmall" tone="accent" className="attn-reflection-label">你的记录</Typography>
          <div className="attn-reflection-count">
            <Typography variant="bodySmall" tone="muted">只数白衣队的传球</Typography>
            <Typography variant="h3" tone="accent" data-observation-count>
              {record.count === null ? '未计数' : '我数到 ' + record.count + ' 次'}
            </Typography>
          </div>
          <div className="attn-reflection-recall">
            <Typography variant="bodySmall" tone="accent" className="attn-reflection-label">其他印象</Typography>
            <div className="attn-reflection-recall-viewport" tabIndex={hasRecall ? 0 : undefined}
              aria-label="第一轮回忆记录"
              data-ppt-viewport="用户真实回忆记录；过多换行时可滚动阅读全文">
              <Typography variant="bodySmall" tone={hasRecall ? 'main' : 'muted'} className="attn-reflection-recall-text" data-observation-recall>
                {hasRecall ? record.recall : '未填回忆'}
              </Typography>
            </div>
          </div>
        </section>
        <section className="attn-reflection-fact" aria-label="原视频中的事实">
          <Typography as="h2" variant="bodySmall" tone="accent" className="attn-reflection-label">回看录像</Typography>
          <div className="attn-reflection-evidence">
            <figure className="attn-reflection-still">
              <div className="attn-reflection-still-image">
                <CourseMaterialImage path="observation/original-gorilla-storyboard.jpg" frame={{columns:3,rows:3,column:1,row:0}} alt="原始实验视频第28秒的完整静帧：穿大猩猩服的人经过中央，蓝圈标出其位置。原有版权署名保留。" />
                <svg viewBox="0 0 640 480" aria-hidden="true"><ellipse cx="355" cy="229" rx="80" ry="160" fill="none" stroke="var(--ui-accent)" strokeWidth="7" strokeDasharray="15 9"/></svg>
              </div>
              <Typography as="figcaption" variant="bodySmall" tone="muted"><a href="https://www.youtube.com/watch?v=vJG698U2Mvo&t=28s" target="_blank" rel="noreferrer">原视频静帧 ↗</a></Typography>
            </figure>
            <div className="attn-reflection-fact-copy"><Typography variant="h3" tone="accent">有人穿大猩猩服走过画面。</Typography>
              <Typography variant="bodySmall" tone="muted" className="attn-reflection-fact-note">它与计数任务无关。</Typography></div>
          </div>
        </section>
      </div>
      <div className="attn-reflection-conclusion">
        <Typography variant="h3" tone="accent" align="center">任务改变关注重点。</Typography>
      </div>
    </div>
    <footer className="attn-reflection-footer">
      <div className="attn-reflection-next">
        <Typography variant="bodySmall" tone="muted">人类注意仅作类比。</Typography>
      </div>
      <Button variant="primary" disabled={done} onClick={complete} data-action="complete-observation-reflection">
        <Typography as="span" variant="bodySmall" tone="inherit">{done ? '已完成' : '继续整理活动记录'}</Typography>
      </Button>
    </footer>
  </ContentBlock>;
}

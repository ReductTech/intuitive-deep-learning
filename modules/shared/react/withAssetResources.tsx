import { useEffect, useState, type ComponentType } from 'react';
import { Typography } from './typography';
import type { JsonAsset } from './moduleJson';

/** Keep lesson state unmounted until required data is ready; retry failed requests. */
export function withAssetResources<P extends object>(Lesson: ComponentType<P>, resources: readonly JsonAsset<unknown>[]) {
  return function AssetBackedLesson(props: P) {
    const [ready, setReady] = useState(() => resources.every(resource => resource.ready));
    const [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
    useEffect(() => {
      let current = true;
      Promise.all(resources.map(resource => resource.load())).then(() => {
        if (current) setReady(true);
      }, failure => { if (current) setError(failure instanceof Error ? failure.message : '资源加载失败'); });
      return () => { current = false; };
    }, [attempt]);
    if (ready) return <Lesson {...props} />;
    return <div data-capture-ready="false" aria-busy={!error} role={error ? 'alert' : 'status'} style={{ width: '100%', height: '100%', display: 'grid', placeContent: 'center', gap: 16, textAlign: 'center' }}>
      <Typography variant="body" tone={error ? 'danger' : 'muted'}>{error || '正在加载课程资源…'}</Typography>
      {error && <button type="button" onClick={() => { setError(''); setAttempt(value => value + 1); }}>重新加载</button>}
    </div>;
  };
}

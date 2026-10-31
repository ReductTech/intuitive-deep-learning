import { useEffect, useState } from 'react';
import { Button, Typography } from '../../shared/react';
import './AttentionMathRuntime.css';

/** Keep a failed lazy formula import from exposing raw LaTeX as lesson content. */
export function AttentionMathRuntime() {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      if (active && !customElements.get('math-field')) setFailed(true);
    }, 8000);
    import('../../shared/vendor/mathlive/mathlive.min.mjs')
      .then(() => { if (active) setFailed(false); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; window.clearTimeout(timeout); };
  }, []);
  if (!failed) return null;
  return <div className="attn-math-runtime-notice" role="alert">
    <Typography variant="bodySmall">公式组件未能加载，请恢复连接后刷新。</Typography>
    <Button onClick={() => window.location.reload()}>重新加载</Button>
  </div>;
}

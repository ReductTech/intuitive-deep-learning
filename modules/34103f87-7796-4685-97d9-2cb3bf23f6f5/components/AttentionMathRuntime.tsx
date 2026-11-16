import { useEffect, useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import './AttentionMathRuntime.css';

/** Keep a failed lazy formula import from exposing raw LaTeX as lesson content. */
export function AttentionMathRuntime() {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      if (active && !customElements.get('math-field')) setFailed(true);
    }, 8000);
    import("@shuku/course-style/vendor/mathlive/mathlive.min.mjs")
      .then(() => { if (active) setFailed(false); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; window.clearTimeout(timeout); };
  }, []);
  if (!failed) return null;
  return <div shuku-edit-id="e-7e90fbec-9efc-4caf-bae0-fa8b27657a52" className="attn-math-runtime-notice" role="alert">
    <Typography shuku-edit-id="e-87921c2f-a2bf-440e-92ad-f874eef7dfe8" variant="bodySmall">公式组件未能加载，请恢复连接后刷新。</Typography>
    <Button onClick={() => window.location.reload()}>重新加载</Button>
  </div>;
}

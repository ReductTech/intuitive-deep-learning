import { useEffect, useRef, useState } from 'react';
import { Hand } from 'lucide-react';
import { Typography } from "@shuku/course-style/react";
import './NumericBoardDragHint.css';

/** A gesture preview only: never changes the window or the matching score. */
export function NumericBoardDragHint() {
  const host = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    let visible = false;
    const sync = () => setActive(visible && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    if (host.current) observer.observe(host.current);
    document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, []);
  return <div shuku-edit-id="e-799e0d46-3732-452b-8641-1bc148e6be82" ref={host} className="cg-board-hint" data-active={active} aria-label="操作提示：按住窗口，向右下方拖动">
    <Typography shuku-edit-id="e-cec609e9-dfca-4895-b9f5-0b1c435544e4" className="cg-board-hint-label" variant="bodySmall" tone="inherit">按住窗口，向右下方拖动</Typography>
    <div shuku-edit-id="e-8edc3345-38c8-47d9-afe4-826b3c0c6b58" className="cg-board-hint-path" aria-hidden="true"><span shuku-edit-id="e-8875c76c-398a-4559-b7de-2d71de85e5a0" className="cg-board-hint-hand"><Hand /></span></div>
  </div>;
}

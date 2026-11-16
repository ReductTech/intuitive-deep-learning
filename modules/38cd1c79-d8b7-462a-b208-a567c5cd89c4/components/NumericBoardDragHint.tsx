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
  return <div shuku-edit-id="e-4f52e5b3-a94c-49f0-8976-6fd7e16ffdad" ref={host} className="cki-board-hint" data-active={active} aria-label="操作提示：按住窗口，向右下方拖动">
    <Typography shuku-edit-id="e-0d958076-b09d-426c-95f2-7456f7b1e469" className="cki-board-hint-label" variant="bodySmall" tone="inherit">按住窗口，向右下方拖动</Typography>
    <div shuku-edit-id="e-805a5bc2-36c0-45ff-b9e4-d9e024733d5a" className="cki-board-hint-path" aria-hidden="true"><span shuku-edit-id="e-4e24d13d-ce7c-4387-8cf9-e6d939bad6be" className="cki-board-hint-hand"><Hand /></span></div>
  </div>;
}

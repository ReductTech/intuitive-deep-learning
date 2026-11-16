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
  return <div shuku-edit-id="e-6beafb38-5882-4e95-b03e-c1f6ab35d24c" ref={host} className="spp-board-hint" data-active={active} aria-label="操作提示：按住窗口，向右下方拖动">
    <Typography shuku-edit-id="e-5879e61f-d9fd-4d0c-a6c4-ccc93f6b51c6" className="spp-board-hint-label" variant="bodySmall" tone="inherit">按住窗口，向右下方拖动</Typography>
    <div shuku-edit-id="e-ecb70bc0-9619-4292-8610-bd6bd11d4c27" className="spp-board-hint-path" aria-hidden="true"><span shuku-edit-id="e-b22b8f3a-a0e0-4ad4-811e-6b74aaf8a787" className="spp-board-hint-hand"><Hand /></span></div>
  </div>;
}

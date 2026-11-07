import { useEffect, useRef, useState } from 'react';
import { Hand } from 'lucide-react';
import { Typography } from '../../shared/react';
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
  return <div ref={host} className="spp-board-hint" data-active={active} aria-label="操作提示：按住窗口，向右下方拖动">
    <Typography className="spp-board-hint-label" variant="bodySmall" tone="inherit">按住窗口，向右下方拖动</Typography>
    <div className="spp-board-hint-path" aria-hidden="true"><span className="spp-board-hint-hand"><Hand /></span></div>
  </div>;
}

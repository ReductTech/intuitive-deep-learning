import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import './LessonPageFrame.css';
interface LessonPageFrameProps {
    children: ReactNode;
}
export function LessonPageFrame({ children }: LessonPageFrameProps) {
    const frameRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    useLayoutEffect(() => {
        const frame = frameRef.current;
        if (!frame)
            return undefined;
        const update = () => setScale(Math.min(1, (frame.clientWidth || 1600) / 1600));
        update();
        const observer = new ResizeObserver(update);
        observer.observe(frame);
        return () => observer.disconnect();
    }, []);
    return (<div shuku-edit-id="e-0eb1735c-776a-4ee1-9fcf-0c54670adc5a" ref={frameRef} className="tr-page-frame" style={{ height: 900 * scale }}>
      <div shuku-edit-id="e-379ee440-8792-4e4f-bafe-e470b2dd146f" className="tr-page-canvas" style={{ transform: 'scale(' + scale + ')' }}>
        {children}
      </div>
    </div>);
}

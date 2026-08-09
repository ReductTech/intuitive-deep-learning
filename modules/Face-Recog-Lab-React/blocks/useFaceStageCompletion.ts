import { useEffect, useRef } from 'react';

export function useFaceStageCompletion(eventName: string, onComplete: () => void) {
  const completeRef = useRef(onComplete);
  const handledRef = useRef(false);
  completeRef.current = onComplete;

  useEffect(() => {
    handledRef.current = false;
    const handleComplete = () => {
      if (handledRef.current) return;
      handledRef.current = true;
      completeRef.current();
    };
    window.addEventListener(eventName, handleComplete);
    return () => window.removeEventListener(eventName, handleComplete);
  }, [eventName]);
}

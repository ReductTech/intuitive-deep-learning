import { useEffect, useRef } from 'react';

export function useCompleteOnce(complete: boolean, onComplete?: () => void) {
  const completedRef = useRef(false);

  useEffect(() => {
    if (!complete || completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [complete, onComplete]);
}

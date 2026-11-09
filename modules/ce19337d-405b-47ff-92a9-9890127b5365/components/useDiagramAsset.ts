import { useEffect, useState } from 'react';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import outline from '../outlines.json';

/** Load the interactive SVG from the same asset host as all other course images. */
export function useDiagramAsset(relativePath: string) {
  const [markup, setMarkup] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setMarkup('');
    setFailed(false);
    fetch(moduleAssetUrl(relativePath), { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`Diagram HTTP ${response.status}`);
        return response.text();
      })
      .then(text => {
        if (!controller.signal.aborted) setMarkup(text);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [relativePath]);
  return { markup, failed };
}

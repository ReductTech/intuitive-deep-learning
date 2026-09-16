import { useCallback, useEffect, useState } from 'react';
import { loadMnistPixels } from '../model/mnistImage';
import { pickSample, sampleDigitLabel, type MnistPixels } from '../model/mnistLab';

export type MnistSampleStatus = 'loading' | 'ready' | 'error';

export interface MnistSampleValue {
  path: string;
  label: string;
  pixels: MnistPixels | null;
  status: MnistSampleStatus;
  error: string;
  /** 换一张不同的数字图片。 */
  shuffle: () => void;
}

/** 随机取一张 MNIST 数字图，并把原始 png 读成 28 × 28 的灰度像素。 */
export function useMnistSample(): MnistSampleValue {
  const [path, setPath] = useState<string>(() => pickSample(null));
  const [pixels, setPixels] = useState<MnistPixels | null>(null);
  const [status, setStatus] = useState<MnistSampleStatus>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setStatus('loading');
    setError('');
    loadMnistPixels(path)
      .then((next) => {
        if (!active) return;
        setPixels(next);
        setStatus('ready');
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setPixels(null);
        setStatus('error');
        setError(cause instanceof Error ? cause.message : '图片加载失败');
      });
    return () => { active = false; };
  }, [path]);

  const shuffle = useCallback(() => {
    setPath((current) => pickSample(current));
  }, []);

  return { path, label: sampleDigitLabel(path), pixels, status, error, shuffle };
}


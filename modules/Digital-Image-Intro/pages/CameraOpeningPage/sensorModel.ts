import { useEffect, useState } from 'react';

export const SIDE = 16;
export const channelAt = (index: number) => {
  const x = index % SIDE;
  const y = Math.floor(index / SIDE);
  return y % 2 === 0 ? (x % 2 === 0 ? 0 : 1) : (x % 2 === 0 ? 1 : 2);
};
export const channelNames = ['R', 'G', 'B'];
export const channelColors = ['#c43f52', '#228d5c', '#426ba8'];

/** Teaching model: area-average a reference photograph, then retain one CFA channel per site. */
export function useSensorSamples(url: string) {
  const [samples, setSamples] = useState<number[]>([]);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active) return;
      const size = 384;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const context = canvas.getContext('2d');
      if (!context) { setFailed(true); return; }
      const crop = Math.min(image.width, image.height);
      context.drawImage(image, (image.width - crop) / 2, (image.height - crop) / 2, crop, crop, 0, 0, size, size);
      const data = context.getImageData(0, 0, size, size).data;
      const cellSize = size / SIDE;
      const values = Array.from({ length: SIDE * SIDE }, (_, index) => {
        const x = index % SIDE;
        const y = Math.floor(index / SIDE);
        const channel = channelAt(index);
        let sum = 0;
        for (let dy = 0; dy < cellSize; dy++) for (let dx = 0; dx < cellSize; dx++) {
          sum += data[((y * cellSize + dy) * size + x * cellSize + dx) * 4 + channel];
        }
        return sum / (cellSize * cellSize * 255);
      });
      setSamples(values);
    };
    image.onerror = () => { if (active) setFailed(true); };
    image.src = url;
    return () => { active = false; };
  }, [url]);
  return { samples, failed };
}

/** Bilinear RGGB interpolation; available neighbors are averaged at image boundaries. */
export function demosaic(raw: number[]) {
  return raw.map((value, index) => [0, 1, 2].map(channel => {
    if (channelAt(index) === channel) return value;
    const x = index % SIDE;
    const y = Math.floor(index / SIDE);
    const neighbors: number[] = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= SIDE || ny < 0 || ny >= SIDE) continue;
      const i = ny * SIDE + nx;
      if (channelAt(i) === channel) neighbors.push(raw[i]);
    }
    return Math.round(neighbors.reduce((sum, v) => sum + v, 0) / neighbors.length);
  }));
}

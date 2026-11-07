import { useEffect, useRef } from 'react';
import { photoUrl } from '../data';

/** Actual image-domain additive noise, rendered from a fixed seed. */
export function NoisyPhoto({ noise, blur, brightness = 1, hue = 0 }: { noise: number; blur: number; brightness?: number; hue?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active || !canvas.current) return;
      const context = canvas.current.getContext('2d', { willReadFrequently: true });
      if (!context) return;
      context.clearRect(0, 0, 600, 400);
      context.filter = `hue-rotate(${hue}deg) brightness(${brightness}) blur(${blur}px)`;
      context.drawImage(image, 0, 0, 600, 400);
      context.filter = 'none';
      const pixels = context.getImageData(0, 0, 600, 400);
      let seed = 41;
      const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
      for (let i = 0; i < pixels.data.length; i += 4) {
        const n = (random() - .5) * noise * 2;
        for (let c = 0; c < 3; c++) pixels.data[i+c] = Math.max(0, Math.min(255, pixels.data[i+c] + n));
      }
      context.putImageData(pixels, 0, 0);
    };
    image.src = photoUrl('01-fuji-apple.png');
    return () => { active = false; };
  }, [noise, blur, brightness, hue]);
  return <canvas ref={canvas} width={600} height={400} aria-label="外观增广后的水果图像" style={{width:'min(100%, 660px)',height:'auto',maxHeight:'100%',objectFit:'contain',borderRadius:'var(--ui-radius-md)'}} />;
}

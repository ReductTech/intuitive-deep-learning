import type { ReactNode } from 'react';
import './WeatherIcon.css';

export type WeatherId = 'sun' | 'rain';

export interface WeatherIconProps {
  weather: WeatherId;
  /** 供读屏使用的名字；不传时按纯装饰处理。 */
  label?: string;
  className?: string;
}

/** 天气和菜品一样，在版面上只以图形出现。 */
const shapes: Record<WeatherId, ReactNode> = {
  sun: (
    <>
      <g fill="none" stroke="#E9A62C" strokeLinecap="round" strokeWidth="7">
        <path d="M78 50 H90" />
        <path d="M69.8 69.8 L78.3 78.3" />
        <path d="M50 78 V90" />
        <path d="M30.2 69.8 L21.7 78.3" />
        <path d="M22 50 H10" />
        <path d="M30.2 30.2 L21.7 21.7" />
        <path d="M50 22 V10" />
        <path d="M69.8 30.2 L78.3 21.7" />
      </g>
      <circle cx="50" cy="50" fill="#F6C044" r="20" />
    </>
  ),
  rain: (
    <>
      <path d="M30 58 C18 58 12 46 22 39 C24 26 44 22 53 31 C68 25 82 36 77 49 C75 55 68 58 62 58 Z" fill="#BCC9DC" />
      <g fill="none" stroke="#4E8AC9" strokeLinecap="round" strokeWidth="7">
        <path d="M36 64 L29 84" />
        <path d="M53 64 L46 84" />
        <path d="M70 64 L63 84" />
      </g>
    </>
  ),
};

export function WeatherIcon({ weather, label, className }: WeatherIconProps) {
  return (
    <svg
      className={className ? `nrnn-weather-icon ${className}` : 'nrnn-weather-icon'}
      viewBox="0 0 100 100"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {shapes[weather]}
    </svg>
  );
}

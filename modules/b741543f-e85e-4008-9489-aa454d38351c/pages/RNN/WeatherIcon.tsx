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
      <g shuku-edit-id="e-62d9ca97-0d44-4c0c-9bee-6cf25afafda3" fill="none" stroke="#E9A62C" strokeLinecap="round" strokeWidth="7">
        <path shuku-edit-id="e-cd858009-2d5e-4650-8383-99c5fae25e45" d="M78 50 H90" />
        <path shuku-edit-id="e-e46a3d9b-0698-4fb1-9757-64b95eb007c6" d="M69.8 69.8 L78.3 78.3" />
        <path shuku-edit-id="e-70bae4ab-2845-4568-b80a-12f1028dfc26" d="M50 78 V90" />
        <path shuku-edit-id="e-ada55423-19ab-4eaf-bce2-5e546320dcc8" d="M30.2 69.8 L21.7 78.3" />
        <path shuku-edit-id="e-bdda5b47-5051-49c3-ab51-bcf74716bb44" d="M22 50 H10" />
        <path shuku-edit-id="e-2a2387e9-e86c-474f-9aec-9d487ead24c9" d="M30.2 30.2 L21.7 21.7" />
        <path shuku-edit-id="e-b5f6614f-c844-4dbb-b93a-d463b5d93412" d="M50 22 V10" />
        <path shuku-edit-id="e-7ab64092-a7ba-4a66-9223-da5a99283f44" d="M69.8 30.2 L78.3 21.7" />
      </g>
      <circle shuku-edit-id="e-fa006144-7b18-497b-b9a0-ada5f5c9800a" cx="50" cy="50" fill="#F6C044" r="20" />
    </>
  ),
  rain: (
    <>
      <path shuku-edit-id="e-809b6c1b-55ee-4a30-98f3-012dd3d2d2ec" d="M30 58 C18 58 12 46 22 39 C24 26 44 22 53 31 C68 25 82 36 77 49 C75 55 68 58 62 58 Z" fill="#BCC9DC" />
      <g shuku-edit-id="e-96db6fa3-2ecc-4228-ab30-c7ab5369ad51" fill="none" stroke="#4E8AC9" strokeLinecap="round" strokeWidth="7">
        <path shuku-edit-id="e-2d149093-f1da-4d77-9028-ac627f85024c" d="M36 64 L29 84" />
        <path shuku-edit-id="e-9988284f-8416-4c35-afc5-b564556d7bbb" d="M53 64 L46 84" />
        <path shuku-edit-id="e-f8c01cf8-7f8e-4081-91dd-b418abbd122e" d="M70 64 L63 84" />
      </g>
    </>
  ),
};

export function WeatherIcon({ weather, label, className }: WeatherIconProps) {
  return (
    <svg shuku-edit-id="e-37e49c0f-5241-405b-8917-bd94dc0ed71a"
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

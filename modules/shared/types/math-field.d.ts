import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        'read-only'?: string;
        'virtual-keyboard-mode'?: string;
      };
    }
  }
}

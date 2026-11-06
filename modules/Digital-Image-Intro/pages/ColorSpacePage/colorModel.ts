export type Space = 'RGB' | 'HSV' | 'YCbCr' | 'Lab';
export type Triple = [number, number, number];
const clamp = (x: number, max = 1) => Math.max(0, Math.min(max, x));
const linear = (x: number) => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4;
const gamma = (x: number) => x <= .0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - .055;
const f = (x: number) => x > 216 / 24389 ? Math.cbrt(x) : x * 841 / 108 + 4 / 29;
const inverseF = (x: number) => x > 6 / 29 ? x ** 3 : (x - 4 / 29) * 108 / 841;
export function fromRgb(r: number, g: number, b: number, space: Space): Triple {
 if (space === 'RGB') return [r, g, b];
 if (space === 'HSV') {
  const v = Math.max(r, g, b), d = v - Math.min(r, g, b);
  const h = d === 0 ? 0 : v === r ? (g - b) / d : v === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [((h * 60) % 360 + 360) % 360, v === 0 ? 0 : d / v, v];
 }
 if (space === 'YCbCr') { const y = .299 * r + .587 * g + .114 * b; return [y, (b - y) / 1.772, (r - y) / 1.402]; }
 const R = linear(r), G = linear(g), B = linear(b);
 const x = f((.4124564 * R + .3575761 * G + .1804375 * B) / .95047), y = f(.2126729 * R + .7151522 * G + .072175 * B), z = f((.0193339 * R + .119192 * G + .9503041 * B) / 1.08883);
 return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
export function toRgb([a, b, c]: Triple, space: Space): Triple {
 if (space === 'RGB') return [clamp(a), clamp(b), clamp(c)];
 if (space === 'HSV') {
  const h = ((a % 360 + 360) % 360) / 60, s = clamp(b), v = clamp(c), chroma = s * v, x = chroma * (1 - Math.abs(h % 2 - 1)), m = v - chroma;
  const components = h < 1 ? [chroma, x, 0] : h < 2 ? [x, chroma, 0] : h < 3 ? [0, chroma, x] : h < 4 ? [0, x, chroma] : h < 5 ? [x, 0, chroma] : [chroma, 0, x];
  return components.map(n => n + m) as Triple;
 }
 if (space === 'YCbCr') return [clamp(a + 1.402 * c), clamp(a - .3441362862 * b - .7141362862 * c), clamp(a + 1.772 * b)];
 const fy = (a + 16) / 116, X = .95047 * inverseF(fy + b / 500), Y = inverseF(fy), Z = 1.08883 * inverseF(fy - c / 200);
 return [clamp(gamma(3.2404542 * X - 1.5371385 * Y - .4985314 * Z)), clamp(gamma(-.969266 * X + 1.8760108 * Y + .041556 * Z)), clamp(gamma(.0556434 * X - .2040259 * Y + 1.0572252 * Z))];
}
export function adjust(values: Triple, settings: Triple, space: Space): Triple {
 if (space === 'RGB') return values.map((v, i) => v * settings[i]) as Triple;
 if (space === 'HSV') return [values[0] + settings[0], values[1] * settings[1], values[2] * settings[2]];
 if (space === 'YCbCr') return [clamp(values[0] + settings[0] / 255), values[1] + settings[1] / 255, values[2] + settings[2] / 255];
 return [clamp(values[0] + settings[0], 100), values[1] + settings[1], values[2] + settings[2]];
}
export const defaults = (space: Space): Triple => space === 'RGB' ? [1, 1, 1] : space === 'HSV' ? [0, 1, 1] : [0, 0, 0];

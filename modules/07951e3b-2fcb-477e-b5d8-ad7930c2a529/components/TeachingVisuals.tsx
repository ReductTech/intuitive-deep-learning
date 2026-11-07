import type { CSSProperties, ReactNode } from "react";
import { Typography } from "../../shared/react";
import { Text, rainImage } from "./LessonVisuals";
import "./TeachingVisuals.css";

/** Crop only the reference photograph, never the source page's instructional text. */
export function SourceCrop({ src, rect, alt }: { src: string; rect: [number, number, number, number]; alt: string }) {
  const [x,y,w,h] = rect;
  return <div role="img" aria-label={alt} style={{ width:'100%', aspectRatio:`${w}/${h}`, backgroundImage:`url(${src})`, backgroundRepeat:'no-repeat', backgroundSize:`${1672/w*100}% ${941/h*100}%`, backgroundPosition:`${x/(1672-w)*100}% ${y/(941-h)*100}%` }} />;
}

/** Pixel thumbnails use the same centered square crop as the patch input. */
export function Patch({
  index,
  side = 14,
  size = 108,
}: {
  index: number;
  side?: number;
  size?: number;
}) {
  return (
    <div
      className="tv-patch"
      role="img"
      aria-label={`原图第 ${index + 1} 个图块`}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${rainImage})`,
        backgroundSize: `${side * 100 * (1920 / 1038)}% ${side * 100}%`,
        backgroundPosition: `${(((index % side) + (side * (1920 / 1038 - 1)) / 2) / ((side * 1920) / 1038 - 1)) * 100}% ${(Math.floor(index / side) / (side - 1)) * 100}%`,
      }}
    />
  );
}
export function Features({
  rows = 6,
  cols = 12,
  selected = -1,
  orange = false,
  seed = 0,
}: {
  rows?: number;
  cols?: number;
  selected?: number;
  orange?: boolean;
  seed?: number;
}) {
  return (
    <div
      className={`tv-features ${orange ? "tv-orange" : ""}`}
      role="img"
      aria-label={`${rows} 行特征缩略示意，颜色不是实测激活`}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: rows * cols }, (_, i) => (
        <i
          key={i}
          style={{
            opacity:
              selected >= 0 && Math.floor(i / cols) !== selected
                ? 0.12
                : 0.25 + ((i * 13 + seed * 7) % 17) / 23,
          }}
        />
      ))}
    </div>
  );
}
export function Arrow() {
  return (
    <Typography variant="h3" tone="muted" aria-hidden="true">
      →
    </Typography>
  );
}
export function VisualStage({
  label,
  children,
  active = true,
}: {
  label: string;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <div className={`tv-stage ${active ? "" : "tv-muted"}`}>
      <Text>{label}</Text>
      {children}
    </div>
  );
}
export function VectorPlot({
  vectors,
  selected = 0,
}: {
  vectors: { label: string; x: number; y: number; color?: string; labelPosition?: { left: number; top: number } }[];
  selected?: number;
}) {
  return (
    <div
      className="tv-vector-plot"
      role="img"
      aria-label="二维语义空间教学示意；箭头夹角越小，余弦相似度越高"
    >
      <svg viewBox="0 0 560 400" aria-hidden="true">
        <path d="M60 25V345H530" fill="none" stroke="#cad5e3" strokeWidth="2" />
        <path
          d="M60 75 A270 270 0 0 1 330 345"
          fill="none"
          stroke="#cad5e3"
          strokeDasharray="6 8"
        />
        {vectors.map((v, i) => (
          <g key={v.label} opacity={i === selected || i === 0 ? 1 : 0.35}>
            <path
              d={`M60 345 L${60 + v.x * 300} ${345 - v.y * 270}`}
              stroke={v.color ?? (i === 0 ? "#F07E47" : "#27446E")}
              strokeWidth={i === selected ? 6 : 3}
            />
            <circle
              cx={60 + v.x * 300}
              cy={345 - v.y * 270}
              r="7"
              fill={v.color ?? (i === 0 ? "#F07E47" : "#27446E")}
            />
          </g>
        ))}
      </svg>
      {vectors.map((v, i) => (
        <div
          key={v.label}
          className="tv-vector-label"
          style={
            {
              left: `${v.labelPosition?.left ?? ((75 + v.x * 300) / 560) * 100}%`,
              top: `${v.labelPosition?.top ?? ((310 - v.y * 270) / 400) * 100}%`,
              opacity: i === selected || i === 0 ? 1 : 0.5,
            } as CSSProperties
          }
        >
          <Text>{v.label}</Text>
        </div>
      ))}
    </div>
  );
}
export function ImageFocus({
  region,
  children,
}: {
  region?: { x: number; y: number; w: number; h: number };
  children?: ReactNode;
}) {
  return (
    <div className="tv-image-focus">
      <img src={rainImage} alt="原稿：女孩与龙猫在雨中等候" />
      {region && (
        <div
          className="tv-region"
          style={{
            left: `${region.x}%`,
            top: `${region.y}%`,
            width: `${region.w}%`,
            height: `${region.h}%`,
          }}
        />
      )}
      {children}
    </div>
  );
}

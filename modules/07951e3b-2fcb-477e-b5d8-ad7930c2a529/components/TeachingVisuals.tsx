import type { CSSProperties, ReactNode } from "react";
import { Typography } from "@shuku/course-style/react";
import { Text, rainImage } from "./LessonVisuals";
import "./TeachingVisuals.css";

/** Crop only the reference photograph, never the source page's instructional text. */
export function SourceCrop({ src, rect, alt }: { src: string; rect: [number, number, number, number]; alt: string }) {
  const [x,y,w,h] = rect;
  return <div shuku-edit-id="e-02992c5e-58bf-4c49-9f2e-27a0dab78cc3" role="img" aria-label={alt} style={{ width:'100%', aspectRatio:`${w}/${h}`, backgroundImage:`url(${src})`, backgroundRepeat:'no-repeat', backgroundSize:`${1672/w*100}% ${941/h*100}%`, backgroundPosition:`${x/(1672-w)*100}% ${y/(941-h)*100}%` }} />;
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
    <div shuku-edit-id="e-4d209498-e7eb-47bc-b3c0-e5a6a006f0a5"
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
    <div shuku-edit-id="e-bcb0feb6-5122-4e2e-bc01-25782ddf1d65"
      className={`tv-features ${orange ? "tv-orange" : ""}`}
      role="img"
      aria-label={`${rows} 行特征缩略示意，颜色不是实测激活`}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: rows * cols }, (_, i) => (
        <i shuku-edit-id="e-357b321a-ee98-4d81-806c-a6c8a42053a8"
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
    <Typography shuku-edit-id="e-6082114e-62f8-47fa-aa12-f8dd8c93eef8" variant="h3" tone="muted" aria-hidden="true">
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
    <div shuku-edit-id="e-0a647306-9c07-4a13-832c-eb3a88d75087" className={`tv-stage ${active ? "" : "tv-muted"}`}>
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
    <div shuku-edit-id="e-2c567880-f101-4c9a-aea6-f26fe6f3469f"
      className="tv-vector-plot"
      role="img"
      aria-label="二维语义空间教学示意；箭头夹角越小，余弦相似度越高"
    >
      <svg shuku-edit-id="e-c58a5546-16cb-46fa-86a2-54c492d67e8f" viewBox="0 0 560 400" aria-hidden="true">
        <path shuku-edit-id="e-64e84ae1-b76f-4f85-b35e-66a02fe5469a" d="M60 25V345H530" fill="none" stroke="#cad5e3" strokeWidth="2" />
        <path shuku-edit-id="e-f8c26dfe-1e1f-4089-be26-50ea9ddaa151"
          d="M60 75 A270 270 0 0 1 330 345"
          fill="none"
          stroke="#cad5e3"
          strokeDasharray="6 8"
        />
        {vectors.map((v, i) => (
          <g shuku-edit-id="e-6cbb5eba-8e3a-4635-8e7a-d72f4b197b1f" key={v.label} opacity={i === selected || i === 0 ? 1 : 0.35}>
            <path shuku-edit-id="e-b2996db7-e5e3-4ba9-ae5a-457310fcf3be"
              d={`M60 345 L${60 + v.x * 300} ${345 - v.y * 270}`}
              stroke={v.color ?? (i === 0 ? "#F07E47" : "#27446E")}
              strokeWidth={i === selected ? 6 : 3}
            />
            <circle shuku-edit-id="e-31307216-dd7e-42b5-99c8-7cc7f3f61353"
              cx={60 + v.x * 300}
              cy={345 - v.y * 270}
              r="7"
              fill={v.color ?? (i === 0 ? "#F07E47" : "#27446E")}
            />
          </g>
        ))}
      </svg>
      {vectors.map((v, i) => (
        <div shuku-edit-id="e-9621ae06-5a07-4011-ad2e-68cda0f6e8a8"
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
    <div shuku-edit-id="e-206e5929-5a74-4df0-b9f8-110c5e9ddab9" className="tv-image-focus">
      <img shuku-edit-id="e-67d27b82-0583-4d34-9da1-86df61cbd594" src={rainImage} alt="原稿：女孩与龙猫在雨中等候" />
      {region && (
        <div shuku-edit-id="e-638768db-641a-49f7-8082-250284b3303c"
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

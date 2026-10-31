import { createContext, useContext, useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { ContentBlock } from '../../shared/react/layout/ContentBlock';
import { Typography } from '../../shared/react/typography/Typography';
import { courseAssetUrl } from '../assets';
import outline from '../outlines.json';
import { architectureLessonIds } from '../lessonIds';
import type { StoryState } from './Story';

export const referenceAsset = (path: string) => courseAssetUrl(path);
export type Rect = readonly [number, number, number, number];
const bodyTops: Record<string, number> = {'01':180,'02':180,'03':180,'05':180,'08':195,'10':180,'12':175,'13':220,'17':225,'18':225,'22':310,'24':225};
const CropContext = createContext(180);
export const rectStyle = ([x, y, width, height]: Rect, top = 180): CSSProperties => ({ left: `${x / 16.72}%`, top: `${(y-top) / (941-top)*100}%`, width: `${width / 16.72}%`, height: `${height / (941-top)*100}%` });

/** Coordinates stay in the supplied 1672×941 page, including in a scaled deck. */
export function RefBox({ rect, children, className = '', style, ...props }: { rect: Rect; children?: ReactNode; className?: string; style?: CSSProperties } & Omit<HTMLAttributes<HTMLDivElement>, 'children'>) {
  const top = useContext(CropContext);
  return <div {...props} className={`vgr-box ${className}`} style={{ ...rectStyle(rect, top), ...style }}>{children}</div>;
}

const subtitles = [
  '从随机噪声到小猫图像，拆开每一步背后的网络调用',
  '沿 U 形路径，观察多尺度特征与 Skip Connections',
  '把当前噪声阶段编码成向量，供同一网络的多个块使用',
  '移动图像位置上的 Query，观察它怎样读取文本信息',
  '视觉状态、时间与文本，沿各自路径参与同一次预测',
  '比较像素与 latent 空间，观察采样进度与计算量',
  '区分原图编码重建与从噪声生成，理解同一个 Decoder 的作用',
  '用已知噪声监督预测，观察参数更新如何减小误差',
  '从随机 latent 出发，反复预测与更新，完成后再解码',
  '在 32 × 32 示例中选择 patch，观察展平、投影与 token 数',
  '把视觉 tokens 送入 Transformer，再恢复为空间预测',
  '时间编码产生缩放与平移参数，调节每个 Block 内的特征',
  '对照 Cross-Attention 与联合注意力的读取关系',
  '沿组件链判断生成空间与预测主干',
];

export function ReferenceCanvas({ index, source, children, title, subtitle, summary }: { index: number; source?: string; children: ReactNode; title?: string; subtitle?: string; summary?: string }) {
  const page = outline.pages.find(page => page.id === architectureLessonIds[index])!;
  const top = source ? bodyTops[source] : 180;
  const canvasHeight = (941-top)/941*900;
  const viewport = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({ scale: .96, left: 0, top: 0 });
  useLayoutEffect(() => {
    const host = viewport.current;
    if (!host) return;
    const fit = () => {
      const scale = Math.min(host.clientWidth/1600, host.clientHeight/canvasHeight);
      setLayout({scale, left:(host.clientWidth-1600*scale)/2, top:(host.clientHeight-canvasHeight*scale)/2});
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(host);
    return () => observer.disconnect();
  }, [canvasHeight]);
  return <ContentBlock className="vgr-page" headingLevel={1} title={title ?? page.title} subtitle={subtitle ?? subtitles[index]} bodyClassName="vgr-canvas" data-lesson={page.id}>
    <div ref={viewport} className="vgr-viewport">
    <CropContext.Provider value={top}>
    <div className="vga-content vgr-contents" data-reference-body-top={top} style={{width:1600,height:canvasHeight,left:layout.left,top:layout.top,transform:`scale(${layout.scale})`}}>
      {source && <img className="vgr-plate" src={referenceAsset(`visuals/reference-body-${source}.png`)} alt={`${page.title}：参考图内容区的原始图形与流程`} draggable={false} data-reference-plate={source} />}
      {children}
      {!source && <div className="vgr-native-summary"><Typography variant="h3" tone="accent">{summary}</Typography></div>}
    </div>
    </CropContext.Provider>
    </div>
  </ContentBlock>;
}

/** Diagram paths use the same cropped source coordinates as image overlays. */
export function ReferencePaths({children}: {children: ReactNode}) {
  const top = useContext(CropContext);
  return <svg className="vgr-path-overlay" viewBox={`0 ${top} 1672 ${941-top}`} aria-hidden="true">{children}</svg>;
}

export function ReferenceControls({ children, rect = [40, 778, 1592, 54], className = '' }: { children: ReactNode; rect?: Rect; className?: string }) {
  return <RefBox rect={rect} className={`vgr-controls ${className}`}>{children}</RefBox>;
}

export function ReferenceStory({ story }: { story: StoryState }) {
  return <div ref={story.anchor} className="vgr-story-anchor" data-story-step={story.step} data-story-playing={story.playing} data-story-complete={story.step === story.total - 1} />;
}

export function Cover({ rect, visible }: { rect: Rect; visible: boolean }) {
  return <RefBox rect={rect} className={`vgr-cover${visible ? ' is-open' : ''}`} aria-hidden="true" />;
}

export function LatentNoise({ progress }: { progress: number }) {
  const planes = ['395,9 522,44 522,238 433,212 433,50 395,39','273,17 423,58 423,257 318,228 318,67 273,55','142,26 306,72 306,266 203,237 203,76 142,59','9,37 190,86 190,278 9,239'];
  return <svg viewBox="0 0 530 293" className="vgr-latent-noise" data-testid="sampling-latent" data-progress={progress} role="img" aria-label={`去噪进度示意 ${Math.round(progress * 100)}%`}>
    {planes.map(points => <image key={points} href={referenceAsset('visuals/noise-prediction.png')} x="0" y="0" width="530" height="293" preserveAspectRatio="none" style={{clipPath: `polygon(${points.split(' ').map(p => {const [x,y] = p.split(',').map(Number);return `${x/5.3}% ${y/2.93}%`;}).join(',')})`}} opacity={1-progress} />)}
  </svg>;
}

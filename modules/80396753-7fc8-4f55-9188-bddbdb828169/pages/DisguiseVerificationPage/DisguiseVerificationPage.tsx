import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Button, RelatedVideos, Typography } from "@shuku/course-style/react";
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import outlines from '../../outlines.json';
import { createGameDocument, gameRelatedVideos } from '../../game';
import './DisguiseVerificationPage.css';

function ReviewButton() {
  const nextId = useRef(0);
  const [bursts, setBursts] = useState<number[]>([]);
  return <span shuku-edit-id="e-da04b74a-c457-48ba-84f9-91cdb7c53eb8" className="vfl-disguise-review">
    <Typography shuku-edit-id="e-289a7fb6-45bb-4c2f-a64c-35a9ba1cd5c6" as="button" type="button" variant="bodySmall" className="vfl-disguise-review-button" onClick={() => {
      const id = nextId.current++;
      setBursts(current => [...current.slice(-3), id]);
    }}>好评如潮</Typography>
    {bursts.map(id => <span shuku-edit-id="e-2497912d-2a4d-45b9-8371-fb4587f07c6f" key={id} className="vfl-disguise-burst" aria-hidden="true" onAnimationEnd={() => setBursts(current => current.filter(value => value !== id))}>
      {['♥', '✦', '♥', '♡', '✦', '♥'].map((symbol, index) => <span shuku-edit-id="e-75268b3c-8126-41af-a5e2-25c21a045293" key={index} className="vfl-disguise-particle" style={{
        '--burst-x': `${(index - 2.5) * 26}px`,
        '--burst-y': `${-44 - (index % 3) * 18}px`,
        '--burst-rotation': `${(index - 2.5) * 16}deg`,
      } as CSSProperties}>{symbol}</span>)}
    </span>)}
  </span>;
}

export function DisguiseVerificationPage({ onComplete, onReset }: { onComplete?: () => void; onReset?: () => void } = {}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [complete, setComplete] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const document = useMemo(() => createGameDocument(), []);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.source === frame.current?.contentWindow && event.data?.type === 'vfl:yuhuanong-complete') {
        setComplete(true);
        onComplete?.();
      }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [onComplete]);
  const restart = () => { setComplete(false); setAttempt(value => value + 1); onReset?.(); };
  return <section shuku-edit-id="e-e48657eb-eb06-4ca2-9123-ef5429c7a22a" className="vfl-disguise-page" aria-label="雨花弄游戏商店页">
    <div shuku-edit-id="e-687bb1d4-5efb-48ee-8d65-8b703969f54f" className="vfl-disguise-store">
      <header shuku-edit-id="e-7f1a69d2-0023-4f8a-a1a3-32781015aa5e" className="vfl-disguise-header">
        <Typography shuku-edit-id="e-00fd7438-e72e-4543-a75c-e00d8baf7e4d" variant="bodySmall">所有游戏 › 剧情解谜 › 雨花弄</Typography>
        <Typography shuku-edit-id="e-81a9fcac-1205-4ceb-b166-b36ff928caac" as="h1" variant="h2">雨花弄：变脸</Typography>
      </header>
      <div shuku-edit-id="e-17d8219a-c994-4df8-a1ec-78ad50d26908" className="vfl-disguise-workspace">
        <div shuku-edit-id="e-d698034c-2bab-40e3-b2df-11731d4080b1" className="vfl-disguise-player">
          <div shuku-edit-id="e-660d7eeb-147d-45b6-979e-cf9b725db276" className="vfl-disguise-screen">
            {complete ? <RelatedVideos videos={gameRelatedVideos} title="推荐视频" description="继续探索人脸特征与相似度。" /> : <iframe shuku-edit-id="e-7c61f483-7e35-4672-8d13-75b925c027b1" key={attempt} ref={frame} className="vfl-disguise-frame" title="雨花弄：变脸" srcDoc={document} allow="autoplay; fullscreen" />}
          </div>
        </div>
        <aside shuku-edit-id="e-9bce6c3f-8f7a-4d2a-9829-09a3fe82d4d2" className="vfl-disguise-details">
          <img shuku-edit-id="e-9b0fcd8f-0317-4f54-8348-00505413e365" className="vfl-disguise-cover" src={moduleAssetUrl("yuhuanong/cover.webp")} alt="雨花弄：变脸游戏封面" />
          <Typography shuku-edit-id="e-1c4789e8-1925-43bb-af07-3aa8ba1e669c" variant="bodySmall" className="vfl-disguise-description">通缉画像上的人，正是你。搜查的脚步逼近，灯下只剩一面镜子。门开之前，你能换一张脸，逃过这一劫吗？</Typography>
          <dl shuku-edit-id="e-7fdafeb0-e157-45b8-ab42-61c324dbc23b" className="vfl-disguise-facts">
            <div shuku-edit-id="e-9ffa9f50-7b8e-4e10-999b-ee141f11df6c"><Typography shuku-edit-id="e-0d1b6cf2-34c5-4043-b142-f57d25d7b1bb" as="dt" variant="bodySmall">最近评测：</Typography><dd shuku-edit-id="e-c1d3b83b-da5c-4be7-b90a-e757174856fe"><ReviewButton /></dd></div>
            <div shuku-edit-id="e-6aafffa9-f974-449a-912d-c08415246183"><Typography shuku-edit-id="e-37c82c02-cde7-447a-8fc6-a68c221231bf" as="dt" variant="bodySmall">全部评测：</Typography><dd shuku-edit-id="e-e4f28a95-33f5-4cc7-94de-60bea64dc6e5"><ReviewButton /></dd></div>
          </dl>
          <div shuku-edit-id="e-db0aa1de-ecbb-4fd2-a78d-227aab500d7d" className="vfl-disguise-tags">
            <Typography shuku-edit-id="e-5c3e496c-e3b7-4734-a670-aeafb4d0b3ea" variant="bodySmall">热门标签</Typography>
            <div shuku-edit-id="e-e169a497-824f-4f11-b118-d2157a9a05ab">{['剧情解谜', '单人', '角色扮演', '悬疑', '乔装', '潜行'].map(tag => <Typography shuku-edit-id="e-f96fe10f-7a1b-4218-9df4-cf520e3bebdd" key={tag} as="button" type="button" variant="bodySmall" className="vfl-disguise-tag">{tag}</Typography>)}</div>
          </div>
          <div shuku-edit-id="e-12da7bac-8217-4b36-b05a-ebe664845073" className="vfl-disguise-actions">
            {complete && <Typography shuku-edit-id="e-8cc15293-6bdc-4831-bec6-0c3c827ebc6b" variant="bodySmall" role="status">游戏已完成</Typography>}
            <Button onClick={restart}>重新开始</Button>
          </div>
        </aside>
      </div>

    </div>
  </section>;
}


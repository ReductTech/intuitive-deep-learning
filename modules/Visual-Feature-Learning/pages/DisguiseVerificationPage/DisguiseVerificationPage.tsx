import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Button, RelatedVideos, Typography } from '../../../shared/react';
import { moduleAssetUrl } from '../../../shared/react/assets';
import outlines from '../../outlines.json';
import { createGameDocument, gameRelatedVideos } from '../../game';
import './DisguiseVerificationPage.css';

function ReviewButton() {
  const nextId = useRef(0);
  const [bursts, setBursts] = useState<number[]>([]);
  return <span className="vfl-disguise-review">
    <Typography as="button" type="button" variant="bodySmall" className="vfl-disguise-review-button" onClick={() => {
      const id = nextId.current++;
      setBursts(current => [...current.slice(-3), id]);
    }}>好评如潮</Typography>
    {bursts.map(id => <span key={id} className="vfl-disguise-burst" aria-hidden="true" onAnimationEnd={() => setBursts(current => current.filter(value => value !== id))}>
      {['♥', '✦', '♥', '♡', '✦', '♥'].map((symbol, index) => <span key={index} className="vfl-disguise-particle" style={{
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
  return <section className="vfl-disguise-page" aria-label="雨花弄游戏商店页">
    <div className="vfl-disguise-store">
      <header className="vfl-disguise-header">
        <Typography variant="bodySmall">所有游戏 › 剧情解谜 › 雨花弄</Typography>
        <Typography as="h1" variant="h2">雨花弄：变脸</Typography>
      </header>
      <div className="vfl-disguise-workspace">
        <div className="vfl-disguise-player">
          <div className="vfl-disguise-screen">
            {complete ? <RelatedVideos videos={gameRelatedVideos} title="推荐视频" description="继续探索人脸特征与相似度。" /> : <iframe key={attempt} ref={frame} className="vfl-disguise-frame" title="雨花弄：变脸" srcDoc={document} allow="autoplay; fullscreen" />}
          </div>
        </div>
        <aside className="vfl-disguise-details">
          <img className="vfl-disguise-cover" src={moduleAssetUrl(outlines.moduleIdentity.id, 'yuhuanong/cover.png')} alt="雨花弄：变脸游戏封面" />
          <Typography variant="bodySmall" className="vfl-disguise-description">通缉画像上的人，正是你。搜查的脚步逼近，灯下只剩一面镜子。门开之前，你能换一张脸，逃过这一劫吗？</Typography>
          <dl className="vfl-disguise-facts">
            <div><Typography as="dt" variant="bodySmall">最近评测：</Typography><dd><ReviewButton /></dd></div>
            <div><Typography as="dt" variant="bodySmall">全部评测：</Typography><dd><ReviewButton /></dd></div>
          </dl>
          <div className="vfl-disguise-tags">
            <Typography variant="bodySmall">热门标签</Typography>
            <div>{['剧情解谜', '单人', '角色扮演', '悬疑', '乔装', '潜行'].map(tag => <Typography key={tag} as="button" type="button" variant="bodySmall" className="vfl-disguise-tag">{tag}</Typography>)}</div>
          </div>
          <div className="vfl-disguise-actions">
            {complete && <Typography variant="bodySmall" role="status">游戏已完成</Typography>}
            <Button onClick={restart}>重新开始</Button>
          </div>
        </aside>
      </div>

    </div>
  </section>;
}


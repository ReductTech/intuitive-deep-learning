import type {useAutoplay} from './useAutoplay';
import './NarrationControls.css';

export function NarrationSubtitles({player}:{player:ReturnType<typeof useAutoplay>}){
 if(!player.showSubtitles||!player.subtitle)return null;
 return <div className="cw-narration-subtitles" aria-label="讲解字幕" aria-live="off"><span>{player.subtitle}</span></div>;
}

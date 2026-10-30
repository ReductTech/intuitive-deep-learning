import { useState } from 'react';
import { Button } from '../../shared/react/controls/Button';
import { ContentBlock } from '../../shared/react/layout/ContentBlock';
import { Typography } from '../../shared/react/typography/Typography';
import { ReferenceVisual } from '../components/Diagrams';
import { useStory } from '../components/Story';
import outline from '../outlines.json';
import './ArchitectureCover.css';

export function ArchitectureCover() {
  const page = outline.pages.find(page=>page.id==='architecture-opening')!;
  const story = useStory(['收到一封奇怪的委托','相纸已经准备好','照片慢慢显现','交片后发现没有人按过快门'],1200);
  const [flipped,setFlipped] = useState(false);
  const developed = story.step>=2;
  return <ContentBlock className="vgr-page vgr-cover-page" headingLevel={1} title={page.title} subtitle="想象一下：你收到一封奇怪的摄影委托。" bodyClassName="vga-content vgr-cover-body" data-lesson={page.id}>
    <div className="vgr-cover-scene">
      <div className="vgr-cover-letter">
        <div className="vgr-cover-letterhead"><Typography variant="bodySmall" tone="muted">今天的委托</Typography><Typography variant="bodySmall" tone="warning">急件</Typography></div>
        <Typography variant="h3" tone="accent">请拍一张<br/>小猫认真复习的照片。</Typography>
        <div className="vgr-cover-postscript"><Typography variant="bodySmall" tone="muted">备注</Typography><Typography variant="body" tone="accent">相机？没有。<br/>小猫？也没来。</Typography></div>
        <Typography variant="bodySmall" tone="muted">但客户已经在等交片了。</Typography>
      </div>
      <div className="vgr-cover-photo-area">
        <Button className="vgr-cover-photo-button" data-testid="cover-photo" aria-label={flipped?'翻回照片正面':'翻看照片背面的线索'} aria-pressed={flipped} disabled={!developed} onClick={()=>setFlipped(value=>!value)}>
          <span className={'vgr-cover-snapshot'+(flipped?' is-flipped':'')} data-side={flipped?'back':'front'}>
            <span className="vgr-cover-photo-front" aria-hidden={flipped}>
              <span className={'vgr-cover-photo-image'+(developed?' is-developed':'')}>
                <ReferenceVisual name="cat" alt="情景中的交付图像：橘猫正趴在打开的书本上"/>
                {!developed && <span className="vgr-cover-empty-paper"><Typography as="span" variant="h3" tone="muted">?</Typography></span>}
              </span>
              <Typography as="span" variant="bodySmall" tone="muted">{developed?'一张没人拍过的照片':'一张空白相纸'}</Typography>
            </span>
            <span className="vgr-cover-photo-back" aria-hidden={!flipped}>
              <Typography as="span" variant="bodySmall" tone="warning">照片背面的线索</Typography>
              <Typography as="span" variant="h3" tone="accent">快门次数：0</Typography>
              <Typography as="span" variant="body" tone="accent">没有拍摄现场。<br/>起点，只有那一句话。</Typography>
              <Typography as="span" variant="bodySmall" tone="muted">再点一下，翻回照片。</Typography>
            </span>
          </span>
        </Button>
        <div className={'vgr-cover-stamp'+(story.step>=3?' is-visible':'')} aria-hidden={story.step<3}><Typography variant="h3" tone="warning">已交片</Typography></div>
        <div className={'vgr-cover-photo-hint'+(story.step>=3?' is-visible':'')}><Typography variant="bodySmall" tone="muted">点照片，找找背面的线索。</Typography></div>
      </div>
    </div>
    <footer className="vgr-cover-invitation" data-testid="cover-invitation"><Typography variant="h3" tone="accent">没有按过快门，这张照片是怎么来的？</Typography></footer>
    <div ref={story.anchor} className="vgr-cover-story vgr-story-anchor" data-story-step={story.step} data-story-playing={story.playing} data-story-complete={story.step===3}/>
  </ContentBlock>;
}

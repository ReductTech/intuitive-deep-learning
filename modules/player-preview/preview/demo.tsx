import {useState} from 'react';
import {PptPlayer, type PlayerPage} from '../src';

const pages: PlayerPage[] = [
  {id: 'opening', title: '播放器独立开发', snippet: '播放器已经复制到 player-preview/src。可以在这里调整布局、翻页和全屏。'},
  {id: 'interaction', title: '测试页面交互', snippet: '点击按钮测试交互，再使用方向键或缩略图切换页面。'},
  {id: 'closing', title: '预览真实课程', snippet: '点击左上角术库返回课程列表，选择一门真实课程查看效果。'},
];
export function Demo() {
  const [activeId, setActiveId] = useState(pages[0].id);
  const [count, setCount] = useState(0);
  const page = pages.find(item => item.id === activeId)!;
  return <PptPlayer title="播放器独立开发" pages={pages} activeId={activeId} onSelect={setActiveId}
    canEdit={false} onEdit={() => {}} onHome={() => location.assign('/')}
    slide={<div style={{width: 1600, height: 900, boxSizing: 'border-box', padding: 100, background: 'linear-gradient(130deg,#f0f5ff,#fff)'}}>
      <p style={{fontSize: 24, color: '#536482'}}>SHUKU · LOCAL PREVIEW</p>
      <h1 style={{fontSize: 64, margin: '60px 0 30px'}}>{page.title}</h1>
      <p style={{fontSize: 32, lineHeight: 1.7, maxWidth: 1100}}>{String(page.snippet)}</p>
      <button style={{fontSize: 28, padding: '16px 28px', marginTop: 40, cursor: 'pointer'}} onClick={() => setCount(value => value + 1)}>交互计数：{count}</button>
    </div>} />;
}

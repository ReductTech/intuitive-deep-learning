import { useMemo, useState, type ReactNode } from 'react';
import type { SlidePlacement } from './document';
import type { PresentationStore } from './store';

type RibbonTab = 'file' | 'home' | 'insert' | 'design' | 'present';

export function StudioRibbon({ store, onInsert, onAddPage, onImport, onExport, onOpenJson }: {
  store: PresentationStore;
  onInsert: (type: string) => void;
  onAddPage: () => void;
  onImport: () => void;
  onExport: () => void;
  onOpenJson: () => void;
}) {
  const [tab, setTab] = useState<RibbonTab>('home');
  const document = store((state) => state.document);
  const activeSlideId = store((state) => state.activeSlideId);
  const selectedIds = store((state) => state.selectedPlacementIds);
  const mode = store((state) => state.mode);
  const setMode = store((state) => state.setMode);
  const updatePlacements = store((state) => state.updatePlacements);
  const replaceDocument = store((state) => state.replaceDocument);
  const undo = store((state) => state.undo);
  const redo = store((state) => state.redo);
  const canUndo = store((state) => state.past.length > 0);
  const canRedo = store((state) => state.future.length > 0);
  const page = document.views.slides.pages.find((candidate) => candidate.id === activeSlideId) ?? document.views.slides.pages[0];
  const selected = useMemo(() => page.placements.find((placement) => placement.id === selectedIds[0]), [page.placements, selectedIds]);
  const selectedNode = selected?.source.kind === 'content' ? document.content[selected.source.id] : undefined;
  const isText = selectedNode?.type === 'text';
  const apply = (patch: Partial<SlidePlacement>) => selected && updatePlacements([{ id: selected.id, patch }]);
  const style = selected?.style ?? {};
  const applyStyle = (patch: Partial<SlidePlacement['style']>) => apply({ style: { ...style, ...patch } });
  const setBackground = (background: string) => {
    const next = structuredClone(document);
    const nextPage = next.views.slides.pages.find((candidate) => candidate.id === activeSlideId);
    if (nextPage) nextPage.background = background;
    replaceDocument(next);
  };

  return <header className="pe-ribbon">
    <div className="pe-ribbon__titlebar">
      <div className="pe-ribbon__brand"><span>PS</span><b>Presentation Studio</b><small>{document.title}</small></div>
      <div className="pe-ribbon__quick"><button onClick={onImport} title="打开项目">打开</button><button onClick={onExport} title="保存项目">保存</button><i /><button disabled={!canUndo} onClick={undo} title="撤销">↶</button><button disabled={!canRedo} onClick={redo} title="重做">↷</button></div>
      <div className="pe-ribbon__views"><button className={mode === 'edit' ? 'is-active' : ''} onClick={() => setMode('edit')}>编辑</button><button className={mode === 'present' ? 'is-active' : ''} onClick={() => setMode('present')}>放映</button><button className={mode === 'guide' ? 'is-active' : ''} onClick={() => setMode('guide')}>导览页</button></div>
    </div>
    <nav className="pe-ribbon__tabs">{([['file', '文件'], ['home', '开始'], ['insert', '插入'], ['design', '设计'], ['present', '放映']] as const).map(([id, label]) => <button className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)} key={id}>{label}</button>)}<span /><button className="pe-ribbon__advanced" onClick={onOpenJson}>高级</button></nav>
    <div className="pe-ribbon__commands">
      {tab === 'file' ? <>
        <RibbonGroup label="项目文件"><Command icon="↥" label="打开项目" onClick={onImport} /><Command icon="↓" label="保存项目" onClick={onExport} /><Command icon="{ }" label="查看 JSON" onClick={onOpenJson} /></RibbonGroup>
        <RibbonGroup label="说明" wide><span className="pe-ribbon__info">打开或保存 PresentationDocument 项目；模块项目会保留页面、组件和导览结构。</span></RibbonGroup>
      </> : null}
      {tab === 'home' ? <>
        <RibbonGroup label="插入"><Command icon="T" label="文本框" onClick={() => onInsert('body')} /><Command icon="▧" label="图片" onClick={() => onInsert('image')} /></RibbonGroup>
        <RibbonGroup label="字体" wide><select disabled={!isText} value={style.fontFamily ?? 'Segoe UI'} onChange={(event) => applyStyle({ fontFamily: event.currentTarget.value })}><option>Segoe UI</option><option>Arial</option><option>Georgia</option><option>Microsoft YaHei</option><option>SimSun</option></select><input disabled={!isText} className="pe-ribbon__size" type="number" min="8" max="160" value={style.fontSize ?? ''} placeholder="自动" onChange={(event) => applyStyle({ fontSize: Number(event.currentTarget.value) || undefined })} /><button disabled={!isText} className={style.fontWeight === 700 ? 'is-pressed' : ''} onClick={() => applyStyle({ fontWeight: style.fontWeight === 700 ? 400 : 700 })}><b>B</b></button><button disabled={!isText} className={style.fontStyle === 'italic' ? 'is-pressed' : ''} onClick={() => applyStyle({ fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' })}><i>I</i></button><button disabled={!isText} className={style.textDecoration === 'underline' ? 'is-pressed' : ''} onClick={() => applyStyle({ textDecoration: style.textDecoration === 'underline' ? 'none' : 'underline' })}><u>U</u></button><label className="pe-color-command" title="文字颜色"><input disabled={!isText} type="color" value={style.color?.startsWith('#') ? style.color : '#173b37'} onChange={(event) => applyStyle({ color: event.currentTarget.value })} /><span>A</span></label></RibbonGroup>
        <RibbonGroup label="段落"><Command icon="≡" label="左对齐" pressed={style.textAlign === 'left'} disabled={!isText} onClick={() => applyStyle({ textAlign: 'left' })} /><Command icon="≣" label="居中" pressed={style.textAlign === 'center'} disabled={!isText} onClick={() => applyStyle({ textAlign: 'center' })} /><Command icon="☷" label="右对齐" pressed={style.textAlign === 'right'} disabled={!isText} onClick={() => applyStyle({ textAlign: 'right' })} /></RibbonGroup>
        <RibbonGroup label="排列"><Command icon="↑" label="置顶" disabled={!selected} onClick={() => apply({ zIndex: Math.max(...page.placements.map((item) => item.zIndex)) + 1 })} /><Command icon="↓" label="置底" disabled={!selected} onClick={() => apply({ zIndex: Math.min(...page.placements.map((item) => item.zIndex)) - 1 })} /><Command icon="▣" label={selected?.locked ? '解锁' : '锁定'} disabled={!selected} onClick={() => apply({ locked: !selected?.locked })} /></RibbonGroup>
      </> : null}
      {tab === 'insert' ? <>
        <RibbonGroup label="幻灯片"><Command icon="＋" label="新页面" onClick={onAddPage} /></RibbonGroup>
        <RibbonGroup label="文字"><Command icon="T" label="文本框" onClick={() => onInsert('body')} /><Command icon="π" label="公式" onClick={() => onInsert('equation')} /></RibbonGroup>
        <RibbonGroup label="表格"><Command icon="▦" label="表格" onClick={() => onInsert('table')} /></RibbonGroup>
        <RibbonGroup label="图像"><Command icon="▧" label="图片" onClick={() => onInsert('image')} /><Command icon="★" label="图标" onClick={() => onInsert('icon')} /></RibbonGroup>
        <RibbonGroup label="插图"><Command icon="◯" label="形状" onClick={() => onInsert('shape')} /><Command icon="◇" label="关系图" onClick={() => onInsert('diagram')} /><Command icon="▥" label="图表" onClick={() => onInsert('chart')} /><Command icon="⬡" label="3D 模型" onClick={() => onInsert('model')} /></RibbonGroup>
        <RibbonGroup label="媒体"><Command icon="▶" label="视频" onClick={() => onInsert('video')} /><Command icon="⌘" label="网页" onClick={() => onInsert('game')} /></RibbonGroup>
      </> : null}
      {tab === 'design' ? <><RibbonGroup label="页面背景" wide><button className="pe-theme-swatch is-paper" onClick={() => setBackground('#fbfaf6')} title="纸张" /><button className="pe-theme-swatch is-white" onClick={() => setBackground('#ffffff')} title="白色" /><button className="pe-theme-swatch is-mint" onClick={() => setBackground('linear-gradient(135deg,#f8fbfa,#e6f2ee)')} title="薄荷" /><button className="pe-theme-swatch is-night" onClick={() => setBackground('linear-gradient(135deg,#102b27,#1f4a42)')} title="深色" /></RibbonGroup><RibbonGroup label="画布"><span className="pe-ribbon__info">16:9 · 1600 × 900</span></RibbonGroup></> : null}
      {tab === 'present' ? <><RibbonGroup label="演示"><Command icon="▶" label="从当前页" onClick={() => setMode('present')} /><Command icon="▤" label="导览模式" onClick={() => setMode('guide')} /></RibbonGroup><RibbonGroup label="智能讲解"><span className="pe-ribbon__info">放映后使用讲解面板，内容高亮与语义节点保持同步</span></RibbonGroup></> : null}
    </div>
  </header>;
}

function RibbonGroup({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) { return <section className={`pe-ribbon-group${wide ? ' is-wide' : ''}`}><div className="pe-ribbon-group__body">{children}</div><small>{label}</small></section>; }
function Command({ icon, label, pressed, disabled, onClick }: { icon: string; label: string; pressed?: boolean; disabled?: boolean; onClick: () => void }) { return <button className={`pe-ribbon-command${pressed ? ' is-pressed' : ''}`} disabled={disabled} onClick={onClick} title={label}><b>{icon}</b><span>{label}</span></button>; }

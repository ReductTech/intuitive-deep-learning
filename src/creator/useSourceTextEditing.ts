import { useEffect, type RefObject } from 'react';
import { request } from '../../Edit-Deck/api';

export function useSourceTextEditing(root: RefObject<HTMLDivElement | null>, enabled: boolean, pageKey: string, onStatus: (message: string) => void) {
  useEffect(() => {
    const container = root.current;
    if (!container || !enabled || !import.meta.env.DEV) return;
    let active: HTMLElement | null = null, before = '', cancelled = false;
    const click = (event: MouseEvent) => { if (!(event.target as Element).closest('[contenteditable="true"]')) { event.preventDefault(); event.stopPropagation(); } };
    const edit = (event: MouseEvent) => {
      const target = (event.target as Element).closest<HTMLElement>('[data-cw-source-text]');
      if (!target || !container.contains(target) || target.closest('svg,canvas')) return;
      event.preventDefault(); event.stopPropagation();
      active = target; before = target.innerText; cancelled = false;
      target.contentEditable = 'true'; target.focus();
      const selection = window.getSelection(), range = document.createRange(); range.selectNodeContents(target); selection?.removeAllRanges(); selection?.addRange(range);
    };
    const key = (event: KeyboardEvent) => {
      if (!active) return;
      event.stopPropagation();
      if (event.key === 'Escape') { event.preventDefault(); cancelled = true; active.textContent = before; active.blur(); }
      else if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); active.blur(); }
    };
    const paste = (event: ClipboardEvent) => { if (active) { event.preventDefault(); document.execCommand('insertText', false, event.clipboardData?.getData('text/plain') ?? ''); } };
    const blur = async (event: FocusEvent) => {
      if (!active || event.target !== active) return;
      const element = active, text = element.innerText, original = before; active = null; element.removeAttribute('contenteditable');
      if (cancelled || text === original) return;
      if (!text.trim()) { element.textContent = original; onStatus('文字不能为空，已保留原内容。'); return; }
      onStatus('正在写入 TSX…');
      try { await request('/source-text', 'POST', { id: element.dataset.cwSourceText, text }); onStatus('文字已写入 TSX 源文件'); }
      catch (error) { if (element.isConnected) element.textContent = original; onStatus(error instanceof Error ? error.message : '源码保存失败，原文字已保留。'); }
    };
    container.addEventListener('click', click, true); container.addEventListener('dblclick', edit, true); container.addEventListener('keydown', key, true); container.addEventListener('paste', paste, true); container.addEventListener('focusout', blur);
    return () => { container.removeEventListener('click', click, true); container.removeEventListener('dblclick', edit, true); container.removeEventListener('keydown', key, true); container.removeEventListener('paste', paste, true); container.removeEventListener('focusout', blur); if (active) { active.textContent = before; active.removeAttribute('contenteditable'); } };
  }, [root, enabled, pageKey, onStatus]);
}

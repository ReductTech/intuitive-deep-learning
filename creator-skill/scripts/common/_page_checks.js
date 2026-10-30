/* Browser expression shared by capture.slides and check.bounds. No I/O or globals
 * are changed. Geometry is measured in the selected surface, excluding player UI.
 * Callers wait for ready, fonts and images; warnings require screenshot review.
 */
(options => {
  const {surfaceSelector = '.ppt-slide-surface', expectedId = null, maxChars = null} = options;
  const errors = [], warnings = [], exceptions = [];
  const limitations = [
    'Geometry does not prove absence of occlusion, glyph truncation or incorrect content; inspect a current screenshot.',
    'DOM character counts are not OCR. Image/Canvas text and CSS-generated text are not counted; input values may include clipped characters.',
  ];
  const unavailable = (kind, message, status = 'unverified') => ({ready: false, status, errors: [{kind, message}], warnings, limitations, text: {status: 'unverified', method: 'rendered-dom-codepoints-v1', characters: null, maximum: maxChars}});
  const surface = document.querySelector(surfaceSelector);
  if (!surface) return unavailable('missing-surface', 'Slide surface not found');
  const visible = element => {
    for (let node = element; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse' || Number(style.opacity) === 0 || style.contentVisibility === 'hidden') return false;
    }
    return getComputedStyle(element).display === 'contents' || [...element.getClientRects()].some(r => r.width > 0 && r.height > 0);
  };
  if (!visible(surface)) return unavailable('hidden-surface', 'Slide surface is hidden or zero-sized', 'failed');
  const rect = surface.getBoundingClientRect();
  const width = surface.offsetWidth, height = surface.offsetHeight;
  if (!width || !height || !rect.width || !rect.height) return unavailable('zero-surface', 'Slide canvas has zero dimensions', 'failed');
  const owner = surface.closest('[data-scene-id]');
  const pageId = owner?.getAttribute('data-scene-id') ?? null;
  if (pageId === null) return unavailable('page-id', 'Actual page ID is unavailable; cannot match this state to a page');
  if (expectedId !== null && pageId !== expectedId) return unavailable('page-id', `Expected page ${expectedId}; actual page ID: ${pageId ?? 'unavailable'}`);
  if (document.readyState === 'loading' || document.fonts?.status === 'loading' || [...surface.querySelectorAll('img')].some(e => visible(e) && !e.complete)) return unavailable('loading', 'Document, fonts or visible images are still loading');
  const sx = rect.width / width, sy = rect.height / height;
  if (Math.abs(sx - sy) > 0.01) warnings.push({kind: 'nonuniform-transform', message: 'Non-uniform scaling or rotation: rectangle geometry needs manual review'});
  if (Math.abs(width - 1600) > 1 || Math.abs(height - 900) > 1) errors.push({kind: 'canvas-size', expected: [1600, 900], actual: [width, height]});
  const label = e => ({tag: e.tagName.toLowerCase(), id: e.id || null, className: String(e.className?.baseVal ?? e.className ?? '').slice(0, 120)});
  const intersects = (a, b) => a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
  const clipped = (r, clip) => ({left: Math.max(r.left, clip.left), right: Math.min(r.right, clip.right), top: Math.max(r.top, clip.top), bottom: Math.min(r.bottom, clip.bottom)});
  const elements = [surface, ...surface.querySelectorAll('*')].filter(visible);
  const viewports = new Set();
  for (const element of elements) {
    if (!element.hasAttribute('data-ppt-viewport')) continue;
    const reason = element.getAttribute('data-ppt-viewport')?.trim();
    const style = getComputedStyle(element);
    if (!reason || ![style.overflowX, style.overflowY].some(x => /^(hidden|clip|auto|scroll)$/.test(x))) {
      errors.push({kind: 'invalid-viewport-exception', ...label(element), message: 'data-ppt-viewport requires a reason and an actual clipping/scroll viewport'});
      continue;
    }
    // A whole slide cannot be exempted from content overflow checks.
    if (element === surface) {
      errors.push({kind: 'invalid-viewport-exception', ...label(element), message: 'The slide surface itself cannot be an internal viewport exception'});
      continue;
    }
    viewports.add(element);
    exceptions.push({...label(element), reason});
  }
  const approvedClip = element => {
    let box = rect;
    for (let node = element.parentElement; node && surface.contains(node); node = node.parentElement) {
      if (viewports.has(node)) box = clipped(box, node.getBoundingClientRect());
    }
    return box;
  };
  for (const element of elements) {
    const r = element.getBoundingClientRect(), clip = approvedClip(element);
    const effective = clipped(r, clip);
    // Only declared internal viewports suppress geometry outside their window.
    const hasViewport = [...viewports].some(v => v !== element && v.contains(element));
    if (hasViewport && (effective.right <= effective.left || effective.bottom <= effective.top)) continue;
    const candidate = hasViewport ? effective : r;
    if (element !== surface && candidate.right > candidate.left && candidate.bottom > candidate.top &&
        (candidate.left < rect.left - sx || candidate.top < rect.top - sy || candidate.right > rect.right + sx || candidate.bottom > rect.bottom + sy)) {
      errors.push({kind: 'outside-canvas', ...label(element), bounds: {left: (r.left - rect.left) / sx, top: (r.top - rect.top) / sy, right: (r.right - rect.left) / sx, bottom: (r.bottom - rect.top) / sy}});
    }
    if (!viewports.has(element) && element.clientWidth > 0 && element.clientHeight > 0 &&
        (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1)) {
      const style = getComputedStyle(element);
      const constrainedX = element.scrollWidth > element.clientWidth + 1 && /^(hidden|clip|auto|scroll)$/.test(style.overflowX);
      const constrainedY = element.scrollHeight > element.clientHeight + 1 && /^(hidden|clip|auto|scroll)$/.test(style.overflowY);
      const issue = {...label(element), client: [element.clientWidth, element.clientHeight], scroll: [element.scrollWidth, element.scrollHeight], overflow: [style.overflowX, style.overflowY]};
      if (constrainedX || constrainedY) errors.push({kind: 'internal-overflow', ...issue});
      else warnings.push({kind: 'internal-overflow-risk', ...issue, message: 'Visible overflow or font overhang; inspect screenshot before treating as a defect'});
    }
    const style = getComputedStyle(element);
    if (style.textOverflow === 'ellipsis' || Number(style.webkitLineClamp) > 0) warnings.push({kind: 'possible-truncation', ...label(element)});
    if (element.tagName === 'IMG' && !element.naturalWidth) errors.push({kind: 'image-load', ...label(element)});
  }
  // Count individual text nodes once. Character ranges exclude text entirely
  // outside the surface or clipped by any ancestor; no parent.innerText summing.
  let textCharacters = 0, inputCharacters = 0;
  const textClip = element => {
    let box = {left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom};
    for (let node = element; node && surface.contains(node); node = node.parentElement) {
      const style = getComputedStyle(node), r = node.getBoundingClientRect();
      if (/^(hidden|clip|auto|scroll)$/.test(style.overflowX)) box = {...box, left: Math.max(box.left, r.left), right: Math.min(box.right, r.right)};
      if (/^(hidden|clip|auto|scroll)$/.test(style.overflowY)) box = {...box, top: Math.max(box.top, r.top), bottom: Math.min(box.bottom, r.bottom)};
    }
    return box;
  };
  const walker = document.createTreeWalker(surface, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode, parent = node.parentElement;
    if (!parent || !visible(parent) || parent.closest('script,style,noscript,template,textarea,select,option')) continue;
    const clip = textClip(parent);
    let offset = 0;
    for (const char of node.data) {
      const start = offset;
      offset += char.length;
      if (/\s/u.test(char)) continue;
      const range = document.createRange();
      range.setStart(node, start); range.setEnd(node, offset);
      if ([...range.getClientRects()].some(r => r.width > 0 && r.height > 0 && intersects(r, clip))) textCharacters++;
    }
  }
  for (const element of elements) {
    if (!/^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName) || !intersects(element.getBoundingClientRect(), textClip(element))) continue;
    if (element.tagName === 'INPUT' && /^(checkbox|radio|range|color|file|hidden|password)$/i.test(element.type)) continue;
    const value = element.tagName === 'SELECT' ? [...element.selectedOptions].map(e => e.text).join('') : element.value;
    inputCharacters += [...String(value ?? '')].filter(c => !/\s/u.test(c)).length;
  }
  const media = elements.filter(e => /^(IMG|CANVAS|VIDEO)$/.test(e.tagName));
  const hasArtwork = elements.some(e => /^(img|canvas|video)$/i.test(e.tagName) ||
    (e.tagName.toLowerCase() === 'svg' && e.querySelector('path,rect,circle,ellipse,line,polyline,polygon,text,image,use')) ||
    (e !== surface && getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)'));
  if (!textCharacters && !inputCharacters && !hasArtwork) return unavailable('empty-surface', 'No visible text or visual content found');
  const characters = !textCharacters && !inputCharacters && media.length ? null : textCharacters + inputCharacters;
  const textStatus = characters === null ? 'unverified' : (maxChars !== null && characters > maxChars ? 'failed' : 'passed');
  if (textStatus === 'failed') errors.push({kind: 'character-limit', characters, maximum: maxChars});
  if (media.length) warnings.push({kind: 'unread-media-text', count: media.length, message: 'Image/Canvas/video text is outside the DOM count; inspect screenshot'});
  return {
    ready: true, status: errors.length ? 'failed' : characters === null ? 'unverified' : 'passed', pageId,
    surface: {width, height, displayWidth: rect.width, displayHeight: rect.height, scaleX: sx, scaleY: sy},
    overflowCount: errors.filter(e => e.kind === 'outside-canvas').length,
    internalOverflowCount: errors.filter(e => e.kind === 'internal-overflow').length,
    errors, warnings, exceptions, limitations,
    text: {status: textStatus, method: 'rendered-dom-codepoints-v1', characters, textCharacters, inputCharacters, maximum: maxChars, exceeded: characters === null || maxChars === null ? null : characters > maxChars,
      rules: 'Each non-whitespace Unicode code point counts as 1: Chinese characters, English letters, digits and punctuation. Visible text nodes counted once; visible input values/selected labels included separately (password and non-text controls excluded). States are counted separately.'},
  };
})

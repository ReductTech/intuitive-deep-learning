import { describe, expect, it } from 'vitest';
import { executePresentationCommand } from './commands';
import { clonePresentationDocument, parsePresentationDocument } from './document';
import { createPresentationStore } from './store';
import { galtonSpikeDocument } from '../../Galton-Linear-Regression/presentation-spike/document';

describe('PresentationDocument', () => {
  it('accepts the multi-view Galton example', () => {
    const parsed = parsePresentationDocument(galtonSpikeDocument);
    expect(parsed.views.slides.pages).toHaveLength(1);
    expect(parsed.views.guide.sections).toHaveLength(4);
    expect(parsed.widgets['fit-lab-widget'].widgetType).toBe('galton-fit-lab');
  });

  it('rejects dangling semantic references', () => {
    const invalid = clonePresentationDocument(galtonSpikeDocument);
    invalid.views.guide.sections[0].sources[0] = { kind: 'content', id: 'missing-content' };
    expect(() => parsePresentationDocument(invalid)).toThrow(/missing content/i);
  });

  it('rejects placements outside the fixed slide', () => {
    const invalid = clonePresentationDocument(galtonSpikeDocument);
    invalid.views.slides.pages[0].placements[0].x = 1599;
    expect(() => parsePresentationDocument(invalid)).toThrow(/escapes slide/i);
  });
});

describe('typed presentation commands', () => {
  it('updates a placement and supports undo and redo', () => {
    const store = createPresentationStore(clonePresentationDocument(galtonSpikeDocument));
    const before = store.getState().document.views.slides.pages[0].placements[0].x;
    const update = executePresentationCommand(store, {
      type: 'update-placement',
      placementId: 'p-eyebrow',
      patch: { x: before + 20 },
    });
    expect(update.ok).toBe(true);
    expect(store.getState().document.views.slides.pages[0].placements[0].x).toBe(before + 20);
    executePresentationCommand(store, { type: 'undo' });
    expect(store.getState().document.views.slides.pages[0].placements[0].x).toBe(before);
    executePresentationCommand(store, { type: 'redo' });
    expect(store.getState().document.views.slides.pages[0].placements[0].x).toBe(before + 20);
  });

  it('refuses malformed agent commands', () => {
    const store = createPresentationStore(clonePresentationDocument(galtonSpikeDocument));
    const result = executePresentationCommand(store, { type: 'update-placement', placementId: 'p-title', patch: { width: -1 } });
    expect(result.ok).toBe(false);
  });
});

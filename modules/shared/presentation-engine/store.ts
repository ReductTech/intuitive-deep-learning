import { create } from 'zustand';
import { clonePresentationDocument, parsePresentationDocument, type PresentationDocument, type SlidePlacement } from './document';

export type PresentationMode = 'edit' | 'present' | 'guide';

interface PresentationEngineState {
  document: PresentationDocument;
  mode: PresentationMode;
  activeSlideId: string;
  selectedPlacementIds: string[];
  activeNarrationTargetId?: string;
  past: PresentationDocument[];
  future: PresentationDocument[];
  setMode: (mode: PresentationMode) => void;
  setActiveSlide: (id: string) => void;
  selectPlacements: (ids: string[]) => void;
  setNarrationTarget: (id?: string) => void;
  updatePlacements: (patches: Array<{ id: string; patch: Partial<SlidePlacement> }>) => void;
  reorderPlacement: (id: string, direction: 'front' | 'back') => void;
  replaceDocument: (document: PresentationDocument, recordHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
}

function updateDocumentPlacements(
  document: PresentationDocument,
  activeSlideId: string,
  patches: Array<{ id: string; patch: Partial<SlidePlacement> }>,
): PresentationDocument {
  const patchMap = new Map(patches.map((entry) => [entry.id, entry.patch]));
  return {
    ...document,
    views: {
      ...document.views,
      slides: {
        pages: document.views.slides.pages.map((page) => page.id === activeSlideId
          ? { ...page, placements: page.placements.map((placement) => ({ ...placement, ...patchMap.get(placement.id) })) }
          : page),
      },
    },
  };
}

export function createPresentationStore(initialDocument: PresentationDocument) {
  const parsed = parsePresentationDocument(initialDocument);
  return create<PresentationEngineState>((set, get) => ({
    document: parsed,
    mode: 'edit',
    activeSlideId: parsed.views.slides.pages[0].id,
    selectedPlacementIds: [],
    past: [],
    future: [],
    setMode: (mode) => set({ mode, selectedPlacementIds: [] }),
    setActiveSlide: (activeSlideId) => set({ activeSlideId, selectedPlacementIds: [] }),
    selectPlacements: (selectedPlacementIds) => set({ selectedPlacementIds }),
    setNarrationTarget: (activeNarrationTargetId) => set({ activeNarrationTargetId }),
    updatePlacements: (patches) => {
      const state = get();
      const next = updateDocumentPlacements(state.document, state.activeSlideId, patches);
      parsePresentationDocument(next);
      set({
        document: next,
        past: [...state.past.slice(-49), clonePresentationDocument(state.document)],
        future: [],
      });
    },
    reorderPlacement: (id, direction) => {
      const state = get();
      const page = state.document.views.slides.pages.find((candidate) => candidate.id === state.activeSlideId);
      if (!page) return;
      const zValues = page.placements.map((placement) => placement.zIndex);
      const zIndex = direction === 'front' ? Math.max(...zValues) + 1 : Math.min(...zValues) - 1;
      get().updatePlacements([{ id, patch: { zIndex } }]);
    },
    replaceDocument: (document, recordHistory = true) => {
      const parsedDocument = parsePresentationDocument(document);
      const state = get();
      set({
        document: parsedDocument,
        activeSlideId: parsedDocument.views.slides.pages.some((page) => page.id === state.activeSlideId)
          ? state.activeSlideId
          : parsedDocument.views.slides.pages[0].id,
        selectedPlacementIds: [],
        past: recordHistory ? [...state.past.slice(-49), clonePresentationDocument(state.document)] : state.past,
        future: recordHistory ? [] : state.future,
      });
    },
    undo: () => {
      const state = get();
      const previous = state.past.at(-1);
      if (!previous) return;
      set({
        document: previous,
        past: state.past.slice(0, -1),
        future: [clonePresentationDocument(state.document), ...state.future].slice(0, 50),
        selectedPlacementIds: [],
      });
    },
    redo: () => {
      const state = get();
      const next = state.future[0];
      if (!next) return;
      set({
        document: next,
        past: [...state.past, clonePresentationDocument(state.document)].slice(-50),
        future: state.future.slice(1),
        selectedPlacementIds: [],
      });
    },
  }));
}

export type PresentationStore = ReturnType<typeof createPresentationStore>;

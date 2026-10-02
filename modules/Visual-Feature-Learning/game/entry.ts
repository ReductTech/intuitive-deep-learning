async function mount() {
  const frame = document.querySelector<HTMLIFrameElement>('iframe')!;
  if (document.body.dataset.mode === 'editor') {
    const { createEditorDocument } = await import('./editor/document');
    frame.srcdoc = createEditorDocument();
  } else {
    const { createGameDocument } = await import('./player/document');
    frame.srcdoc = createGameDocument();
  }
}

void mount();

export {};

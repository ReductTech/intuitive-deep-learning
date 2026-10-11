import { documentSetup, inlineScript, moduleAssetRoot, renderDocument } from '../player/html';
import level from '../data/level.js?raw';
import editor from './editor.js?raw';
import template from './template.html?raw';
import css from './editor.css?raw';

/** Loaded only when the standalone level editor is opened. */
export function createEditorDocument() {
  const assetRoot = moduleAssetRoot();
  return renderDocument(template, css,
    documentSetup(assetRoot, level) + inlineScript(level) + inlineScript(editor), assetRoot);
}

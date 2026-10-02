import { documentSetup, inlineScript, moduleAssetRoot, renderDocument } from './html';
import phaserUrl from '../../../shared/vendor/phaser/3.90.0/phaser.min.js?url';
import level from '../data/level.js?raw';
import story from '../data/story.js?raw';
import core from '../runtime/core.js?raw';
import ui from '../runtime/ui.js?raw';
import paint from '../runtime/disguise-paint.js?raw';
import services from '../runtime/services.js?raw';
import disguise from '../runtime/disguise-editor.js?raw';
import storyView from '../runtime/story-view.js?raw';
import storyFlow from '../runtime/story-flow.js?raw';
import scene from '../runtime/scene.js?raw';
import bootstrap from './bootstrap.js?raw';
import playerHtml from './template.html?raw';
import playerCss from './player.css?raw';
/** Shared by the course iframe and all standalone entries. Order follows runtime dependencies. */
export function createGameDocument() {
  const assetRoot = moduleAssetRoot();
  const scripts = '<script src="' + new URL(phaserUrl, window.location.href).href + '"></script>' +
    [level, core, paint, ui, services, disguise, story, storyView, storyFlow, scene, bootstrap].map(inlineScript).join('');
  return renderDocument(playerHtml, playerCss, documentSetup(assetRoot) + scripts, assetRoot);
}


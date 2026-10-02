import { moduleAssetUrl } from '../../../shared/react/assets';
import outlines from '../../outlines.json';

export function moduleAssetRoot() {
  return new URL(moduleAssetUrl(outlines.moduleIdentity.id, 'yuhuanong') + '/', window.location.href).href;
}

export function inlineScript(source: string) {
  return '<script>' + source.replace(/<\/script/gi, '<\\/script') + '</script>';
}

export function documentSetup(assetRoot: string, configSource?: string) {
  return inlineScript('window.VFL_GAME_ASSET_ROOT=' + JSON.stringify(assetRoot) + ';' +
    (configSource === undefined ? '' : 'window.VFL_GAME_CONFIG_SOURCE=' + JSON.stringify(configSource) + ';'));
}

export function renderDocument(template: string, css: string, scripts: string, assetRoot: string) {
  return template
    .replace('<!-- styles -->', '<style>' + css + '</style>')
    .replace('{{assetRoot}}', assetRoot)
    .replace('<!-- scripts -->', scripts);
}

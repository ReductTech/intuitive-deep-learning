import { courseAssetDirectory } from "@shuku/course-runtime/react/assets";
import outlines from '../../outlines.json';

export function moduleAssetRoot() {
  return courseAssetDirectory('yuhuanong');
}

export function inlineScript(source: string) {
  return '<script>' + source.replace(/<\/script/gi, '<\\/script') + '</script>';
}

export function documentSetup(assetRoot: string, configSource?: string) {
  return inlineScript('window.VFL_GAME_ASSET_ROOT=' + JSON.stringify(assetRoot) + ';' +
    (import.meta.env.DEV ? 'window.VFL_GAME_EMBEDDING_SIMILARITY_URL="/__local-vision/face-recog/embedding-similarity";' : '') +
    (configSource === undefined ? '' : 'window.VFL_GAME_CONFIG_SOURCE=' + JSON.stringify(configSource) + ';'));
}

export function renderDocument(template: string, css: string, scripts: string, assetRoot: string) {
  return template
    .replace('<!-- styles -->', '<style>' + css + '</style>')
    .replace('{{assetRoot}}', assetRoot)
    .replace('<!-- scripts -->', scripts);
}

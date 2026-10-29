import type {Plugin} from 'vite';
export function assetRoots(root:string):Record<string,string>;
export function assetDirectory(root:string,id:string):string;
export function localModuleAssets(root:string):Plugin;

import { moduleAssetUrl } from './assets';

export interface JsonAsset<T> {
  readonly ready: boolean;
  load(): Promise<T>;
  read(): T;
}

/** Lazy, deduplicated runtime data. No asset bytes are imported into JavaScript. */
export function moduleJson<T>(moduleId: string, relativePath: string): JsonAsset<T> {
  let ready = false, value: T, pending: Promise<T> | undefined;
  return {
    get ready() { return ready; },
    load() {
      if (ready) return Promise.resolve(value);
      if (!pending) pending = (async () => {
        const response = await fetch(moduleAssetUrl(moduleId, relativePath));
        if (!response.ok) throw new Error(`资源加载失败：${relativePath}（HTTP ${response.status}）`);
        value = await response.json() as T;
        ready = true;
        return value;
      })().catch(error => { pending = undefined; throw error; });
      return pending;
    },
    read() {
      if (!ready) throw new Error(`资源尚未加载：${relativePath}`);
      return value;
    },
  };
}

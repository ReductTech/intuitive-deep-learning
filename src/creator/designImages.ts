// Images live outside localStorage so one full-resolution design cannot exhaust draft storage.
let database: Promise<IDBDatabase> | undefined;
function openDatabase() {
  database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('scenedeck-creator-assets', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('images');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('无法打开图片存储，请允许浏览器保存网站数据。'));
  }).catch(error => { database = undefined; throw error; });
  return database;
}
export function isDesignImage(value: unknown): value is string {
  return typeof value === 'string' && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value) && value.length <= 36 * 1024 * 1024;
}
export async function saveDesignImage(image: string, id = crypto.randomUUID()): Promise<string> {
  if (!isDesignImage(image)) throw new Error('生图结果不是有效的 PNG、JPEG 或 WebP 图片，或超过 25 MB。');
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('images', 'readwrite');
    tx.objectStore('images').put(image, id);
    tx.oncomplete = () => resolve();
    tx.onabort = tx.onerror = () => reject(new Error('图片保存失败，可能是浏览器空间不足。原页面仍保留，请重试。'));
  });
  return id;
}
export async function readDesignImage(id?: string): Promise<string | undefined> {
  if (!id) return undefined;
  const offline=(globalThis as {__SHUKU_OFFLINE_DESIGNS__?:Record<string,string>}).__SHUKU_OFFLINE_DESIGNS__;
  if(offline)return offline[id];
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction('images', 'readonly').objectStore('images').get(id);
    request.onsuccess = () => resolve(typeof request.result === 'string' ? request.result : undefined);
    request.onerror = () => reject(new Error('无法读取设计图，请重新导入含图片的项目备份。'));
  });
}

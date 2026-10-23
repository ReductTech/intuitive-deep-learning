let session: Promise<string> | undefined;
async function readJson(response: Response) {
  const text = (await response.text()).replace(/^\uFEFF/, '').trim();
  if (text.startsWith('<')) throw new Error('本机接口返回了网页，请确认用 npm run dev 启动后打开 /edit-deck');
  try { return JSON.parse(text); } catch { throw new Error(`本机接口没有返回有效 JSON（HTTP ${response.status}）`); }
}
async function sessionToken() {
  session ??= fetch('/__edit-deck/session').then(async response => {
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('请通过本机 npm run dev 打开 Edit Deck');
    const { token } = await readJson(response);
    if (typeof token !== 'string') throw new Error('本机会话初始化失败，请重新启动开发服务器');
    return token;
  }).catch(error => { session = undefined; throw error; });
  return session;
}
export async function request<T>(route: string, method = 'GET', value?: unknown, signal?: AbortSignal): Promise<T> {
  const send = async () => fetch(`/__edit-deck${route}`, {
    method, signal, headers: { 'Content-Type': 'application/json', 'X-Edit-Deck-Token': await sessionToken() }, body: value === undefined ? undefined : JSON.stringify(value),
  });
  let response = await send();
  // Vite config edits restart the local service. Renew once without discarding the draft.
  if (response.status === 403) { session = undefined; response = await send(); }
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('本机工作区服务不可用，请重新启动开发服务器');
  const result = await readJson(response);
  if (!response.ok) throw new Error(result.error || `请求失败 HTTP ${response.status}`);
  return result;
}

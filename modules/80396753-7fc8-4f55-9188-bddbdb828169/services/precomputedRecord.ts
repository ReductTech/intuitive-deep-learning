/** Immutable demonstration records. A miss never starts a training job. */
export async function loadRecord<T>(name: string, parameters: object, signal: AbortSignal): Promise<T> {
  const response = await fetch(`/api/courses/80396753-7fc8-4f55-9188-bddbdb828169/records/${name}`, {
    method: 'POST', headers: {'Content-Type':'application/json'}, body:JSON.stringify(parameters), signal,
  });
  const body = await response.json();
  if (!response.ok || !body.ok) throw new Error(body.error || body.detail || '该参数组合的演示缓存尚未准备好，请选择已有缓存。');
  return body.result as T;
}

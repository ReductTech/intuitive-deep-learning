/** Immutable demonstration records. A miss never starts a training job. */
export async function loadRecord<T>(name: string, parameters: object, signal: AbortSignal): Promise<T> {
  const response = await fetch(`/api/courses/5783c2b2-d620-49bf-bda4-f604563f4df1/records/${name}`, {
    method: 'POST', headers: {'Content-Type':'application/json'}, body:JSON.stringify(parameters), signal,
  });
  const body = await response.json();
  if (!response.ok || !body.ok) throw new Error(body.error || body.detail || '该参数组合的演示缓存尚未准备好，请选择已有缓存。');
  return body.result as T;
}

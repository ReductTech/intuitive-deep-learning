/** All teaching recordings are read through the platform cache table. */
export async function loadPrecomputed<T>(name: string): Promise<T> {
 try {
  const response=await fetch(`/api/courses/ce19337d-405b-47ff-92a9-9890127b5365/records/${name}`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  const body=await response.json();
  if(!response.ok||!body.ok)throw new Error(body.error||body.detail||'演示缓存尚未准备好。');
  return body.result as T;
 }catch(error){
  const host=document.getElementById('root');
  if(host){host.textContent=error instanceof Error?error.message:'演示缓存暂不可用，请稍后重试。';host.setAttribute('role','alert');}
  throw error;
 }
}

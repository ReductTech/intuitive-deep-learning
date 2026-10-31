/** Relative files named in runtime JSON, including atlas keys and sibling resources. */
export function jsonAssetReferences(value, metadataPath) {
  const refs=new Set(), parent=metadataPath.split('/').slice(0,-1).join('/');
  function add(text) {
    if(typeof text!=='string'||/^(?:[a-z]+:|\/|#)/i.test(text)||!/[.]\w{1,12}(?:[?#].*)?$/.test(text))return;
    for(const candidate of [text,parent+'/'+text]){
      const parts=[];
      for(const part of candidate.split(/[?#]/)[0].split('/')){
        if(part==='..')parts.pop();else if(part&&part!=='.')parts.push(part);
      }
      if(parts.length)refs.add(parts.join('/'));
    }
  }
  function visit(item){
    if(typeof item==='string')add(item);
    else if(Array.isArray(item))item.forEach(visit);
    else if(item&&typeof item==='object')for(const [key,child]of Object.entries(item)){add(key);visit(child);}
  }
  visit(value);return [...refs];
}

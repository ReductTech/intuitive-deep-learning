import fs from 'node:fs/promises';
import path from 'node:path';
import {modules,root} from './modules.mjs';
const all=await modules();
for(const m of all){
 if(new Set(m.outline.pages.map(p=>p.id)).size!==m.outline.pages.length)throw Error('Duplicate page IDs: '+m.name);
 if(m.ready&&!m.outline.moduleIdentity?.id)throw Error('Missing stable asset identity: '+m.name);
}
for(const forbidden of ['src/shuku','backend','web_agent','creator-skill']){
 try{await fs.access(path.join(root,forbidden));throw Error('Platform/Skill code must stay independent: '+forbidden);}catch(e){if(e.code!=='ENOENT')throw e;}
}
console.log(`${all.length} modules: ${all.filter(m=>m.ready).length} buildable, ${all.filter(m=>!m.ready).length} draft. Platform boundary checked.`);

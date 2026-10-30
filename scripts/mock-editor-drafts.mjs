export async function mockEditorDrafts(page,baseRevision){
 const rows=new Map();let sequence=0;
 await page.route('**/api/shuku/courses/*/draft',async route=>{
  const request=route.request(),cid=new URL(request.url()).pathname.split('/').at(-2),head=baseRevision(cid);
  let row=rows.get(cid)||null;
  if(row&&row.base_revision!==head){rows.delete(cid);row=null;}
  if(request.method()==='GET')return route.fulfill({json:{draft:row}});
  const body=request.postDataJSON();
  if(body.expected_revision!==head||body.expected_draft!==(row?.version||null))return route.fulfill({status:409,json:{error:'草稿已更新'}});
  row={version:'mock-draft-'+(++sequence),base_revision:head,project:body.project,updated_at:Date.now()/1000};rows.set(cid,row);
  return route.fulfill({json:{version:row.version,base_revision:head}});
 });
 return rows;
}

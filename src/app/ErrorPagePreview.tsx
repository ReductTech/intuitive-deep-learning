import {useState} from 'react';
import {ErrorPage} from './ErrorPage';

const examples = [
  {code:404, label:'404 · 路径', reason:'没有找到这个地址对应的课程，课程可能已移除或链接有误。'},
  {code:500, label:'500 · 程序', reason:'课程文件读取失败，服务无法完成本次请求。'},
  {code:502, label:'502 · 连接', reason:'网关无法从课程播放服务获取有效响应。'},
  {code:403, label:'403 · 权限', reason:'当前账号没有访问这门课程的权限。'},
  {code:429, label:'429 · 限流', reason:'短时间内发送了过多请求，请稍后重试。'},
  {code:0, label:'网络断开', reason:'无法连接课程服务，请检查网络。'},
];

/** Local development gallery; never included in the public route list. */
export function ErrorPagePreview(){
  const [selected,setSelected]=useState(0);
  const example=examples[selected];
  return <>
    <nav className="error-preview-picker" aria-label="切换错误页示例"><span>本地预览</span>{examples.map((item,index)=><button key={item.code} aria-pressed={selected===index} onClick={()=>setSelected(index)}>{item.label}</button>)}</nav>
    <ErrorPage key={example.code} status={example.code} error={example.reason}/>
  </>;
}

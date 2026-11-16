
import { Typography } from "@shuku/course-style/react";
import { Heading, Text, useStepSequence, StepSequenceControl } from '../components/LessonVisuals';
import { ImageFocus, SourceCrop } from '../components/TeachingVisuals';
import { tasksSourceImage as source } from '../media';
import './VlmPages.css';
import './VlmFeedback.css';

export const salesA = [40, 55, 60, 65, 60, 70];
export const salesB = [30, 35, 40, 45, 55, 90];
export const maxGapYears = salesA
  .map((value, index) => Math.abs(value - salesB[index]))
  .flatMap((gap, index, gaps) => gap === Math.max(...gaps) ? [2010 + index] : []);

function SalesChart({ evidence }: { evidence:boolean }) {
  const y=(value:number)=>200-value*1.8;
  const x=(index:number)=>(index+1.5)*600/7;
  return <div shuku-edit-id="e-d4819343-3b1e-4ccd-a443-d1d8b440e9bb" className="vlm-task-chart">
    <div shuku-edit-id="e-066140a9-8f77-4646-a56b-ec15d02e3311" className="vlm-task-chart-legend"><Typography shuku-edit-id="e-eed9a8e8-1979-4583-a1d5-98223a1fec64" variant="bodySmall" tone="accent">蓝：产品 A</Typography><Typography shuku-edit-id="e-be985b7a-bb10-4982-9e4d-633946c22fb5" variant="bodySmall">橙：产品 B</Typography><Typography shuku-edit-id="e-583f927d-4fa5-41e4-9698-e611e219fd04" variant="bodySmall">百万美元</Typography></div>
    <div shuku-edit-id="e-08a03f1f-c2bc-461b-bdbd-a08e6d2e7d08" className="vlm-task-chart-plot" role="img" aria-label="两产品2010至2015销售额；A为40、55、60、65、60、70，B为30、35、40、45、55、90">
      <svg shuku-edit-id="e-6270cb2c-2472-4007-bf61-1aee76d3d5c0" viewBox="0 0 600 220" preserveAspectRatio="none" aria-hidden="true"><path shuku-edit-id="e-c1bb08c9-8d33-48ad-8932-541d54c1031f" d="M86 15V200H580" stroke="#cad5e3" fill="none"/>{[salesA,salesB].map((series,index)=><g shuku-edit-id="e-ace691e5-6127-4f89-9418-82b3a0cc67f0" key={index}><polyline shuku-edit-id="e-ddf80078-e67a-4c19-9b80-301d686ce6ff" points={series.map((v,i)=>`${x(i)},${y(v)}`).join(' ')} fill="none" stroke={index?'#F07E47':'#27446E'} strokeWidth="4"/>{series.map((v,i)=><circle shuku-edit-id="e-ff6f9352-4fb1-4e1b-b952-676db59c719e" key={i} cx={x(i)} cy={y(v)} r="5" fill={index?'#F07E47':'#27446E'}/>)}</g>)}{evidence&&maxGapYears.map(year=><path shuku-edit-id="e-4c8c67b0-1c54-49f5-b230-f6cfd2624d33" key={year} d={`M${x(year-2010)} ${y(salesA[year-2010])}V${y(salesB[year-2010])}`} stroke="#F07E47" strokeWidth="5" strokeDasharray="5 4"/>)}</svg>
    </div>
    <table shuku-edit-id="e-54a96029-ddd7-4016-a848-321818d0a65c" className="vlm-task-values" aria-label="产品销售额与绝对差值">
      <thead shuku-edit-id="e-f9e91adc-73e3-4f28-97f6-caac29132ef9"><tr shuku-edit-id="e-5860fe37-7ca7-4425-a397-fe2621b3e86a"><th shuku-edit-id="e-a477746c-5d78-4070-933a-ff0a66870c98" scope="col"><Typography shuku-edit-id="e-4878835b-a18f-4c51-a777-1a634eafd660" variant="bodySmall">年份</Typography></th>{salesA.map((_,i)=><th shuku-edit-id="e-8a520b02-3972-4b27-b263-6a4e6aad626a" scope="col" key={i}><Typography shuku-edit-id="e-3eec53ac-a1b1-4ab0-b480-70ef05d6249f" variant="bodySmall">{2010+i}</Typography></th>)}</tr></thead>
      <tbody shuku-edit-id="e-e4b9b31c-8547-4a2c-956f-d540c123d0ef">{[['A',salesA],['B',salesB],['差值',salesA.map((v,i)=>Math.abs(v-salesB[i]))]].map(([label,values],row)=><tr shuku-edit-id="e-001c01e0-da7a-4c7f-893f-eaa7ff2fcab3" key={String(label)} data-revealed={row<2||evidence}><th shuku-edit-id="e-0fc0ed74-7b74-4ff5-ab3d-3309867b9e40" scope="row"><Typography shuku-edit-id="e-5e34d900-dd5d-4137-8578-e876f90c3796" variant="bodySmall">{String(label)}</Typography></th>{(values as number[]).map((v,i)=><td shuku-edit-id="e-94d409af-6155-40b2-ac38-c338f15ce08f" key={i} data-max-gap={evidence&&Math.abs(salesA[i]-salesB[i])===20}><Typography shuku-edit-id="e-a9240500-7260-47da-ae7b-fdf25721256a" variant="bodySmall">{v}</Typography></td>)}</tr>)}</tbody>
    </table>
  </div>;
}
export function SourceTasks() {
  const sequence=useStepSequence(6), stage=sequence.step, task=Math.floor(stage/2), evidence=stage%2===1;
  const titles=['场景理解','文档理解','图表理解'];
  const questions=['图中发生了什么？','收件地址的邮编是什么？','哪一年两产品销售额的绝对差值最大？'];
  const answers=['女孩撑着红伞，与龙猫站在雨中。','收件地址邮编：80202。',`${maxGapYears.join('、')} 并列最大。`];
  const clues=['定位红色伞面与右侧龙猫，再结合雨线核对场景。','读取右下方收件地址末行；左上寄件邮编 80301 不是答案。','逐年算 |A−B|：10、20、20、20、5、20。2015 年不是唯一最大。'];
  return <div shuku-edit-id="e-d24b322c-f070-4fb5-8a21-94910c10c215" className="vlm-focused-tasks" ref={sequence.hostRef} data-vlm-stage={stage} data-task={task} data-evidence={evidence}>
    <div shuku-edit-id="e-740c0b02-2289-422c-ba7e-b71969306a4e" className="vlm-task-progress">{titles.map((title,i)=><Typography shuku-edit-id="e-5a271bc3-d5d1-410f-b1f7-d676d0830ed6" key={title} variant="body" tone={i===task?'accent':'muted'}>{i+1}. {title}</Typography>)}</div>
    <div shuku-edit-id="e-73acf93e-bb5b-4761-bc9c-a1cc04b1a9d0" className="vlm-task-focus">
      <section shuku-edit-id="e-7152955f-ec13-4536-92b3-b1786a7a4e08" className="vlm-task-focus-media" aria-label={`${titles[task]}输入与证据`}>
        {task===0&&<ImageFocus>{evidence&&<><div shuku-edit-id="e-68ae855b-c08d-414c-8d13-4e924e6c510d" className="vlm-evidence-region" style={{left:'26%',top:'47%',width:'30%',height:'25%'}}/><div shuku-edit-id="e-e4fe61b6-87d3-490b-a3c5-11fe17ac49da" className="vlm-evidence-region" style={{left:'53%',top:'22%',width:'36%',height:'73%'}}/></>}</ImageFocus>}
        {task===1&&<div shuku-edit-id="e-b187726e-10f2-4ca8-844d-05d9d2dd739a" className="vlm-task-envelope"><SourceCrop src={source} rect={[609,380,449,295]} alt="信封上的寄件和收件地址"/>{evidence&&<div shuku-edit-id="e-c6a004d9-21d8-499e-a54a-89f3fee6fe73" className="vlm-task-postcode" aria-label="收件地址末行邮编80202的证据区域"/>}</div>}
        {task===2&&<SalesChart evidence={evidence}/>}
      </section>
      <section shuku-edit-id="e-5b2837cc-dad3-4afb-941d-e8651b640f8d" className="vlm-task-focus-reasoning"><Heading>{titles[task]} · {evidence?'定位证据与回答':'先读问题'}</Heading><Text>{questions[task]}</Text><div shuku-edit-id="e-3e72dfe3-8eec-4f80-b0f2-0326e21d6911" className="vlm-task-reserved-answer" data-revealed={evidence} aria-hidden={!evidence}>{evidence&&<><Typography shuku-edit-id="e-76557f45-5ff7-4738-85a0-2bfcb2590deb" variant="body" tone="accent">{answers[task]}</Typography><Text>{clues[task]}</Text></>}</div></section>
    </div>
    <Typography shuku-edit-id="e-b7f109ce-a527-4ca5-9275-364577adcc28" variant="bodySmall" tone="muted">教学示例 · 图片＋指令 → 语言答案；框线标出核对依据，不是模型注意力。</Typography><StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="逐个查看视觉任务"/>
  </div>;
}

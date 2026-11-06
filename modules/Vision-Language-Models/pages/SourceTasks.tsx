
import { Typography } from '../../shared/react';
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
  return <div className="vlm-task-chart">
    <div className="vlm-task-chart-legend"><Typography variant="bodySmall" tone="accent">蓝：产品 A</Typography><Typography variant="bodySmall">橙：产品 B</Typography><Typography variant="bodySmall">百万美元</Typography></div>
    <div className="vlm-task-chart-plot" role="img" aria-label="两产品2010至2015销售额；A为40、55、60、65、60、70，B为30、35、40、45、55、90">
      <svg viewBox="0 0 600 220" preserveAspectRatio="none" aria-hidden="true"><path d="M86 15V200H580" stroke="#cad5e3" fill="none"/>{[salesA,salesB].map((series,index)=><g key={index}><polyline points={series.map((v,i)=>`${x(i)},${y(v)}`).join(' ')} fill="none" stroke={index?'#F07E47':'#27446E'} strokeWidth="4"/>{series.map((v,i)=><circle key={i} cx={x(i)} cy={y(v)} r="5" fill={index?'#F07E47':'#27446E'}/>)}</g>)}{evidence&&maxGapYears.map(year=><path key={year} d={`M${x(year-2010)} ${y(salesA[year-2010])}V${y(salesB[year-2010])}`} stroke="#F07E47" strokeWidth="5" strokeDasharray="5 4"/>)}</svg>
    </div>
    <table className="vlm-task-values" aria-label="产品销售额与绝对差值">
      <thead><tr><th scope="col"><Typography variant="bodySmall">年份</Typography></th>{salesA.map((_,i)=><th scope="col" key={i}><Typography variant="bodySmall">{2010+i}</Typography></th>)}</tr></thead>
      <tbody>{[['A',salesA],['B',salesB],['差值',salesA.map((v,i)=>Math.abs(v-salesB[i]))]].map(([label,values],row)=><tr key={String(label)} data-revealed={row<2||evidence}><th scope="row"><Typography variant="bodySmall">{String(label)}</Typography></th>{(values as number[]).map((v,i)=><td key={i} data-max-gap={evidence&&Math.abs(salesA[i]-salesB[i])===20}><Typography variant="bodySmall">{v}</Typography></td>)}</tr>)}</tbody>
    </table>
  </div>;
}
export function SourceTasks() {
  const sequence=useStepSequence(6), stage=sequence.step, task=Math.floor(stage/2), evidence=stage%2===1;
  const titles=['场景理解','文档理解','图表理解'];
  const questions=['图中发生了什么？','收件地址的邮编是什么？','哪一年两产品销售额的绝对差值最大？'];
  const answers=['女孩撑着红伞，与龙猫站在雨中。','收件地址邮编：80202。',`${maxGapYears.join('、')} 并列最大。`];
  const clues=['定位红色伞面与右侧龙猫，再结合雨线核对场景。','读取右下方收件地址末行；左上寄件邮编 80301 不是答案。','逐年算 |A−B|：10、20、20、20、5、20。2015 年不是唯一最大。'];
  return <div className="vlm-focused-tasks" ref={sequence.hostRef} data-vlm-stage={stage} data-task={task} data-evidence={evidence}>
    <div className="vlm-task-progress">{titles.map((title,i)=><Typography key={title} variant="body" tone={i===task?'accent':'muted'}>{i+1}. {title}</Typography>)}</div>
    <div className="vlm-task-focus">
      <section className="vlm-task-focus-media" aria-label={`${titles[task]}输入与证据`}>
        {task===0&&<ImageFocus>{evidence&&<><div className="vlm-evidence-region" style={{left:'26%',top:'47%',width:'30%',height:'25%'}}/><div className="vlm-evidence-region" style={{left:'53%',top:'22%',width:'36%',height:'73%'}}/></>}</ImageFocus>}
        {task===1&&<div className="vlm-task-envelope"><SourceCrop src={source} rect={[609,380,449,295]} alt="信封上的寄件和收件地址"/>{evidence&&<div className="vlm-task-postcode" aria-label="收件地址末行邮编80202的证据区域"/>}</div>}
        {task===2&&<SalesChart evidence={evidence}/>}
      </section>
      <section className="vlm-task-focus-reasoning"><Heading>{titles[task]} · {evidence?'定位证据与回答':'先读问题'}</Heading><Text>{questions[task]}</Text><div className="vlm-task-reserved-answer" data-revealed={evidence} aria-hidden={!evidence}>{evidence&&<><Typography variant="body" tone="accent">{answers[task]}</Typography><Text>{clues[task]}</Text></>}</div></section>
    </div>
    <Typography variant="bodySmall" tone="muted">教学示例 · 图片＋指令 → 语言答案；框线标出核对依据，不是模型注意力。</Typography><StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="逐个查看视觉任务"/>
  </div>;
}

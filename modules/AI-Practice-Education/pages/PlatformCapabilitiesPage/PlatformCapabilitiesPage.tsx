import { ContentBlock, Typography } from '../../../shared/react';
import outline from '../../outlines.json';
import './PlatformCapabilitiesPage.css';
const capabilities=[['科研信息获取','看什么','与目标相关的研究'],['学习内容生成','怎么学','可交互、可渐进的内容'],['编程实践','怎么练','实现、运行与实验'],['学习评价','学得怎样','任务表现与针对性反馈']];
export function PlatformCapabilitiesPage(){return <ContentBlock className="aipe-capability-preview" headingLevel={1} title={outline.pages[4].title} subtitle="内容占位 · 先确认能力关系" bodyClassName="aipe-capability-preview-body">
 <Typography as="p" variant="h2" tone="accent">前四项形成学习闭环，生态连接支持持续发展</Typography>
 <div className="aipe-capability-preview-flow">{capabilities.map(([title,question,detail],i)=><section key={title}><Typography as="span" variant="bodySmall" tone="muted">{String(i+1).padStart(2,'0')}</Typography><Typography as="h2" variant="h3" tone="accent">{title}</Typography><Typography as="p" variant="body" tone="accent">{question}</Typography><Typography as="p" variant="bodySmall" tone="muted">{detail}</Typography></section>)}</div>
 <Typography as="p" variant="body" tone="muted" className="aipe-capability-preview-feedback">依据学习表现，调整信息供给、内容与实践任务</Typography>
 <section className="aipe-capability-preview-ecosystem"><Typography as="h2" variant="h2" tone="accent">05　科研教育生态</Typography><Typography as="p" variant="body" tone="muted">连接教师、学生、科研工作者与产业，支持人才培养、内容共建与科研协作。</Typography></section>
 </ContentBlock>;}

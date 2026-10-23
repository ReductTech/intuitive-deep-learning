import { ContentBlock, Typography } from '../../shared/react';
import outline from '../outlines.json';
import './CreatorSkillIntro.css';

const steps = [
  { number: '01', title: '组织内容', description: '明确目标与受众，梳理叙事和页面大纲。' },
  { number: '02', title: '设计与实现', description: '安排信息层级，复用组件实现 React 页面。' },
  { number: '03', title: '评估与修正', description: '检查内容、布局和运行效果，发现问题再改进。' },
];

export function CreatorSkillIntro() {
  return (
    <ContentBlock className="be-intro" headingLevel={1} title={outline.pages[0].title} subtitle="从主题与材料，到可以运行的 React 演示页面" bodyClassName="be-intro-body">
      <section className="be-definition">
        <Typography variant="bodySmall" tone="muted">一句话理解</Typography>
        <Typography variant="h2">一套指导 AI 创作 React 演示页面的工作流程与规范。</Typography>
        <Typography variant="body" tone="muted">你提供主题、材料与表达目标，它帮助 AI 把内容组织成清晰、可运行的页面。</Typography>
      </section>
      <div className="be-process">
        {steps.map(step => (
          <section className="be-step" key={step.number}>
            <Typography variant="bodySmall" tone="accent">{step.number}</Typography>
            <Typography as="h2" variant="h3">{step.title}</Typography>
            <Typography variant="body" tone="muted">{step.description}</Typography>
          </section>
        ))}
      </div>
      <footer className="be-footer">
        <Typography variant="body" tone="accent">让创作者更专注于内容表达。</Typography>
        <Typography variant="bodySmall" tone="muted">适用于教学课件、科研汇报与商业演示</Typography>
      </footer>
    </ContentBlock>
  );
}

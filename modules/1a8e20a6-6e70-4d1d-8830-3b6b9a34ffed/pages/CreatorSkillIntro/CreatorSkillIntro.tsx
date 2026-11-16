import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './CreatorSkillIntro.css';

const steps = [
  { number: '01', title: '组织内容', description: '明确目标与受众，梳理叙事和页面大纲。' },
  { number: '02', title: '设计与实现', description: '安排信息层级，复用组件实现 React 页面。' },
  { number: '03', title: '评估与修正', description: '检查内容、布局和运行效果，发现问题再改进。' },
];

export function CreatorSkillIntro() {
  return (
    <ContentBlock shuku-edit-id="e-d5261b63-5b28-4153-9e03-8742734c790f" className="be-intro" headingLevel={1} title={outline.pages.find(page => page.id === 'f44e1a4d-1b51-4732-89ac-338e08d2ef97')!.title} subtitle="从主题与材料，到可以运行的 React 演示页面" bodyClassName="be-intro-body">
      <section shuku-edit-id="e-7f29ee3d-242f-4b4e-8e41-dd36b80a93af" className="be-definition">
        <Typography shuku-edit-id="e-afb291f0-767e-4c3f-b097-757c7b554aa8" variant="bodySmall" tone="muted">一句话理解</Typography>
        <Typography shuku-edit-id="e-1368ef0a-4ab3-47f4-9635-85dcca918eaf" variant="h2">一套指导 AI 创作 React 演示页面的工作流程与规范。</Typography>
        <Typography shuku-edit-id="e-16b8f0c1-1131-4a51-95fc-f7f29a218e15" variant="body" tone="muted">你提供主题、材料与表达目标，它帮助 AI 把内容组织成清晰、可运行的页面。</Typography>
      </section>
      <div shuku-edit-id="e-dd474937-abf3-44d0-8a9c-5613d4d3ce71" className="be-process">
        {steps.map(step => (
          <section shuku-edit-id="e-9adf8958-adc3-48ab-a736-b287a1d62f00" className="be-step" key={step.number}>
            <Typography shuku-edit-id="e-8225ab20-5fad-4129-821a-133af474bccc" variant="bodySmall" tone="accent">{step.number}</Typography>
            <Typography shuku-edit-id="e-cef71f8a-8566-4f3d-91a4-82c4edf4db45" as="h2" variant="h3">{step.title}</Typography>
            <Typography shuku-edit-id="e-e0984b2c-6f19-4bca-9ad3-9e2bb5780a42" variant="body" tone="muted">{step.description}</Typography>
          </section>
        ))}
      </div>
      <footer shuku-edit-id="e-69df55e6-257f-4862-ab21-3430be694db3" className="be-footer">
        <Typography shuku-edit-id="e-702cdcf9-6013-4868-ad9e-937de79c727b" variant="body" tone="accent">让创作者更专注于内容表达。</Typography>
        <Typography shuku-edit-id="e-02f169f7-14d5-457a-9a32-011fbac34d2f" variant="bodySmall" tone="muted">适用于教学课件、科研汇报与商业演示</Typography>
      </footer>
    </ContentBlock>
  );
}

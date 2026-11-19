import { useState } from 'react';
import { Button, ContentBlock, Typography } from '@shuku/course-style/react';
import './PresentationPracticePage.css';
const steps = [
  ['讲清问题', '这个作品为谁解决什么问题？', '先说使用者和具体场景，让听众理解为什么值得做。'],
  ['演示过程', '哪个操作最能体现你的方案？', '展示一条完整的使用过程，解释你的关键选择。'],
  ['拿出证据', '结果是什么，你做出了什么贡献？', '用可观察的结果支持判断，并准备回应追问。'],
] as const;
export function PresentationPracticePage() {
  const [active, setActive] = useState(0);
  return <ContentBlock className="acw-presentation" title="把作品讲给别人听，也是在练习表达能力" subtitle="用自己的作品练习：问题 → 演示 → 证据。" headingLevel={1}><div className="acw-presentation__body">
    <div className="acw-presentation__cards">{steps.map(([title, question, detail], index) => <section key={title} className={active === index ? 'is-active' : undefined}><Button active={active === index} aria-pressed={active === index} onClick={() => setActive(index)}>{title}</Button><Typography variant="h3" tone="accent">{question}</Typography><Typography variant="body">{detail}</Typography></section>)}</div>
    <Typography variant="h3" tone="accent" aria-live="polite">当前练习：{steps[active][1]}</Typography>
    <Typography variant="body" tone="muted">让别人理解你的问题、方案和贡献；回应追问，而不只是逐个念功能名称。</Typography>
    <div className="acw-presentation__controls"><Button variant="primary" onClick={() => setActive(index => (index + 1) % steps.length)}>练习下一部分</Button><Button onClick={() => setActive(0)}>重新开始</Button></div>
  </div></ContentBlock>;
}

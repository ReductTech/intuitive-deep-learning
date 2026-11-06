import type { CSSProperties } from 'react';
import { ArrowRight } from '@icon-park/react';
import { ContentBlock, MathFormulaBlock, MathFormulaTerm, Typography, moduleAssetUrl } from '../../../shared/react';
import passengers from './titanic-passengers.json';
import './RegressionClassificationPage.css';

const ship = moduleAssetUrl('95728790-5709-43e1-ada6-99687813ab3b', 'titanic/atlantic-liner.jpg');
const classes = ['一等舱', '二等舱', '三等舱'];
const exampleProbability = .92;
const outputValue = exampleProbability.toFixed(2);
const probabilityPercent = Math.round(exampleProbability * 100);
const ports: Record<string, string> = { S: 'Southampton', C: 'Cherbourg', Q: 'Queenstown' };

export function RegressionClassificationPage() {
  return <ContentBlock headingLevel={1} title="从数值预测到类别预测" subtitle="存活状态只有两类；模型用概率表达存活的可能性。" className="rl-task-page" style={{ '--titanic-image': `url("${ship}")` } as CSSProperties}>
    <div className="rl-task-layout">
      <section className="rl-task-manifest">
        <div className="rl-task-manifest-heading"><Typography variant="h3" tone="accent">乘客名单</Typography><Typography variant="bodySmall" tone="muted">{passengers.length}条训练记录</Typography></div>
        <div className="rl-task-scroll" tabIndex={0} role="region" aria-label="可滚动的完整泰坦尼克号训练乘客名单">
          <table className="rl-task-table" aria-rowcount={passengers.length+1}><colgroup><col/><col/><col/><col/><col/><col/></colgroup><thead><tr>{['编号','乘客姓名','性别','年龄','舱位','实际结果'].map(label=><th scope="col" key={label}><Typography as="span" variant="bodySmall" tone="inherit">{label}</Typography></th>)}</tr></thead><tbody>
            {passengers.map(person=><tr key={person.PassengerId}>
              <td><Typography as="span" variant="bodySmall" tone="muted">{person.PassengerId}</Typography></td>
              <td title={`${person.Name}\n票价：£${person.Fare}\n同行兄弟姐妹/配偶：${person.SibSp}；父母/子女：${person.Parch}\n船票：${person.Ticket}\n客舱：${person.Cabin||'缺失'}\n登船港：${ports[person.Embarked]||'缺失'}`}><Typography as="span" variant="bodySmall" tone="accent" wrap="truncate">{person.Name}</Typography></td>
              <td><Typography as="span" variant="bodySmall" tone="accent">{person.Sex==='male'?'男':'女'}</Typography></td>
              <td><Typography as="span" variant="bodySmall" tone="accent">{person.Age??'—'}</Typography></td>
              <td><Typography as="span" variant="bodySmall" tone="accent" wrap="nowrap">{classes[person.Pclass-1]}</Typography></td>
              <td className="rl-task-outcome"><Typography as="span" variant="bodySmall" tone={person.Survived?'success':'danger'} wrap="nowrap">{person.Survived?'1 存活':'0 未存活'}</Typography></td>
            </tr>)}
          </tbody></table>
        </div>
        <div className="rl-task-manifest-note"><Typography variant="bodySmall" tone="muted">年龄、性别、舱位等作为乘客特征。</Typography><div className="rl-task-label-note"><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="Y\in\{0,1\}" tooltip="Y是实际存活标签：0表示未存活，1表示存活。名单包含完整891条带标签训练记录；缺失年龄以横线显示。悬浮姓名可查看完整姓名及其余原始字段。"/></MathFormulaBlock><Typography as="span" variant="bodySmall" tone="accent">实际结果只有两类</Typography></div></div>
      </section>
      <div className="rl-task-comparison">
        <section className="rl-task-model-panel rl-task-model-panel--regression">
          <Typography variant="h3" tone="accent">回归模型用于类别预测的局限</Typography>
          <div className="rl-task-model-flow">
            <div><Typography variant="bodySmall" tone="accent">乘客资料</Typography><Typography variant="bodySmall" tone="muted">年龄、性别、舱位等</Typography></div>
            <ArrowRight size={32} fill="#27446e" aria-hidden="true"/>
            <Typography variant="body" tone="accent">回归模型</Typography>
            <ArrowRight size={32} fill="#27446e" aria-hidden="true"/>
            <div className="rl-task-output-value"><MathFormulaBlock appearance="plain"><MathFormulaTerm latex={outputValue} tooltip="用于说明输出含义的示例值，未对名单中的乘客进行模型训练或计算。"/></MathFormulaBlock></div>
          </div>
          <div className="rl-task-model-explanation"><Typography variant="body" tone="danger">这个数值不能直接表示存活状态。</Typography><Typography variant="bodySmall" tone="danger">不能理解为“这个人有{outputValue}个部分活下来”；实际结果只有存活或未存活。</Typography></div>
        </section>
        <section className="rl-task-model-panel rl-task-model-panel--probability">
          <Typography variant="h3" tone="accent">以概率表达存活的可能性</Typography>
          <div className="rl-task-model-flow">
            <div><Typography variant="bodySmall" tone="accent">乘客资料</Typography><Typography variant="bodySmall" tone="muted">年龄、性别、舱位等</Typography></div>
            <ArrowRight size={32} fill="#27446e" aria-hidden="true"/>
            <div><Typography variant="body" tone="accent">概率模型</Typography><Typography variant="bodySmall" tone="muted">输出0～1</Typography></div>
            <ArrowRight size={32} fill="#27446e" aria-hidden="true"/>
            <div className="rl-task-output-value"><MathFormulaBlock appearance="plain"><MathFormulaTerm latex={outputValue} tooltip="示例概率为0.92，即92%。概率取值在0与1之间。"/></MathFormulaBlock></div>
          </div>
          <div className="rl-task-model-explanation"><MathFormulaBlock appearance="plain"><MathFormulaTerm latex={String.raw`P(\text{存活}\mid\mathbf x)=${outputValue}=${probabilityPercent}\%`} tooltip="给定乘客资料x，模型估计的存活概率为92%。这是概率，而不是介于存活与未存活之间的状态。" tooltipPlacement="top"/></MathFormulaBlock><Typography variant="bodySmall" tone="accent">0.92表示：该乘客有92%的概率存活。</Typography></div>
        </section>
      </div>
    </div>
  </ContentBlock>;
}

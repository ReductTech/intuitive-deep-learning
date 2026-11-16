import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import type { CSSProperties } from 'react';
import { ArrowRight } from '@icon-park/react';
import { ContentBlock, MathFormulaBlock, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import passengers from './titanic-passengers.json';
import './RegressionClassificationPage.css';

const ship = moduleAssetUrl('titanic/atlantic-liner.jpg');
const classes = ['一等舱', '二等舱', '三等舱'];
const exampleProbability = .92;
const outputValue = exampleProbability.toFixed(2);
const probabilityPercent = Math.round(exampleProbability * 100);
const ports: Record<string, string> = { S: 'Southampton', C: 'Cherbourg', Q: 'Queenstown' };

export function RegressionClassificationPage() {
  return <ContentBlock shuku-edit-id="e-3ba4b980-0b91-4e01-8ded-bcfaddbe66c7" headingLevel={1} title="从数值预测到类别预测" subtitle="存活状态只有两类；模型用概率表达存活的可能性。" className="rl-task-page" style={{ '--titanic-image': `url("${ship}")` } as CSSProperties}>
    <div shuku-edit-id="e-3bcfe433-fe5e-4b9c-925d-3ef865ac2486" className="rl-task-layout">
      <section shuku-edit-id="e-4fd88d06-023f-4a69-a858-46a57f2f1a54" className="rl-task-manifest">
        <div shuku-edit-id="e-6ca852f0-589f-4fa3-af5a-83260eb83420" className="rl-task-manifest-heading"><Typography shuku-edit-id="e-efb7de02-6d3d-46d2-9ee6-76fad1c15600" variant="h3" tone="accent">乘客名单</Typography><Typography shuku-edit-id="e-38e2e21a-6be1-405f-b4e0-cb177e6bbc1b" variant="bodySmall" tone="muted">{passengers.length}条训练记录</Typography></div>
        <div shuku-edit-id="e-4c116ae7-2004-4903-9322-be40b9bc46f2" className="rl-task-scroll" tabIndex={0} role="region" aria-label="可滚动的完整泰坦尼克号训练乘客名单">
          <table shuku-edit-id="e-0acdb63f-9dc6-45e8-8dc7-27e1d81f8ce1" className="rl-task-table" aria-rowcount={passengers.length+1}><colgroup shuku-edit-id="e-cdbab141-a27b-4465-af5c-a22c44bf4baf"><col shuku-edit-id="e-b5c93ed9-c8ac-4e4f-8c03-bdaee43aa7d1"/><col shuku-edit-id="e-5041b228-d716-4449-9fa5-8b744818c992"/><col shuku-edit-id="e-f01a7359-1525-40f7-b7db-feb81c342f4a"/><col shuku-edit-id="e-015065dc-e1a1-45b2-aac9-d46af59d1d81"/><col shuku-edit-id="e-b97de31b-8dee-4dbd-bcc4-c5b0822ae707"/><col shuku-edit-id="e-0d8998ed-6006-43cd-a6d0-e05ee23378b6"/></colgroup><thead shuku-edit-id="e-38e73d58-de66-4c0b-98c8-4c9b26c63269"><tr shuku-edit-id="e-59f565bb-3c1b-4d93-84f8-16a3622089f0">{['编号','乘客姓名','性别','年龄','舱位','实际结果'].map(label=><th shuku-edit-id="e-b631c585-94ba-46bf-93e0-fdad11004745" scope="col" key={label}><Typography shuku-edit-id="e-5a9846ce-2f23-4a7c-a667-d7c063a1cc82" as="span" variant="bodySmall" tone="inherit">{label}</Typography></th>)}</tr></thead><tbody shuku-edit-id="e-9c27e513-2dd4-4d53-97e5-a052ef32a862">
            {passengers.map(person=><tr shuku-edit-id="e-16b85cac-d05c-4c46-ba44-24c2d226fa49" key={person.PassengerId}>
              <td shuku-edit-id="e-eb77c72d-a04f-41c2-a911-f52be15e6d7b"><Typography shuku-edit-id="e-d1e2fb3c-0a6b-41ae-8a78-c2df6133ccc7" as="span" variant="bodySmall" tone="muted">{person.PassengerId}</Typography></td>
              <td shuku-edit-id="e-4e2c3e3a-1e86-436c-b965-cae2cc3da00d" title={`${person.Name}\n票价：£${person.Fare}\n同行兄弟姐妹/配偶：${person.SibSp}；父母/子女：${person.Parch}\n船票：${person.Ticket}\n客舱：${person.Cabin||'缺失'}\n登船港：${ports[person.Embarked]||'缺失'}`}><Typography shuku-edit-id="e-cf1baee1-5cde-4164-93ff-a0ed697f3732" as="span" variant="bodySmall" tone="accent" wrap="truncate">{person.Name}</Typography></td>
              <td shuku-edit-id="e-d0f796b4-0ff8-4315-ade8-07612f5fca43"><Typography shuku-edit-id="e-aee7ce0d-a4bf-4a87-addb-6018635a9fdb" as="span" variant="bodySmall" tone="accent">{person.Sex==='male'?'男':'女'}</Typography></td>
              <td shuku-edit-id="e-2ce16e1f-cb1f-4c97-9058-92754a8af610"><Typography shuku-edit-id="e-2fe79dac-b072-444c-9701-ee8f52826a2d" as="span" variant="bodySmall" tone="accent">{person.Age??'—'}</Typography></td>
              <td shuku-edit-id="e-c6ca4036-309e-4ce6-939a-4d7d08dd9497"><Typography shuku-edit-id="e-38542f00-4a63-43b7-927b-7ab870d110bb" as="span" variant="bodySmall" tone="accent" wrap="nowrap">{classes[person.Pclass-1]}</Typography></td>
              <td shuku-edit-id="e-83b7e4e6-f734-4966-af10-5f474e66423c" className="rl-task-outcome"><Typography shuku-edit-id="e-e464ea7f-3f60-415b-94a3-0e4fa8810ef0" as="span" variant="bodySmall" tone={person.Survived?'success':'danger'} wrap="nowrap">{person.Survived?'1 存活':'0 未存活'}</Typography></td>
            </tr>)}
          </tbody></table>
        </div>
        <div shuku-edit-id="e-d2626c2c-905b-4107-86e9-9b9f5d643c36" className="rl-task-manifest-note"><Typography shuku-edit-id="e-de8ac40d-0e03-46cf-8069-52beeab5d28c" variant="bodySmall" tone="muted">年龄、性别、舱位等作为乘客特征。</Typography><div shuku-edit-id="e-aad2556f-35c6-4f15-93c2-ea8aea0cb059" className="rl-task-label-note"><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="Y\in\{0,1\}" tooltip="Y是实际存活标签：0表示未存活，1表示存活。名单包含完整891条带标签训练记录；缺失年龄以横线显示。悬浮姓名可查看完整姓名及其余原始字段。"/></MathFormulaBlock><Typography shuku-edit-id="e-a9d88d2d-ac0a-4fe5-bbfc-313c75baa18e" as="span" variant="bodySmall" tone="accent">实际结果只有两类</Typography></div></div>
      </section>
      <div shuku-edit-id="e-22a0b509-ab63-4b29-84ac-ae3024d4c7fa" className="rl-task-comparison">
        <section shuku-edit-id="e-f301d843-00ac-4343-a930-157e8332e127" className="rl-task-model-panel rl-task-model-panel--regression">
          <Typography shuku-edit-id="e-9dded123-8e1a-4aee-a69c-59689d3a59a3" variant="h3" tone="accent">回归模型用于类别预测的局限</Typography>
          <div shuku-edit-id="e-4fdd6bc1-b9d2-47f5-8483-6a422f21a36f" className="rl-task-model-flow">
            <div shuku-edit-id="e-3f88d27e-7606-43cd-ae63-b8d6bfd0261a"><Typography shuku-edit-id="e-9d66da46-ebdd-4a8c-96e5-cf9eb6fc4a8d" variant="bodySmall" tone="accent">乘客资料</Typography><Typography shuku-edit-id="e-63ff71ee-28b3-4c7d-ba44-f2a847a088ce" variant="bodySmall" tone="muted">年龄、性别、舱位等</Typography></div>
            <ArrowRight size={32} fill="#27446e" aria-hidden="true"/>
            <Typography shuku-edit-id="e-33d93cef-de91-46eb-bd15-328d98e42c1d" variant="body" tone="accent">回归模型</Typography>
            <ArrowRight size={32} fill="#27446e" aria-hidden="true"/>
            <div shuku-edit-id="e-beabd1bd-e1bb-403f-8c10-2bb82f7dbc21" className="rl-task-output-value"><MathFormulaBlock appearance="plain"><MathFormulaTerm latex={outputValue} tooltip="用于说明输出含义的示例值，未对名单中的乘客进行模型训练或计算。"/></MathFormulaBlock></div>
          </div>
          <div shuku-edit-id="e-2e92af05-9da5-4e78-9086-f7c55dce8d9c" className="rl-task-model-explanation"><Typography shuku-edit-id="e-eafe7a6b-0b82-4b00-aa8e-812cea0ee666" variant="body" tone="danger">这个数值不能直接表示存活状态。</Typography><Typography shuku-edit-id="e-b25747cd-6dc8-43b8-9a20-ae0d0e957c1b" variant="bodySmall" tone="danger">不能理解为“这个人有{outputValue}个部分活下来”；实际结果只有存活或未存活。</Typography></div>
        </section>
        <section shuku-edit-id="e-41d7f9c2-31be-4605-9412-d1ed9b29d56c" className="rl-task-model-panel rl-task-model-panel--probability">
          <Typography shuku-edit-id="e-5c3239df-ca5f-4aa6-b1ba-1c88388dd314" variant="h3" tone="accent">以概率表达存活的可能性</Typography>
          <div shuku-edit-id="e-903138e9-ed87-4188-a8e1-a7ae53420307" className="rl-task-model-flow">
            <div shuku-edit-id="e-0e9a2215-5f03-4696-8315-941110bbc414"><Typography shuku-edit-id="e-14d7f2e9-4b09-4d73-a699-14497d570060" variant="bodySmall" tone="accent">乘客资料</Typography><Typography shuku-edit-id="e-6ba344ce-4fdd-499a-8327-c17d0e5ad14b" variant="bodySmall" tone="muted">年龄、性别、舱位等</Typography></div>
            <ArrowRight size={32} fill="#27446e" aria-hidden="true"/>
            <div shuku-edit-id="e-e003c48a-5382-4974-a09c-4dc851ca2167"><Typography shuku-edit-id="e-a2f2c469-fdd2-47c8-9891-aa31f24c85db" variant="body" tone="accent">概率模型</Typography><Typography shuku-edit-id="e-1ca0714b-b733-4037-a737-4c8d277b6379" variant="bodySmall" tone="muted">输出0～1</Typography></div>
            <ArrowRight size={32} fill="#27446e" aria-hidden="true"/>
            <div shuku-edit-id="e-5c78549e-8e2c-4d47-84e5-f6c41354c926" className="rl-task-output-value"><MathFormulaBlock appearance="plain"><MathFormulaTerm latex={outputValue} tooltip="示例概率为0.92，即92%。概率取值在0与1之间。"/></MathFormulaBlock></div>
          </div>
          <div shuku-edit-id="e-33e2d9df-7086-4914-b3a5-55d432b87803" className="rl-task-model-explanation"><MathFormulaBlock appearance="plain"><MathFormulaTerm latex={String.raw`P(\text{存活}\mid\mathbf x)=${outputValue}=${probabilityPercent}\%`} tooltip="给定乘客资料x，模型估计的存活概率为92%。这是概率，而不是介于存活与未存活之间的状态。" tooltipPlacement="top"/></MathFormulaBlock><Typography shuku-edit-id="e-d35b7638-3676-49a4-970c-06225e768b8b" variant="bodySmall" tone="accent">0.92表示：该乘客有92%的概率存活。</Typography></div>
        </section>
      </div>
    </div>
  </ContentBlock>;
}

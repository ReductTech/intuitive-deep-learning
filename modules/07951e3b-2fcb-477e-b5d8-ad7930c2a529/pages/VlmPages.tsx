import { ConnectorExperiment, ContextExperiment, TrainingExperiment } from "./VlmExperiments";
import { SourceTasks } from "./SourceTasks";
import { EvidenceComparison } from "./VlmEvidence";
import { useState } from "react";

import { Typography } from "@shuku/course-style/react";
import { Action, Equation, Heading, PatchGrid, Photo, Text, useStepSequence, StepSequenceControl } from "../components/LessonVisuals";
import { Features, ImageFocus } from "../components/TeachingVisuals";
import { queryAggregation } from "../model/teachingMath";
import "./VlmPages.css";
import "./VlmFeedback.css";

function BridgeBody() {
  const sequence=useStepSequence(3), stage=sequence.step;
  const candidates=['女孩和龙猫站在雨中','一只猫坐在窗边','一辆汽车停在街边'];
  return <div shuku-edit-id="e-73faee27-ff2a-4067-9cb1-6fba32f14fb1" className="vlm-bridge-lesson vlm-stage-reveal" ref={sequence.hostRef} data-vlm-stage={stage}>
    <div shuku-edit-id="e-fc79c73a-4cd0-417d-a4e9-924ba4bcac37" className="vlm-bridge-comparison">
      <section shuku-edit-id="e-df038d57-cdea-4ee7-ac12-7f9635f01553" className="vlm-bridge-image" data-vlm-step="0"><Heading>同一张图，同一个问题</Heading><ImageFocus/><div shuku-edit-id="e-d0a944cb-6269-4c90-97f2-64d20e1a06ca" className="vlm-bridge-question"><Typography shuku-edit-id="e-d023fe66-dcd6-4197-90a4-666d56a69dac" variant="body">图中发生了什么？</Typography></div></section>
      <section shuku-edit-id="e-3684eb13-8808-420c-a946-e34877425ec9" className="vlm-bridge-matching" data-vlm-step="1"><Heading>CLIP：从候选中选</Heading><div shuku-edit-id="e-c0255369-793b-4bb7-a425-286a8ddbc84a" className="vlm-bridge-candidates">{candidates.map((text,i)=><div shuku-edit-id="e-c1701de3-81ca-4dc9-877a-b238e026ffcc" className={i===0?'is-best':''} key={text}><Text>{text}</Text><Typography shuku-edit-id="e-095dbaff-678c-46ee-a73a-19b75114fe5a" variant="body" tone={i===0?'accent':'main'}>{[.84,.11,.05][i].toFixed(2)}</Typography></div>)}</div><Text>返回相似度，不生成新句子。</Text></section>
      <section shuku-edit-id="e-1e593b6c-1917-46e1-8654-f9eaeb380797" className="vlm-bridge-generating" data-vlm-step="2"><Heading>VLM：生成语言回答</Heading><Typography shuku-edit-id="e-6789ab30-ea24-4f18-8149-784c43a37e30" variant="bodySmall">图片与问题一起作为条件</Typography><div shuku-edit-id="e-6fa521d5-2092-4702-a2ec-b13cfc81e2a8" className="vlm-bridge-answer"><Text>女孩撑着红伞，与龙猫站在雨中。</Text></div><Text>回答不需要事先写成候选列表。</Text></section>
    </div>
    <div shuku-edit-id="e-c22c851a-4e15-4ace-96b9-d6bdb59368ac" className="vlm-bridge-interface" role="status"><Typography shuku-edit-id="e-864dd597-96e1-4af5-bb6b-cec367cdb44d" variant="body" tone="accent">{['① 先看问题','② 候选匹配','③ 开放回答'][stage]}</Typography><Typography shuku-edit-id="e-dc7b5654-e66c-4348-b9d5-d1f44800d865" variant="body" aria-hidden="true">→</Typography><Text>{['找出画面里的人物、伞和雨景。','把整张图与三句候选分别比较。','视觉特征与问题共同约束生成内容。'][stage]}</Text><Typography shuku-edit-id="e-32271252-d1de-4425-aaca-f472f677a879" variant="body" aria-hidden="true">→</Typography><Text>{['下一步：候选如何表达这张图？','0.84 是相似度示意，不是正确率。','红伞、女孩与龙猫是核对回答的依据。'][stage]}</Text></div>
    <Typography shuku-edit-id="e-22d9578f-85de-422b-bbc6-a4b6af3a3f68" variant="bodySmall" tone="muted">仅有文本输入接口的 LLM，不能直接读取原始像素。相似度及回答均为教学示意。</Typography><StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="比较候选与开放回答"/>
  </div>;
}
function DataflowBody() {
  const sequence=useStepSequence(4), stage=Math.min(sequence.step,3);
  return <div shuku-edit-id="e-23e8847e-5d40-484e-b931-3ba521f681ea" className="vlm-dataflow-lesson vlm-stage-reveal" ref={sequence.hostRef} data-vlm-stage={stage}>
    <Typography shuku-edit-id="e-934870f9-1c97-4965-a859-39aa3a462449" variant="body" tone="accent">以 LLaVA-1.5 的视觉编码器＋MLP Connector＋LLM 路线为例</Typography>
    <div shuku-edit-id="e-2ad99008-da7f-450c-99dc-98f862dfbce0" className="vlm-dataflow-chain">
      <section shuku-edit-id="e-075e2b1d-43c7-40a1-93df-6da356d2ff9c" className="vlm-dataflow-image" data-vlm-step="0"><Heading>输入图像</Heading><ImageFocus/>{stage>=1&&<Typography shuku-edit-id="e-d0fdf17c-5222-4103-90eb-9a3d5e772a75" variant="bodySmall" tone="accent">线索：红伞、人物、雨景</Typography>}<Typography shuku-edit-id="e-c5cb2321-ae6f-49aa-91d4-c0ff96e1c4c1" variant="bodySmall">问题：图中发生了什么？</Typography></section>
      <section shuku-edit-id="e-14f0cfef-9533-4181-8748-07cc2fa70ab4" className="vlm-dataflow-node" data-vlm-step="1"><Heading>① 视觉编码器</Heading><Text>把像素编码成多个视觉向量。</Text><div shuku-edit-id="e-a36771b0-1cab-497d-877b-89d9dfee5ca2" className="vlm-dataflow-vectors"><Features rows={3} cols={6}/><Typography shuku-edit-id="e-540a41a6-1eac-439a-8448-508241e3803f" variant="bodySmall">不同位置的视觉特征</Typography></div></section>
      <section shuku-edit-id="e-757210be-96ac-462d-9ccb-b07b05483a1c" className="vlm-dataflow-node" data-vlm-step="2"><Heading>② Connector</Heading><Text>把每个视觉向量映射到 LLM 的输入维度。</Text><div shuku-edit-id="e-7103455f-e10a-4f91-8b7b-c583d02aece3" className="vlm-dataflow-vectors"><Features rows={3} cols={8} orange/><Typography shuku-edit-id="e-6fb91aef-5049-447c-bd59-7985b0c91cd3" variant="bodySmall">LLM 可接收的视觉向量</Typography></div></section>
      <section shuku-edit-id="e-c53eb299-04e7-4777-bacb-f79b01885af3" className="vlm-dataflow-node" data-vlm-step="3"><Heading>③ 语言模型</Heading><div shuku-edit-id="e-2c23c404-68da-4b44-aae1-8d703d223e4a" className="vlm-dataflow-context"><Typography shuku-edit-id="e-01b4789f-4b2d-4962-9d5e-c8b69dc7f94e" variant="bodySmall" tone="accent">视觉向量 ＋ 问题文字向量</Typography><Text>图中发生了什么？</Text></div><Typography shuku-edit-id="e-a9c6e210-f679-453b-a073-d3aa032193e8" variant="body" align="center" tone="muted">↓ 生成回答</Typography><div shuku-edit-id="e-42f9c136-600d-48dd-8a9c-5b8695085667" className="vlm-dataflow-answer"><Text>女孩撑着红伞，与龙猫站在雨中。</Text></div></section>
    </div>
    <div shuku-edit-id="e-7d5428af-6949-459f-8e63-48e9757efdfb" className="vlm-dataflow-summary"><Text>{['① 图片提供证据，问题决定要回答什么。','② 编码器提取多个位置的视觉特征，保留回答所需的图像线索。','③ Connector 把特征变成 LLM 可接收的宽度；仍是向量，不是文字描述。','④ 视觉向量与问题一起进入 LLM；用图中的红伞和人物核对生成回答。'][stage]}</Text><Typography shuku-edit-id="e-1e89ca2d-bb24-4245-95c4-3f2712c2e2f9" variant="bodySmall" tone="muted">色块与回答为结构示意。</Typography><StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="查看视觉数据流"/></div>
  </div>;
}
function FeaturesBody() {
  const sequence=useStepSequence(2), stage=Math.min(sequence.step,2);
  const tracked=294;
  return <div shuku-edit-id="e-61af6f0f-5ed6-4326-ad85-18946f5631ee" className="vlm-features-lesson vlm-stage-reveal" ref={sequence.hostRef} data-vlm-stage={stage}>
    <Typography shuku-edit-id="e-e2dd49e4-6526-4029-8a8e-e16f0f0c311e" variant="body" tone="accent">切换具体配置：前面 ViT-B/16 为 196 块；这里 LLaVA-1.5-7B 使用 CLIP ViT-L/14-336，为 576 块。</Typography>
    <div shuku-edit-id="e-de596cf4-655d-417b-b6a0-f1e1295705fc" className="vlm-two vlm-features-main">
      <section shuku-edit-id="e-2ba8e9de-bcbe-4a98-99ca-50891aa820fe" className="vlm-features-source" data-vlm-step="0"><Heading>输入按 24×24 个位置切分</Heading><Photo square><PatchGrid side={24}/><div shuku-edit-id="e-1a0ec769-a75d-426f-ac0c-b85305734c32" className="vlm-features-marker" aria-label="追踪第295个图块位置" style={{left:'25%',top:'50%',width:`${100/24}%`,height:`${100/24}%`}}/></Photo><Equation latex={'336\\times336,\\quad P=14,\\quad N=24^2=576'} label="336乘336的输入，每块14乘14，24乘24共576个图块位置"/></section>
      <section shuku-edit-id="e-69b19a3c-9cf4-4ce2-b1e1-ed1b8c399086" className="vlm-features-output" data-vlm-step="1"><Heading>每行是融合上下文后的特征</Heading><div shuku-edit-id="e-ddeeab17-9f03-4e3f-aca0-5244df83e704" className="vlm-feature-output-rows">{[0,tracked,575].map(position=><div shuku-edit-id="e-2caf4be9-24ee-400b-80e8-b37d1f402e2e" className={`vlm-feature-output-row ${position===tracked?'is-tracked':''}`} key={position}><Typography shuku-edit-id="e-c1ac933f-fe1d-4e68-8ae4-2a190f7133e0" variant="body">位置 {position+1}</Typography><Features rows={1} cols={8} seed={position+1}/><Typography shuku-edit-id="e-54824e14-520a-431e-862e-3d235077ed37" variant="bodySmall">1024 维</Typography></div>)}</div><Equation latex={'H_v\\in\\mathbb{R}^{576\\times1024}'} label="视觉特征矩阵有576行，每个位置一行，每行1024维"/><Text>经过自注意力，每行特征已能融合其他位置的信息。</Text><Typography shuku-edit-id="e-55488b20-0fed-4b5d-824b-adfc573d648f" variant="bodySmall">保留 Patch 特征，为语言模型提供多个视觉位置。</Typography></section>
    </div>
    <Typography shuku-edit-id="e-33630192-352e-4254-8207-73a7d41e5211" variant="bodySmall" tone="muted">正方形预处理、色块与三个代表位置为结构示意；此配置取倒数第二层的 Patch 特征，不含 CLS。</Typography><StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="查看视觉位置映射"/>
  </div>;
}
function ConnectorCompareBody() {
  const demo=queryAggregation();
  return <div shuku-edit-id="e-d34905f2-926b-47f6-bacc-9d0db8688e59" className="vlm-closing-connector">
    <div shuku-edit-id="e-f966d6b0-a58d-4cfa-a354-53d79ec1965e" className="vlm-interface-route"><div shuku-edit-id="e-90b9d996-8c0a-4176-858f-d740ebb0db75" className="vlm-closing-photo"><ImageFocus/></div><Text>→ 视觉编码器</Text><Typography shuku-edit-id="e-6ced7fe6-9042-4fe4-bb01-ad205f3e4964" variant="body" tone="accent">→ Connector</Typography><Text>→ 语言模型</Text></div>
    <div shuku-edit-id="e-54c19c00-51d7-46aa-9e2a-8cb496762cee" className="vlm-interface-branches"><Typography shuku-edit-id="e-2c70d55e-ad54-49d6-b085-68a424109f1b" variant="bodySmall" align="center">Connector：同一接口环节的两种实现</Typography><svg shuku-edit-id="e-994b2c9a-1c9b-41ea-9505-9f94cf7edbb0" viewBox="0 0 1000 40" preserveAspectRatio="none" role="img" aria-label="Connector 分支到左侧 MLP 和右侧 Q-Former"><path shuku-edit-id="e-df760052-1443-453c-99b5-e5e55e14a791" d="M625 0V12H250V36M625 12H750V36M242 28L250 36L258 28M742 28L750 36L758 28" fill="none" stroke="currentColor" strokeWidth="2"/></svg></div>
    <div shuku-edit-id="e-b0608137-1360-48cb-a742-5e5aa6a7aaa2" className="vlm-connector-compare">
      <section shuku-edit-id="e-ffddd69c-16f6-4826-927e-dfe0fd80c27e" className="vlm-connector-branch">
        <Heading>MLP：逐位置映射</Heading>
        <Typography shuku-edit-id="e-06be3e94-34ee-4175-8036-a2e69e5f8cce" variant="bodySmall">LLaVA-1.5 · 每个位置使用同一组参数</Typography>
        <div shuku-edit-id="e-4e9089fe-1491-4e19-a14d-df855e1b932e" className="vlm-connector-flow" aria-label="8个示意视觉位置各自映射成8个输出位置">
          <Typography shuku-edit-id="e-22856d32-13ac-4da6-b750-95f22387712e" variant="body">8 个视觉位置</Typography>
          <div shuku-edit-id="e-a66ec512-2e78-4464-8b5a-78609b77fd56" className="vlm-connector-lanes" aria-hidden="true">{Array.from({length:8},(_,i)=><div shuku-edit-id="e-2cabdc19-0466-4ffd-9a6e-3f911eae9a7b" className="vlm-connector-lane" key={i}><i shuku-edit-id="e-a5da7034-7b58-47c2-a202-9b2c1cb302ec"/><b shuku-edit-id="e-5aba9c18-53bc-4858-9762-f63dfa5088e9"/><em shuku-edit-id="e-8379f7d8-121f-4ad6-865f-ee5dc65b9a1d"/></div>)}</div>
          <Typography shuku-edit-id="e-82eb2f45-f5ed-49ba-b1c6-a2a5ea5fc9df" variant="body" tone="accent">8 个输出位置</Typography>
        </div>
      </section>
      <div shuku-edit-id="e-c8578362-4d9b-4d1e-b01c-35b05aa17465" className="vlm-connector-divider" aria-hidden="true"/>
      <section shuku-edit-id="e-51a0235c-68ad-4d95-8952-63f2b26ccb9a" className="vlm-connector-branch">
        <Heading>Q-Former：Query 汇聚</Heading>
        <Typography shuku-edit-id="e-b76a97b8-b1ef-4036-921e-fec9d05b2e7f" variant="bodySmall">BLIP-2 · 可训练的 Query 读取多个位置</Typography>
        <div shuku-edit-id="e-a32c528c-33e0-4211-839a-731f36b1be2f" className="vlm-connector-flow vlm-closing-query" aria-label="3个可学习Query通过交叉注意力读取8个示意位置，输出3个汇聚向量">
          <Typography shuku-edit-id="e-dc2243c4-05d2-4c86-a51f-6b8ae422e412" variant="body">8 个视觉位置</Typography>
          <div shuku-edit-id="e-9187c3e9-6321-4cdc-8ce6-abd6eaa22de9" className="vlm-closing-query-diagram">
            <div shuku-edit-id="e-1ea4bdfc-6c94-4af6-83ca-e1f334971f3b" className="vlm-closing-query-inputs" aria-hidden="true">{Array.from({length:8},(_,i)=><i shuku-edit-id="e-a6f0fdb6-1b50-41ac-be3f-d546f9963110" key={i}/>)}</div>
            <svg shuku-edit-id="e-38651947-3031-4839-9749-2cb74599bf64" viewBox="0 0 640 100" preserveAspectRatio="none" aria-hidden="true">{demo.weights.flatMap((ws,q)=>ws.map((w,t)=><line shuku-edit-id="e-d2183020-1680-42ea-b003-299197a39ef8" key={`${q}-${t}`} x1={40+t*80} y1="0" x2={107+q*213} y2="100" style={{stroke:q===0?'var(--ui-accent-alt)':'var(--ui-accent)',strokeWidth:.5+w*12,opacity:q===0?.8:.2}}/>))}</svg>
            <div shuku-edit-id="e-78beed95-48da-4594-96b4-5c1a0a531662" className="vlm-closing-query-outputs">{['Query 1','Query 2','Query 3'].map((name,i)=><div shuku-edit-id="e-9046559c-20c5-4986-9e9b-daac8739e15b" key={name}><Typography shuku-edit-id="e-cb2f901a-7be1-4df1-a2da-3cfe57c550b6" variant="bodySmall" align="center">{name}</Typography><Features rows={1} cols={4} orange seed={i+1}/></div>)}</div>
          </div>
          <Typography shuku-edit-id="e-c367a735-f8c9-4cc6-bbe6-28d3724a0bf8" variant="body" tone="accent">3 个汇聚输出</Typography>
          <Typography shuku-edit-id="e-7481b3ce-1716-4572-8331-c9823e02bd72" variant="bodySmall">FC 投影到冻结 LLM 的词嵌入宽度，再作为视觉提示进入上下文。</Typography>
        </div>
      </section>
    </div>
    <Typography shuku-edit-id="e-433d73d1-0473-4ba3-90bd-36dffd55ab0b" variant="bodySmall" tone="muted">8→8 / 8→3 仅示意位置数，不是模型固定配置。两种接口输出都将与问题一起进入上下文。</Typography>
  </div>;
}
function RecapBody() {
  const [task,setTask]=useState(0);
  const [answer,setAnswer]=useState<number|null>(null);
  const tasks=[
    {name:'图片检索',question:'用“海边骑车”从一万张照片中找出最相关的图片，应要求模型输出什么？',correct:1,reasons:['视觉向量可作为中间表示，但还需要与查询比较，才能得到检索结果。','正确：比较文本与图片的相似度，再按分数排序，得到相关图片。','生成一段文字不能直接给出候选照片的相关性排序。']},
    {name:'文档提取',question:'给一张新发票，要求返回发票号码与金额，应要求模型输出什么？',correct:2,reasons:['只有视觉向量还不能直接提供可用的发票号码与金额。','相似度排序适合筛选候选；这里需要读出图中的具体字段。','正确：根据图像生成号码、金额等字段，并逐项定位原文核对。']}
  ];
  const current=tasks[task];
  const labels=['视觉特征向量','图文相似度排序','依据图像生成文字或字段'];
  const sources=[['ViT','https://arxiv.org/abs/2010.11929'],['CLIP','https://arxiv.org/abs/2103.00020'],['LLaVA-1.5','https://arxiv.org/abs/2310.03744'],['BLIP-2','https://arxiv.org/abs/2301.12597']];
  return <div shuku-edit-id="e-ca556d3a-bbb1-499f-85c7-039a826297ed" className="vlm-reasoning-recap" data-quiz-task={task} data-quiz-result={answer===null?'unanswered':answer===current.correct?'correct':'incorrect'}>
    <div shuku-edit-id="e-8f8299d5-cf17-4c3e-a16e-dabd7aae32b2" className="vlm-recap-capabilities">
      <section shuku-edit-id="e-e59f93fa-ee79-40a2-b02e-5caec939016a"><Heading>ViT · 表示</Heading><Text>像素 → 视觉向量</Text></section>
      <section shuku-edit-id="e-42a88d92-6957-4b61-bbab-0459bc9eaa31"><Heading>CLIP · 匹配</Heading><Text>图文 → 相似度</Text></section>
      <section shuku-edit-id="e-d52ca5c7-4ded-43ce-98b7-178fd510785f"><Heading>生成式 VLM · 回答</Heading><Text>图像＋指令 → 文字</Text></section>
    </div>
    <section shuku-edit-id="e-38674587-af5f-4c22-9595-deb1c6c4c480" className="vlm-output-quiz" aria-label="新任务输出类型检查">
      <div shuku-edit-id="e-b1e0f1a5-0d57-4bda-853d-f3c291129954" className="vlm-quiz-prompt"><Heading>新任务 {task+1}/2 · {current.name}</Heading><Text>{current.question}</Text><Typography shuku-edit-id="e-50bc908a-17b0-418a-a556-c288714a2017" variant="bodySmall" tone="muted">按任务所需的最终输出判断。</Typography></div>
      <div shuku-edit-id="e-c96c9191-8c0f-4b25-afbc-812a6ab142e6" className="vlm-quiz-options" role="group" aria-label="选择输出类型">{labels.map((label,i)=><Action key={label} active={answer===i} disabled={answer!==null} onClick={()=>setAnswer(i)}>{label}</Action>)}</div>
      <div shuku-edit-id="e-39973a9e-a77a-47df-ab10-3cf3fe1c104d" className="vlm-quiz-feedback" role="status" aria-live="polite">{answer!==null&&<><Typography shuku-edit-id="e-a87cb41d-072b-4e3f-8a28-54adf017a611" variant="body" tone={answer===current.correct?'accent':'main'}>{current.reasons[answer]}</Typography>{answer!==current.correct?<Action onClick={()=>setAnswer(null)}>重新作答</Action>:<Typography shuku-edit-id="e-82a23e89-d171-4d3d-b0c2-0e6cb420b44d" variant="bodySmall">判断依据：这个任务最终需要哪一种输出？</Typography>}</>}</div>
    </section>
    <StepSequenceControl step={task} steps={2} onPrevious={()=>{setTask(0);setAnswer(null);}} onNext={()=>{setTask(1);setAnswer(null);}} label="切换迁移任务"/>
    <div shuku-edit-id="e-ba42d30e-a061-4868-8ea7-246d7c2ba7c2" className="vlm-closing-resources"><Typography shuku-edit-id="e-d51f5ae8-5de0-4052-a328-157617e1f8a3" variant="bodySmall" tone="muted">三项能力的对照，不是三个完整模型串联；视觉表示与回答为教学示意。</Typography><div shuku-edit-id="e-966dff37-a573-4c0d-94f2-ee618faab30c" className="vlm-source-links">{sources.map(([name,url])=><a shuku-edit-id="e-bea58f26-181c-439f-8591-72d10063d9d4" href={url} key={name} target="_blank" rel="noreferrer"><Typography shuku-edit-id="e-0aefa729-59f3-4156-adf0-1025b76d181b" as="span" variant="bodySmall">{name} ↗</Typography></a>)}</div></div>
  </div>;
}

export const vlmLessons = {
  "clip-to-vlm": {
    Body: BridgeBody,
    mission: "同屏比较由人提供候选的匹配与直接生成语言回答。",
    takeaway: "从候选匹配走向开放生成，需要加入语言生成模型。",
    note: "相似度和回答为教学预设；CLIP 不接入生成器时只提供匹配分数。",
  },
  "vlm-dataflow": {
    Body: DataflowBody,
    mission: "逐步追踪视觉特征经过 Connector 后，怎样与问题一起进入语言模型。",
    takeaway: "视觉编码器提取信息，Connector 建立接口，LLM 生成回答。",
    note: "以视觉编码器 + Projector + LLM 路线为例，并非所有 VLM 的统一结构。",
  },
  "vlm-tasks": {
    Body: SourceTasks,
    mission: "依次检查场景、文档和图表，指出每种回答来自哪一处视觉证据。",
    takeaway: "同一个视觉语言接口，可以读取场景、文字和数据关系。",
    note: "采用原稿最终呈现的信封与产品销量数据；2015 与其他三年并列最大。回答为教学示意。",
  },
  "visual-features": {
    Body: FeaturesBody,
    mission: "沿固定位置295，比较二维输入位置与视觉编码器输出的一行特征。",
    takeaway: "这一接口保留多个视觉位置，每个位置对应一行特征。",
    note: "LLaVA-1.5-7B 使用 CLIP ViT-L/14-336：336平方输入、14平方Patch、24×24=576个位置，每个1024维；选择倒数第二层Patch特征并去掉CLS。预处理和色块为结构示意，省略batch维；输出行已通过自注意力融合上下文，并非原始像素块。",
  },
  connector: {
    Body: ConnectorExperiment,
    mission: "固定位置295，沿两个线性层和GELU追踪输入、输出位置和维度。",
    takeaway: "576 个位置保留；变成 4096 维只解决接口，映射参数仍需训练。",
    note: "特指LLaVA-1.5-7B官方配置的mlp2x_gelu：Linear(1024,4096)、GELU、Linear(4096,4096)，每个位置独立共享参数。输入576×1024，输出576×4096，不压缩位置数。追踪位置295；色块非实测。接口维度匹配不等于已经学好视觉语言表示；训练在第25页展开。",
  },
  context: {
    Body: ContextExperiment,
    mission: "看视觉向量与问题文字如何组成初始上下文，再看回答片段怎样逐步追加。",
    takeaway:
      "LLM 读取视觉与问题上下文；自回归推理还利用已生成的回答片段。",
    note: "回答分段和动画均为教学示意，不对应特定 tokenizer 或真实模型推理；训练时可用 teacher forcing 并行计算目标位置损失。",
  },
  training: {
    Body: TrainingExperiment,
    mission: "跟随一个样本的一次参数更新，区分冻结模块与停止运行。",
    takeaway: "先学习视觉接口，再让接口和语言模型共同学习视觉指令。",
    note: "冻结范围特指 LLaVA-1.5。阶段1的标量教学模型只更新Connector参数w；阶段2从前次结果继续，同时更新w和语言参数a。x=1，红色分数aw，蓝色0，双词softmax与交叉熵。未模拟问题编码，非真实LLM；真实训练可teacher forcing并行计算各目标损失。",
  },
  "connector-comparison": {
    Body: ConnectorCompareBody,
    mission: "承接第22页的Connector，比较同一接口的逐位置映射与Query汇聚两种实现。",
    takeaway: "两种接口都输出视觉向量；下一页看它们怎样与问题组成语言模型的上下文。",
    note: "MLP：LLaVA-1.5；Q-Former：BLIP-2。8→8、8→3 为教学示意位置数；线宽对应构造的示例权重，并非模型实测。",
  },
  "visual-evidence": {
    Body: EvidenceComparison,
    mission: "将错误回答与放大的图像细节对照，理解视觉幻觉是回答与图像不一致。",
    takeaway:
      "能生成回答，不代表回答忠实于图像。",
    note: "手动查看提问、模拟错答、红伞证据、深色伞证据与修正。用属性和数量冲突说明视觉幻觉；不从单句错答推断具体原因。",
  },
  recap: {
    Body: RecapBody,
    mission: "把三种能力迁移到图片检索和发票提取，选择任务所需的输出类型并解释原因。",
    takeaway: "看清模型输出的是什么，再回到图像核对它是否有依据。",
    note: "三项能力并列对照，不把三个完整模型画成必经串联。检索需要相关性排序；文档提取需要有图像依据的字段，并核对原文。",
  },
};




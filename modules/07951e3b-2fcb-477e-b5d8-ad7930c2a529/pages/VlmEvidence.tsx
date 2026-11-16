import { Typography } from "@shuku/course-style/react";
import { useState } from 'react';
import { Action, Heading, Text, StepSequenceControl, useStepSequence } from '../components/LessonVisuals';
import { ImageFocus } from '../components/TeachingVisuals';
import { rainImage } from '../media';
import './VlmFeedback.css';

function UmbrellaEvidence({ red }: { red:boolean }) {
  const region=red?{x:.26,y:.47,w:.30,h:.25}:{x:.51,y:0,w:.30,h:.25};
  return <div shuku-edit-id="e-75992ef9-ea11-4a88-ade2-4a6e7bb46774" className="vlm-evidence-detail">
    <div shuku-edit-id="e-4eccbe7a-b8a3-4858-a6b7-ae2f5af8a0cd" className="vlm-evidence-crop" role="img" aria-label={red?'放大女孩的红色伞面':'放大龙猫上方的深色伞面'} style={{aspectRatio:'1920 / 865',backgroundImage:`url(${rainImage})`,backgroundSize:`${100/region.w}% ${100/region.h}%`,backgroundPosition:`${region.x/(1-region.w)*100}% ${region.y/(1-region.h)*100}%`}}/>
    <Typography shuku-edit-id="e-f07ad804-876e-4920-b763-621aaf5c05a7" variant="bodySmall">{red?'证据 1：女孩的伞面为红色。':'证据 2：龙猫上方的伞面为深色。'}</Typography>
  </div>;
}

export function EvidenceComparison() {
  const sequence=useStepSequence(6), stage=sequence.step;
  const [answer,setAnswer]=useState<number|null>(null);
  return <div shuku-edit-id="e-e876b072-b2c5-4466-a9e3-6a2e5a723193" className="vlm-evidence-lesson" ref={sequence.hostRef} data-evidence-stage={stage}>
    <Typography shuku-edit-id="e-2d36c058-f8b4-48c8-b3f8-fb30353eec17" variant="bodySmall" tone="muted">模拟对话 · 非模型实测；练习把回答拆成属性与数量，再回图核对。</Typography>
    <div shuku-edit-id="e-cf24c452-742d-4ad0-bd26-cdabfe178eb4" className="vlm-evidence-main">
      <section shuku-edit-id="e-123090de-9220-4f6b-b210-ef7c2ef6f72f" className="vlm-evidence-source"><Heading>用图像检验回答</Heading><ImageFocus>
        {stage>=2&&<div shuku-edit-id="e-273106e1-f2c2-4b54-ba94-1f17643639b8" className="vlm-evidence-region" style={{left:'26%',top:'47%',width:'30%',height:'25%'}} aria-label="定位红色伞面"/>}
        {stage>=3&&<div shuku-edit-id="e-43e2b8c1-fd66-4671-89ac-44463c4d018d" className="vlm-evidence-region" style={{left:'51%',top:'0%',width:'30%',height:'25%'}} aria-label="定位深色伞面"/>}
      </ImageFocus><Typography shuku-edit-id="e-030ad2bd-4b4d-4f88-9a00-db2d30454e5f" variant="bodySmall" tone="muted">{['先读问题，下一步查看模拟回答。','先别接受回答，下一步定位第一处伞面。','继续核对另一把伞的颜色。','两处证据都已找到，下一步修正回答。','错的是“红色伞的数量”，不是总伞数。','图像能支持颜色与数量，却不一定能证明材料性能。'][stage]}</Typography></section>
      {stage===5?<section shuku-edit-id="e-436188bb-fe03-4e90-86aa-a32aaa3bfbbd" className="vlm-evidence-transfer" aria-label="证据核对变式" data-evidence-answer={answer===null?'unanswered':answer===1?'correct':'incorrect'}>
        <Heading>换个问题，先判断证据够不够</Heading>
        <Text>仅凭这张图，能确定女孩的伞完全防水吗？</Text>
        <div shuku-edit-id="e-f31fa7c7-8fd4-4b91-91c5-9e1a57727a49" className="vlm-evidence-options">
          <Action disabled={answer!==null} active={answer===0} onClick={()=>setAnswer(0)}>能：雨中打伞就证明完全防水</Action>
          <Action disabled={answer!==null} active={answer===1} onClick={()=>setAnswer(1)}>不能：这张图不足以证明防水性能</Action>
        </div>
        <div shuku-edit-id="e-7159a74a-3722-453e-84d1-46c56d85e41e" role="status" aria-live="polite">{answer!==null&&<><Typography shuku-edit-id="e-37074794-efa7-47f9-a699-862720329636" variant="bodySmall" tone={answer===1?'accent':'main'}>{answer===1?'正确。画面能看到伞，却没有材料测试或漏水证据；应保留不确定。':'雨中使用不等于完全防水。先找能证明材料性能的证据，找不到就不能下结论。'}</Typography>{answer===0&&<Action onClick={()=>setAnswer(null)}>重新作答</Action>}</>}</div>
      </section>:<section shuku-edit-id="e-d9ccfbc9-4460-42c0-bce0-3ef6bd3c1571" className="vlm-evidence-chat" aria-label="回答核对模拟对话">
        <div shuku-edit-id="e-45e30a31-2ef8-4a34-af43-f15069649f10" className="vlm-chat-question"><Text>用户：图里有几把红伞？</Text></div>
        <div shuku-edit-id="e-5c14fa16-d6cb-4b26-86a0-e4464df4d8ae" className="vlm-chat-reply" data-revealed={stage>=1} aria-hidden={stage<1}>{stage>=1&&<Text>模拟错答：有两把红伞。</Text>}</div>
        <div shuku-edit-id="e-b4a88d22-df42-46ad-ad77-e783e2cfa97e" className="vlm-evidence-details"><div shuku-edit-id="e-ce2c7331-893e-449d-aa5d-e8fdbcd8cf1c" data-revealed={stage>=2}>{stage>=2&&<UmbrellaEvidence red/>}</div><div shuku-edit-id="e-f7a4f01e-be4e-4028-bffc-b00064e8ea7b" data-revealed={stage>=3}>{stage>=3&&<UmbrellaEvidence red={false}/>}</div></div>
        <div shuku-edit-id="e-0d2df1be-de2a-4efe-8a20-c81d32e4e34c" className="vlm-chat-correction" data-revealed={stage>=4} aria-hidden={stage<4}>{stage>=4&&<Text>修正：一把红伞，另一把伞是深色。</Text>}</div>
      </section>}
    </div>
    <div shuku-edit-id="e-f7652fbb-4d26-4b06-aeb5-e1c1af4c0be6" className="vlm-evidence-protocol" data-revealed={stage>=4} aria-hidden={stage<4}>{stage>=4&&<><Typography shuku-edit-id="e-7c086589-9ab4-4d7e-b3f8-95220c3297ba" variant="body">核对颜色／数量 → 定位图像依据 → 不能确认时保留不确定</Typography><Typography shuku-edit-id="e-217d3f0e-5202-47ae-9f58-cc515958776d" variant="bodySmall" tone="muted">视觉幻觉可能与视觉信息读取不足或语言先验有关；本例不能确定具体成因。</Typography></>}</div>
    <StepSequenceControl step={stage} steps={sequence.steps} onPrevious={()=>{setAnswer(null);sequence.previous();}} onNext={()=>{setAnswer(null);sequence.next();}} label="核对模拟回答"/>
  </div>;
}

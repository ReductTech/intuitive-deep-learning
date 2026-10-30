import { Typography } from '../../shared/react';
import { useState } from 'react';
import { Action, Heading, Text, StepSequenceControl, useStepSequence } from '../components/LessonVisuals';
import { ImageFocus } from '../components/TeachingVisuals';
import { rainImage } from '../media';
import './VlmFeedback.css';

function UmbrellaEvidence({ red }: { red:boolean }) {
  const region=red?{x:.26,y:.47,w:.30,h:.25}:{x:.51,y:0,w:.30,h:.25};
  return <div className="vlm-evidence-detail">
    <div className="vlm-evidence-crop" role="img" aria-label={red?'放大女孩的红色伞面':'放大龙猫上方的深色伞面'} style={{aspectRatio:'1920 / 865',backgroundImage:`url(${rainImage})`,backgroundSize:`${100/region.w}% ${100/region.h}%`,backgroundPosition:`${region.x/(1-region.w)*100}% ${region.y/(1-region.h)*100}%`}}/>
    <Typography variant="bodySmall">{red?'证据 1：女孩的伞面为红色。':'证据 2：龙猫上方的伞面为深色。'}</Typography>
  </div>;
}

export function EvidenceComparison() {
  const sequence=useStepSequence(6), stage=sequence.step;
  const [answer,setAnswer]=useState<number|null>(null);
  return <div className="vlm-evidence-lesson" ref={sequence.hostRef} data-evidence-stage={stage}>
    <Typography variant="bodySmall" tone="muted">模拟对话 · 非模型实测；练习把回答拆成属性与数量，再回图核对。</Typography>
    <div className="vlm-evidence-main">
      <section className="vlm-evidence-source"><Heading>用图像检验回答</Heading><ImageFocus>
        {stage>=2&&<div className="vlm-evidence-region" style={{left:'26%',top:'47%',width:'30%',height:'25%'}} aria-label="定位红色伞面"/>}
        {stage>=3&&<div className="vlm-evidence-region" style={{left:'51%',top:'0%',width:'30%',height:'25%'}} aria-label="定位深色伞面"/>}
      </ImageFocus><Typography variant="bodySmall" tone="muted">{['先读问题，下一步查看模拟回答。','先别接受回答，下一步定位第一处伞面。','继续核对另一把伞的颜色。','两处证据都已找到，下一步修正回答。','错的是“红色伞的数量”，不是总伞数。','图像能支持颜色与数量，却不一定能证明材料性能。'][stage]}</Typography></section>
      {stage===5?<section className="vlm-evidence-transfer" aria-label="证据核对变式" data-evidence-answer={answer===null?'unanswered':answer===1?'correct':'incorrect'}>
        <Heading>换个问题，先判断证据够不够</Heading>
        <Text>仅凭这张图，能确定女孩的伞完全防水吗？</Text>
        <div className="vlm-evidence-options">
          <Action disabled={answer!==null} active={answer===0} onClick={()=>setAnswer(0)}>能：雨中打伞就证明完全防水</Action>
          <Action disabled={answer!==null} active={answer===1} onClick={()=>setAnswer(1)}>不能：这张图不足以证明防水性能</Action>
        </div>
        <div role="status" aria-live="polite">{answer!==null&&<><Typography variant="bodySmall" tone={answer===1?'accent':'main'}>{answer===1?'正确。画面能看到伞，却没有材料测试或漏水证据；应保留不确定。':'雨中使用不等于完全防水。先找能证明材料性能的证据，找不到就不能下结论。'}</Typography>{answer===0&&<Action onClick={()=>setAnswer(null)}>重新作答</Action>}</>}</div>
      </section>:<section className="vlm-evidence-chat" aria-label="回答核对模拟对话">
        <div className="vlm-chat-question"><Text>用户：图里有几把红伞？</Text></div>
        <div className="vlm-chat-reply" data-revealed={stage>=1} aria-hidden={stage<1}>{stage>=1&&<Text>模拟错答：有两把红伞。</Text>}</div>
        <div className="vlm-evidence-details"><div data-revealed={stage>=2}>{stage>=2&&<UmbrellaEvidence red/>}</div><div data-revealed={stage>=3}>{stage>=3&&<UmbrellaEvidence red={false}/>}</div></div>
        <div className="vlm-chat-correction" data-revealed={stage>=4} aria-hidden={stage<4}>{stage>=4&&<Text>修正：一把红伞，另一把伞是深色。</Text>}</div>
      </section>}
    </div>
    <div className="vlm-evidence-protocol" data-revealed={stage>=4} aria-hidden={stage<4}>{stage>=4&&<><Typography variant="body">核对颜色／数量 → 定位图像依据 → 不能确认时保留不确定</Typography><Typography variant="bodySmall" tone="muted">视觉幻觉可能与视觉信息读取不足或语言先验有关；本例不能确定具体成因。</Typography></>}</div>
    <StepSequenceControl step={stage} steps={sequence.steps} onPrevious={()=>{setAnswer(null);sequence.previous();}} onNext={()=>{setAnswer(null);sequence.next();}} label="核对模拟回答"/>
  </div>;
}

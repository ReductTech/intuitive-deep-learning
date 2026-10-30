import { Button, Typography } from '../../../shared/react';
import { AttentionActivity, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { TRANSLATION_TRAINING_SET, TRANSLATION_VALIDATION_SET } from '../../model/attentionTranslationExperiment';
import './AttentionTeacherForcingPage.css';
export function AttentionTeacherForcingPage(props:ActivityProps){
 const [visited,setVisited]=useActivityState<string[]>('C21-wrong-input-sources',[]);
 const compared=visited.includes('training')&&visited.includes('inference');
 const lane=(training:boolean)=><section className="attn-teacher-branch">
  <div className="attn-teacher-label"><Typography variant="h3" tone={training?'accent':'muted'}>{training?'训练':'推理'}</Typography><Typography variant="bodySmall" tone="muted">{training?'教师强制':'自由生成'}</Typography></div>
  <div className="attn-teacher-step"><Typography variant="bodySmall" tone="muted">第 1 步预测（错）</Typography><Typography variant="h2" className="attn-teacher-wrong">我们</Typography></div>
  <Typography variant="h2" tone="muted" align="center">→</Typography>
  <div className="attn-teacher-step"><Typography variant="bodySmall" tone="muted">第 2 步输入</Typography><Button className="attn-teacher-input" active={visited.includes(training?'training':'inference')} aria-label={training?'查看训练前词来源':'查看推理前词来源'} onClick={()=>setVisited(previous=>[...new Set([...previous,training?'training':'inference'])])}><Typography variant="h2" tone="inherit">{training?'我':'我们'}</Typography></Button><Typography variant="bodySmall" tone="muted">{visited.includes(training?'training':'inference')?(training?'来自标准译文：我':'来自上一步预测：我们'):'点选查看来源'}</Typography></div>
 </section>;
 return <AttentionActivity {...props} number={21} title="翻译训练：样本与前词输入" eyebrow="小明的到家消息" done={compared} footerHeight={184} className="attn-teacher-page" footer={<div className="attn-teacher-dataset">
 <div className="attn-teacher-data-lane"><Typography variant="h3" tone="accent">训练 · {TRANSLATION_TRAINING_SET.length} 句</Typography><Typography variant="body">I am at school . → 我在学校。</Typography><Typography variant="bodySmall" tone="muted">45 对句子用于更新参数，包括注意力参数</Typography></div>
 <div className="attn-teacher-data-lane"><Typography variant="h3" tone="success">验证 · {TRANSLATION_VALIDATION_SET.length} 句</Typography><Typography variant="body">I am at home . → 我在家。</Typography><Typography variant="bodySmall" tone="muted">另外 6 对不更新参数，只检查新句能否译对</Typography></div>
 </div>}>
 <div className="attn-teacher-main"><div className="attn-teacher-example"><div><Typography variant="bodySmall" tone="muted">第 1 步译错后，第 2 步分别喂哪个词？</Typography><Typography variant="h3">I am home . → 我到家了。</Typography></div><Typography variant="bodySmall" tone="muted">训练使用标准答案的前词；推理沿用自身预测，错误可能累积。</Typography></div>{lane(true)}{lane(false)}</div>
 </AttentionActivity>;
}


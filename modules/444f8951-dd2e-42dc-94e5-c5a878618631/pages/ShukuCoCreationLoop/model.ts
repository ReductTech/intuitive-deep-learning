export type Decision = 'pending' | 'accepted' | 'rejected';
export type ExampleId = 'learning-rate' | 'image-generation';
export interface LoopState { feedback: boolean; submitted: boolean; decisions: Record<ExampleId, Decision>; published: boolean }
export type LoopAction = {type:'feedback'|'submit'|'publish'|'reset'} | {type:'decide';id:ExampleId;decision:Decision};
export const examples = [
  {id:'learning-rate',author:'学生 A',title:'可调节学习率的演示',score:85,criteria:['内容准确','有助于理解']},
  {id:'image-generation',author:'学生 B',title:'图像生成中的应用',score:82,criteria:['案例典型','具有教学价值']},
] as const;
export function initialLoop():LoopState { return {feedback:false,submitted:false,decisions:{'learning-rate':'pending','image-generation':'pending'},published:false}; }
export function canPublish(state:LoopState) { return state.submitted && !state.published && Object.values(state.decisions).every(d=>d!=='pending') && Object.values(state.decisions).some(d=>d==='accepted'); }
export function loopReducer(state:LoopState,action:LoopAction):LoopState {
  if(action.type==='reset')return initialLoop();
  if(state.published)return state;
  if(action.type==='feedback')return {...state,feedback:true};
  if(action.type==='submit')return {...state,submitted:true,decisions:initialLoop().decisions};
  if(action.type==='decide')return state.submitted?{...state,decisions:{...state.decisions,[action.id]:action.decision}}:state;
  return canPublish(state)?{...state,published:true}:state;
}
export function gradientSteps(rate:number) {
  let x=1;
  return Array.from({length:18},()=>{ const loss=x*x; x-=2*rate*x; return loss; });
}

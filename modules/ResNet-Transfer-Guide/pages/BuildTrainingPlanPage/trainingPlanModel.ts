export type Scope = 'head' | 'last' | 'all';
export interface Plan {
  source: 'pretrained' | 'random';
  head: 'new' | 'old';
  scope: Scope;
}
export type Decision = 'keep' | 'compare';
export interface PlanState {
  session: number;
  revision: number;
  phase: 'build' | 'validate' | 'done';
  draft: Plan;
  trial: Plan | null;
  decision: Decision | null;
  error: 'origin' | 'head' | null;
}
export const SCOPE_LABELS: Record<Scope, string> = { head: '只训新头', last: '后段微调', all: '全部微调' };
export const LEARNER_LABELS: Record<Scope, string> = { head: '新分类头', last: 'Stage 4 + 新分类头', all: '全部骨干 + 新分类头' };
export const TRAINABLE_FROM: Record<Scope, number> = { head: 5, last: 4, all: 0 };
export function initialPlanState(session = 0): PlanState {
  return { session, revision: 0, phase: 'build', draft: { source: 'pretrained', head: 'new', scope: 'head' }, trial: null, decision: null, error: null };
}
export type PlanCommand =
  | { type: 'source'; value: Plan['source'] }
  | { type: 'head'; value: Plan['head'] }
  | { type: 'scope'; value: Scope }
  | { type: 'trial' | 'lock' | 'edit' | 'reset' }
  | { type: 'decide'; value: Decision };
export type PlanAction = PlanCommand & { session: number; revision: number };
/** Each command belongs to one rendered attempt; old clicks cannot mutate a newer plan. */
export function reducePlan(state: PlanState, action: PlanAction): PlanState {
  if (action.session !== state.session || action.revision !== state.revision) return state;
  if (action.type === 'reset') return initialPlanState(state.session + 1);
  const next = { ...state, revision: state.revision + 1 };
  if (action.type === 'edit') {
    return state.phase === 'validate' ? { ...next, phase: 'build', trial: null, decision: null, error: null } : state;
  }
  if (action.type === 'decide') {
    return state.phase === 'validate' && !state.decision && (action.value === 'keep' || action.value === 'compare')
      ? { ...next, decision: action.value } : state;
  }
  if (action.type === 'lock') {
    return state.phase === 'validate' && state.trial && state.decision ? { ...next, phase: 'done' } : state;
  }
  if (state.phase !== 'build') return state;
  if (action.type === 'trial') {
    if (state.draft.head === 'old') return { ...next, error: 'head' };
    if (state.draft.source === 'random') return { ...next, error: 'origin' };
    return { ...next, phase: 'validate', trial: { ...state.draft }, decision: null, error: null };
  }
  if (action.type === 'source' && !['random', 'pretrained'].includes(action.value)
    || action.type === 'head' && !['old', 'new'].includes(action.value)
    || action.type === 'scope' && !['head', 'last', 'all'].includes(action.value)) return state;
  if (action.type === 'source' || action.type === 'head' || action.type === 'scope') {
    return { ...next, draft: { ...state.draft, [action.type]: action.value }, error: null };
  }
  return state;
}
export function comparisonScope(scope: Scope): Scope {
  return scope === 'head' ? 'last' : scope === 'last' ? 'head' : 'last';
}
export function planMessage(state: PlanState): string {
  if (state.error === 'head') return '旧分类头对应旧任务；换上三分类头，才能输出本任务的三类分数。';
  if (state.error === 'origin') return '随机参数可作从零训练的对照；本次迁移任务请装入预训练骨干权重，再试行方案。';
  if (state.phase === 'done') return '方案已锁定 → 现在才用独立测试集评估。这里演示流程，不生成实测指标。';
  if (state.decision === 'keep') return '当前验证情境已满足要求，可以保留方案；不必为了微调而增加更新范围。';
  if (state.decision === 'compare') return '对照情境：仅改变训练范围，未见稳定收益。保留原方案；更新更多参数不保证更好。';
  if (state.phase === 'validate') return '只用验证集决定是否调整；测试集仍锁定。情境为预设，不是实际训练结果。';
  return '选好三项，一次试行。冻结只停止参数更新，骨干仍参与前向计算。';
}


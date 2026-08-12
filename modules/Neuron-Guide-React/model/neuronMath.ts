export interface NeuronFactor {
  name: string;
  valueLabel: string;
  valueQuestion: string;
  explanation: string;
  suggestedImportance: number;
  suggestedValue: number;
  valueTransform?: 'direct' | 'inverse';
}

export interface DecisionScenario {
  id: string;
  label: string;
  question: string;
  positiveLabel: string;
  negativeLabel: string;
  factors: [NeuronFactor, NeuronFactor, NeuronFactor];
}

export const decisionScenarios: DecisionScenario[] = [
  {
    id: 'graduate-school',
    label: '读研',
    question: '是否要读研？',
    positiveLabel: '读研',
    negativeLabel: '不读研',
    factors: [
      { name: '研究兴趣', valueLabel: '研究兴趣', valueQuestion: '你现在对深入研究的兴趣有多强？', explanation: '它会直接影响长期投入的动力。', suggestedImportance: 9, suggestedValue: 8 },
      { name: '职业帮助', valueLabel: '职业帮助', valueQuestion: '读研对你的目标职业帮助有多大？', explanation: '它决定这段学习经历与目标的匹配程度。', suggestedImportance: 7, suggestedValue: 7 },
      { name: '经济承受力', valueLabel: '经济承受力', valueQuestion: '你目前承担时间与经济成本的能力有多强？', explanation: '它影响计划是否能够持续执行。', suggestedImportance: 6, suggestedValue: 5 },
    ],
  },
  {
    id: 'job-offer',
    label: '接下这个 offer',
    question: '是否要接下这个 offer？',
    positiveLabel: '接受 offer',
    negativeLabel: '不接受 offer',
    factors: [
      { name: '成长空间', valueLabel: '成长空间', valueQuestion: '这份工作能提供多大的成长空间？', explanation: '它影响这份选择的长期价值。', suggestedImportance: 8, suggestedValue: 9 },
      { name: '薪资满意度', valueLabel: '薪资满意度', valueQuestion: '你对薪资和福利有多满意？', explanation: '它影响现实回报和生活压力。', suggestedImportance: 7, suggestedValue: 6 },
      { name: '生活平衡', valueLabel: '生活平衡', valueQuestion: '这份工作能提供多好的生活平衡？', explanation: '它影响这份工作能否长期持续。', suggestedImportance: 8, suggestedValue: 4 },
    ],
  },
  {
    id: 'fitness',
    label: '开始健身',
    question: '是否要开始规律健身？',
    positiveLabel: '开始健身',
    negativeLabel: '暂不开始',
    factors: [
      { name: '健康需要', valueLabel: '健康需要', valueQuestion: '你改善健康状态的需要有多强？', explanation: '它决定行动能带来多大实际收益。', suggestedImportance: 9, suggestedValue: 8 },
      { name: '时间余量', valueLabel: '时间余量', valueQuestion: '你目前能稳定安排多少时间？', explanation: '它影响计划能否真正执行。', suggestedImportance: 7, suggestedValue: 5 },
      { name: '行动意愿', valueLabel: '行动意愿', valueQuestion: '你现在开始行动的意愿有多强？', explanation: '它影响计划能否从想法变成习惯。', suggestedImportance: 8, suggestedValue: 7 },
    ],
  },
  {
    id: 'general',
    label: '自定义决定',
    question: '是否要做这件事？',
    positiveLabel: '做这件事',
    negativeLabel: '暂时不做',
    factors: [
      { name: '预期收益', valueLabel: '预期收益', valueQuestion: '这件事可能带来的收益有多大？', explanation: '它代表这个决定可能带来的正向结果。', suggestedImportance: 8, suggestedValue: 7 },
      { name: '现实可行性', valueLabel: '现实可行性', valueQuestion: '以你目前的条件，这件事有多可行？', explanation: '它决定想法能否真正落地。', suggestedImportance: 7, suggestedValue: 6 },
      { name: '长期匹配度', valueLabel: '长期匹配度', valueQuestion: '这件事与你的长期目标有多匹配？', explanation: '它帮助避免只看眼前感受。', suggestedImportance: 8, suggestedValue: 5 },
    ],
  },
];

export const DEFAULT_SCENARIO_ID = decisionScenarios[0].id;

export function scenarioById(id: string): DecisionScenario {
  return decisionScenarios.find((scenario) => scenario.id === id) ?? decisionScenarios[0];
}

export function normalizeDecision(value: string): string {
  const target = value.trim()
    .replace(/[？?。.!！\s]+$/g, '')
    .replace(/^(是否要|要不要|该不该|能不能|可不可以)/, '')
    .trim();
  return `是否要${target || '读研'}？`;
}

export function scenarioIdForDecision(value: string): string {
  if (/offer|工作|求职|入职|跳槽/i.test(value)) return 'job-offer';
  if (/健身|运动|跑步|瑜伽/i.test(value)) return 'fitness';
  if (/读研|研究生|考研|留学/i.test(value)) return 'graduate-school';
  return 'general';
}

export function normalizedInput(value: number | null | undefined): number {
  return Math.max(0, Math.min(10, value ?? 5)) / 10;
}

export function effectiveInput(factor: NeuronFactor, value: number | null | undefined): number {
  const raw = normalizedInput(value);
  return factor.valueTransform === 'inverse' ? 1 - raw : raw;
}

export function normalizedWeight(value: number): number {
  return Math.max(0, Math.min(10, value)) / 10;
}

export function weightedContributions(
  scenario: DecisionScenario,
  values: Array<number | null>,
): number[] {
  return scenario.factors.map((factor, index) => (
    effectiveInput(factor, values[index]) * normalizedWeight(factor.suggestedImportance)
  ));
}

export function weightedSum(
  scenario: DecisionScenario,
  values: Array<number | null>,
): number {
  return weightedContributions(scenario, values)
    .reduce((sum, contribution) => sum + contribution, 0);
}

export function formatScore(value: number): string {
  return value.toFixed(2);
}

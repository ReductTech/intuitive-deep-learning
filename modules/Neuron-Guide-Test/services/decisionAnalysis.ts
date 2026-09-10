const INTAKE_ENDPOINT = 'http://127.0.0.1:59414/decision/intake';
const EXTRA_FACTORS_ENDPOINT = 'http://127.0.0.1:59414/decision/extra-factors';

export interface DecisionAnalysisFactor {
  name: string;
  valueLabel: string;
  valueQuestion: string;
  explanation: string;
  valueTransform: 'direct' | 'inverse';
  suggestedImportance: number;
}

export interface DecisionAnalysis {
  decision: string;
  positiveLabel: string;
  negativeLabel: string;
  factors: [DecisionAnalysisFactor, DecisionAnalysisFactor, DecisionAnalysisFactor];
}

interface ServiceEnvelope {
  ok?: boolean;
  structured?: boolean;
  result?: unknown;
  error?: unknown;
  warning?: { message?: unknown };
}

function asObject(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(message);
  return value as Record<string, unknown>;
}

function requiredText(value: unknown, message: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(message);
  return value.trim();
}

function normalizeFactor(value: unknown): DecisionAnalysisFactor {
  const factor = asObject(value, '服务返回了无效的因素。');
  const importance = Number(factor.suggested_importance ?? factor.suggestedImportance);
  if (!Number.isFinite(importance) || importance < 0 || importance > 1) {
    throw new Error('服务返回了无效的建议权重。');
  }
  const transform = factor.value_transform ?? factor.valueTransform;
  if (transform !== 'direct' && transform !== 'inverse') {
    throw new Error('服务返回了无效的因素方向。');
  }
  return {
    name: requiredText(factor.name, '服务返回的因素名称为空。'),
    valueLabel: requiredText(factor.value_label ?? factor.valueLabel, '服务返回的评分变量为空。'),
    valueQuestion: requiredText(factor.value_question ?? factor.valueQuestion, '服务返回的评分问题为空。'),
    explanation: requiredText(factor.explanation, '服务返回的因素解释为空。'),
    valueTransform: transform,
    suggestedImportance: Math.ceil(importance * 10),
  };
}

async function post(endpoint: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('决策分析服务未启动或无法连接，请先启动课程后台服务。');
  }
  const envelope = await response.json().catch(() => ({})) as ServiceEnvelope;
  if (!response.ok || envelope.ok !== true) {
    throw new Error(typeof envelope.error === 'string' ? envelope.error : '决策分析服务暂时不可用。');
  }
  if (envelope.structured !== true || !envelope.result) {
    throw new Error(typeof envelope.warning?.message === 'string' ? envelope.warning.message : '服务返回内容无法解析，请重试。');
  }
  return asObject(envelope.result, '服务没有返回有效结果。');
}

export async function analyzeDecision(decision: string): Promise<DecisionAnalysis> {
  const intake = await post(INTAKE_ENDPOINT, { decision });
  if (intake.status !== 'ok') {
    throw new Error(requiredText(intake.reason, '这个输入暂时无法形成明确的单一决策。'));
  }
  const normalizedDecision = requiredText(intake.decision, '服务没有返回规范化决策。');
  const positiveLabel = requiredText(intake.positive_label, '服务没有返回正向标签。');
  const negativeLabel = requiredText(intake.negative_label, '服务没有返回反向标签。');
  const primaryFactor = normalizeFactor(intake.primary_factor);
  const extrasResult = await post(EXTRA_FACTORS_ENDPOINT, {
    decision: normalizedDecision,
    positive_label: positiveLabel,
    negative_label: negativeLabel,
    primary_factor_name: primaryFactor.name,
  });
  const extras = extrasResult.factors;
  if (!Array.isArray(extras) || extras.length !== 2) {
    throw new Error('服务没有返回两个补充信号。');
  }
  return {
    decision: normalizedDecision,
    positiveLabel,
    negativeLabel,
    factors: [primaryFactor, normalizeFactor(extras[0]), normalizeFactor(extras[1])],
  };
}

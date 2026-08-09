import { Fragment } from 'react';
import { FormulaTerm } from '../../shared/react';

const FORMULA_TOKEN_PATTERN = /log|ln|exp|sigma|[A-Za-zα-ωΑ-Ω]|[σΣ′∂∞∈ℝ≈⇒→^/×*−=+_≤≥≠√-]|[₀-₉]+|[⁰-⁹]+/g;

const FORMULA_TOKEN_EXPLANATIONS: Record<string, string> = {
  L: 'L：损失值，用来衡量预测与真实答案之间的差异',
  p: 'p：模型分给目标事件或真实类别的概率',
  y: 'y：目标值，可取 0 到 1；硬标签通常取 0 或 1',
  z: 'z：模型尚未经过概率转换的原始分数（logit）',
  e: 'e：自然常数，约等于 2.71828',
  log: 'log：自然对数；概率越接近 0，负对数惩罚越大',
  ln: 'ln：自然对数，与这里的 log 含义相同',
  exp: 'exp：指数函数，exp(z) 等于 e 的 z 次方',
  sigma: 'sigma：这里表示 Sigmoid 函数',
  σ: 'σ：Sigmoid 函数，把实数映射到 0～1',
  Σ: 'Σ：求和符号，把所有类别对应的项加起来',
  '′': '′：导数符号，表示函数随输入变化的速度',
  '∂': '∂：偏导数符号，只考察一个变量变化时的影响',
  '∞': '∞：无穷大，表示没有有限边界',
  '∈': '∈：属于，表示左侧元素属于右侧集合',
  'ℝ': 'ℝ：全体实数组成的集合，从负无穷到正无穷',
  '≈': '≈：约等于，表示数值非常接近但不一定完全相等',
  '⇒': '⇒：推出或代入后得到右侧结果',
  '→': '→：从左侧表示变换到右侧结果',
  '^': '^：幂运算，右侧数字或字母是指数',
  '/': '/：除法，左侧是分子，右侧是分母',
  '*': '*：乘法，把左右两项相乘',
  '×': '×：乘法，把左右两项相乘',
  '−': '−：负号或减号；具体含义由它所在的位置决定',
  '-': '−：负号或减号；具体含义由它所在的位置决定',
  '=': '=：等号，表示左右两边数值相同',
  '+': '+：加号，把左右两项相加',
  _: '_：下标标记，用来区分类别、样本或位置',
  '≤': '≤：小于或等于',
  '≥': '≥：大于或等于',
  '≠': '≠：不等于',
  '√': '√：开方符号',
};

function formulaTokenExplanation(token: string): string {
  const explanation = FORMULA_TOKEN_EXPLANATIONS[token];
  if (explanation) return explanation;
  if (/^[A-Za-zα-ωΑ-Ω]$/.test(token)) {
    return `${token}：当前公式中的变量或参数`;
  }
  if (/^[₀-₉]+$/.test(token)) {
    return `${token}：下标，用来区分不同类别或位置`;
  }
  if (/^[⁰-⁹]+$/.test(token)) {
    return `${token}：上标，表示幂或指数`;
  }
  return `${token}：当前公式中的数学符号`;
}

export interface ExplainedFormulaTextProps {
  text: string;
}

/** Reproduces the legacy module's formula-token hover and focus explanations. */
export function ExplainedFormulaText({
  text,
}: ExplainedFormulaTextProps) {
  const parts = [];
  let cursor = 0;

  for (const match of text.matchAll(FORMULA_TOKEN_PATTERN)) {
    const token = match[0];
    const index = match.index;
    if (index > cursor) {
      parts.push(
        <Fragment key={`text-${cursor}`}>
          {text.slice(cursor, index)}
        </Fragment>,
      );
    }
    parts.push(
      <FormulaTerm
        key={`term-${index}`}
        tooltip={formulaTokenExplanation(token)}
      >
        {token}
      </FormulaTerm>,
    );
    cursor = index + token.length;
  }

  if (cursor < text.length) {
    parts.push(
      <Fragment key={`text-${cursor}`}>
        {text.slice(cursor)}
      </Fragment>,
    );
  }

  return <>{parts}</>;
}

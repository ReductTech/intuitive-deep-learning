/**
 * 一个零依赖的安全表达式求值器（递归下降解析）。
 * Agent 的 calculator 工具用它来计算，绝不使用 eval。
 */

type Token =
  | { type: "number"; value: number }
  | { type: "ident"; value: string }
  | { type: "op"; value: string };

const FUNCTIONS: Record<string, (...args: number[]) => number> = {
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  round: (x, digits = 0) => {
    const factor = 10 ** digits;
    return Math.round(x * factor) / factor;
  },
  floor: Math.floor,
  ceil: Math.ceil,
  sign: Math.sign,
  exp: Math.exp,
  ln: Math.log,
  log: Math.log10,
  log2: Math.log2,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  pow: Math.pow,
  min: (...xs) => Math.min(...xs),
  max: (...xs) => Math.max(...xs),
  hypot: (...xs) => Math.hypot(...xs),
  sum: (...xs) => xs.reduce((a, b) => a + b, 0),
  avg: (...xs) => xs.reduce((a, b) => a + b, 0) / xs.length,
};

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
  tau: Math.PI * 2,
};

const normalize = (input: string) =>
  input
    .replace(/[（）]/g, (m) => (m === "（" ? "(" : ")"))
    .replace(/[×✕✖]/g, "*")
    .replace(/[÷]/g, "/")
    .replace(/[−–—]/g, "-")
    .replace(/[，]/g, ",")
    .replace(/[π]/g, "pi")
    .replace(/√/g, "sqrt")
    .replace(/\s+/g, "")
    .toLowerCase();

function tokenize(input: string): Token[] {
  const src = normalize(input);
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < src.length && /[0-9.e]/.test(src[j])) {
        // 支持 1e-3 这类科学计数法
        if (src[j] === "e" && !/[0-9]/.test(src[j + 1] ?? "") && src[j + 1] !== "-") break;
        if (src[j] === "e" && src[j + 1] === "-" && !/[0-9]/.test(src[j + 2] ?? "")) break;
        j += 1;
      }
      const slice = src.slice(i, j);
      const value = Number(slice);
      if (Number.isNaN(value)) throw new Error(`无法识别的数字: ${slice}`);
      tokens.push({ type: "number", value });
      i = j;
      continue;
    }
    if (/[a-z]/.test(ch)) {
      let j = i;
      while (j < src.length && /[a-z0-9_]/.test(src[j])) j += 1;
      tokens.push({ type: "ident", value: src.slice(i, j) });
      i = j;
      continue;
    }
    if ("+-*/%^(),!".includes(ch)) {
      tokens.push({ type: "op", value: ch });
      i += 1;
      continue;
    }
    throw new Error(`表达式里出现了不支持的字符: ${ch}`);
  }
  return tokens;
}

function parse(tokens: Token[]): number {
  let pos = 0;
  const peek = () => tokens[pos];
  const eat = (value: string) => {
    const token = peek();
    if (!token || token.type !== "op" || token.value !== value) {
      throw new Error(`表达式语法错误：期望 "${value}"`);
    }
    pos += 1;
  };

  function expression(): number {
    let left = term();
    for (;;) {
      const token = peek();
      if (token?.type === "op" && (token.value === "+" || token.value === "-")) {
        pos += 1;
        const right = term();
        left = token.value === "+" ? left + right : left - right;
      } else {
        return left;
      }
    }
  }

  function term(): number {
    let left = unary();
    for (;;) {
      const token = peek();
      if (token?.type === "op" && (token.value === "*" || token.value === "/" || token.value === "%")) {
        pos += 1;
        const right = unary();
        if ((token.value === "/" || token.value === "%") && right === 0) {
          throw new Error("除数不能为 0");
        }
        left =
          token.value === "*" ? left * right : token.value === "/" ? left / right : left % right;
      } else {
        return left;
      }
    }
  }

  function unary(): number {
    const token = peek();
    if (token?.type === "op" && (token.value === "-" || token.value === "+")) {
      pos += 1;
      const value = unary();
      return token.value === "-" ? -value : value;
    }
    return power();
  }

  function power(): number {
    const base = primary();
    const token = peek();
    if (token?.type === "op" && token.value === "^") {
      pos += 1;
      const exponent = unary();
      return base ** exponent;
    }
    return base;
  }

  function primary(): number {
    const token = peek();
    if (!token) throw new Error("表达式不完整");
    if (token.type === "number") {
      pos += 1;
      return factorialTail(token.value);
    }
    if (token.type === "ident") {
      pos += 1;
      const name = token.value;
      const fn = FUNCTIONS[name];
      if (fn) {
        eat("(");
        const args: number[] = [];
        if (peek() && !(peek().type === "op" && peek().value === ")")) {
          args.push(expression());
          while (peek()?.type === "op" && peek().value === ",") {
            pos += 1;
            args.push(expression());
          }
        }
        eat(")");
        return fn(...args);
      }
      if (name in CONSTANTS) return CONSTANTS[name];
      throw new Error(`未知的函数或常量: ${name}`);
    }
    if (token.type === "op" && token.value === "(") {
      pos += 1;
      const value = expression();
      eat(")");
      return value;
    }
    throw new Error(`表达式语法错误：无法解析 "${token.value}"`);
  }

  function factorialTail(value: number): number {
    const token = peek();
    if (token?.type === "op" && token.value === "!") {
      pos += 1;
      if (!Number.isInteger(value) || value < 0 || value > 170) {
        throw new Error("阶乘只支持 0-170 之间的整数");
      }
      let result = 1;
      for (let k = 2; k <= value; k += 1) result *= k;
      return result;
    }
    return value;
  }

  const result = expression();
  if (pos < tokens.length) {
    throw new Error("表达式语法错误：存在多余的字符");
  }
  if (!Number.isFinite(result)) {
    throw new Error("计算结果不是有限数值");
  }
  return result;
}

export function calculate(expression: string): number {
  if (!expression.trim()) throw new Error("表达式为空");
  return parse(tokenize(expression));
}
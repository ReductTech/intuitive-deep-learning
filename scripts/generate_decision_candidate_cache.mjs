import { createHash } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const candidatesPath = join(repoRoot, 'modules', 'Neuron-Guide-React', 'data', 'decisionCandidates.json');
const cachePath = join(scriptDir, 'langchain_app', 'data', 'precomputed', 'decision-candidates.json');
const settingsPath = join(repoRoot, 'settings.json');

const dimensions = `候选因素只允许来自以下九个维度：个人意愿、经济条件、家庭因素、能力经验、时间安排、机会窗口、风险大小、长期发展、现实环境。因素名可以结合当前决策具体化，但不能创造范围外的新维度。`;
const systemPrompt = '你是面向初学者的深度学习教学内容编辑。只返回严格 JSON，不要 Markdown、解释或分析文字。内容必须具体、自然、可评分。';

function parseArgs(argv) {
  const options = { candidates: [], force: false, approve: false, promote: false, validateOnly: false, limit: Number.MAX_SAFE_INTEGER };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--force') options.force = true;
    else if (arg === '--approve') options.approve = true;
    else if (arg === '--promote') options.promote = true;
    else if (arg === '--validate-only') options.validateOnly = true;
    else if (arg === '--candidate') options.candidates.push(argv[++index]);
    else if (arg === '--limit') options.limit = Number(argv[++index]);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isFinite(options.limit) || options.limit < 0) throw new Error('--limit must be a non-negative number.');
  return options;
}

function normalizeKey(value) {
  return String(value ?? '').normalize('NFKC').trim().toLowerCase()
    .replace(/^(是否要|要不要|该不该|能不能|可不可以)/u, '').trim()
    .replace(/[？?。.!！\s]+$/gu, '').trim().replace(/\s+/gu, ' ');
}

function validateDocument(document) {
  if (!document || document.schema_version !== 1 || document.namespace !== 'decision-candidates') throw new Error('Invalid cache header.');
  if (!Number.isInteger(document.content_version) || document.content_version < 1 || !Array.isArray(document.entries)) throw new Error('Invalid cache version or entries.');
  const ids = new Set();
  const keys = new Set();
  for (const entry of document.entries) {
    if (!entry?.id || ids.has(entry.id)) throw new Error(`Missing or duplicate entry id: ${entry?.id}`);
    ids.add(entry.id);
    for (const rawKey of [entry.key, ...(entry.aliases ?? [])]) {
      const key = normalizeKey(rawKey);
      if (!key || keys.has(key)) throw new Error(`Missing or duplicate normalized key: ${rawKey}`);
      keys.add(key);
    }
    if (!entry.outputs?.intake || !entry.outputs?.extra_factors) throw new Error(`${entry.id} has incomplete outputs.`);
    if (!['generated', 'approved', 'rejected'].includes(entry.review?.status)) throw new Error(`${entry.id} has invalid review status.`);
  }
  return document;
}

function validateModelResult(label, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label}: result is not an object.`);
  for (const field of ['decision', 'positive_label', 'negative_label']) {
    if (typeof value[field] !== 'string' || !value[field].trim()) throw new Error(`${label}: ${field} is empty.`);
  }
  if (!Array.isArray(value.factors) || value.factors.length !== 3) throw new Error(`${label}: exactly three factors are required.`);
  const combinedText = JSON.stringify(value);
  if (!/深度学习|神经元/u.test(label) && /深度学习|神经元/u.test(combinedText)) {
    throw new Error(`${label}: result invented a course-specific object.`);
  }
  const names = new Set();
  for (const [index, factor] of value.factors.entries()) {
    for (const field of ['name', 'direction', 'value_label', 'value_question', 'explanation']) {
      if (typeof factor?.[field] !== 'string' || !factor[field].trim()) throw new Error(`${label}: factor ${index + 1} ${field} is empty.`);
    }
    if (!['positive', 'negative'].includes(factor.direction)) throw new Error(`${label}: factor ${index + 1} direction is invalid.`);
    if (typeof factor.suggested_importance !== 'number' || factor.suggested_importance < 0 || factor.suggested_importance > 1) throw new Error(`${label}: factor ${index + 1} weight is invalid.`);
    const name = normalizeKey(factor.name);
    if (names.has(name)) throw new Error(`${label}: factor names must be distinct.`);
    names.add(name);
  }
  return value;
}

function promptFor(label) {
  return `为神经元入门教学网页预生成候选决定“${label}”的完整分析。\n\n${dimensions}\n\n要求：\n1. 把候选规范成只讨论一个目标动作的自然 yes/no 问句，decision 推荐“要不要 + 目标动作 + ？”。\n2. positive_label 是目标动作短标签，negative_label 是自然的否定短标签。\n3. 不得擅自补充候选中没有的对象、课程、职业或情境。候选较抽象时保持抽象，例如“继续坚持”只能规范为“要不要继续坚持当前正在做的事？”。\n4. factors 正好 3 个，分别来自三个不同维度；按对这个决定的相关性排序。\n5. 每个因素必须具体且适合用户按 0-1 评价当前真实强度。不要替用户给强度。\n6. name、value_label、value_question 必须描述同一个原始变量，不能一个写“充裕度”另一个却问“压力程度”。\n7. direction 必须严格根据 value_question 中 0 到 1 的原始评分判断：评分越高越支持 positive_label 才是 positive，评分越高越削弱 positive_label 才是 negative。例如“不回复的风险越高”会更支持“回复”，所以是 positive。\n8. value_label 是用户直接评分的原始变量；value_question 是自然、清晰的评分问题。\n9. suggested_importance 是教学用建议权重，范围 0-1，要有合理区分度，不能机械地全填 0.5。\n10. explanation 用一句话解释因素为什么影响该决定。\n11. 输出必须是这个 JSON 结构，不得增加或遗漏字段：\n{"decision":"...","positive_label":"...","negative_label":"...","factors":[{"name":"...","direction":"positive或negative","value_label":"...","value_question":"...","suggested_importance":0.8,"explanation":"..."},{"name":"...","direction":"positive或negative","value_label":"...","value_question":"...","suggested_importance":0.7,"explanation":"..."},{"name":"...","direction":"positive或negative","value_label":"...","value_question":"...","suggested_importance":0.6,"explanation":"..."}]}`;
}

function extractText(response) {
  if (Array.isArray(response.content)) return response.content.filter((item) => item?.type === 'text').map((item) => item.text).join('');
  const content = response.choices?.[0]?.message?.content ?? response.choices?.[0]?.text;
  return typeof content === 'string' ? content : '';
}

function parseJsonText(text) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/iu, '').replace(/\s*```$/u, '');
  return JSON.parse(trimmed);
}

async function requestCandidate(settings, label) {
  const endpoint = settings.baseUrl.endsWith('/v1/messages') ? settings.baseUrl : settings.baseUrl.endsWith('/v1') ? `${settings.baseUrl}/messages` : `${settings.baseUrl}/v1/messages`;
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.token}`,
          'x-api-key': settings.token,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: settings.model,
          system: systemPrompt,
          messages: [{ role: 'user', content: promptFor(label) }],
          temperature: 0.2,
          max_tokens: 4096,
        }),
        signal: AbortSignal.timeout(120_000),
      });
      if (!response.ok) throw new Error(`upstream HTTP ${response.status}`);
      const payload = await response.json();
      return validateModelResult(label, parseJsonText(extractText(payload)));
    } catch (error) {
      lastError = error;
      if (attempt < 3) console.log(`[decision-cache] ${label} attempt ${attempt} failed validation; retrying`);
    }
  }
  throw lastError;
}

function asEntry(label, sequence, result, model, approved, existingId) {
  const factors = result.factors.map((factor) => ({
    ...factor,
    value_transform: factor.direction === 'positive' ? 'direct' : 'inverse',
  }));
  const intake = {
    status: 'ok',
    decision: result.decision.trim(),
    positive_label: result.positive_label.trim(),
    negative_label: result.negative_label.trim(),
    reason: '候选项预生成内容。',
    primary_factor: factors[0],
  };
  const aliases = normalizeKey(result.decision) === normalizeKey(label) ? [] : [result.decision];
  return {
    id: existingId ?? `decision-${String(sequence).padStart(3, '0')}`,
    key: label,
    aliases,
    source: { candidate: label, sha256: createHash('sha256').update(label).digest('hex') },
    outputs: { intake, extra_factors: { factors: factors.slice(1) } },
    generation: { model, prompt_version: 'decision-candidate-bundle-v2', generated_at: new Date().toISOString(), sequence },
    review: { status: approved ? 'approved' : 'generated', method: 'schema-and-semantic-validation' },
  };
}

async function atomicWrite(document) {
  validateDocument(document);
  const temporary = `${cachePath}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  await rename(temporary, cachePath);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const source = JSON.parse(await readFile(candidatesPath, 'utf8'));
  const allCandidates = source.rows.flat().map((item) => item.trim());
  if (new Set(allCandidates.map(normalizeKey)).size !== allCandidates.length) throw new Error('Candidate labels are not unique after normalization.');
  const document = validateDocument(JSON.parse(await readFile(cachePath, 'utf8')));
  if (options.validateOnly) {
    const candidateKeys = new Set(allCandidates.map(normalizeKey));
    const cacheKeys = new Set(document.entries.map((entry) => normalizeKey(entry.key)));
    const missing = allCandidates.filter((candidate) => !cacheKeys.has(normalizeKey(candidate)));
    const extra = document.entries.filter((entry) => !candidateKeys.has(normalizeKey(entry.key))).map((entry) => entry.key);
    const unapproved = document.entries.filter((entry) => entry.review.status !== 'approved').map((entry) => entry.key);
    if (missing.length || extra.length || unapproved.length) {
      throw new Error(`Cache coverage failed: missing=${missing.join(',')} extra=${extra.join(',')} unapproved=${unapproved.join(',')}`);
    }
    console.log(JSON.stringify({ ok: true, entries: document.entries.length, approved: document.entries.length, path: cachePath }));
    return;
  }

  const requested = options.candidates.length ? new Set(options.candidates) : null;
  if (requested) {
    const unknown = [...requested].filter((item) => !allCandidates.includes(item));
    if (unknown.length) throw new Error(`Unknown candidates: ${unknown.join(', ')}`);
  }
  const byKey = new Map(document.entries.map((entry) => [normalizeKey(entry.key), entry]));
  if (options.promote) {
    const promotable = document.entries.filter((entry) => (!requested || requested.has(entry.key)) && entry.review.status === 'generated');
    for (const entry of promotable) entry.review = { status: 'approved', method: 'operator-promotion-after-review' };
    if (promotable.length) {
      document.content_version += 1;
      await atomicWrite(document);
    }
    console.log(JSON.stringify({ ok: true, promoted: promotable.length, entries: document.entries.length, path: cachePath }));
    return;
  }
  const pending = allCandidates.filter((item) => (!requested || requested.has(item)) && (options.force || !byKey.has(normalizeKey(item)))).slice(0, options.limit);
  const rawSettings = JSON.parse(await readFile(settingsPath, 'utf8')).env ?? {};
  const model = rawSettings.ANTHROPIC_MODEL ?? rawSettings.ANTHROPIC_DEFAULT_SONNET_MODEL ?? rawSettings.ANTHROPIC_DEFAULT_OPUS_MODEL ?? rawSettings.ANTHROPIC_DEFAULT_HAIKU_MODEL;
  const settings = { baseUrl: rawSettings.ANTHROPIC_BASE_URL?.replace(/\/$/u, ''), token: rawSettings.ANTHROPIC_AUTH_TOKEN, model };
  if (!settings.baseUrl || !settings.token || !settings.model) throw new Error('LLM settings are incomplete.');

  console.log(`[decision-cache] pending=${pending.length} total=${allCandidates.length}`);
  for (let index = 0; index < pending.length; index += 1) {
    const label = pending[index];
    console.log(`[decision-cache] ${index + 1}/${pending.length} generating ${label}`);
    const result = await requestCandidate(settings, label);
    const sequence = allCandidates.indexOf(label) + 1;
    const entry = asEntry(label, sequence, result, settings.model, options.approve, byKey.get(normalizeKey(label))?.id);
    byKey.set(normalizeKey(label), entry);
    document.entries = [...byKey.values()].sort((a, b) => a.generation.sequence - b.generation.sequence);
    document.content_version += 1;
    document.generator = {
      id: 'decision-candidate-generator',
      model: settings.model,
      prompt_versions: ['decision-candidate-bundle-v1', 'decision-candidate-bundle-v2'],
      source: 'modules/Neuron-Guide-React/data/decisionCandidates.json',
    };
    await atomicWrite(document);
    console.log(`[decision-cache] saved ${label} status=${entry.review.status}`);
  }
  console.log(JSON.stringify({ ok: true, generated: pending.length, entries: document.entries.length, path: cachePath }));
}

await main();

export const FACE_RUNTIME_STATE_VERSION = 1 as const;
export const FACE_RUNTIME_STATE_KEY = 'activity:face-recog-runtime-v1';

export const FACE_KERNEL_IDS = [
  'edge',
  'vertical',
  'horizontal',
  'diag_down',
  'diag_up',
  'center',
] as const;

export type FaceKernelId = (typeof FACE_KERNEL_IDS)[number];

export const FACE_QUIZ_IDS = [
  'quizKernelDepth',
  'quizRgbDepth',
  'quizKernelCount',
  'quizValAccuracy',
  'quizFaceVerification',
] as const;

export type FaceQuizId = (typeof FACE_QUIZ_IDS)[number];
export type FaceLessonAct = 1 | 2 | 3;
export type FaceTrainingPhase = 'idle' | 'starting' | 'running' | 'complete' | 'failed';
export type FaceGameCheckpoint =
  | 'not_started'
  | 'dresser_quest'
  | 'editing'
  | 'inspection_pending'
  | 'failed_retry'
  | 'completed';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface FaceConvLayerSnapshot {
  id: string;
  kind: 'conv';
  name: string;
  out_channels: number;
  kernel_size: number;
  stride: number;
  padding: number;
}

export interface FacePoolLayerSnapshot {
  id: string;
  kind: 'pool';
  name: string;
  kernel_size: number;
  stride: number;
  pool_type: 'max' | 'avg';
}

export type FaceArchitectureLayerSnapshot = FaceConvLayerSnapshot | FacePoolLayerSnapshot;

export interface FaceTrainingSnapshot {
  phase: FaceTrainingPhase;
  requestId: string | null;
  jobId: string | null;
  signature: string | null;
  startedAt: number | null;
  completedAt: number | null;
  error: string | null;
}

export interface FaceFixedKernelSnapshot {
  selectedKernels: FaceKernelId[];
  activeFeatureKernel: FaceKernelId;
  sampleIndex: number;
  previewSampleIndex: number;
  preview: JsonValue | null;
  result: JsonValue | null;
  training: FaceTrainingSnapshot;
  completed: boolean;
  continueConfirmed: boolean;
}

export interface FaceArchitectureEditorSnapshot {
  kind: 'conv' | 'pool';
  poolType: 'max' | 'avg';
  outChannels: number;
}

export interface FaceCnnSnapshot {
  architecture: FaceArchitectureLayerSnapshot[];
  selectedLayerIndex: number;
  editor: FaceArchitectureEditorSnapshot;
  epochs: number;
  result: JsonValue | null;
  training: FaceTrainingSnapshot;
  completed: boolean;
}

export interface FaceQuizAnswerSnapshot {
  answer: JsonValue | null;
  correct: boolean | null;
  submitted: boolean;
  feedback: string | null;
  submissionId: string | null;
  reviewStatus: 'idle' | 'pending' | 'complete' | 'failed';
}

export interface FaceQuizSnapshot {
  currentIndex: number;
  completedIds: FaceQuizId[];
  results: Partial<Record<FaceQuizId, boolean>>;
  answers: Partial<Record<FaceQuizId, FaceQuizAnswerSnapshot>>;
  act3Unlocked: boolean;
  completed: boolean;
}

export interface FaceDisguiseEditorSnapshot {
  selected: boolean;
  templateKey: string;
  tool: string;
  beardVariant: string | null;
  params: Record<string, JsonValue>;
  markData: Array<Record<string, JsonValue>>;
  guideSeen: Record<string, boolean>;
}

export interface FaceSimilaritySnapshot {
  revision: number;
  correlation: number | null;
  similarityPercent: number | null;
  result: JsonValue | null;
}

export interface FaceGameSnapshot {
  checkpoint: FaceGameCheckpoint;
  started: boolean;
  attempts: number;
  player: {
    x: number | null;
    y: number | null;
    facing: string | null;
  };
  editor: FaceDisguiseEditorSnapshot;
  disguiseRevision: number;
  similarity: FaceSimilaritySnapshot | null;
  lastOutcome: 'passed' | 'failed' | null;
  completed: boolean;
}

export interface FaceRuntimeSnapshot {
  version: typeof FACE_RUNTIME_STATE_VERSION;
  unlockedAct: FaceLessonAct;
  fixedKernel: FaceFixedKernelSnapshot;
  cnn: FaceCnnSnapshot;
  quiz: FaceQuizSnapshot;
  game: FaceGameSnapshot;
  moduleCompleted: boolean;
}

/** Shape emitted by the pre-React runtime when it is bridged into Telemetry. */
export interface LegacyFaceRuntimeSnapshot {
  result?: unknown;
  lenetResult?: unknown;
  preview?: unknown;
  sampleIndex?: unknown;
  selectedKernels?: unknown;
  activeFeatureKernel?: unknown;
  unlockedAct?: unknown;
  architecture?: unknown;
  archSelectedIndex?: unknown;
  lenetEpochs?: unknown;
  training?: unknown;
  lenetTraining?: unknown;
  lenetTrainingComplete?: unknown;
  previewSampleIndex?: unknown;
  quizResults?: unknown;
  gameCheckpoint?: unknown;
  game?: unknown;
  moduleCompleted?: unknown;
}

export const FACE_ACTIVITY_EVENTS = {
  kernelToggled: 'face_kernel_toggled',
  kernelsReset: 'face_kernels_reset',
  sampleChanged: 'face_sample_changed',
  featureKernelSelected: 'face_feature_kernel_selected',
  fixedTrainingStarted: 'face_fixed_training_started',
  fixedContinueConfirmed: 'face_fixed_continue_confirmed',
  architectureLayerAdded: 'face_arch_layer_added',
  architectureLayerUpdated: 'face_arch_layer_updated',
  architectureLayerDeleted: 'face_arch_layer_deleted',
  architectureLayerReordered: 'face_arch_layer_reordered',
  architectureReset: 'face_architecture_reset',
  cnnTrainingStarted: 'face_cnn_training_started',
  gameStarted: 'face_game_started',
  disguiseSubmitted: 'face_disguise_submitted',
  gameCompleted: 'face_game_completed',
  moduleCompleted: 'face_module_completed',
} as const;

const kernelIdSet = new Set<string>(FACE_KERNEL_IDS);
const quizIdSet = new Set<string>(FACE_QUIZ_IDS);
const trainingPhases = new Set<string>(['idle', 'starting', 'running', 'complete', 'failed']);
const gameCheckpoints = new Set<string>([
  'not_started',
  'dresser_quest',
  'editing',
  'inspection_pending',
  'failed_retry',
  'completed',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function finiteNumber(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function integerInRange(value: unknown, fallback: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(finiteNumber(value, fallback))));
}

function nullableFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length ? value : null;
}

function jsonValue(value: unknown, seen = new WeakSet<object>()): JsonValue | null {
  if (value === null) return null;
  if (typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'bigint') return String(value);
  if (Array.isArray(value)) return value.map((item) => jsonValue(item, seen));
  if (!isRecord(value)) return null;
  if (seen.has(value)) return null;
  seen.add(value);
  const normalized: Record<string, JsonValue> = {};
  Object.entries(value).forEach(([key, item]) => {
    if (item === undefined || typeof item === 'function' || typeof item === 'symbol') return;
    normalized[key] = jsonValue(item, seen);
  });
  seen.delete(value);
  return normalized;
}

function jsonRecord(value: unknown): Record<string, JsonValue> {
  const normalized = jsonValue(value);
  return isRecord(normalized) ? normalized as Record<string, JsonValue> : {};
}

function normalizeKernelIds(value: unknown): FaceKernelId[] {
  if (!Array.isArray(value)) return [...FACE_KERNEL_IDS];
  const ids: FaceKernelId[] = [];
  value.forEach((item) => {
    if (typeof item !== 'string' || !kernelIdSet.has(item)) return;
    const id = item as FaceKernelId;
    if (!ids.includes(id)) ids.push(id);
  });
  return ids.length ? ids : [...FACE_KERNEL_IDS];
}

function normalizeTraining(
  value: unknown,
  options: { running?: boolean; completed?: boolean; signature?: string | null } = {},
): FaceTrainingSnapshot {
  const source = isRecord(value) ? value : {};
  const requestedPhase = typeof source.phase === 'string' && trainingPhases.has(source.phase)
    ? source.phase as FaceTrainingPhase
    : null;
  const completed = options.completed === true || source.completed === true || requestedPhase === 'complete';
  const running = options.running === true || requestedPhase === 'starting' || requestedPhase === 'running';
  const phase: FaceTrainingPhase = completed
    ? 'complete'
    : requestedPhase === 'failed'
      ? 'failed'
      : running
        ? (requestedPhase === 'starting' ? 'starting' : 'running')
        : 'idle';
  return {
    phase,
    requestId: nullableString(source.requestId ?? source.request_id),
    jobId: nullableString(source.jobId ?? source.job_id),
    signature: nullableString(source.signature) ?? options.signature ?? null,
    startedAt: nullableFiniteNumber(source.startedAt ?? source.started_at),
    completedAt: nullableFiniteNumber(source.completedAt ?? source.completed_at),
    error: nullableString(source.error),
  };
}

function normalizeArchitecture(value: unknown): FaceArchitectureLayerSnapshot[] {
  if (!Array.isArray(value)) return createDefaultFaceArchitecture();
  return value.flatMap((item, index): FaceArchitectureLayerSnapshot[] => {
    if (!isRecord(item)) return [];
    const kind = item.kind === 'pool' ? 'pool' : 'conv';
    const id = nullableString(item.id) ?? `face-${kind}-${index + 1}`;
    const name = nullableString(item.name) ?? `${kind === 'pool' ? 'Pool' : 'Conv'} ${index + 1}`;
    if (kind === 'pool') {
      return [{
        id,
        kind,
        name,
        kernel_size: integerInRange(item.kernel_size, 2, 1, 9),
        stride: integerInRange(item.stride, 2, 1, 9),
        pool_type: item.pool_type === 'avg' ? 'avg' : 'max',
      }];
    }
    return [{
      id,
      kind,
      name,
      out_channels: integerInRange(item.out_channels, 16, 1, 64),
      kernel_size: integerInRange(item.kernel_size, 3, 1, 9),
      stride: integerInRange(item.stride, 1, 1, 9),
      padding: integerInRange(item.padding, 1, 0, 9),
    }];
  });
}

function normalizeQuizResults(value: unknown): Partial<Record<FaceQuizId, boolean>> {
  if (!isRecord(value)) return {};
  const results: Partial<Record<FaceQuizId, boolean>> = {};
  Object.entries(value).forEach(([key, result]) => {
    if (quizIdSet.has(key) && typeof result === 'boolean') results[key as FaceQuizId] = result;
  });
  return results;
}

function normalizeQuizAnswers(value: unknown): Partial<Record<FaceQuizId, FaceQuizAnswerSnapshot>> {
  if (!isRecord(value)) return {};
  const answers: Partial<Record<FaceQuizId, FaceQuizAnswerSnapshot>> = {};
  Object.entries(value).forEach(([key, rawAnswer]) => {
    if (!quizIdSet.has(key) || !isRecord(rawAnswer)) return;
    const requestedStatus = rawAnswer.reviewStatus ?? rawAnswer.review_status;
    const reviewStatus = requestedStatus === 'pending'
      || requestedStatus === 'complete'
      || requestedStatus === 'failed'
      ? requestedStatus
      : 'idle';
    answers[key as FaceQuizId] = {
      answer: jsonValue(rawAnswer.answer),
      correct: typeof rawAnswer.correct === 'boolean' ? rawAnswer.correct : null,
      submitted: rawAnswer.submitted === true,
      feedback: nullableString(rawAnswer.feedback),
      submissionId: nullableString(rawAnswer.submissionId ?? rawAnswer.submission_id),
      reviewStatus,
    };
  });
  return answers;
}

function normalizeGameCheckpoint(value: unknown): FaceGameCheckpoint {
  return typeof value === 'string' && gameCheckpoints.has(value)
    ? value as FaceGameCheckpoint
    : 'not_started';
}

export function createDefaultFaceArchitecture(): FaceArchitectureLayerSnapshot[] {
  return [
    { id: 'face-conv-1', kind: 'conv', name: 'Conv 1', out_channels: 8, kernel_size: 3, stride: 1, padding: 1 },
    { id: 'face-pool-1', kind: 'pool', name: 'Pool 1', kernel_size: 2, stride: 2, pool_type: 'max' },
    { id: 'face-conv-2', kind: 'conv', name: 'Conv 2', out_channels: 16, kernel_size: 3, stride: 1, padding: 1 },
    { id: 'face-pool-2', kind: 'pool', name: 'Pool 2', kernel_size: 2, stride: 2, pool_type: 'max' },
    { id: 'face-conv-3', kind: 'conv', name: 'Conv 3', out_channels: 32, kernel_size: 3, stride: 1, padding: 1 },
    { id: 'face-pool-3', kind: 'pool', name: 'Pool 3', kernel_size: 2, stride: 2, pool_type: 'max' },
    { id: 'face-conv-4', kind: 'conv', name: 'Conv 4', out_channels: 64, kernel_size: 3, stride: 1, padding: 1 },
  ];
}

export function faceKernelSignature(ids: readonly FaceKernelId[]): string {
  return ids.join('|');
}

export function faceArchitectureSignature(layers: readonly FaceArchitectureLayerSnapshot[]): string {
  return JSON.stringify(layers.map((layer) => {
    if (layer.kind === 'pool') {
      return [layer.kind, layer.kernel_size, layer.stride, layer.pool_type];
    }
    return [layer.kind, layer.out_channels, layer.kernel_size, layer.stride, layer.padding];
  }));
}

export function createInitialFaceRuntimeSnapshot(): FaceRuntimeSnapshot {
  const selectedKernels = [...FACE_KERNEL_IDS];
  return {
    version: FACE_RUNTIME_STATE_VERSION,
    unlockedAct: 1,
    fixedKernel: {
      selectedKernels,
      activeFeatureKernel: 'edge',
      sampleIndex: 0,
      previewSampleIndex: 280,
      preview: null,
      result: null,
      training: normalizeTraining(null, { signature: faceKernelSignature(selectedKernels) }),
      completed: false,
      continueConfirmed: false,
    },
    cnn: {
      architecture: createDefaultFaceArchitecture(),
      selectedLayerIndex: -1,
      editor: { kind: 'conv', poolType: 'max', outChannels: 16 },
      epochs: 50,
      result: null,
      training: normalizeTraining(null),
      completed: false,
    },
    quiz: {
      currentIndex: 0,
      completedIds: [],
      results: {},
      answers: {},
      act3Unlocked: false,
      completed: false,
    },
    game: {
      checkpoint: 'not_started',
      started: false,
      attempts: 0,
      player: { x: null, y: null, facing: null },
      editor: {
        selected: false,
        templateKey: 'normal',
        tool: 'moustache',
        beardVariant: null,
        params: {
          moustacheDensity: 3,
          moustacheSize: 1,
          moleColor: 'rgba(45, 24, 16, 1)',
          moleSize: 9.5,
          moleOpacity: 100,
          brushDiameter: 24,
          brushColor: 'rgba(72, 36, 22, 0.58)',
          brushStrength: 3,
          brushKind: 'shapeBrow',
          skinFilterKey: 'original',
          skinFilterStrength: 55,
          reshapeRadius: 24,
          reshapeStrength: 0.5,
        },
        markData: [],
        guideSeen: { brush: false, mole: false },
      },
      disguiseRevision: 0,
      similarity: null,
      lastOutcome: null,
      completed: false,
    },
    moduleCompleted: false,
  };
}

/**
 * Accepts both the versioned React state and a bare snapshot of the old script's
 * `state` object. Transient timers, DOM/canvas objects, drag state and Phaser
 * display objects are intentionally not represented in the returned value.
 */
export function normalizeFaceRuntimeSnapshot(stored: unknown): FaceRuntimeSnapshot | null {
  if (!isRecord(stored)) return null;
  const initial = createInitialFaceRuntimeSnapshot();
  const root = stored as Record<string, unknown> & LegacyFaceRuntimeSnapshot;

  const fixedSource = isRecord(root.fixedKernel) ? root.fixedKernel : root;
  const selectedKernels = normalizeKernelIds(fixedSource.selectedKernels ?? root.selectedKernels);
  const requestedActiveKernel = fixedSource.activeFeatureKernel ?? root.activeFeatureKernel;
  const activeFeatureKernel = typeof requestedActiveKernel === 'string'
    && kernelIdSet.has(requestedActiveKernel)
    && selectedKernels.includes(requestedActiveKernel as FaceKernelId)
    ? requestedActiveKernel as FaceKernelId
    : selectedKernels[0];
  const fixedResult = jsonValue(fixedSource.result ?? root.result);
  const fixedCompleted = fixedSource.completed === true || fixedResult !== null;
  const fixedTrainingSource = isRecord(fixedSource.training) ? fixedSource.training : null;
  const fixedKernel: FaceFixedKernelSnapshot = {
    selectedKernels,
    activeFeatureKernel,
    sampleIndex: integerInRange(fixedSource.sampleIndex ?? root.sampleIndex, 0, 0, Number.MAX_SAFE_INTEGER),
    previewSampleIndex: integerInRange(
      fixedSource.previewSampleIndex ?? root.previewSampleIndex,
      280,
      0,
      Number.MAX_SAFE_INTEGER,
    ),
    preview: jsonValue(fixedSource.preview ?? root.preview),
    result: fixedResult,
    training: normalizeTraining(fixedTrainingSource, {
      running: root.training === true,
      completed: fixedCompleted,
      signature: faceKernelSignature(selectedKernels),
    }),
    completed: fixedCompleted,
    continueConfirmed: fixedSource.continueConfirmed === true,
  };

  const cnnSource = isRecord(root.cnn) ? root.cnn : root;
  const architecture = normalizeArchitecture(cnnSource.architecture ?? root.architecture);
  const cnnTrainingSource = isRecord(cnnSource.training) ? cnnSource.training : null;
  const requestedCnnPhase = cnnTrainingSource?.phase;
  const cnnTrainingActive = root.lenetTraining === true
    || requestedCnnPhase === 'starting'
    || requestedCnnPhase === 'running';
  const cnnResult = cnnTrainingActive ? null : jsonValue(cnnSource.result ?? root.lenetResult);
  const cnnCompleted = !cnnTrainingActive && (cnnSource.completed === true
    || root.lenetTrainingComplete === true
    || cnnResult !== null);
  const editorSource = isRecord(cnnSource.editor) ? cnnSource.editor : {};
  const selectedLayerIndex = integerInRange(
    cnnSource.selectedLayerIndex ?? root.archSelectedIndex,
    -1,
    -1,
    Math.max(-1, architecture.length - 1),
  );
  const cnn: FaceCnnSnapshot = {
    architecture,
    selectedLayerIndex,
    editor: {
      kind: editorSource.kind === 'pool' ? 'pool' : 'conv',
      poolType: editorSource.poolType === 'avg' || editorSource.pool_type === 'avg' ? 'avg' : 'max',
      outChannels: integerInRange(
        editorSource.outChannels ?? editorSource.out_channels,
        16,
        1,
        64,
      ),
    },
    epochs: integerInRange(cnnSource.epochs ?? root.lenetEpochs, 50, 1, 10_000),
    result: cnnResult,
    training: normalizeTraining(cnnTrainingSource, {
      running: root.lenetTraining === true,
      completed: cnnCompleted,
      signature: faceArchitectureSignature(architecture),
    }),
    completed: cnnCompleted,
  };

  const quizSource = isRecord(root.quiz) ? root.quiz : root;
  const results = normalizeQuizResults(quizSource.results ?? root.quizResults);
  const answers = normalizeQuizAnswers(quizSource.answers);
  const completedFromResults = FACE_QUIZ_IDS.filter((id) => results[id] === true);
  const requestedCompletedIds = Array.isArray(quizSource.completedIds)
    ? quizSource.completedIds.filter(
      (id): id is FaceQuizId => typeof id === 'string' && quizIdSet.has(id),
    )
    : [];
  const completedIds = FACE_QUIZ_IDS.filter(
    (id) => requestedCompletedIds.includes(id) || completedFromResults.includes(id),
  );
  const firstIncompleteQuestionIndex = FACE_QUIZ_IDS.findIndex((id) => !completedIds.includes(id));
  const inferredQuestionIndex = firstIncompleteQuestionIndex < 0
    ? FACE_QUIZ_IDS.length - 1
    : firstIncompleteQuestionIndex;
  const unlockedActValue = integerInRange(root.unlockedAct, 1, 1, 3) as FaceLessonAct;
  const quizCompleted = quizSource.completed === true || completedIds.length === FACE_QUIZ_IDS.length;
  const finalQuestionCompleted = completedIds.includes(FACE_QUIZ_IDS[FACE_QUIZ_IDS.length - 1]);
  const act3Unlocked = quizSource.act3Unlocked === true
    || unlockedActValue >= 3
    || finalQuestionCompleted
    || quizCompleted;
  const requestedQuestionIndex = integerInRange(
    quizSource.currentIndex,
    inferredQuestionIndex,
    0,
    FACE_QUIZ_IDS.length - 1,
  );
  const quiz: FaceQuizSnapshot = {
    currentIndex: Math.max(requestedQuestionIndex, inferredQuestionIndex),
    completedIds,
    results,
    answers,
    act3Unlocked,
    completed: quizCompleted,
  };

  const gameSource = isRecord(root.game) ? root.game : {};
  const editorGameSource = isRecord(gameSource.editor) ? gameSource.editor : {};
  const requestedCheckpoint = gameSource.checkpoint ?? root.gameCheckpoint;
  let checkpoint = normalizeGameCheckpoint(requestedCheckpoint);
  const gameCompleted = gameSource.completed === true || checkpoint === 'completed';
  if (gameCompleted) checkpoint = 'completed';
  const rawMarkData = Array.isArray(editorGameSource.markData) ? editorGameSource.markData : [];
  const guideSeenSource = isRecord(editorGameSource.guideSeen) ? editorGameSource.guideSeen : {};
  const guideSeen: Record<string, boolean> = {};
  Object.entries(guideSeenSource).forEach(([key, value]) => {
    if (typeof value === 'boolean') guideSeen[key] = value;
  });
  const similaritySource = isRecord(gameSource.similarity) ? gameSource.similarity : null;
  const similarity: FaceSimilaritySnapshot | null = similaritySource
    ? {
        revision: integerInRange(similaritySource.revision, 0, 0, Number.MAX_SAFE_INTEGER),
        correlation: nullableFiniteNumber(similaritySource.correlation),
        similarityPercent: nullableFiniteNumber(
          similaritySource.similarityPercent ?? similaritySource.similarity_percent,
        ),
        result: jsonValue(similaritySource.result),
      }
    : null;
  const playerSource = isRecord(gameSource.player) ? gameSource.player : {};
  const lastOutcome = gameSource.lastOutcome === 'passed' || gameSource.lastOutcome === 'failed'
    ? gameSource.lastOutcome
    : null;
  const game: FaceGameSnapshot = {
    checkpoint,
    started: gameSource.started === true || checkpoint !== 'not_started',
    attempts: integerInRange(gameSource.attempts, 0, 0, Number.MAX_SAFE_INTEGER),
    player: {
      x: nullableFiniteNumber(playerSource.x),
      y: nullableFiniteNumber(playerSource.y),
      facing: nullableString(playerSource.facing),
    },
    editor: {
      selected: editorGameSource.selected === true,
      templateKey: nullableString(editorGameSource.templateKey) ?? 'normal',
      tool: nullableString(editorGameSource.tool) ?? 'moustache',
      beardVariant: nullableString(editorGameSource.beardVariant),
      params: {
        ...initial.game.editor.params,
        ...jsonRecord(editorGameSource.params),
      },
      markData: rawMarkData.map(jsonRecord),
      guideSeen: {
        ...initial.game.editor.guideSeen,
        ...guideSeen,
      },
    },
    disguiseRevision: integerInRange(
      gameSource.disguiseRevision,
      rawMarkData.length,
      0,
      Number.MAX_SAFE_INTEGER,
    ),
    similarity,
    lastOutcome,
    completed: gameCompleted,
  };

  const moduleCompleted = root.moduleCompleted === true || game.completed;
  const derivedAct = game.started || quiz.act3Unlocked ? 3 : fixedKernel.continueConfirmed ? 2 : 1;
  const unlockedAct = Math.max(unlockedActValue, derivedAct) as FaceLessonAct;

  return {
    version: FACE_RUNTIME_STATE_VERSION,
    unlockedAct,
    fixedKernel: {
      ...fixedKernel,
      continueConfirmed: fixedKernel.continueConfirmed || unlockedAct >= 2,
    },
    cnn,
    quiz: {
      ...quiz,
      act3Unlocked: quiz.act3Unlocked || unlockedAct >= 3,
    },
    game,
    moduleCompleted,
  };
}

export function isFaceRuntimeComplete(snapshot: FaceRuntimeSnapshot): boolean {
  return snapshot.moduleCompleted === true || snapshot.game.completed === true;
}

/** Terminal transition helper; repeated completion returns the same object. */
export function completeFaceRuntimeSnapshot(snapshot: FaceRuntimeSnapshot): FaceRuntimeSnapshot {
  if (isFaceRuntimeComplete(snapshot)) return snapshot;
  return {
    ...snapshot,
    unlockedAct: 3,
    quiz: { ...snapshot.quiz, act3Unlocked: true },
    game: {
      ...snapshot.game,
      checkpoint: 'completed',
      started: true,
      lastOutcome: 'passed',
      completed: true,
    },
    moduleCompleted: true,
  };
}

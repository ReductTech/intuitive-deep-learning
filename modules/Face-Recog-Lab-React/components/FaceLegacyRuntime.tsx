import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  getTelemetryState,
  Question,
  type QuestionCheckResult,
  type QuestionOption,
  type QuestionProps,
} from '../../shared/react';
import legacyHtml from '../../Face-Recog-Lab/index.html?raw';
import legacyScriptSource from '../../Face-Recog-Lab/script.js?raw';
import threeScriptUrl from '../../shared/vendor/three/0.148.0/three.min.js?url';
import phaserScriptUrl from '../../shared/vendor/phaser/3.90.0/phaser.min.js?url';
import echartsScriptUrl from '../../shared/vendor/echarts/5.6.0/echarts.min.js?url';
import plotlyScriptUrl from '../../shared/vendor/plotly/3.6.0/plotly.min.js?url';
import plotUtilsScriptUrl from '../../shared/plot-utils.js?url';
import constantsScriptUrl from '../../Face-Recog-Lab/game/config/constants.js?url';
import disguiseConfigScriptUrl from '../../Face-Recog-Lab/game/assets/disguise-config.js?url';
import collisionScriptUrl from '../../Face-Recog-Lab/game/systems/collision.js?url';
import animationScriptUrl from '../../Face-Recog-Lab/game/actors/animation.js?url';
import actorScriptUrl from '../../Face-Recog-Lab/game/actors/actor.js?url';
import navigationScriptUrl from '../../Face-Recog-Lab/game/systems/navigation.js?url';
import movementScriptUrl from '../../Face-Recog-Lab/game/actors/movement.js?url';
import dialogueScriptSource from '../../Face-Recog-Lab/game/ui/dialogue.js?raw';
import brushScriptUrl from '../../Face-Recog-Lab/game/disguise/brush.js?url';
import rendererScriptUrl from '../../Face-Recog-Lab/game/disguise/renderer.js?url';
import meterScriptUrl from '../../Face-Recog-Lab/game/ui/meter.js?url';
import similarityScriptSource from '../../Face-Recog-Lab/game/systems/similarity.js?raw';
import buttonsScriptUrl from '../../Face-Recog-Lab/game/ui/buttons.js?url';
import editorScriptSource from '../../Face-Recog-Lab/game/disguise/editor.js?raw';
import openingScriptSource from '../../Face-Recog-Lab/game/cutscene/opening.js?raw';
import act3SceneScriptUrl from '../../Face-Recog-Lab/game/scene/Act3Scene.js?url';
import act3GameScriptSource from '../../Face-Recog-Lab/act3-disguise-game.js?raw';
import {
  PersistedFaceShortAnswerQuestion,
  type FaceQuestionCheckMeta,
} from './PersistedFaceShortAnswerQuestion';
import {
  FACE_ACTIVITY_EVENTS,
  FACE_QUIZ_IDS,
  faceArchitectureSignature,
  faceKernelSignature,
  normalizeFaceRuntimeSnapshot,
  type FaceGameSnapshot,
  type FaceQuizId,
  type FaceRuntimeSnapshot,
} from '../model/faceState';

export type LegacyFaceStage = 'fixed' | 'cnn' | 'quiz' | 'game';

export interface FaceLegacyRuntimeProviderProps {
  snapshot: FaceRuntimeSnapshot;
  onSnapshot: (snapshot: FaceRuntimeSnapshot) => void;
  onSemanticEvent: (
    eventName: string,
    snapshot: FaceRuntimeSnapshot,
    properties?: Record<string, unknown>,
  ) => void;
  children: ReactNode;
}

export interface LegacyStageHostProps {
  stage: LegacyFaceStage;
  className?: string;
}

interface LegacyQuestionOptions {
  type?: QuestionProps['type'];
  title?: ReactNode;
  options?: QuestionOption[];
  answer?: string | string[];
  multiple?: boolean;
  blanks?: Array<{ label?: ReactNode; placeholder?: string; chars?: number }>;
  rows?: number;
  typeLabel?: ReactNode;
  submitText?: ReactNode;
  feedback?: QuestionProps['feedback'];
  instant?: boolean;
  className?: string;
  deferScore?: boolean;
  validator?: (answers: string[]) => boolean;
  onCheck?: (result: QuestionCheckResult, question?: Element | null) => void;
  onReset?: (question?: Element | null) => void;
}

interface LegacyFaceState {
  result?: unknown;
  lenetResult?: unknown;
  preview?: unknown;
  sampleIndex?: number;
  selectedKernels?: string[];
  activeFeatureKernel?: string;
  unlockedAct?: number;
  architecture?: unknown[];
  archEditor?: FaceRuntimeSnapshot['cnn']['editor'];
  archSelectedIndex?: number;
  lenetEpochs?: number;
  training?: boolean;
  lenetTraining?: boolean;
  lenetJobId?: string;
  lenetTrainingComplete?: boolean;
  previewSampleIndex?: number;
  quizResults?: Record<string, boolean>;
}

interface LegacyFaceApi {
  getState: () => LegacyFaceState;
  renderQuestions: () => void;
  restore: (snapshot: FaceRuntimeSnapshot) => void;
  resumeCnnJob: (jobId: string) => Promise<void> | void;
  showQuizStep: (index: number, shouldScroll?: boolean) => void;
  setQuizResult: (id: FaceQuizId, ok: boolean) => void;
  unlockSecond: () => void;
  unlockThird: () => void;
}

interface LegacyBridgeWindow extends Window {
  __FACE_REACT_BRIDGE__?: {
    bootstrap: FaceRuntimeSnapshot;
    registerLegacyApi: (api: LegacyFaceApi) => void;
    notify: (name: string, detail?: Record<string, unknown>) => void;
  };
  __FACE_LEGACY_API__?: LegacyFaceApi;
  Act3DisguiseGame?: {
    constants?: Record<string, unknown>;
    cutscene?: {
      opening?: {
        startOpeningCutscene?: (scene: LegacyGameScene) => Promise<unknown> | unknown;
        showCompletedOutcome?: (scene: LegacyGameScene) => Promise<unknown> | unknown;
      };
    };
    entry?: {
      startDirect?: () => boolean;
      prepare?: () => void;
    };
    scene?: {
      createPhaserScene?: (host: HTMLElement) => LegacyPhaserGame;
    };
    instance?: LegacyPhaserGame;
    runtimeBridge?: {
      read?: () => unknown;
      restore?: (snapshot: unknown) => void;
      shouldRestore?: () => boolean;
      onSceneReady?: (scene: LegacyGameScene) => void;
    };
  };
  __FACE_GAME_RESTORING__?: boolean;
  DLModuleUI?: Record<string, unknown>;
}

interface LegacyPhaserGame {
  destroy?: (removeCanvas?: boolean) => void;
  scene?: {
    getScene?: (key: string) => LegacyGameScene | null | undefined;
  };
}

interface LegacyGameEditor {
  show?: () => void;
  hide?: () => void;
  reset?: () => void;
  snapshot?: () => Record<string, unknown>;
  restore?: (snapshot: unknown) => void;
}

interface LegacyGameScene extends Record<string, any> {
  disguiseEditor?: LegacyGameEditor;
}

interface RuntimeCallbacks {
  onSnapshot: (snapshot: FaceRuntimeSnapshot) => void;
  onSemanticEvent: FaceLegacyRuntimeProviderProps['onSemanticEvent'];
}

interface StageRecord {
  node: HTMLElement;
  currentHost: HTMLElement | null;
}

const FACE_ASSET_ROOT = '/modules/Face-Recog-Lab/game_assets/';
const FIXED_COMPLETE_EVENT = 'face-recog:fixed-complete';
const CNN_COMPLETE_EVENT = 'face-recog:cnn-trained';
const QUIZ_COMPLETE_EVENT = 'face-recog:understanding-complete';
const GAME_COMPLETE_EVENT = 'face-recog:act3-complete';

const SCRIPT_SEQUENCE_AFTER_LEGACY = [
  ['face-game-constants', constantsScriptUrl],
  ['face-game-disguise-config', disguiseConfigScriptUrl],
  ['face-game-collision', collisionScriptUrl],
  ['face-game-animation', animationScriptUrl],
  ['face-game-actor', actorScriptUrl],
  ['face-game-navigation', navigationScriptUrl],
  ['face-game-movement', movementScriptUrl],
  ['face-game-brush', brushScriptUrl],
  ['face-game-renderer', rendererScriptUrl],
  ['face-game-meter', meterScriptUrl],
  ['face-game-buttons', buttonsScriptUrl],
] as const;

const LEGACY_BRIDGE_SOURCE = String.raw`
  var faceReactRestoredSnapshot = null;

  function faceReactApplyState(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return;
    faceReactRestoredSnapshot = snapshot;
    var fixed = snapshot.fixedKernel || {};
    var cnn = snapshot.cnn || {};
    var quiz = snapshot.quiz || {};
    state.selectedKernels = Array.isArray(fixed.selectedKernels) ? fixed.selectedKernels.slice() : [];
    if (typeof fixed.activeFeatureKernel === 'string') state.activeFeatureKernel = fixed.activeFeatureKernel;
    if (Number.isFinite(Number(fixed.sampleIndex))) state.sampleIndex = Math.max(0, Number(fixed.sampleIndex));
    if (Number.isFinite(Number(fixed.previewSampleIndex))) state.previewSampleIndex = Math.max(0, Number(fixed.previewSampleIndex));
    state.preview = fixed.preview != null ? fixed.preview : null;
    state.result = fixed.result != null ? fixed.result : null;
    state.architecture = Array.isArray(cnn.architecture)
      ? cnn.architecture.map(function (layer) { return Object.assign({}, layer); }) : [];
    if (Number.isFinite(Number(cnn.selectedLayerIndex))) state.archSelectedIndex = Number(cnn.selectedLayerIndex);
    if (Number.isFinite(Number(cnn.epochs))) state.lenetEpochs = Number(cnn.epochs);
    var cnnTraining = cnn.training || {};
    state.lenetJobId = typeof cnnTraining.jobId === 'string' ? cnnTraining.jobId
      : (typeof cnnTraining.job_id === 'string' ? cnnTraining.job_id : null);
    state.lenetResult = cnn.result != null ? cnn.result : null;
    state.lenetTrainingComplete = !!cnn.completed || cnn.result != null;
    if (state.lenetResult) {
      state.result = state.lenetResult;
      state.preview = state.lenetResult;
    }
    state.training = false;
    state.lenetTraining = false;
    state.quizResults = Object.assign({}, quiz.results || {});
    var restoredAct = Number(snapshot.unlockedAct) || 1;
    if (fixed.continueConfirmed) restoredAct = Math.max(restoredAct, 2);
    if (quiz.act3Unlocked) restoredAct = Math.max(restoredAct, 3);
    state.unlockedAct = Math.max(1, Math.min(3, restoredAct));
  }

  function faceReactUnlockSecond() {
    var second = $('faceAct2');
    if (!second) return;
    state.unlockedAct = Math.max(state.unlockedAct, 2);
    second.hidden = false;
    second.classList.remove('is-locked', 'is-revealing');
    second.setAttribute('aria-hidden', 'false');
  }

  function faceReactUnlockThird() {
    var third = $('faceAct3');
    if (!third) return;
    state.unlockedAct = 3;
    third.hidden = false;
    third.classList.remove('is-locked', 'is-revealing');
    third.setAttribute('aria-hidden', 'false');
  }

  function faceReactRefreshUi(snapshot) {
    snapshot = snapshot || faceReactRestoredSnapshot;
    if (!snapshot) return;
    var fixed = snapshot.fixedKernel || {};
    var cnn = snapshot.cnn || {};
    var editor = cnn.editor || {};
    var quiz = snapshot.quiz || {};
    try {
      renderKernelControls();
      renderArchitecture();
      updateArchitectureSelectionUi();
      if (editor.kind === 'conv' || editor.kind === 'pool') {
        syncSelectboxValue('archKindSelect', editor.kind);
      }
      if (editor.poolType === 'max' || editor.poolType === 'avg') {
        syncSelectboxValue('archPoolTypeSelect', editor.poolType);
      }
      if (Number.isFinite(Number(editor.outChannels)) && $('archChannelSlider')) {
        $('archChannelSlider').value = String(channelPresetIndex(Number(editor.outChannels)));
      }
      updateArchEditorFields();
      renderSample();
      renderLearnedFilters();
      drawLenetHistory();
      if (fixed.result) {
        if ($('trainStatus')) $('trainStatus').textContent = '训练完成';
        if ($('trainAcc')) $('trainAcc').textContent = formatPercent(fixed.result.train_accuracy);
        renderValidationMetric(fixed.result.val_accuracy);
        showFirstActContinueCue();
      }
      else {
        if ($('trainStatus')) $('trainStatus').textContent = state.preview ? '特征图已就绪' : '加载特征图';
        if (!state.preview && $('faceIdentity')) $('faceIdentity').textContent = 'ID -';
        if ($('trainAcc')) $('trainAcc').textContent = '-';
        renderValidationMetric(null);
        clearFirstActContinueCue();
      }
      if (cnn.result) {
        if ($('lenetStatus')) $('lenetStatus').textContent = '训练完成 100%';
        if ($('lenetTrainAcc')) $('lenetTrainAcc').textContent = formatPercent(cnn.result.train_accuracy);
        renderLenetValidationMetric(cnn.result.val_accuracy);
      } else {
        if ($('lenetStatus')) $('lenetStatus').textContent = '特征图已就绪';
        if ($('lenetTrainAcc')) $('lenetTrainAcc').textContent = '-';
        renderLenetValidationMetric(null);
      }
      setLenetTrainingResultsVisible(!!cnn.completed || !!cnn.result);
      if (state.unlockedAct >= 2) faceReactUnlockSecond();
      if (state.unlockedAct >= 3) faceReactUnlockThird();
      showFaceQuizStep(Math.max(0, Math.min(FACE_QUIZ_IDS.length - 1, Number(quiz.currentIndex) || 0)), false);
      setTrainingUi(false);
      setLenetTrainingUi(false);
    } catch (error) {
      console.warn('[Face React] 恢复旧运行时界面失败', error);
    }
  }

  function faceReactSerializableState() {
    var editor = archEditorValues();
    return {
      result: state.result,
      lenetResult: state.lenetResult,
      preview: state.preview,
      sampleIndex: state.sampleIndex,
      selectedKernels: Array.isArray(state.selectedKernels) ? state.selectedKernels.slice() : [],
      activeFeatureKernel: state.activeFeatureKernel,
      unlockedAct: state.unlockedAct,
      architecture: Array.isArray(state.architecture)
        ? state.architecture.map(function (layer) { return Object.assign({}, layer); })
        : [],
      archEditor: {
        kind: editor.kind,
        poolType: editor.pool_type,
        outChannels: editor.out_channels
      },
      archSelectedIndex: state.archSelectedIndex,
      lenetEpochs: state.lenetEpochs,
      training: state.training,
      lenetTraining: state.lenetTraining,
      lenetJobId: state.lenetJobId,
      lenetTrainingComplete: state.lenetTrainingComplete,
      previewSampleIndex: state.previewSampleIndex,
      quizResults: Object.assign({}, state.quizResults || {})
    };
  }

  async function faceReactResumeCnnJob(jobId) {
    if (!jobId || state.lenetTraining) return;
    state.lenetJobId = String(jobId);
    setLenetTrainingResultsVisible(false);
    setLenetTrainingUi(true);
    $('lenetStatus').textContent = '正在恢复训练进度...';
    $('lenetTrainAcc').textContent = '-';
    renderLenetValidationMetric(null);
    try {
      var result = await pollLenetTrainingJob(state.lenetJobId);
      if (!result) throw new Error('CNN 训练没有返回结果。');
      state.lenetResult = result;
      state.lenetTrainingComplete = true;
      state.result = result;
      state.preview = result;
      state.sampleIndex = 0;
      $('lenetStatus').textContent = '训练完成 100%';
      $('lenetTrainAcc').textContent = formatPercent(state.lenetResult.train_accuracy);
      renderLenetValidationMetric(state.lenetResult.val_accuracy);
      renderLearnedFilters();
      setLenetTrainingResultsVisible(true);
      drawLenetHistory();
      renderSample();
      state.lenetTraining = false;
      if (window.__FACE_REACT_BRIDGE__) {
        window.__FACE_REACT_BRIDGE__.notify('cnn-complete', {
          source: 'restore',
          job_id: state.lenetJobId
        });
      }
    } catch (error) {
      state.lenetTraining = false;
      $('lenetStatus').textContent = '训练失败';
      renderLenetValidationMetric(null);
      renderLearnedFilters();
      drawLenetHistory();
      if (window.__FACE_REACT_BRIDGE__) {
        window.__FACE_REACT_BRIDGE__.notify('cnn-failed', {
          source: 'restore',
          job_id: state.lenetJobId,
          error: error && error.message ? error.message : String(error)
        });
      }
    } finally {
      setLenetTrainingUi(false);
      applyConvKernelStats();
    }
  }

  window.__FACE_LEGACY_API__ = {
    getState: faceReactSerializableState,
    renderQuestions: renderFaceQuiz,
    restore: function (snapshot) {
      faceReactApplyState(snapshot);
      faceReactRefreshUi(snapshot);
      if (!state.result && !state.preview && !state.previewLoading && !state.previewTimer) {
        if ($('trainStatus')) $('trainStatus').textContent = '加载特征图';
        schedulePreview();
      }
    },
    resumeCnnJob: faceReactResumeCnnJob,
    showQuizStep: function (index, shouldScroll) {
      showFaceQuizStep(index, shouldScroll === true);
    },
    setQuizResult: function (id, ok) {
      state.quizResults[id] = !!ok;
    },
    unlockSecond: faceReactUnlockSecond,
    unlockThird: faceReactUnlockThird
  };
  if (window.__FACE_REACT_BRIDGE__ && window.__FACE_REACT_BRIDGE__.registerLegacyApi) {
    window.__FACE_REACT_BRIDGE__.registerLegacyApi(window.__FACE_LEGACY_API__);
  }
`;

function requiredElement(root: ParentNode, selector: string): HTMLElement {
  const node = root.querySelector<HTMLElement>(selector);
  if (!node) throw new Error(`旧 Face 模块缺少必需节点：${selector}`);
  return node;
}

function appendClassNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(' ');
}

function ensureClassicScript(url: string, key: string): Promise<void> {
  const selector = `script[data-face-runtime-script="${key}"]`;
  const existing = document.querySelector<HTMLScriptElement>(selector);
  if (existing?.dataset.loaded === 'true') return Promise.resolve();
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`脚本加载失败：${key}`)), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = false;
    script.dataset.faceRuntimeScript = key;
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    }, { once: true });
    script.addEventListener('error', () => reject(new Error(`脚本加载失败：${key}`)), { once: true });
    document.head.appendChild(script);
  });
}

function executeInlineScript(source: string, key: string) {
  const existing = document.querySelector<HTMLScriptElement>(`script[data-face-runtime-script="${key}"]`);
  if (existing) return;
  const script = document.createElement('script');
  script.dataset.faceRuntimeScript = key;
  script.text = source;
  document.head.appendChild(script);
  script.dataset.loaded = 'true';
}

function executeLegacyScript(source: string) {
  executeInlineScript(source, 'face-main');
}

function transformLegacyScript(source: string) {
  let transformed = source.replace(/\r\n?/g, '\n');
  const initMarker = '  function init() {';
  if (!transformed.includes(initMarker)) {
    throw new Error('无法定位旧 Face 模块 init 入口。');
  }
  transformed = transformed.replace(initMarker, `${LEGACY_BRIDGE_SOURCE}\n${initMarker}`);
  transformed = transformed.replace(
    "    state.architecture = defaultArchitecture();\n    state.lenetEpochs = LENET_DEFAULT_EPOCHS;\n    setLenetTrainingResultsVisible(false);",
    "    state.architecture = defaultArchitecture();\n    state.lenetEpochs = LENET_DEFAULT_EPOCHS;\n    var faceReactBootstrap = window.__FACE_REACT_BRIDGE__ && window.__FACE_REACT_BRIDGE__.bootstrap;\n    if (faceReactBootstrap) faceReactApplyState(faceReactBootstrap);\n    setLenetTrainingResultsVisible(!!state.lenetTrainingComplete);",
  );
  transformed = transformed.replace('    state.quizResults = {};', '    state.quizResults = state.quizResults || {};');
  transformed = transformed.replace(
    '    renderFaceQuiz();\n    $(\'trainStatus\').textContent = \'加载特征图\';',
    "    renderFaceQuiz();\n    if (faceReactBootstrap) faceReactRefreshUi(faceReactBootstrap);\n    $('trainStatus').textContent = state.result ? '训练完成' : '加载特征图';",
  );
  transformed = transformed.replace(
    "      showFirstActContinueCue();",
    "      showFirstActContinueCue();\n      if (window.__FACE_REACT_BRIDGE__) window.__FACE_REACT_BRIDGE__.notify('fixed-complete');",
  );
  transformed = transformed.replace(
    "    } catch (error) {\n      $('trainStatus').textContent = '服务不可用';",
    "    } catch (error) {\n      if (window.__FACE_REACT_BRIDGE__) window.__FACE_REACT_BRIDGE__.notify('fixed-failed', { error: error && error.message ? error.message : String(error) });\n      $('trainStatus').textContent = '服务不可用';",
  );
  transformed = transformed.replace(
    "    state.lenetTrainingComplete = false;\n    setLenetTrainingResultsVisible(false);",
    "    state.lenetTrainingComplete = false;\n    state.lenetResult = null;\n    state.lenetJobId = null;\n    setLenetTrainingResultsVisible(false);",
  );
  transformed = transformed.replace(
    "      if (result && result.job_id) {\n        updateLenetProgressUi(result);",
    "      if (result && result.job_id) {\n        state.lenetJobId = String(result.job_id);\n        if (window.__FACE_REACT_BRIDGE__) window.__FACE_REACT_BRIDGE__.notify('cnn-job-created', { job_id: state.lenetJobId });\n        updateLenetProgressUi(result);",
  );
  transformed = transformed.replace(
    "      renderSample();\n    } catch (error) {\n      $('lenetStatus').textContent = '训练失败';",
    "      renderSample();\n      state.lenetTraining = false;\n      if (window.__FACE_REACT_BRIDGE__) window.__FACE_REACT_BRIDGE__.notify('cnn-complete', { source: 'user', job_id: state.lenetJobId });\n    } catch (error) {\n      state.lenetTraining = false;\n      $('lenetStatus').textContent = '训练失败';\n      if (window.__FACE_REACT_BRIDGE__) window.__FACE_REACT_BRIDGE__.notify('cnn-failed', { source: 'user', job_id: state.lenetJobId, error: error && error.message ? error.message : String(error) });",
  );
  return transformed;
}

function transformGameEditorScript(source: string) {
  let transformed = source.replace(/\r\n?/g, '\n');
  transformed = transformed.replace(
    "      show: function () {\n        container.setVisible(true);",
    "      show: function () {\n        container.setVisible(true);\n        if (!global.__FACE_GAME_RESTORING__ && global.__FACE_REACT_BRIDGE__) {\n          global.__FACE_REACT_BRIDGE__.notify('game-editing');\n        }",
  );
  transformed = transformed.replace(
    "      if (scene.inspectionRunning) return;\n      scene.inspectionRunning = true;",
    "      if (scene.inspectionRunning) return;\n      scene.inspectionRunning = true;\n      if (!global.__FACE_GAME_RESTORING__ && global.__FACE_REACT_BRIDGE__) {\n        global.__FACE_REACT_BRIDGE__.notify('game-inspection-pending');\n      }",
  );

  const marksMethod = `      marks: function () {
        return state.markData.map(function (mark) {
          return cloneMarkData(mark);
        });
      }`;
  const bridgeMethods = `      marks: function () {
        return state.markData.map(function (mark) {
          return cloneMarkData(mark);
        });
      },
      snapshot: function () {
        return {
          selected: !!state.selected,
          templateKey: state.templateKey,
          tool: state.tool,
          beardVariant: state.beardVariant || null,
          params: Object.assign({}, state.params),
          markData: state.markData.map(function (mark) { return cloneMarkData(mark); }),
          guideSeen: Object.assign({}, state.guideSeen),
          similarity: state.lastSimilarity || null,
          visible: !!container.visible
        };
      },
      restore: function (snapshot) {
        if (!snapshot || typeof snapshot !== 'object') return;
        clearMarks();
        var templateKey = typeof snapshot.templateKey === 'string' && DISGUISE_TEMPLATES[snapshot.templateKey]
          ? snapshot.templateKey
          : 'normal';
        state.templateKey = templateKey;
        state.template = DISGUISE_TEMPLATES[templateKey] || DISGUISE_TEMPLATES.normal;
        state.selected = !!snapshot.selected;
        state.tool = typeof snapshot.tool === 'string' ? snapshot.tool : 'moustache';
        state.beardVariant = typeof snapshot.beardVariant === 'string' ? snapshot.beardVariant : null;
        state.params = Object.assign({}, state.params, snapshot.params || {});
        state.markData = Array.isArray(snapshot.markData)
          ? snapshot.markData.map(function (mark) { return cloneMarkData(mark); })
          : [];
        state.guideSeen = Object.assign({ brush: false, mole: false }, snapshot.guideSeen || {});
        state.lastSimilarity = snapshot.similarity || null;
        var restoredSimilarityPercent = Number(
          state.lastSimilarity && (state.lastSimilarity.similarityPercent != null
            ? state.lastSimilarity.similarityPercent
            : state.lastSimilarity.similarity_percent)
        );
        if (Number.isFinite(restoredSimilarityPercent)) similarityMeter.setValue(restoredSimilarityPercent);
        else similarityMeter.reset();
        scene.disguiseSimilarity = state.lastSimilarity;
        applyFaceTexture();
        Object.keys(templateCards).forEach(function (key) {
          templateCards[key].setSelected(state.selected && key === templateKey);
        });
        templateText.setText('身份：' + (state.template.label || '不变'));
        identityDescription.setText(identityDescriptions[templateKey] || identityDescriptions.normal);
        cardLayer.setVisible(!state.selected);
        editorLayer.setVisible(state.selected);
        syncToolButtonStyles();
        updateParamPanel();
      }`;
  if (!transformed.includes(marksMethod)) {
    throw new Error('无法定位旧 Face 伪装编辑器状态接口。');
  }
  transformed = transformed.replace(marksMethod, bridgeMethods);
  return transformed;
}

function transformGameDialogueScript(source: string) {
  let transformed = source.replace(/\r\n?/g, '\n');
  const advanceOn = "      if (scene.input.keyboard) {\n        scene.input.keyboard.on('keydown', handleKey);\n      }";
  const advanceOff = "        if (scene.input.keyboard) {\n          scene.input.keyboard.off('keydown', handleKey);\n        }";
  const typingOn = "          if (scene.input.keyboard) scene.input.keyboard.on('keydown', handleTypingKey);";
  const typingOff = "                if (scene.input.keyboard) scene.input.keyboard.off('keydown', handleTypingKey);";

  if (![advanceOn, advanceOff, typingOn, typingOff].every((marker) => transformed.includes(marker))) {
    throw new Error('无法定位旧 Face 对话键盘入口。');
  }

  transformed = transformed.replace(
    advanceOn,
    `${advanceOn}\n      global.addEventListener('keydown', handleKey, true);`,
  );
  transformed = transformed.replace(
    advanceOff,
    `${advanceOff}\n        global.removeEventListener('keydown', handleKey, true);`,
  );
  transformed = transformed.replace(
    typingOn,
    `${typingOn}\n          global.addEventListener('keydown', handleTypingKey, true);`,
  );
  transformed = transformed.replace(
    typingOff,
    `${typingOff}\n                global.removeEventListener('keydown', handleTypingKey, true);`,
  );
  return transformed;
}

function transformGameSimilarityScript(source: string) {
  let transformed = source.replace(/\r\n?/g, '\n');
  const marker = '      if (meter && meter.setValue) meter.setValue(correlationPercent);';
  if (!transformed.includes(marker)) {
    throw new Error('无法定位旧 Face 相似度更新入口。');
  }
  transformed = transformed.replace(
    marker,
    `${marker}\n      if (global.__FACE_REACT_BRIDGE__) global.__FACE_REACT_BRIDGE__.notify('game-similarity-updated');`,
  );
  return transformed;
}

function transformGameOpeningScript(source: string) {
  let transformed = source.replace(/\r\n?/g, '\n');
  const marker = '    fadeFromBlack: fadeFromBlack';
  if (!transformed.includes(marker)) {
    throw new Error('无法定位旧 Face 结局渲染入口。');
  }
  transformed = transformed.replace(
    marker,
    `${marker},\n    showCompletedOutcome: function (scene) { return showOutcomeTitle(scene, true); }`,
  );
  return transformed;
}

function transformAct3EntryScript(source: string) {
  let transformed = source.replace(/\r\n?/g, '\n');
  const marker = "  if (document.readyState === 'loading') {";
  if (!transformed.includes(marker)) {
    throw new Error('无法定位旧 Face 第三幕启动入口。');
  }
  transformed = transformed.replace(
    marker,
    `  game.entry = game.entry || {};\n  game.entry.startDirect = initAct3Game;\n  game.entry.prepare = prepareAct3Game;\n\n${marker}`,
  );
  return transformed;
}

function setVisibleStage(node: HTMLElement) {
  node.hidden = false;
  node.classList.remove('is-locked', 'is-revealing');
  node.setAttribute('aria-hidden', 'false');
  node.removeAttribute('inert');
}

interface FacePersistedQuestionState {
  selected_values?: string[];
  answer_fields?: Array<{ value?: unknown }>;
  correct?: boolean | null;
  submitted?: boolean;
  result?: unknown;
}

interface FacePersistedQuestionProps {
  persistenceKey: string;
  questionProps: Omit<QuestionProps, 'persistenceKey' | 'onCheck'>;
  onCheck: (result: QuestionCheckResult, meta: FaceQuestionCheckMeta) => void;
}

function FacePersistedQuestion({ persistenceKey, questionProps, onCheck }: FacePersistedQuestionProps) {
  const restorePendingRef = useRef(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    let active = true;
    void getTelemetryState<FacePersistedQuestionState>(`question:${persistenceKey}`).then((entry) => {
      if (!active) return;
      const state = entry?.state;
      const instant = questionProps.instant
        ?? (!questionProps.multiple && (questionProps.type === 'choice' || questionProps.type === 'judgement'));
      const wasSubmitted = state?.submitted
        ?? (entry?.event_name === 'answer_submit' || (instant && entry?.event_name === 'answer_select'));
      restorePendingRef.current = Boolean(
        state
          && (wasSubmitted
            || (state.correct !== null && state.correct !== undefined)),
      );
      setHydrated(true);
    });
    return () => { active = false; };
  }, [persistenceKey]);

  if (!hydrated) return (
    <div className={appendClassNames('dl-question', questionProps.className)} aria-busy="true" />
  );

  return (
    <Question
      {...questionProps}
      persistenceKey={persistenceKey}
      onCheck={(result) => {
        const source = restorePendingRef.current ? 'restore' : 'user';
        restorePendingRef.current = false;
        onCheck(result, { source });
      }}
    />
  );
}

class FaceLegacyRuntime {
  readonly staging: HTMLElement;
  readonly stages: Record<LegacyFaceStage, StageRecord>;
  readonly popover: HTMLElement;
  readonly initialGameMarkup: string;
  private callbacks: RuntimeCallbacks = {
    onSnapshot: () => undefined,
    onSemanticEvent: () => undefined,
  };
  private currentSnapshot: FaceRuntimeSnapshot;
  private legacyApi: LegacyFaceApi | null = null;
  private readyPromise: Promise<void> | null = null;
  private activeSessionId: string | null = null;
  private questionRoots = new Map<string, Root>();
  private completedSignals = new Set<string>();
  private pendingGameRestore: FaceGameSnapshot | null = null;
  private gameScene: LegacyGameScene | null = null;
  private restoringGame = false;
  private gameRestoreTimer: number | null = null;

  constructor(snapshot: FaceRuntimeSnapshot) {
    this.currentSnapshot = snapshot;
    const documentTree = new DOMParser().parseFromString(legacyHtml, 'text/html');
    const fixed = requiredElement(documentTree, '#faceAct1');
    const second = requiredElement(documentTree, '#faceAct2');
    const quiz = requiredElement(second, '#lenetQuizPanel');
    quiz.remove();
    const game = requiredElement(documentTree, '#faceAct3');
    game.querySelector('#act3RelatedVideos')?.remove();
    game.querySelector('nav.edu-resource-actions')?.remove();
    documentTree.querySelectorAll<HTMLElement>('.dl-button-hint').forEach((button) => {
      button.classList.add('edu-attention-hint');
    });
    const popover = requiredElement(documentTree, '#kernelPopover');
    const cue = requiredElement(documentTree, '#firstActContinueCue');
    const videoSource = game.querySelector<HTMLSourceElement>('#act3StartVideo source');
    if (videoSource) videoSource.src = `${FACE_ASSET_ROOT}yuhuanong_shouye.mp4`;
    const gameHost = requiredElement(game, '#act3GameScene');
    this.initialGameMarkup = gameHost.innerHTML;

    this.staging = document.createElement('div');
    this.staging.className = 'face-react-runtime-staging';
    this.staging.setAttribute('aria-hidden', 'true');
    Object.assign(this.staging.style, {
      position: 'fixed',
      left: '-200vw',
      top: '0',
      width: '1440px',
      minHeight: '900px',
      visibility: 'hidden',
      pointerEvents: 'none',
      overflow: 'hidden',
    });
    this.staging.append(fixed, cue, second, quiz, game);
    document.body.appendChild(this.staging);
    document.body.appendChild(popover);

    this.stages = {
      fixed: { node: fixed, currentHost: null },
      cnn: { node: second, currentHost: null },
      quiz: { node: quiz, currentHost: null },
      game: { node: game, currentHost: null },
    };
    this.popover = popover;
    this.installModuleUi();
    this.installRuntimeListeners();
  }

  update(snapshot: FaceRuntimeSnapshot, callbacks: RuntimeCallbacks) {
    this.currentSnapshot = snapshot;
    this.callbacks = callbacks;
    const bridgeWindow = window as LegacyBridgeWindow;
    if (bridgeWindow.__FACE_REACT_BRIDGE__) {
      bridgeWindow.__FACE_REACT_BRIDGE__.bootstrap = snapshot;
    }
  }

  ensureReady() {
    if (this.readyPromise) return this.readyPromise;
    const bridgeWindow = window as LegacyBridgeWindow;
    bridgeWindow.__FACE_REACT_BRIDGE__ = {
      bootstrap: this.currentSnapshot,
      registerLegacyApi: (api) => { this.legacyApi = api; },
      notify: (name, detail) => this.handleLegacySignal(name, detail),
    };
    this.readyPromise = this.loadScripts().then(() => {
      window.dispatchEvent(new Event('resize'));
    }).catch((error) => {
      console.error('[Face React] 旧运行时加载失败', error);
      throw error;
    });
    return this.readyPromise;
  }

  async activate(sessionId: string) {
    if (this.activeSessionId === sessionId) return this.ensureReady();

    this.activeSessionId = sessionId;
    this.completedSignals.clear();
    if (this.gameRestoreTimer !== null) {
      window.clearTimeout(this.gameRestoreTimer);
      this.gameRestoreTimer = null;
    }
    this.restoringGame = false;
    this.pendingGameRestore = null;
    await this.ensureReady();
    if (this.activeSessionId !== sessionId) return;

    this.resetGameRuntime();
    this.resetQuestionRuntime();
    this.legacyApi?.restore(this.currentSnapshot);
    (window as LegacyBridgeWindow).Act3DisguiseGame?.runtimeBridge?.restore?.(this.currentSnapshot.game);
    window.dispatchEvent(new Event('resize'));
    this.resumePersistedTraining();
  }

  deactivate(sessionId: string) {
    if (this.activeSessionId !== sessionId) return;
    this.activeSessionId = null;
    if (this.gameRestoreTimer !== null) {
      window.clearTimeout(this.gameRestoreTimer);
      this.gameRestoreTimer = null;
    }
    this.restoringGame = false;
    (window as LegacyBridgeWindow).__FACE_GAME_RESTORING__ = false;
    this.callbacks = {
      onSnapshot: () => undefined,
      onSemanticEvent: () => undefined,
    };
  }

  private resumePersistedTraining() {
    const fixedPhase = this.currentSnapshot.fixedKernel.training.phase;
    if (fixedPhase === 'starting' || fixedPhase === 'running') {
      const fixedError = '页面刷新中断了无任务 ID 的固定卷积核训练，请重新点击训练。';
      const next = normalizeFaceRuntimeSnapshot({
        ...this.currentSnapshot,
        fixedKernel: {
          ...this.currentSnapshot.fixedKernel,
          result: null,
          completed: false,
          training: {
            ...this.currentSnapshot.fixedKernel.training,
            phase: 'failed',
            completedAt: Date.now(),
            error: fixedError,
          },
        },
      });
      if (next) {
        this.publishSemantic('face_fixed_training_interrupted', next, {
          event_kind: 'observation',
          user_initiated: false,
        });
        this.legacyApi?.restore(next);
      }
    }

    const training = this.currentSnapshot.cnn.training;
    if (training.phase !== 'starting' && training.phase !== 'running') return;
    const currentSignature = faceArchitectureSignature(this.currentSnapshot.cnn.architecture);
    const jobId = training.jobId;
    if (!jobId || training.signature !== currentSignature) {
      const error = !jobId
        ? '刷新时未获得训练任务 ID，无法安全恢复；请重新点击训练。'
        : '训练任务对应的网络结构已变化，无法继续恢复；请重新点击训练。';
      const next = normalizeFaceRuntimeSnapshot({
        ...this.currentSnapshot,
        cnn: {
          ...this.currentSnapshot.cnn,
          result: null,
          completed: false,
          training: {
            ...training,
            phase: 'failed',
            completedAt: Date.now(),
            error,
          },
        },
      });
      if (next) {
        this.publishSemantic('face_cnn_training_resume_failed', next, {
          event_kind: 'observation',
          user_initiated: false,
          job_id: jobId,
        });
        this.legacyApi?.restore(next);
      }
      return;
    }

    void Promise.resolve(this.legacyApi?.resumeCnnJob(jobId)).catch((error) => {
      this.handleLegacySignal('cnn-failed', {
        source: 'restore',
        job_id: jobId,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }

  private resetQuestionRuntime() {
    this.questionRoots.forEach((root) => root.unmount());
    this.questionRoots.clear();
    this.legacyApi?.renderQuestions();
  }

  private resetGameRuntime() {
    const game = this.gameNamespace();
    const instance = game.instance;
    const host = this.stages.game.node.querySelector<HTMLElement>('#act3GameScene');
    if (!instance && host?.dataset.gameStarted !== 'true') return;

    instance?.destroy?.(true);
    game.instance = undefined;
    this.gameScene = null;
    this.pendingGameRestore = null;
    if (!host) return;
    host.innerHTML = this.initialGameMarkup;
    delete host.dataset.gameStarted;
    host.style.removeProperty('background-color');
    game.entry?.prepare?.();
  }

  attach(stage: LegacyFaceStage, host: HTMLElement) {
    const record = this.stages[stage];
    record.currentHost = host;
    setVisibleStage(record.node);
    host.appendChild(record.node);
    if (stage === 'cnn') this.legacyApi?.unlockSecond();
    if (stage === 'quiz') {
      record.node.hidden = false;
      record.node.setAttribute('aria-hidden', 'false');
      this.legacyApi?.showQuizStep(this.currentSnapshot.quiz.currentIndex, false);
    }
    if (stage === 'game') {
      this.legacyApi?.unlockThird();
      if (this.pendingGameRestore?.started) {
        requestAnimationFrame(() => {
          if (record.currentHost === host && this.pendingGameRestore?.started) this.startRestoredGame();
        });
      }
    }
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    return () => {
      if (record.currentHost !== host || !record.node.isConnected) return;
      record.currentHost = null;
      this.staging.appendChild(record.node);
    };
  }

  private async loadScripts() {
    await ensureClassicScript(threeScriptUrl, 'three-0.148');
    await ensureClassicScript(phaserScriptUrl, 'phaser-3.90');
    await ensureClassicScript(echartsScriptUrl, 'echarts-5.6');
    await ensureClassicScript(plotlyScriptUrl, 'plotly-3.6');
    await ensureClassicScript(plotUtilsScriptUrl, 'plot-utils');
    executeLegacyScript(transformLegacyScript(legacyScriptSource));

    for (const [key, url] of SCRIPT_SEQUENCE_AFTER_LEGACY) {
      await ensureClassicScript(url, key);
      if (key === 'face-game-movement') {
        executeInlineScript(transformGameDialogueScript(dialogueScriptSource), 'face-game-dialogue');
      }
      if (key === 'face-game-meter') {
        executeInlineScript(transformGameSimilarityScript(similarityScriptSource), 'face-game-similarity');
      }
      if (key === 'face-game-buttons') {
        executeInlineScript(transformGameEditorScript(editorScriptSource), 'face-game-editor');
      }
      if (key === 'face-game-constants') {
        const game = (window as LegacyBridgeWindow).Act3DisguiseGame;
        if (game?.constants) game.constants.ASSET_ROOT = FACE_ASSET_ROOT;
      }
    }
    executeInlineScript(transformGameOpeningScript(openingScriptSource), 'face-game-opening');
    this.installGameRuntimeBridge();
    await ensureClassicScript(act3SceneScriptUrl, 'face-game-scene');
    this.wrapGameFactory();
    executeInlineScript(transformAct3EntryScript(act3GameScriptSource), 'face-game-entry');
  }

  private gameNamespace() {
    const bridgeWindow = window as LegacyBridgeWindow;
    bridgeWindow.Act3DisguiseGame = bridgeWindow.Act3DisguiseGame ?? {};
    return bridgeWindow.Act3DisguiseGame;
  }

  private installGameRuntimeBridge() {
    const game = this.gameNamespace();
    const opening = game.cutscene?.opening;
    const originalOpening = opening?.startOpeningCutscene;
    const mutableOpening = opening as (typeof opening & { __faceReactWrapped?: boolean }) | undefined;
    if (mutableOpening && originalOpening && mutableOpening.__faceReactWrapped !== true) {
      mutableOpening.__faceReactWrapped = true;
      mutableOpening.startOpeningCutscene = (scene) => {
        const shouldRestore = game.runtimeBridge?.shouldRestore?.() === true;
        game.runtimeBridge?.onSceneReady?.(scene);
        if (shouldRestore) return Promise.resolve();
        return originalOpening(scene);
      };
    }

    game.runtimeBridge = {
      read: () => this.readGameSnapshot(),
      restore: (snapshot) => this.restoreGameSnapshot(snapshot),
      shouldRestore: () => Boolean(
        this.pendingGameRestore?.started
          && this.pendingGameRestore.checkpoint !== 'not_started'
      ),
      onSceneReady: (scene) => this.onGameSceneReady(scene),
    };
  }

  private wrapGameFactory() {
    const game = this.gameNamespace();
    const sceneApi = game.scene;
    const factory = sceneApi?.createPhaserScene;
    const mutableGame = game as typeof game & { __faceReactFactoryWrapped?: boolean };
    if (!sceneApi || !factory || mutableGame.__faceReactFactoryWrapped === true) return;
    mutableGame.__faceReactFactoryWrapped = true;
    sceneApi.createPhaserScene = (host) => {
      const instance = factory(host);
      game.instance = instance;
      return instance;
    };
  }

  private restoreGameSnapshot(snapshot: unknown) {
    const normalized = normalizeFaceRuntimeSnapshot({
      ...this.currentSnapshot,
      game: snapshot,
    });
    if (!normalized) return;
    this.pendingGameRestore = normalized.game;
    if (!normalized.game.started) return;
    this.startRestoredGame();
  }

  private startRestoredGame() {
    const bridgeWindow = window as LegacyBridgeWindow;
    this.restoringGame = true;
    bridgeWindow.__FACE_GAME_RESTORING__ = true;

    const existingScene = this.resolveGameScene();
    if (existingScene) {
      this.onGameSceneReady(existingScene);
      return;
    }

    const started = this.gameNamespace().entry?.startDirect?.() === true;
    if (!started) {
      this.restoringGame = false;
      bridgeWindow.__FACE_GAME_RESTORING__ = false;
      return;
    }
    if (this.gameRestoreTimer !== null) window.clearTimeout(this.gameRestoreTimer);
    this.gameRestoreTimer = window.setTimeout(() => {
      this.gameRestoreTimer = null;
      this.restoringGame = false;
      bridgeWindow.__FACE_GAME_RESTORING__ = false;
    }, 15_000);
  }

  private onGameSceneReady(scene: LegacyGameScene) {
    this.gameScene = scene;
    const pending = this.pendingGameRestore;
    if (pending?.started && pending.completed) this.applyCompletedGameSnapshot(scene, pending);
    else if (pending?.started) this.applyGameSnapshot(scene, pending);
    this.pendingGameRestore = null;
    this.restoringGame = false;
    const bridgeWindow = window as LegacyBridgeWindow;
    bridgeWindow.__FACE_GAME_RESTORING__ = false;
    if (this.gameRestoreTimer !== null) {
      window.clearTimeout(this.gameRestoreTimer);
      this.gameRestoreTimer = null;
    }
  }

  private resolveGameScene() {
    if (this.gameScene) return this.gameScene;
    const scene = this.gameNamespace().instance?.scene?.getScene?.('Act3Scene') ?? null;
    if (scene) this.gameScene = scene;
    return scene;
  }

  private applyGameSnapshot(scene: LegacyGameScene, snapshot: FaceGameSnapshot) {
    const checkpoint = snapshot.checkpoint === 'inspection_pending'
      ? 'editing'
      : snapshot.checkpoint;
    scene.__faceAttempts = snapshot.attempts;
    scene.__faceLastOutcome = snapshot.lastOutcome;
    scene.inspectionRunning = false;
    scene.dialogue?.hide?.();

    const x = snapshot.player.x;
    const y = snapshot.player.y;
    if (scene.player && x !== null && y !== null) {
      scene.player.setVelocity?.(0, 0);
      scene.player.setPosition?.(x, y);
      scene.player.body?.reset?.(x, y);
    }
    if (scene.player && snapshot.player.facing) {
      scene.playerFacing = snapshot.player.facing;
      scene.player.anims?.stop?.();
      scene.player.setFrame?.(`${snapshot.player.facing}-idle`);
    }

    scene.disguiseEditor?.restore?.({
      ...snapshot.editor,
      similarity: snapshot.similarity?.result ?? snapshot.similarity,
    });

    if (checkpoint === 'editing' || checkpoint === 'failed_retry') {
      scene.dresserQuestActive = false;
      scene.dresserTriggered = true;
      scene.cutsceneActive = true;
      scene.dresserTrigger?.setVisible?.(false);
      scene.disguiseEditor?.show?.();
      return;
    }

    scene.cutsceneActive = false;
    scene.dresserQuestActive = true;
    scene.dresserTriggered = false;
    scene.dresserTrigger?.setVisible?.(true);
  }

  private applyCompletedGameSnapshot(scene: LegacyGameScene, snapshot: FaceGameSnapshot) {
    if (scene.__faceCompletedOutcomeRestored === true) return;
    scene.__faceCompletedOutcomeRestored = true;
    scene.__faceAttempts = snapshot.attempts;
    scene.__faceLastOutcome = 'passed';
    scene.inspectionRunning = false;
    scene.dresserQuestActive = false;
    scene.dresserTriggered = true;
    scene.cutsceneActive = true;
    scene.player?.setVelocity?.(0, 0);
    scene.player?.anims?.stop?.();
    scene.dialogue?.hide?.();
    scene.disguiseEditor?.hide?.();
    scene.dresserTrigger?.setVisible?.(false);

    const showCompletedOutcome = this.gameNamespace().cutscene?.opening?.showCompletedOutcome;
    if (!showCompletedOutcome) return;
    void Promise.resolve(showCompletedOutcome(scene)).catch((error) => {
      console.warn('[Face React] 恢复第三幕完成画面失败', error);
    });
  }

  private readGameSnapshot() {
    const scene = this.resolveGameScene();
    if (!scene) return this.currentSnapshot.game;
    const editorSnapshot = scene.disguiseEditor?.snapshot?.() ?? {};
    const editorVisible = editorSnapshot.visible === true;
    let checkpoint = this.currentSnapshot.game.checkpoint;
    if (this.currentSnapshot.game.completed) checkpoint = 'completed';
    else if (scene.inspectionRunning === true) checkpoint = 'inspection_pending';
    else if (editorVisible) {
      checkpoint = this.currentSnapshot.game.lastOutcome === 'failed' ? 'failed_retry' : 'editing';
    } else if (scene.dresserQuestActive === true) checkpoint = 'dresser_quest';

    const rawSimilarity = editorSnapshot.similarity ?? scene.disguiseSimilarity;
    const similarity = rawSimilarity && typeof rawSimilarity === 'object'
      ? {
          revision: this.currentSnapshot.game.disguiseRevision,
          correlation: Number.isFinite(Number(rawSimilarity.correlation))
            ? Number(rawSimilarity.correlation)
            : null,
          similarityPercent: Number.isFinite(Number(rawSimilarity.similarity_percent ?? rawSimilarity.similarityPercent))
            ? Number(rawSimilarity.similarity_percent ?? rawSimilarity.similarityPercent)
            : null,
          result: rawSimilarity,
        }
      : this.currentSnapshot.game.similarity;

    return {
      ...this.currentSnapshot.game,
      checkpoint,
      started: true,
      attempts: Number.isFinite(Number(scene.__faceAttempts))
        ? Number(scene.__faceAttempts)
        : this.currentSnapshot.game.attempts,
      player: {
        x: Number.isFinite(Number(scene.player?.x)) ? Number(scene.player.x) : null,
        y: Number.isFinite(Number(scene.player?.y)) ? Number(scene.player.y) : null,
        facing: typeof scene.playerFacing === 'string' ? scene.playerFacing : null,
      },
      editor: {
        ...this.currentSnapshot.game.editor,
        ...editorSnapshot,
      },
      disguiseRevision: Array.isArray(editorSnapshot.markData)
        ? editorSnapshot.markData.length
        : this.currentSnapshot.game.disguiseRevision,
      similarity,
    };
  }

  private installModuleUi() {
    const bridgeWindow = window as LegacyBridgeWindow;
    const existing = bridgeWindow.DLModuleUI ?? {};
    bridgeWindow.DLModuleUI = {
      ...existing,
      mountQuestion: (target: string | Element, options: LegacyQuestionOptions) => (
        this.mountQuestion(target, options)
      ),
      bindSelectboxes: (root: ParentNode = document) => this.bindSelectboxes(root),
      bindSelectbox: (selectbox: Element) => this.bindSelectboxes(selectbox.parentNode ?? document),
      bindInputHints: (root: ParentNode = document) => this.bindInputHints(root),
      renderRelatedVideos: () => '',
      streamQuestionFeedback: (question: Element | null, tone: string, message: string) => {
        const feedback = question?.querySelector<HTMLElement>('.dl-question-feedback');
        if (!feedback) return;
        feedback.hidden = !message;
        feedback.textContent = message;
        feedback.dataset.status = tone;
      },
      requireServiceResult: (response: Response, data: Record<string, unknown>) => {
        if (!response.ok || data.ok === false) {
          throw new Error(String(data.error || data.message || `服务请求失败 (${response.status})`));
        }
        return data;
      },
      shortAnswerFeedback: (data: Record<string, unknown>) => ({
        level: data.level === 'correct' ? 'correct' : 'wrong',
        tone: data.tone === 'correct' || data.tone === 'hint' ? data.tone : 'wrong',
        message: String(data.message || data.feedback || '请再检查一下。'),
      }),
      friendlyErrorMessage: (error: unknown) => (
        error instanceof Error && error.message ? error.message : '服务暂时不可用，请稍后重试。'
      ),
    };
  }

  private bindSelectboxes(root: ParentNode) {
    const boxes = root instanceof Element && root.matches('[data-dl-selectbox]')
      ? [root]
      : Array.from(root.querySelectorAll<HTMLElement>('[data-dl-selectbox]'));
    boxes.forEach((box) => {
      const element = box as HTMLElement;
      if (element.dataset.faceSelectboxBound === 'true') return;
      element.dataset.faceSelectboxBound = 'true';
      const trigger = element.querySelector<HTMLButtonElement>('.edu-selectbox-trigger');
      const menu = element.querySelector<HTMLElement>('.edu-selectbox-menu');
      const hiddenInput = element.querySelector<HTMLInputElement>('input[type="hidden"]');
      const valueNode = element.querySelector<HTMLElement>('[data-selectbox-value]');
      trigger?.addEventListener('click', () => {
        if (!menu || trigger.disabled) return;
        menu.hidden = !menu.hidden;
        trigger.setAttribute('aria-expanded', menu.hidden ? 'false' : 'true');
      });
      menu?.querySelectorAll<HTMLButtonElement>('[role="option"]').forEach((option) => {
        option.addEventListener('click', () => {
          const value = option.dataset.value ?? option.textContent?.trim() ?? '';
          if (hiddenInput) {
            hiddenInput.value = value;
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
          if (valueNode) valueNode.textContent = option.textContent?.trim() ?? value;
          menu.querySelectorAll('[role="option"]').forEach((candidate) => {
            candidate.setAttribute('aria-selected', candidate === option ? 'true' : 'false');
          });
          menu.hidden = true;
          trigger?.setAttribute('aria-expanded', 'false');
        });
      });
    });
  }

  private bindInputHints(root: ParentNode) {
    const hinted = root instanceof Element && root.matches('[data-dl-button-hint], .dl-button-hint')
      ? [root]
      : Array.from(root.querySelectorAll<HTMLElement>('[data-dl-button-hint], .dl-button-hint'));
    hinted.forEach((node) => {
      const element = node as HTMLElement;
      if (element.dataset.faceHintBound === 'true') return;
      element.dataset.faceHintBound = 'true';
      element.classList.add('edu-attention-hint');
      const dismiss = () => {
        element.classList.remove('edu-attention-hint');
        element.dataset.faceHintDismissed = 'true';
      };
      element.addEventListener('click', dismiss, { once: true });
      element.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        dismiss();
      });
    });
  }


  private mountQuestion(target: string | Element, options: LegacyQuestionOptions) {
    const host = typeof target === 'string'
      ? document.querySelector<HTMLElement>(target)
      : target instanceof HTMLElement ? target : null;
    if (!host || !host.id) return null;
    let root = this.questionRoots.get(host.id);
    if (!root) {
      root = createRoot(host);
      this.questionRoots.set(host.id, root);
    }
    const questionId = host.id as FaceQuizId;
    if (questionId === 'quizFaceVerification') {
      root.render(
        <PersistedFaceShortAnswerQuestion
          persistenceKey={`face-recog-${questionId}`}
          title={options.title ?? ''}
          rows={options.rows}
          submitText={options.submitText}
          onCheck={(result, meta) => this.handleQuestionResult(questionId, result, meta)}
        />,
      );
      return { host };
    }

    const props: Omit<QuestionProps, 'persistenceKey' | 'onCheck'> = {
      type: options.type,
      title: options.title ?? '',
      options: options.options,
      answer: options.answer,
      multiple: options.multiple,
      blanks: options.blanks?.map(({ label, placeholder }) => ({ label, placeholder })),
      rows: options.rows,
      typeLabel: options.typeLabel,
      submitText: options.submitText,
      feedback: options.feedback,
      instant: options.instant,
      className: options.className,
    };
    root.render(
      <FacePersistedQuestion
        persistenceKey={`face-recog-${questionId}`}
        questionProps={props}
        onCheck={(result, meta) => this.handleQuestionResult(questionId, result, meta)}
      />,
    );
    return { host };
  }

  private handleQuestionResult(
    id: FaceQuizId,
    result: QuestionCheckResult,
    meta: FaceQuestionCheckMeta,
  ) {
    const userInitiated = meta.source === 'user';
    const answer = Array.isArray(result.answer) ? result.answer.map(String) : [];
    const previousAnswer = this.currentSnapshot.quiz.answers[id];
    const previousAnswerValues = Array.isArray(previousAnswer?.answer)
      ? previousAnswer.answer.map(String)
      : [];
    const resolvedAnswer = meta.source === 'restore' && answer.length === 0
      ? previousAnswerValues
      : answer;
    const previousOk = this.currentSnapshot.quiz.results[id] === true;
    const resolvedOk = meta.source === 'restore' && previousOk ? true : result.ok;
    const canAdvance = id === 'quizFaceVerification'
      ? !result.empty && resolvedAnswer.some((item) => item.trim())
      : resolvedOk;
    const completedIds = this.currentSnapshot.quiz.completedIds.includes(id)
      ? [...this.currentSnapshot.quiz.completedIds]
      : canAdvance
        ? [...this.currentSnapshot.quiz.completedIds, id]
        : [...this.currentSnapshot.quiz.completedIds];
    const resultMap = { ...this.currentSnapshot.quiz.results, [id]: resolvedOk };
    const index = FACE_QUIZ_IDS.indexOf(id);
    const candidateNextIndex = canAdvance ? Math.min(FACE_QUIZ_IDS.length - 1, index + 1) : index;
    const nextIndex = Math.max(this.currentSnapshot.quiz.currentIndex, candidateNextIndex);
    const completed = completedIds.length === FACE_QUIZ_IDS.length;
    const next = normalizeFaceRuntimeSnapshot({
      ...this.currentSnapshot,
      unlockedAct: id === 'quizFaceVerification' && canAdvance ? 3 : this.currentSnapshot.unlockedAct,
      quiz: {
        ...this.currentSnapshot.quiz,
        currentIndex: nextIndex,
        completedIds,
        results: resultMap,
        answers: {
          ...this.currentSnapshot.quiz.answers,
          [id]: {
            answer: resolvedAnswer,
            correct: resolvedOk,
            submitted: true,
            feedback: typeof result.message === 'string'
              ? result.message
              : previousAnswer?.feedback ?? null,
            submissionId: previousAnswer?.submissionId ?? null,
            reviewStatus: meta.source === 'restore' && previousAnswer?.reviewStatus
              ? previousAnswer.reviewStatus
              : id === 'quizFaceVerification'
                ? (result.tone === 'wrong' ? 'failed' : 'complete')
                : 'complete',
          },
        },
        act3Unlocked: id === 'quizFaceVerification' && canAdvance
          ? true
          : this.currentSnapshot.quiz.act3Unlocked,
        completed,
      },
    }) ?? this.currentSnapshot;
    this.publishSemantic(
      'face_quiz_snapshot_reconciled',
      next,
      {
        event_kind: 'observation',
        user_initiated: false,
        source: meta.source,
        question_id: id,
      },
    );
    this.legacyApi?.setQuizResult(id, resolvedOk);

    if (!canAdvance) return;
    if (id === 'quizFaceVerification') {
      this.legacyApi?.unlockThird();
      if (!userInitiated) return;
      const dispatch = () => window.dispatchEvent(new CustomEvent(QUIZ_COMPLETE_EVENT, {
        detail: { restored: false },
      }));
      window.setTimeout(dispatch, 620);
      return;
    }
    const showNext = () => this.legacyApi?.showQuizStep(nextIndex, userInitiated);
    window.setTimeout(showNext, userInitiated ? 620 : 0);
  }

  private installRuntimeListeners() {
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>('button');
      if (!button) return;
      if (button.id === 'act3GameStartBtn' && this.restoringGame) return;
      const eventById: Record<string, string> = {
        trainBtn: FACE_ACTIVITY_EVENTS.fixedTrainingStarted,
        lenetTrainBtn: FACE_ACTIVITY_EVENTS.cnnTrainingStarted,
        resetKernelsBtn: FACE_ACTIVITY_EVENTS.kernelsReset,
        prevSampleBtn: FACE_ACTIVITY_EVENTS.sampleChanged,
        nextSampleBtn: FACE_ACTIVITY_EVENTS.sampleChanged,
        archApplyBtn: FACE_ACTIVITY_EVENTS.architectureLayerUpdated,
        archDeleteBtn: FACE_ACTIVITY_EVENTS.architectureLayerDeleted,
        archLeftBtn: FACE_ACTIVITY_EVENTS.architectureLayerReordered,
        archRightBtn: FACE_ACTIVITY_EVENTS.architectureLayerReordered,
        archPresetBtn: FACE_ACTIVITY_EVENTS.architectureReset,
        act3GameStartBtn: FACE_ACTIVITY_EVENTS.gameStarted,
      };
      const eventName = eventById[button.id];
      if (!eventName) return;
      const startedAt = Date.now();
      queueMicrotask(() => {
        let next = this.prepareClickSnapshot(button.id, this.captureSnapshot(), startedAt);
        if (button.id === 'act3GameStartBtn') {
          next = normalizeFaceRuntimeSnapshot({
            ...next,
            unlockedAct: 3,
            game: {
              ...next.game,
              checkpoint: next.game.checkpoint === 'not_started' ? 'dresser_quest' : next.game.checkpoint,
              started: true,
            },
          }) ?? next;
        }
        this.publishSemantic(eventName, next, { control_id: button.id });
      });
    }, true);

    document.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('#kernelPalette')) {
        queueMicrotask(() => this.publishSemantic(
          FACE_ACTIVITY_EVENTS.kernelToggled,
          this.captureSnapshot(),
          { control_id: 'kernelPalette' },
        ));
        return;
      }
      if (target.matches('#archKindSelect, #archPoolTypeSelect, #archChannelSlider')) {
        queueMicrotask(() => this.publishSemantic(
          'face_arch_editor_changed',
          this.captureSnapshot(),
          { control_id: (target as HTMLElement).id },
        ));
      }
    }, true);

    document.addEventListener('drop', (event) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest('#archSequence')) return;
      window.setTimeout(() => this.publishSemantic(
        'face_architecture_dropped',
        this.withResetCnnTraining(this.captureSnapshot()),
        { control_id: 'archSequence' },
      ), 0);
    }, true);

    document.addEventListener('pointerup', (event) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest('#faceAct3')) return;
      if (target.closest('#act3GameStartBtn')) return;
      window.setTimeout(() => {
        if (this.restoringGame) return;
        const next = this.captureSnapshot();
        if (!next.game.started || next.game.completed || next.game.checkpoint === 'inspection_pending') return;
        const editorChanged = JSON.stringify(next.game.editor) !== JSON.stringify(this.currentSnapshot.game.editor);
        if (!editorChanged) return;
        this.publishSemantic('face_disguise_changed', next, {
          control_id: 'disguise-editor',
          disguise_revision: next.game.disguiseRevision,
        });
      }, 0);
    }, true);

    document.addEventListener('keyup', (event) => {
      const key = event.key.toLowerCase();
      if (['1', '2', '3', '4', '5'].includes(key)) {
        window.setTimeout(() => {
          if (this.restoringGame) return;
          const next = this.captureSnapshot();
          if (!next.game.started || next.game.completed) return;
          const editorChanged = JSON.stringify(next.game.editor) !== JSON.stringify(this.currentSnapshot.game.editor);
          if (!editorChanged) return;
          this.publishSemantic('face_disguise_tool_changed', next, {
            control_id: 'disguise-tool-key',
            key,
          });
        }, 0);
        return;
      }
      if (!['w', 'a', 's', 'd'].includes(key)) return;
      window.requestAnimationFrame(() => {
        if (this.restoringGame) return;
        const next = this.captureSnapshot();
        if (!next.game.started || next.game.completed) return;
        const playerChanged = JSON.stringify(next.game.player) !== JSON.stringify(this.currentSnapshot.game.player);
        if (!playerChanged) return;
        this.publishSemantic('face_game_player_moved', next, {
          key,
        });
      });
    }, true);

    window.addEventListener(GAME_COMPLETE_EVENT, () => {
      if (this.completedSignals.has(GAME_COMPLETE_EVENT)) return;
      this.completedSignals.add(GAME_COMPLETE_EVENT);
      const captured = this.captureSnapshot();
      const next = normalizeFaceRuntimeSnapshot({
        ...captured,
        unlockedAct: 3,
        game: {
          ...captured.game,
          checkpoint: 'completed',
          started: true,
          lastOutcome: 'passed',
          completed: true,
        },
        moduleCompleted: true,
      }) ?? this.currentSnapshot;
      this.publishSemantic(FACE_ACTIVITY_EVENTS.moduleCompleted, next, {
        checkpoint: 'completed',
        event_kind: 'observation',
        user_initiated: false,
      });
    });
  }

  private handleLegacySignal(name: string, detail: Record<string, unknown> = {}) {
    if (name === 'fixed-failed') {
      const error = typeof detail.error === 'string' ? detail.error : '固定卷积核训练失败。';
      const next = normalizeFaceRuntimeSnapshot({
        ...this.currentSnapshot,
        fixedKernel: {
          ...this.currentSnapshot.fixedKernel,
          result: null,
          completed: false,
          training: {
            ...this.currentSnapshot.fixedKernel.training,
            phase: 'failed',
            completedAt: Date.now(),
            error,
          },
        },
      }) ?? this.currentSnapshot;
      this.publishSemantic('face_fixed_training_failed', next, {
        event_kind: 'observation',
        user_initiated: false,
        error,
      });
      return;
    }
    if (name === 'cnn-job-created') {
      const jobId = typeof detail.job_id === 'string' ? detail.job_id : null;
      if (!jobId) return;
      const currentTraining = this.currentSnapshot.cnn.training;
      const next = normalizeFaceRuntimeSnapshot({
        ...this.currentSnapshot,
        cnn: {
          ...this.currentSnapshot.cnn,
          result: null,
          completed: false,
          training: {
            ...currentTraining,
            phase: 'running',
            requestId: currentTraining.requestId ?? `face-cnn-${Date.now()}`,
            jobId,
            signature: currentTraining.signature
              ?? faceArchitectureSignature(this.currentSnapshot.cnn.architecture),
            startedAt: currentTraining.startedAt ?? Date.now(),
            completedAt: null,
            error: null,
          },
        },
      }) ?? this.currentSnapshot;
      this.publishSemantic('face_cnn_training_job_created', next, {
        event_kind: 'observation',
        user_initiated: false,
        job_id: jobId,
      });
      return;
    }
    if (name === 'cnn-failed') {
      const jobId = typeof detail.job_id === 'string'
        ? detail.job_id
        : this.currentSnapshot.cnn.training.jobId;
      const error = typeof detail.error === 'string' ? detail.error : 'CNN 训练失败。';
      const next = normalizeFaceRuntimeSnapshot({
        ...this.currentSnapshot,
        cnn: {
          ...this.currentSnapshot.cnn,
          result: null,
          completed: false,
          training: {
            ...this.currentSnapshot.cnn.training,
            phase: 'failed',
            jobId,
            completedAt: Date.now(),
            error,
          },
        },
      }) ?? this.currentSnapshot;
      this.publishSemantic('face_cnn_training_failed', next, {
        event_kind: 'observation',
        user_initiated: false,
        job_id: jobId,
        error,
      });
      return;
    }
    if (name === 'game-similarity-updated') {
      if (this.restoringGame) return;
      const next = this.captureSnapshot();
      if (JSON.stringify(next.game.similarity) === JSON.stringify(this.currentSnapshot.game.similarity)) return;
      this.publishSemantic('face_disguise_similarity_updated', next, {
        event_kind: 'observation',
        user_initiated: false,
        disguise_revision: next.game.disguiseRevision,
      });
      return;
    }
    if (name === 'game-editing') {
      const captured = this.captureSnapshot();
      const retrying = this.currentSnapshot.game.checkpoint === 'inspection_pending';
      const next = normalizeFaceRuntimeSnapshot({
        ...captured,
        unlockedAct: 3,
        game: {
          ...captured.game,
          checkpoint: retrying ? 'failed_retry' : 'editing',
          started: true,
          lastOutcome: retrying ? 'failed' : captured.game.lastOutcome,
        },
      }) ?? captured;
      this.publishSemantic(
        retrying ? 'face_disguise_retry_started' : 'face_disguise_editor_opened',
        next,
        { checkpoint: next.game.checkpoint },
      );
      return;
    }
    if (name === 'game-inspection-pending') {
      const captured = this.captureSnapshot();
      const attempts = Math.max(captured.game.attempts, this.currentSnapshot.game.attempts) + 1;
      const scene = this.resolveGameScene();
      if (scene) scene.__faceAttempts = attempts;
      const next = normalizeFaceRuntimeSnapshot({
        ...captured,
        unlockedAct: 3,
        game: {
          ...captured.game,
          checkpoint: 'inspection_pending',
          started: true,
          attempts,
        },
      }) ?? captured;
      this.publishSemantic(FACE_ACTIVITY_EVENTS.disguiseSubmitted, next, {
        attempt: attempts,
        disguise_revision: next.game.disguiseRevision,
      });
      return;
    }
    if (name !== 'fixed-complete' && name !== 'cnn-complete') return;
    const completionKey = name === 'cnn-complete'
      ? `${name}:${this.currentSnapshot.cnn.training.requestId
        ?? (typeof detail.job_id === 'string' ? detail.job_id : this.currentSnapshot.cnn.training.jobId)
        ?? 'legacy'}`
      : name;
    if (this.completedSignals.has(completionKey)) return;
    this.completedSignals.add(completionKey);
    if (name === 'fixed-complete') {
      const captured = this.captureSnapshot();
      const next = normalizeFaceRuntimeSnapshot({
        ...captured,
        fixedKernel: {
          ...captured.fixedKernel,
          completed: true,
          training: { ...captured.fixedKernel.training, phase: 'complete', completedAt: Date.now() },
        },
      }) ?? captured;
      this.publishSemantic('face_fixed_training_completed', next, {
        event_kind: 'observation',
        user_initiated: false,
      });
      window.dispatchEvent(new CustomEvent(FIXED_COMPLETE_EVENT));
      return;
    }
    if (name === 'cnn-complete') {
      const captured = this.captureSnapshot();
      const next = normalizeFaceRuntimeSnapshot({
        ...captured,
        cnn: {
          ...captured.cnn,
          completed: true,
          training: {
            ...captured.cnn.training,
            phase: 'complete',
            jobId: typeof detail.job_id === 'string'
              ? detail.job_id
              : captured.cnn.training.jobId,
            completedAt: Date.now(),
            error: null,
          },
        },
      }) ?? captured;
      this.publishSemantic('face_cnn_training_completed', next, {
        event_kind: 'observation',
        user_initiated: false,
        job_id: next.cnn.training.jobId,
      });
      window.dispatchEvent(new CustomEvent(CNN_COMPLETE_EVENT));
    }
  }

  private prepareClickSnapshot(
    buttonId: string,
    snapshot: FaceRuntimeSnapshot,
    startedAt: number,
  ) {
    let next = snapshot;
    if (buttonId === 'trainBtn') {
      this.completedSignals.delete('fixed-complete');
      next = normalizeFaceRuntimeSnapshot({
        ...next,
        fixedKernel: {
          ...next.fixedKernel,
          result: null,
          completed: false,
          training: {
            phase: 'starting',
            requestId: `face-fixed-${startedAt}`,
            jobId: null,
            signature: faceKernelSignature(next.fixedKernel.selectedKernels),
            startedAt,
            completedAt: null,
            error: null,
          },
        },
      }) ?? next;
    }
    if (buttonId === 'lenetTrainBtn') {
      for (const key of [...this.completedSignals]) {
        if (key.startsWith('cnn-complete')) this.completedSignals.delete(key);
      }
      next = normalizeFaceRuntimeSnapshot({
        ...next,
        cnn: {
          ...next.cnn,
          result: null,
          completed: false,
          training: {
            phase: 'starting',
            requestId: `face-cnn-${startedAt}`,
            jobId: null,
            signature: faceArchitectureSignature(next.cnn.architecture),
            startedAt,
            completedAt: null,
            error: null,
          },
        },
      }) ?? next;
    }
    if (buttonId.startsWith('arch')) {
      next = this.withResetCnnTraining(next);
    }
    return next;
  }

  private withResetCnnTraining(snapshot: FaceRuntimeSnapshot) {
    return normalizeFaceRuntimeSnapshot({
      ...snapshot,
      cnn: {
        ...snapshot.cnn,
        result: null,
        completed: false,
        training: {
          phase: 'idle',
          requestId: null,
          jobId: null,
          signature: faceArchitectureSignature(snapshot.cnn.architecture),
          startedAt: null,
          completedAt: null,
          error: null,
        },
      },
    }) ?? snapshot;
  }

  private captureSnapshot() {
    const legacy = this.legacyApi?.getState();
    if (!legacy) return this.currentSnapshot;
    const hasCnnResult = legacy.lenetResult !== null && legacy.lenetResult !== undefined;
    const fixedResult = hasCnnResult
      ? this.currentSnapshot.fixedKernel.result
      : legacy.result === undefined
        ? this.currentSnapshot.fixedKernel.result
        : legacy.result;
    const gameState = (window as LegacyBridgeWindow).Act3DisguiseGame?.runtimeBridge?.read?.();
    return normalizeFaceRuntimeSnapshot({
      ...this.currentSnapshot,
      unlockedAct: legacy.unlockedAct ?? this.currentSnapshot.unlockedAct,
      fixedKernel: {
        ...this.currentSnapshot.fixedKernel,
        selectedKernels: legacy.selectedKernels ?? this.currentSnapshot.fixedKernel.selectedKernels,
        activeFeatureKernel: legacy.activeFeatureKernel ?? this.currentSnapshot.fixedKernel.activeFeatureKernel,
        sampleIndex: legacy.sampleIndex ?? this.currentSnapshot.fixedKernel.sampleIndex,
        previewSampleIndex: legacy.previewSampleIndex ?? this.currentSnapshot.fixedKernel.previewSampleIndex,
        preview: hasCnnResult ? this.currentSnapshot.fixedKernel.preview : legacy.preview,
        result: fixedResult,
        completed: fixedResult !== null && fixedResult !== undefined,
      },
      cnn: {
        ...this.currentSnapshot.cnn,
        architecture: legacy.architecture ?? this.currentSnapshot.cnn.architecture,
        selectedLayerIndex: legacy.archSelectedIndex ?? this.currentSnapshot.cnn.selectedLayerIndex,
        editor: legacy.archEditor ?? this.currentSnapshot.cnn.editor,
        epochs: legacy.lenetEpochs ?? this.currentSnapshot.cnn.epochs,
        result: legacy.lenetTraining === true
          ? null
          : legacy.lenetResult ?? this.currentSnapshot.cnn.result,
        completed: legacy.lenetTraining !== true
          && (legacy.lenetTrainingComplete === true || hasCnnResult || this.currentSnapshot.cnn.completed),
        training: {
          ...this.currentSnapshot.cnn.training,
          phase: legacy.lenetTraining === true
            ? (legacy.lenetJobId ? 'running' : 'starting')
            : legacy.lenetTrainingComplete === true || hasCnnResult
              ? 'complete'
              : this.currentSnapshot.cnn.training.phase,
          jobId: legacy.lenetJobId ?? this.currentSnapshot.cnn.training.jobId,
          signature: this.currentSnapshot.cnn.training.signature
            ?? faceArchitectureSignature(
              (legacy.architecture as FaceRuntimeSnapshot['cnn']['architecture'] | undefined)
                ?? this.currentSnapshot.cnn.architecture,
            ),
        },
      },
      quiz: {
        ...this.currentSnapshot.quiz,
        results: { ...this.currentSnapshot.quiz.results, ...(legacy.quizResults ?? {}) },
      },
      game: gameState && typeof gameState === 'object'
        ? { ...this.currentSnapshot.game, ...(gameState as Record<string, unknown>) }
        : this.currentSnapshot.game,
    }) ?? this.currentSnapshot;
  }

  private publishDraft(next: FaceRuntimeSnapshot) {
    this.currentSnapshot = next;
    this.callbacks.onSnapshot(next);
  }

  private publishSemantic(
    eventName: string,
    next: FaceRuntimeSnapshot,
    properties: Record<string, unknown> = {},
  ) {
    this.currentSnapshot = next;
    this.callbacks.onSemanticEvent(eventName, next, properties);
  }
}

let singleton: FaceLegacyRuntime | null = null;
let runtimeSessionSequence = 0;

function getFaceLegacyRuntime(snapshot: FaceRuntimeSnapshot) {
  if (!singleton) singleton = new FaceLegacyRuntime(snapshot);
  return singleton;
}

const FaceLegacyRuntimeContext = createContext<FaceLegacyRuntime | null>(null);

export function FaceLegacyRuntimeProvider({
  snapshot,
  onSnapshot,
  onSemanticEvent,
  children,
}: FaceLegacyRuntimeProviderProps) {
  const runtimeRef = useRef<FaceLegacyRuntime | null>(null);
  const sessionIdRef = useRef('');
  if (!runtimeRef.current) runtimeRef.current = getFaceLegacyRuntime(snapshot);
  if (!sessionIdRef.current) {
    runtimeSessionSequence += 1;
    sessionIdRef.current = `face-runtime-${runtimeSessionSequence}`;
  }
  const runtime = runtimeRef.current;
  const [loadError, setLoadError] = useState<string | null>(null);
  runtime.update(snapshot, { onSnapshot, onSemanticEvent });

  useEffect(() => {
    let active = true;
    const sessionId = sessionIdRef.current;
    void runtime.activate(sessionId).catch((error) => {
      if (!active) return;
      setLoadError(error instanceof Error ? error.message : '旧运行时加载失败。');
    });
    return () => {
      active = false;
      runtime.deactivate(sessionId);
    };
  }, [runtime]);

  return (
    <FaceLegacyRuntimeContext.Provider value={runtime}>
      {loadError && (
        <div className="edu-callout edu-callout--red" role="alert">
          旧交互资源加载失败：{loadError}
        </div>
      )}
      {children}
    </FaceLegacyRuntimeContext.Provider>
  );
}

export function LegacyStageHost({ stage, className }: LegacyStageHostProps) {
  const runtime = useContext(FaceLegacyRuntimeContext);
  const hostRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!runtime || !hostRef.current) return undefined;
    return runtime.attach(stage, hostRef.current);
  }, [runtime, stage]);

  return (
    <div
      ref={hostRef}
      className={appendClassNames('face-react-stage-host', className)}
      data-legacy-stage={stage}
    />
  );
}

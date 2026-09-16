(function () {
  'use strict';

  var SERVICE_URL = 'http://127.0.0.1:59415/face-recog/fixed-kernel-train';
  var PREVIEW_URL = 'http://127.0.0.1:59415/face-recog/fixed-kernel-preview';
  var LENET_URL = 'http://127.0.0.1:59415/face-recog/lenet-train';
  var LENET_STATUS_URL = 'http://127.0.0.1:59415/face-recog/lenet-train-status';
  var FACE_VERIFICATION_FEEDBACK_URL = 'http://127.0.0.1:59414/face/verification-feedback';
  var DEMO_FACE_IMAGE_URLS = [
    'http://127.0.0.1:59415/face-recog/demo-image',
    '../../dataset/face_demo.png',
  ];
  var IMAGE_HEIGHT = 62;
  var IMAGE_WIDTH = 47;
  var FEATURE_GRID_SIZE = 4;
  var FEATURE_RESPONSE_HEIGHT = IMAGE_HEIGHT - 2;
  var FEATURE_RESPONSE_WIDTH = IMAGE_WIDTH - 2;
  var FEATURE_MAP_DESCRIPTION = FEATURE_RESPONSE_HEIGHT + 'x' + FEATURE_RESPONSE_WIDTH
    + ' convolution responses pooled to ' + FEATURE_GRID_SIZE + 'x' + FEATURE_GRID_SIZE;
  var PICKER_ROW_HEIGHT = 28;
  var FEATURE_DRAG_STEP = 52;
  var FACE_CLASS_COUNT = 12;
  var LENET_DEFAULT_EPOCHS = 50;
  var FACE_QUIZ_IDS = [
    'quizKernelDepth',
    'quizRgbDepth',
    'quizKernelCount',
    'quizValAccuracy',
    'quizFaceVerification',
  ];
  var CONV_CHANNEL_PRESETS = [8, 12, 16, 24, 32, 36, 48, 64];
  var FEATURE_MAP_PRECOMPUTED_FRAMES = 12;
  var MORANDI = {
    charcoal: 0x14191a,
    deck: 0x202729,
    deckLine: 0x69706d,
    ivory: 0xd6d0bd,
    sand: 0xb8ad95,
    clay: 0xa58e7b,
    sage: 0x899786,
    moss: 0x707d70,
    blueGray: 0x8b9b9d,
    slate: 0x778386,
    stone: 0xa5a59a,
    pool: 0x5f8f68,
    poolDark: 0x142419,
    poolEdge: 0xc7ddc6,
    activation: 0x566061,
    accent: 0xc9b892,
  };
  var archLayerSeq = 0;
  var KERNELS = [
    { id: 'edge', name: '边缘', values: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]] },
    { id: 'vertical', name: '竖边', values: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]] },
    { id: 'horizontal', name: '横边', values: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]] },
    { id: 'diag_down', name: '斜边 /', values: [[0, 1, 2], [-1, 0, 1], [-2, -1, 0]] },
    { id: 'diag_up', name: '斜边 \\', values: [[2, 1, 0], [1, 0, -1], [0, -1, -2]] },
    { id: 'center', name: '中心纹理', values: [[0, 1, 0], [1, 4, 1], [0, 1, 0]] },
  ];
  var state = {
    result: null,
    lenetResult: null,
    preview: null,
    sampleIndex: 0,
    selectedKernels: KERNELS.map(function (kernel) { return kernel.id; }),
    activeFeatureKernel: 'edge',
    unlockedAct: 1,
    architecture: [],
    archDrag: null,
    archSelectedIndex: -1,
    arch3d: null,
    lenetEpochs: LENET_DEFAULT_EPOCHS,
    training: false,
    lenetTraining: false,
    lenetTrainingComplete: false,
    lenetChart: null,
    previewSampleIndex: 280,
    previewTimer: 0,
    previewLoading: false,
    previewQueued: false,
    classifierPulseTimer: 0,
    classifierPulse: [],
    featureDeckDragging: false,
    featureDeckMoved: false,
    featureDeckStartY: 0,
    featureDeckStartIndex: 0,
    featurePickerDragging: false,
    featurePickerMoved: false,
    featurePickerStartY: 0,
    featurePickerStartIndex: 0,
    featureSwitchTimer: 0,
    featureDrawRaf: 0,
    demoFaceImage: null,
    demoFaceImageLoading: false,
    quizResults: {},
    quizAdvancing: false,
  };

  function $(id) {
    return document.getElementById(id);
  }

  function formatPercent(value) {
    if (!Number.isFinite(Number(value))) return '-';
    return (Number(value) * 100).toFixed(1) + '%';
  }

  function kernelById(id) {
    return KERNELS.find(function (kernel) { return kernel.id === id; }) || KERNELS[0];
  }

  function selectedKernelSignature() {
    return state.selectedKernels.join('|');
  }

  function classCount() {
    return state.result && state.result.classifier && Number(state.result.classifier.class_count)
      ? Number(state.result.classifier.class_count)
      : FACE_CLASS_COUNT;
  }

  function identityLabel(index) {
    return 'ID ' + String(index).padStart(2, '0');
  }

  function displayIdentity(index, name) {
    if (name) return String(name);
    return identityLabel(index);
  }

  function currentSource() {
    return state.result || state.preview;
  }

  function currentSample() {
    var source = currentSource();
    if (!source || !source.samples || !source.samples.length) return null;
    return source.samples[state.sampleIndex] || source.samples[0];
  }

  function featureMapIds(sample) {
    return sample && sample.feature_maps
      ? Object.keys(sample.feature_maps)
      : state.selectedKernels.slice();
  }

  function activeFeatureIndex(ids) {
    return Math.max(0, ids.indexOf(state.activeFeatureKernel));
  }

  function setReadout(text, useRed) {
    var readout = $('readout');
    if (!readout) return;
    readout.textContent = text;
    readout.className = 'edu-notice-strip ' + (useRed ? 'edu-notice-strip--red' : 'edu-notice-strip--blue');
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function updateLenetProgressUi(job) {
    var progress = clamp(Math.round(Number(job && job.progress) || 0), 0, 100);
    var phase = job && job.phase ? String(job.phase) : '训练准备中';
    var status = $('lenetStatus');
    var isPreparing = phase === '训练准备中' || phase === '训练准备阶段';
    if (status) status.textContent = isPreparing ? '训练准备中...' : phase + ' ' + progress + '%';
  }

  async function pollLenetTrainingJob(jobId) {
    var lastDisplayKey = '';
    while (true) {
      await delay(420);
      var response = await fetch(LENET_STATUS_URL + '?job_id=' + encodeURIComponent(jobId), {
        method: 'GET',
        cache: 'no-store',
      });
      var data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || '训练进度查询失败。');
      var job = data.result || {};
      var progress = Math.round(Number(job.progress) || 0);
      var displayKey = [job.status, job.phase, progress, job.message].join('|');
      if (displayKey !== lastDisplayKey) {
        updateLenetProgressUi(job);
        lastDisplayKey = displayKey;
      }
      if (job.status === 'complete') return job.result;
      if (job.status === 'error') throw new Error(job.error || job.message || 'CNN 训练失败。');
    }
  }

  function renderMetric(metricId, readoutId, value, passAt) {
    var metric = $(metricId);
    var readout = $(readoutId);
    var hasValue = value !== null && value !== undefined && Number.isFinite(Number(value));
    if (readout) readout.textContent = hasValue ? formatPercent(value) : '-';
    if (metric) {
      metric.classList.toggle('is-success', hasValue && Number(value) >= passAt);
      metric.classList.toggle('is-warning', hasValue && Number(value) < passAt);
    }
  }

  function renderValidationMetric(value) {
    renderMetric('valAccMetric', 'valAcc', value, 0.9);
  }

  function renderLenetValidationMetric(value) {
    renderMetric('lenetValAccMetric', 'lenetValAcc', value, 0.5);
  }

  function makeArchLayer(kind, options) {
    archLayerSeq += 1;
    options = options || {};
    if (kind === 'pool') {
      return {
        id: 'pool-' + archLayerSeq,
        kind: 'pool',
        name: options.name || 'Pool',
        kernel_size: 2,
        stride: 2,
        pool_type: options.pool_type === 'avg' ? 'avg' : 'max',
      };
    }
    return {
      id: 'conv-' + archLayerSeq,
      kind: 'conv',
      name: options.name || 'Conv',
      out_channels: clampToChannelPreset(Number(options.out_channels) || 16),
      kernel_size: 3,
      stride: 1,
      padding: 1,
    };
  }

  function defaultArchitecture() {
    return [
      makeArchLayer('conv', { name: 'Conv 1', out_channels: 8 }),
      makeArchLayer('pool', { name: 'Pool 1' }),
      makeArchLayer('conv', { name: 'Conv 2', out_channels: 16 }),
      makeArchLayer('pool', { name: 'Pool 2' }),
      makeArchLayer('conv', { name: 'Conv 3', out_channels: 32 }),
      makeArchLayer('pool', { name: 'Pool 3' }),
      makeArchLayer('conv', { name: 'Conv 4', out_channels: 64 }),
    ];
  }

  function calcConvDim(size, kernel, stride, padding) {
    return Math.floor((size + 2 * padding - kernel) / stride) + 1;
  }

  function archShapes() {
    var shape = { h: IMAGE_HEIGHT, w: IMAGE_WIDTH, c: 3 };
    return state.architecture.map(function (layer) {
      var inputShape = { h: shape.h, w: shape.w, c: shape.c };
      if (layer.kind === 'pool') {
        shape = {
          h: Math.max(1, calcConvDim(shape.h, Number(layer.kernel_size) || 2, Number(layer.stride) || 2, 0)),
          w: Math.max(1, calcConvDim(shape.w, Number(layer.kernel_size) || 2, Number(layer.stride) || 2, 0)),
          c: shape.c,
        };
      } else {
        shape = {
          h: Math.max(1, calcConvDim(shape.h, Number(layer.kernel_size) || 3, Number(layer.stride) || 1, Number(layer.padding) || 0)),
          w: Math.max(1, calcConvDim(shape.w, Number(layer.kernel_size) || 3, Number(layer.stride) || 1, Number(layer.padding) || 0)),
          c: clampToChannelPreset(Number(layer.out_channels) || 16),
        };
      }
      return { layer: layer, input: inputShape, shape: { h: shape.h, w: shape.w, c: shape.c } };
    });
  }

  function formatArchShape(shape) {
    return shape.c + '×' + shape.h + '×' + shape.w;
  }

  function nearestChannelPreset(value) {
    var numeric = Number(value) || 16;
    return CONV_CHANNEL_PRESETS.reduce(function (best, current) {
      return Math.abs(current - numeric) < Math.abs(best - numeric) ? current : best;
    }, CONV_CHANNEL_PRESETS[0]);
  }

  function clampToChannelPreset(value) {
    return Math.min(64, nearestChannelPreset(value));
  }

  function channelPresetIndex(value) {
    var preset = clampToChannelPreset(value);
    return Math.max(0, CONV_CHANNEL_PRESETS.indexOf(preset));
  }

  function architecturePayload() {
    return state.architecture.map(function (layer) {
      if (layer.kind === 'pool') {
        return {
          kind: 'pool',
          name: layer.name,
          kernel_size: Number(layer.kernel_size) || 2,
          stride: Number(layer.stride) || 2,
          pool_type: layer.pool_type === 'avg' ? 'avg' : 'max',
        };
      }
      return {
        kind: 'conv',
        name: layer.name,
        out_channels: clampToChannelPreset(Number(layer.out_channels) || 16),
        kernel_size: Number(layer.kernel_size) || 3,
        stride: Number(layer.stride) || 1,
        padding: Number(layer.padding) || 0,
      };
    });
  }

  function markArchitectureDirty() {
    state.lenetResult = null;
    state.lenetTrainingComplete = false;
    setLenetTrainingResultsVisible(false);
    $('lenetStatus').textContent = '等待训练';
    $('lenetTrainAcc').textContent = '-';
    renderLenetValidationMetric(null);
    renderLearnedFilters();
    drawLenetHistory();
    var button = $('lenetTrainBtn');
    if (button) button.textContent = '训练 CNN';
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function selectArchitectureLayer(index) {
    state.archSelectedIndex = index >= 0 && index < state.architecture.length ? index : -1;
    updateArchitectureSelectionUi();
  }

  function architectureEditingDisabled() {
    return !!state.lenetTraining;
  }

  function archEditorSelectedLayer() {
    return state.archSelectedIndex >= 0 && state.archSelectedIndex < state.architecture.length
      ? state.architecture[state.archSelectedIndex]
      : null;
  }

  function updateArchEditorFields() {
    var kindSelect = $('archKindSelect');
    var poolField = $('archPoolTypeField');
    var channelField = $('archChannelField');
    var slider = $('archChannelSlider');
    var value = $('archChannelValue');
    var kind = kindSelect ? kindSelect.value : 'conv';
    if (poolField) poolField.hidden = kind !== 'pool';
    if (channelField) channelField.hidden = kind !== 'conv';
    if (slider && value) {
      var index = clamp(Number(slider.value) || 0, 0, CONV_CHANNEL_PRESETS.length - 1);
      slider.value = String(index);
      value.textContent = String(CONV_CHANNEL_PRESETS[index]);
    }
  }

  function blurControl(control) {
    if (control && typeof control.blur === 'function') control.blur();
  }

  function blurEventControl(event) {
    blurControl(event && event.currentTarget);
  }

  function syncSelectboxValue(inputId, nextValue) {
    var input = $(inputId);
    var root = input ? input.closest('[data-dl-selectbox]') : null;
    if (!input || !root) return;
    input.value = String(nextValue);
    var options = root.querySelectorAll('.edu-selectbox-option');
    var valueNode = root.querySelector('[data-selectbox-value]');
    var selected = null;
    Array.prototype.forEach.call(options, function (option) {
      var matches = option.getAttribute('data-value') === String(nextValue);
      option.setAttribute('aria-selected', matches ? 'true' : 'false');
      if (matches) selected = option;
    });
    if (selected && valueNode) valueNode.textContent = selected.textContent.trim();
  }

  function setSelectboxDisabled(inputId, disabled) {
    var input = $(inputId);
    var root = input ? input.closest('[data-dl-selectbox]') : null;
    if (input) input.disabled = !!disabled;
    if (!root) return;
    root.classList.toggle('is-disabled', !!disabled);
    var trigger = root.querySelector('.edu-selectbox-trigger');
    if (trigger) trigger.disabled = !!disabled;
  }

  function syncArchEditorFromLayer(layer) {
    var kindSelect = $('archKindSelect');
    var poolType = $('archPoolTypeSelect');
    var slider = $('archChannelSlider');
    var apply = $('archApplyBtn');
    var del = $('archDeleteBtn');
    var disabled = architectureEditingDisabled();
    if (kindSelect) syncSelectboxValue('archKindSelect', layer && layer.kind === 'pool' ? 'pool' : 'conv');
    if (poolType) syncSelectboxValue('archPoolTypeSelect', layer && layer.pool_type === 'avg' ? 'avg' : 'max');
    if (slider) slider.value = String(channelPresetIndex(layer && layer.kind === 'conv' ? layer.out_channels : 16));
    [kindSelect, poolType, slider].forEach(function (control) {
      if (control) control.disabled = disabled;
    });
    setSelectboxDisabled('archKindSelect', disabled);
    setSelectboxDisabled('archPoolTypeSelect', disabled);
    updateArchEditorFields();
    if (apply) {
      apply.textContent = layer ? '更新' : '添加';
      apply.disabled = disabled;
    }
    if (del) del.disabled = disabled || !layer;
  }

  function archEditorValues() {
    var kindSelect = $('archKindSelect');
    var poolType = $('archPoolTypeSelect');
    var slider = $('archChannelSlider');
    var channelIndex = clamp(Number(slider ? slider.value : 2) || 0, 0, CONV_CHANNEL_PRESETS.length - 1);
    var kind = kindSelect && kindSelect.value === 'pool' ? 'pool' : 'conv';
    return {
      kind: kind,
      out_channels: CONV_CHANNEL_PRESETS[channelIndex],
      pool_type: poolType && poolType.value === 'avg' ? 'avg' : 'max',
    };
  }

  function updateArchitectureSelectionUi() {
    var layer = archEditorSelectedLayer();
    var shapeEntry = layer ? archShapes()[state.archSelectedIndex] : null;
    var info = $('archSelectedInfo');
    var left = $('archLeftBtn');
    var right = $('archRightBtn');
    var del = $('archDeleteBtn');
    var disabled = architectureEditingDisabled();
    if (info) {
      info.textContent = layer
        ? '已选中：' + (layer.kind === 'pool'
          ? (layer.pool_type === 'avg' ? 'AvgPool ' : 'MaxPool ') + (shapeEntry ? formatArchShape(shapeEntry.input) + '→' + formatArchShape(shapeEntry.shape) : 'x1/2')
          : 'Conv ' + (shapeEntry ? shapeEntry.input.c : '?') + '→' + layer.out_channels + 'ch')
        : '未选择模块';
    }
    if (left) left.disabled = disabled || !layer || state.archSelectedIndex <= 0;
    if (right) right.disabled = disabled || !layer || state.archSelectedIndex >= state.architecture.length - 1;
    if (del) del.disabled = disabled || !layer;
    syncArchEditorFromLayer(layer);
  }

  function reorderArchitectureLayer(from, target) {
    if (architectureEditingDisabled()) return;
    if (from < 0 || from >= state.architecture.length) return;
    target = clamp(target, 0, state.architecture.length - 1);
    if (from === target) {
      selectArchitectureLayer(target);
      return;
    }
    var layer = state.architecture.splice(from, 1)[0];
    state.architecture.splice(target, 0, layer);
    state.archSelectedIndex = target;
    markArchitectureDirty();
    renderArchitecture();
  }

  function deleteSelectedArchitectureLayer() {
    if (architectureEditingDisabled()) return;
    if (state.archSelectedIndex < 0 || state.archSelectedIndex >= state.architecture.length) return;
    state.architecture.splice(state.archSelectedIndex, 1);
    state.archSelectedIndex = Math.min(state.archSelectedIndex, state.architecture.length - 1);
    markArchitectureDirty();
    renderArchitecture();
  }

  function archMaterial(color, emissive, opacity) {
    var THREE = window.THREE;
    var alpha = opacity === undefined || opacity >= 0.98 ? 1 : opacity;
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive || color,
      emissiveIntensity: 0.035,
      roughness: 0.52,
      metalness: 0.46,
      transparent: alpha < 1,
      opacity: alpha,
    });
  }

  function glassMaterial(color, emissive, opacity) {
    var THREE = window.THREE;
    return new THREE.MeshPhysicalMaterial({
      color: color,
      emissive: emissive || color,
      emissiveIntensity: 0.025,
      roughness: 0.26,
      metalness: 0.22,
      clearcoat: 0.58,
      clearcoatRoughness: 0.38,
      transparent: true,
      opacity: opacity,
      side: THREE.DoubleSide,
      depthWrite: opacity > 0.58,
    });
  }

  function morandiMatteMaterial(color, emissive, opacity) {
    var THREE = window.THREE;
    var alpha = opacity === undefined || opacity >= 0.98 ? 1 : opacity;
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive || MORANDI.charcoal,
      emissiveIntensity: 0.018,
      roughness: 0.82,
      metalness: 0.08,
      transparent: alpha < 1,
      opacity: alpha,
      side: THREE.DoubleSide,
    });
  }

  function poolFlatMaterial(opacity) {
    var THREE = window.THREE;
    var alpha = opacity === undefined || opacity >= 0.98 ? 1 : opacity;
    return new THREE.MeshBasicMaterial({
      color: MORANDI.pool,
      transparent: alpha < 1,
      opacity: alpha,
      side: THREE.DoubleSide,
      depthWrite: true,
    });
  }

  function addEdges(mesh, color, opacity) {
    var THREE = window.THREE;
    var edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry),
      new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity || 0.55 })
    );
    edges.userData.edgeLine = true;
    edges.userData.baseEdgeColor = color;
    edges.userData.baseEdgeOpacity = opacity || 0.55;
    mesh.add(edges);
    return edges;
  }

  function disableArchFrustumCulling(object) {
    if (!object || typeof object.traverse !== 'function') return;
    object.traverse(function (child) {
      if (child && (child.isMesh || child.isLine || child.isLineSegments || child.isInstancedMesh)) {
        child.frustumCulled = false;
      }
    });
  }

  function createModuleShadow(width, depth, opacity) {
    var THREE = window.THREE;
    var group = new THREE.Group();
    group.userData.pickable = false;
    return group;
  }

  function createFrame(width, height, color, opacity) {
    var THREE = window.THREE;
    var group = new THREE.Group();
    var material = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: opacity || 0.85 });
    var top = new THREE.Mesh(new THREE.BoxGeometry(width, 0.035, 0.025), material);
    var bottom = top.clone();
    var left = new THREE.Mesh(new THREE.BoxGeometry(0.035, height, 0.025), material);
    var right = left.clone();
    top.position.y = height / 2;
    bottom.position.y = -height / 2;
    left.position.x = -width / 2;
    right.position.x = width / 2;
    group.add(top, bottom, left, right);
    return group;
  }

  function setArchLayerUserData(group, index) {
    group.userData.layerIndex = index;
    group.traverse(function (child) {
      child.userData.layerIndex = index;
    });
  }

  function channelSpan(channels) {
    var count = Math.max(1, Number(channels) || 1);
    return clamp(Math.sqrt(count) * 0.083, 0.10, 1.02);
  }

  function channelCenter(index, count, span, thickness) {
    if (count <= 1) return 0;
    return -span / 2 + thickness / 2 + index * ((span - thickness) / Math.max(1, count - 1));
  }

  function pseudoRandom(seed) {
    var value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return value - Math.floor(value);
  }

  function loadDemoFaceImageSource(index) {
    if (index >= DEMO_FACE_IMAGE_URLS.length) {
      state.demoFaceImageLoading = false;
      return;
    }
    var source = DEMO_FACE_IMAGE_URLS[index];
    var image = new Image();
    if (/^https?:\/\//i.test(source)) image.crossOrigin = 'anonymous';
    image.onload = function () {
      try {
        var canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || image.width || IMAGE_WIDTH;
        canvas.height = image.naturalHeight || image.height || IMAGE_HEIGHT;
        var ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        state.demoFaceImage = {
          width: canvas.width,
          height: canvas.height,
          data: ctx.getImageData(0, 0, canvas.width, canvas.height).data,
          source: source,
        };
        state.demoFaceImageLoading = false;
        syncArch3d();
      } catch (error) {
        loadDemoFaceImageSource(index + 1);
      }
    };
    image.onerror = function () {
      loadDemoFaceImageSource(index + 1);
    };
    image.src = source + (source.indexOf('?') >= 0 ? '&' : '?') + 'v=' + Date.now();
  }

  function loadDemoFaceImage() {
    if (state.demoFaceImage || state.demoFaceImageLoading) return;
    state.demoFaceImageLoading = true;
    loadDemoFaceImageSource(0);
  }

  function sampleDemoFacePixel(rowNorm, colNorm) {
    var image = state.demoFaceImage;
    if (!image || !image.data || !image.width || !image.height) return null;
    var x = clamp(Math.round(clamp(colNorm, 0, 1) * (image.width - 1)), 0, image.width - 1);
    var y = clamp(Math.round(clamp(rowNorm, 0, 1) * (image.height - 1)), 0, image.height - 1);
    var offset = (y * image.width + x) * 4;
    var alpha = (image.data[offset + 3] === undefined ? 255 : image.data[offset + 3]) / 255;
    var background = 0.045;
    return [
      (image.data[offset] / 255) * alpha + background * (1 - alpha),
      (image.data[offset + 1] / 255) * alpha + background * (1 - alpha),
      (image.data[offset + 2] / 255) * alpha + background * (1 - alpha),
    ];
  }

  function contrastDemoChannel(value) {
    return clamp(Math.pow(clamp((value - 0.035) * 1.28, 0, 1), 0.82), 0.02, 1);
  }

  function sampleDemoFaceChannel(rowNorm, colNorm, channel) {
    var pixel = sampleDemoFacePixel(rowNorm, colNorm);
    if (!pixel) return null;
    return contrastDemoChannel(pixel[channel] || 0);
  }

  function sampleDemoFaceLuminance(rowNorm, colNorm) {
    var pixel = sampleDemoFacePixel(rowNorm, colNorm);
    if (!pixel) return null;
    return contrastDemoChannel(pixel[0] * 0.299 + pixel[1] * 0.587 + pixel[2] * 0.114);
  }

  function smoothStep(edge0, edge1, value) {
    var t = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function ellipseMask(value, inner, outer) {
    return 1 - smoothStep(inner, outer, value);
  }

  function simulatedFaceImageAt(rowNorm, colNorm) {
    var y = rowNorm - 0.5;
    var z = colNorm - 0.5;
    var faceEllipse = Math.pow(y / 0.39, 2) + Math.pow(z / 0.31, 2);
    var face = ellipseMask(faceEllipse, 0.78, 1.08);
    var topHair = ellipseMask(Math.pow((y + 0.24) / 0.18, 2) + Math.pow(z / 0.31, 2), 0.62, 1.06);
    var leftEye = ellipseMask(Math.pow((y + 0.105) / 0.050, 2) + Math.pow((z + 0.120) / 0.070, 2), 0.38, 1.00);
    var rightEye = ellipseMask(Math.pow((y + 0.105) / 0.050, 2) + Math.pow((z - 0.120) / 0.070, 2), 0.38, 1.00);
    var nose = ellipseMask(Math.pow((y - 0.020) / 0.125, 2) + Math.pow(z / 0.034, 2), 0.30, 1.06);
    var mouthCurve = y - (0.170 + z * z * 0.82);
    var mouthSpan = 1 - smoothStep(0.115, 0.230, Math.abs(z));
    var mouth = Math.exp(-(mouthCurve * mouthCurve) / 0.0011) * mouthSpan;
    var leftCheek = ellipseMask(Math.pow((y - 0.070) / 0.100, 2) + Math.pow((z + 0.175) / 0.080, 2), 0.44, 1.18);
    var rightCheek = ellipseMask(Math.pow((y - 0.070) / 0.100, 2) + Math.pow((z - 0.175) / 0.080, 2), 0.44, 1.18);
    var outline = Math.max(0, ellipseMask(faceEllipse, 0.90, 1.12) - ellipseMask(faceEllipse, 0.60, 0.86));
    var background = 0.09 + (1 - face) * (0.07 + 0.04 * Math.sin((rowNorm * 5 + colNorm * 4) * Math.PI));
    var value = background + face * 0.76;
    value -= topHair * face * 0.38;
    value -= outline * 0.24;
    value -= (leftEye + rightEye) * face * 0.78;
    value -= nose * face * 0.20;
    value -= mouth * face * 0.70;
    value += (leftCheek + rightCheek) * face * 0.11;
    return clamp(value, 0.03, 1);
  }

  function simulatedRgbInputAt(rowNorm, colNorm, channel) {
    var demoValue = sampleDemoFaceChannel(rowNorm, colNorm, channel);
    if (demoValue !== null) return demoValue;
    var y = rowNorm - 0.5;
    var z = colNorm - 0.5;
    var base = simulatedFaceImageAt(rowNorm, colNorm);
    var cheek = ellipseMask(Math.pow((y - 0.065) / 0.120, 2) + Math.pow((Math.abs(z) - 0.170) / 0.070, 2), 0.36, 1.20);
    var centerLight = ellipseMask(Math.pow((y + 0.015) / 0.260, 2) + Math.pow(z / 0.155, 2), 0.42, 1.12);
    var coolSide = smoothStep(-0.30, 0.35, z) * 0.08;
    if (channel === 0) return clamp(base * 0.98 + cheek * 0.16 + 0.03, 0.03, 1);
    if (channel === 1) return clamp(base * 1.04 + centerLight * 0.10, 0.03, 1);
    return clamp(base * 0.86 + coolSide + (1 - base) * 0.05, 0.03, 1);
  }

  function rgbChannelColor(value, channel) {
    var THREE = window.THREE;
    var v = clamp(0.08 + value * 0.92, 0, 1);
    if (channel === 0) return new THREE.Color(0.18 + v * 0.82, 0.030 + v * 0.090, 0.025 + v * 0.075);
    if (channel === 1) return new THREE.Color(0.030 + v * 0.080, 0.18 + v * 0.82, 0.040 + v * 0.100);
    return new THREE.Color(0.035 + v * 0.080, 0.080 + v * 0.140, 0.24 + v * 0.76);
  }

  function simulatedKernelWeight(seed, channel, rowOffset, colOffset) {
    return pseudoRandom(seed + channel * 17.17 + (rowOffset + 2) * 5.31 + (colOffset + 2) * 9.73) * 2 - 1;
  }

  function simulatedFeatureResponseAt(rowNorm, colNorm, seed) {
    var center = sampleDemoFaceLuminance(rowNorm, colNorm);
    var left = sampleDemoFaceLuminance(rowNorm, clamp(colNorm - 0.030, 0, 1));
    var right = sampleDemoFaceLuminance(rowNorm, clamp(colNorm + 0.030, 0, 1));
    var top = sampleDemoFaceLuminance(clamp(rowNorm - 0.030, 0, 1), colNorm);
    var bottom = sampleDemoFaceLuminance(clamp(rowNorm + 0.030, 0, 1), colNorm);
    if (center === null) center = simulatedFaceImageAt(rowNorm, colNorm);
    if (left === null) left = simulatedFaceImageAt(rowNorm, clamp(colNorm - 0.030, 0, 1));
    if (right === null) right = simulatedFaceImageAt(rowNorm, clamp(colNorm + 0.030, 0, 1));
    if (top === null) top = simulatedFaceImageAt(clamp(rowNorm - 0.030, 0, 1), colNorm);
    if (bottom === null) bottom = simulatedFaceImageAt(clamp(rowNorm + 0.030, 0, 1), colNorm);
    var edge = Math.sqrt(Math.pow(right - left, 2) + Math.pow(bottom - top, 2));
    var localContrast = Math.abs(center - (left + right + top + bottom) / 4);
    var sum = 0;
    for (var channel = 0; channel < 3; channel += 1) {
      for (var dy = -1; dy <= 1; dy += 1) {
        for (var dz = -1; dz <= 1; dz += 1) {
          var sampleY = clamp(rowNorm + dy * 0.035, 0, 1);
          var sampleZ = clamp(colNorm + dz * 0.035, 0, 1);
          sum += simulatedRgbInputAt(sampleY, sampleZ, channel) * simulatedKernelWeight(seed, channel, dy, dz);
        }
      }
    }
    var conv = 0.5 + Math.tanh(sum * 0.36) * 0.5;
    var mode = Math.floor(pseudoRandom(seed) * 4);
    var response = conv * 0.34 + edge * 1.12 + localContrast * 1.55 + center * 0.16;
    if (mode === 1) response = conv * 0.28 + edge * 1.40 + (1 - center) * 0.18;
    if (mode === 2) response = conv * 0.40 + localContrast * 1.70 + center * 0.12;
    if (mode === 3) response = conv * 0.26 + edge * 0.88 + Math.abs(center - 0.48) * 0.72;
    return clamp(response, 0, 1);
  }

  function featureResponseColor(response, seed) {
    var THREE = window.THREE;
    var r = clamp(response, 0, 1);
    var cool = new THREE.Color(0x3e4b4d);
    var mid = new THREE.Color(MORANDI.blueGray);
    var warm = new THREE.Color(seed % 2 > 1 ? MORANDI.sand : MORANDI.sage);
    return r < 0.5 ? cool.lerp(mid, r * 2) : mid.lerp(warm, (r - 0.5) * 2);
  }

  function valueBucket(value, bucketCount) {
    var count = Math.max(1, Math.round(Number(bucketCount) || 1));
    return clamp(Math.floor(clamp(value, 0, 0.9999) * count), 0, count - 1);
  }

  function createInput3d() {
    var THREE = window.THREE;
    var group = new THREE.Group();
    var rows = 34;
    var cols = 26;
    var inputChannels = 3;
    var inputDepth = channelSpan(inputChannels);
    var channelThickness = Math.min(0.038, inputDepth / (inputChannels * 1.22));
    var totalHeight = 0.70;
    var totalWidth = 0.53;
    var gapRatio = 0.14;
    var cellY = totalHeight / (rows + (rows - 1) * gapRatio);
    var cellZ = totalWidth / (cols + (cols - 1) * gapRatio);
    var gapY = cellY * gapRatio;
    var gapZ = cellZ * gapRatio;
    var startY = totalHeight / 2 - cellY / 2;
    var startZ = -totalWidth / 2 + cellZ / 2;
    var geometry = new THREE.BoxGeometry(channelThickness, cellY, cellZ);
    var matrix = new THREE.Matrix4();
    [0, 1, 2].forEach(function (channelIndex) {
      var x = channelCenter(channelIndex, inputChannels, inputDepth, channelThickness);
      var bucketCount = 10;
      for (var bucket = 0; bucket < bucketCount; bucket += 1) {
        var material = archMaterial(rgbChannelColor((bucket + 0.5) / bucketCount, channelIndex), 0x11161a, 1);
        var mesh = new THREE.InstancedMesh(geometry, material, rows * cols);
        var instanceIndex = 0;
        for (var row = 0; row < rows; row += 1) {
          for (var col = 0; col < cols; col += 1) {
            var value = simulatedRgbInputAt(
              rows <= 1 ? 0.5 : row / (rows - 1),
              cols <= 1 ? 0.5 : col / (cols - 1),
              channelIndex
            );
            if (valueBucket(value, bucketCount) !== bucket) continue;
            matrix.makeTranslation(
              x,
              startY - row * (cellY + gapY),
              startZ + col * (cellZ + gapZ)
            );
            mesh.setMatrixAt(instanceIndex, matrix);
            instanceIndex += 1;
          }
        }
        if (!instanceIndex) continue;
        mesh.count = instanceIndex;
        mesh.instanceMatrix.needsUpdate = true;
        group.add(mesh);
      }
    });
    group.add(createModuleShadow(0.44, 0.34, 0.28));
    group.userData.size = {
      height: totalHeight,
      depth: totalWidth,
      thickness: inputDepth,
      channels: inputChannels,
    };
    return group;
  }

  function approximateHeadNodeCount(units) {
    var count = Math.max(1, Number(units) || 1);
    return Math.max(8, Math.min(26, Math.round(Math.sqrt(count) * 2.25)));
  }

  function headLayerSpecs(finalShape) {
    var network = state.lenetResult && state.lenetResult.network ? state.lenetResult.network : null;
    var mlpLayers = network && Array.isArray(network.mlp_layers) ? network.mlp_layers : [];
    var layers = network && Array.isArray(network.layers) ? network.layers : [];
    var specs = [];
    if (mlpLayers.length) {
      specs = mlpLayers.map(function (layer) {
        return {
          input: Number(layer.input) || 1,
          output: Number(layer.output) || FACE_CLASS_COUNT,
        };
      });
    } else {
      layers.forEach(function (line) {
        var match = String(line).match(/Linear\s+(\d+)\s*->\s*(\d+)/i);
        if (match) {
          specs.push({ input: Number(match[1]), output: Number(match[2]) });
        }
      });
    }
    if (!specs.length) {
      var inputUnits = finalShape && Number(finalShape.c) ? Number(finalShape.c) : 64;
      specs = [
        { input: inputUnits, output: 64 },
        { input: 64, output: 64 },
        { input: 64, output: FACE_CLASS_COUNT },
      ];
    }
    if (specs.length === 1) {
      specs.push({ input: specs[0].output, output: specs[0].output });
      specs.push({ input: specs[1].output, output: FACE_CLASS_COUNT });
    } else if (specs.length === 2) {
      specs.splice(1, 0, { input: specs[0].output, output: specs[0].output });
    }
    specs[specs.length - 1].output = FACE_CLASS_COUNT;
    return specs;
  }

  function headCrossSectionPositions(ring, ringIndex) {
    var THREE = window.THREE;
    var positions = [];
    var count = Math.max(1, Math.round(Number(ring.count) || 1));
    var goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < count; i += 1) {
      var ratio = count <= 1 ? 0 : Math.sqrt((i + 0.5) / count);
      var angle = -Math.PI / 2 + i * goldenAngle + ringIndex * 0.43;
      var wobble = 1 + Math.sin(i * 1.73 + ringIndex * 0.91) * 0.035;
      positions.push(new THREE.Vector3(
        ring.x,
        Math.sin(angle) * ring.radius * ratio * wobble,
        Math.cos(angle) * ring.radius * 0.72 * ratio * wobble
      ));
    }
    return positions;
  }

  function createHead3d(finalShape) {
    var THREE = window.THREE;
    var group = new THREE.Group();
    var specs = headLayerSpecs(finalShape);
    var layerCount = Math.max(1, specs.length);
    var xStart = -0.02;
    var xEnd = 0.82;
    var headLength = xEnd - xStart;

    var palette = [MORANDI.blueGray, MORANDI.stone, MORANDI.clay, MORANDI.sage, MORANDI.sand];
    var rings = specs.map(function (spec, index) {
      var ratio = layerCount <= 1 ? 1 : index / (layerCount - 1);
      var outputLayer = index === layerCount - 1;
      return {
        x: layerCount <= 1 ? xEnd : xStart + headLength * ratio,
        count: outputLayer ? FACE_CLASS_COUNT : approximateHeadNodeCount(spec.output),
        radius: 0.42 + (0.13 - 0.42) * ratio,
        color: outputLayer ? MORANDI.sage : palette[index % (palette.length - 1)],
        node: outputLayer ? 0.020 : 0.014 + ratio * 0.004,
        units: spec.output,
      };
    });
    var positionsByRing = rings.map(function (ring, ringIndex) {
      return headCrossSectionPositions(ring, ringIndex);
    });

    var segments = [];
    var baseVertices = [];
    function pushSegment(a, b, kind, seed) {
      segments.push({ a: a.clone(), b: b.clone(), midX: (a.x + b.x) / 2, seed: seed || 0, kind: kind || 'mesh' });
      baseVertices.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    for (var leftLayer = 0; leftLayer < positionsByRing.length - 1; leftLayer += 1) {
      var current = positionsByRing[leftLayer];
      var next = positionsByRing[leftLayer + 1];
      current.forEach(function (from, fromIndex) {
        next.forEach(function (to, toIndex) {
          pushSegment(from, to, 'forward', leftLayer * 0.41 + fromIndex * 0.07 + toIndex * 0.011);
        });
      });
    }

    var baseGeometry = new THREE.BufferGeometry();
    baseGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(baseVertices), 3));
    var baseLine = new THREE.LineSegments(
      baseGeometry,
      new THREE.LineBasicMaterial({ color: MORANDI.ivory, transparent: true, opacity: 0.10, depthWrite: false })
    );
    baseLine.userData.pickable = false;
    group.add(baseLine);

    var pulsePositions = new Float32Array(segments.length * 6);
    var pulseGeometry = new THREE.BufferGeometry();
    var pulseAttribute = new THREE.BufferAttribute(pulsePositions, 3);
    pulseGeometry.setAttribute('position', pulseAttribute);
    pulseGeometry.setDrawRange(0, 0);
    var pulseLine = new THREE.LineSegments(
      pulseGeometry,
      new THREE.LineBasicMaterial({ color: MORANDI.accent, transparent: true, opacity: 0.0, depthWrite: false, depthTest: false })
    );
    pulseLine.frustumCulled = false;
    pulseLine.userData.pickable = false;
    group.add(pulseLine);

    var nodes = [];
    rings.forEach(function (ring, ringIndex) {
      var geometry = new THREE.SphereGeometry(ring.node, ringIndex === rings.length - 1 ? 18 : 12, 8);
      var material = archMaterial(ring.color, 0x101417, 0.96);
      var xRange = Math.max(0.001, rings[rings.length - 1].x - rings[0].x);
      positionsByRing[ringIndex].forEach(function (position, nodeIndex) {
        var node = new THREE.Mesh(geometry, material.clone());
        if (ringIndex === rings.length - 1) {
          node.material.color.setHex(nodeIndex % 2 ? MORANDI.sage : MORANDI.sand);
        } else if (nodeIndex % 3 === 0) {
          node.material.color.offsetHSL(0, 0.03, 0.08);
        }
        node.userData.headNode = true;
        node.userData.headXNorm = (ring.x - rings[0].x) / xRange;
        node.userData.headLayerIndex = ringIndex;
        node.userData.headNodeIndex = nodeIndex;
        node.userData.baseHeadColor = node.material.color.getHex();
        node.position.copy(position);
        nodes.push(node);
        group.add(node);
      });
    });
    group.userData.headPulse = {
      segments: segments,
      positions: pulsePositions,
      attribute: pulseAttribute,
      line: pulseLine,
      nodes: nodes,
      inputNodes: nodes.filter(function (node) {
        return Number(node.userData.headLayerIndex) === 0;
      }),
      minX: rings[0].x,
      maxX: rings[rings.length - 1].x,
    };
    return group;
  }

  function factorGrid(count) {
    var safeCount = Math.max(1, Math.round(Number(count) || 1));
    var rows = 1;
    for (var candidate = Math.floor(Math.sqrt(safeCount)); candidate >= 1; candidate -= 1) {
      if (safeCount % candidate === 0) {
        rows = candidate;
        break;
      }
    }
    var columns = safeCount / rows;
    return { columns: columns, rows: rows };
  }

  function featureMapSize(shape) {
    shape = shape || { h: IMAGE_HEIGHT, w: IMAGE_WIDTH, c: 3 };
    var channels = Math.max(1, Number(shape.c) || 1);
    return {
      height: clamp((Number(shape.h) || IMAGE_HEIGHT) / IMAGE_HEIGHT * 0.68, 0.12, 0.68),
      depth: clamp((Number(shape.w) || IMAGE_WIDTH) / IMAGE_WIDTH * 0.52, 0.10, 0.52),
      thickness: clamp(0.035 + Math.log2(channels + 1) * 0.020, 0.055, 0.18),
      channels: channels,
    };
  }

  function createFeatureMapFrameGroup(data, frameIndex) {
    var THREE = window.THREE;
    var group = new THREE.Group();
    if (!data || !THREE) return group;
    var matrix = new THREE.Matrix4();
    var frameSeed = data.kernelSeed + frameIndex * 13.731;
    for (var bucket = 0; bucket < data.bucketCount; bucket += 1) {
      var baseColor = featureResponseColor((bucket + 0.5) / data.bucketCount, frameSeed);
      if (frameIndex > 0) {
        var warm = new THREE.Color(bucket % 2 ? MORANDI.accent : MORANDI.sage);
        var flow = (Math.sin(frameIndex * 1.31 + frameSeed * 0.31 + bucket * 0.57) + 1) / 2;
        baseColor.lerp(warm, 0.08 + flow * 0.18);
      }
      var material = archMaterial(baseColor, 0x101417, 1);
      material.emissiveIntensity = frameIndex > 0 ? 0.070 : 0.035;
      var mesh = new THREE.InstancedMesh(data.geometry, material, data.rows * data.cols);
      var instanceIndex = 0;
      for (var row = 0; row < data.rows; row += 1) {
        for (var col = 0; col < data.cols; col += 1) {
          var rowNorm = data.rows <= 1 ? 0.5 : row / (data.rows - 1);
          var colNorm = data.cols <= 1 ? 0.5 : col / (data.cols - 1);
          var response = simulatedFeatureResponseAt(rowNorm, colNorm, frameSeed);
          if (valueBucket(response, data.bucketCount) !== bucket) continue;
          matrix.makeTranslation(
            0,
            data.startY - row * (data.cellY + data.gapY),
            data.startZ + col * (data.cellZ + data.gapZ)
          );
          mesh.setMatrixAt(instanceIndex, matrix);
          instanceIndex += 1;
        }
      }
      mesh.count = instanceIndex;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.userData.featureMapBucket = bucket;
      mesh.userData.featureMapFrame = frameIndex;
      mesh.userData.pickable = false;
      group.add(mesh);
    }
    group.visible = false;
    group.userData.featureMapFrame = frameIndex;
    group.userData.pickable = false;
    return group;
  }

  function showFeatureMapFrame(data, frameIndex) {
    if (!data || !data.frames || !data.frames.length) return;
    var nextFrame = ((Math.round(Number(frameIndex) || 0) % data.frames.length) + data.frames.length) % data.frames.length;
    if (data.currentFrame === nextFrame) return;
    data.frames.forEach(function (frame, index) {
      frame.visible = index === nextFrame;
    });
    data.currentFrame = nextFrame;
  }

  function createFeatureMap3d(shape, seed) {
    var THREE = window.THREE;
    shape = shape || { h: IMAGE_HEIGHT, w: IMAGE_WIDTH, c: 3 };
    var size = featureMapSize(shape);
    var group = new THREE.Group();
    var rows = Math.max(3, Math.min(30, Math.round(Number(shape.h) || IMAGE_HEIGHT)));
    var cols = Math.max(3, Math.min(24, Math.round(Number(shape.w) || IMAGE_WIDTH)));
    var gapRatio = 0.16;
    var cellY = size.height / (rows + (rows - 1) * gapRatio);
    var cellZ = size.depth / (cols + (cols - 1) * gapRatio);
    var gapY = cellY * gapRatio;
    var gapZ = cellZ * gapRatio;
    var startY = size.height / 2 - cellY / 2;
    var startZ = -size.depth / 2 + cellZ / 2;
    var geometry = new THREE.BoxGeometry(size.thickness, cellY, cellZ);
    var kernelSeed = (Number(seed) || 1) * 19.19 + (Number(shape.c) || 1) * 0.73 + rows * 0.11 + cols * 0.17;
    var bucketCount = 9;
    group.userData.size = size;
    var frameData = {
      rows: rows,
      cols: cols,
      bucketCount: bucketCount,
      kernelSeed: kernelSeed,
      geometry: geometry,
      frames: [],
      startY: startY,
      startZ: startZ,
      cellY: cellY,
      cellZ: cellZ,
      gapY: gapY,
      gapZ: gapZ,
      currentFrame: null,
    };
    for (var frameIndex = 0; frameIndex < FEATURE_MAP_PRECOMPUTED_FRAMES; frameIndex += 1) {
      var frameGroup = createFeatureMapFrameGroup(frameData, frameIndex);
      frameData.frames.push(frameGroup);
      group.add(frameGroup);
    }
    group.userData.dynamicFeatureMap = frameData;
    showFeatureMapFrame(frameData, 0);
    return group;
  }

  function createActivationPlate3d(height, depth) {
    var THREE = window.THREE;
    var group = new THREE.Group();
    var plate = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, height, depth),
      glassMaterial(MORANDI.activation, 0x111515, 0.66)
    );
    plate.userData.draggable = true;
    addEdges(plate, 0x9da6a1, 0.20);
    group.add(plate);
    return group;
  }

  function createPoolFrustum3d(inputShape, outputShape) {
    var THREE = window.THREE;
    var left = featureMapSize(inputShape);
    var right = featureMapSize(outputShape);
    var length = 0.32;
    var x0 = -length / 2;
    var x1 = length / 2;
    var lh = left.height / 2;
    var ld = left.depth / 2;
    var rh = right.height / 2;
    var rd = right.depth / 2;
    var vertices = new Float32Array([
      x0, -lh, -ld,  x0, lh, -ld,  x0, lh, ld,  x0, -lh, ld,
      x1, -rh, -rd,  x1, rh, -rd,  x1, rh, rd,  x1, -rh, rd,
    ]);
    var indices = [
      0, 1, 2, 0, 2, 3,
      4, 6, 5, 4, 7, 6,
      0, 4, 5, 0, 5, 1,
      3, 2, 6, 3, 6, 7,
      1, 5, 6, 1, 6, 2,
      0, 3, 7, 0, 7, 4,
    ];
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    var mesh = new THREE.Mesh(
      geometry,
      poolFlatMaterial(0.96)
    );
    mesh.userData.role = 'poolFrustum';
    mesh.userData.poolFrustum = {
      length: length,
      left: { height: left.height, depth: left.depth },
      right: { height: right.height, depth: right.depth },
    };
    mesh.userData.draggable = true;
    addEdges(mesh, MORANDI.poolEdge, 0.40);
    return { mesh: mesh, length: length, left: left, right: right };
  }

  function convKernelStatsByLayer() {
    var network = state.lenetResult && state.lenetResult.network ? state.lenetResult.network : null;
    var stats = network && Array.isArray(network.conv_kernel_stats) ? network.conv_kernel_stats : [];
    var byLayer = {};
    stats.forEach(function (item) {
      if (Number.isInteger(item.layer_index)) byLayer[item.layer_index] = item;
    });
    return byLayer;
  }

  function convKernelStatColor(stat, kernelIndex) {
    var THREE = window.THREE;
    var means = stat && Array.isArray(stat.kernel_mean) ? stat.kernel_mean : [];
    var absMeans = stat && Array.isArray(stat.kernel_abs_mean) ? stat.kernel_abs_mean : [];
    var mean = Number(means[kernelIndex]) || 0;
    var absMean = Number(absMeans[kernelIndex]) || 0;
    var maxAbs = 0;
    absMeans.forEach(function (value) {
      maxAbs = Math.max(maxAbs, Number(value) || 0);
    });
    var intensity = maxAbs > 0 ? clamp(absMean / maxAbs, 0, 1) : 0;
    var base = new THREE.Color(MORANDI.slate);
    var target = new THREE.Color(mean >= 0 ? MORANDI.clay : MORANDI.blueGray);
    return base.lerp(target, 0.22 + intensity * 0.70).getHex();
  }

  function forEachConvKernelMesh(callback) {
    var view = state.arch3d;
    if (!view || !view.modules) return;
    view.modules.forEach(function (group) {
      group.traverse(function (child) {
        if (child.isMesh && child.userData.role === 'convKernel') callback(child);
      });
    });
  }

  function applyConvKernelStats() {
    var statsByLayer = convKernelStatsByLayer();
    forEachConvKernelMesh(function (mesh) {
      var stat = statsByLayer[mesh.userData.layerIndex];
      if (stat) {
        mesh.material.color.setHex(convKernelStatColor(stat, mesh.userData.kernelIndex || 0));
      } else if (mesh.userData.baseColor !== undefined) {
        mesh.material.color.setHex(mesh.userData.baseColor);
      }
    });
  }

  function animateConvKernelTrainingColors(t) {
    if (!state.lenetTraining) return;
    var THREE = window.THREE;
    var palette = [MORANDI.clay, MORANDI.blueGray, MORANDI.sage, MORANDI.sand, MORANDI.stone];
    forEachConvKernelMesh(function (mesh) {
      var layerIndex = Number(mesh.userData.layerIndex) || 0;
      var kernelIndex = Number(mesh.userData.kernelIndex) || 0;
      var seed = layerIndex * 2.17 + kernelIndex * 0.61;
      var flow = (Math.sin(t * 18.0 + seed) + 1) / 2;
      var shimmer = (Math.sin(t * 31.0 + seed * 1.9) + 1) / 2;
      var paletteIndex = Math.abs(Math.floor(seed * 3)) % palette.length;
      var base = new THREE.Color(mesh.userData.baseColor || MORANDI.slate);
      var target = new THREE.Color(palette[paletteIndex]);
      target.lerp(new THREE.Color(palette[(paletteIndex + 1) % palette.length]), flow);
      var amount = clamp(0.34 + flow * 0.26 + shimmer * 0.18, 0.28, 0.78);
      mesh.material.color.copy(base.lerp(target, amount));
    });
  }

  function animateFeatureMapTrainingFrames(t) {
    var view = state.arch3d;
    if (!view || !view.featureMaps || !view.featureMaps.length) return;
    var training = !!state.lenetTraining;
    var baseFrame = Math.floor(t * 10);
    view.featureMaps.forEach(function (group, index) {
      var data = group && group.userData ? group.userData.dynamicFeatureMap : null;
      if (!data) return;
      if (!training) {
        showFeatureMapFrame(data, 0);
        return;
      }
      showFeatureMapFrame(data, baseFrame + index * 3);
      var pulse = (Math.sin(t * 22.0 + index * 0.82) + 1) / 2;
      var targetScale = 1.0 + pulse * 0.030;
      group.scale.lerp({ x: targetScale, y: targetScale, z: targetScale }, 0.28);
    });
  }

  function createConv3d(layer, index, entry) {
    var THREE = window.THREE;
    var group = new THREE.Group();
    var inputChannels = entry && entry.input ? Number(entry.input.c) || 3 : 3;
    var outChannels = clampToChannelPreset(Number(layer.out_channels) || 16);
    var kernel = clamp(Number(layer.kernel_size) || 3, 1, 7);
    var kernelCount = Math.round(outChannels);
    var grid = factorGrid(kernelCount);
    var columns = grid.columns;
    var rows = grid.rows;
    var cell = clamp(0.050 + kernel * 0.007, 0.058, 0.092);
    var gap = 0.014;
    var kernelLength = channelSpan(inputChannels);
    var totalDepth = columns * cell + (columns - 1) * gap;
    var totalHeight = rows * cell + (rows - 1) * gap;
    var startZ = -totalDepth / 2 + cell / 2;
    var startY = totalHeight / 2 - cell / 2;
    var activationGap = 0.006;
    var activationThickness = 0.042;
    var totalLength = kernelLength + activationGap + activationThickness;
    var cursor = -totalLength / 2;
    var kernelCenterX = cursor + kernelLength / 2;
    var kernelMaterial = morandiMatteMaterial(MORANDI.blueGray, 0x111515, 0.98);
    for (var i = 0; i < kernelCount; i += 1) {
      var col = i % columns;
      var row = Math.floor(i / columns);
      var material = kernelMaterial.clone();
      material.color.setHex(i % 5 === 0 ? MORANDI.stone : (i % 2 === 0 ? MORANDI.blueGray : MORANDI.slate));
      var brick = new THREE.Mesh(
        new THREE.BoxGeometry(kernelLength, cell, cell),
        material
      );
      brick.position.set(kernelCenterX, startY - row * (cell + gap), startZ + col * (cell + gap));
      brick.userData.role = 'convKernel';
      brick.userData.draggable = true;
      brick.userData.kernelIndex = i;
      brick.userData.baseColor = brick.material.color.getHex();
      addEdges(brick, MORANDI.ivory, kernelCount <= 48 ? 0.24 : 0.20);
      group.add(brick);
    }
    cursor += kernelLength + activationGap;
    var activation = createActivationPlate3d(totalHeight, totalDepth);
    activation.position.x = cursor + activationThickness / 2;
    group.add(activation);
    var pickHeight = Math.max(0.70, totalHeight) + 0.18;
    var pickDepth = Math.max(0.58, totalDepth) + 0.16;
    var pick = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(0.76, totalLength + 0.12), pickHeight, pickDepth),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    pick.position.y = 0.03;
    pick.userData.pickable = false;
    group.add(pick, createModuleShadow(Math.max(0.42, totalLength * 0.58), 0.22 + pickDepth * 0.16, 0.22));
    setArchLayerUserData(group, index);
    return group;
  }

  function createPool3d(layer, index, entry) {
    var THREE = window.THREE;
    var group = new THREE.Group();
    var frustum = createPoolFrustum3d(
      entry && entry.input ? entry.input : null,
      entry && entry.shape ? entry.shape : null
    );
    group.add(frustum.mesh);
    var pickHeight = Math.max(0.70, frustum.left.height, frustum.right.height) + 0.18;
    var pickDepth = Math.max(0.58, frustum.left.depth, frustum.right.depth) + 0.16;
    var pick = new THREE.Mesh(
      new THREE.BoxGeometry(
        Math.max(0.62, frustum.length + 0.10),
        pickHeight,
        pickDepth
      ),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    pick.position.y = 0.03;
    pick.userData.pickable = false;
    group.add(pick, createModuleShadow(Math.max(0.34, frustum.length * 0.56), 0.22 + pickDepth * 0.16, 0.20));
    setArchLayerUserData(group, index);
    return group;
  }

  function createFlowLineMaterial(color, opacity) {
    var THREE = window.THREE;
    return new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      depthWrite: false,
      depthTest: false,
    });
  }

  function rootLocalFromObjectPoint(object, localPoint) {
    var view = state.arch3d;
    if (!view || !view.root || !object) return localPoint.clone();
    object.updateMatrixWorld(true);
    view.root.updateMatrixWorld(true);
    var point = localPoint.clone();
    object.localToWorld(point);
    return view.root.worldToLocal(point);
  }

  function featureFlowPoint(group, size, channelIndex, channelCount, yNorm, zNorm, side) {
    var THREE = window.THREE;
    size = size || {};
    var channels = Math.max(1, Math.round(Number(channelCount || size.channels) || 1));
    var span = Math.max(0.04, Number(size.thickness) || channelSpan(channels));
    var sliceThickness = Math.min(0.036, span / Math.max(1, channels));
    var boundedChannel = clamp(Math.round(Number(channelIndex) || 0), 0, channels - 1);
    var x = channelCenter(boundedChannel, channels, span, sliceThickness);
    if (side === 'right') x += sliceThickness * 0.5;
    if (side === 'left') x -= sliceThickness * 0.5;
    var y = ((Number.isFinite(yNorm) ? yNorm : 0.5) - 0.5) * (Number(size.height) || 0.52);
    var z = ((Number.isFinite(zNorm) ? zNorm : 0.5) - 0.5) * (Number(size.depth) || 0.42);
    return rootLocalFromObjectPoint(group, new THREE.Vector3(x, y, z));
  }

  function featureVolumeCornerPoint(group, size, xNorm, yNorm, zNorm) {
    var THREE = window.THREE;
    size = size || {};
    var channels = Math.max(1, Math.round(Number(size.channels) || 1));
    var span = Math.max(0.04, Number(size.thickness) || channelSpan(channels));
    var x = ((Number.isFinite(xNorm) ? xNorm : 1) - 0.5) * span;
    var y = ((Number.isFinite(yNorm) ? yNorm : 0.5) - 0.5) * (Number(size.height) || 0.52);
    var z = ((Number.isFinite(zNorm) ? zNorm : 0.5) - 0.5) * (Number(size.depth) || 0.42);
    return rootLocalFromObjectPoint(group, new THREE.Vector3(x, y, z));
  }

  function featureSideCornerPoint(group, size, side, yNorm, zNorm) {
    return featureVolumeCornerPoint(group, size, side === 'right' ? 1 : 0, yNorm, zNorm);
  }

  function kernelFlowPoint(mesh, side, channelIndex, channelCount) {
    var THREE = window.THREE;
    if (!mesh || !mesh.geometry) return new THREE.Vector3();
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    var box = mesh.geometry.boundingBox;
    var count = Math.max(1, Math.round(Number(channelCount) || 1));
    var columns = Math.max(1, Math.ceil(Math.sqrt(count)));
    var rows = Math.max(1, Math.ceil(count / columns));
    var col = Math.round(Number(channelIndex) || 0) % columns;
    var row = Math.floor((Math.round(Number(channelIndex) || 0)) / columns);
    var yNorm = rows <= 1 ? 0.5 : (row + 0.5) / rows;
    var zNorm = columns <= 1 ? 0.5 : (col + 0.5) / columns;
    var x = side === 'right' ? box.max.x : box.min.x;
    var y = (yNorm - 0.5) * (box.max.y - box.min.y) * 0.76;
    var z = (zNorm - 0.5) * (box.max.z - box.min.z) * 0.76;
    return rootLocalFromObjectPoint(mesh, new THREE.Vector3(x, y, z));
  }

  function poolFrustumFacePoint(mesh, side, yNorm, zNorm) {
    var THREE = window.THREE;
    var data = mesh && mesh.userData ? mesh.userData.poolFrustum : null;
    if (!data) return new THREE.Vector3();
    var face = side === 'right' ? data.right : data.left;
    var x = side === 'right' ? data.length / 2 : -data.length / 2;
    var y = ((Number.isFinite(yNorm) ? yNorm : 0.5) - 0.5) * (Number(face.height) || 0.4);
    var z = ((Number.isFinite(zNorm) ? zNorm : 0.5) - 0.5) * (Number(face.depth) || 0.3);
    return rootLocalFromObjectPoint(mesh, new THREE.Vector3(x, y, z));
  }

  function kernelCuboidCornerPoint(mesh, xNorm, yNorm, zNorm) {
    var THREE = window.THREE;
    if (!mesh || !mesh.geometry) return new THREE.Vector3();
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    var box = mesh.geometry.boundingBox;
    var x = box.min.x + (Number.isFinite(xNorm) ? xNorm : 0) * (box.max.x - box.min.x);
    var y = box.min.y + (Number.isFinite(yNorm) ? yNorm : 0.5) * (box.max.y - box.min.y);
    var z = box.min.z + (Number.isFinite(zNorm) ? zNorm : 0.5) * (box.max.z - box.min.z);
    return rootLocalFromObjectPoint(mesh, new THREE.Vector3(x, y, z));
  }

  function kernelFaceCenter(mesh, side) {
    var THREE = window.THREE;
    if (!mesh || !mesh.geometry) return new THREE.Vector3();
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    var box = mesh.geometry.boundingBox;
    return rootLocalFromObjectPoint(mesh, new THREE.Vector3(side === 'right' ? box.max.x : box.min.x, 0, 0));
  }

  function kernelFacePoint(mesh, side, yNorm, zNorm) {
    var THREE = window.THREE;
    if (!mesh || !mesh.geometry) return new THREE.Vector3();
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    var box = mesh.geometry.boundingBox;
    var x = side === 'right' ? box.max.x : box.min.x;
    var y = ((Number.isFinite(yNorm) ? yNorm : 0.5) - 0.5) * (box.max.y - box.min.y) * 0.80;
    var z = ((Number.isFinite(zNorm) ? zNorm : 0.5) - 0.5) * (box.max.z - box.min.z) * 0.80;
    return rootLocalFromObjectPoint(mesh, new THREE.Vector3(x, y, z));
  }

  function writeLineSegment(array, segmentIndex, from, to) {
    var offset = segmentIndex * 6;
    array[offset] = from.x;
    array[offset + 1] = from.y;
    array[offset + 2] = from.z;
    array[offset + 3] = to.x;
    array[offset + 4] = to.y;
    array[offset + 5] = to.z;
  }

  function createConvTrainingFlow3d(index, entry, inputGroup, outputGroup, moduleGroup) {
    var THREE = window.THREE;
    var kernels = [];
    moduleGroup.traverse(function (child) {
      if (child.isMesh && child.userData.role === 'convKernel') kernels.push(child);
    });
    kernels.sort(function (a, b) {
      return (Number(a.userData.kernelIndex) || 0) - (Number(b.userData.kernelIndex) || 0);
    });
    if (!kernels.length || !inputGroup || !outputGroup) return null;

    var inputChannels = Math.max(1, Math.round(Number(entry && entry.input && entry.input.c) || 1));
    var outputChannels = Math.max(1, kernels.length);
    var group = new THREE.Group();
    group.userData.pickable = false;
    group.visible = false;

    var inputPositions = new Float32Array(8 * 6);
    var inputGeometry = new THREE.BufferGeometry();
    var inputAttribute = new THREE.BufferAttribute(inputPositions, 3);
    inputGeometry.setAttribute('position', inputAttribute);
    var inputLine = new THREE.LineSegments(inputGeometry, createFlowLineMaterial(MORANDI.clay, 0.0));
    inputLine.frustumCulled = false;
    inputLine.userData.pickable = false;
    group.add(inputLine);

    var outputPositions = new Float32Array(4 * 6);
    var outputGeometry = new THREE.BufferGeometry();
    var outputAttribute = new THREE.BufferAttribute(outputPositions, 3);
    outputGeometry.setAttribute('position', outputAttribute);
    var outputLine = new THREE.LineSegments(outputGeometry, createFlowLineMaterial(MORANDI.accent, 0.0));
    outputLine.frustumCulled = false;
    outputLine.userData.pickable = false;
    group.add(outputLine);

    var markerPositions = new Float32Array(5 * 6);
    var markerGeometry = new THREE.BufferGeometry();
    var markerAttribute = new THREE.BufferAttribute(markerPositions, 3);
    markerGeometry.setAttribute('position', markerAttribute);
    var markerLine = new THREE.LineSegments(markerGeometry, createFlowLineMaterial(MORANDI.accent, 0.0));
    markerLine.frustumCulled = false;
    markerLine.userData.pickable = false;
    group.add(markerLine);

    return {
      kind: 'conv',
      layerIndex: index,
      group: group,
      inputGroup: inputGroup,
      outputGroup: outputGroup,
      moduleGroup: moduleGroup,
      kernels: kernels,
      inputChannels: inputChannels,
      outputChannels: outputChannels,
      inputSize: inputGroup.userData.size || featureMapSize(entry && entry.input ? entry.input : null),
      outputSize: outputGroup.userData.size || featureMapSize(entry && entry.shape ? entry.shape : null),
      inputPositions: inputPositions,
      inputAttribute: inputAttribute,
      outputPositions: outputPositions,
      outputAttribute: outputAttribute,
      markerPositions: markerPositions,
      markerAttribute: markerAttribute,
      inputLine: inputLine,
      outputLine: outputLine,
      markerLine: markerLine,
    };
  }

  function createPoolTrainingFlow3d(index, entry, inputGroup, outputGroup, moduleGroup) {
    var THREE = window.THREE;
    var poolMesh = null;
    moduleGroup.traverse(function (child) {
      if (!poolMesh && child.isMesh && child.userData.role === 'poolFrustum') poolMesh = child;
    });
    if (!poolMesh || !inputGroup || !outputGroup) return null;

    var group = new THREE.Group();
    group.userData.pickable = false;
    group.visible = false;

    var leftPositions = new Float32Array(4 * 6);
    var leftGeometry = new THREE.BufferGeometry();
    var leftAttribute = new THREE.BufferAttribute(leftPositions, 3);
    leftGeometry.setAttribute('position', leftAttribute);
    var leftLine = new THREE.LineSegments(leftGeometry, createFlowLineMaterial(MORANDI.clay, 0.0));
    leftLine.frustumCulled = false;
    leftLine.userData.pickable = false;
    group.add(leftLine);

    var rightPositions = new Float32Array(4 * 6);
    var rightGeometry = new THREE.BufferGeometry();
    var rightAttribute = new THREE.BufferAttribute(rightPositions, 3);
    rightGeometry.setAttribute('position', rightAttribute);
    var rightLine = new THREE.LineSegments(rightGeometry, createFlowLineMaterial(MORANDI.accent, 0.0));
    rightLine.frustumCulled = false;
    rightLine.userData.pickable = false;
    group.add(rightLine);

    return {
      kind: 'pool',
      layerIndex: index,
      group: group,
      inputGroup: inputGroup,
      outputGroup: outputGroup,
      moduleGroup: moduleGroup,
      poolMesh: poolMesh,
      inputSize: inputGroup.userData.size || featureMapSize(entry && entry.input ? entry.input : null),
      outputSize: outputGroup.userData.size || featureMapSize(entry && entry.shape ? entry.shape : null),
      leftPositions: leftPositions,
      leftAttribute: leftAttribute,
      rightPositions: rightPositions,
      rightAttribute: rightAttribute,
      leftLine: leftLine,
      rightLine: rightLine,
    };
  }

  function createHeadInputTrainingFlow3d(inputGroup, headGroup, inputShape) {
    var THREE = window.THREE;
    var data = headGroup && headGroup.userData ? headGroup.userData.headPulse : null;
    var inputNodes = data && Array.isArray(data.inputNodes) ? data.inputNodes : [];
    if (!inputGroup || !headGroup || !inputNodes.length) return null;
    var segmentCount = Math.min(16, Math.max(6, inputNodes.length));
    var positions = new Float32Array(segmentCount * 6);
    var geometry = new THREE.BufferGeometry();
    var attribute = new THREE.BufferAttribute(positions, 3);
    geometry.setAttribute('position', attribute);
    var line = new THREE.LineSegments(geometry, createFlowLineMaterial(MORANDI.accent, 0.0));
    line.frustumCulled = false;
    line.userData.pickable = false;
    var group = new THREE.Group();
    group.userData.pickable = false;
    group.visible = false;
    group.add(line);
    return {
      group: group,
      inputGroup: inputGroup,
      inputSize: inputGroup.userData.size || featureMapSize(inputShape),
      headGroup: headGroup,
      inputNodes: inputNodes,
      positions: positions,
      attribute: attribute,
      line: line,
      segmentCount: segmentCount,
    };
  }

  function syncConvTrainingFlows(shapeEntries, boundaryGroups) {
    var view = state.arch3d;
    var THREE = window.THREE;
    if (!view || !THREE) return;
    var flowGroup = new THREE.Group();
    flowGroup.userData.pickable = false;
    flowGroup.visible = !!state.lenetTraining;
    view.trainingFlows = [];
    state.architecture.forEach(function (layer, index) {
      var flow = layer.kind === 'pool' ? createPoolTrainingFlow3d(
        index,
        shapeEntries[index],
        boundaryGroups[index],
        boundaryGroups[index + 1],
        view.modules[index]
      ) : createConvTrainingFlow3d(
        index,
        shapeEntries[index],
        boundaryGroups[index],
        boundaryGroups[index + 1],
        view.modules[index]
      );
      if (!flow) return;
      flowGroup.add(flow.group);
      view.trainingFlows.push(flow);
    });
    view.trainingFlowGroup = flowGroup;
    view.root.add(flowGroup);
  }

  function syncHeadInputTrainingFlow(finalInputGroup, headGroup, finalShape) {
    var view = state.arch3d;
    if (!view || !view.root) return;
    view.headInputFlow = createHeadInputTrainingFlow3d(finalInputGroup, headGroup, finalShape);
    if (view.headInputFlow) view.root.add(view.headInputFlow.group);
  }

  function setConvKernelFlowHighlight(flow, activeKernel, strength) {
    var kernels = flow && flow.kernels ? flow.kernels : [];
    kernels.forEach(function (kernel) {
      var active = kernel === activeKernel;
      var material = kernel && kernel.material;
      if (material && typeof material.emissiveIntensity === 'number') {
        if (kernel.userData.baseFlowEmissiveIntensity === undefined) {
          kernel.userData.baseFlowEmissiveIntensity = material.emissiveIntensity;
        }
        material.emissiveIntensity = kernel.userData.baseFlowEmissiveIntensity + (active ? strength : 0);
      }
      kernel.traverse(function (child) {
        if (!child.userData || !child.userData.edgeLine || !child.material) return;
        child.material.color.setHex(active ? 0xf0d47a : child.userData.baseEdgeColor);
        child.material.opacity = active ? 0.90 : child.userData.baseEdgeOpacity;
      });
    });
  }

  function resetConvTrainingFlowHighlights(flows) {
    (flows || []).forEach(function (flow) {
      if (flow.kind === 'conv') setConvKernelFlowHighlight(flow, null, 0);
    });
  }

  function updateConvTrainingFlow(flow, t, flowIndex) {
    var kernels = flow.kernels;
    if (!kernels || !kernels.length) return;
    var outputChannels = Math.max(1, flow.outputChannels || kernels.length);
    var speed = clamp(5.2 + Math.log2(outputChannels + 1) * 1.05, 5.6, 12.0);
    var phase = (t * speed + flowIndex * 2.35) % outputChannels;
    var kernelIndex = Math.floor(phase) % kernels.length;
    var localPhase = phase - Math.floor(phase);
    var pulse = Math.sin(localPhase * Math.PI);
    var activeKernel = kernels[kernelIndex] || kernels[0];

    var inputCorners = [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 1, z: 1 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 0, z: 1 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 1, z: 1 },
    ];
    inputCorners.forEach(function (corner, segmentIndex) {
      var from = featureVolumeCornerPoint(flow.inputGroup, flow.inputSize, corner.x, corner.y, corner.z);
      var to = kernelCuboidCornerPoint(activeKernel, 0, corner.y, corner.z);
      writeLineSegment(flow.inputPositions, segmentIndex, from, to);
    });
    setConvKernelFlowHighlight(flow, activeKernel, 0.18 + pulse * 0.22);

    var outputCorners = [
      { y: 0.12, z: 0.12 },
      { y: 0.12, z: 0.88 },
      { y: 0.88, z: 0.12 },
      { y: 0.88, z: 0.88 },
    ];
    outputCorners.forEach(function (corner, segmentIndex) {
      var from = kernelFacePoint(activeKernel, 'right', corner.y, corner.z);
      var to = featureFlowPoint(flow.outputGroup, flow.outputSize, kernelIndex, outputChannels, corner.y, corner.z, 'left');
      writeLineSegment(flow.outputPositions, segmentIndex, from, to);
    });

    var frameCorners = [
      featureFlowPoint(flow.outputGroup, flow.outputSize, kernelIndex, outputChannels, 0.08, 0.08, 'left'),
      featureFlowPoint(flow.outputGroup, flow.outputSize, kernelIndex, outputChannels, 0.92, 0.08, 'left'),
      featureFlowPoint(flow.outputGroup, flow.outputSize, kernelIndex, outputChannels, 0.92, 0.92, 'left'),
      featureFlowPoint(flow.outputGroup, flow.outputSize, kernelIndex, outputChannels, 0.08, 0.92, 'left'),
    ];
    writeLineSegment(flow.markerPositions, 0, frameCorners[0], frameCorners[1]);
    writeLineSegment(flow.markerPositions, 1, frameCorners[1], frameCorners[2]);
    writeLineSegment(flow.markerPositions, 2, frameCorners[2], frameCorners[3]);
    writeLineSegment(flow.markerPositions, 3, frameCorners[3], frameCorners[0]);
    var scanZ = 0.08 + localPhase * 0.84;
    var scanTop = featureFlowPoint(flow.outputGroup, flow.outputSize, kernelIndex, outputChannels, 0.10, scanZ, 'left');
    var scanBottom = featureFlowPoint(flow.outputGroup, flow.outputSize, kernelIndex, outputChannels, 0.90, scanZ, 'left');
    writeLineSegment(flow.markerPositions, 4, scanTop, scanBottom);

    flow.inputAttribute.needsUpdate = true;
    flow.outputAttribute.needsUpdate = true;
    flow.markerAttribute.needsUpdate = true;
    flow.inputLine.material.opacity = 0.16 + pulse * 0.28;
    flow.outputLine.material.opacity = 0.34 + pulse * 0.42;
    flow.markerLine.material.opacity = 0.42 + pulse * 0.44;
    flow.group.visible = true;
  }

  function localPhasePulse(phase, start, end) {
    if (phase < start || phase > end) return 0;
    var x = (phase - start) / Math.max(0.001, end - start);
    return Math.sin(x * Math.PI);
  }

  function updatePoolTrainingFlow(flow, t, flowIndex) {
    var corners = [
      { y: 0.10, z: 0.10 },
      { y: 0.10, z: 0.90 },
      { y: 0.90, z: 0.10 },
      { y: 0.90, z: 0.90 },
    ];
    corners.forEach(function (corner, segmentIndex) {
      var leftFrom = featureSideCornerPoint(flow.inputGroup, flow.inputSize, 'right', corner.y, corner.z);
      var leftTo = poolFrustumFacePoint(flow.poolMesh, 'left', corner.y, corner.z);
      writeLineSegment(flow.leftPositions, segmentIndex, leftFrom, leftTo);
      var rightFrom = poolFrustumFacePoint(flow.poolMesh, 'right', corner.y, corner.z);
      var rightTo = featureSideCornerPoint(flow.outputGroup, flow.outputSize, 'left', corner.y, corner.z);
      writeLineSegment(flow.rightPositions, segmentIndex, rightFrom, rightTo);
    });

    var phase = (t * 1.85 + flowIndex * 0.23) % 1;
    var leftPulse = localPhasePulse(phase, 0.00, 0.42);
    var modulePulse = localPhasePulse(phase, 0.28, 0.72);
    var rightPulse = localPhasePulse(phase, 0.58, 1.00);

    flow.leftAttribute.needsUpdate = true;
    flow.rightAttribute.needsUpdate = true;
    flow.leftLine.material.opacity = 0.10 + leftPulse * 0.62;
    flow.rightLine.material.opacity = 0.08 + rightPulse * 0.54;
    setArchModuleHighlight(flow.moduleGroup, modulePulse * 0.16);
    flow.group.visible = true;
  }

  function animateConvTrainingFlows(t) {
    var view = state.arch3d;
    if (!view || !view.trainingFlowGroup || !view.trainingFlows) return;
    view.trainingFlowGroup.visible = !!state.lenetTraining;
    if (!state.lenetTraining) {
      resetConvTrainingFlowHighlights(view.trainingFlows);
      return;
    }
    view.trainingFlows.forEach(function (flow, index) {
      if (flow.kind === 'pool') updatePoolTrainingFlow(flow, t, index);
      else updateConvTrainingFlow(flow, t, index);
    });
  }

  function animateHeadInputTrainingFlow(t) {
    var view = state.arch3d;
    var flow = view && view.headInputFlow;
    if (!flow || !flow.group || !flow.line || !flow.attribute) return;
    flow.group.visible = !!state.lenetTraining;
    if (!state.lenetTraining) {
      flow.line.material.opacity = 0;
      return;
    }
    var anchors = [
      { y: 0.08, z: 0.08 },
      { y: 0.08, z: 0.50 },
      { y: 0.08, z: 0.92 },
      { y: 0.32, z: 0.18 },
      { y: 0.32, z: 0.82 },
      { y: 0.50, z: 0.08 },
      { y: 0.50, z: 0.92 },
      { y: 0.68, z: 0.18 },
      { y: 0.68, z: 0.82 },
      { y: 0.92, z: 0.08 },
      { y: 0.92, z: 0.50 },
      { y: 0.92, z: 0.92 },
    ];
    var nodes = flow.inputNodes || [];
    for (var i = 0; i < flow.segmentCount; i += 1) {
      var anchor = anchors[i % anchors.length];
      var from = featureSideCornerPoint(flow.inputGroup, flow.inputSize, 'right', anchor.y, anchor.z);
      var nodeIndex = Math.floor(i / Math.max(1, flow.segmentCount - 1) * Math.max(0, nodes.length - 1));
      var node = nodes[nodeIndex] || nodes[i % Math.max(1, nodes.length)];
      var to = rootLocalFromObjectPoint(node, new window.THREE.Vector3(0, 0, 0));
      writeLineSegment(flow.positions, i, from, to);
    }
    flow.attribute.needsUpdate = true;
    var blink = (Math.sin(t * 10.5) + 1) / 2;
    var ripple = (Math.sin(t * 18.0 + 1.7) + 1) / 2;
    flow.line.material.opacity = 0.18 + blink * 0.34 + ripple * 0.16;
    flow.group.visible = true;
  }

  function animateHeadTrainingPulse(t) {
    var view = state.arch3d;
    var head = view && view.headGroup;
    var data = head && head.userData ? head.userData.headPulse : null;
    if (!data || !data.line || !data.attribute) return;
    if (!state.lenetTraining) {
      data.line.visible = false;
      data.line.material.opacity = 0;
      if (data.nodes) {
        data.nodes.forEach(function (node) {
          if (node.material && typeof node.material.emissiveIntensity === 'number') {
            if (node.userData.baseHeadEmissive === undefined) node.userData.baseHeadEmissive = node.material.emissiveIntensity;
            node.material.emissiveIntensity += (node.userData.baseHeadEmissive - node.material.emissiveIntensity) * 0.18;
            if (node.userData.baseHeadColor !== undefined) {
              node.material.color.setHex(node.userData.baseHeadColor);
            }
          }
          node.scale.lerp({ x: 1, y: 1, z: 1 }, 0.20);
        });
      }
      return;
    }

    var cursor = (t * 0.92) % 1;
    var active = 0;
    var minX = Number(data.minX) || -0.6;
    var range = Math.max(0.001, (Number(data.maxX) || 0.6) - minX);
    data.segments.forEach(function (segment) {
      var xNorm = (segment.midX - minX) / range;
      var direct = cursor - xNorm;
      if (direct < -0.35) direct += 1;
      var leading = Math.exp(-Math.pow(direct / 0.055, 2));
      var tail = direct >= 0 && direct < 0.34 ? (1 - direct / 0.34) * 0.52 : 0;
      var spark = (Math.sin(t * 18 + segment.seed * 9.7) + 1) * 0.08;
      var strength = Math.max(leading, tail) + spark;
      if (strength < 0.20) return;
      writeLineSegment(data.positions, active, segment.a, segment.b);
      active += 1;
    });
    data.attribute.needsUpdate = true;
    data.line.geometry.setDrawRange(0, active * 2);
    data.line.visible = active > 0;
    data.line.material.opacity = active > 0 ? 0.68 : 0;

    if (data.nodes) {
      var THREE = window.THREE;
      var hotColor = new THREE.Color(0xf1d07a);
      var outputColor = new THREE.Color(0xaed0b7);
      data.nodes.forEach(function (node) {
        if (!node.material || typeof node.material.emissiveIntensity !== 'number') return;
        if (node.userData.baseHeadEmissive === undefined) node.userData.baseHeadEmissive = node.material.emissiveIntensity;
        var xNorm = Number(node.userData.headXNorm) || 0;
        var direct = cursor - xNorm;
        if (direct < -0.35) direct += 1;
        var leading = Math.exp(-Math.pow(direct / 0.07, 2));
        var afterglow = direct >= 0 && direct < 0.30 ? (1 - direct / 0.30) * 0.42 : 0;
        var twinkle = (Math.sin(t * 20 + (Number(node.userData.headNodeIndex) || 0) * 0.73) + 1) * 0.035;
        var glow = clamp(leading + afterglow + twinkle, 0, 1);
        node.material.emissiveIntensity = node.userData.baseHeadEmissive + glow * 0.92;
        if (node.userData.baseHeadColor !== undefined) {
          var base = new THREE.Color(node.userData.baseHeadColor);
          var target = Number(node.userData.headLayerIndex) === 2 ? outputColor : hotColor;
          node.material.color.copy(base.lerp(target, glow * 0.72));
        }
        var nodeScale = 1 + glow * 0.42;
        node.scale.lerp({ x: nodeScale, y: nodeScale, z: nodeScale }, 0.36);
      });
    }
  }

  function createExhibitLabel(text) {
    var THREE = window.THREE;
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '700 44px "Microsoft YaHei", "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.82)';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 7;
    ctx.strokeStyle = 'rgba(7, 9, 11, 0.82)';
    ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = 'rgba(228, 221, 196, 0.95)';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    var texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    var label = new THREE.Mesh(
      new THREE.PlaneGeometry(1.03, 0.26),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.94,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    label.rotation.x = -Math.PI / 2;
    label.userData.pickable = false;
    return label;
  }

  function createMiniInputExhibit() {
    var THREE = window.THREE;
    var group = new THREE.Group();
    var rows = 14;
    var cols = 11;
    var cellY = 0.020;
    var cellZ = 0.020;
    var gap = 0.0032;
    var channelThickness = 0.018;
    var geometry = new THREE.BoxGeometry(channelThickness, cellY, cellZ);
    var matrix = new THREE.Matrix4();
    [0, 1, 2].forEach(function (channelIndex) {
      var x = (channelIndex - 1) * 0.044;
      var bucketCount = 8;
      for (var bucket = 0; bucket < bucketCount; bucket += 1) {
        var material = archMaterial(rgbChannelColor((bucket + 0.5) / bucketCount, channelIndex), 0x11161a, 1);
        var mesh = new THREE.InstancedMesh(geometry, material, rows * cols);
        var instanceIndex = 0;
        for (var row = 0; row < rows; row += 1) {
          for (var col = 0; col < cols; col += 1) {
            var value = simulatedRgbInputAt(row / (rows - 1), col / (cols - 1), channelIndex);
            if (valueBucket(value, bucketCount) !== bucket) continue;
            matrix.makeTranslation(
              x,
              (rows - 1) * (cellY + gap) / 2 - row * (cellY + gap),
              -(cols - 1) * (cellZ + gap) / 2 + col * (cellZ + gap)
            );
            mesh.setMatrixAt(instanceIndex, matrix);
            instanceIndex += 1;
          }
        }
        if (!instanceIndex) continue;
        mesh.count = instanceIndex;
        mesh.instanceMatrix.needsUpdate = true;
        mesh.userData.pickable = false;
        group.add(mesh);
      }
    });
    return group;
  }

  function createMiniFeatureExhibit() {
    var THREE = window.THREE;
    var group = new THREE.Group();
    var rows = 8;
    var cols = 8;
    var cell = 0.026;
    var gap = 0.006;
    var geometry = new THREE.BoxGeometry(0.030, cell, cell);
    var matrix = new THREE.Matrix4();
    var seed = 23.71;
    var bucketCount = 9;
    for (var bucket = 0; bucket < bucketCount; bucket += 1) {
      var material = archMaterial(featureResponseColor((bucket + 0.5) / bucketCount, seed), 0x101417, 0.98);
      var mesh = new THREE.InstancedMesh(geometry, material, rows * cols);
      var instanceIndex = 0;
      for (var row = 0; row < rows; row += 1) {
        for (var col = 0; col < cols; col += 1) {
          var response = simulatedFeatureResponseAt(row / (rows - 1), col / (cols - 1), seed);
          if (valueBucket(response, bucketCount) !== bucket) continue;
          matrix.makeTranslation(0, (rows - 1) * (cell + gap) / 2 - row * (cell + gap), -(cols - 1) * (cell + gap) / 2 + col * (cell + gap));
          mesh.setMatrixAt(instanceIndex, matrix);
          instanceIndex += 1;
        }
      }
      if (!instanceIndex) continue;
      mesh.count = instanceIndex;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.userData.pickable = false;
      group.add(mesh);
    }
    return group;
  }

  function createMiniConvExhibit() {
    var THREE = window.THREE;
    var group = new THREE.Group();
    var material = morandiMatteMaterial(MORANDI.blueGray, 0x101417, 0.98);
    [-0.035, 0.035].forEach(function (y) {
      [-0.040, 0.040].forEach(function (z) {
        var kernel = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.050, 0.050), material.clone());
        kernel.position.set(-0.055, y, z);
        kernel.userData.pickable = false;
        addEdges(kernel, MORANDI.ivory, 0.24);
        group.add(kernel);
      });
    });
    var activation = new THREE.Mesh(
      new THREE.BoxGeometry(0.030, 0.18, 0.17),
      glassMaterial(MORANDI.activation, 0x0b0d10, 0.66)
    );
    activation.position.x = 0.105;
    activation.userData.pickable = false;
    addEdges(activation, 0x9aa1a2, 0.22);
    group.add(activation);
    return group;
  }

  function createMiniPoolExhibit() {
    var THREE = window.THREE;
    var length = 0.28;
    var x0 = -length / 2;
    var x1 = length / 2;
    var lh = 0.16;
    var ld = 0.13;
    var rh = 0.08;
    var rd = 0.065;
    var vertices = new Float32Array([
      x0, -lh, -ld,  x0, lh, -ld,  x0, lh, ld,  x0, -lh, ld,
      x1, -rh, -rd,  x1, rh, -rd,  x1, rh, rd,  x1, -rh, rd,
    ]);
    var indices = [
      0, 1, 2, 0, 2, 3,
      4, 6, 5, 4, 7, 6,
      0, 4, 5, 0, 5, 1,
      3, 2, 6, 3, 6, 7,
      1, 5, 6, 1, 6, 2,
      0, 3, 7, 0, 7, 4,
    ];
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    var mesh = new THREE.Mesh(geometry, poolFlatMaterial(0.96));
    mesh.userData.pickable = false;
    addEdges(mesh, MORANDI.poolEdge, 0.40);
    return mesh;
  }

  function createMiniHeadExhibit() {
    var THREE = window.THREE;
    var group = new THREE.Group();
    var layers = [
      { x: -0.20, count: 5, radius: 0.13 },
      { x: 0.00, count: 6, radius: 0.11 },
      { x: 0.20, count: 4, radius: 0.075 },
    ];
    var nodes = [];
    layers.forEach(function (layer, layerIndex) {
      var layerNodes = [];
      for (var i = 0; i < layer.count; i += 1) {
        var angle = -Math.PI / 2 + i / layer.count * Math.PI * 2;
        var node = new THREE.Mesh(
          new THREE.SphereGeometry(layerIndex === layers.length - 1 ? 0.018 : 0.014, 12, 8),
          archMaterial(layerIndex === layers.length - 1 ? MORANDI.sage : MORANDI.sand, 0x101417, 0.96)
        );
        node.position.set(layer.x, Math.sin(angle) * layer.radius, Math.cos(angle) * layer.radius * 0.72);
        node.userData.pickable = false;
        layerNodes.push(node);
        group.add(node);
      }
      nodes.push(layerNodes);
    });
    var vertices = [];
    for (var layerIndex = 0; layerIndex < nodes.length - 1; layerIndex += 1) {
      nodes[layerIndex].forEach(function (from) {
        nodes[layerIndex + 1].forEach(function (to) {
          vertices.push(from.position.x, from.position.y, from.position.z, to.position.x, to.position.y, to.position.z);
        });
      });
    }
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    var lines = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({ color: MORANDI.ivory, transparent: true, opacity: 0.16, depthWrite: false })
    );
    lines.userData.pickable = false;
    group.add(lines);
    return group;
  }

  function createModuleExhibitStand(labelText, model) {
    var THREE = window.THREE;
    var group = new THREE.Group();
    group.userData.pickable = false;
    var base = new THREE.Mesh(
      new THREE.BoxGeometry(1.06, 0.040, 0.34),
      archMaterial(MORANDI.charcoal, 0x0a0d0f, 0.96)
    );
    base.userData.pickable = false;
    addEdges(base, MORANDI.deckLine, 0.22);
    group.add(base);
    var pad = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.020, 0.20),
      new THREE.MeshBasicMaterial({ color: MORANDI.accent, transparent: true, opacity: 0.13 })
    );
    pad.position.set(0, 0.034, -0.070);
    pad.userData.pickable = false;
    group.add(pad);
    model.position.set(0, 0.205, -0.070);
    model.scale.setScalar(0.92);
    model.traverse(function (child) {
      child.userData.pickable = false;
      child.userData.draggable = false;
    });
    group.add(model);
    var label = createExhibitLabel(labelText);
    label.position.set(0, 0.034, 0.120);
    group.add(label);
    return group;
  }

  function createModuleExhibits() {
    var THREE = window.THREE;
    var group = new THREE.Group();
    var exhibits = [
      { x: -3.35, label: '输入图像', model: createMiniInputExhibit() },
      { x: -1.68, label: '特征图', model: createMiniFeatureExhibit() },
      { x: 0.00, label: '卷积核+激活层', model: createMiniConvExhibit() },
      { x: 1.68, label: '池化层', model: createMiniPoolExhibit() },
      { x: 3.35, label: '全连接分类', model: createMiniHeadExhibit() },
    ];
    exhibits.forEach(function (item) {
      var stand = createModuleExhibitStand(item.label, item.model);
      stand.position.set(item.x, -0.575, 1.08);
      group.add(stand);
    });
    group.userData.pickable = false;
    return group;
  }

  function createRunwayDeck() {
    var THREE = window.THREE;
    var group = new THREE.Group();
    group.userData.pickable = false;

    var base = new THREE.Mesh(
      new THREE.BoxGeometry(8.70, 0.060, 0.96),
      morandiMatteMaterial(0x171c1d, 0x060808, 0.98)
    );
    base.position.set(0, -0.350, 0);
    base.userData.pickable = false;
    addEdges(base, 0x555f5d, 0.16);
    group.add(base);

    var surface = new THREE.Mesh(
      new THREE.BoxGeometry(8.34, 0.010, 0.72),
      new THREE.MeshBasicMaterial({ color: 0x2a3030, transparent: true, opacity: 0.34 })
    );
    surface.position.set(0, -0.314, 0);
    surface.userData.pickable = false;
    group.add(surface);

    var axis = new THREE.Mesh(
      new THREE.BoxGeometry(7.92, 0.006, 0.018),
      new THREE.MeshBasicMaterial({ color: MORANDI.accent, transparent: true, opacity: 0.18 })
    );
    axis.position.set(0, -0.304, 0);
    axis.userData.pickable = false;
    group.add(axis);

    return group;
  }

  function createArchRunway() {
    var THREE = window.THREE;
    var group = new THREE.Group();
    group.add(createRunwayDeck());
    group.add(createModuleExhibits());
    return group;
  }

  function updateArch3dCamera() {
    var view = state.arch3d;
    if (!view || !view.camera) return;
    view.yaw = clamp(view.yaw, -0.82, 0.82);
    view.pitch = clamp(view.pitch, 0.24, 0.78);
    view.distance = clamp(view.distance, 3.4, 13.8);
    view.panX = clamp(Number(view.panX) || 0, -3.4, 3.4);
    var horizontal = Math.cos(view.pitch) * view.distance;
    view.camera.position.set(
      view.panX + Math.sin(view.yaw) * horizontal,
      Math.sin(view.pitch) * view.distance + 0.65,
      Math.cos(view.yaw) * horizontal
    );
    view.camera.lookAt(view.panX, 0.18, 0);
  }

  function resizeArch3d() {
    var view = state.arch3d;
    if (!view || !view.renderer || !view.host) return;
    var rect = view.host.getBoundingClientRect();
    var width = Math.max(1, Math.round(rect.width));
    var height = Math.max(1, Math.round(rect.height));
    view.renderer.setSize(width, height, false);
    view.camera.aspect = width / height;
    view.camera.fov = width < 520 ? 54 : (width < 760 ? 48 : 42);
    view.camera.updateProjectionMatrix();
    if (view.root) {
      var fitScale = width < 520 ? 0.50 : (width < 760 ? 0.68 : 0.86);
      view.root.scale.setScalar(fitScale);
    }
  }

  function archFlowPulseScale(t, index, total) {
    total = Math.max(1, total || 1);
    var step = 0.10;
    var cursor = (t / step) % total;
    var distance = Math.abs(cursor - index);
    distance = Math.min(distance, total - distance);
    var pulse = Math.max(0, 1 - distance);
    pulse = pulse * pulse * (3 - 2 * pulse);
    return 1 + pulse * 0.16;
  }

  function createInferenceArrow3d(length) {
    var THREE = window.THREE;
    var group = new THREE.Group();
    var safeLength = clamp(Number(length) || 0.18, 0.035, 0.30);
    var coneOnly = safeLength < 0.11;
    var headLength = coneOnly ? clamp(safeLength, 0.035, 0.072) : clamp(safeLength * 0.34, 0.052, 0.082);
    var shaftLength = Math.max(0.045, safeLength - headLength);
    var material = archMaterial(0xbda56b, 0x443516, 0.96);
    material.emissiveIntensity = 0.075;
    var shaft = null;
    if (!coneOnly) {
      shaft = new THREE.Mesh(
        new THREE.BoxGeometry(shaftLength, 0.026, 0.026),
        material
      );
      shaft.position.x = -headLength / 2;
      shaft.userData.pickable = false;
      group.add(shaft);
    }
    var head = new THREE.Mesh(
      new THREE.ConeGeometry(coneOnly ? 0.044 : 0.050, headLength, 16),
      material.clone()
    );
    head.rotation.z = -Math.PI / 2;
    head.position.x = coneOnly ? 0 : safeLength / 2 - headLength / 2;
    head.userData.pickable = false;
    group.add(head);
    if (shaft) addEdges(shaft, 0xe7d391, 0.32);
    addEdges(head, 0xe7d391, 0.28);
    group.userData.pickable = false;
    group.userData.baseScale = 1;
    group.userData.baseLength = safeLength;
    return group;
  }

  function inferenceArrowMetrics(left, right) {
    var dx = right.position.x - left.position.x;
    var startX = left.position.x + dx / 3;
    var endX = left.position.x + dx * 2 / 3;
    return {
      centerX: (startX + endX) / 2,
      length: Math.max(0.035, Math.abs(endX - startX)),
    };
  }

  function updateInferenceArrowByDistance(arrow, t, pulseIndex, total) {
    if (!arrow || !arrow.userData) return;
    var left = arrow.userData.leftItem;
    var right = arrow.userData.rightItem;
    if (!left || !right) return;
    var metrics = inferenceArrowMetrics(left, right);
    var baseLength = Math.max(0.001, Number(arrow.userData.baseLength) || metrics.length || 0.001);
    var pulse = archFlowPulseScale(t, pulseIndex, total);
    arrow.position.set(metrics.centerX, 0, 0);
    arrow.scale.lerp({ x: metrics.length / baseLength, y: pulse, z: pulse }, 0.34);
  }

  function syncInferenceArrows3d() {
    var view = state.arch3d;
    var THREE = window.THREE;
    if (!view || !view.root || !THREE) return;
    var arrowGroup = new THREE.Group();
    arrowGroup.userData.pickable = false;
    arrowGroup.visible = !state.lenetTraining;
    view.inferenceArrows = [];
    var items = view.flowPulseItems || [];
    for (var i = 0; i < items.length - 1; i += 1) {
      var left = items[i];
      var right = items[i + 1];
      if (!left || !right) continue;
      var metrics = inferenceArrowMetrics(left, right);
      var arrow = createInferenceArrow3d(metrics.length);
      arrow.position.set(metrics.centerX, 0, 0);
      arrow.userData.leftItem = left;
      arrow.userData.rightItem = right;
      arrow.userData.flowPulseIndex = i + 0.5;
      arrow.userData.baseScale = 1;
      arrowGroup.add(arrow);
      view.inferenceArrows.push(arrow);
    }
    view.inferenceArrowGroup = arrowGroup;
    view.root.add(arrowGroup);
  }

  function recalculateInferenceArrows3d() {
    var view = state.arch3d;
    if (!view || !view.root) return;
    if (view.inferenceArrowGroup) {
      view.root.remove(view.inferenceArrowGroup);
    }
    view.inferenceArrows = [];
    view.inferenceArrowGroup = null;
    syncInferenceArrows3d();
  }

  function syncArch3d() {
    var view = state.arch3d;
    var THREE = window.THREE;
    if (!view || !view.ready || !THREE) return;
    while (view.root.children.length) view.root.remove(view.root.children[0]);
    view.modules = [];
    view.pickables = [];
    view.archModuleSlots = [];
    view.trainingFlows = [];
    view.trainingFlowGroup = null;
    view.headInputFlow = null;
    view.flowPulseItems = [];
    view.featureMaps = [];
    view.inferenceArrows = [];
    view.inferenceArrowGroup = null;
    view.headGroup = null;
    var shapeEntries = archShapes();
    var total = state.architecture.length * 2 + 2;
    var spacing = clamp(7.8 / Math.max(1, total - 1), 0.46, 0.82);
    view.archModuleSpacing = spacing * 2;
    var startX = -((total - 1) * spacing) / 2;
    var positions = [];
    for (var i = 0; i < total; i += 1) {
      positions.push(new THREE.Vector3(startX + i * spacing, 0, 0));
    }
    var input = createInput3d();
    input.position.copy(positions[0]);
    var boundaryGroups = [input];
    input.userData.flowPulseIndex = view.flowPulseItems.length;
    input.userData.flowPulseKind = 'display';
    view.flowPulseItems.push(input);
    view.root.add(input);
    state.architecture.forEach(function (layer, index) {
      var entry = shapeEntries[index];
      var modulePositionIndex = index * 2 + 1;
      var featurePositionIndex = index * 2 + 2;
      var group = layer.kind === 'pool' ? createPool3d(layer, index, entry) : createConv3d(layer, index, entry);
      group.position.copy(positions[modulePositionIndex]);
      group.userData.baseX = positions[modulePositionIndex].x;
      group.userData.baseY = 0;
      group.userData.flowPulseIndex = view.flowPulseItems.length;
      group.userData.flowPulseKind = 'module';
      view.flowPulseItems.push(group);
      view.archModuleSlots[index] = positions[modulePositionIndex].x;
      if (index === state.archSelectedIndex) group.scale.setScalar(1.1);
      view.modules.push(group);
      group.traverse(function (child) {
        if (child.isMesh && child.userData.draggable === true) view.pickables.push(child);
      });
      view.root.add(group);
      var featureMap = createFeatureMap3d(entry && entry.shape ? entry.shape : null, index + 1);
      featureMap.position.copy(positions[featurePositionIndex]);
      featureMap.userData.flowPulseIndex = view.flowPulseItems.length;
      featureMap.userData.flowPulseKind = 'display';
      view.flowPulseItems.push(featureMap);
      view.featureMaps.push(featureMap);
      boundaryGroups[index + 1] = featureMap;
      view.root.add(featureMap);
    });
    var finalShape = shapeEntries.length ? shapeEntries[shapeEntries.length - 1].shape : { h: IMAGE_HEIGHT, w: IMAGE_WIDTH, c: 3 };
    var head = createHead3d(finalShape);
    head.position.copy(positions[positions.length - 1]);
    head.position.x -= 0.20;
    head.userData.flowPulseIndex = view.flowPulseItems.length;
    head.userData.flowPulseKind = 'display';
    view.flowPulseItems.push(head);
    view.headGroup = head;
    view.root.add(head);
    recalculateInferenceArrows3d();
    syncConvTrainingFlows(shapeEntries, boundaryGroups);
    syncHeadInputTrainingFlow(boundaryGroups[boundaryGroups.length - 1], head, finalShape);
    disableArchFrustumCulling(view.root);
    view.hoverIndex = -1;
    view.dragTargetIndex = -1;
    updateArch3dCamera();
    resizeArch3d();
    applyConvKernelStats();
  }

  function setArchModuleHighlight(group, strength) {
    group.traverse(function (child) {
      if (child.userData && child.userData.edgeLine && child.material) {
        child.material.color.setHex(strength > 0.001 ? 0xf0c66f : child.userData.baseEdgeColor);
        child.material.opacity = strength > 0.001
          ? (strength > 0.10 ? 0.92 : 0.72)
          : child.userData.baseEdgeOpacity;
        return;
      }
      var material = child && child.material;
      if (!material || typeof material.emissiveIntensity !== 'number') return;
      if (child.userData.baseEmissiveIntensity === undefined) {
        child.userData.baseEmissiveIntensity = material.emissiveIntensity;
      }
      material.emissiveIntensity = child.userData.baseEmissiveIntensity + strength;
    });
  }

  function animateArch3d() {
    var view = state.arch3d;
    if (!view || !view.ready) return;
    var t = view.clock.getElapsedTime();
    var pulseTotal = view.flowPulseItems && view.flowPulseItems.length ? view.flowPulseItems.length : Math.max(1, view.modules.length);
    view.modules.forEach(function (group, index) {
      var isDragged = view.mode === 'layer' && view.dragIndex === index;
      var isHovered = !view.mode && view.hoverIndex === index;
      var isSelected = index === state.archSelectedIndex;
      var bob = Math.sin(t * 1.45 + index * 0.74) * 0.026;
      var targetY = bob + (isDragged ? 0.24 : (isHovered ? 0.075 : 0));
      var flowScale = archFlowPulseScale(t, Number(group.userData.flowPulseIndex) || index, pulseTotal);
      var targetScale = (isDragged ? 1.16 : (isSelected ? 1.08 + Math.sin(t * 3.2) * 0.020 : (isHovered ? 1.055 : 1))) * flowScale;
      if (!isDragged && Number.isFinite(group.userData.baseX)) {
        group.position.x += (group.userData.baseX - group.position.x) * 0.18;
      }
      group.position.y += (targetY - group.position.y) * (isDragged ? 0.34 : 0.20);
      group.scale.lerp({ x: targetScale, y: targetScale, z: targetScale }, 0.34);
      setArchModuleHighlight(group, isDragged ? 0.13 : (isHovered ? 0.075 : 0));
    });
    if (view.flowPulseItems && view.flowPulseItems.length) {
      view.flowPulseItems.forEach(function (group, index) {
        if (!group || group.userData.flowPulseKind === 'module') return;
        var targetScale = archFlowPulseScale(t, index, view.flowPulseItems.length);
        group.scale.lerp({ x: targetScale, y: targetScale, z: targetScale }, 0.34);
      });
    }
    if (view.inferenceArrowGroup) {
      view.inferenceArrowGroup.visible = !state.lenetTraining;
    }
    if (view.inferenceArrows && view.inferenceArrows.length) {
      var arrowTotal = view.flowPulseItems && view.flowPulseItems.length ? view.flowPulseItems.length : view.inferenceArrows.length;
      view.inferenceArrows.forEach(function (arrow, index) {
        var pulseIndex = Number(arrow.userData.flowPulseIndex);
        if (!Number.isFinite(pulseIndex)) pulseIndex = index + 0.5;
        updateInferenceArrowByDistance(arrow, t, pulseIndex, arrowTotal);
      });
    }
    animateConvKernelTrainingColors(t);
    animateFeatureMapTrainingFrames(t);
    animateConvTrainingFlows(t);
    animateHeadInputTrainingFlow(t);
    animateHeadTrainingPulse(t);
    view.renderer.render(view.scene, view.camera);
    view.raf = window.requestAnimationFrame(animateArch3d);
  }

  function archPointerFromEvent(event) {
    var view = state.arch3d;
    var rect = view.renderer.domElement.getBoundingClientRect();
    view.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    view.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function archLayerScreenBounds(layerIndex) {
    var view = state.arch3d;
    var THREE = window.THREE;
    var group = view && view.modules ? view.modules[layerIndex] : null;
    if (!view || !group || !THREE) return null;
    var rect = view.renderer.domElement.getBoundingClientRect();
    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;
    var hasBounds = false;
    view.camera.updateMatrixWorld();
    group.updateMatrixWorld(true);
    group.traverse(function (child) {
      if (!child.isMesh || child.userData.draggable !== true || !child.geometry) return;
      if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
      var box = child.geometry.boundingBox;
      if (!box) return;
      var corners = [
        [box.min.x, box.min.y, box.min.z],
        [box.min.x, box.min.y, box.max.z],
        [box.min.x, box.max.y, box.min.z],
        [box.min.x, box.max.y, box.max.z],
        [box.max.x, box.min.y, box.min.z],
        [box.max.x, box.min.y, box.max.z],
        [box.max.x, box.max.y, box.min.z],
        [box.max.x, box.max.y, box.max.z],
      ];
      corners.forEach(function (corner) {
        var point = new THREE.Vector3(corner[0], corner[1], corner[2]);
        point.applyMatrix4(child.matrixWorld).project(view.camera);
        var x = rect.left + (point.x + 1) * rect.width / 2;
        var y = rect.top + (1 - point.y) * rect.height / 2;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        hasBounds = true;
      });
    });
    if (!hasBounds) return null;
    return { left: minX - 2, top: minY - 2, right: maxX + 2, bottom: maxY + 2 };
  }

  function pointerInsideArchLayer(layerIndex, event) {
    var bounds = archLayerScreenBounds(layerIndex);
    return !!bounds
      && event.clientX >= bounds.left
      && event.clientX <= bounds.right
      && event.clientY >= bounds.top
      && event.clientY <= bounds.bottom;
  }

  function pickArchLayer(event) {
    var view = state.arch3d;
    if (!view || !view.pickables || !view.pickables.length) return -1;
    archPointerFromEvent(event);
    view.raycaster.setFromCamera(view.pointer, view.camera);
    var hits = view.raycaster.intersectObjects(view.pickables, false);
    for (var i = 0; i < hits.length; i += 1) {
      var object = hits[i] && hits[i].object;
      if (!object || object.userData.draggable !== true) continue;
      var layerIndex = object.userData.layerIndex;
      if (Number.isInteger(layerIndex) && layerIndex >= 0) return layerIndex;
    }
    return -1;
  }

  function beginArchLayerDragPlane(group, event) {
    var view = state.arch3d;
    var THREE = window.THREE;
    if (!view || !group || !THREE) return;
    var worldPoint = new THREE.Vector3();
    var normal = new THREE.Vector3();
    group.updateMatrixWorld(true);
    group.getWorldPosition(worldPoint);
    view.camera.getWorldDirection(normal);
    view.dragPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, worldPoint);
    var rootPoint = archRootPointOnDragPlane(event);
    view.dragPointerOffsetX = rootPoint ? group.position.x - rootPoint.x : 0;
  }

  function archRootPointOnDragPlane(event) {
    var view = state.arch3d;
    var THREE = window.THREE;
    if (!view || !view.dragPlane || !THREE) return null;
    archPointerFromEvent(event);
    view.raycaster.setFromCamera(view.pointer, view.camera);
    var worldPoint = new THREE.Vector3();
    if (!view.raycaster.ray.intersectPlane(view.dragPlane, worldPoint)) return null;
    view.root.updateMatrixWorld(true);
    return view.root.worldToLocal(worldPoint);
  }

  function initArch3d() {
    var host = $('arch3dScene');
    if (!host) return;
    var fallback = $('arch3dFallback');
    if (!window.THREE) {
      if (fallback) fallback.hidden = false;
      return;
    }
    var THREE = window.THREE;
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding || renderer.outputEncoding;
    if (THREE.ACESFilmicToneMapping) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.82;
    }
    host.replaceChildren(renderer.domElement);
    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0b0d10, 8.6, 15.8);
    var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
    var root = new THREE.Group();
    scene.add(root);
    scene.add(new THREE.HemisphereLight(0xd7d1c4, 0x050607, 0.56));
    var key = new THREE.DirectionalLight(0xf5efe2, 1.08);
    key.position.set(-3.4, 5.8, 4.2);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0x87939a, 0.48);
    rim.position.set(4, 2, -3);
    scene.add(rim);
    var lowWarm = new THREE.PointLight(0xc4a972, 0.42, 7.2);
    lowWarm.position.set(-2.8, -0.18, 1.8);
    scene.add(lowWarm);
    var runway = createArchRunway();
    disableArchFrustumCulling(runway);
    scene.add(runway);
    state.arch3d = {
      ready: true,
      host: host,
      scene: scene,
      camera: camera,
      renderer: renderer,
      root: root,
      runway: runway,
      clock: new THREE.Clock(),
      raycaster: new THREE.Raycaster(),
      pointer: new THREE.Vector2(),
      modules: [],
      pickables: [],
      archModuleSlots: [],
      archModuleSpacing: 1,
      flowPulseItems: [],
      inferenceArrows: [],
      inferenceArrowGroup: null,
      trainingFlows: [],
      trainingFlowGroup: null,
      headInputFlow: null,
      headGroup: null,
      yaw: -0.24,
      pitch: 0.50,
      distance: 7.2,
      panX: 0,
      spacePan: false,
      panStartX: 0,
      panStartValue: 0,
      panWorldPerPixel: 0.008,
      mode: null,
      startX: 0,
      startY: 0,
      dragIndex: -1,
      dragStartWorldX: 0,
      dragPlane: null,
      dragPointerOffsetX: 0,
      dragWorldPerPixel: 0.006,
      dragTargetIndex: -1,
      hoverIndex: -1,
    };
    renderer.domElement.addEventListener('pointerdown', function (event) {
      var view = state.arch3d;
      if (!view) return;
      var layerIndex = (view.spacePan || architectureEditingDisabled()) ? -1 : pickArchLayer(event);
      view.startX = event.clientX;
      view.startY = event.clientY;
      view.dragIndex = layerIndex;
      if (view.spacePan) {
        view.mode = 'pan';
        view.hoverIndex = -1;
        view.panStartX = event.clientX;
        view.panStartValue = Number(view.panX) || 0;
        view.panWorldPerPixel = clamp((view.distance || 7.2) * 0.00115, 0.0045, 0.015);
        renderer.domElement.style.cursor = 'grabbing';
      } else if (layerIndex >= 0) {
        view.mode = 'layer';
        view.hoverIndex = -1;
        view.dragTargetIndex = layerIndex;
        var dragGroup = view.modules[layerIndex];
        view.dragStartWorldX = dragGroup ? dragGroup.position.x : 0;
        beginArchLayerDragPlane(dragGroup, event);
        renderer.domElement.style.cursor = 'grabbing';
        selectArchitectureLayer(layerIndex);
      } else {
        view.mode = 'orbit';
        if (!architectureEditingDisabled()) selectArchitectureLayer(-1);
        renderer.domElement.style.cursor = 'grabbing';
      }
      if (renderer.domElement.setPointerCapture) renderer.domElement.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    renderer.domElement.addEventListener('pointermove', function (event) {
      var view = state.arch3d;
      if (!view) return;
      if (!view.mode) {
        if (view.spacePan) {
          view.hoverIndex = -1;
          renderer.domElement.style.cursor = 'grab';
          return;
        }
        var hoverIndex = architectureEditingDisabled() ? -1 : pickArchLayer(event);
        view.hoverIndex = hoverIndex;
        renderer.domElement.style.cursor = hoverIndex >= 0 ? 'grab' : 'default';
        return;
      }
      if (view.mode === 'orbit') {
        view.yaw += (event.clientX - view.startX) * 0.006;
        view.pitch += (event.clientY - view.startY) * 0.004;
        view.startX = event.clientX;
        view.startY = event.clientY;
        updateArch3dCamera();
      } else if (view.mode === 'layer' && view.dragIndex >= 0) {
        var group = view.modules[view.dragIndex];
        if (group) {
          var rootPoint = archRootPointOnDragPlane(event);
          if (rootPoint) {
            group.position.x = rootPoint.x + (Number(view.dragPointerOffsetX) || 0);
          } else {
            var delta = event.clientX - view.startX;
            group.position.x = view.dragStartWorldX + delta * view.dragWorldPerPixel;
          }
          var slotDelta = Math.round((group.position.x - view.dragStartWorldX) / Math.max(0.001, view.archModuleSpacing || 1));
          view.dragTargetIndex = clamp(view.dragIndex + slotDelta, 0, state.architecture.length - 1);
        }
      } else if (view.mode === 'pan') {
        view.panX = view.panStartValue - (event.clientX - view.panStartX) * view.panWorldPerPixel;
        updateArch3dCamera();
      }
      event.preventDefault();
    });
    renderer.domElement.addEventListener('pointerup', function (event) {
      var view = state.arch3d;
      if (!view) return;
      if (view.mode === 'layer' && view.dragIndex >= 0) {
        var target = Number.isInteger(view.dragTargetIndex) && view.dragTargetIndex >= 0
          ? view.dragTargetIndex
          : clamp(view.dragIndex, 0, state.architecture.length - 1);
        reorderArchitectureLayer(view.dragIndex, target);
      }
      view.mode = null;
      view.dragIndex = -1;
      view.dragTargetIndex = -1;
      view.dragPlane = null;
      view.dragPointerOffsetX = 0;
      view.hoverIndex = view.spacePan ? -1 : pickArchLayer(event);
      renderer.domElement.style.cursor = view.spacePan ? 'grab' : (view.hoverIndex >= 0 ? 'grab' : 'default');
      if (renderer.domElement.releasePointerCapture) renderer.domElement.releasePointerCapture(event.pointerId);
      event.preventDefault();
    });
    renderer.domElement.addEventListener('pointerleave', function () {
      var view = state.arch3d;
      if (!view || view.mode) return;
      view.hoverIndex = -1;
      renderer.domElement.style.cursor = view.spacePan ? 'grab' : 'default';
    });
    function isEditableKeyTarget(target) {
      if (!target) return false;
      var tag = target.tagName ? target.tagName.toLowerCase() : '';
      return tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button' || target.isContentEditable;
    }
    window.addEventListener('keydown', function (event) {
      var view = state.arch3d;
      if (!view || (event.code !== 'Space' && event.key !== ' ')) return;
      if (isEditableKeyTarget(event.target)) return;
      view.spacePan = true;
      view.hoverIndex = -1;
      if (!view.mode && view.renderer && view.renderer.domElement) {
        view.renderer.domElement.style.cursor = 'grab';
      }
      event.preventDefault();
    });
    window.addEventListener('keyup', function (event) {
      var view = state.arch3d;
      if (!view || (event.code !== 'Space' && event.key !== ' ')) return;
      if (isEditableKeyTarget(event.target)) return;
      view.spacePan = false;
      if (!view.mode && view.renderer && view.renderer.domElement) {
        view.renderer.domElement.style.cursor = 'default';
      }
      event.preventDefault();
    });
    renderer.domElement.addEventListener('wheel', function (event) {
      var view = state.arch3d;
      if (!view) return;
      view.distance += event.deltaY * 0.006;
      updateArch3dCamera();
      event.preventDefault();
    }, { passive: false });
    host.addEventListener('dragover', function (event) {
      if (architectureEditingDisabled()) return;
      if (state.archDrag && state.archDrag.source === 'palette') {
        host.classList.add('is-over');
        event.preventDefault();
      }
    });
    host.addEventListener('dragleave', function (event) {
      if (!event.currentTarget.contains(event.relatedTarget)) host.classList.remove('is-over');
    });
    host.addEventListener('drop', function (event) {
      if (architectureEditingDisabled()) return;
      if (state.archDrag && state.archDrag.source === 'palette') {
        addArchitectureLayer(state.archDrag.kind, state.architecture.length);
        state.archDrag = null;
        host.classList.remove('is-over');
        event.preventDefault();
      }
    });
    window.addEventListener('resize', resizeArch3d);
    if (window.ResizeObserver) {
      state.arch3d.resizeObserver = new ResizeObserver(resizeArch3d);
      state.arch3d.resizeObserver.observe(host);
    }
    updateArch3dCamera();
    resizeArch3d();
    animateArch3d();
  }

  function renderArchitecture() {
    var host = $('archSequence');
    var head = $('archHeadSummary');
    var disabled = architectureEditingDisabled();
    if (!host) return;
    var shapes = archShapes();
    host.replaceChildren();
    if (!shapes.length) {
      var empty = document.createElement('div');
      empty.className = 'face-arch-empty';
      empty.textContent = '只保留分类头';
      host.appendChild(empty);
    }
    shapes.forEach(function (entry, index) {
      var layer = entry.layer;
      var node = document.createElement('article');
      node.className = 'face-arch-layer is-' + layer.kind;
      node.draggable = !disabled;
      node.dataset.index = String(index);
      node.title = (layer.kind === 'pool'
        ? (layer.pool_type === 'avg' ? 'AvgPool ' : 'MaxPool ') + '2×2 / stride 2 -> '
        : '3×3 / ' + layer.out_channels + ' channels -> ') + formatArchShape(entry.shape);
      node.innerHTML = ''
        + '<span>' + (layer.kind === 'pool' ? (layer.pool_type === 'avg' ? 'AvgPool' : 'MaxPool') : 'Conv') + '</span>'
        + '<strong>' + (layer.kind === 'pool' ? 'x1/2' : (layer.out_channels + 'ch')) + '</strong>';
      var remove = document.createElement('button');
      remove.className = 'face-arch-remove';
      remove.type = 'button';
      remove.disabled = disabled;
      remove.setAttribute('aria-label', '删除此层');
      remove.textContent = '×';
      remove.addEventListener('click', function () {
        if (architectureEditingDisabled()) return;
        state.architecture.splice(index, 1);
        markArchitectureDirty();
        renderArchitecture();
      });
      node.appendChild(remove);
      node.addEventListener('dragstart', function (event) {
        if (architectureEditingDisabled()) {
          event.preventDefault();
          return;
        }
        state.archDrag = { source: 'sequence', index: index };
        node.classList.add('is-dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', JSON.stringify(state.archDrag));
      });
      node.addEventListener('dragend', function () {
        state.archDrag = null;
        node.classList.remove('is-dragging');
        host.classList.remove('is-over');
      });
      host.appendChild(node);
    });
    if (head) head.textContent = '分类';
    if (state.archSelectedIndex >= state.architecture.length) state.archSelectedIndex = state.architecture.length - 1;
    updateArchitectureSelectionUi();
    syncArch3d();
  }

  function architectureDropIndex(event) {
    var sequence = $('archSequence');
    var nodes = Array.prototype.slice.call(sequence ? sequence.querySelectorAll('.face-arch-layer') : []);
    for (var index = 0; index < nodes.length; index += 1) {
      var rect = nodes[index].getBoundingClientRect();
      if (event.clientY < rect.top - 6) return index;
      if (event.clientY <= rect.bottom + 6 && event.clientX < rect.left + rect.width / 2) return index;
    }
    return state.architecture.length;
  }

  function addArchitectureLayer(kind, index, options) {
    if (architectureEditingDisabled()) return;
    options = options || {};
    var layer = makeArchLayer(kind, {
      name: kind === 'pool' ? 'Pool ' + (state.architecture.filter(function (item) { return item.kind === 'pool'; }).length + 1) : 'Conv ' + (state.architecture.filter(function (item) { return item.kind === 'conv'; }).length + 1),
      out_channels: kind === 'conv'
        ? (options.out_channels || [8, 16, 32, 64][Math.min(3, state.architecture.filter(function (item) { return item.kind === 'conv'; }).length)])
        : undefined,
      pool_type: options.pool_type === 'avg' ? 'avg' : 'max',
    });
    state.architecture.splice(Math.max(0, Math.min(index, state.architecture.length)), 0, layer);
    state.archSelectedIndex = Math.max(0, Math.min(index, state.architecture.length - 1));
    markArchitectureDirty();
    renderArchitecture();
  }

  function applyArchitectureEditor() {
    if (architectureEditingDisabled()) return;
    var values = archEditorValues();
    var selected = archEditorSelectedLayer();
    if (!selected) {
      addArchitectureLayer(values.kind, state.architecture.length, values);
      return;
    }
    var replacementName = selected.kind === values.kind
      ? selected.name
      : (values.kind === 'pool'
        ? 'Pool ' + (state.architecture.filter(function (item, index) { return index !== state.archSelectedIndex && item.kind === 'pool'; }).length + 1)
        : 'Conv ' + (state.architecture.filter(function (item, index) { return index !== state.archSelectedIndex && item.kind === 'conv'; }).length + 1));
    var replacement = makeArchLayer(values.kind, {
      name: replacementName,
      out_channels: values.out_channels,
      pool_type: values.pool_type,
    });
    replacement.id = selected.id;
    state.architecture[state.archSelectedIndex] = replacement;
    markArchitectureDirty();
    renderArchitecture();
  }

  function moveArchitectureLayer(from, to) {
    if (architectureEditingDisabled()) return;
    if (from < 0 || from >= state.architecture.length) return;
    var target = from < to ? to - 1 : to;
    reorderArchitectureLayer(from, Math.max(0, Math.min(target, state.architecture.length - 1)));
  }

  function resetResultForKernelChange(message) {
    state.result = null;
    state.preview = null;
    state.sampleIndex = 0;
    clearFirstActContinueCue();
    $('trainStatus').textContent = '等待重新训练';
    $('trainAcc').textContent = '-';
    renderValidationMetric(null);
    setReadout(message);
    renderKernelControls();
    renderSample();
    schedulePreview();
  }

  function addKernel(id) {
    if (state.selectedKernels.indexOf(id) >= 0) {
      state.activeFeatureKernel = id;
      renderKernelControls();
      renderSample();
      return;
    }
    state.selectedKernels.push(id);
    state.activeFeatureKernel = id;
    resetResultForKernelChange('卷积核组合已改变。重新训练分类头，观察验证集准确率会不会上升。');
  }

  function removeKernel(id) {
    if (state.selectedKernels.length <= 1) {
      setReadout('至少保留一个固定卷积核。');
      return;
    }
    state.selectedKernels = state.selectedKernels.filter(function (item) { return item !== id; });
    if (state.activeFeatureKernel === id) state.activeFeatureKernel = state.selectedKernels[0];
    resetResultForKernelChange('卷积核组合已改变。固定特征越少，分类头能读到的信息也越少。');
  }

  function toggleKernel(id) {
    if (state.selectedKernels.indexOf(id) >= 0) removeKernel(id);
    else addKernel(id);
  }

  function resetKernels() {
    state.selectedKernels = KERNELS.map(function (kernel) { return kernel.id; });
    state.activeFeatureKernel = 'edge';
    resetResultForKernelChange('已恢复默认卷积核组合。');
  }

  function clearFirstActContinueCue() {
    var host = $('firstActContinueCue');
    if (host) host.hidden = true;
  }

  function revealSecondAct() {
    var secondAct = $('faceAct2');
    if (!secondAct) return;
    state.unlockedAct = Math.max(state.unlockedAct, 2);
    clearFirstActContinueCue();
    secondAct.hidden = false;
    secondAct.classList.remove('is-locked');
    secondAct.classList.add('is-revealing');
    secondAct.setAttribute('aria-hidden', 'false');
    window.requestAnimationFrame(function () {
      window.dispatchEvent(new Event('resize'));
      drawLenetHistory();
      secondAct.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    window.setTimeout(function () { secondAct.classList.remove('is-revealing'); }, 440);
  }

  function revealThirdAct() {
    var thirdAct = $('faceAct3');
    if (!thirdAct || state.unlockedAct >= 3) return;
    state.unlockedAct = 3;
    thirdAct.classList.remove('is-locked');
    thirdAct.classList.add('is-revealing');
    thirdAct.setAttribute('aria-hidden', 'false');
    window.requestAnimationFrame(function () {
      window.dispatchEvent(new Event('resize'));
      thirdAct.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    window.setTimeout(function () { thirdAct.classList.remove('is-revealing'); }, 440);
  }

  function showFirstActContinueCue() {
    if (state.unlockedAct >= 2) return;
    var host = $('firstActContinueCue');
    if (host) host.hidden = false;
  }

  function confirmFirstActContinueCue() {
    var cue = $('firstActContinueCue');
    if (!cue || cue.hidden || state.unlockedAct >= 2) return;
    revealSecondAct();
  }

  function renderKernelGrid(host, kernel) {
    host.replaceChildren();
    kernel.values.forEach(function (row) {
      row.forEach(function (value) {
        var cell = document.createElement('div');
        cell.className = 'face-kernel-cell' + (value > 0 ? ' is-positive' : (value < 0 ? ' is-negative' : ' is-zero'));
        cell.textContent = String(value);
        host.appendChild(cell);
      });
    });
  }

  function showKernelPopover(kernel, event) {
    var popover = $('kernelPopover');
    if (!popover) return;
    popover.hidden = false;
    popover.innerHTML = '<strong>' + kernel.name + '</strong><div class="face-kernel-grid"></div>';
    renderKernelGrid(popover.querySelector('.face-kernel-grid'), kernel);
    moveKernelPopover(event);
  }

  function moveKernelPopover(event) {
    var popover = $('kernelPopover');
    if (!popover || popover.hidden) return;
    var left = Math.min(window.innerWidth - 188, event.clientX + 14);
    var top = Math.min(window.innerHeight - 188, event.clientY + 14);
    popover.style.left = Math.max(10, left) + 'px';
    popover.style.top = Math.max(10, top) + 'px';
  }

  function hideKernelPopover() {
    var popover = $('kernelPopover');
    if (popover) popover.hidden = true;
  }

  function renderKernelControls() {
    var palette = $('kernelPalette');
    palette.replaceChildren();
    KERNELS.forEach(function (kernel) {
      var selected = state.selectedKernels.indexOf(kernel.id) >= 0;
      var tab = document.createElement('label');
      tab.className = 'edu-check edu-check--option';
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = selected;
      input.addEventListener('change', function () { toggleKernel(kernel.id); });
      var name = document.createElement('span');
      name.textContent = kernel.name;
      tab.appendChild(input);
      tab.appendChild(name);
      tab.addEventListener('mouseenter', function (event) { showKernelPopover(kernel, event); });
      tab.addEventListener('mousemove', moveKernelPopover);
      tab.addEventListener('mouseleave', hideKernelPopover);
      palette.appendChild(tab);
    });
    renderActiveKernelPicker(featureMapIds(currentSample()));
  }

  function renderActiveKernelPicker(ids) {
    var active = $('activeKernels');
    if (!active) return;
    ids = ids && ids.length ? ids.slice() : state.selectedKernels.slice();
    if (ids.indexOf(state.activeFeatureKernel) < 0) state.activeFeatureKernel = ids[0] || 'edge';
    var activeIndex = activeFeatureIndex(ids);
    active.replaceChildren();
    active.tabIndex = 0;
    active.setAttribute('role', 'slider');
    active.setAttribute('aria-orientation', 'vertical');
    active.setAttribute('aria-valuemin', '1');
    active.setAttribute('aria-valuemax', String(Math.max(1, ids.length)));
    active.setAttribute('aria-valuenow', String(activeIndex + 1));
    active.setAttribute('aria-valuetext', kernelById(state.activeFeatureKernel).name);
    ids.forEach(function (id, index) {
      var kernel = kernelById(id);
      var offset = index - activeIndex;
      var distance = Math.abs(offset);
      var tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'face-active-kernel'
        + (distance === 0 ? ' is-active' : '')
        + (distance === 1 ? ' is-near' : '')
        + (distance > 2 ? ' is-far' : '');
      tab.textContent = kernel.name;
      tab.style.setProperty('--picker-y', (offset * PICKER_ROW_HEIGHT) + 'px');
      tab.style.setProperty('--picker-scale', String(Math.max(0.90, 1 - Math.min(distance, 3) * 0.035)));
      tab.style.setProperty('--picker-opacity', String(distance === 0 ? 1 : (distance === 1 ? 0.46 : (distance === 2 ? 0.20 : 0))));
      tab.setAttribute('aria-current', distance === 0 ? 'true' : 'false');
      tab.tabIndex = distance === 0 ? 0 : -1;
      tab.addEventListener('click', function () {
        if (state.featurePickerMoved) return;
        setActiveFeatureIndex(index, true);
      });
      tab.addEventListener('mouseenter', function (event) { showKernelPopover(kernel, event); });
      tab.addEventListener('mousemove', moveKernelPopover);
      tab.addEventListener('mouseleave', hideKernelPopover);
      active.appendChild(tab);
    });
  }

  function prepareCanvas(canvas, fill) {
    if (window.DLCanvas && window.DLCanvas.prepare) {
      var ctx = window.DLCanvas.prepare(canvas);
      var size = window.DLCanvas.size(canvas);
      ctx.clearRect(0, 0, size.width, size.height);
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fillRect(0, 0, size.width, size.height);
      }
      return { ctx: ctx, width: size.width, height: size.height };
    }
    var rect = canvas.getBoundingClientRect();
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    var width = Math.max(1, Math.round(rect.width || canvas.width / ratio));
    var height = Math.max(1, Math.round(rect.height || canvas.height / ratio));
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    var ctxFallback = canvas.getContext('2d');
    ctxFallback.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctxFallback.clearRect(0, 0, width, height);
    if (fill) {
      ctxFallback.fillStyle = fill;
      ctxFallback.fillRect(0, 0, width, height);
    }
    return { ctx: ctxFallback, width: width, height: height };
  }

  function heatmapColor(value) {
    var t = Math.max(0, Math.min(1, value));
    var from;
    var to;
    var local;
    if (t < 0.5) {
      local = t / 0.5;
      from = [226, 233, 241];
      to = [93, 139, 184];
    } else {
      local = (t - 0.5) / 0.5;
      from = [93, 139, 184];
      to = [217, 119, 63];
    }
    var r = Math.round(from[0] + (to[0] - from[0]) * local);
    var g = Math.round(from[1] + (to[1] - from[1]) * local);
    var b = Math.round(from[2] + (to[2] - from[2]) * local);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function drawMatrix(canvas, matrix, options) {
    if (!canvas) return;
    options = options || {};
    var prepared = prepareCanvas(canvas, options.background || '#0b1020');
    var ctx = prepared.ctx;
    var width = prepared.width;
    var height = prepared.height;
    var rows = matrix && matrix.length ? matrix.length : IMAGE_HEIGHT;
    var cols = rows && matrix[0] ? matrix[0].length : IMAGE_WIDTH;
    var margin = options.margin == null ? Math.max(8, Math.min(width, height) * 0.04) : options.margin;
    var cell = Math.min((width - margin * 2) / cols, (height - margin * 2) / rows);
    var gap = options.gap || 0;
    var originX = (width - cell * cols) / 2;
    var originY = (height - cell * rows) / 2;
    var max = options.max == null ? 1 : options.max;
    ctx.fillStyle = options.background || '#0b1020';
    ctx.fillRect(0, 0, width, height);
    for (var row = 0; row < rows; row += 1) {
      for (var col = 0; col < cols; col += 1) {
        var value = matrix && matrix[row] ? Number(matrix[row][col] || 0) : 0;
        var alpha = Math.max(0, Math.min(1, value / max));
        if (options.gamma && alpha > 0) alpha = Math.pow(alpha, options.gamma);
        if (options.minAlpha && alpha > 0) alpha = Math.max(options.minAlpha, alpha);
        if (alpha <= 0.005) continue;
        ctx.fillStyle = options.heatmap
          ? heatmapColor(alpha)
          : (options.color
            ? options.color.replace('ALPHA', alpha.toFixed(3))
            : 'rgba(248,251,255,' + alpha.toFixed(3) + ')');
        ctx.fillRect(
          originX + col * cell + gap / 2,
          originY + row * cell + gap / 2,
          Math.max(1, Math.ceil(cell - gap)),
          Math.max(1, Math.ceil(cell - gap))
        );
      }
    }
  }

  function matrixMax(matrix) {
    var max = 0;
    if (!matrix) return 1;
    matrix.forEach(function (row) {
      row.forEach(function (value) {
        max = Math.max(max, Number(value) || 0);
      });
    });
    return Math.max(max, 0.001);
  }

  function renderFeatureScrub(sample) {
    var host = $('featureScrub');
    if (!host) return;
    host.replaceChildren();
    var ids = featureMapIds(sample);
    if (ids.indexOf(state.activeFeatureKernel) < 0) state.activeFeatureKernel = ids[0] || 'edge';
    ids.forEach(function (id) {
      var tick = document.createElement('span');
      tick.className = id === state.activeFeatureKernel ? 'is-active' : '';
      tick.textContent = kernelById(id).name;
      host.appendChild(tick);
    });
  }

  function updateFeatureDeckClasses(sample) {
    var deck = $('featureDeck');
    if (!deck) return;
    var ids = featureMapIds(sample);
    var active = activeFeatureIndex(ids);
    var count = ids.length;
    Array.prototype.forEach.call(deck.querySelectorAll('.face-feature-card'), function (card, index) {
      var offset = index - active;
      if (count > 2 && offset > count / 2) offset -= count;
      if (count > 2 && offset < -count / 2) offset += count;
      var distance = Math.abs(offset);
      card.classList.toggle('is-active', distance === 0);
      card.classList.toggle('is-near', distance === 1);
      card.classList.toggle('is-hidden', distance > 1);
      card.style.setProperty('--offset', String(Math.max(-1, Math.min(1, offset))));
      card.setAttribute('aria-hidden', distance > 1 ? 'true' : 'false');
      card.tabIndex = distance > 1 ? -1 : 0;
    });
  }

  function drawFeatureDeckCanvases(sample) {
    var deck = $('featureDeck');
    if (!deck) return;
    Array.prototype.forEach.call(deck.querySelectorAll('.face-feature-card'), function (card) {
      var id = card.getAttribute('data-feature-id');
      var canvas = card.querySelector('canvas');
      var matrix = sample && sample.feature_maps ? sample.feature_maps[id] : null;
      drawMatrix(canvas, matrix || [], {
        max: matrixMax(matrix),
        background: '#f8fafd',
        color: 'rgba(217,119,63,ALPHA)',
        gamma: 0.72,
        minAlpha: 0.12,
        margin: 8,
        gap: 1,
      });
    });
  }

  function scheduleFeatureDeckDraw(sample) {
    if (state.featureDrawRaf) window.cancelAnimationFrame(state.featureDrawRaf);
    state.featureDrawRaf = window.requestAnimationFrame(function () {
      state.featureDrawRaf = 0;
      drawFeatureDeckCanvases(sample);
    });
  }

  function renderFeatureDeck(sample) {
    var deck = $('featureDeck');
    if (!deck) return;
    var ids = featureMapIds(sample);
    var sampleKey = sample
      ? (sample.index != null ? sample.index : state.sampleIndex)
      : 'blank';
    var signature = ids.join('|') + '::' + sampleKey;
    if (deck.getAttribute('data-signature') !== signature) {
      deck.replaceChildren();
      ids.forEach(function (id, index) {
        var card = document.createElement('div');
        card.className = 'face-feature-card';
        card.setAttribute('data-feature-id', id);
        card.setAttribute('role', 'button');
        card.tabIndex = 0;
        var canvas = document.createElement('canvas');
        canvas.width = 336;
        canvas.height = 336;
        canvas.setAttribute('aria-label', kernelById(id).name + '池化后特征图');
        card.appendChild(canvas);
        card.addEventListener('click', function () {
          if (state.featureDeckMoved) return;
          setActiveFeatureIndex(index, true);
        });
        card.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setActiveFeatureIndex(index, true);
          }
        });
        deck.appendChild(card);
      });
      deck.setAttribute('data-signature', signature);
    }
    updateFeatureDeckClasses(sample);
    scheduleFeatureDeckDraw(sample);
  }

  function renderFeatureMap(sample) {
    renderFeatureScrub(sample);
    renderFeatureDeck(sample);
  }

  function setActiveFeatureIndex(index, animate) {
    var sample = currentSample();
    var ids = featureMapIds(sample);
    if (!ids.length) return;
    var nextIndex = Math.max(0, Math.min(ids.length - 1, index));
    var next = ids[nextIndex];
    if (next === state.activeFeatureKernel) return;
    state.activeFeatureKernel = next;
    if (animate) {
      var deck = $('featureDeck');
      if (deck) {
        deck.classList.remove('is-switching');
        void deck.offsetWidth;
        deck.classList.add('is-switching');
        if (state.featureSwitchTimer) window.clearTimeout(state.featureSwitchTimer);
        state.featureSwitchTimer = window.setTimeout(function () {
          deck.classList.remove('is-switching');
          state.featureSwitchTimer = 0;
        }, 220);
      }
    }
    renderActiveKernelPicker(ids);
    renderFeatureMap(sample);
    renderFlattenVector(sample);
  }

  function stepActiveFeature(step, animate) {
    var ids = featureMapIds(currentSample());
    if (ids.length <= 1) return;
    setActiveFeatureIndex(activeFeatureIndex(ids) + step, animate);
  }

  function syncFeatureBlockBrowsing(isBrowsing) {
    var block = document.querySelector('.face-feature-block');
    if (block) block.classList.toggle('is-browsing', !!isBrowsing);
  }

  function wheelFeatureMap(event) {
    var ids = featureMapIds(currentSample());
    if (ids.length <= 1) return;
    event.preventDefault();
    syncFeatureBlockBrowsing(true);
    stepActiveFeature(event.deltaY > 0 ? 1 : -1, true);
  }

  function wheelActiveKernelPicker(event) {
    var ids = featureMapIds(currentSample());
    if (ids.length <= 1) return;
    event.preventDefault();
    syncFeatureBlockBrowsing(true);
    stepActiveFeature(event.deltaY > 0 ? 1 : -1, true);
  }

  function dragFeatureDeck(event) {
    if (!state.featureDeckDragging) return;
    var ids = featureMapIds(currentSample());
    if (!ids.length) return;
    var delta = event.clientY - state.featureDeckStartY;
    if (Math.abs(delta) > 4) state.featureDeckMoved = true;
    setActiveFeatureIndex(state.featureDeckStartIndex - Math.round(delta / FEATURE_DRAG_STEP), true);
    event.preventDefault();
  }

  function renderFlattenVector(sample) {
    var host = $('flattenStrip');
    if (!host) return;
    var ids = featureMapIds(sample);
    var vectorRows = 51;
    var matrices = ids
      .map(function (id) { return { id: id, matrix: sample && sample.feature_maps ? sample.feature_maps[id] : null }; })
      .filter(function (entry) { return entry.matrix && entry.matrix.length; });
    var vectorCells = matrices.reduce(function (total, entry) {
      return total + entry.matrix.reduce(function (sum, row) { return sum + row.length; }, 0);
    }, 0);
    if (ids.indexOf(state.activeFeatureKernel) < 0) state.activeFeatureKernel = ids[0] || 'edge';
    host.replaceChildren();
    host.classList.toggle('is-active', !!vectorCells);
    host.style.setProperty('--vector-columns', String(Math.max(1, Math.ceil(vectorCells / vectorRows))));
    host.style.setProperty('--vector-rows', String(vectorRows));
    matrices.forEach(function (entry) {
      var max = matrixMax(entry.matrix);
      entry.matrix.forEach(function (row) {
        row.forEach(function (value) {
          var cell = document.createElement('span');
          var level = Math.max(0, Math.min(1, Number(value || 0) / max));
          cell.className = 'face-vector-cell' + (entry.id === state.activeFeatureKernel ? ' is-active' : '');
          cell.style.setProperty('--value', level.toFixed(3));
          host.appendChild(cell);
        });
      });
    });
  }

  function renderProbBars(sample) {
    var host = $('probBars');
    if (!host) return;
    host.replaceChildren();
    var entries = [];
    if (sample && sample.top && sample.top.length) {
      entries = sample.top.slice(0, 8);
    } else if (sample && sample.probs) {
      entries = sample.probs
        .map(function (value, index) { return { label: index, probability: value }; })
        .sort(function (a, b) { return b.probability - a.probability; })
        .slice(0, 8);
    }
    if (!entries.length) {
      entries = Array.from({ length: 8 }, function (_, index) {
        return { label: index, probability: 0 };
      });
    }
    entries.forEach(function (entry, index) {
      var row = document.createElement('div');
      var labelNumber = Number(entry.label);
      row.className = 'face-prob-row'
        + (index === 0 && sample && sample.probs ? ' is-top' : '')
        + (sample && labelNumber === sample.label ? ' is-label' : '');
      var label = document.createElement('span');
      label.textContent = displayIdentity(labelNumber, entry.name);
      label.title = label.textContent;
      var track = document.createElement('div');
      var fill = document.createElement('i');
      fill.style.width = ((Number(entry.probability) || 0) * 100).toFixed(1) + '%';
      track.appendChild(fill);
      var value = document.createElement('strong');
      value.textContent = ((Number(entry.probability) || 0) * 100).toFixed(0) + '%';
      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(value);
      host.appendChild(row);
    });
  }

  function renderLearnedFilters() {
    var host = $('learnedFilters');
    if (!host) return;
    var filters = state.lenetResult
      && state.lenetResult.network
      && state.lenetResult.network.learnable_filter_maps
      ? state.lenetResult.network.learnable_filter_maps
      : [];
    host.replaceChildren();
    if (!filters.length) {
      var empty = document.createElement('div');
      empty.className = 'face-filter-empty';
      empty.textContent = state.lenetResult ? '当前结构没有可显示的卷积核' : '训练后显示第一层 3×3 卷积核';
      host.appendChild(empty);
      return;
    }
    filters.forEach(function (matrix, index) {
      var item = document.createElement('div');
      item.className = 'face-learned-filter';
      var title = document.createElement('span');
      title.textContent = 'C1-' + (index + 1);
      var canvas = document.createElement('canvas');
      canvas.width = 88;
      canvas.height = 88;
      item.appendChild(title);
      item.appendChild(canvas);
      host.appendChild(item);
      window.requestAnimationFrame(function () {
        drawMatrix(canvas, matrix, {
          max: 1,
          background: '#f8fafd',
          heatmap: true,
          minAlpha: 0.18,
          margin: 8,
          gap: 2,
        });
      });
    });
  }

  function drawClassifier(sample) {
    var canvas = $('classifierCanvas');
    if (!canvas) return;
    var prepared = prepareCanvas(canvas, '#fbfdff');
    var ctx = prepared.ctx;
    var width = prepared.width;
    var height = prepared.height;
    var outputCount = 8;
    var probs = [];
    if (sample && sample.top && sample.top.length) {
      probs = sample.top.slice(0, outputCount).map(function (entry) { return Number(entry.probability) || 0; });
    } else {
      probs = Array.from({ length: outputCount }, function () { return 0; });
    }
    var inputCount = 5;
    var hiddenCount = 7;
    var xInput = width * 0.16;
    var xHidden = width * 0.52;
    var xOutput = width * 0.86;
    var top = height * 0.12;
    var bottom = height * 0.88;

    function yAt(index, count) {
      return count <= 1 ? height / 2 : top + (bottom - top) * index / (count - 1);
    }

    function node(x, y, radius, fill, stroke, label) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = stroke || 'rgba(39,68,110,0.22)';
      ctx.stroke();
      if (label != null) {
        ctx.fillStyle = '#1f2f49';
        ctx.font = '800 9px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(label), x, y);
      }
    }

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#fbfdff';
    ctx.fillRect(0, 0, width, height);
    for (var i = 0; i < inputCount; i += 1) {
      for (var h = 0; h < hiddenCount; h += 1) {
        ctx.strokeStyle = 'rgba(39,68,110,0.14)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xInput + 7, yAt(i, inputCount));
        ctx.lineTo(xHidden - 7, yAt(h, hiddenCount));
        ctx.stroke();
      }
    }
    for (var h2 = 0; h2 < hiddenCount; h2 += 1) {
      for (var o = 0; o < outputCount; o += 1) {
        var alpha = 0.07 + (probs[o] || 0) * 0.42;
        ctx.strokeStyle = 'rgba(31,138,104,' + alpha.toFixed(3) + ')';
        ctx.lineWidth = o === 0 && sample && sample.probs ? 1.8 : 1;
        ctx.beginPath();
        ctx.moveTo(xHidden + 7, yAt(h2, hiddenCount));
        ctx.lineTo(xOutput - 7, yAt(o, outputCount));
        ctx.stroke();
      }
    }
    for (var input = 0; input < inputCount; input += 1) {
      node(xInput, yAt(input, inputCount), 6.5, 'rgba(39,68,110,0.18)');
    }
    for (var hidden = 0; hidden < hiddenCount; hidden += 1) {
      var pulse = state.training ? (state.classifierPulse[hidden] || 0) : 0;
      node(
        xHidden,
        yAt(hidden, hiddenCount),
        7,
        state.training ? 'rgba(217,119,63,' + (0.18 + pulse * 0.58).toFixed(3) + ')' : 'rgba(217,119,63,0.18)',
        state.training ? 'rgba(217,119,63,' + (0.30 + pulse * 0.55).toFixed(3) + ')' : undefined
      );
    }
    for (var output = 0; output < outputCount; output += 1) {
      node(
        xOutput,
        yAt(output, outputCount),
        output === 0 && sample && sample.probs ? 8.5 : 6.5,
        output === 0 && sample && sample.probs ? 'rgba(217,119,63,0.86)' : 'rgba(39,68,110,0.12)',
        output === 0 && sample && sample.probs ? 'rgba(217,119,63,0.95)' : 'rgba(39,68,110,0.18)',
        output + 1
      );
    }
  }

  function drawLenetHistory() {
    var host = $('lenetHistoryChart');
    if (!host || host.clientWidth <= 0) return;
    if (!window.echarts) {
      host.textContent = '训练曲线组件加载失败';
      host.classList.add('is-chart-unavailable');
      return;
    }
    if (!state.lenetChart) state.lenetChart = window.echarts.init(host, null, { renderer: 'canvas' });
    var history = state.lenetResult && state.lenetResult.history ? state.lenetResult.history : [];
    var epochs = history.map(function (point) { return String(point.epoch || ''); });
    var hasHistory = history.length > 0;
    state.lenetChart.setOption({
      animationDuration: 520,
      color: ['#27446e', '#d9773f'],
      aria: { enabled: true, decal: { show: false } },
      title: {
        text: '训练准确率趋势',
        left: 18,
        top: 14,
        textStyle: { color: '#1f2f49', fontSize: 14, fontWeight: 800 },
      },
      legend: {
        data: ['训练集', '验证集'],
        right: 18,
        top: 12,
        itemWidth: 18,
        itemHeight: 3,
        textStyle: { color: '#58677d', fontSize: 11, fontWeight: 700 },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(24, 34, 50, 0.94)',
        borderWidth: 0,
        textStyle: { color: '#fff' },
        valueFormatter: function (value) { return (Number(value) * 100).toFixed(1) + '%'; },
      },
      grid: { left: 18, right: 24, top: 58, bottom: 18, containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: epochs,
        name: 'Epoch',
        nameLocation: 'middle',
        nameGap: 28,
        axisLine: { lineStyle: { color: '#c9d2df' } },
        axisTick: { show: false },
        axisLabel: { color: '#728096', formatter: function (value) { return 'E' + value; } },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 1,
        interval: 0.25,
        axisLabel: { color: '#728096', formatter: function (value) { return Math.round(value * 100) + '%'; } },
        splitLine: { lineStyle: { color: '#e6ebf2' } },
      },
      graphic: hasHistory ? [] : [{
        type: 'text',
        left: 'center',
        top: 'middle',
        style: { text: '训练 CNN 后显示曲线', fill: '#8793a5', font: '700 13px system-ui' },
      }],
      series: [
        {
          name: '训练集',
          type: 'line',
          smooth: 0.22,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 3 },
          areaStyle: { opacity: 0.06 },
          data: history.map(function (point) { return Number(point.train_accuracy) || 0; }),
        },
        {
          name: '验证集',
          type: 'line',
          smooth: 0.22,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 3 },
          data: history.map(function (point) { return Number(point.val_accuracy) || 0; }),
        },
      ],
    }, true);
    state.lenetChart.resize();
  }

  function mountSharedTrainingHistory(hostId, history, options) {
    var host = $(hostId);
    if (!host || !window.DLPlot || !window.DLPlot.mountTrainingHistory) return;
    history = Array.isArray(history) ? history : [];
    options = options || {};
    if (!history.length) {
      if (options.cardId && $(options.cardId)) $(options.cardId).hidden = true;
      return;
    }
    if (options.cardId && $(options.cardId)) $(options.cardId).hidden = false;
    window.DLPlot.mountTrainingHistory(host, {
      epochs: history.map(function (point) { return Number(point.epoch); }),
      loss: history.map(function (point) {
        var value = point.loss != null ? point.loss : point.train_loss;
        return Math.max(0, Number(value) || 0);
      }),
      accuracy: history.map(function (point) {
        return Math.max(0, Math.min(1, Number(point.val_accuracy) || 0));
      }),
      lossName: options.lossName || '训练损失',
      accuracyName: options.accuracyName || '验证准确率'
    });
  }

  function drawLenetHistory() {
    mountSharedTrainingHistory(
      'lenetHistoryChart',
      state.lenetResult && state.lenetResult.history ? state.lenetResult.history : [],
      { lossName: 'CNN 训练损失', accuracyName: 'CNN 验证准确率' }
    );
  }

  function setLenetTrainingResultsVisible(visible) {
    ['lenetHistoryCard', 'lenetQuizPanel'].forEach(function (id) {
      var element = $(id);
      if (!element) return;
      element.hidden = !visible;
      element.setAttribute('aria-hidden', visible ? 'false' : 'true');
      element.classList.toggle('is-revealing', visible);
    });
    if (visible) {
      window.setTimeout(function () {
        ['lenetHistoryCard', 'lenetQuizPanel'].forEach(function (id) {
          var element = $(id);
          if (element) element.classList.remove('is-revealing');
        });
      }, 440);
    }
  }

  function mountFaceQuizQuestion(id, options) {
    if (!window.DLModuleUI || !window.DLModuleUI.mountQuestion || !$(id)) return;
    var externalOnCheck = typeof options.onCheck === 'function' ? options.onCheck : null;
    var externalOnReset = typeof options.onReset === 'function' ? options.onReset : null;
    var deferScore = !!options.deferScore;
    window.DLModuleUI.mountQuestion('#' + id, Object.assign({}, options, {
      onCheck: function (result, question) {
        if (!deferScore) {
          state.quizResults[id] = !!(result && result.ok);
        }
        if (externalOnCheck) externalOnCheck(result, question);
        if (!deferScore && result && result.ok) advanceFaceQuiz(id);
      },
      onReset: function (question) {
        state.quizResults[id] = false;
        if (externalOnReset) externalOnReset(question);
      },
    }));
  }

  function showFaceQuizStep(index, shouldScroll) {
    FACE_QUIZ_IDS.forEach(function (id, itemIndex) {
      var question = $(id);
      var card = question ? question.closest('[data-face-quiz-step]') : null;
      if (!card) return;
      var visible = itemIndex === index;
      card.hidden = !visible;
      card.setAttribute('aria-hidden', visible ? 'false' : 'true');
      card.classList.remove('is-leaving');
      card.toggleAttribute('inert', !visible);
    });
    state.quizAdvancing = false;
    var nextQuestion = $(FACE_QUIZ_IDS[index]);
    var nextCard = nextQuestion ? nextQuestion.closest('[data-face-quiz-step]') : null;
    if (shouldScroll && nextCard) {
      window.requestAnimationFrame(function () {
        nextCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }

  function advanceFaceQuiz(id) {
    var index = FACE_QUIZ_IDS.indexOf(id);
    if (index < 0 || index >= FACE_QUIZ_IDS.length - 1 || state.quizAdvancing) return;
    var question = $(id);
    var card = question ? question.closest('[data-face-quiz-step]') : null;
    if (!card) return;
    state.quizAdvancing = true;
    card.setAttribute('inert', '');
    window.setTimeout(function () {
      card.classList.add('is-leaving');
      window.setTimeout(function () { showFaceQuizStep(index + 1, true); }, 260);
    }, 620);
  }

  function setQuizFeedback(question, tone, text) {
    if (window.DLModuleUI && window.DLModuleUI.streamQuestionFeedback) {
      window.DLModuleUI.streamQuestionFeedback(question, tone, text, { interval: 24 });
      return;
    }
    var feedback = question ? question.querySelector('.dl-question-feedback') : null;
    if (!feedback) return;
    var color = tone === 'correct' ? 'green' : (tone === 'wrong' ? 'red' : 'orange');
    feedback.className = 'edu-callout edu-callout--' + color + ' dl-question-feedback' + (tone ? ' is-' + tone : '');
    feedback.textContent = text || '';
    feedback.hidden = !text;
  }

  function setQuizSubmitBusy(question, busy) {
    var submit = question ? question.querySelector('.dl-question-submit') : null;
    if (!submit) return;
    submit.disabled = !!busy;
    submit.classList.toggle('is-loading', !!busy);
    submit.setAttribute('aria-busy', busy ? 'true' : 'false');
    submit.textContent = busy ? '正在分析...' : '提交回答';
  }

  async function requestFaceVerificationFeedback(answer) {
    var response = await fetch(FACE_VERIFICATION_FEEDBACK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: answer }),
    });
    var data = await response.json().catch(function () { return {}; });
    return window.DLModuleUI.requireServiceResult(response, data);
  }

  function hasCoreFaceVerificationAnswer(answer) {
    var mentionsFeature = /(特征向量|特征表示|embedding|嵌入)/i.test(answer);
    var mentionsComparison = /(相似度|余弦|距离|匹配|cosine)/i.test(answer);
    return mentionsFeature && mentionsComparison;
  }

  async function checkFaceVerificationAnswer(result, question) {
    var answer = result && Array.isArray(result.answer) ? String(result.answer[0] || '').trim() : '';
    if (!answer) {
      state.quizResults.quizFaceVerification = false;
      return;
    }
    setQuizSubmitBusy(question, true);
    setQuizFeedback(question, 'hint', '正在分析你的回答，请稍候。');
    try {
      var resultFeedback = window.DLModuleUI.shortAnswerFeedback(await requestFaceVerificationFeedback(answer));
      state.quizResults.quizFaceVerification = resultFeedback.level === 'correct';
      setQuizFeedback(question, resultFeedback.tone, resultFeedback.message);
    } catch (error) {
      state.quizResults.quizFaceVerification = false;
      setQuizFeedback(
        question,
        'wrong',
        window.DLModuleUI.friendlyErrorMessage(error)
      );
    } finally {
      setQuizSubmitBusy(question, false);
      window.setTimeout(revealThirdAct, 620);
    }
  }

  function renderFaceQuiz() {
    state.quizResults = {};
    state.quizAdvancing = false;
    mountFaceQuizQuestion('quizKernelDepth', {
      type: 'choice',
      title: '卷积核的“深度”应该等于什么？',
      options: [
        { key: 'A', value: 'class-count', label: '输出类别数' },
        { key: 'B', value: 'input-channels', label: '输入特征图的通道数' },
        { key: 'C', value: 'kernel-count', label: '卷积核的个数' },
        { key: 'D', value: 'pool-window', label: '池化窗口大小' },
      ],
      answer: 'input-channels',
      feedback: {
        correct: '正确。每个卷积核都要跨过输入的全部通道去看同一块区域。',
        wrong: '再想想：卷积核不是只看一张平面，它要覆盖输入特征图的全部通道。',
      },
    });
    mountFaceQuizQuestion('quizRgbDepth', {
      type: 'fill',
      title: '如果输入是 RGB 图像，那么第一层卷积核的深度应该是 ____。',
      blanks: [
        { label: '深度', placeholder: '数字', chars: 3 },
      ],
      answer: ['3'],
      validator: function (answer) {
        return String(answer[0] || '').trim() === '3';
      },
      feedback: {
        correct: '正确。RGB 有红、绿、蓝 3 个输入通道。',
        wrong: '提示：RGB 图像由 R、G、B 三个通道组成。',
      },
    });
    mountFaceQuizQuestion('quizKernelCount', {
      type: 'choice',
      title: '一个卷积层里，卷积核的个数决定了什么？',
      options: [
        { key: 'A', value: 'output-channels', label: '输出特征图的通道数' },
        { key: 'B', value: 'image-size', label: '输入图像的宽高' },
        { key: 'C', value: 'pool-scale', label: '池化后的缩放比例' },
        { key: 'D', value: 'epochs', label: '训练轮数' },
      ],
      answer: 'output-channels',
      feedback: {
        correct: '正确。一个卷积核通常产生一张输出特征图，所以核的个数决定输出通道数。',
        wrong: '再想想：每个卷积核都会扫出一张结果特征图。',
      },
    });
    mountFaceQuizQuestion('quizValAccuracy', {
      type: 'choice',
      title: '验证集准确率主要用来估计什么？',
      options: [
        { key: 'A', value: 'memorize', label: '模型对训练样本的拟合程度' },
        { key: 'B', value: 'generalization', label: '模型对没见过样本的泛化能力' },
        { key: 'C', value: 'future-guarantee', label: '模型在所有未来数据上的准确率保证' },
        { key: 'D', value: 'convergence-speed', label: '模型训练时损失下降的速度' },
      ],
      answer: 'generalization',
      feedback: {
        correct: '正确。验证集没有参与参数更新，因此它能估计模型面对未见样本时的泛化表现，但不能保证未来每批真实数据都达到同样准确率。',
        wrong: '再想想：验证集没参与参数更新，它用于估计泛化能力；这个结果既不是训练拟合程度，也不是未来准确率的保证。',
      },
    });
    mountFaceQuizQuestion('quizFaceVerification', {
      type: 'short',
      title: '门禁或手机刷脸通常只让你先上传一张人脸照片，之后解锁时再现场拍一张。它大概是怎么判断“这两张是不是同一个人”的？',
      rows: 4,
      submitText: '提交回答',
      deferScore: true,
      feedback: {
        sample: '正在分析你的回答，请稍候。',
        empty: '先写一点你的理解，再提交回答。',
      },
      onCheck: checkFaceVerificationAnswer,
    });
    showFaceQuizStep(0, false);
  }

  function renderSample() {
    var sample = currentSample();
    if (!sample) {
      drawMatrix($('faceCanvas'), [], { max: 1 });
      renderFeatureMap(null);
      renderFlattenVector(null);
      renderProbBars(null);
      drawClassifier(null);
      return;
    }
    $('faceIdentity').textContent = displayIdentity(sample.label, sample.name);
    drawFaceImage($('faceCanvas'), sample.image);
    renderActiveKernelPicker(featureMapIds(sample));
    renderFeatureMap(sample);
    renderFlattenVector(sample);
    renderProbBars(sample);
    drawClassifier(sample);
  }

  function drawFaceImage(canvas, image) {
    if (!canvas || !image || !image.length) {
      drawMatrix(canvas, [], { max: 1 });
      return;
    }
    var prepared = prepareCanvas(canvas, '#0b1020');
    var ctx = prepared.ctx;
    var width = prepared.width;
    var height = prepared.height;
    var rows = image.length;
    var cols = image[0] ? image[0].length : 1;
    var margin = Math.max(8, Math.min(width, height) * 0.04);
    var cell = Math.min((width - margin * 2) / cols, (height - margin * 2) / rows);
    var originX = (width - cell * cols) / 2;
    var originY = (height - cell * rows) / 2;
    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, width, height);
    for (var row = 0; row < rows; row += 1) {
      for (var col = 0; col < cols; col += 1) {
        var pixel = image[row][col] || [0, 0, 0];
        var r = Math.max(0, Math.min(255, Math.round((Number(pixel[0]) || 0) * 255)));
        var g = Math.max(0, Math.min(255, Math.round((Number(pixel[1]) || 0) * 255)));
        var b = Math.max(0, Math.min(255, Math.round((Number(pixel[2]) || 0) * 255)));
        ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
        ctx.fillRect(originX + col * cell, originY + row * cell, Math.ceil(cell), Math.ceil(cell));
      }
    }
  }

  function nextSample(step) {
    var source = currentSource();
    if (!source || !source.samples || !source.samples.length) return;
    state.sampleIndex = (state.sampleIndex + step + source.samples.length) % source.samples.length;
    renderSample();
  }

  function schedulePreview() {
    if (state.previewTimer) window.clearTimeout(state.previewTimer);
    state.previewTimer = window.setTimeout(loadPreview, 160);
  }

  async function loadPreview() {
    if (state.previewLoading) {
      state.previewQueued = true;
      return;
    }
    state.previewTimer = 0;
    state.previewLoading = true;
    try {
      var sample = currentSample();
      var response = await fetch(PREVIEW_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kernels: state.selectedKernels,
          sample_index: state.previewSampleIndex || (sample ? sample.index : undefined),
        }),
      });
      var data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || '预览服务返回失败。');
      state.preview = data.result;
      if (data.result.samples && data.result.samples[0]) {
        state.previewSampleIndex = data.result.samples[0].index;
      }
      state.sampleIndex = 0;
      if (!state.result) $('trainStatus').textContent = '特征图已就绪';
      renderSample();
    } catch (error) {
      if (!state.result) $('trainStatus').textContent = '预览不可用';
      setReadout((error && error.message ? error.message : String(error)) + ' 请先启动 scripts/lenet5_cnn_service.py。', true);
    } finally {
      state.previewLoading = false;
      if (state.previewQueued) {
        state.previewQueued = false;
        schedulePreview();
      }
    }
  }

  function randomizeClassifierPulse() {
    state.classifierPulse = Array.from({ length: 7 }, function () {
      return 0.18 + Math.random() * 0.82;
    });
    drawClassifier(currentSample());
  }

  function startClassifierPulse() {
    if (state.classifierPulseTimer) window.clearInterval(state.classifierPulseTimer);
    randomizeClassifierPulse();
    state.classifierPulseTimer = window.setInterval(randomizeClassifierPulse, 180);
  }

  function stopClassifierPulse() {
    if (state.classifierPulseTimer) {
      window.clearInterval(state.classifierPulseTimer);
      state.classifierPulseTimer = 0;
    }
    state.classifierPulse = [];
    drawClassifier(currentSample());
  }

  function setTrainingUi(running) {
    state.training = running;
    $('trainBtn').disabled = running || state.lenetTraining;
    $('trainBtn').classList.toggle('is-loading', running);
    $('trainBtn').setAttribute('aria-busy', running ? 'true' : 'false');
    $('prevSampleBtn').disabled = running || state.lenetTraining;
    $('nextSampleBtn').disabled = running || state.lenetTraining;
    if (running) startClassifierPulse();
    else stopClassifierPulse();
  }

  function setLenetTrainingUi(running) {
    state.lenetTraining = running;
    var locked = architectureEditingDisabled();
    var button = $('lenetTrainBtn');
    if (button) {
      button.disabled = locked;
      button.classList.toggle('is-loading', running);
      button.setAttribute('aria-busy', running ? 'true' : 'false');
      button.textContent = running ? '训练中...' : (state.lenetTrainingComplete ? '重新训练' : '训练 CNN');
    }
    var trainButton = $('trainBtn');
    if (trainButton) trainButton.disabled = running || state.training;
    var prevButton = $('prevSampleBtn');
    var nextButton = $('nextSampleBtn');
    if (prevButton) prevButton.disabled = running || state.training;
    if (nextButton) nextButton.disabled = running || state.training;
    ['archPresetBtn'].forEach(function (id) {
      var control = $(id);
      if (control) control.disabled = locked;
    });
    ['archKindSelect', 'archPoolTypeSelect', 'archChannelSlider', 'archApplyBtn', 'archDeleteBtn'].forEach(function (id) {
      var control = $(id);
      if (control) control.disabled = locked || (id === 'archDeleteBtn' && !archEditorSelectedLayer());
    });
    setSelectboxDisabled('archKindSelect', locked);
    setSelectboxDisabled('archPoolTypeSelect', locked);
    if (running) state.archDrag = null;
    updateArchitectureSelectionUi();
    renderArchitecture();
  }

  async function startTraining() {
    if (state.training) return;
    setTrainingUi(true);
    $('trainStatus').textContent = '后端训练中';
    $('trainAcc').textContent = '-';
    renderValidationMetric(null);
    setReadout('正在准备训练。卷积核保持固定，只训练读取固定特征的分类头。Epoch=40。');
    try {
      var signature = selectedKernelSignature();
      var response = await fetch(SERVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kernels: state.selectedKernels }),
      });
      var data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || '训练服务返回失败。');
      if (signature !== selectedKernelSignature()) return;
      state.result = data.result;
      state.preview = data.result;
      state.sampleIndex = 0;
      $('trainStatus').textContent = '训练完成';
      $('trainAcc').textContent = formatPercent(state.result.train_accuracy);
      renderValidationMetric(state.result.val_accuracy);
      setReadout(
        '固定卷积核的局限：这些卷积核由人工预先设定，无法根据人脸数据自动调整；当光照、姿态或表情发生变化时，它们提取的边缘和纹理未必足以区分身份。',
        true
      );
      renderSample();
      showFirstActContinueCue();
    } catch (error) {
      $('trainStatus').textContent = '服务不可用';
      renderValidationMetric(null);
      setReadout((error && error.message ? error.message : String(error)) + ' 请先启动 scripts/lenet5_cnn_service.py。', true);
    } finally {
      setTrainingUi(false);
    }
  }

  async function startLenetTraining() {
    if (state.lenetTraining) return;
    state.lenetTrainingComplete = false;
    setLenetTrainingResultsVisible(false);
    setLenetTrainingUi(true);
    $('lenetStatus').textContent = '训练准备中...';
    $('lenetTrainAcc').textContent = '-';
    renderLenetValidationMetric(null);
    state.lenetEpochs = LENET_DEFAULT_EPOCHS;
    try {
      var response = await fetch(LENET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epochs: state.lenetEpochs, architecture: architecturePayload(), async: true }),
      });
      var data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'CNN 训练服务返回失败。');
      var result = data.result;
      if (result && result.job_id) {
        updateLenetProgressUi(result);
        result = await pollLenetTrainingJob(result.job_id);
      }
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
    } catch (error) {
      $('lenetStatus').textContent = '训练失败';
      renderLenetValidationMetric(null);
      renderLearnedFilters();
      drawLenetHistory();
    } finally {
      setLenetTrainingUi(false);
      applyConvKernelStats();
    }
  }

  function dragActiveKernelPicker(event) {
    if (!state.featurePickerDragging) return;
    var ids = featureMapIds(currentSample());
    if (!ids.length) return;
    var delta = event.clientY - state.featurePickerStartY;
    if (Math.abs(delta) > 4) state.featurePickerMoved = true;
    setActiveFeatureIndex(state.featurePickerStartIndex - Math.round(delta / PICKER_ROW_HEIGHT), true);
    event.preventDefault();
  }

  function keyActiveKernelPicker(event) {
    var ids = featureMapIds(currentSample());
    if (ids.length <= 1) return;
    var index = activeFeatureIndex(ids);
    var nextIndex = index;
    if (event.key === 'ArrowDown') nextIndex = index + 1;
    if (event.key === 'ArrowUp') nextIndex = index - 1;
    if (event.key === 'PageDown') nextIndex = index + 2;
    if (event.key === 'PageUp') nextIndex = index - 2;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = ids.length - 1;
    if (nextIndex === index) return;
    event.preventDefault();
    setActiveFeatureIndex(nextIndex, true);
  }

  function renderAct3RelatedVideos() {
    var target = $('act3RelatedVideos');
    if (!target || !window.DLModuleUI || !window.DLModuleUI.renderRelatedVideos) return;

    target.innerHTML = window.DLModuleUI.renderRelatedVideos([
      {
        title: '人脸识别：你的脸是如何被识别出来的？',
        embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=877347877&bvid=BV1UN4y1h71g&cid=1367812704&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
      },
      {
        title: '人脸识别技术怎么认识你的脸？骗过它到底有多难？',
        embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=1851090836&bvid=BV1mW421A7Wx&cid=1452558883&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
      },
      {
        title: '【无痛线代】特征值究竟体现了矩阵的什么特征？',
        embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=1051678242&bvid=BV1TH4y1L7PV&cid=1463935475&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
      },
      {
        title: '五分钟，让你对点积的理解超越 90% 的人？',
        embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=115396141192561&bvid=BV1TWWhzrEKv&cid=33192938223&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
      }
    ], {
      title: '推荐视频',
      body: '完成乔装挑战后，用这些视频串起卷积特征、人脸表征与度量学习。',
      ariaLabel: '人脸识别模块推荐视频'
    });
    target.hidden = false;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function init() {
    state.architecture = defaultArchitecture();
    state.lenetEpochs = LENET_DEFAULT_EPOCHS;
    setLenetTrainingResultsVisible(false);
    if (window.DLModuleUI) {
      window.DLModuleUI.bindSelectboxes(document);
      window.DLModuleUI.bindInputHints(document);
    }
    renderKernelControls();
    initArch3d();
    loadDemoFaceImage();
    renderArchitecture();
    renderSample();
    renderLearnedFilters();
    drawLenetHistory();
    renderFaceQuiz();
    $('trainStatus').textContent = '加载特征图';
    schedulePreview();
    $('trainBtn').addEventListener('click', startTraining);
    $('lenetTrainBtn').addEventListener('click', startLenetTraining);
    $('prevSampleBtn').addEventListener('click', function () { nextSample(-1); });
    $('nextSampleBtn').addEventListener('click', function () { nextSample(1); });
    $('resetKernelsBtn').addEventListener('click', resetKernels);
    $('firstActContinueCue').addEventListener('click', confirmFirstActContinueCue);
    window.addEventListener('wheel', function (event) {
      if (event.deltaY > 0) confirmFirstActContinueCue();
    }, { passive: true });
    if ($('archKindSelect')) $('archKindSelect').addEventListener('change', function (event) {
      updateArchEditorFields();
      blurEventControl(event);
    });
    if ($('archPoolTypeSelect')) $('archPoolTypeSelect').addEventListener('change', function (event) {
      updateArchEditorFields();
      blurEventControl(event);
    });
    if ($('archChannelSlider')) {
      $('archChannelSlider').addEventListener('input', updateArchEditorFields);
      $('archChannelSlider').addEventListener('change', blurEventControl);
      $('archChannelSlider').addEventListener('pointerup', blurEventControl);
    }
    if ($('archApplyBtn')) $('archApplyBtn').addEventListener('click', function (event) {
      applyArchitectureEditor();
      blurEventControl(event);
    });
    if ($('archDeleteBtn')) $('archDeleteBtn').addEventListener('click', function (event) {
      deleteSelectedArchitectureLayer();
      blurEventControl(event);
    });
    if ($('archLeftBtn')) $('archLeftBtn').addEventListener('click', function () {
      reorderArchitectureLayer(state.archSelectedIndex, state.archSelectedIndex - 1);
      blurControl($('archLeftBtn'));
    });
    if ($('archRightBtn')) $('archRightBtn').addEventListener('click', function () {
      reorderArchitectureLayer(state.archSelectedIndex, state.archSelectedIndex + 1);
      blurControl($('archRightBtn'));
    });
    $('archSequence').addEventListener('dragover', function (event) {
      if (architectureEditingDisabled()) return;
      event.preventDefault();
      event.currentTarget.classList.add('is-over');
      event.dataTransfer.dropEffect = state.archDrag && state.archDrag.source === 'palette' ? 'copy' : 'move';
    });
    $('archSequence').addEventListener('dragleave', function (event) {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        event.currentTarget.classList.remove('is-over');
      }
    });
    $('archSequence').addEventListener('drop', function (event) {
      if (architectureEditingDisabled()) return;
      event.preventDefault();
      var index = architectureDropIndex(event);
      if (state.archDrag && state.archDrag.source === 'palette') {
        addArchitectureLayer(state.archDrag.kind, index);
      } else if (state.archDrag && state.archDrag.source === 'sequence') {
        moveArchitectureLayer(Number(state.archDrag.index), index);
      }
      state.archDrag = null;
      event.currentTarget.classList.remove('is-over');
    });
    if ($('archPresetBtn')) $('archPresetBtn').addEventListener('click', function (event) {
      if (architectureEditingDisabled()) return;
      state.architecture = defaultArchitecture();
      state.archSelectedIndex = -1;
      markArchitectureDirty();
      renderArchitecture();
      blurEventControl(event);
    });
    document.querySelector('.face-feature-block').addEventListener('pointerenter', function (event) {
      event.currentTarget.classList.add('is-browsing');
    });
    document.querySelector('.face-feature-block').addEventListener('pointerleave', function (event) {
      if (!state.featureDeckDragging && !state.featurePickerDragging) event.currentTarget.classList.remove('is-browsing');
    });
    $('featureViewer').addEventListener('wheel', wheelFeatureMap, { passive: false });
    $('featureDeck').addEventListener('pointerdown', function (event) {
      var ids = featureMapIds(currentSample());
      if (!ids.length) return;
      state.featureDeckDragging = true;
      state.featureDeckMoved = false;
      state.featureDeckStartY = event.clientY;
      state.featureDeckStartIndex = activeFeatureIndex(ids);
      $('featureDeck').classList.add('is-dragging');
      syncFeatureBlockBrowsing(true);
      if (event.currentTarget.setPointerCapture) event.currentTarget.setPointerCapture(event.pointerId);
    });
    $('featureDeck').addEventListener('pointermove', dragFeatureDeck);
    $('featureDeck').addEventListener('pointerup', function (event) {
      var moved = state.featureDeckMoved;
      state.featureDeckDragging = false;
      $('featureDeck').classList.remove('is-dragging');
      syncFeatureBlockBrowsing(false);
      if (event.currentTarget.releasePointerCapture) event.currentTarget.releasePointerCapture(event.pointerId);
      if (moved) window.setTimeout(function () { state.featureDeckMoved = false; }, 0);
    });
    $('featureDeck').addEventListener('pointercancel', function () {
      state.featureDeckDragging = false;
      state.featureDeckMoved = false;
      $('featureDeck').classList.remove('is-dragging');
      syncFeatureBlockBrowsing(false);
    });
    $('activeKernels').addEventListener('wheel', wheelActiveKernelPicker, { passive: false });
    $('activeKernels').addEventListener('pointerdown', function (event) {
      var ids = featureMapIds(currentSample());
      if (!ids.length) return;
      state.featurePickerDragging = true;
      state.featurePickerMoved = false;
      state.featurePickerStartY = event.clientY;
      state.featurePickerStartIndex = activeFeatureIndex(ids);
      $('activeKernels').classList.add('is-dragging');
      syncFeatureBlockBrowsing(true);
      if (event.currentTarget.setPointerCapture) event.currentTarget.setPointerCapture(event.pointerId);
    });
    $('activeKernels').addEventListener('pointermove', dragActiveKernelPicker);
    $('activeKernels').addEventListener('pointerup', function (event) {
      var moved = state.featurePickerMoved;
      state.featurePickerDragging = false;
      $('activeKernels').classList.remove('is-dragging');
      syncFeatureBlockBrowsing(false);
      if (event.currentTarget.releasePointerCapture) event.currentTarget.releasePointerCapture(event.pointerId);
      if (moved) window.setTimeout(function () { state.featurePickerMoved = false; }, 0);
    });
    $('activeKernels').addEventListener('pointercancel', function () {
      state.featurePickerDragging = false;
      state.featurePickerMoved = false;
      $('activeKernels').classList.remove('is-dragging');
      syncFeatureBlockBrowsing(false);
    });
    $('activeKernels').addEventListener('keydown', keyActiveKernelPicker);
    if (window.DLCanvas && window.DLCanvas.observe) {
      window.DLCanvas.observe(
        [$('faceCanvas'), $('featureViewer'), $('classifierCanvas')],
        function () {
          renderSample();
          drawLenetHistory();
          renderLearnedFilters();
        }
      );
    } else {
      window.addEventListener('resize', function () {
        renderSample();
        drawLenetHistory();
        renderLearnedFilters();
      });
    }
    window.addEventListener('resize', drawLenetHistory);
  }

  window.addEventListener('face-recog:act3-complete', renderAct3RelatedVideos);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

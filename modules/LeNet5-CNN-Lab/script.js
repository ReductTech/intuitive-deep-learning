(function () {
  'use strict';

  var SERVICE_URL = 'http://127.0.0.1:59415/lenet5/fixed-kernel-train';
  var PREVIEW_URL = 'http://127.0.0.1:59415/lenet5/fixed-kernel-preview';
  var SEQUENCE_URL = 'http://127.0.0.1:59415/lenet5/sequence-sample';
  var SEQUENCE_FEEDBACK_URL = 'http://127.0.0.1:59414/digit/sequence-strategy-feedback';
  var DETECTION_FEEDBACK_URL = 'http://127.0.0.1:59414/digit/detection-strategy-feedback';
  var IMAGE_SIZE = 28;
  var FEATURE_GRID_SIZE = 8;
  var FEATURE_RESPONSE_SIZE = IMAGE_SIZE - 2;
  var FEATURE_MAP_DESCRIPTION = FEATURE_RESPONSE_SIZE + 'x' + FEATURE_RESPONSE_SIZE
    + ' convolution responses pooled to ' + FEATURE_GRID_SIZE + 'x' + FEATURE_GRID_SIZE;
  var PICKER_ROW_HEIGHT = 28;
  var FEATURE_DRAG_STEP = 52;
  var DETECTION_CANVAS_SIZE = 256;
  var DETECTION_SCAN_STEP = 12;
  var DETECTION_SCAN_INTERVAL_MS = 40;
  var DETECTION_SCAN_WINDOWS_PER_TICK = 2;
  var DETECTION_TABLE_UPDATE_EVERY = 6;
  var DETECTION_TARGET_DIGIT = 6;
  var DETECTION_DIGITS = ['0', '2', '4', '6', '8'];
  var SEQUENCE_SCAN_DURATION_MS = 5000;
  var SEQUENCE_SCAN_START_DELAY_MS = 80;
  var SEQUENCE_CTC_MIN_CONFIDENCE = 0.42;
  var SEQUENCE_CTC_MIN_RUN_LENGTH = 2;
  var DIGIT_CLASS_COUNT = 10;
  var DEFAULT_REJECT_LABEL = 10;
  var KERNELS = [
    { id: 'edge', name: '边缘', values: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]] },
    { id: 'vertical', name: '竖边', values: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]] },
    { id: 'horizontal', name: '横边', values: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]] },
    { id: 'diag_down', name: '斜边 /', values: [[0, 1, 2], [-1, 0, 1], [-2, -1, 0]] },
    { id: 'diag_up', name: '斜边 \\', values: [[2, 1, 0], [1, 0, -1], [0, -1, -2]] },
    { id: 'center', name: '中心墨迹', values: [[0, 1, 0], [1, 4, 1], [0, 1, 0]] },
  ];
  var state = {
    result: null,
    preview: null,
    classifier: null,
    sampleIndex: 0,
    training: false,
    selectedKernels: ['edge'],
    activeFeatureKernel: 'edge',
    featureDeckDragging: false,
    featureDeckMoved: false,
    featureDeckStartY: 0,
    featureDeckStartIndex: 0,
    featurePickerDragging: false,
    featurePickerMoved: false,
    featurePickerStartY: 0,
    featurePickerStartIndex: 0,
    previewSampleIndex: 9000,
    previewTimer: 0,
    previewLoading: false,
    previewQueued: false,
    customImage: null,
    customImageVersion: 0,
    pendingCustomInference: false,
    autoTraining: false,
    classifierSignature: '',
    classifierValAccuracy: null,
    pendingUnlockAfterTraining: false,
    sequence: null,
    sequenceDigits: '',
    sequenceFrames: [],
    sequenceIdeaSubmitted: false,
    sequenceScanning: false,
    sequenceTimer: 0,
    detectionDigits: [],
    detectionWindows: [],
    detectionTimer: 0,
    detectionIdeaSubmitted: false,
    detectionUnlocked: false,
    detectionCueDismissed: false,
    resourcesRevealed: false,
    sequenceCueDismissed: false,
    sequenceContinueCue: null,
    detectionContinueCue: null,
    sequenceQuestion: null,
    detectionQuestion: null,
    classifierPulseTimer: 0,
    classifierPulse: [],
    autoSampleTimer: 0,
    handwritingStarted: false,
    handwritingHintDismissed: false,
    firstDigitWritten: false,
    trainingRevealed: false,
    sequenceCompleted: false,
    digitDrawing: false,
    digitLastPoint: null,
    featureSwitchTimer: 0,
    featureDrawRaf: 0,
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

  function classifierMatchesSelection() {
    return state.classifier && state.classifierSignature === selectedKernelSignature();
  }

  function validationPasses() {
    return Number(state.classifierValAccuracy) > 0.9;
  }

  function classifierReadyForNextStep() {
    return classifierMatchesSelection() && validationPasses();
  }

  function classifierClassCount() {
    return state.classifier && Number(state.classifier.class_count)
      ? Number(state.classifier.class_count)
      : DEFAULT_REJECT_LABEL + 1;
  }

  function classifierRejectLabel() {
    return state.classifier && Number.isFinite(Number(state.classifier.reject_label))
      ? Number(state.classifier.reject_label)
      : DEFAULT_REJECT_LABEL;
  }

  function classLabel(index) {
    return index === classifierRejectLabel() ? '_' : String(index);
  }

  function renderValidationMetric(value) {
    var metric = $('valAccMetric');
    var readout = $('valAcc');
    var hasValue = value !== null && value !== undefined && Number.isFinite(Number(value));
    var passes = hasValue && Number(value) > 0.9;
    if (readout) readout.textContent = hasValue ? formatPercent(value) : '-';
    if (!metric) return;
    metric.classList.toggle('is-success', passes);
    metric.classList.toggle('is-danger', hasValue && !passes);
  }

  function syncValidationMetric() {
    renderValidationMetric(
      state.classifierSignature === selectedKernelSignature()
        ? state.classifierValAccuracy
        : null
    );
  }

  function rootEl() {
    return document.querySelector('.lenet-root');
  }

  function updateProgressiveDisclosure() {
    var root = rootEl();
    if (!root) return;
    var readyForNextStep = classifierReadyForNextStep();
    root.classList.toggle('is-progressive-start', !state.trainingRevealed);
    root.classList.toggle('has-handwriting-started', state.handwritingStarted);
    root.classList.toggle('has-first-digit-written', state.firstDigitWritten);
    root.classList.toggle('has-training-revealed', state.trainingRevealed);
    root.classList.toggle('has-validation-passed', readyForNextStep);
    root.classList.toggle('has-sequence-completed', state.detectionUnlocked);
    root.classList.toggle('has-detection-cue-dismissed', state.detectionCueDismissed);
    root.classList.toggle('has-detection-idea-submitted', state.detectionIdeaSubmitted);

    var kernelTaskText = $('kernelTaskText');
    if (kernelTaskText) {
      kernelTaskText.textContent = readyForNextStep
        ? '做得很好！验证集准确率已超过 90%，点击“尝试手写”按钮继续。'
        : '尝试勾选更多固定卷积核，使验证集准确率大于 90%。';
    }

    var sequenceScanCard = $('sequenceScanCard');
    if (sequenceScanCard) sequenceScanCard.hidden = !state.sequenceIdeaSubmitted;
    var sequenceScanButton = $('sequenceScanBtn');
    if (sequenceScanButton) {
      sequenceScanButton.disabled = state.sequenceScanning || !state.sequenceIdeaSubmitted;
      sequenceScanButton.textContent = state.sequenceScanning
        ? '识别中'
        : (state.detectionUnlocked ? '重新识别' : '开始序列识别');
    }

    var trainButton = $('trainBtn');
    if (trainButton) {
      trainButton.classList.toggle('edu-btn--primary', !readyForNextStep);
      if (readyForNextStep) {
        if (window.DLModuleUI) window.DLModuleUI.dismissButtonHint(trainButton);
        else {
          trainButton.classList.remove('dl-button-hint');
          trainButton.removeAttribute('data-dl-button-hint');
        }
      }
    }

    var clearButton = $('clearCanvasBtn');
    if (clearButton) {
      clearButton.textContent = state.handwritingStarted ? '清屏' : '尝试手写';
      clearButton.classList.toggle('edu-btn--primary', readyForNextStep && !state.handwritingStarted);
      var shouldHintHandwriting = readyForNextStep && !state.handwritingStarted && !state.handwritingHintDismissed;
      if (window.DLModuleUI) {
        if (shouldHintHandwriting) {
          clearButton.setAttribute('data-dl-button-hint', '');
          window.DLModuleUI.startButtonHint(clearButton);
        } else {
          window.DLModuleUI.dismissButtonHint(clearButton);
        }
      } else {
        clearButton.classList.toggle('dl-button-hint', shouldHintHandwriting);
        if (shouldHintHandwriting) clearButton.setAttribute('data-dl-button-hint', '');
        else clearButton.removeAttribute('data-dl-button-hint');
      }
    }
    var sequenceReady = state.firstDigitWritten && readyForNextStep;
    var sequenceContinueCueHost = $('sequenceContinueCueHost');
    if (sequenceContinueCueHost) sequenceContinueCueHost.hidden = !sequenceReady || state.sequenceCueDismissed;
    var sequenceStage = $('sequenceStage');
    if (sequenceStage) {
      sequenceStage.hidden = !sequenceReady || !state.sequenceCueDismissed;
      sequenceStage.setAttribute('aria-hidden', sequenceStage.hidden ? 'true' : 'false');
    }
    var continueCueHost = $('detectionContinueCueHost');
    if (continueCueHost) continueCueHost.hidden = !state.detectionUnlocked || state.detectionCueDismissed;
    var detectionStage = document.querySelector('.lenet-detection-stage');
    if (detectionStage) {
      detectionStage.hidden = !state.detectionUnlocked || !state.detectionCueDismissed;
      detectionStage.setAttribute('aria-hidden', detectionStage.hidden ? 'true' : 'false');
    }
    var detectionScanButton = $('detectionScanBtn');
    if (detectionScanButton) {
      detectionScanButton.hidden = !state.detectionIdeaSubmitted;
      detectionScanButton.disabled = !state.detectionIdeaSubmitted || !!state.detectionTimer;
    }
    var detectionResetButton = $('detectionResetBtn');
    if (detectionResetButton) detectionResetButton.hidden = !state.detectionIdeaSubmitted;
    var detectionResultCard = document.querySelector('.lenet-detection-result-card');
    if (detectionResultCard) detectionResultCard.hidden = !state.detectionIdeaSubmitted;
    var resources = $('lenetResources');
    if (resources) resources.hidden = !state.resourcesRevealed;
  }

  function ensureSequenceContinueCue() {
    var host = $('sequenceContinueCueHost');
    if (!host || state.sequenceContinueCue) return;
    state.sequenceContinueCue = host;

    function confirmCue() {
      if (!state.firstDigitWritten || state.sequenceCueDismissed || !classifierReadyForNextStep()) return;
      state.sequenceCueDismissed = true;
      updateProgressiveDisclosure();
      var stage = $('sequenceStage');
      if (!stage) return;
      stage.classList.add('is-revealing');
      stage.addEventListener('animationend', function () { stage.classList.remove('is-revealing'); }, { once: true });
      window.requestAnimationFrame(function () {
        stage.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start'
        });
      });
    }

    host.addEventListener('click', confirmCue);
    window.addEventListener('wheel', function (event) {
      if (event.deltaY > 0 && !host.hidden) confirmCue();
    }, { passive: true });
  }

  function ensureDetectionContinueCue() {
    var host = $('detectionContinueCueHost');
    if (!host || state.detectionContinueCue) return;
    state.detectionContinueCue = host;

    function confirmCue() {
      if (!state.detectionUnlocked || state.detectionCueDismissed) return;
      state.detectionCueDismissed = true;
      updateProgressiveDisclosure();
      var stage = $('detectionStage');
      if (!stage) return;
      stage.classList.add('is-revealing');
      stage.addEventListener('animationend', function () { stage.classList.remove('is-revealing'); }, { once: true });
      window.requestAnimationFrame(function () {
        stage.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start'
        });
      });
    }

    host.addEventListener('click', confirmCue);
    window.addEventListener('wheel', function (event) {
      if (event.deltaY > 0 && !host.hidden) confirmCue();
    }, { passive: true });
  }

  function renderResources() {
    var host = $('lenetRelatedVideos');
    if (!host || !window.DLModuleUI || !window.DLModuleUI.renderRelatedVideos) return;
    host.innerHTML = window.DLModuleUI.renderRelatedVideos([
      {
        title: '23 经典卷积神经网络 LeNet【动手学深度学习v2】',
        embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=973192378&bvid=BV1t44y1r7ct&cid=342424736&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
      },
      {
        title: '从零实现一个卷积神经网络，Lenet5网络详解',
        embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=113301069499498&bvid=BV1Gc26YtEfU&cid=26278494406&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
      },
      {
        title: '卷积神经网络的底层是傅里叶变换，傅里叶变换的底层是希尔伯特空间坐标变换',
        embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=646155903&bvid=BV1ce4y1p7jF&cid=857682970&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
      },
      {
        title: '1.1 卷积神经网络基础',
        embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=91530734&bvid=BV1b7411T7DA&cid=156293999&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
      }
    ], {
      showHeader: false,
      ariaLabel: '固定卷积核与滑窗识别模块推荐视频',
    });
  }

  function revealTrainingFlow() {
    if (!state.trainingRevealed) {
      state.trainingRevealed = true;
      updateProgressiveDisclosure();
    }
  }

  function imageHasInk(image) {
    if (!image) return false;
    for (var row = 0; row < image.length; row += 1) {
      for (var col = 0; col < image[row].length; col += 1) {
        if ((Number(image[row][col]) || 0) > 0.035) return true;
      }
    }
    return false;
  }

  function renderKernelGrid(host, kernel) {
    host.replaceChildren();
    kernel.values.forEach(function (row) {
      row.forEach(function (value) {
        var cell = document.createElement('div');
        cell.className = 'lenet-kernel-cell' + (value > 0 ? ' is-positive' : (value < 0 ? ' is-negative' : ' is-zero'));
        cell.textContent = String(value);
        host.appendChild(cell);
      });
    });
  }

  function showKernelPopover(kernel, event) {
    var popover = $('kernelPopover');
    popover.hidden = false;
    popover.innerHTML = '<strong>' + kernel.name + '</strong><div class="lenet-kernel-grid"></div>';
    renderKernelGrid(popover.querySelector('.lenet-kernel-grid'), kernel);
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
    $('kernelPopover').hidden = true;
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
    state.result = null;
    state.classifier = null;
    state.classifierSignature = '';
    state.classifierValAccuracy = null;
    state.firstDigitWritten = false;
    stopSequenceScan();
    state.sequenceCompleted = false;
    state.detectionUnlocked = false;
    state.detectionCueDismissed = false;
    state.resourcesRevealed = false;
    state.sequenceCueDismissed = false;
    state.sequenceIdeaSubmitted = false;
    state.sequenceScanning = false;
    state.detectionIdeaSubmitted = false;
    $('trainStatus').textContent = '等待重新训练';
    $('trainAcc').textContent = '-';
    syncValidationMetric();
    setReadout('卷积核组合已改变。点击“训练 MLP”，让分类头使用这一组池化后的 8×8 特征图。');
    renderKernelControls();
    renderSample();
    setTrainingUi(false);
    updateProgressiveDisclosure();
    schedulePreview();
  }

  function removeKernel(id) {
    if (state.selectedKernels.length <= 1) return;
    state.selectedKernels = state.selectedKernels.filter(function (item) { return item !== id; });
    if (state.activeFeatureKernel === id) state.activeFeatureKernel = state.selectedKernels[0];
    state.result = null;
    state.classifier = null;
    state.classifierSignature = '';
    state.classifierValAccuracy = null;
    state.firstDigitWritten = false;
    stopSequenceScan();
    state.sequenceCompleted = false;
    state.detectionUnlocked = false;
    state.detectionCueDismissed = false;
    state.resourcesRevealed = false;
    state.sequenceCueDismissed = false;
    state.sequenceIdeaSubmitted = false;
    state.sequenceScanning = false;
    state.detectionIdeaSubmitted = false;
    $('trainStatus').textContent = '等待重新训练';
    $('trainAcc').textContent = '-';
    syncValidationMetric();
    setReadout('卷积核组合已改变。至少保留一个固定核，再重新训练。');
    renderKernelControls();
    renderSample();
    setTrainingUi(false);
    updateProgressiveDisclosure();
    schedulePreview();
  }

  function toggleKernel(id) {
    if (state.selectedKernels.indexOf(id) >= 0) {
      if (state.selectedKernels.length <= 1) {
        state.activeFeatureKernel = id;
        setReadout('至少保留一个固定卷积核。');
        renderKernelControls();
        renderSample();
        return;
      }
      removeKernel(id);
      return;
    }
    addKernel(id);
  }

  function resetKernels() {
    state.selectedKernels = ['edge'];
    state.activeFeatureKernel = 'edge';
    state.result = null;
    state.classifier = null;
    state.classifierSignature = '';
    state.classifierValAccuracy = null;
    state.firstDigitWritten = false;
    stopSequenceScan();
    state.sequenceCompleted = false;
    state.detectionUnlocked = false;
    state.detectionCueDismissed = false;
    state.resourcesRevealed = false;
    state.sequenceCueDismissed = false;
    state.sequenceIdeaSubmitted = false;
    state.sequenceScanning = false;
    state.detectionIdeaSubmitted = false;
    $('trainStatus').textContent = '等待开始';
    $('trainAcc').textContent = '-';
    syncValidationMetric();
    setReadout('已回到默认边缘卷积核。');
    renderKernelControls();
    renderSample();
    setTrainingUi(false);
    updateProgressiveDisclosure();
    schedulePreview();
  }

  function syncFeatureBlockBrowsing(isBrowsing) {
    var block = document.querySelector('.lenet-feature-block');
    if (block) block.classList.toggle('is-browsing', !!isBrowsing);
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
      tab.className = 'lenet-active-kernel'
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
      to = [224, 122, 63];
    }
    var r = Math.round(from[0] + (to[0] - from[0]) * local);
    var g = Math.round(from[1] + (to[1] - from[1]) * local);
    var b = Math.round(from[2] + (to[2] - from[2]) * local);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function drawMatrix(canvas, matrix, options) {
    options = options || {};
    var prepared = prepareCanvas(canvas, options.background || '#0b1020');
    var ctx = prepared.ctx;
    var width = prepared.width;
    var height = prepared.height;
    var rows = matrix && matrix.length ? matrix.length : IMAGE_SIZE;
    var cols = rows && matrix[0] ? matrix[0].length : IMAGE_SIZE;
    var margin = options.margin == null
      ? Math.max(10, Math.min(width, height) * 0.05)
      : options.margin;
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
        if (alpha <= 0.01) continue;
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

  function drawDigitFromCustomImage() {
    var canvas = $('digitCanvas');
    if (!canvas || !state.customImage) return;
    drawMatrix(canvas, state.customImage, { max: 1 });
  }

  function canvasPoint(canvas, event) {
    if (window.DLCanvas && window.DLCanvas.pointer) {
      return window.DLCanvas.pointer(canvas, event);
    }
    var rect = canvas.getBoundingClientRect();
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    var width = canvas.logicalWidth || canvas.clientWidth || canvas.width / ratio || 1;
    var height = canvas.logicalHeight || canvas.clientHeight || canvas.height / ratio || 1;
    return {
      x: (event.clientX - rect.left) * (width / Math.max(1, rect.width)),
      y: (event.clientY - rect.top) * (height / Math.max(1, rect.height)),
    };
  }

  function emptyImage() {
    return Array.from({ length: IMAGE_SIZE }, function () {
      return Array.from({ length: IMAGE_SIZE }, function () { return 0; });
    });
  }

  function readDigitCanvasAsImage() {
    var canvas = $('digitCanvas');
    if (!canvas) return emptyImage();
    var logical = window.DLCanvas && window.DLCanvas.size
      ? window.DLCanvas.size(canvas)
      : { width: canvas.clientWidth || canvas.width || 1, height: canvas.clientHeight || canvas.height || 1 };
    var scratch = document.createElement('canvas');
    scratch.width = IMAGE_SIZE;
    scratch.height = IMAGE_SIZE;
    var scratchCtx = scratch.getContext('2d');
    scratchCtx.drawImage(canvas, 0, 0, canvas.width || logical.width, canvas.height || logical.height, 0, 0, IMAGE_SIZE, IMAGE_SIZE);
    var pixels = scratchCtx.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE).data;
    var image = [];
    for (var row = 0; row < IMAGE_SIZE; row += 1) {
      var values = [];
      for (var col = 0; col < IMAGE_SIZE; col += 1) {
        var index = (row * IMAGE_SIZE + col) * 4;
        var luminance = pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114;
        values.push(Math.max(0, Math.min(1, (luminance - 42) / 170)));
      }
      image.push(values);
    }
    return image;
  }

  function strokeDigitLine(from, to) {
    var canvas = $('digitCanvas');
    if (!canvas) return;
    var ctx = window.DLCanvas && window.DLCanvas.context
      ? window.DLCanvas.context(canvas)
      : canvas.getContext('2d');
    var size = window.DLCanvas && window.DLCanvas.size
      ? window.DLCanvas.size(canvas)
      : { width: canvas.clientWidth || canvas.width || 1, height: canvas.clientHeight || canvas.height || 1 };
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#f8fbff';
    ctx.lineWidth = Math.max(12, Math.min(size.width, size.height) * 0.105);
    ctx.shadowColor = 'rgba(248,251,255,0.28)';
    ctx.shadowBlur = ctx.lineWidth * 0.18;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function finishDigitDrawing() {
    if (!state.digitDrawing) return;
    stopAutoSampleSwitch();
    state.digitDrawing = false;
    state.digitLastPoint = null;
    state.customImage = readDigitCanvasAsImage();
    state.customImageVersion += 1;
    if (imageHasInk(state.customImage)) {
      if (classifierReadyForNextStep()) {
        state.firstDigitWritten = true;
      } else {
        state.firstDigitWritten = false;
        state.sequenceCueDismissed = false;
        state.pendingUnlockAfterTraining = true;
        setReadout('需要先让当前卷积核组合的验证集准确率超过 90%，达标后才能进入下一关。正在自动补训练。');
      }
      updateProgressiveDisclosure();
    }
    state.result = null;
    state.preview = null;
    $('trainStatus').textContent = '刷新特征图';
    $('trainAcc').textContent = '-';
    syncValidationMetric();
    setTrainingUi(false);
    renderSample();
    schedulePreview();
    ensureClassifierForCustomImage();
  }

  function clearDigitCanvas() {
    state.customImage = emptyImage();
    state.customImageVersion += 1;
    state.result = null;
    state.preview = null;
    state.pendingCustomInference = false;
    drawDigitFromCustomImage();
    $('trainStatus').textContent = '空白输入';
    $('trainAcc').textContent = '-';
    syncValidationMetric();
    setTrainingUi(false);
    renderSample();
    schedulePreview();
  }

  async function handleHandwriteButton() {
    stopAutoSampleSwitch();
    if (!classifierReadyForNextStep()) {
      $('trainStatus').textContent = '自动补训练';
      setReadout('当前卷积核组合需要先训练，并且验证集准确率超过 90% 才能进入下一关。');
      await startTraining({ auto: true });
    }
    if (!classifierReadyForNextStep()) {
      updateProgressiveDisclosure();
      return;
    }
    if (!state.handwritingStarted) {
      state.handwritingStarted = true;
      updateProgressiveDisclosure();
    }
    clearDigitCanvas();
  }

  function kernelValuesForCompute(kernelId) {
    var values = kernelById(kernelId).values;
    if (kernelId !== 'center') return values;
    return values.map(function (row) {
      return row.map(function (value) { return value / 8; });
    });
  }

  function normalizeFeatureMap(pooled) {
    var max = 0;
    pooled.forEach(function (row) {
      row.forEach(function (value) {
        max = Math.max(max, value);
      });
    });
    if (max <= 0.0001) return pooled.map(function (row) {
      return row.map(function () { return 0; });
    });
    return pooled.map(function (row) {
      return row.map(function (value) {
        return Number((value / max).toFixed(3));
      });
    });
  }

  function fixedKernelFeatureMap(image, kernelId, options) {
    var values = kernelValuesForCompute(kernelId);
    var normalize = !options || options.normalize !== false;
    var response = [];
    for (var row = 0; row < FEATURE_RESPONSE_SIZE; row += 1) {
      var responseRow = [];
      for (var col = 0; col < FEATURE_RESPONSE_SIZE; col += 1) {
        var sum = 0;
        for (var kr = 0; kr < 3; kr += 1) {
          for (var kc = 0; kc < 3; kc += 1) {
            sum += (image[row + kr] && image[row + kr][col + kc] ? image[row + kr][col + kc] : 0)
              * values[kr][kc];
          }
        }
        responseRow.push(Math.max(0, sum));
      }
      response.push(responseRow);
    }

    var pooled = [];
    for (var pr = 0; pr < FEATURE_GRID_SIZE; pr += 1) {
      var pooledRow = [];
      var rowStart = Math.floor(pr * FEATURE_RESPONSE_SIZE / FEATURE_GRID_SIZE);
      var rowEnd = Math.floor((pr + 1) * FEATURE_RESPONSE_SIZE / FEATURE_GRID_SIZE);
      for (var pc = 0; pc < FEATURE_GRID_SIZE; pc += 1) {
        var colStart = Math.floor(pc * FEATURE_RESPONSE_SIZE / FEATURE_GRID_SIZE);
        var colEnd = Math.floor((pc + 1) * FEATURE_RESPONSE_SIZE / FEATURE_GRID_SIZE);
        var value = 0;
        var count = 0;
        for (var rr = rowStart; rr < rowEnd; rr += 1) {
          for (var cc = colStart; cc < colEnd; cc += 1) {
            value += response[rr][cc];
            count += 1;
          }
        }
        pooledRow.push(value / Math.max(1, count));
      }
      pooled.push(pooledRow);
    }

    return normalize ? normalizeFeatureMap(pooled) : pooled;
  }

  function flattenFeatureMaps(featureMaps, ids) {
    var values = [];
    ids.forEach(function (id) {
      var matrix = featureMaps[id] || [];
      matrix.forEach(function (row) {
        row.forEach(function (value) {
          values.push(Number(value) || 0);
        });
      });
    });
    return values;
  }

  function softmaxValues(logits) {
    var max = Math.max.apply(null, logits);
    var exp = logits.map(function (value) { return Math.exp(value - max); });
    var sum = exp.reduce(function (total, value) { return total + value; }, 0) || 1;
    return exp.map(function (value) { return value / sum; });
  }

  function inferWithClassifier(featureMaps) {
    var classifier = state.classifier;
    if (!classifierMatchesSelection() || !classifier.weights || !classifier.bias || !classifier.mean || !classifier.std) return null;
    var ids = classifier.kernels && classifier.kernels.length ? classifier.kernels : state.selectedKernels;
    if (ids.some(function (id) { return !featureMaps[id]; })) return null;
    var features = flattenFeatureMaps(featureMaps, ids);
    if (!features.length || features.length !== classifier.weights.length) return null;
    var logits = classifier.bias.map(function (bias, digit) {
      var total = Number(bias) || 0;
      for (var i = 0; i < features.length; i += 1) {
        var normalized = (features[i] - (Number(classifier.mean[i]) || 0)) / Math.max(0.00001, Number(classifier.std[i]) || 1);
        total += normalized * (Number(classifier.weights[i][digit]) || 0);
      }
      return total;
    });
    return softmaxValues(logits);
  }

  function buildCustomPreviewResult() {
    var image = state.customImage || emptyImage();
    var featureMaps = {};
    var rawFeatureMaps = {};
    state.selectedKernels.forEach(function (id) {
      rawFeatureMaps[id] = fixedKernelFeatureMap(image, id, { normalize: false });
      featureMaps[id] = normalizeFeatureMap(rawFeatureMaps[id]);
    });
    var probs = imageHasInk(image) ? inferWithClassifier(rawFeatureMaps) : null;
    var prediction = probs
      ? probs.reduce(function (best, value, index) { return value > probs[best] ? index : best; }, 0)
      : -1;
    return {
      dataset: {
        images: 'custom-canvas',
        labels: 'none',
        count: 1,
        feature_map: FEATURE_MAP_DESCRIPTION,
      },
      kernels: state.selectedKernels.map(function (id) {
        var kernel = kernelById(id);
        return { id: id, name: kernel.name, values: kernel.values };
      }),
      samples: [{
        index: -1,
        label: -1,
        prediction: prediction,
        probs: probs ? probs.map(function (value) { return Number(value.toFixed(4)); }) : null,
        image: image,
        feature_maps: featureMaps,
        feature_map: featureMaps[state.selectedKernels[0]],
        feature_max: 1,
      }],
      durationMs: 0,
    };
  }

  function renderProbBars(sample) {
    var host = $('probBars');
    host.replaceChildren();
    var classCount = sample && sample.probs ? sample.probs.length : classifierClassCount();
    var probs = sample && sample.probs ? sample.probs : Array.from({ length: classCount }, function () { return 0; });
    var prediction = sample && sample.probs ? sample.prediction : -1;
    for (var digit = 0; digit < classCount; digit += 1) {
      var row = document.createElement('div');
      row.className = 'lenet-prob-row' + (digit === prediction ? ' is-top' : '') + (sample && digit === sample.label ? ' is-label' : '');
      var label = document.createElement('span');
      label.textContent = classLabel(digit);
      var track = document.createElement('div');
      var fill = document.createElement('i');
      fill.style.width = ((probs[digit] || 0) * 100).toFixed(1) + '%';
      track.appendChild(fill);
      var value = document.createElement('strong');
      value.textContent = ((probs[digit] || 0) * 100).toFixed(0) + '%';
      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(value);
      host.appendChild(row);
    }
  }

  function drawClassifier(sample) {
    var canvas = $('classifierCanvas');
    if (!canvas) return;
    var prepared = prepareCanvas(canvas, '#fbfdff');
    var ctx = prepared.ctx;
    var width = prepared.width;
    var height = prepared.height;
    var outputCount = sample && sample.probs ? sample.probs.length : classifierClassCount();
    var probs = sample && sample.probs ? sample.probs : Array.from({ length: outputCount }, function () { return 0; });
    var prediction = sample && sample.probs ? sample.prediction : -1;
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
        var alpha = 0.07 + (probs[o] || 0) * 0.35;
        ctx.strokeStyle = 'rgba(31,138,104,' + alpha.toFixed(3) + ')';
        ctx.lineWidth = o === prediction ? 1.7 : 1;
        ctx.beginPath();
        ctx.moveTo(xHidden + 7, yAt(h2, hiddenCount));
        ctx.lineTo(xOutput - 7, yAt(o, outputCount));
        ctx.stroke();
      }
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
        ctx.font = '800 10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(label), x, y);
      }
    }

    for (var input = 0; input < inputCount; input += 1) {
      node(xInput, yAt(input, inputCount), 6.5, 'rgba(39,68,110,0.18)');
    }
    for (var hidden = 0; hidden < hiddenCount; hidden += 1) {
      var hasSavedPulse = state.classifierPulse && state.classifierPulse.length > hidden;
      var pulse = (state.training || hasSavedPulse) ? (state.classifierPulse[hidden] || 0) : 0;
      var fill = (state.training || hasSavedPulse)
        ? 'rgba(240,126,71,' + (0.18 + pulse * 0.58).toFixed(3) + ')'
        : 'rgba(224,122,63,0.18)';
      var stroke = (state.training || hasSavedPulse)
        ? 'rgba(240,126,71,' + (0.30 + pulse * 0.55).toFixed(3) + ')'
        : undefined;
      node(xHidden, yAt(hidden, hiddenCount), 7, fill, stroke);
    }
    for (var output = 0; output < outputCount; output += 1) {
      var isTop = output === prediction;
      node(
        xOutput,
        yAt(output, outputCount),
        isTop ? 8.5 : 6.5,
        isTop ? 'rgba(224,122,63,0.86)' : 'rgba(39,68,110,0.12)',
        isTop ? 'rgba(224,122,63,0.95)' : 'rgba(39,68,110,0.18)',
        classLabel(output)
      );
    }
  }

  function currentSample() {
    var source = state.result || state.preview;
    if (!source || !source.samples || !source.samples.length) return null;
    return source.samples[state.sampleIndex] || source.samples[0];
  }

  function activeFeatureMap(sample) {
    if (!sample) return null;
    if (sample.feature_maps && sample.feature_maps[state.activeFeatureKernel]) {
      return sample.feature_maps[state.activeFeatureKernel];
    }
    return sample.feature_map || null;
  }

  function featureMapIds(sample) {
    return sample && sample.feature_maps
      ? Object.keys(sample.feature_maps)
      : state.selectedKernels.slice();
  }

  function schedulePreview() {
    if (state.previewTimer) window.clearTimeout(state.previewTimer);
    if (state.customImage) {
      state.preview = buildCustomPreviewResult();
      state.sampleIndex = 0;
      $('trainStatus').textContent = '特征图已就绪';
      setTrainingUi(false);
      renderSample();
      return;
    }
    state.previewTimer = window.setTimeout(loadPreview, 160);
  }

  async function loadPreview() {
    if (state.previewLoading) {
      state.previewQueued = true;
      return;
    }
    state.previewTimer = 0;
    state.previewLoading = true;
    var imageVersion = state.customImageVersion;
    var image = state.customImage;
    try {
      var sample = currentSample();
      var response = await fetch(PREVIEW_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kernels: state.selectedKernels,
          sample_index: state.previewSampleIndex || (sample ? sample.index : undefined),
          image: image,
        }),
      });
      var data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || '预览服务返回失败。');
      if (imageVersion !== state.customImageVersion) return;
      state.preview = data.result;
      if (data.result.samples && data.result.samples[0]) {
        state.previewSampleIndex = data.result.samples[0].index;
      }
      state.sampleIndex = 0;
      if (!state.result) {
        $('trainStatus').textContent = '特征图已就绪';
        setTrainingUi(false);
      }
      renderSample();
    } catch (error) {
      if (!state.result) {
        $('trainStatus').textContent = '预览不可用';
      }
    } finally {
      state.previewLoading = false;
      if (state.previewQueued) {
        state.previewQueued = false;
        schedulePreview();
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
      var kernel = kernelById(id);
      var tick = document.createElement('span');
      tick.className = id === state.activeFeatureKernel ? 'is-active' : '';
      tick.textContent = kernel.name;
      host.appendChild(tick);
    });
    var title = $('featureStackTitle');
    if (title) title.textContent = kernelById(state.activeFeatureKernel).name;
  }

  function updateFeatureDeckClasses(sample) {
    var deck = $('featureDeck');
    if (!deck) return;
    var ids = featureMapIds(sample);
    var active = activeFeatureIndex(ids);
    var count = ids.length;
    Array.prototype.forEach.call(deck.querySelectorAll('.lenet-feature-card'), function (card, index) {
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
    Array.prototype.forEach.call(deck.querySelectorAll('.lenet-feature-card'), function (card) {
      var id = card.getAttribute('data-feature-id');
      var canvas = card.querySelector('canvas');
      var matrix = sample && sample.feature_maps ? sample.feature_maps[id] : null;
      drawMatrix(canvas, matrix || [], {
        max: matrixMax(matrix),
        background: '#f8fafd',
        color: 'rgba(224,122,63,ALPHA)',
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
    var signature = ids.join('|') + '::' + (sample ? sample.index : 'blank');
    if (deck.getAttribute('data-signature') !== signature) {
      deck.replaceChildren();
      ids.forEach(function (id, index) {
        var card = document.createElement('div');
        card.className = 'lenet-feature-card';
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

  function activeFeatureIndex(ids) {
    return Math.max(0, ids.indexOf(state.activeFeatureKernel));
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
    renderFeatureScrub(sample);
    renderFeatureDeck(sample);
    renderFlattenVector(sample);
  }

  function stepActiveFeature(step, animate) {
    var ids = featureMapIds(currentSample());
    if (ids.length <= 1) return;
    setActiveFeatureIndex(activeFeatureIndex(ids) + step, animate);
  }

  function wheelFeatureMap(event) {
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

  function wheelActiveKernelPicker(event) {
    var ids = featureMapIds(currentSample());
    if (ids.length <= 1) return;
    event.preventDefault();
    syncFeatureBlockBrowsing(true);
    stepActiveFeature(event.deltaY > 0 ? 1 : -1, true);
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
    host.style.setProperty('--vector-count', String(Math.max(1, matrices.length)));
    host.style.setProperty('--vector-cells', String(Math.max(1, vectorCells)));
    host.style.setProperty('--vector-rows', String(vectorRows));
    host.style.setProperty('--vector-columns', String(Math.max(1, Math.ceil(vectorCells / vectorRows))));
    matrices.forEach(function (entry) {
      var id = entry.id;
      var matrix = entry.matrix;
      var max = matrixMax(matrix);
      matrix.forEach(function (row) {
        row.forEach(function (value) {
          var cell = document.createElement('span');
          var level = Math.max(0, Math.min(1, Number(value || 0) / max));
          cell.className = 'lenet-vector-cell' + (id === state.activeFeatureKernel ? ' is-active' : '');
          cell.style.setProperty('--value', level.toFixed(3));
          host.appendChild(cell);
        });
      });
    });
  }

  function renderSample() {
    if (state.digitDrawing) return;
    var sample = currentSample();
    if (!sample) {
      if (state.customImage) {
        drawDigitFromCustomImage();
      } else {
        drawMatrix($('digitCanvas'), []);
      }
      renderActiveKernelPicker(featureMapIds(null));
      renderFeatureScrub(null);
      renderFeatureDeck(null);
      renderProbBars(null);
      drawClassifier(null);
      renderFlattenVector(null);
      return;
    }
    var sampleTitle = $('sampleTitle');
    if (sampleTitle) sampleTitle.textContent = '标签 ' + sample.label + ' · 预测 ' + sample.prediction;
    if (state.customImage) {
      drawDigitFromCustomImage();
    } else {
      drawMatrix($('digitCanvas'), sample.image, { max: 1 });
    }
    renderActiveKernelPicker(featureMapIds(sample));
    renderFeatureScrub(sample);
    renderFeatureDeck(sample);
    renderFlattenVector(sample);
    renderProbBars(sample);
    drawClassifier(sample);
  }

  function setReadout(text, isError) {
    var readout = $('readout');
    if (!readout) return;
    readout.textContent = text;
    readout.className = 'edu-notice-strip ' + (isError ? 'edu-notice-strip--red' : 'edu-notice-strip--blue');
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

  function stopClassifierPulse(preserve) {
    if (state.classifierPulseTimer) {
      window.clearInterval(state.classifierPulseTimer);
      state.classifierPulseTimer = 0;
    }
    if (!preserve) state.classifierPulse = [];
    drawClassifier(currentSample());
  }

  function startAutoSampleSwitch() {
    if (state.autoSampleTimer || state.handwritingStarted || state.customImage) return;
    state.autoSampleTimer = window.setInterval(function () {
      if (state.training || state.handwritingStarted || state.customImage) return;
      nextSample();
    }, 2000);
  }

  function stopAutoSampleSwitch() {
    if (!state.autoSampleTimer) return;
    window.clearInterval(state.autoSampleTimer);
    state.autoSampleTimer = 0;
  }

  function setTrainingUi(running, options) {
    options = options || {};
    state.training = running;
    $('trainBtn').disabled = running;
    $('trainBtn').classList.toggle('is-loading', running);
    $('trainBtn').setAttribute('aria-busy', running ? 'true' : 'false');
    $('clearCanvasBtn').disabled = running || !classifierReadyForNextStep();
    if (running) {
      stopAutoSampleSwitch();
      startClassifierPulse();
    } else {
      stopClassifierPulse(!!options.preserveClassifierPulse);
    }
    updateProgressiveDisclosure();
  }

  function ensureClassifierForCustomImage() {
    if (!state.customImage || !imageHasInk(state.customImage) || classifierReadyForNextStep() || state.training || state.autoTraining) return;
    state.pendingCustomInference = true;
    state.autoTraining = true;
    startTraining({ auto: true });
  }

  async function startTraining(options) {
    options = options || {};
    if (state.training) return;
    if (!options.auto && state.sequence) {
      resetSequenceScanUi(state.sequenceIdeaSubmitted ? '重新训练后，点击开始序列识别' : '等待想法提交');
    }
    setTrainingUi(true);
    $('trainStatus').textContent = options.auto ? '自动训练分类头' : '后端训练中';
    if (!options.auto) {
      $('trainAcc').textContent = '-';
      renderValidationMetric(null);
      setReadout('正在准备训练。系统会读取预计算特征，并为当前这一组固定卷积核训练分类头。');
    }
    try {
      var response = await fetch(SERVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kernels: state.selectedKernels,
          train_ratio: 0.9,
          image: state.customImage,
        }),
      });
      var data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || '训练服务返回失败。');
      state.result = data.result;
      state.preview = data.result;
      state.classifier = data.result.classifier || null;
      state.classifierSignature = state.classifier ? selectedKernelSignature() : '';
      state.classifierValAccuracy = Number(data.result.val_accuracy);
      state.sampleIndex = 0;
      $('trainStatus').textContent = validationPasses() ? '训练完成' : 'Val未达标';
      $('trainAcc').textContent = formatPercent(state.result.train_accuracy);
      syncValidationMetric();
      if (!options.auto) revealTrainingFlow();
      if (!options.auto) {
        if (validationPasses()) {
          setReadout('验证集准确率已经超过 90%。现在可以尝试手写，达标后进入下一关。');
        } else {
          setReadout('验证集准确率需要超过 90% 才能进入下一关。可以调整卷积核组合后重新训练。', true);
        }
      }
      if (state.customImage) {
        state.preview = buildCustomPreviewResult();
        state.result = state.preview;
      }
      if (state.pendingUnlockAfterTraining && imageHasInk(state.customImage) && validationPasses()) {
        state.firstDigitWritten = true;
        state.pendingUnlockAfterTraining = false;
        updateProgressiveDisclosure();
      }
      if (state.pendingUnlockAfterTraining && !validationPasses()) {
        state.firstDigitWritten = false;
        state.sequenceCueDismissed = false;
        updateProgressiveDisclosure();
      }
      updateProgressiveDisclosure();
      renderSample();
      if (!options.auto && !state.customImage) startAutoSampleSwitch();
    } catch (error) {
      $('trainStatus').textContent = '服务不可用';
      renderValidationMetric(null);
      setReadout((error && error.message ? error.message : String(error)) + ' 请先启动 scripts/lenet5_cnn_service.py。', true);
    } finally {
      state.pendingCustomInference = false;
      state.autoTraining = false;
      setTrainingUi(false, { preserveClassifierPulse: !!state.classifier });
    }
  }

  function randomSequenceDigits() {
    return Array.from({ length: 5 }, function () {
      return String(Math.floor(Math.random() * 10));
    }).join('');
  }

  function updateSequenceGt() {
    var target = $('sequenceGt');
    if (target) target.textContent = state.sequenceDigits || '-----';
  }

  function cleanSequenceInput() {
    if (!/^\d{5}$/.test(state.sequenceDigits)) state.sequenceDigits = randomSequenceDigits();
    updateSequenceGt();
    return state.sequenceDigits;
  }

  function drawSequenceImage() {
    var canvas = $('sequenceCanvas');
    if (!canvas || !state.sequence) return;
    var image = state.sequence.image || [];
    drawMatrix(canvas, image, {
      max: 1,
      background: '#0b1020',
      margin: 0,
      gap: 0,
      minAlpha: 0.18,
    });
  }

  function setSequenceScanStatus(text) {
    var target = $('sequenceScanStatusText');
    if (target) target.textContent = text;
  }

  function setSequenceResult(text, typing) {
    var target = $('sequenceResult');
    if (!target) return;
    target.textContent = text || '';
    target.classList.toggle('is-typing', !!typing);
  }

  function hideSequenceOverlay() {
    var overlay = $('sequenceWindowOverlay');
    if (!overlay) return;
    overlay.classList.remove('is-visible');
    overlay.style.transform = 'translateX(0)';
    overlay.style.left = '0px';
    overlay.style.top = '0px';
  }

  function stopSequenceScan() {
    if (state.sequenceTimer) {
      window.clearInterval(state.sequenceTimer);
      window.clearTimeout(state.sequenceTimer);
      state.sequenceTimer = 0;
    }
    state.sequenceScanning = false;
    hideSequenceOverlay();
  }

  function resetSequenceScanUi(status) {
    stopSequenceScan();
    state.sequenceCompleted = false;
    state.sequenceFrames = [];
    renderSequenceFrames([]);
    setSequenceResult('', false);
    setSequenceScanStatus(status || (state.sequenceIdeaSubmitted ? '点击开始序列识别' : '等待想法提交'));
    hideSequenceOverlay();
    updateProgressiveDisclosure();
  }

  async function buildSequenceImage(options) {
    options = options || {};
    if (options.random) state.sequenceDigits = randomSequenceDigits();
    var digits = cleanSequenceInput();
    var button = $('sequenceBuildBtn');
    if (button) button.disabled = true;
    resetSequenceScanUi(state.sequenceIdeaSubmitted ? '已换新序列，点击开始序列识别' : '等待想法提交');
    try {
      var response = await fetch(SEQUENCE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ digits: digits }),
      });
      var data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || '序列图片生成失败。');
      state.sequence = data.result;
      state.sequenceFrames = [];
      drawSequenceImage();
      renderSequenceFrames([]);
      setSequenceResult('', false);
      if (state.sequenceQuestion && !state.sequenceIdeaSubmitted) state.sequenceQuestion.resetQuestion();
      hideSequenceOverlay();
    } catch (error) {
      setSequenceResult('服务不可用', false);
    } finally {
      if (button) button.disabled = false;
    }
  }

  function cropSequenceWindow(sequence, left) {
    var image = sequence && sequence.image ? sequence.image : [];
    var out = emptyImage();
    var y0 = Math.max(0, Math.round(((sequence.height || image.length || IMAGE_SIZE) - IMAGE_SIZE) / 2));
    for (var y = 0; y < IMAGE_SIZE; y += 1) {
      for (var x = 0; x < IMAGE_SIZE; x += 1) {
        var sourceX = left + x;
        var sourceY = y0 + y;
        out[y][x] = image[sourceY] && image[sourceY][sourceX] ? image[sourceY][sourceX] : 0;
      }
    }
    return out;
  }

  function meanInk(image) {
    var sum = 0;
    for (var y = 0; y < image.length; y += 1) {
      for (var x = 0; x < image[y].length; x += 1) sum += Number(image[y][x]) || 0;
    }
    return sum / (IMAGE_SIZE * IMAGE_SIZE);
  }

  function inferDigitImage(image) {
    var featureMaps = {};
    state.selectedKernels.forEach(function (id) {
      featureMaps[id] = fixedKernelFeatureMap(image, id, { normalize: false });
    });
    var probs = inferWithClassifier(featureMaps);
    if (!probs) return { digit: '?', confidence: 0, probs: null, reject: true };
    var prediction = probs.reduce(function (best, value, index) { return value > probs[best] ? index : best; }, 0);
    var reject = prediction === classifierRejectLabel() || prediction >= DIGIT_CLASS_COUNT;
    return {
      digit: reject ? '_' : String(prediction),
      confidence: probs[prediction],
      probs: probs,
      reject: reject,
      prediction: prediction,
    };
  }

  function decodeSequenceFrames(frames, finalize) {
    var runs = [];
    frames.forEach(function (frame) {
      frame.keep = false;
      frame.ctcBlank = false;
      frame.ctcSymbol = (!frame.reject && frame.digit !== '_' && frame.confidence >= SEQUENCE_CTC_MIN_CONFIDENCE)
        ? frame.digit
        : '_';
      var last = runs[runs.length - 1];
      if (last && last.symbol === frame.ctcSymbol) {
        last.frames.push(frame);
      } else {
        runs.push({ symbol: frame.ctcSymbol, frames: [frame] });
      }
    });
    var acceptedRuns = [];
    var droppedRuns = [];
    runs.forEach(function (run) {
      var best = run.frames.reduce(function (winner, frame) {
        return frame.confidence > winner.confidence ? frame : winner;
      }, run.frames[0]);
      if (run.symbol === '_') {
        best.ctcBlank = true;
        return;
      }
      var item = {
        symbol: run.symbol,
        best: best,
        length: run.frames.length,
        score: Math.min(run.frames.length, 8) + best.confidence,
      };
      if (run.frames.length < SEQUENCE_CTC_MIN_RUN_LENGTH && best.confidence < 0.7) {
        droppedRuns.push(item);
        return;
      }
      acceptedRuns.push(item);
    });
    var targetLength = finalize !== false && /^\d{5}$/.test(state.sequenceDigits) ? state.sequenceDigits.length : 0;
    if (targetLength && acceptedRuns.length < targetLength) {
      droppedRuns
        .sort(function (a, b) { return b.score - a.score; })
        .slice(0, targetLength - acceptedRuns.length)
        .forEach(function (run) { acceptedRuns.push(run); });
    }
    if (targetLength && acceptedRuns.length > targetLength) {
      var removeCount = acceptedRuns.length - targetLength;
      acceptedRuns.slice()
        .sort(function (a, b) { return a.score - b.score; })
        .slice(0, removeCount)
        .forEach(function (run) { run.removed = true; });
    }
    var decoded = [];
    acceptedRuns
      .sort(function (a, b) { return a.best.left - b.best.left; })
      .forEach(function (run) {
      if (run.removed) return;
      run.best.keep = true;
      run.best.ctcRunLength = run.length;
      decoded.push(run.symbol);
    });
    return decoded.join('');
  }

  function renderSequenceFrames(frames) {
    var track = $('sequenceFrameTrack');
    if (!track) return;
    track.replaceChildren();
    var visibleFrames = frames;
    if (!visibleFrames.length) {
      var empty = document.createElement('div');
      empty.className = 'lenet-frame is-empty';
      empty.textContent = state.sequenceIdeaSubmitted ? '等待扫描' : '提交想法后显示滑窗帧';
      track.appendChild(empty);
      return;
    }
    visibleFrames.forEach(function (frame) {
      track.appendChild(createSequenceFrameElement(frame));
    });
  }

  function createSequenceFrameElement(frame) {
    var item = document.createElement('div');
    item.className = 'lenet-frame'
      + (frame.reject ? ' is-blank' : '')
      + (!frame.reject && !frame.keep ? ' is-candidate' : '')
      + (frame.ctcBlank ? ' is-ctc-blank' : '')
      + (frame.keep ? ' is-kept' : '');
    item.textContent = 'x=' + frame.left;
    var strong = document.createElement('strong');
    strong.textContent = frame.ctcSymbol || (frame.reject ? '_' : frame.digit);
    item.appendChild(strong);
    var confidence = document.createElement('small');
    confidence.textContent = formatPercent(frame.confidence);
    item.appendChild(confidence);
    item.title = 'x=' + frame.left + '，CTC符号 ' + (frame.ctcSymbol || (frame.reject ? '_' : frame.digit)) + '，置信度 ' + formatPercent(frame.confidence);
    return item;
  }

  function appendSequenceFrame(frame) {
    var track = $('sequenceFrameTrack');
    if (!track) return;
    var empty = track.querySelector('.lenet-frame.is-empty');
    if (empty) empty.remove();
    var item = createSequenceFrameElement(frame);
    item.classList.add('is-entering');
    track.appendChild(item);
  }

  function sequenceCanvasGeometry() {
    var canvas = $('sequenceCanvas');
    var sequence = state.sequence;
    if (!canvas || !sequence) return null;
    var rect = canvas.getBoundingClientRect();
    var wrap = canvas.parentElement ? canvas.parentElement.getBoundingClientRect() : rect;
    var width = rect.width || canvas.clientWidth || Number(canvas.getAttribute('width')) || 1;
    var height = rect.height || canvas.clientHeight || Number(canvas.getAttribute('height')) || 1;
    var cell = width / Math.max(1, sequence.width || IMAGE_SIZE);
    return {
      cell: cell,
      height: height,
      originX: rect.left - wrap.left,
      originY: rect.top - wrap.top,
    };
  }

  function moveSequenceOverlay(frame) {
    var overlay = $('sequenceWindowOverlay');
    var geometry = sequenceCanvasGeometry();
    if (!overlay || !geometry || !state.sequence) return;
    overlay.style.left = geometry.originX.toFixed(1) + 'px';
    overlay.style.top = geometry.originY.toFixed(1) + 'px';
    overlay.style.width = (IMAGE_SIZE * geometry.cell).toFixed(1) + 'px';
    overlay.style.height = geometry.height.toFixed(1) + 'px';
    overlay.style.transform = 'translateX(' + (frame.left * geometry.cell).toFixed(1) + 'px)';
    overlay.classList.add('is-visible');
  }

  function runSequenceScan() {
    if (!state.sequence) {
      buildSequenceImage().then(runSequenceScan);
      return;
    }
    if (!state.sequenceIdeaSubmitted) {
      setReadout('先提交你的识别思路，再开始序列识别。', true);
      return;
    }
    if (!classifierReadyForNextStep()) {
      setReadout('第一幕需要先让当前卷积核组合的验证集准确率超过 90%，才能进入序列识别。', true);
      return;
    }
    stopSequenceScan();
    var sequence = state.sequence;
    var step = 1;
    var maxLeft = Math.max(0, (sequence.width || IMAGE_SIZE) - IMAGE_SIZE);
    var lefts = [];
    for (var left = 0; left <= maxLeft; left += step) lefts.push(left);
    if (lefts[lefts.length - 1] !== maxLeft) lefts.push(maxLeft);
    var frames = [];
    state.sequenceFrames = frames;
    state.sequenceCompleted = false;
    state.sequenceScanning = true;
    setSequenceResult('', true);
    setSequenceScanStatus('扫描中 0 / ' + lefts.length);
    updateProgressiveDisclosure();
    moveSequenceOverlay({ left: 0 });
    $('sequenceFrameTrack').replaceChildren();
    var index = 0;
    var scanInterval = Math.max(16, Math.round((SEQUENCE_SCAN_DURATION_MS - SEQUENCE_SCAN_START_DELAY_MS) / Math.max(1, lefts.length)));
    function tick() {
      if (index >= lefts.length) {
        window.clearInterval(state.sequenceTimer);
        state.sequenceTimer = 0;
        state.sequenceScanning = false;
        var decoded = decodeSequenceFrames(frames);
        state.sequenceFrames = frames;
        renderSequenceFrames(frames);
        setSequenceResult(decoded || '-', false);
        setSequenceScanStatus('扫描完成，CTC 合并 ' + (decoded ? decoded.length : 0) + ' 个符号');
        state.sequenceCompleted = true;
        state.detectionUnlocked = true;
        ensureDetectionContinueCue();
        updateProgressiveDisclosure();
        return;
      }
      var leftNow = lefts[index];
      var image = cropSequenceWindow(sequence, leftNow);
      var ink = meanInk(image);
      var prediction = inferDigitImage(image);
      var lastFrame = {
        left: leftNow,
        ink: ink,
        blank: prediction.reject,
        digit: prediction.digit,
        confidence: prediction.confidence,
        reject: prediction.reject,
        prediction: prediction.prediction,
        ctcSymbol: (!prediction.reject && prediction.digit !== '_' && prediction.confidence >= SEQUENCE_CTC_MIN_CONFIDENCE)
          ? prediction.digit
          : '_',
      };
      frames.push(lastFrame);
      index += 1;
      state.sequenceFrames = frames;
      moveSequenceOverlay(lastFrame);
      appendSequenceFrame(lastFrame);
      setSequenceResult(decodeSequenceFrames(frames, false), true);
      setSequenceScanStatus('扫描中 ' + Math.min(index, lefts.length) + ' / ' + lefts.length);
    }
    state.sequenceTimer = window.setTimeout(function () {
      tick();
      if (state.sequenceScanning) {
        state.sequenceTimer = window.setInterval(tick, scanInterval);
      }
    }, SEQUENCE_SCAN_START_DELAY_MS);
  }

  async function submitSequenceIdea(answer) {
    answer = String(answer || '').trim();
    var question = state.sequenceQuestion;
    var button = question && question.submit;
    if (!answer) return;
    if (question) question.streamFeedback('正在分析你的思路，请稍候。', 'hint');
    if (button) {
      button.disabled = true;
      button.classList.add('is-loading');
      button.setAttribute('aria-busy', 'true');
    }
    try {
      var response = await fetch(SEQUENCE_FEEDBACK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: answer, digits: cleanSequenceInput() }),
      });
      var data = await response.json().catch(function () { return {}; });
      var result = window.DLModuleUI.requireServiceResult(response, data);
      var feedback = window.DLModuleUI.shortAnswerFeedback(result);
      if (question) question.streamFeedback(feedback.message, feedback.tone);
      state.sequenceIdeaSubmitted = true;
      state.sequenceCompleted = false;
      state.sequenceFrames = [];
      setSequenceResult('', false);
      setSequenceScanStatus('思路已提交，点击开始序列识别');
      renderSequenceFrames([]);
      updateProgressiveDisclosure();
    } catch (error) {
      if (question) question.streamFeedback(window.DLModuleUI.friendlyErrorMessage(error), 'wrong');
    } finally {
      if (button) {
        button.disabled = false;
        button.classList.remove('is-loading');
        button.setAttribute('aria-busy', 'false');
      }
    }
  }

  function demoteIdeaSubmitButton(question) {
    var button = question && question.submit;
    if (!button) return;
    button.classList.remove('edu-btn--primary', 'dl-button-hint');
    button.removeAttribute('data-dl-button-hint');
  }

  function makeDetectionDigit(digit, x, y) {
    return {
      digit: String(digit),
      x: x,
      y: y,
      image: null,
    };
  }

  function detectionScanStarts() {
    var starts = [];
    var maxStart = DETECTION_CANVAS_SIZE - IMAGE_SIZE;
    for (var value = 0; value <= maxStart; value += DETECTION_SCAN_STEP) {
      starts.push(value);
    }
    return starts;
  }

  function makeDetectionPositions(count) {
    var starts = detectionScanStarts().filter(function (value) {
      return value >= DETECTION_SCAN_STEP && value <= DETECTION_CANVAS_SIZE - IMAGE_SIZE - DETECTION_SCAN_STEP;
    });
    var candidates = [];
    starts.forEach(function (y) {
      starts.forEach(function (x) {
        candidates.push({ x: x, y: y });
      });
    });
    for (var shuffle = candidates.length - 1; shuffle > 0; shuffle -= 1) {
      var swap = Math.floor(Math.random() * (shuffle + 1));
      var temp = candidates[shuffle];
      candidates[shuffle] = candidates[swap];
      candidates[swap] = temp;
    }
    var positions = [];
    while (positions.length < count && candidates.length) {
      var candidate = candidates.shift();
      var overlaps = positions.some(function (position) {
        return Math.abs(position.x - candidate.x) < IMAGE_SIZE + DETECTION_SCAN_STEP
          && Math.abs(position.y - candidate.y) < IMAGE_SIZE + DETECTION_SCAN_STEP;
      });
      if (!overlaps) positions.push(candidate);
    }
    return positions;
  }

  async function resetDetectionScene() {
    if (state.detectionTimer) {
      window.clearInterval(state.detectionTimer);
      state.detectionTimer = 0;
    }
    $('detectionScanBtn').disabled = false;
    state.resourcesRevealed = false;
    var positions = makeDetectionPositions(DETECTION_DIGITS.length);
    state.detectionDigits = DETECTION_DIGITS.map(function (digit, index) {
      return makeDetectionDigit(digit, positions[index].x, positions[index].y);
    });
    try {
      var response = await fetch(SEQUENCE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ digits: DETECTION_DIGITS.join('') }),
      });
      var data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || '检测数字生成失败。');
      var image = data.result.image || [];
      var boxes = data.result.boxes || [];
      state.detectionDigits.forEach(function (item, index) {
        var box = boxes[index] || { x: index * IMAGE_SIZE, y: 0 };
        item.image = cropMatrix(image, box.x, box.y || 0, IMAGE_SIZE, IMAGE_SIZE);
      });
    } catch (error) {
      state.detectionDigits.forEach(function (item) {
        item.image = rasterDigit(item.digit);
      });
    }
    hideDetectionBox();
    state.detectionWindows = [];
    $('detectionResult').textContent = '-';
    $('detectionStatus').textContent = '观察图像后，先提交思路，再开始检测位置。';
    updateDetectionProgress(0, detectionScanStarts().length * detectionScanStarts().length);
    renderDetectionRanking([]);
    drawDetectionScene();
    updateProgressiveDisclosure();
  }

  function cropMatrix(matrix, left, top, width, height) {
    var out = [];
    for (var y = 0; y < height; y += 1) {
      var row = [];
      for (var x = 0; x < width; x += 1) {
        row.push(matrix[top + y] && matrix[top + y][left + x] ? Number(matrix[top + y][left + x]) : 0);
      }
      out.push(row);
    }
    return out;
  }

  function rasterDigit(digit) {
    var canvas = document.createElement('canvas');
    canvas.width = IMAGE_SIZE;
    canvas.height = IMAGE_SIZE;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);
    ctx.fillStyle = '#fff';
    ctx.font = '900 26px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(digit), IMAGE_SIZE / 2, IMAGE_SIZE / 2 + 1);
    var data = ctx.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE).data;
    var image = [];
    for (var y = 0; y < IMAGE_SIZE; y += 1) {
      var row = [];
      for (var x = 0; x < IMAGE_SIZE; x += 1) {
        row.push(data[(y * IMAGE_SIZE + x) * 4] / 255);
      }
      image.push(row);
    }
    return image;
  }

  function drawDetectionDigit(ctx, item) {
    var scale = 1;
    var size = IMAGE_SIZE * scale;
    var off = document.createElement('canvas');
    off.width = IMAGE_SIZE;
    off.height = IMAGE_SIZE;
    drawMatrix(off, item.image, { max: 1, background: '#000', margin: 0, gap: 0, minAlpha: 0.16 });
    ctx.drawImage(off, item.x, item.y, size, size);
  }

  function drawDetectionScene() {
    var canvas = $('detectionCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, DETECTION_CANVAS_SIZE, DETECTION_CANVAS_SIZE);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, DETECTION_CANVAS_SIZE, DETECTION_CANVAS_SIZE);
    state.detectionDigits.forEach(function (item) {
      drawDetectionDigit(ctx, item);
    });
  }

  function cropDetectionWindow(left, top) {
    var canvas = $('detectionCanvas');
    var ctx = canvas.getContext('2d');
    var data = ctx.getImageData(left, top, IMAGE_SIZE, IMAGE_SIZE).data;
    var image = [];
    for (var y = 0; y < IMAGE_SIZE; y += 1) {
      var row = [];
      for (var x = 0; x < IMAGE_SIZE; x += 1) {
        row.push(data[(y * IMAGE_SIZE + x) * 4] / 255);
      }
      image.push(row);
    }
    return image;
  }

  function showDetectionBox(left, top) {
    var box = $('detectionBox');
    if (!box) return;
    var canvas = $('detectionCanvas');
    var rect = canvas.getBoundingClientRect();
    var wrap = canvas.parentElement.getBoundingClientRect();
    var cell = rect.width / DETECTION_CANVAS_SIZE;
    box.style.left = (rect.left - wrap.left + left * cell).toFixed(1) + 'px';
    box.style.top = (rect.top - wrap.top + top * cell).toFixed(1) + 'px';
    box.style.width = (IMAGE_SIZE * cell).toFixed(1) + 'px';
    box.style.height = (IMAGE_SIZE * cell).toFixed(1) + 'px';
    box.classList.add('is-visible');
  }

  function hideDetectionBox() {
    var box = $('detectionBox');
    if (box) box.classList.remove('is-visible');
  }

  function updateDetectionProgress(done, total) {
    var progress = $('detectionProgress');
    if (!progress) return;
    progress.textContent = '步长 ' + DETECTION_SCAN_STEP + '，已扫 ' + done + ' / ' + total + ' 个窗口';
  }

  function renderDetectionRanking(windows, current) {
    var body = $('detectionRankingBody');
    if (!body) return;
    body.replaceChildren();
    if (!windows.length) {
      var empty = document.createElement('tr');
      empty.className = 'is-empty';
      var cell = document.createElement('td');
      cell.colSpan = 2;
      cell.textContent = '点击“开始检测位置”后显示每个窗口的概率。';
      empty.appendChild(cell);
      body.appendChild(empty);
      return;
    }
    var sorted = windows.slice().sort(function (a, b) {
      return b.score - a.score || a.top - b.top || a.left - b.left;
    });
    sorted.forEach(function (windowScore, index) {
      var row = document.createElement('tr');
      if (index === 0) row.classList.add('is-best');
      if (current && current.left === windowScore.left && current.top === windowScore.top) {
        row.classList.add('is-current');
      }
      var coord = document.createElement('td');
      coord.textContent = 'x=' + windowScore.left + ', y=' + windowScore.top;
      row.appendChild(coord);
      var score = document.createElement('td');
      score.textContent = formatPercent(windowScore.score);
      row.appendChild(score);
      body.appendChild(row);
    });
  }

  function scanDetectionTarget() {
    if (!classifierReadyForNextStep()) {
      setReadout('第一幕需要先让当前卷积核组合的验证集准确率超过 90%，才能进入滑窗识别。', true);
      return;
    }
    if (!state.detectionIdeaSubmitted) {
      setReadout('先提交你的检测思路，再开始检测位置。', true);
      return;
    }
    if (state.detectionTimer) window.clearInterval(state.detectionTimer);
    drawDetectionScene();
    hideDetectionBox();
    function scoreWindow(left, top) {
      var prediction = inferDigitImage(cropDetectionWindow(left, top));
      return {
        left: left,
        top: top,
        score: prediction.probs ? Number(prediction.probs[DETECTION_TARGET_DIGIT]) || 0 : 0,
      };
    }
    var starts = detectionScanStarts();
    var windowsToScan = [];
    starts.forEach(function (top) {
      starts.forEach(function (left) {
        windowsToScan.push({ left: left, top: top });
      });
    });
    var total = windowsToScan.length;
    var index = 0;
    var button = $('detectionScanBtn');
    var best = { left: 0, top: 0, score: -1 };
    state.detectionWindows = [];
    state.resourcesRevealed = false;
    updateProgressiveDisclosure();
    $('detectionResult').textContent = '-';
    if (button) button.disabled = true;
    renderDetectionRanking([]);
    updateDetectionProgress(0, total);
    function tick() {
      var last = null;
      for (var scanned = 0; scanned < DETECTION_SCAN_WINDOWS_PER_TICK && index < total; scanned += 1) {
        var item = windowsToScan[index];
        last = scoreWindow(item.left, item.top);
        state.detectionWindows.push(last);
        if (last.score > best.score) best = last;
        index += 1;
      }
      if (last) {
        showDetectionBox(last.left, last.top);
        $('detectionStatus').textContent = '正在遍历窗口 x=' + last.left + ', y=' + last.top + '，P(6)=' + formatPercent(last.score) + '。';
      }
      if (index % DETECTION_TABLE_UPDATE_EVERY === 0 || index >= total) {
        renderDetectionRanking(state.detectionWindows, last);
      }
      updateDetectionProgress(index, total);
      if (index >= total) {
        window.clearInterval(state.detectionTimer);
        state.detectionTimer = 0;
        showDetectionBox(best.left, best.top);
        renderDetectionRanking(state.detectionWindows, best);
        $('detectionResult').textContent = 'x=' + best.left + ', y=' + best.top + ', P(6)=' + formatPercent(best.score);
        $('detectionStatus').textContent = '全部窗口已按 P(6) 从高到低排序，橙色框标出最高概率坐标。';
        state.resourcesRevealed = true;
        renderResources();
        updateProgressiveDisclosure();
        var resources = $('lenetResources');
        if (resources) {
          window.requestAnimationFrame(function () {
            resources.scrollIntoView({
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
              block: 'start'
            });
          });
        }
        if (button) button.disabled = false;
      }
    }
    tick();
    state.detectionTimer = window.setInterval(tick, DETECTION_SCAN_INTERVAL_MS);
  }

  async function submitDetectionIdea(answer) {
    answer = String(answer || '').trim();
    var question = state.detectionQuestion;
    var button = question && question.submit;
    if (!answer) return;
    if (question) question.streamFeedback('正在分析你的思路，请稍候。', 'hint');
    if (button) {
      button.disabled = true;
      button.classList.add('is-loading');
      button.setAttribute('aria-busy', 'true');
    }
    try {
      var response = await fetch(DETECTION_FEEDBACK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: answer }),
      });
      var data = await response.json().catch(function () { return {}; });
      var result = window.DLModuleUI.requireServiceResult(response, data);
      var feedback = window.DLModuleUI.shortAnswerFeedback(result);
      if (question) question.streamFeedback(feedback.message, feedback.tone);
      state.detectionIdeaSubmitted = true;
      $('detectionStatus').textContent = '思路已提交，可以开始检测位置。';
      renderDetectionRanking([]);
      updateProgressiveDisclosure();
    } catch (error) {
      if (question) question.streamFeedback(window.DLModuleUI.friendlyErrorMessage(error), 'wrong');
    } finally {
      if (button) {
        button.disabled = false;
        button.classList.remove('is-loading');
        button.setAttribute('aria-busy', 'false');
      }
    }
  }

  function nextSample() {
    state.customImage = null;
    state.customImageVersion += 1;
    if (!state.result) {
      state.previewSampleIndex = (state.previewSampleIndex + 137) % 10000;
      state.preview = null;
      $('trainStatus').textContent = '刷新特征图';
      renderSample();
      loadPreview();
      return;
    }
    var source = state.result || state.preview;
    if (!source || !source.samples || !source.samples.length) return;
    state.sampleIndex = (state.sampleIndex + 1) % source.samples.length;
    renderSample();
  }

  function bindDigitDrawing() {
    var canvas = $('digitCanvas');
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (event) {
      if (state.training) return;
      if (event.button != null && event.button !== 0) return;
      state.digitDrawing = true;
      state.digitLastPoint = canvasPoint(canvas, event);
      strokeDigitLine(state.digitLastPoint, state.digitLastPoint);
      if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    canvas.addEventListener('pointermove', function (event) {
      if (!state.digitDrawing || !state.digitLastPoint) return;
      var point = canvasPoint(canvas, event);
      strokeDigitLine(state.digitLastPoint, point);
      state.digitLastPoint = point;
      event.preventDefault();
    });
    canvas.addEventListener('pointerup', function (event) {
      finishDigitDrawing();
      if (canvas.releasePointerCapture) canvas.releasePointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointercancel', finishDigitDrawing);
    canvas.addEventListener('pointerleave', function () {
      if (state.digitDrawing) finishDigitDrawing();
    });
  }

  function init() {
    ensureSequenceContinueCue();
    ensureDetectionContinueCue();
    var handwritingButton = $('clearCanvasBtn');
    if (handwritingButton) {
      ['pointerover', 'focusin', 'click'].forEach(function (eventName) {
        handwritingButton.addEventListener(eventName, function () {
          if (handwritingButton.hasAttribute('data-dl-button-hint')) state.handwritingHintDismissed = true;
        });
      });
    }
    if (window.DLModuleUI && window.DLModuleUI.mountQuestion) {
      state.sequenceQuestion = window.DLModuleUI.mountQuestion('#sequenceIdeaForm', {
        type: 'short',
        title: '如何利用刚刚训练得到的识别器识别这串数字？',
        rows: 3,
        submitText: '提交想法',
        hintButton: true,
        validator: function () { return { ok: true, tone: 'hint', message: '正在提交你的思路。' }; },
        onCheck: function (result) {
          if (!result.empty) submitSequenceIdea((result.answer || [])[0]);
        }
      });
      state.detectionQuestion = window.DLModuleUI.mountQuestion('#detectionIdeaForm', {
        type: 'short',
        title: '如何利用刚刚的网络在这张图里找到 6？',
        rows: 3,
        submitText: '提交想法',
        hintButton: true,
        validator: function () { return { ok: true, tone: 'hint', message: '正在提交你的思路。' }; },
        onCheck: function (result) {
          demoteIdeaSubmitButton(state.detectionQuestion);
          if (!result.empty) submitDetectionIdea((result.answer || [])[0]);
        }
      });
      window.DLModuleUI.bindInputHints(document);
    }
    updateProgressiveDisclosure();
    renderKernelControls();
    renderSample();
    renderProbBars(null);
    drawClassifier(null);
    $('trainStatus').textContent = '加载特征图';
    schedulePreview();
    $('trainBtn').addEventListener('click', function () { startTraining(); });
    $('clearCanvasBtn').addEventListener('click', handleHandwriteButton);
    $('sequenceBuildBtn').addEventListener('click', function () { buildSequenceImage({ random: true }); });
    $('sequenceScanBtn').addEventListener('click', runSequenceScan);
    $('detectionResetBtn').addEventListener('click', resetDetectionScene);
    $('detectionScanBtn').addEventListener('click', scanDetectionTarget);
    bindDigitDrawing();
    $('resetKernelsBtn').addEventListener('click', resetKernels);
    document.querySelector('.lenet-feature-block').addEventListener('pointerenter', function (event) {
      event.currentTarget.classList.add('is-browsing');
    });
    document.querySelector('.lenet-feature-block').addEventListener('pointerleave', function (event) {
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
      if (moved) {
        window.setTimeout(function () { state.featureDeckMoved = false; }, 0);
      }
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
      if (moved) {
        window.setTimeout(function () { state.featurePickerMoved = false; }, 0);
      }
    });
    $('activeKernels').addEventListener('pointercancel', function () {
      state.featurePickerDragging = false;
      state.featurePickerMoved = false;
      $('activeKernels').classList.remove('is-dragging');
      syncFeatureBlockBrowsing(false);
    });
    $('activeKernels').addEventListener('keydown', keyActiveKernelPicker);
    $('kernelDropZone').addEventListener('dragover', function (event) {
      event.preventDefault();
      $('activeKernels').classList.add('is-over');
      $('kernelDropZone').classList.add('is-over');
    });
    $('kernelDropZone').addEventListener('dragleave', function () {
      $('activeKernels').classList.remove('is-over');
      $('kernelDropZone').classList.remove('is-over');
    });
    $('kernelDropZone').addEventListener('drop', function (event) {
      event.preventDefault();
      $('activeKernels').classList.remove('is-over');
      $('kernelDropZone').classList.remove('is-over');
      addKernel(event.dataTransfer.getData('text/plain'));
    });
    if (window.DLCanvas && window.DLCanvas.observe) {
      window.DLCanvas.observe([$('digitCanvas'), $('featureViewer'), $('classifierCanvas'), $('sequenceCanvas'), $('detectionCanvas')], function () {
        renderSample();
        drawSequenceImage();
        drawDetectionScene();
      });
    } else {
      window.addEventListener('resize', function () {
        renderSample();
        drawSequenceImage();
        drawDetectionScene();
      });
    }
    buildSequenceImage({ random: true });
    resetDetectionScene();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

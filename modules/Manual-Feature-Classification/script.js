(function () {
  'use strict';

  var FEATURE_FEEDBACK_ENDPOINT = 'http://127.0.0.1:59414/digit/features-feedback';
  var ORDER_FEEDBACK_ENDPOINT = 'http://127.0.0.1:59414/digit/vector-order-feedback';
  var IMAGE_SIZE = 28;
  var THRESHOLD = 0;
  var MLP_AUTO_SWITCH_MS = 2000;
  var REGION_BOUNDS = [0, 9, 19, 28];
  var REGION_LABELS = [
    '左上格', '上中格', '右上格',
    '左中格', '中间格', '右中格',
    '左下格', '下中格', '右下格',
  ];
  var VECTOR_ORDERS = {
    row: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    column: [0, 3, 6, 1, 4, 7, 2, 5, 8],
    reverse: [8, 7, 6, 5, 4, 3, 2, 1, 0],
    snake: [0, 1, 2, 5, 4, 3, 6, 7, 8],
  };
  var VECTOR_ORDER_LABELS = {
    row: '从左上到右下',
    column: '按列从上到下',
    reverse: '从右下到左上',
    snake: '蛇形顺序',
  };
  var DIGIT_COLORS = [
    '#2f5f98', '#1f8a68', '#e07a3f', '#bf4058', '#6d5aa8',
    '#237b84', '#6f8b2e', '#c56735', '#4d6fb3', '#9a4f86',
  ];
  var MNIST_FILES = {
    0: ['60003.png', '60010.png', '60013.png', '60025.png', '60028.png', '60055.png', '60069.png', '60071.png', '60101.png', '60126.png', '60136.png', '60148.png', '60157.png', '60183.png', '60188.png', '60192.png'],
    1: ['60002.png', '60005.png', '60014.png', '60029.png', '60031.png', '60037.png', '60039.png', '60040.png', '60046.png', '60057.png', '60074.png', '60089.png', '60094.png', '60096.png', '60107.png', '60135.png'],
    2: ['60001.png', '60035.png', '60038.png', '60043.png', '60047.png', '60072.png', '60077.png', '60082.png', '60106.png', '60119.png', '60147.png', '60149.png', '60172.png', '60174.png', '60186.png', '60199.png'],
    3: ['60018.png', '60030.png', '60032.png', '60044.png', '60051.png', '60063.png', '60068.png', '60076.png', '60087.png', '60090.png', '60093.png', '60112.png', '60142.png', '60158.png', '60173.png', '60195.png'],
    4: ['60004.png', '60006.png', '60019.png', '60024.png', '60027.png', '60033.png', '60042.png', '60048.png', '60049.png', '60056.png', '60065.png', '60067.png', '60085.png', '60095.png', '60103.png', '60109.png'],
    5: ['60008.png', '60015.png', '60023.png', '60045.png', '60052.png', '60053.png', '60059.png', '60102.png', '60120.png', '60127.png', '60129.png', '60132.png', '60152.png', '60153.png', '60155.png', '60162.png'],
    6: ['60011.png', '60021.png', '60022.png', '60050.png', '60054.png', '60066.png', '60081.png', '60088.png', '60091.png', '60098.png', '60100.png', '60123.png', '60130.png', '60131.png', '60138.png', '60140.png'],
    7: ['60000.png', '60017.png', '60026.png', '60034.png', '60036.png', '60041.png', '60060.png', '60064.png', '60070.png', '60075.png', '60079.png', '60080.png', '60083.png', '60086.png', '60097.png', '60111.png'],
    8: ['60061.png', '60084.png', '60110.png', '60128.png', '60134.png', '60146.png', '60177.png', '60179.png', '60181.png', '60184.png', '60226.png', '60232.png', '60233.png', '60242.png', '60257.png', '60260.png'],
    9: ['60007.png', '60009.png', '60012.png', '60016.png', '60020.png', '60058.png', '60062.png', '60073.png', '60078.png', '60092.png', '60099.png', '60104.png', '60105.png', '60108.png', '60113.png', '60118.png'],
  };
  var samples = buildSamples();
  var vectorQuestionApi = null;
  var orderQuestionApi = null;
  var activeFlowCue = null;
  var state = {
    currentSample: null,
    pixels: [],
    features: [],
    targetRegion: 4,
    activeRegion: 0,
    scanTimer: 0,
    scanPhase: 'loading',
    flashPixel: null,
    revealedCounts: [],
    manualDone: false,
    vectorDone: false,
    selectedVectorOption: '',
    vectorPreviewOrder: '',
    vectorPreviewTimer: 0,
    datasetLoading: false,
    rows: [],
    selectedRegion: 4,
    distributionCards: [],
    distributionGameActive: false,
    distributionGameCompleted: false,
    distributionGameTargets: [1, 0, 8],
    distributionGameStep: 0,
    distributionGameOrder: [],
    distributionGameMarks: {},
    distributionHoverDigit: null,
    distributionGameWaitingConfirm: false,
    mlpCueMounted: false,
    mlpSampleIndex: 0,
    mlpPhase: 'trainSet',
    mlpInputMode: 'sample',
    mlpDrawPixels: [],
    mlpDrawHasInk: false,
    mlpDrawing: false,
    mlpModel: null,
    mlpTraining: false,
    mlpFinalCueMounted: false,
    mlpFinalRevealed: false,
    mlpAutoTimer: 0,
    mlpFinalCuePending: false,
  };

  function $(id) {
    return document.getElementById(id);
  }

  function buildSamples() {
    var result = [];
    Object.keys(MNIST_FILES).forEach(function (digit) {
      MNIST_FILES[digit].forEach(function (name) {
        result.push({
          label: Number(digit),
          file: name,
          path: 'dataset/mnist/' + digit + '/' + name,
        });
      });
    });
    return result;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function formatNumber(value, digits) {
    return Number(value || 0).toFixed(digits == null ? 1 : digits);
  }

  function regionCapacity(index) {
    var row = Math.floor(index / 3);
    var col = index % 3;
    return (REGION_BOUNDS[row + 1] - REGION_BOUNDS[row]) * (REGION_BOUNDS[col + 1] - REGION_BOUNDS[col]);
  }

  function regionCenter(index) {
    var row = Math.floor(index / 3);
    var col = index % 3;
    return {
      x: (REGION_BOUNDS[col] + REGION_BOUNDS[col + 1]) / 2,
      y: (REGION_BOUNDS[row] + REGION_BOUNDS[row + 1]) / 2,
    };
  }

  function prepareCanvas(canvas, fill) {
    var ctx;
    if (window.DLCanvas) {
      ctx = window.DLCanvas.prepare(canvas);
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
    ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, width, height);
    }
    return { ctx: ctx, width: width, height: height };
  }

  function setProgress(key) {
    var order = ['count', 'distribution', 'mlp', 'summary'];
    var currentIndex = order.indexOf(key);
    document.querySelectorAll('[data-progress]').forEach(function (item) {
      var itemKey = item.getAttribute('data-progress');
      var itemIndex = order.indexOf(itemKey);
      var current = itemKey === key;
      item.classList.toggle('is-current', current);
      item.classList.toggle('is-done', itemIndex >= 0 && itemIndex < currentIndex);
      if (current) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
      if (itemIndex <= currentIndex) item.removeAttribute('aria-disabled');
      else item.setAttribute('aria-disabled', 'true');
    });
  }

  function setFeedback(target, text, tone, stream) {
    if (!target) return;
    var settings = {
      'is-correct': { color: 'green', label: '正确反馈' },
      'is-close': { color: 'orange', label: '思考提示' },
      'is-loading': { color: 'orange', label: '正在处理' },
      'is-blocked': { color: 'red', label: '需要调整' },
    }[tone] || { color: 'blue', label: '观察提示' };
    target.className = 'edu-callout edu-callout--' + settings.color + (stream ? ' edu-callout--stream' : '') + ' hdf-feedback' + (tone ? ' ' + tone : '');
    var label = target.querySelector('.edu-callout-label');
    var body = target.querySelector('.edu-callout-text');
    if (!label || !body) {
      target.replaceChildren();
      label = document.createElement('strong');
      label.className = 'edu-callout-label';
      body = document.createElement('span');
      body.className = 'edu-callout-text';
      target.appendChild(label);
      target.appendChild(body);
    }
    label.textContent = settings.label;
    if (stream && window.DLModuleUI && window.DLModuleUI.streamText) {
      window.DLModuleUI.streamText(body, text || '', { interval: 24 });
    } else {
      body.textContent = text || '';
    }
  }

  function hideFlowIndicator() {
    var indicator = $('flowScrollIndicator');
    if (indicator) indicator.hidden = true;
  }

  function resetFlowArea(areaId, targetId) {
    var area = $(areaId);
    var target = $(targetId);
    if (area) {
      area.hidden = true;
      area.setAttribute('aria-hidden', 'true');
    }
    if (target) {
      target.hidden = true;
      target.setAttribute('aria-hidden', 'true');
      target.classList.remove('is-revealing');
    }
    if (activeFlowCue && activeFlowCue.areaId === areaId) {
      activeFlowCue = null;
      hideFlowIndicator();
    }
  }

  function armFlowCue(areaId, targetId, title, body, onReveal) {
    var area = $(areaId);
    var target = $(targetId);
    var indicator = $('flowScrollIndicator');
    if (!area || !target || !indicator) return;
    area.hidden = false;
    area.setAttribute('aria-hidden', 'false');
    target.hidden = true;
    target.setAttribute('aria-hidden', 'true');
    $('flowScrollTitle').textContent = title;
    $('flowScrollBody').textContent = body;
    activeFlowCue = {
      areaId: areaId,
      targetId: targetId,
      onReveal: onReveal,
    };
    indicator.hidden = false;
  }

  function confirmFlowCue() {
    if (!activeFlowCue) return;
    var cue = activeFlowCue;
    activeFlowCue = null;
    hideFlowIndicator();
    var target = $(cue.targetId);
    if (!target) return;
    target.hidden = false;
    target.setAttribute('aria-hidden', 'false');
    target.classList.add('is-revealing');
    if (typeof cue.onReveal === 'function') cue.onReveal();
    window.setTimeout(function () {
      target.classList.remove('is-revealing');
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  function loadImage(sample) {
    return new Promise(function (resolve, reject) {
      var image = new Image();
      image.onload = function () { resolve(image); };
      image.onerror = function () { reject(new Error('图片加载失败：' + sample.path)); };
      image.src = '../../' + sample.path;
    });
  }

  function imageToPixels(image) {
    var scratch = document.createElement('canvas');
    scratch.width = IMAGE_SIZE;
    scratch.height = IMAGE_SIZE;
    var ctx = scratch.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);
    ctx.drawImage(image, 0, 0, IMAGE_SIZE, IMAGE_SIZE);
    var data = ctx.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE).data;
    var pixels = [];
    for (var row = 0; row < IMAGE_SIZE; row += 1) {
      var line = [];
      for (var col = 0; col < IMAGE_SIZE; col += 1) {
        var index = (row * IMAGE_SIZE + col) * 4;
        line.push(data[index] > 0 ? 1 : 0);
      }
      pixels.push(line);
    }
    return pixels;
  }

  function blankPixels() {
    var pixels = [];
    for (var row = 0; row < IMAGE_SIZE; row += 1) {
      pixels[row] = [];
      for (var col = 0; col < IMAGE_SIZE; col += 1) {
        pixels[row][col] = 0;
      }
    }
    return pixels;
  }

  function computeNineGrid(pixels) {
    var features = [];
    for (var gridRow = 0; gridRow < 3; gridRow += 1) {
      for (var gridCol = 0; gridCol < 3; gridCol += 1) {
        var top = REGION_BOUNDS[gridRow];
        var bottom = REGION_BOUNDS[gridRow + 1];
        var left = REGION_BOUNDS[gridCol];
        var right = REGION_BOUNDS[gridCol + 1];
        var count = 0;
        for (var row = top; row < bottom; row += 1) {
          for (var col = left; col < right; col += 1) {
            if (pixels[row][col] > THRESHOLD) count += 1;
          }
        }
        var capacity = (bottom - top) * (right - left);
        features.push({
          count: count,
          capacity: capacity,
          density: count / capacity,
          label: REGION_LABELS[gridRow * 3 + gridCol],
        });
      }
    }
    return features;
  }

  function pickPracticeRegion(features) {
    var best = -1;
    var bestCount = Infinity;
    features.forEach(function (feature, index) {
      if (feature.count <= 0 || index === 0) return;
      if (feature.count < bestCount) {
        best = index;
        bestCount = feature.count;
      }
    });
    if (best >= 0) return best;
    features.forEach(function (feature, index) {
      if (feature.count <= 0) return;
      if (feature.count < bestCount) {
        best = index;
        bestCount = feature.count;
      }
    });
    if (best >= 0) return best;
    return features.reduce(function (maxIndex, feature, index) {
      return feature.count > features[maxIndex].count ? index : maxIndex;
    }, 0);
  }

  function resetFirstActState() {
    if (state.scanTimer) {
      window.clearTimeout(state.scanTimer);
      state.scanTimer = 0;
    }
    state.activeRegion = 0;
    state.scanPhase = 'loading';
    state.flashPixel = null;
    state.revealedCounts = Array.from({ length: 9 }, function () { return false; });
    state.manualDone = false;
    state.vectorDone = false;
    state.selectedVectorOption = '';
    clearVectorPreview();
  }

  async function loadPracticeSample(sample) {
    var chosen = sample || samples.find(function (item) { return item.label === 7 && item.file === '60000.png'; }) || samples[0];
    resetFirstActState();
    state.currentSample = chosen;
    $('sampleLabel').textContent = '数字 ' + chosen.label;
    $('regionZoom').hidden = true;
    $('countInput').value = '';
    $('countForm').hidden = true;
    $('countSubmit').disabled = false;
    $('vectorQuestion').hidden = true;
    $('orderQuestion').hidden = true;
    $('vectorQuestion').replaceChildren();
    $('orderQuestion').replaceChildren();
    vectorQuestionApi = null;
    orderQuestionApi = null;
    $('countFeedback').hidden = false;
    $('distributionStage').hidden = true;
    $('distributionStage').setAttribute('aria-hidden', 'true');
    resetFlowArea('mlpFlowArea', 'mlpStage');
    resetFlowArea('finalFlowArea', 'mlpFinalSection');
    state.rows = [];
    state.mlpCueMounted = false;
    stopMlpAutoCycle();
    resetDistributionGame();
    state.mlpPhase = 'trainSet';
    state.mlpInputMode = 'sample';
    state.mlpDrawPixels = [];
    state.mlpDrawHasInk = false;
    state.mlpModel = null;
    $('mlpStatus').textContent = '等待训练';
    $('mlpEpoch').textContent = '0 / 900';
    $('mlpAccuracy').textContent = '-';
    state.mlpFinalCueMounted = false;
    state.mlpFinalRevealed = false;
    state.mlpFinalCuePending = false;
    setProgress('count');
    $('datasetStatus').textContent = '完成上方任务后，这里会显示 0 到 9 的平均像素分布。';
    setFeedback($('countFeedback'), '图片加载中。', 'is-loading');

    try {
      var image = await loadImage(chosen);
      state.pixels = imageToPixels(image);
      state.features = computeNineGrid(state.pixels);
      state.targetRegion = pickPracticeRegion(state.features);
      state.selectedRegion = state.targetRegion;
      state.activeRegion = 0;
      $('manualCountTitle').textContent = '自动计数中';
      $('countInstruction').textContent = '计算机正按从左上到右下的顺序数格子。每个被数到的像素会闪一下，数完后数量会直接写在图上。';
      setFeedback($('countFeedback'), '先看图上的高亮框移动和像素闪烁。', '');
      renderVectorChoices();
      drawPracticeCanvases();
      renderRegionButtons();
      drawDistributionChart();
      renderFeatureStats();
      startAutoScan();
    } catch (error) {
      setFeedback($('countFeedback'), error.message || String(error), 'is-blocked');
    }
  }

  function chooseAnotherPracticeSample() {
    var next = samples[Math.floor(Math.random() * samples.length)];
    if (state.currentSample && samples.length > 1 && next.path === state.currentSample.path) {
      return chooseAnotherPracticeSample();
    }
    return loadPracticeSample(next);
  }

  function startAutoScan() {
    if (!state.features.length) return;
    state.scanPhase = 'autoScan';
    state.activeRegion = 0;
    state.flashPixel = null;
    $('countForm').hidden = true;
    $('vectorQuestion').hidden = true;
    animateRegionCount(0);
  }

  function animateRegionCount(regionIndex) {
    if (state.scanTimer) {
      window.clearTimeout(state.scanTimer);
      state.scanTimer = 0;
    }
    if (state.scanPhase !== 'autoScan') return;

    state.activeRegion = regionIndex;
    var pixels = brightPixelsInRegion(regionIndex);
    var pixelIndex = 0;

    function tick() {
      if (state.scanPhase !== 'autoScan') return;
      if (pixelIndex < pixels.length) {
        state.flashPixel = pixels[pixelIndex];
        drawPracticeCanvases();
        pixelIndex += 1;
        state.scanTimer = window.setTimeout(tick, 46);
        return;
      }

      state.flashPixel = null;
      drawPracticeCanvases();

      if (regionIndex === state.targetRegion) {
        stopForManualCount();
        return;
      }

      state.revealedCounts[regionIndex] = true;
      drawPracticeCanvases();
      state.scanTimer = window.setTimeout(function () {
        animateRegionCount(regionIndex + 1);
      }, 320);
    }

    drawPracticeCanvases();
    state.scanTimer = window.setTimeout(tick, 180);
  }

  function stopForManualCount() {
    state.scanPhase = 'manualCount';
    state.flashPixel = null;
    $('manualCountTitle').textContent = '轮到你数白色像素点';
    $('countInstruction').textContent = '请观察放大图，数完后输入数量。';
    $('regionZoomCanvas').setAttribute('aria-label', '待计数区域的像素放大图');
    $('regionZoom').hidden = false;
    $('countForm').hidden = false;
    $('countInput').value = '';
    $('countInput').focus();
    setFeedback($('countFeedback'), '数数图中有几个白色像素点。', '');
    drawPracticeCanvases();
  }

  function brightPixelsInRegion(regionIndex) {
    if (!state.pixels.length) return [];
    var gridRow = Math.floor(regionIndex / 3);
    var gridCol = regionIndex % 3;
    var top = REGION_BOUNDS[gridRow];
    var bottom = REGION_BOUNDS[gridRow + 1];
    var left = REGION_BOUNDS[gridCol];
    var right = REGION_BOUNDS[gridCol + 1];
    var result = [];
    for (var row = top; row < bottom; row += 1) {
      for (var col = left; col < right; col += 1) {
        if (state.pixels[row][col] > THRESHOLD) {
          result.push({ row: row, col: col });
        }
      }
    }
    return result;
  }

  function drawPracticeCanvases() {
    drawDigitCanvas($('digitCanvas'), state.pixels, {
      activeRegion: state.activeRegion,
      showGrid: true,
      flashPixel: state.flashPixel,
      traversalOrder: state.manualDone ? state.vectorPreviewOrder : '',
      label: state.currentSample ? String(state.currentSample.label) : '',
    });
    if (!$('regionZoom').hidden) {
      drawRegionZoom($('regionZoomCanvas'), state.pixels, state.targetRegion);
    }
  }

  function drawRegionZoom(canvas, pixels, regionIndex) {
    if (!canvas || !pixels.length) return;
    var prepared = prepareCanvas(canvas, '#0b1020');
    var ctx = prepared.ctx;
    var width = prepared.width;
    var height = prepared.height;
    var gridRow = Math.floor(regionIndex / 3);
    var gridCol = regionIndex % 3;
    var top = REGION_BOUNDS[gridRow];
    var bottom = REGION_BOUNDS[gridRow + 1];
    var left = REGION_BOUNDS[gridCol];
    var right = REGION_BOUNDS[gridCol + 1];
    var rows = bottom - top;
    var cols = right - left;
    var padding = Math.max(18, Math.min(width, height) * 0.07);
    var cell = Math.min((width - padding * 2) / cols, (height - padding * 2) / rows);
    var originX = (width - cols * cell) / 2;
    var originY = (height - rows * cell) / 2;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    for (var row = 0; row < rows; row += 1) {
      for (var col = 0; col < cols; col += 1) {
        var x = originX + col * cell;
        var y = originY + row * cell;
        ctx.fillStyle = pixels[top + row][left + col] > THRESHOLD ? '#f8fbff' : '#11182a';
        ctx.fillRect(x, y, Math.ceil(cell), Math.ceil(cell));
        ctx.strokeStyle = 'rgba(159, 176, 200, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cell, cell);
      }
    }
    ctx.strokeStyle = '#e07a3f';
    ctx.lineWidth = 3;
    ctx.strokeRect(originX, originY, cols * cell, rows * cell);
    ctx.restore();
  }

  function drawDigitCanvas(canvas, pixels, options) {
    if (!canvas || !pixels.length) return;
    options = options || {};
    var prepared = prepareCanvas(canvas, '#0b1020');
    var ctx = prepared.ctx;
    var width = prepared.width;
    var height = prepared.height;
    var margin = Math.max(12, Math.min(width, height) * 0.055);
    var cell = Math.min((width - margin * 2) / IMAGE_SIZE, (height - margin * 2) / IMAGE_SIZE);
    var originX = (width - cell * IMAGE_SIZE) / 2;
    var originY = (height - cell * IMAGE_SIZE) / 2;

    ctx.save();
    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, width, height);
    for (var row = 0; row < IMAGE_SIZE; row += 1) {
      for (var col = 0; col < IMAGE_SIZE; col += 1) {
        if (pixels[row][col] <= THRESHOLD) continue;
        var isFlash = options.flashPixel && options.flashPixel.row === row && options.flashPixel.col === col;
        ctx.fillStyle = isFlash ? '#e07a3f' : '#f8fbff';
        ctx.fillRect(originX + col * cell, originY + row * cell, Math.ceil(cell), Math.ceil(cell));
        if (isFlash) {
          ctx.strokeStyle = 'rgba(255,255,255,0.96)';
          ctx.lineWidth = Math.max(1, cell * 0.12);
          ctx.strokeRect(originX + col * cell, originY + row * cell, Math.ceil(cell), Math.ceil(cell));
        }
      }
    }

    if (options.showGrid) {
      ctx.lineWidth = Math.max(1, cell * 0.08);
      for (var index = 1; index < REGION_BOUNDS.length - 1; index += 1) {
        var pos = REGION_BOUNDS[index] * cell;
        ctx.strokeStyle = 'rgba(224, 122, 63, 0.72)';
        ctx.beginPath();
        ctx.moveTo(originX + pos, originY);
        ctx.lineTo(originX + pos, originY + IMAGE_SIZE * cell);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(originX, originY + pos);
        ctx.lineTo(originX + IMAGE_SIZE * cell, originY + pos);
        ctx.stroke();
      }
    }

    if (options.activeRegion != null) {
      var active = options.activeRegion;
      var activeRow = Math.floor(active / 3);
      var activeCol = active % 3;
      var left = originX + REGION_BOUNDS[activeCol] * cell;
      var top = originY + REGION_BOUNDS[activeRow] * cell;
      var right = originX + REGION_BOUNDS[activeCol + 1] * cell;
      var bottom = originY + REGION_BOUNDS[activeRow + 1] * cell;
      ctx.fillStyle = 'rgba(224, 122, 63, 0.16)';
      ctx.fillRect(left, top, right - left, bottom - top);
      ctx.lineWidth = Math.max(3, cell * 0.18);
      ctx.strokeStyle = '#e07a3f';
      ctx.strokeRect(left, top, right - left, bottom - top);
    }

    if (options.traversalOrder && VECTOR_ORDERS[options.traversalOrder]) {
      drawVectorTraversal(ctx, originX, originY, cell, options.traversalOrder);
    }

    var countFeatures = options.countFeatures || state.features;
    if (options.showCounts !== false && countFeatures.length) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (var region = 0; region < 9; region += 1) {
        if (!options.countFeatures && !state.revealedCounts[region] && !state.manualDone) continue;
        var regionRow = Math.floor(region / 3);
        var regionCol = region % 3;
        var centerX = originX + ((REGION_BOUNDS[regionCol] + REGION_BOUNDS[regionCol + 1]) / 2) * cell;
        var centerY = originY + ((REGION_BOUNDS[regionRow] + REGION_BOUNDS[regionRow + 1]) / 2) * cell;
        var text = options.countMode === 'percent'
          ? formatNumber((countFeatures[region].count / regionCapacity(region)) * 100, 0) + '%'
          : String(countFeatures[region].count);
        ctx.font = '950 ' + Math.max(17, Math.round(cell * (options.countMode === 'percent' ? 1.18 : 1.8))) + 'px system-ui, sans-serif';
        ctx.lineWidth = Math.max(4, cell * 0.22);
        ctx.strokeStyle = 'rgba(11,16,32,0.9)';
        ctx.strokeText(text, centerX, centerY + 1);
        ctx.fillStyle = !options.countFeatures && region === state.targetRegion ? '#e07a3f' : '#f8fbff';
        ctx.fillText(text, centerX, centerY + 1);
      }
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
    }

    if (options.label) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '900 15px system-ui, sans-serif';
      ctx.fillText('label: ' + options.label, 14, 24);
    }
    ctx.restore();
  }

  function drawVectorTraversal(ctx, originX, originY, cell, order) {
    var indexes = VECTOR_ORDERS[order];
    var points = indexes.map(function (regionIndex) {
      var center = regionCenter(regionIndex);
      return {
        x: originX + center.x * cell,
        y: originY + center.y * cell,
        region: regionIndex,
      };
    });
    var routeColor = '#57b8ff';
    var badgeColor = '#f07842';
    var shorten = Math.max(19, cell * 1.15);

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    points.slice(0, -1).forEach(function (point, index) {
      var next = points[index + 1];
      var dx = next.x - point.x;
      var dy = next.y - point.y;
      var distance = Math.sqrt(dx * dx + dy * dy) || 1;
      var unitX = dx / distance;
      var unitY = dy / distance;
      var startX = point.x + unitX * shorten;
      var startY = point.y + unitY * shorten;
      var endX = next.x - unitX * shorten;
      var endY = next.y - unitY * shorten;
      var rowDistance = Math.abs(Math.floor(point.region / 3) - Math.floor(next.region / 3));
      var colDistance = Math.abs((point.region % 3) - (next.region % 3));
      var isJump = rowDistance + colDistance > 1;

      ctx.setLineDash(isJump ? [Math.max(5, cell * 0.35), Math.max(5, cell * 0.35)] : []);
      ctx.strokeStyle = isJump ? 'rgba(87,184,255,0.55)' : routeColor;
      ctx.lineWidth = Math.max(4, cell * 0.28);
      ctx.shadowColor = 'rgba(87,184,255,0.48)';
      ctx.shadowBlur = Math.max(7, cell * 0.5);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      var arrowSize = Math.max(9, cell * 0.65);
      ctx.fillStyle = routeColor;
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - unitX * arrowSize - unitY * arrowSize * 0.58, endY - unitY * arrowSize + unitX * arrowSize * 0.58);
      ctx.lineTo(endX - unitX * arrowSize + unitY * arrowSize * 0.58, endY - unitY * arrowSize - unitX * arrowSize * 0.58);
      ctx.closePath();
      ctx.fill();
    });

    points.forEach(function (point, index) {
      var regionRow = Math.floor(point.region / 3);
      var regionCol = point.region % 3;
      var badgeX = originX + REGION_BOUNDS[regionCol] * cell + Math.max(15, cell * 1.05);
      var badgeY = originY + REGION_BOUNDS[regionRow] * cell + Math.max(15, cell * 1.05);
      var radius = Math.max(10, cell * 0.72);
      ctx.fillStyle = badgeColor;
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 ' + Math.max(11, Math.round(cell * 0.82)) + 'px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(index + 1), badgeX, badgeY + 0.5);
    });

    ctx.fillStyle = '#57b8ff';
    ctx.font = '850 ' + Math.max(12, Math.round(cell * 0.9)) + 'px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('路径预览 · ' + VECTOR_ORDER_LABELS[order], originX + IMAGE_SIZE * cell, Math.max(22, originY - 8));
    ctx.restore();
  }

  function submitManualCount(event) {
    event.preventDefault();
    if (!state.features.length) return;
    var input = $('countInput');
    var rawValue = String(input.value).trim();
    var value = Number(rawValue);
    if (!rawValue || !Number.isFinite(value) || !Number.isInteger(value)) {
      setFeedback($('countFeedback'), '先输入一个整数，再提交。', 'is-blocked');
      input.focus();
      return;
    }

    var answer = state.features[state.targetRegion].count;
    var diff = Math.abs(Math.round(value) - answer);
    if (diff !== 0) {
      setFeedback($('countFeedback'), '还不对。白色小方块一个一个数，只数这一格里的白块。', 'is-close');
      $('countInput').select();
      return;
    }

    setFeedback($('countFeedback'), '正确。现在这张图已经被提取成 9 个数字，请选择哪个向量表示也成立。', 'is-correct');
    state.manualDone = true;
    state.revealedCounts = state.revealedCounts.map(function () { return true; });
    $('countSubmit').disabled = true;
    $('countForm').hidden = true;
    $('regionZoom').hidden = true;
    $('vectorQuestion').hidden = false;
    $('manualCountTitle').textContent = '选择这个 7 的特征向量';
    $('countInstruction').textContent = '图上的 9 个数字已经提取出来了。请选择哪一个判断最准确。';
    $('countFeedback').hidden = true;
    renderVectorChoices();
    drawPracticeCanvases();
    window.setTimeout(function () {
      var firstOption = $('vectorQuestion').querySelector('.dl-question-option');
      if (firstOption) firstOption.focus();
    }, 80);
  }

  function vectorOrderIndexes(order) {
    return (VECTOR_ORDERS[order] || VECTOR_ORDERS.row).slice();
  }

  function vectorValuesByOrder(order) {
    var values = state.features.map(function (feature) { return feature.count; });
    var indexes = vectorOrderIndexes(order);
    return indexes.map(function (index) { return values[index]; });
  }

  function vectorText(values) {
    return '[' + values.join(', ') + ']';
  }

  function renderVectorChoices() {
    var host = $('vectorQuestion');
    if (!host || !window.DLModuleUI || !window.DLModuleUI.mountQuestion || !state.features.length) return;
    state.selectedVectorOption = '';
    var options = [
      { key: 'A', value: 'row', label: '从左上到右下：' + vectorText(vectorValuesByOrder('row')) },
      { key: 'B', value: 'column', label: '先按列从上到下：' + vectorText(vectorValuesByOrder('column')) },
      { key: 'C', value: 'reverse', label: '从右下到左上：' + vectorText(vectorValuesByOrder('reverse')) },
      { key: 'D', value: 'snake', label: '蛇形顺序：' + vectorText(vectorValuesByOrder('snake')) },
      { key: 'E', value: 'all', label: '以上都可以，只要所有样本始终使用同一种顺序' },
    ];
    vectorQuestionApi = window.DLModuleUI.mountQuestion(host, {
      type: 'choice',
      title: '哪一个可以作为这个数字 7 的特征向量？',
      options: options,
      answer: 'all',
      feedback: {
        correct: '正确。排列顺序可以约定，关键是所有样本保持一致。',
        wrong: '这个排列可以使用，但并不是唯一可用的排列。再想想顺序真正需要满足什么条件。',
      },
      onCheck: function (result) {
        var key = result.answer && result.answer[0];
        chooseVectorOption({ key: key });
      },
    });
    bindVectorPathPreviews(host, options);
  }

  function bindVectorPathPreviews(host, options) {
    host.querySelectorAll('.dl-question-option').forEach(function (button, index) {
      var order = options[index] && options[index].value;
      if (!order) return;
      button.addEventListener('pointerenter', function () { showVectorPreview(order, button); });
      button.addEventListener('focus', function () { showVectorPreview(order, button); });
      button.addEventListener('pointerdown', function () { showVectorPreview(order, button); });
      button.addEventListener('pointerleave', function () { hideVectorPreviewWhenIdle(button); });
      button.addEventListener('blur', function () { hideVectorPreviewWhenIdle(button); });
    });
  }

  function showVectorPreview(order, button) {
    if (!state.manualDone || state.vectorDone) return;
    stopVectorPreviewCycle();
    document.querySelectorAll('#vectorQuestion .dl-question-option').forEach(function (item) {
      item.classList.toggle('is-previewing', item === button);
    });
    state.vectorPreviewOrder = order === 'all' ? 'row' : order;
    updateVectorPreviewCanvas();

    if (order !== 'all' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var cycle = ['row', 'column', 'reverse', 'snake'];
    var cycleIndex = 0;
    state.vectorPreviewTimer = window.setInterval(function () {
      cycleIndex = (cycleIndex + 1) % cycle.length;
      state.vectorPreviewOrder = cycle[cycleIndex];
      updateVectorPreviewCanvas();
    }, 900);
  }

  function hideVectorPreviewWhenIdle(button) {
    window.setTimeout(function () {
      if (button.matches(':hover') || document.activeElement === button) return;
      if (document.querySelector('#vectorQuestion .dl-question-option.is-previewing:hover, #vectorQuestion .dl-question-option.is-previewing:focus')) return;
      clearVectorPreview();
    }, 0);
  }

  function stopVectorPreviewCycle() {
    if (!state.vectorPreviewTimer) return;
    window.clearInterval(state.vectorPreviewTimer);
    state.vectorPreviewTimer = 0;
  }

  function updateVectorPreviewCanvas() {
    var canvas = $('digitCanvas');
    if (!canvas) return;
    var orderLabel = VECTOR_ORDER_LABELS[state.vectorPreviewOrder];
    canvas.classList.toggle('is-path-previewing', !!orderLabel);
    canvas.setAttribute('aria-label', orderLabel
      ? '带九宫格的 MNIST 手写数字，正在预览' + orderLabel + '的特征读取路径'
      : '带九宫格的 MNIST 手写数字');
    drawPracticeCanvases();
  }

  function clearVectorPreview() {
    stopVectorPreviewCycle();
    state.vectorPreviewOrder = '';
    document.querySelectorAll('#vectorQuestion .dl-question-option.is-previewing').forEach(function (item) {
      item.classList.remove('is-previewing');
    });
    updateVectorPreviewCanvas();
  }

  function chooseVectorOption(option) {
    if (state.vectorDone) return;
    state.selectedVectorOption = option.key;
    $('orderQuestion').hidden = true;
    $('orderQuestion').replaceChildren();
    orderQuestionApi = null;
    $('countFeedback').hidden = true;

    if (option.key === 'all') {
      window.setTimeout(function () {
        finishFeatureVectorStage('正确。排列顺序可以约定；只要所有样本都按同一种顺序排，模型读到的特征就是一致的。');
      }, 180);
      return;
    }

    mountOrderQuestion();
  }

  function mountOrderQuestion() {
    var host = $('orderQuestion');
    if (!host || !window.DLModuleUI || !window.DLModuleUI.mountQuestion) return;
    host.hidden = false;
    orderQuestionApi = window.DLModuleUI.mountQuestion(host, {
      type: 'short',
      title: '为什么你觉得特征向量必须使用某一个特定顺序？',
      rows: 4,
      answerLabel: '写一句你的想法',
      submitText: '提交回答',
      hintButton: true,
      feedback: { empty: '先写一句你的理由。' },
      onCheck: function (result) {
        if (!result.empty) submitOrderReflection(result.answer && result.answer[0]);
      },
    });
    window.setTimeout(function () {
      var field = host.querySelector('[data-role="question-answer"]');
      if (field) field.focus();
    }, 60);
  }

  function finishFeatureVectorStage(message, tone) {
    clearVectorPreview();
    state.vectorDone = true;
    $('countFeedback').hidden = false;
    setFeedback(
      $('countFeedback'),
      message || '正确。只要所有样本都使用同一种排列方式，特征向量就可以比较。',
      tone || 'is-correct',
      true
    );
    $('distributionStage').hidden = false;
    $('distributionStage').setAttribute('aria-hidden', 'false');
    setProgress('distribution');
    window.setTimeout(function () {
      $('distributionStage').scrollIntoView({ behavior: 'smooth', block: 'start' });
      loadDatasetStats();
    }, 260);
  }

  function orderCorrectionText(prefix) {
    var lead = prefix ? prefix + '。' : '';
    return lead + '特征向量的排列可以约定，不管怎么排列，只要所有数据都使用完全一致的排列方式就可以比较。我们习惯从左上到右下，只是因为它方便检查和交流。';
  }

  function localOrderFeedback() {
    return {
      verdict: '澄清一下',
      is_correct: true,
      explanation: '特征向量的排列可以约定，不管怎么排列，只要所有数据都使用完全一致的排列方式就可以。我们习惯从左上到右下，只是因为它方便检查和交流。',
    };
  }

  async function submitOrderReflection(answer) {
    answer = String(answer || '').trim();
    if (!answer || !orderQuestionApi) return;
    var submit = orderQuestionApi.submit;
    if (submit) {
      submit.disabled = true;
      submit.textContent = '正在分析...';
    }
    orderQuestionApi.streamFeedback('正在分析你的想法，请稍候。', 'hint');
    try {
      var response = await fetch(ORDER_FEEDBACK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: answer,
          selected_order: state.selectedVectorOption,
        }),
      });
      var data = await response.json().catch(function () { return {}; });
      var result = window.DLModuleUI.requireServiceResult(response, data);
      var feedback = window.DLModuleUI.shortAnswerFeedback(result);
      var tone = feedback.tone === 'correct' ? 'is-correct' : (feedback.tone === 'hint' ? 'is-close' : 'is-blocked');
      orderQuestionApi.streamFeedback(feedback.message, feedback.tone, {
        onComplete: function () { finishFeatureVectorStage(feedback.message, tone); }
      });
    } catch (error) {
      var message = window.DLModuleUI.friendlyErrorMessage(error);
      orderQuestionApi.streamFeedback(message, 'wrong', {
        onComplete: function () { finishFeatureVectorStage(message, 'is-blocked'); }
      });
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.textContent = '提交回答';
      }
    }
  }

  function renderRegionButtons() {
    var host = $('regionButtons');
    if (!host) return;
    host.replaceChildren();
    REGION_LABELS.forEach(function (label, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.className = index === state.selectedRegion ? 'is-active' : '';
      button.addEventListener('click', function () {
        state.selectedRegion = index;
        renderRegionButtons();
        drawDistributionChart();
        renderFeatureStats();
      });
      host.appendChild(button);
    });
    $('selectedFeatureTitle').textContent = REGION_LABELS[state.selectedRegion] + '像素数';
  }

  function resetDistributionGame() {
    state.distributionCards = [];
    state.distributionGameActive = false;
    state.distributionGameCompleted = false;
    state.distributionGameStep = 0;
    state.distributionGameOrder = [];
    state.distributionGameMarks = {};
    state.distributionHoverDigit = null;
    state.distributionGameWaitingConfirm = false;
    var prompt = $('distributionGamePrompt');
    if (prompt) {
      prompt.hidden = true;
      prompt.className = 'edu-notice-strip edu-notice-strip--orange hdf-game-prompt';
      prompt.textContent = '点击下方按钮开始。';
    }
    var button = $('distributionGameBtn');
    if (button) {
      button.hidden = false;
      button.textContent = '观察好了，玩个小游戏';
      button.disabled = !state.rows.length;
    }
    var cue = $('mlpCueHost');
    if (cue) cue.replaceChildren();
    resetFlowArea('mlpFlowArea', 'mlpStage');
    resetFlowArea('finalFlowArea', 'mlpFinalSection');
  }

  function startDistributionGame() {
    if (!state.rows.length) return;
    resetFlowArea('mlpFlowArea', 'mlpStage');
    resetMlpFinalSection();
    stopMlpAutoCycle();
    state.distributionGameActive = true;
    state.distributionGameCompleted = false;
    state.distributionGameStep = 0;
    state.distributionGameMarks = {};
    state.distributionHoverDigit = null;
    state.distributionGameWaitingConfirm = false;
    state.distributionGameOrder = shuffledDigits();
    state.mlpCueMounted = false;
    var cue = $('mlpCueHost');
    if (cue) cue.replaceChildren();
    var button = $('distributionGameBtn');
    if (button) button.hidden = true;
    updateDistributionGamePrompt();
    drawDistributionChart();
  }

  function shuffledDigits() {
    var digits = [];
    for (var digit = 0; digit <= 9; digit += 1) digits.push(digit);
    for (var index = digits.length - 1; index > 0; index -= 1) {
      var swap = Math.floor(Math.random() * (index + 1));
      var value = digits[index];
      digits[index] = digits[swap];
      digits[swap] = value;
    }
    return digits;
  }

  function updateDistributionGamePrompt(tone, text) {
    var prompt = $('distributionGamePrompt');
    if (!prompt) return;
    prompt.hidden = false;
    var color = tone === 'is-correct' ? 'green' : (tone === 'is-wrong' ? 'red' : 'orange');
    prompt.className = 'edu-notice-strip edu-notice-strip--' + color + ' hdf-game-prompt' + (tone ? ' ' + tone : '');
    if (text) {
      prompt.replaceChildren(document.createTextNode(text));
      return;
    }
    var target = state.distributionGameTargets[state.distributionGameStep];
    prompt.replaceChildren(document.createTextNode('请点击 ' + target + ' 对应的位置'));
  }

  function distributionTargetHint(digit) {
    var hints = {
      1: '1 的形态特征是中间列多、两侧少，像一条竖直的笔画。',
      0: '0 的形态特征是中间少、四周多，中心格通常会比外圈淡。',
      8: '8 的形态特征是中间多，上下两个圈也会留下明显像素。',
    };
    return hints[digit] || digit + ' 的形态特征要看九宫格里像素最集中的区域。';
  }

  function distributionCardAtPoint(canvas, event) {
    if (!canvas || !state.distributionCards.length) return null;
    var point = window.DLCanvas && window.DLCanvas.pointer
      ? window.DLCanvas.pointer(canvas, event)
      : fallbackCanvasPointer(canvas, event);
    return state.distributionCards.find(function (card) {
      return point.x >= card.x && point.x <= card.x + card.width && point.y >= card.y && point.y <= card.y + card.height;
    }) || null;
  }

  function clearDistributionGameMarks() {
    state.distributionGameMarks = {};
    state.distributionHoverDigit = null;
    var canvas = $('distributionCanvas');
    if (canvas) canvas.classList.remove('is-clickable');
    drawDistributionChart();
  }

  function showDistributionWrongPrompt(target) {
    var prompt = $('distributionGamePrompt');
    if (!prompt) return;
    prompt.hidden = false;
    prompt.className = 'edu-notice-strip edu-notice-strip--red hdf-game-prompt is-wrong';
    var message = document.createElement('span');
    message.textContent = '不对。' + distributionTargetHint(target) + ' 绿色框才是 ' + target + ' 的位置。';
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'edu-btn edu-btn--primary hdf-game-confirm';
    button.textContent = '确定';
    button.addEventListener('click', confirmDistributionWrong);
    prompt.replaceChildren(message, button);
  }

  function confirmDistributionWrong() {
    if (!state.distributionGameWaitingConfirm) return;
    state.distributionGameWaitingConfirm = false;
    state.distributionGameStep += 1;

    if (state.distributionGameStep >= state.distributionGameTargets.length) {
      state.distributionGameCompleted = true;
      state.distributionGameActive = false;
      clearDistributionGameMarks();
      updateDistributionGamePrompt('is-correct', '完成。');
      mountMlpCue();
      return;
    }

    clearDistributionGameMarks();
    updateDistributionGamePrompt();
  }

  function handleDistributionCanvasMove(event) {
    var canvas = $('distributionCanvas');
    if (!canvas || !state.rows.length) return;
    var hovered = distributionCardAtPoint(canvas, event);
    var nextDigit = hovered ? hovered.digit : null;
    if (state.distributionHoverDigit === nextDigit) return;
    state.distributionHoverDigit = nextDigit;
    canvas.classList.toggle('is-clickable', !!hovered && state.distributionGameActive && !state.distributionGameCompleted);
    drawDistributionChart();
  }

  function handleDistributionCanvasLeave() {
    var canvas = $('distributionCanvas');
    if (canvas) canvas.classList.remove('is-clickable');
    if (state.distributionHoverDigit == null) return;
    state.distributionHoverDigit = null;
    drawDistributionChart();
  }

  function handleDistributionCanvasClick(event) {
    if (!state.distributionGameActive || state.distributionGameCompleted || state.distributionGameWaitingConfirm) return;
    var canvas = $('distributionCanvas');
    var clicked = distributionCardAtPoint(canvas, event);
    if (!clicked) return;

    var target = state.distributionGameTargets[state.distributionGameStep];
    if (clicked.digit === target) {
      state.distributionGameMarks[target] = 'correct';
      updateDistributionGamePrompt('is-correct', '正确。');
    } else {
      if (state.distributionGameMarks[clicked.digit] !== 'correct') {
        state.distributionGameMarks[clicked.digit] = 'wrong';
      }
      state.distributionGameMarks[target] = 'correct';
      state.distributionGameWaitingConfirm = true;
      showDistributionWrongPrompt(target);
      drawDistributionChart();
      return;
    }
    state.distributionGameStep += 1;
    drawDistributionChart();

    if (state.distributionGameStep >= state.distributionGameTargets.length) {
      state.distributionGameCompleted = true;
      state.distributionGameActive = false;
      window.setTimeout(function () {
        clearDistributionGameMarks();
        updateDistributionGamePrompt('is-correct', '完成。');
        mountMlpCue();
      }, 360);
      return;
    }
    window.setTimeout(function () {
      clearDistributionGameMarks();
      updateDistributionGamePrompt();
    }, 520);
  }

  async function loadDatasetStats() {
    if (state.datasetLoading) return;
    state.datasetLoading = true;
    if ($('recountButton')) $('recountButton').disabled = true;
    $('distributionGameBtn').disabled = true;
    $('distributionStage').hidden = false;
    $('datasetStatus').textContent = '正在读取 MNIST 子集：0 / ' + samples.length;
    state.rows = [];

    try {
      for (var index = 0; index < samples.length; index += 1) {
        var sample = samples[index];
        var image = await loadImage(sample);
        var pixels = imageToPixels(image);
        var features = computeNineGrid(pixels);
        state.rows.push({
          sample: sample,
          pixels: pixels,
          features: features,
        });
        if (index % 8 === 0 || index === samples.length - 1) {
          $('datasetStatus').textContent = '正在读取 MNIST 子集：' + (index + 1) + ' / ' + samples.length;
          await waitFrame();
        }
      }
      $('datasetStatus').textContent = '请从 0 开始逐个看到 9，记住每个数字颜色最深的位置和整体形状。观察好后，玩个小游戏。';
      $('distributionStage').hidden = false;
      setProgress('distribution');
      renderRegionButtons();
      drawDistributionChart();
      renderFeatureStats();
      prepareMlpSample();
      $('distributionGameBtn').disabled = false;
      window.setTimeout(function () {
        $('distributionStage').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    } catch (error) {
      $('datasetStatus').textContent = error.message || String(error);
    } finally {
      state.datasetLoading = false;
      if ($('recountButton')) $('recountButton').disabled = false;
    }
  }

  function waitFrame() {
    return new Promise(function (resolve) {
      window.requestAnimationFrame(function () { resolve(); });
    });
  }

  function rowsByDigit() {
    var result = {};
    for (var digit = 0; digit <= 9; digit += 1) result[digit] = [];
    state.rows.forEach(function (row) {
      result[row.sample.label].push(row);
    });
    return result;
  }

  function featureValue(row, regionIndex) {
    return row.features[regionIndex] ? row.features[regionIndex].count : 0;
  }

  function drawDistributionChart() {
    var canvas = $('distributionCanvas');
    if (!canvas || canvas.closest('[hidden]') || !state.rows.length) return;
    var prepared = prepareCanvas(canvas, '#fbfdff');
    var ctx = prepared.ctx;
    var width = prepared.width;
    var height = prepared.height;
    var byDigit = rowsByDigit();
    var digitHeatmaps = [];
    var maxPercent = 1;

    for (var digit = 0; digit <= 9; digit += 1) {
      var percentages = [];
      for (var region = 0; region < 9; region += 1) {
        var mean = meanValue(byDigit[digit], function (row) { return featureValue(row, region); });
        var percent = regionCapacity(region) ? (mean / regionCapacity(region)) * 100 : 0;
        percentages.push(percent);
        maxPercent = Math.max(maxPercent, percent);
      }
      digitHeatmaps.push({
        digit: digit,
        percentages: percentages,
        sampleCount: byDigit[digit].length,
      });
    }

    ctx.fillStyle = '#fbfdff';
    ctx.fillRect(0, 0, width, height);

    var margin = { left: 28, right: 28, top: 26, bottom: 24 };
    var gapX = 16;
    var gapY = 18;
    var cardWidth = (width - margin.left - margin.right - gapX * 4) / 5;
    var cardHeight = (height - margin.top - margin.bottom - gapY) / 2;

    state.distributionCards = [];
    var orderedHeatmaps = state.distributionGameActive || state.distributionGameCompleted
      ? state.distributionGameOrder.map(function (digit) { return digitHeatmaps[digit]; })
      : digitHeatmaps;

    orderedHeatmaps.forEach(function (item, index) {
      var col = index % 5;
      var row = Math.floor(index / 5);
      var x = margin.left + col * (cardWidth + gapX);
      var y = margin.top + row * (cardHeight + gapY);
      state.distributionCards.push({ digit: item.digit, x: x, y: y, width: cardWidth, height: cardHeight });
      drawDigitHeatmapCard(ctx, item, x, y, cardWidth, cardHeight, maxPercent, {
        hideLabel: state.distributionGameActive || state.distributionGameCompleted,
        mark: state.distributionGameMarks[item.digit],
        hover: state.distributionHoverDigit === item.digit,
      });
    });
  }

  function drawDigitHeatmapCard(ctx, item, x, y, width, height, maxPercent, options) {
    options = options || {};
    var isCorrect = options.mark === 'correct';
    var isWrong = options.mark === 'wrong';
    var isHover = options.hover;

    ctx.save();
    if (isHover) {
      ctx.shadowColor = 'rgba(47,95,152,0.18)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
    }
    ctx.fillStyle = isHover ? '#f8fbff' : '#ffffff';
    roundRect(ctx, x, y, width, height, 8);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = isCorrect
      ? 'rgba(31,138,104,0.86)'
      : (isWrong ? 'rgba(191,64,88,0.86)' : (isHover ? 'rgba(47,95,152,0.76)' : 'rgba(32,50,77,0.14)'));
    ctx.lineWidth = isCorrect || isWrong || isHover ? 3 : 1;
    roundRect(ctx, x, y, width, height, 8);
    ctx.stroke();

    if (!options.hideLabel) {
      ctx.fillStyle = DIGIT_COLORS[item.digit];
      ctx.font = '950 34px system-ui, sans-serif';
      ctx.fillText(String(item.digit), x + 18, y + 42);
      ctx.fillStyle = 'rgba(32,50,77,0.56)';
      ctx.font = '850 12px system-ui, sans-serif';
      ctx.fillText(item.sampleCount + ' 张样本平均', x + 58, y + 33);
    }

    var gridSize = options.hideLabel ? Math.min(width - 34, height - 34) : Math.min(width - 40, height - 70);
    var gridX = x + (width - gridSize) / 2;
    var gridY = options.hideLabel ? y + (height - gridSize) / 2 : y + height - gridSize - 18;
    var cell = gridSize / 3;

    for (var region = 0; region < 9; region += 1) {
      var row = Math.floor(region / 3);
      var col = region % 3;
      var value = item.percentages[region];
      var intensity = maxPercent > 0 ? value / maxPercent : 0;
      var cellX = gridX + col * cell;
      var cellY = gridY + row * cell;
      ctx.fillStyle = heatColor(intensity);
      ctx.fillRect(cellX + 1, cellY + 1, cell - 2, cell - 2);
      ctx.strokeStyle = 'rgba(32,50,77,0.32)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cellX + 0.5, cellY + 0.5, cell - 1, cell - 1);
      if (cell > 38) {
        ctx.fillStyle = intensity > 0.46 ? 'rgba(255,255,255,0.96)' : 'rgba(32,50,77,0.72)';
        ctx.font = '850 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(formatNumber(value, 0) + '%', cellX + cell / 2, cellY + cell / 2);
      }
    }
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }

  function roundRect(ctx, x, y, width, height, radius) {
    var r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function heatColor(intensity) {
    var t = Math.pow(clamp(intensity, 0, 1), 0.72);
    var stops = [
      [255, 252, 247],
      [249, 208, 201],
      [224, 105, 123],
      [156, 31, 64],
    ];
    var scaled = t * (stops.length - 1);
    var index = Math.min(stops.length - 2, Math.floor(scaled));
    var local = scaled - index;
    var from = stops[index];
    var to = stops[index + 1];
    var r = Math.round(from[0] + (to[0] - from[0]) * local);
    var g = Math.round(from[1] + (to[1] - from[1]) * local);
    var b = Math.round(from[2] + (to[2] - from[2]) * local);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function meanValue(rows, accessor) {
    if (!rows || !rows.length) return 0;
    var sum = 0;
    rows.forEach(function (row) {
      sum += accessor(row);
    });
    return sum / rows.length;
  }

  function renderFeatureStats() {
    var host = $('featureStats');
    if (!host) return;
    host.replaceChildren();
    if (!state.rows.length) {
      host.appendChild(createStatItem('?', '等待统计', '统计完成后，这里会显示每个数字在当前格子的平均像素数。'));
      return;
    }
    var byDigit = rowsByDigit();
    var means = [];
    for (var digit = 0; digit <= 9; digit += 1) {
      means.push({
        digit: digit,
        mean: meanValue(byDigit[digit], function (row) { return featureValue(row, state.selectedRegion); }),
      });
    }
    means.sort(function (a, b) { return b.mean - a.mean; });
    var top = means.slice(0, 3);
    top.forEach(function (item, index) {
      host.appendChild(createStatItem(
        String(item.digit),
        (index + 1) + '. 平均 ' + formatNumber(item.mean, 1),
        '这个数字在“' + REGION_LABELS[state.selectedRegion] + '”更常有墨水。'
      ));
    });
    var low = means[means.length - 1];
    host.appendChild(createStatItem(
      String(low.digit),
      '最低平均 ' + formatNumber(low.mean, 1),
      '和高平均数字拉开差距时，这个特征才更有区分力。'
    ));
  }

  function createStatItem(digit, title, body) {
    var item = document.createElement('div');
    item.className = 'hdf-stat-item';
    var badge = document.createElement('div');
    badge.className = 'hdf-stat-digit';
    badge.textContent = digit;
    if (/^\d$/.test(digit)) badge.style.background = DIGIT_COLORS[Number(digit)];
    var text = document.createElement('div');
    var strong = document.createElement('strong');
    strong.textContent = title;
    var span = document.createElement('span');
    span.textContent = body;
    text.appendChild(strong);
    text.appendChild(span);
    var value = document.createElement('span');
    value.textContent = REGION_LABELS[state.selectedRegion];
    item.appendChild(badge);
    item.appendChild(text);
    item.appendChild(value);
    return item;
  }

  function localFeatureFeedback(answer) {
    var text = String(answer || '').toLowerCase();
    var hasMeasurement = /特征|测量|数字|数值|像素|统计|计数/.test(text);
    var hasCompare = /区分|分类|比较|分布|不同|规律|判断/.test(text);
    if (hasMeasurement && hasCompare) {
      return {
        verdict: '抓住了特征思维。',
        is_correct: true,
        explanation: '特征就是把样本压成可比较的测量值。一个格子的像素数很简单，但已经能让不同数字形成不同分布。',
      };
    }
    return {
      verdict: '再往“可比较的测量”想一步。',
      is_correct: false,
      explanation: '重点不是像素数本身多高级，而是它让图片变成可以排序、比较、画分布的数字。',
    };
  }

  async function submitFeatureReflection(event) {
    event.preventDefault();
    var answer = $('featureReflection').value.trim();
    if (!answer) {
      setFeedback($('featureReflectionFeedback'), '先写一句你的观察。', 'is-blocked');
      $('featureReflection').focus();
      return;
    }

    $('featureReflectionSubmit').disabled = true;
    $('featureReflectionSubmit').textContent = '正在分析...';
    setFeedback($('featureReflectionFeedback'), '正在分析你的观察，请稍候。', 'is-loading', true);
    try {
      var response = await fetch(FEATURE_FEEDBACK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: answer,
          selected_region: REGION_LABELS[state.selectedRegion],
          feature_name: REGION_LABELS[state.selectedRegion] + '像素数',
        }),
      });
      var data = await response.json().catch(function () { return {}; });
      var result = window.DLModuleUI.requireServiceResult(response, data);
      var feedback = window.DLModuleUI.shortAnswerFeedback(result);
      setFeedback(
        $('featureReflectionFeedback'),
        feedback.message,
        feedback.tone === 'correct' ? 'is-correct' : (feedback.tone === 'hint' ? 'is-close' : 'is-blocked'),
        true
      );
    } catch (error) {
      setFeedback(
        $('featureReflectionFeedback'),
        window.DLModuleUI.friendlyErrorMessage(error),
        'is-blocked',
        true
      );
    } finally {
      $('featureReflectionSubmit').disabled = false;
      $('featureReflectionSubmit').textContent = '提交反馈';
      mountMlpCue();
    }
  }

  function mountMlpCue() {
    var host = $('mlpCueHost');
    if (!host || state.mlpCueMounted || !state.rows.length) return;
    state.mlpCueMounted = true;
    host.hidden = false;
    armFlowCue(
      'mlpFlowArea',
      'mlpStage',
      '继续看双层 MLP',
      '向下滚动或点击，查看 9 个特征如何完成十分类。',
      showMlpStage
    );
  }

  function mountMlpRelatedVideos() {
    var host = $('mlpRelatedVideoHost');
    if (!host || !window.DLModuleUI || !window.DLModuleUI.renderRelatedVideos) return;
    if (host.hasChildNodes()) return;
    host.innerHTML = window.DLModuleUI.renderRelatedVideos([
          {
      title:'2.4 特征工程【斯坦福21秋季：实用机器学习中文版】',
      embed:'<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=976027811&bvid=BV1t44y1x7Hw&cid=423753460&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
    },
    ], {
      showHeader: false,
    });
  }

  function resetMlpFinalSection() {
    state.mlpFinalCueMounted = false;
    state.mlpFinalRevealed = false;
    var cueHost = $('mlpFinalCueHost');
    if (cueHost) cueHost.replaceChildren();
    var finalSection = $('mlpFinalSection');
    if (finalSection) finalSection.hidden = true;
    resetFlowArea('finalFlowArea', 'mlpFinalSection');
    var videoHost = $('mlpRelatedVideoHost');
    if (videoHost) videoHost.replaceChildren();
    state.mlpFinalCuePending = false;
    updateMlpToolbar();
  }

  function updateMlpToolbar() {
    var drawButton = $('mlpDrawBtn');
    var trainButton = $('mlpTrainBtn');
    var canDraw = state.mlpPhase === 'trainSet' && canStartMlpDrawPhase();
    var inDraw = state.mlpPhase === 'draw';
    if (drawButton) {
      drawButton.hidden = !(canDraw || inDraw);
      drawButton.disabled = !(canDraw || inDraw);
      drawButton.textContent = inDraw ? '清空重写' : '手写测试';
      drawButton.classList.toggle('dl-button-hint', canDraw);
      if (canDraw) drawButton.setAttribute('data-dl-button-hint', '');
      else drawButton.removeAttribute('data-dl-button-hint');
    }
    if (trainButton) {
      trainButton.hidden = canDraw || inDraw;
      trainButton.disabled = state.mlpTraining;
      trainButton.classList.toggle('is-loading', state.mlpTraining);
      trainButton.textContent = state.mlpTraining ? '训练中' : '训练 MLP';
      if (state.mlpTraining) trainButton.setAttribute('aria-busy', 'true');
      else trainButton.removeAttribute('aria-busy');
    }
  }

  function mountMlpFinalCue() {
    var host = $('mlpFinalCueHost');
    if (!host || state.mlpFinalCueMounted || state.mlpFinalRevealed) return;
    state.mlpFinalCueMounted = true;
    host.hidden = false;
    armFlowCue(
      'finalFlowArea',
      'mlpFinalSection',
      '查看推荐资源',
      '向下滚动或点击，继续学习。',
      showMlpFinalSection
    );
  }

  function showMlpFinalSection() {
    var finalSection = $('mlpFinalSection');
    if (!finalSection) return;
    state.mlpFinalRevealed = true;
    finalSection.hidden = false;
    finalSection.setAttribute('aria-hidden', 'false');
    setProgress('summary');
    mountMlpRelatedVideos();
  }

  function prepareMlpSample() {
    if (!state.rows.length) return;
    stopMlpAutoCycle();
    resetMlpFinalSection();
    var currentPath = state.currentSample && state.currentSample.path;
    var currentIndex = state.rows.findIndex(function (row) {
      return row.sample.path === currentPath;
    });
    state.mlpSampleIndex = currentIndex >= 0 ? currentIndex : 0;
    state.mlpPhase = 'trainSet';
    state.mlpInputMode = 'sample';
    state.mlpDrawHasInk = false;
    updateMlpToolbar();
    renderMlpStage();
  }

  function stopMlpAutoCycle() {
    if (state.mlpAutoTimer) {
      window.clearTimeout(state.mlpAutoTimer);
      state.mlpAutoTimer = 0;
    }
  }

  function scheduleMlpAutoSampleSwitch(delay) {
    if (state.mlpPhase !== 'trainSet' || !mlpModelReady() || !state.rows.length) return;
    if (state.mlpAutoTimer) window.clearTimeout(state.mlpAutoTimer);
    state.mlpAutoTimer = window.setTimeout(advanceMlpSample, delay == null ? MLP_AUTO_SWITCH_MS : delay);
  }

  function nextMlpSampleIndex() {
    if (state.rows.length <= 1) return state.mlpSampleIndex;
    var next = Math.floor(Math.random() * state.rows.length);
    if (next === state.mlpSampleIndex) next = (next + 1) % state.rows.length;
    return next;
  }

  function advanceMlpSample() {
    state.mlpAutoTimer = 0;
    if (state.mlpPhase !== 'trainSet' || !mlpModelReady() || !state.rows.length) return;
    var next = nextMlpSampleIndex();
    if (next === state.mlpSampleIndex) return;
    state.mlpSampleIndex = next;
    state.mlpInputMode = 'sample';
    renderMlpStage();
    updateMlpToolbar();
    scheduleMlpAutoSampleSwitch(MLP_AUTO_SWITCH_MS);
  }

  function showMlpStage() {
    if (!state.rows.length) return;
    $('mlpStage').hidden = false;
    $('mlpStage').setAttribute('aria-hidden', 'false');
    setProgress('mlp');
    renderMlpStage();
  }

  function chooseMlpSample() {
    if (!state.rows.length || state.mlpPhase !== 'trainSet') return;
    var next = Math.floor(Math.random() * state.rows.length);
    if (state.rows.length > 1 && next === state.mlpSampleIndex) {
      next = (next + 1) % state.rows.length;
    }
    state.mlpSampleIndex = next;
    state.mlpInputMode = 'sample';
    renderMlpStage();
  }

  function currentMlpRow() {
    if (state.mlpInputMode === 'draw') {
      if (!state.mlpDrawPixels.length) state.mlpDrawPixels = blankPixels();
      return {
        sample: { label: null, file: '你的手写输入' },
        pixels: state.mlpDrawPixels,
        features: computeNineGrid(state.mlpDrawPixels),
        isDrawn: true,
      };
    }
    return state.rows[state.mlpSampleIndex] || state.rows[0];
  }

  function clearMlpCanvas() {
    state.mlpInputMode = 'draw';
    state.mlpDrawPixels = blankPixels();
    state.mlpDrawHasInk = false;
    state.mlpDrawing = false;
    state.mlpFinalCuePending = false;
    updateMlpToolbar();
    renderMlpStage();
  }

  function mlpModelReady() {
    return !!(state.mlpModel && state.mlpModel.trained && !state.mlpTraining);
  }

  function canStartMlpDrawPhase() {
    return mlpModelReady();
  }

  function startMlpDrawPhase() {
    if (state.mlpPhase === 'draw') {
      clearMlpCanvas();
      return;
    }
    if (!canStartMlpDrawPhase()) return;
    stopMlpAutoCycle();
    resetMlpFinalSection();
    state.mlpPhase = 'draw';
    clearMlpCanvas();
  }

  function mlpCanvasPointToPixel(event) {
    var canvas = $('mlpDigitCanvas');
    if (!canvas) return null;
    var point = window.DLCanvas && window.DLCanvas.pointer
      ? window.DLCanvas.pointer(canvas, event)
      : fallbackCanvasPointer(canvas, event);
    var logical = window.DLCanvas && window.DLCanvas.size
      ? window.DLCanvas.size(canvas)
      : { width: canvas.clientWidth || canvas.width, height: canvas.clientHeight || canvas.height };
    var margin = Math.max(12, Math.min(logical.width, logical.height) * 0.055);
    var cell = Math.min((logical.width - margin * 2) / IMAGE_SIZE, (logical.height - margin * 2) / IMAGE_SIZE);
    var originX = (logical.width - cell * IMAGE_SIZE) / 2;
    var originY = (logical.height - cell * IMAGE_SIZE) / 2;
    var col = Math.floor((point.x - originX) / cell);
    var row = Math.floor((point.y - originY) / cell);
    if (row < 0 || row >= IMAGE_SIZE || col < 0 || col >= IMAGE_SIZE) return null;
    return { row: row, col: col };
  }

  function fallbackCanvasPointer(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function paintMlpPixel(event) {
    var pixel = mlpCanvasPointToPixel(event);
    if (!pixel) return;
    if (!state.mlpDrawPixels.length) state.mlpDrawPixels = blankPixels();
    var hadInk = state.mlpDrawHasInk;
    for (var row = pixel.row - 1; row <= pixel.row + 1; row += 1) {
      for (var col = pixel.col - 1; col <= pixel.col + 1; col += 1) {
        if (row < 0 || row >= IMAGE_SIZE || col < 0 || col >= IMAGE_SIZE) continue;
        var distance = Math.abs(row - pixel.row) + Math.abs(col - pixel.col);
        if (distance <= 1) state.mlpDrawPixels[row][col] = 1;
      }
    }
    state.mlpDrawHasInk = true;
    renderMlpStage();
    if (!hadInk) state.mlpFinalCuePending = true;
  }

  function beginMlpDrawing(event) {
    if (!$('mlpStage') || $('mlpStage').hidden) return;
    if (state.mlpPhase !== 'draw') {
      event.preventDefault();
      return;
    }
    state.mlpInputMode = 'draw';
    if (!state.mlpDrawPixels.length) state.mlpDrawPixels = blankPixels();
    state.mlpDrawing = true;
    if (event.pointerId != null && event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    paintMlpPixel(event);
    event.preventDefault();
  }

  function continueMlpDrawing(event) {
    if (!state.mlpDrawing) return;
    paintMlpPixel(event);
    event.preventDefault();
  }

  function endMlpDrawing() {
    var shouldMountFinalCue = state.mlpDrawing && state.mlpFinalCuePending;
    state.mlpDrawing = false;
    if (shouldMountFinalCue) {
      state.mlpFinalCuePending = false;
      window.setTimeout(mountMlpFinalCue, 80);
    }
  }

  function rawFeatureVector(row) {
    return row.features.map(function (feature, index) {
      return regionCapacity(index) ? feature.count / regionCapacity(index) : 0;
    });
  }

  function buildFeatureNormalizer(rows) {
    var count = Math.max(1, rows.length);
    var mean = Array.from({ length: 9 }, function () { return 0; });
    rows.forEach(function (row) {
      rawFeatureVector(row).forEach(function (value, index) {
        mean[index] += value;
      });
    });
    mean = mean.map(function (value) { return value / count; });

    var variance = Array.from({ length: 9 }, function () { return 0; });
    rows.forEach(function (row) {
      rawFeatureVector(row).forEach(function (value, index) {
        var diff = value - mean[index];
        variance[index] += diff * diff;
      });
    });
    var std = variance.map(function (value) {
      return Math.sqrt(value / count) || 1;
    });
    return { mean: mean, std: std };
  }

  function modelFeatureVector(row, model) {
    var values = rawFeatureVector(row);
    if (!model || !model.normalizer) return values;
    return values.map(function (value, index) {
      var standardized = (value - model.normalizer.mean[index]) / model.normalizer.std[index];
      return clamp(standardized, -3, 3);
    });
  }

  function createMlpModel() {
    var seed = 1337;
    function rand() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    function weight(scale) {
      return (rand() * 2 - 1) * scale;
    }
    var hidden = 18;
    var model = {
      hidden: hidden,
      normalizer: buildFeatureNormalizer(state.rows),
      w1: [],
      b1: [],
      w2: [],
      b2: [],
      trained: false,
      accuracy: 0,
    };
    for (var h = 0; h < hidden; h += 1) {
      model.w1[h] = [];
      for (var i = 0; i < 9; i += 1) model.w1[h][i] = weight(0.38);
      model.b1[h] = weight(0.02);
    }
    for (var digit = 0; digit < 10; digit += 1) {
      model.w2[digit] = [];
      for (var j = 0; j < hidden; j += 1) model.w2[digit][j] = weight(0.26);
      model.b2[digit] = 0;
    }
    return model;
  }

  function mlpForward(model, input) {
    var hiddenRaw = [];
    var hidden = [];
    for (var h = 0; h < model.hidden; h += 1) {
      var sum = model.b1[h];
      for (var i = 0; i < input.length; i += 1) sum += model.w1[h][i] * input[i];
      hiddenRaw[h] = sum;
      hidden[h] = Math.tanh(sum);
    }
    var logits = [];
    for (var digit = 0; digit < 10; digit += 1) {
      var logit = model.b2[digit];
      for (var j = 0; j < hidden.length; j += 1) logit += model.w2[digit][j] * hidden[j];
      logits[digit] = logit;
    }
    return { input: input, hiddenRaw: hiddenRaw, hidden: hidden, logits: logits, probs: softmax(logits) };
  }

  function softmax(logits) {
    var max = Math.max.apply(null, logits);
    var values = logits.map(function (value) { return Math.exp(value - max); });
    var total = values.reduce(function (sum, value) { return sum + value; }, 0) || 1;
    return values.map(function (value) { return value / total; });
  }

  function trainMlpStep(model, row, rate) {
    var input = modelFeatureVector(row, model);
    var output = mlpForward(model, input);
    var target = row.sample.label;
    var deltaOut = output.probs.slice();
    deltaOut[target] -= 1;

    var deltaHidden = [];
    for (var hidden = 0; hidden < model.hidden; hidden += 1) {
      var grad = 0;
      for (var d = 0; d < 10; d += 1) grad += deltaOut[d] * model.w2[d][hidden];
      deltaHidden[hidden] = grad * (1 - output.hidden[hidden] * output.hidden[hidden]);
    }

    for (var digit = 0; digit < 10; digit += 1) {
      for (var h = 0; h < model.hidden; h += 1) {
        model.w2[digit][h] -= rate * deltaOut[digit] * output.hidden[h];
      }
      model.b2[digit] -= rate * deltaOut[digit];
    }

    for (var h2 = 0; h2 < model.hidden; h2 += 1) {
      for (var i = 0; i < input.length; i += 1) {
        model.w1[h2][i] -= rate * deltaHidden[h2] * input[i];
      }
      model.b1[h2] -= rate * deltaHidden[h2];
    }
    return -Math.log(Math.max(0.000001, output.probs[target]));
  }

  async function trainMlp() {
    if (state.mlpTraining || !state.rows.length) return;
    stopMlpAutoCycle();
    resetMlpFinalSection();
    state.mlpTraining = true;
    state.mlpPhase = 'trainSet';
    state.mlpInputMode = 'sample';
    state.mlpDrawHasInk = false;
    state.mlpModel = createMlpModel();
    updateMlpToolbar();
    $('mlpStatus').textContent = '训练中';
    var epochs = 900;
    $('mlpEpoch').textContent = '0 / ' + epochs;
    var rate = 0.025;
    var loss = 0;
    var trainingComplete = false;
    try {
      for (var epoch = 0; epoch < epochs; epoch += 1) {
        loss = 0;
        for (var index = 0; index < state.rows.length; index += 1) {
          var row = state.rows[(index + epoch) % state.rows.length];
          loss += trainMlpStep(state.mlpModel, row, rate);
        }
        if (epoch % 50 === 0 || epoch === epochs - 1) {
          state.mlpModel.accuracy = evaluateMlp(state.mlpModel);
          $('mlpEpoch').textContent = (epoch + 1) + ' / ' + epochs;
          $('mlpAccuracy').textContent = formatNumber(state.mlpModel.accuracy * 100, 1) + '%';
          renderMlpStage();
          await waitFrame();
        }
      }
      state.mlpModel.trained = true;
      $('mlpStatus').textContent = '训练完成';
      $('mlpEpoch').textContent = epochs + ' / ' + epochs;
      state.mlpModel.accuracy = evaluateMlp(state.mlpModel);
      $('mlpAccuracy').textContent = formatNumber(state.mlpModel.accuracy * 100, 1) + '%';
      renderMlpStage();
      trainingComplete = true;
    } catch (error) {
      $('mlpStatus').textContent = '训练失败，请重试';
      console.error(error);
    } finally {
      state.mlpTraining = false;
      updateMlpToolbar();
    }
    if (trainingComplete) scheduleMlpAutoSampleSwitch(MLP_AUTO_SWITCH_MS);
  }

  function evaluateMlp(model) {
    var correct = 0;
    state.rows.forEach(function (row) {
      var probs = mlpForward(model, modelFeatureVector(row, model)).probs;
      if (argmax(probs) === row.sample.label) correct += 1;
    });
    return state.rows.length ? correct / state.rows.length : 0;
  }

  function argmax(values) {
    var best = 0;
    for (var index = 1; index < values.length; index += 1) {
      if (values[index] > values[best]) best = index;
    }
    return best;
  }

  function renderMlpStage() {
    if (!$('mlpStage') || !state.rows.length) return;
    var row = currentMlpRow();
    $('mlpSampleLabel').textContent = row.isDrawn
      ? '你的手写输入'
      : '数字 ' + row.sample.label + ' · ' + row.sample.file;
    drawDigitCanvas($('mlpDigitCanvas'), row.pixels, {
      showGrid: true,
      showCounts: true,
      countFeatures: row.features,
      countMode: 'count',
      label: row.sample.label == null ? '' : String(row.sample.label),
    });
    renderMlpProbBars(row);
    drawMlpNetwork(row);
    updateMlpToolbar();
  }

  function renderMlpProbBars(row) {
    var host = $('mlpProbBars');
    if (!host) return;
    host.replaceChildren();
    var model = state.mlpModel || createMlpModel();
    var output = mlpForward(model, modelFeatureVector(row, model));
    var prediction = argmax(output.probs);
    $('mlpPrediction').textContent = state.mlpModel
      ? prediction + '（' + formatNumber(output.probs[prediction] * 100, 1) + '%）'
      : '先训练模型';
    for (var digit = 0; digit < 10; digit += 1) {
      var item = document.createElement('div');
      item.className = 'hdf-prob-row' + (digit === prediction && state.mlpModel ? ' is-top' : '') + (digit === row.sample.label ? ' is-label' : '');
      var label = document.createElement('span');
      label.textContent = String(digit);
      var bar = document.createElement('div');
      var fill = document.createElement('i');
      fill.style.width = formatNumber(output.probs[digit] * 100, 2) + '%';
      bar.appendChild(fill);
      var value = document.createElement('strong');
      value.textContent = formatNumber(output.probs[digit] * 100, 1) + '%';
      item.appendChild(label);
      item.appendChild(bar);
      item.appendChild(value);
      host.appendChild(item);
    }
  }

  function drawMlpNetwork(row) {
    var canvas = $('mlpNetworkCanvas');
    if (!canvas) return;
    var prepared = prepareCanvas(canvas, '#fbfdff');
    var ctx = prepared.ctx;
    var width = prepared.width;
    var height = prepared.height;
    var model = state.mlpModel || createMlpModel();
    var output = mlpForward(model, modelFeatureVector(row, model));
    var inputX = 48;
    var hiddenX = width * 0.49;
    var outputX = width - 48;
    var top = 38;
    var bottom = height - 28;
    var inputs = rawFeatureVector(row);
    var hiddenCount = model.hidden;

    ctx.fillStyle = '#20324d';
    ctx.font = '950 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('特征', inputX, 24);
    ctx.fillText('隐藏层', hiddenX, 24);
    ctx.fillText('输出', outputX, 24);
    ctx.textAlign = 'start';

    for (var i = 0; i < inputs.length; i += 1) {
      var yIn = lerp(top, bottom, i / (inputs.length - 1));
      for (var h = 0; h < hiddenCount; h += 1) {
        if (h % 2 !== i % 2) continue;
        var yH = lerp(top, bottom, h / (hiddenCount - 1));
        ctx.strokeStyle = 'rgba(47,95,152,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(inputX + 15, yIn);
        ctx.lineTo(hiddenX - 15, yH);
        ctx.stroke();
      }
    }
    for (var h2 = 0; h2 < hiddenCount; h2 += 1) {
      var yHidden = lerp(top, bottom, h2 / (hiddenCount - 1));
      for (var d = 0; d < 10; d += 1) {
        if (d % 2 !== h2 % 2) continue;
        var yOut = lerp(top, bottom, d / 9);
        ctx.strokeStyle = 'rgba(31,138,104,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hiddenX + 15, yHidden);
        ctx.lineTo(outputX - 15, yOut);
        ctx.stroke();
      }
    }

    inputs.forEach(function (value, index) {
      drawNode(ctx, inputX, lerp(top, bottom, index / 8), 13, heatColor(value), '');
    });
    output.hidden.forEach(function (value, index) {
      var activity = Math.abs(value);
      var color = value >= 0 ? '#1f8a68' : '#d86a44';
      drawNode(ctx, hiddenX, lerp(top, bottom, index / (hiddenCount - 1)), 11, hexToRgba(color, 0.12 + activity * 0.72), '');
    });
    var prediction = argmax(output.probs);
    output.probs.forEach(function (value, digit) {
      var isTop = digit === prediction && state.mlpModel;
      drawNode(
        ctx,
        outputX,
        lerp(top, bottom, digit / 9),
        10,
        isTop ? hexToRgba('#bf4058', 0.9) : 'rgba(54,67,84,0.18)',
        String(digit)
      );
    });
  }

  function drawNode(ctx, x, y, radius, fill, label) {
    ctx.fillStyle = fill;
    ctx.strokeStyle = 'rgba(32,50,77,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (label) {
      ctx.fillStyle = '#20324d';
      ctx.font = '850 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
    }
  }

  function hexToRgba(hex, alpha) {
    var clean = hex.replace('#', '');
    var value = parseInt(clean, 16);
    var r = (value >> 16) & 255;
    var g = (value >> 8) & 255;
    var b = value & 255;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  function renderAllCanvases() {
    drawPracticeCanvases();
    drawDistributionChart();
    renderMlpStage();
  }

  function bindEvents() {
    $('newSampleBtn').addEventListener('click', chooseAnotherPracticeSample);
    $('countForm').addEventListener('submit', submitManualCount);
    if ($('recountButton')) $('recountButton').addEventListener('click', loadDatasetStats);
    $('distributionGameBtn').addEventListener('click', startDistributionGame);
    $('distributionCanvas').addEventListener('click', handleDistributionCanvasClick);
    $('distributionCanvas').addEventListener('pointermove', handleDistributionCanvasMove);
    $('distributionCanvas').addEventListener('pointerleave', handleDistributionCanvasLeave);
    $('mlpTrainBtn').addEventListener('click', trainMlp);
    $('mlpDrawBtn').addEventListener('click', startMlpDrawPhase);
    $('mlpDigitCanvas').addEventListener('pointerdown', beginMlpDrawing);
    $('mlpDigitCanvas').addEventListener('pointermove', continueMlpDrawing);
    $('mlpDigitCanvas').addEventListener('pointerup', endMlpDrawing);
    $('mlpDigitCanvas').addEventListener('pointercancel', endMlpDrawing);
    window.addEventListener('pointerup', endMlpDrawing);
    $('flowScrollIndicator').addEventListener('click', confirmFlowCue);
    window.addEventListener('wheel', function (event) {
      if (activeFlowCue && event.deltaY > 0) confirmFlowCue();
    }, { passive: true });

    if (window.DLCanvas && window.DLCanvas.observe) {
      window.DLCanvas.observe([
        $('digitCanvas'),
        $('distributionCanvas'),
        $('mlpDigitCanvas'),
        $('mlpNetworkCanvas'),
      ], renderAllCanvases);
    } else {
      window.addEventListener('resize', renderAllCanvases);
    }
  }

  function init() {
    if (window.DLModuleUI && window.DLModuleUI.bindInputHints) {
      window.DLModuleUI.bindInputHints(document);
    }
    bindEvents();
    renderRegionButtons();
    renderFeatureStats();
    loadPracticeSample();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

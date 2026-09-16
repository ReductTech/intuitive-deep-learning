(function () {
  'use strict';

  var OBSERVATION_ENDPOINT = 'http://127.0.0.1:59414/image/observation-feedback';
  var MAX_IMAGE_SIDE = 512;
  var SAMPLE_SIZE = 3;
  var recommendedVideos = [
    {
      title: '【硬核科普】全网最简洁易懂的OLED与LCD屏幕工作原理与优劣科普',
      embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=200306152&bvid=BV1Wz411B7Tf&cid=178927590&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
    },
    {
      title: '什么是RGB和CMYK？一个视频全搞懂',
      embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=114703040775428&bvid=BV1K2Njz9EHH&cid=30560420849&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
    },
    {
      title: '纯干货2分钟搞懂：计算机眼中的图像是什么样的',
      embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=360946842&bvid=BV1Q94y1B7Ze&cid=1198489854&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
    }
  ];
  var state = {
    sourceImageData: null,
    imageWidth: 0,
    imageHeight: 0,
    display: { scale: 1, offsetX: 0, offsetY: 0, drawWidth: 0, drawHeight: 0 },
    selected: { x: 0, y: 0 },
    scaleMode: '255',
    draggingSelection: false,
    splitDone: false,
    colorSolved: false,
    magnifierEnabled: false
  };

  function $(id) {
    return document.getElementById(id);
  }

  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }

  function byte(value) {
    return Math.round(clamp(value, 0, 1) * 255);
  }

  function formatUnit(value) {
    return Number(value).toFixed(2);
  }

  function easeInOutCubic(value) {
    return value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2;
  }

  function scrollToElement(element, duration) {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var startY = window.scrollY;
    var targetY = Math.max(0, startY + element.getBoundingClientRect().top - 18);
    if (reduceMotion) {
      window.scrollTo(0, targetY);
      return;
    }
    var startedAt = window.performance.now();
    function step(now) {
      var progress = Math.min(1, (now - startedAt) / duration);
      window.scrollTo(0, startY + (targetY - startY) * easeInOutCubic(progress));
      if (progress < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  function showScene(id) {
    var scene = $(id);
    if (!scene || !scene.hidden) return;
    scene.hidden = false;
    scene.setAttribute('aria-hidden', 'false');
    scene.classList.add('is-revealing');
    scene.addEventListener('animationend', function () {
      scene.classList.remove('is-revealing');
    }, { once: true });
    window.requestAnimationFrame(function () {
      scrollToElement(scene, 520);
    });
  }

  function drawObservationCanvas() {
    var canvas = $('observationCanvas');
    if (!canvas || !window.DLCanvas) return;
    var ctx = window.DLCanvas.prepare(canvas);
    var size = window.DLCanvas.size(canvas);
    var width = size.width;
    var height = size.height;
    ctx.clearRect(0, 0, width, height);

    var sky = ctx.createLinearGradient(0, 0, width, height);
    sky.addColorStop(0, '#2457d6');
    sky.addColorStop(0.42, '#d84588');
    sky.addColorStop(1, '#f2b15b');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    var glow = ctx.createRadialGradient(width * 0.68, height * 0.42, 12, width * 0.68, height * 0.42, width * 0.45);
    glow.addColorStop(0, 'rgba(255,255,255,0.45)');
    glow.addColorStop(0.44, 'rgba(255,255,255,0.12)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = 0.34;
    for (var band = -height; band < width; band += width * 0.075) {
      ctx.fillStyle = band % 2 ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.moveTo(band, height);
      ctx.lineTo(band + width * 0.08, height);
      ctx.lineTo(band + width * 0.72, 0);
      ctx.lineTo(band + width * 0.64, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.shadowColor = 'rgba(16,24,40,0.22)';
    ctx.shadowBlur = width * 0.025;
    ctx.shadowOffsetY = width * 0.012;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.arc(width * 0.72, height * 0.44, Math.min(width, height) * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.56)';
    ctx.beginPath();
    ctx.arc(width * 0.34, height * 0.38, Math.min(width, height) * 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    roundRect(ctx, width * 0.08, height * 0.68, width * 0.34, height * 0.19, 14);
    ctx.fill();
    ctx.fillStyle = '#c43f52';
    ctx.fillRect(width * 0.11, height * 0.72, width * 0.08, height * 0.1);
    ctx.fillStyle = '#228d5c';
    ctx.fillRect(width * 0.21, height * 0.72, width * 0.08, height * 0.1);
    ctx.fillStyle = '#27446e';
    ctx.fillRect(width * 0.31, height * 0.72, width * 0.08, height * 0.1);

    var gray = ctx.createLinearGradient(width * 0.48, 0, width * 0.9, 0);
    gray.addColorStop(0, '#0b1020');
    gray.addColorStop(0.5, '#9aa7b8');
    gray.addColorStop(1, '#ffffff');
    ctx.fillStyle = gray;
    roundRect(ctx, width * 0.48, height * 0.73, width * 0.38, height * 0.08, 10);
    ctx.fill();

    ctx.save();
    ctx.globalAlpha = 0.16;
    for (var x = 0; x < width; x += 3) {
      ctx.fillStyle = x % 9 === 0 ? '#c43f52' : x % 9 === 3 ? '#228d5c' : '#27446e';
      ctx.fillRect(x, 0, 1, height);
    }
    ctx.restore();
  }

  function drawRgbMagnifier(event) {
    if (!state.magnifierEnabled) return;
    var source = $('observationCanvas');
    var lens = $('rgbMagnifier');
    var frame = source.parentElement;
    var rect = source.getBoundingClientRect();
    var frameRect = frame.getBoundingClientRect();
    var localX = clamp(event.clientX - rect.left, 0, rect.width);
    var localY = clamp(event.clientY - rect.top, 0, rect.height);
    var sourceX = Math.round(localX / Math.max(1, rect.width) * source.width);
    var sourceY = Math.round(localY / Math.max(1, rect.height) * source.height);
    var sourceContext = source.getContext('2d');
    var context = lens.getContext('2d');
    var cells = 9;
    var cellSize = lens.width / cells;
    var sampleStep = Math.max(1, Math.round(source.width / Math.max(1, rect.width) * 2));
    var half = Math.floor(cells / 2);

    lens.style.left = (event.clientX - frameRect.left) + 'px';
    lens.style.top = (event.clientY - frameRect.top) + 'px';
    lens.hidden = false;
    context.clearRect(0, 0, lens.width, lens.height);
    context.fillStyle = '#0d1320';
    context.fillRect(0, 0, lens.width, lens.height);

    for (var row = 0; row < cells; row += 1) {
      for (var column = 0; column < cells; column += 1) {
        var pixelX = clamp(sourceX + (column - half) * sampleStep, 0, source.width - 1);
        var pixelY = clamp(sourceY + (row - half) * sampleStep, 0, source.height - 1);
        var rgba = sourceContext.getImageData(pixelX, pixelY, 1, 1).data;
        var x = column * cellSize;
        var y = row * cellSize;
        var gap = Math.max(1, cellSize * 0.08);
        var barWidth = (cellSize - gap * 4) / 3;
        var barHeight = cellSize - gap * 2;
        var channels = [
          'rgb(' + rgba[0] + ',0,0)',
          'rgb(0,' + rgba[1] + ',0)',
          'rgb(0,0,' + rgba[2] + ')'
        ];
        channels.forEach(function (color, channelIndex) {
          context.fillStyle = color;
          context.fillRect(x + gap + channelIndex * (barWidth + gap), y + gap, barWidth, barHeight);
        });
      }
    }

    context.strokeStyle = 'rgba(255,255,255,0.82)';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(lens.width / 2 - 10, lens.height / 2);
    context.lineTo(lens.width / 2 + 10, lens.height / 2);
    context.moveTo(lens.width / 2, lens.height / 2 - 10);
    context.lineTo(lens.width / 2, lens.height / 2 + 10);
    context.stroke();
  }

  function setMagnifierEnabled(enabled) {
    var toggle = $('magnifierToggle');
    var lens = $('rgbMagnifier');
    var frame = $('observationCanvas').parentElement;
    state.magnifierEnabled = enabled;
    toggle.classList.toggle('is-active', enabled);
    toggle.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    toggle.setAttribute('title', enabled ? '关闭 RGB 子像素放大镜' : '打开 RGB 子像素放大镜');
    toggle.querySelector('span').textContent = enabled ? '关闭放大' : '放大 RGB';
    frame.classList.toggle('is-magnifying', enabled);
    if (!enabled) lens.hidden = true;
  }

  function roundRect(ctx, x, y, width, height, radius) {
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      return;
    }
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }

  async function submitObservation(answer, questionApi) {
    var submit = questionApi.submit;
    submit.disabled = true;
    submit.classList.add('is-loading');
    submit.setAttribute('aria-busy', 'true');
    submit.textContent = '正在分析';
    questionApi.streamFeedback('正在分析你的观察，请稍候。', 'hint');

    try {
      var response = await fetch(OBSERVATION_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: answer })
      });
      var data = await response.json().catch(function () { return {}; });
      var result = window.DLModuleUI.requireServiceResult(response, data);
      var feedback = window.DLModuleUI.shortAnswerFeedback(result);
      questionApi.streamFeedback(feedback.message, feedback.tone);
    } catch (error) {
      questionApi.streamFeedback(window.DLModuleUI.friendlyErrorMessage(error), 'wrong');
    } finally {
      submit.disabled = false;
      submit.classList.remove('is-loading');
      submit.removeAttribute('aria-busy');
      submit.textContent = '提交观察';
      showScene('colorScene');
    }
  }

  function updateColorLab() {
    var r = Number($('redSlider').value);
    var g = Number($('greenSlider').value);
    var b = Number($('blueSlider').value);
    var rb = byte(r);
    var gb = byte(g);
    var bb = byte(b);
    $('colorSwatch').style.backgroundColor = 'rgb(' + rb + ',' + gb + ',' + bb + ')';
    $('unitVector').textContent = '[' + formatUnit(r) + ', ' + formatUnit(g) + ', ' + formatUnit(b) + ']';
    $('byteVector').textContent = '[' + rb + ', ' + gb + ', ' + bb + ']';
    var solved = r < 0.05 && g > 0.95 && b < 0.05;
    var feedback = $('colorFeedback');
    var feedbackLabel = feedback.querySelector('strong');
    var feedbackText = feedback.querySelector('span');
    feedback.classList.toggle('edu-notice-strip--green', solved);
    feedback.classList.toggle('edu-notice-strip--orange', !solved);
    feedbackLabel.textContent = solved ? '阶段完成：' : '尚未完成：';
    feedbackText.textContent = solved
      ? '这就是纯绿 [0, 1, 0]，也就是 [0, 255, 0]。'
      : '请让 RGB 变成 [0, 1, 0]。';

    if (solved && !state.colorSolved) {
      state.colorSolved = true;
      window.setTimeout(function () {
        showScene('uploadScene');
      }, 450);
    }
  }

  function canvas2d(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  function createDemoImageData() {
    var width = 384;
    var height = 256;
    var canvas = canvas2d(width, height);
    var ctx = canvas.getContext('2d');
    var gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#c43f52');
    gradient.addColorStop(0.45, '#f0d16a');
    gradient.addColorStop(1, '#27446e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(34,141,92,0.92)';
    ctx.beginPath();
    ctx.arc(width * 0.36, height * 0.47, height * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    ctx.fillRect(width * 0.58, height * 0.22, width * 0.24, height * 0.46);
    ctx.fillStyle = 'rgba(39,68,110,0.7)';
    for (var i = 0; i < 8; i += 1) {
      ctx.fillRect(width * 0.08 + i * width * 0.08, height * 0.76, width * 0.035, height * 0.11);
    }
    return ctx.getImageData(0, 0, width, height);
  }

  function resizeImageToData(image) {
    var naturalWidth = image.naturalWidth || image.width;
    var naturalHeight = image.naturalHeight || image.height;
    var scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(naturalWidth, naturalHeight));
    var width = Math.max(1, Math.round(naturalWidth * scale));
    var height = Math.max(1, Math.round(naturalHeight * scale));
    var canvas = canvas2d(width, height);
    var ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, width, height);
    return ctx.getImageData(0, 0, width, height);
  }

  function drawImageDataContained(canvas, imageData, options) {
    options = options || {};
    if (!window.DLCanvas) return { scale: 1, offsetX: 0, offsetY: 0, drawWidth: imageData.width, drawHeight: imageData.height };
    var frame = canvas.parentElement;
    var rect = frame.getBoundingClientRect();
    var ctx = window.DLCanvas.prepare(canvas, {
      width: Math.max(1, Math.round(rect.width || 320)),
      height: Math.max(1, Math.round(rect.height || rect.width || 320))
    });
    var size = window.DLCanvas.size(canvas);
    ctx.clearRect(0, 0, size.width, size.height);
    ctx.fillStyle = '#f7faff';
    ctx.fillRect(0, 0, size.width, size.height);

    var sourceCanvas = canvas2d(imageData.width, imageData.height);
    sourceCanvas.getContext('2d').putImageData(imageData, 0, 0);
    var scale = Math.min(size.width / imageData.width, size.height / imageData.height);
    var drawWidth = imageData.width * scale;
    var drawHeight = imageData.height * scale;
    var offsetX = (size.width - drawWidth) / 2;
    var offsetY = (size.height - drawHeight) / 2;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(sourceCanvas, offsetX, offsetY, drawWidth, drawHeight);
    if (options.selection) {
      drawSelectionBox(ctx, offsetX, offsetY, scale, imageData.width, imageData.height, options.selectionColor);
      drawSelectionInset(ctx, sourceCanvas, size.width, size.height, imageData.width, imageData.height, options.selectionColor);
    }
    var mapping = {
      scale: scale,
      offsetX: offsetX,
      offsetY: offsetY,
      drawWidth: drawWidth,
      drawHeight: drawHeight
    };
    canvas.diImageDisplay = mapping;
    return mapping;
  }

  function sampleBounds(width, height) {
    var half = Math.floor(SAMPLE_SIZE / 2);
    var startX = clamp(state.selected.x - half, 0, Math.max(0, width - SAMPLE_SIZE));
    var startY = clamp(state.selected.y - half, 0, Math.max(0, height - SAMPLE_SIZE));
    return {
      x: startX,
      y: startY,
      size: Math.min(SAMPLE_SIZE, width, height)
    };
  }

  function drawSelectionBox(ctx, offsetX, offsetY, scale, width, height, color) {
    var bounds = sampleBounds(width, height);
    var x = offsetX + bounds.x * scale;
    var y = offsetY + bounds.y * scale;
    var size = bounds.size * scale;
    ctx.save();
    ctx.strokeStyle = color || '#f07e47';
    ctx.lineWidth = Math.max(2, Math.min(5, scale * 0.7));
    ctx.setLineDash([Math.max(4, scale * 1.3), Math.max(3, scale * 0.9)]);
    ctx.strokeRect(x, y, size, size);
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = Math.max(1, ctx.lineWidth - 1);
    ctx.strokeRect(x + 1, y + 1, Math.max(1, size - 2), Math.max(1, size - 2));
    ctx.restore();
  }

  function drawSelectionInset(ctx, sourceCanvas, canvasWidth, canvasHeight, width, height, color) {
    var bounds = sampleBounds(width, height);
    var shortSide = Math.min(canvasWidth, canvasHeight);
    var insetSize = Math.min(clamp(shortSide * 0.4, 70, 132), Math.max(32, shortSide - 18));
    if (insetSize < 28) return;
    var pad = Math.max(8, Math.min(12, shortSide * 0.04));
    var x = canvasWidth - insetSize - pad;
    var y = canvasHeight - insetSize - pad;
    var cell = insetSize / bounds.size;

    ctx.save();
    ctx.shadowColor = 'rgba(16,24,40,0.2)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    roundRect(ctx, x - 5, y - 5, insetSize + 10, insetSize + 10, 8);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.save();
    roundRect(ctx, x, y, insetSize, insetSize, 5);
    ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sourceCanvas, bounds.x, bounds.y, bounds.size, bounds.size, x, y, insetSize, insetSize);
    ctx.restore();

    ctx.strokeStyle = color || '#f07e47';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, insetSize, insetSize);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    for (var i = 1; i < bounds.size; i += 1) {
      var line = Math.round(i * cell) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x + line, y);
      ctx.lineTo(x + line, y + insetSize);
      ctx.moveTo(x, y + line);
      ctx.lineTo(x + insetSize, y + line);
      ctx.stroke();
    }
    ctx.restore();
  }

  function buildChannelImageData(source, channelIndex) {
    var output = new ImageData(source.width, source.height);
    var data = source.data;
    var target = output.data;
    for (var i = 0; i < data.length; i += 4) {
      var value = data[i + channelIndex];
      target[i] = value;
      target[i + 1] = value;
      target[i + 2] = value;
      target[i + 3] = data[i + 3];
    }
    return output;
  }

  function loadImageData(imageData) {
    state.sourceImageData = imageData;
    state.imageWidth = imageData.width;
    state.imageHeight = imageData.height;
    state.selected = {
      x: Math.floor(imageData.width / 2),
      y: Math.floor(imageData.height / 2)
    };
    $('imageWorkspace').hidden = false;
    revealImageRepresentation();
  }

  function revealImageRepresentation() {
    if (!state.sourceImageData) return;
    var grid = $('channelGrid');
    var layout = $('representationGrid');
    layout.classList.add('is-split');
    grid.hidden = false;
    $('channelGrid').classList.remove('is-split');
    void grid.offsetWidth;
    grid.classList.add('is-split');
    $('matrixPanel').hidden = false;
    $('finishPanel').hidden = false;
    $('finishPanel').setAttribute('aria-hidden', 'false');
    $('finishPanel').classList.add('is-revealing');
    state.splitDone = true;
    renderSource();
    renderChannelCanvases();
    updatePixelReadout();
    renderVideoRecommendations();
  }

  function renderSource() {
    if (!state.sourceImageData) return;
    state.display = drawImageDataContained($('sourceCanvas'), state.sourceImageData, {
      selection: state.splitDone,
      selectionColor: '#f07e47'
    });
  }

  function updateDisplayMapping() {
    if (!state.sourceImageData) return;
    renderSource();
    if (state.splitDone) renderChannelCanvases();
  }

  function canvasPointToPixel(canvas, event) {
    if (!state.sourceImageData || !window.DLCanvas) return null;
    var point = window.DLCanvas.pointer(canvas, event);
    var display = canvas.diImageDisplay || state.display;
    if (!display || !display.scale) return null;
    var x = Math.round((point.x - display.offsetX) / display.scale);
    var y = Math.round((point.y - display.offsetY) / display.scale);
    return {
      x: clamp(x, 0, state.imageWidth - 1),
      y: clamp(y, 0, state.imageHeight - 1)
    };
  }

  function moveSelectionFromEvent(event) {
    var pixel = canvasPointToPixel(event.currentTarget || $('sourceCanvas'), event);
    if (!pixel) return;
    state.selected = pixel;
    renderSource();
    renderChannelCanvases();
    renderMatrices();
  }

  function pixelAt(x, y) {
    var data = state.sourceImageData.data;
    var index = (y * state.imageWidth + x) * 4;
    return [data[index], data[index + 1], data[index + 2]];
  }

  function updatePixelReadout() {
    if (!state.sourceImageData) return;
    if (state.splitDone) renderMatrices();
  }

  function renderChannelCanvases() {
    if (!state.sourceImageData) return;
    drawImageDataContained($('redCanvas'), buildChannelImageData(state.sourceImageData, 0), {
      selection: true,
      selectionColor: '#c43f52'
    });
    drawImageDataContained($('greenCanvas'), buildChannelImageData(state.sourceImageData, 1), {
      selection: true,
      selectionColor: '#228d5c'
    });
    drawImageDataContained($('blueCanvas'), buildChannelImageData(state.sourceImageData, 2), {
      selection: true,
      selectionColor: '#27446e'
    });
  }

  function matrixValue(value) {
    if (state.scaleMode === 'unit') return (value / 255).toFixed(2);
    return String(value);
  }

  function renderMatrices() {
    if (!state.sourceImageData) return;
    document.querySelectorAll('[data-matrix-channel]').forEach(function (slot) {
      slot.replaceChildren();
    });
    var channels = [
      { key: 'r', title: 'R 红色强度 3 × 3', index: 0 },
      { key: 'g', title: 'G 绿色强度 3 × 3', index: 1 },
      { key: 'b', title: 'B 蓝色强度 3 × 3', index: 2 }
    ];
    var bounds = sampleBounds(state.imageWidth, state.imageHeight);
    channels.forEach(function (channel) {
      var host = document.querySelector('[data-matrix-channel="' + channel.key + '"]');
      if (!host) return;
      var wrap = document.createElement('section');
      wrap.className = 'di-matrix-table di-matrix-table--' + channel.key;
      var title = document.createElement('h4');
      title.textContent = channel.title;
      var table = document.createElement('table');
      var tbody = document.createElement('tbody');
      for (var dy = 0; dy < bounds.size; dy += 1) {
        var tr = document.createElement('tr');
        for (var dx = 0; dx < bounds.size; dx += 1) {
          var x = bounds.x + dx;
          var y = bounds.y + dy;
          var value = pixelAt(x, y)[channel.index];
          var td = document.createElement('td');
          td.textContent = matrixValue(value);
          td.style.setProperty('--cell-alpha', String(0.04 + value / 255 * 0.28));
          if (dx === Math.floor(bounds.size / 2) && dy === Math.floor(bounds.size / 2)) td.className = 'is-center';
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      wrap.append(title, table);
      host.appendChild(wrap);
    });
  }

  function loadImageFromFile(file) {
    if (!file) return;
    if (!/^image\//.test(file.type || '')) return;
    var url = URL.createObjectURL(file);
    var image = new Image();
    image.onload = function () {
      URL.revokeObjectURL(url);
      loadImageData(resizeImageToData(image));
    };
    image.onerror = function () {
      URL.revokeObjectURL(url);
    };
    image.src = url;
  }

  function renderVideoRecommendations() {
    var host = $('relatedVideos');
    if (!host || !window.DLModuleUI) return;
    host.innerHTML = window.DLModuleUI.renderRelatedVideos(recommendedVideos, {
      showHeader: false,
      ariaLabel: '相关推荐横向列表'
    });
  }

  function bindSelectionDrag(canvas) {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (event) {
      if (!state.sourceImageData) return;
      state.draggingSelection = true;
      canvas.setPointerCapture(event.pointerId);
      moveSelectionFromEvent(event);
    });

    canvas.addEventListener('pointermove', function (event) {
      if (!state.draggingSelection) return;
      moveSelectionFromEvent(event);
    });

    canvas.addEventListener('pointerup', function (event) {
      state.draggingSelection = false;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    });

    canvas.addEventListener('pointercancel', function () {
      state.draggingSelection = false;
    });
  }

  function bindEvents() {
    $('magnifierToggle').addEventListener('click', function () {
      setMagnifierEnabled(!state.magnifierEnabled);
    });
    $('observationCanvas').addEventListener('pointermove', drawRgbMagnifier);
    $('observationCanvas').addEventListener('pointerleave', function () {
      $('rgbMagnifier').hidden = true;
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && state.magnifierEnabled) setMagnifierEnabled(false);
    });

    ['redSlider', 'greenSlider', 'blueSlider'].forEach(function (id) {
      $(id).addEventListener('input', updateColorLab);
    });

    $('imageInput').addEventListener('change', function (event) {
      var file = event.target.files && event.target.files[0];
      loadImageFromFile(file);
    });
    var uploadPanel = $('uploadPanel');
    var dragDepth = 0;
    uploadPanel.addEventListener('dragenter', function (event) {
      event.preventDefault();
      dragDepth += 1;
      uploadPanel.classList.add('is-dragging');
    });
    uploadPanel.addEventListener('dragover', function (event) {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    });
    uploadPanel.addEventListener('dragleave', function () {
      dragDepth = Math.max(0, dragDepth - 1);
      if (!dragDepth) uploadPanel.classList.remove('is-dragging');
    });
    uploadPanel.addEventListener('drop', function (event) {
      event.preventDefault();
      dragDepth = 0;
      uploadPanel.classList.remove('is-dragging');
      var file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      loadImageFromFile(file);
    });
    $('demoImageBtn').addEventListener('click', function () {
      loadImageData(createDemoImageData());
    });

    document.querySelectorAll('[data-scale-mode]').forEach(function (button) {
      button.addEventListener('click', function () {
        state.scaleMode = button.getAttribute('data-scale-mode');
        document.querySelectorAll('[data-scale-mode]').forEach(function (item) {
          item.classList.toggle('is-active', item === button);
        });
        renderMatrices();
      });
    });

    ['sourceCanvas', 'redCanvas', 'greenCanvas', 'blueCanvas'].forEach(function (id) {
      bindSelectionDrag($(id));
    });

    window.addEventListener('resize', function () {
      drawObservationCanvas();
      updateDisplayMapping();
    });
  }

  function init() {
    drawObservationCanvas();
    updateColorLab();
    var observationQuestion;
    observationQuestion = window.DLModuleUI.mountQuestion('#observationQuestion', {
      type: 'short',
      title: '把摄像头尽量靠近屏幕后，原本连续的颜色发生了什么变化？请具体描述你是否看到了小点、格子，或红、绿、蓝三种子像素。',
      submitText: '提交观察',
      feedback: {
        empty: '请具体写下靠近屏幕后看到的结构，例如颜色是否变成小点、格子或红绿蓝子像素。',
        sample: '正在分析你的观察…'
      },
      onCheck: function (result) {
        if (result.empty || !result.answer[0]) return;
        submitObservation(String(result.answer[0]).trim(), observationQuestion);
      }
    });
    if (observationQuestion && observationQuestion.submit) {
      observationQuestion.submit.classList.add('dl-button-hint');
      observationQuestion.submit.setAttribute('data-dl-button-hint', '');
    }
    bindEvents();
  }

  init();
})();

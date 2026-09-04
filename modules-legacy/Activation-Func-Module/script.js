(function () {
  'use strict';

  var colors = {
    blue: '#27446e',
    red: '#c43f52',
    orange: '#f07e47',
    green: '#228d5c',
    grid: '#dfe6f1',
    axis: '#68778f',
    tick: '#9fb0c8',
  };

  var state = {
    passed2d: false,
    passed3d: false,
    view3d: {
      rotX: -0.68,
      rotY: 0.72,
      zoom: 1,
      dragging: false,
      moved: false,
      lastX: 0,
      lastY: 0,
    },
    linearLab: {
      mode: 'shallow',
      shallow: {
        neurons: [],
        outputBias: -0.12,
      },
      deep: {
        layerCount: 1,
        sizes: [],
        W: [],
        B: [],
      },
      modelNodes: [],
      selectedNode: null,
      graphDragging: false,
      graphMoved: false,
      graphLastX: 0,
      graphLastY: 0,
      deepRevealed: false,
    },
    reluLab: {
      count: 1,
      neurons: [
        { w: 1.05, b: 0.72, v: 0.46 },
        { w: 1.0, b: 0.28, v: -0.88 },
        { w: 1.12, b: -0.12, v: 0.78 },
        { w: 0.96, b: -0.48, v: -0.58 },
        { w: 1.08, b: -0.78, v: 0.42 },
      ],
      outputBias: -0.28,
      baseSlope: 0.18,
      modelNodes: [],
      selectedNode: null,
      approxCount: 2,
      approxRevealed: false,
    },
    reluIntro: {
      value: 0,
      touched: false,
      exploredNegative: false,
    },
  };

  var recommendedVideos = [
    {
      title: '[5分钟深度学习] #03 激活函数',
      embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=598297960&bvid=BV1qB4y1e7GJ&cid=769526570&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
    },
    {
      title: '【硬核】从最底层讲解，全网最详细激活函数教程！没有之一！',
      embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=115774953887638&bvid=BV1NXBLB2EE2&cid=34956052957&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
    },
    {
      title: '激活函数：为神经网络注入灵魂',
      embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=116584639108797&bvid=BV1RQL36cELq&cid=38383128217&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
    }
  ];

  var activeScrollCue = null;

  function $(selector) {
    return document.querySelector(selector);
  }

  function $$(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }

  function signedRandom(low, high) {
    var value = low + Math.random() * (high - low);
    return Math.random() < 0.5 ? -value : value;
  }

  function fmt(value) {
    if (!Number.isFinite(value)) return '--';
    return (Math.abs(value) < 0.005 ? 0 : value).toFixed(2);
  }

  function signed(value) {
    return (value >= 0 ? '+ ' : '- ') + fmt(Math.abs(value));
  }

  function clearScrollCue(host) {
    if (host) host.innerHTML = '';
    if (!activeScrollCue || (host && activeScrollCue.host !== host)) return;
    activeScrollCue = null;
  }

  function renderScrollCue(host, options) {
    if (!host) return;
    if (activeScrollCue && activeScrollCue.host === host) return;
    if (activeScrollCue) clearScrollCue(activeScrollCue.host);
    host.innerHTML = [
      '<button class="flow-scroll-indicator" type="button" data-flow-scroll-indicator aria-controls="' + options.controls + '" aria-label="' + options.label + '">',
      '  <span class="flow-scroll-indicator-mark" aria-hidden="true"></span>',
      '  <strong>下方有新内容</strong>',
      '  <small>滚动或点击查看</small>',
      '</button>'
    ].join('');
    activeScrollCue = {
      host: host,
      onConfirm: options.onConfirm,
    };
  }

  function confirmScrollCue() {
    if (!activeScrollCue) return;
    var cue = activeScrollCue;
    activeScrollCue = null;
    cue.host.innerHTML = '';
    cue.onConfirm();
  }

  function bindScrollCues() {
    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-flow-scroll-indicator]')) confirmScrollCue();
    });
    window.addEventListener('wheel', function (event) {
      if (event.deltaY > 0) confirmScrollCue();
    }, { passive: true });
  }

  function resizeCanvas(canvas) {
    return window.DLCanvas.resize(canvas);
  }

  function prepareContext(canvas) {
    return window.DLCanvas.context(canvas);
  }

  var function2DDefinitions = {
    line2d: {
      formula: 'y = 0.72x - 0.18',
      fn: function (x) { return 0.72 * x - 0.18; },
      color: colors.green,
    },
    parabola2d: {
      formula: 'y = 0.75x² - 0.35',
      fn: function (x) { return 0.75 * x * x - 0.35; },
      color: colors.orange,
    },
    fold2d: {
      formula: 'y = max(0, x)',
      fn: function (x) { return Math.max(0, x); },
      color: colors.red,
    },
  };

  var surface3DDefinitions = {
    plane3d: {
      formula: 'z = 0.55x - 0.30y + 0.05',
      fn: function (x, y) { return 0.55 * x - 0.3 * y + 0.05; },
      colorscale: [[0, '#e8f7ef'], [1, colors.green]],
    },
    bowl3d: {
      formula: 'z = 0.65(x² + y²) - 0.58',
      fn: function (x, y) { return 0.65 * (x * x + y * y) - 0.58; },
      colorscale: [[0, '#fff4ee'], [1, colors.orange]],
    },
    fold3d: {
      formula: 'z = max(0, x + 0.55y) - 0.42',
      fn: function (x, y) { return Math.max(0, x + 0.55 * y) - 0.42; },
      colorscale: [[0, '#fff0f2'], [1, colors.red]],
    },
  };

  function showPlotError(host, error) {
    if (!host) return;
    host.innerHTML = '<p class="af-plot-error">Plotly 图表加载失败</p>';
    console.error(error);
  }

  function renderSharedPlot(host, mount) {
    if (!host || host.closest('[hidden]') || host.offsetParent === null) return Promise.resolve();
    try {
      return mount().catch(function (error) {
        showPlotError(host, error);
      });
    } catch (error) {
      showPlotError(host, error);
      return Promise.resolve();
    }
  }

  function syncChoiceFormula(host, formula) {
    var card = host.closest('.af-choice-card');
    var title = card && card.querySelector('.dl-panel-choice-title');
    if (title) title.textContent = formula;
  }

  function draw2D(host, type) {
    var definition = function2DDefinitions[type];
    syncChoiceFormula(host, definition.formula);
    return renderSharedPlot(host, function () {
      return window.DLPlot.mountFunction2D(host, {
        colors: colors,
        fn: definition.fn,
        xMin: -1.2,
        xMax: 1.2,
        samples: 180,
        xRange: [-1.2, 1.2],
        yRange: [-1.2, 1.2],
        color: definition.color,
        width: 4,
        layout: { margin: { l: 34, r: 10, t: 10, b: 34 } },
      });
    });
  }

  function draw3D(host, type) {
    var definition = surface3DDefinitions[type];
    syncChoiceFormula(host, definition.formula);
    return renderSharedPlot(host, function () {
      return window.DLPlot.mountSurfaceFunction3D(host, {
        colors: colors,
        fn: definition.fn,
        min: -1,
        max: 1,
        samples: 28,
        zMin: -1.05,
        zMax: 1.05,
        colorscale: definition.colorscale,
        camera: { eye: { x: 1.35, y: 1.35, z: 0.95 } },
        layout: {
          scene: {
            xaxis: { range: [-1.05, 1.05] },
            yaxis: { range: [-1.05, 1.05] },
            zaxis: { range: [-1.05, 1.05] },
          },
        },
      });
    });
  }

  function makeShallowNeuron() {
    return {
      w: signedRandom(0.35, 1.35),
      b: signedRandom(0.08, 0.65),
      v: signedRandom(0.45, 1.2),
    };
  }

  function initLinearLab() {
    state.linearLab.mode = 'shallow';
    state.linearLab.deepRevealed = false;
    state.linearLab.deep.layerCount = 1;
    state.linearLab.selectedNode = null;
    state.linearLab.shallow.neurons = [makeShallowNeuron()];
    state.linearLab.shallow.outputBias = signedRandom(0.05, 0.3);
    buildDeepModel();
    syncNetworkControls();
    renderLinearDeepCue();
  }

  function shallowEquivalent() {
    var slope = 0;
    var intercept = state.linearLab.shallow.outputBias;
    state.linearLab.shallow.neurons.forEach(function (neuron) {
      slope += neuron.v * neuron.w;
      intercept += neuron.v * neuron.b;
    });
    return { slope: slope, intercept: intercept };
  }

  function shallowPredict(x) {
    var line = shallowEquivalent();
    return line.slope * x + line.intercept;
  }

  function buildDeepModel() {
    var hiddenCount = state.linearLab.deep.layerCount;
    var sizes = [2];
    for (var i = 0; i < hiddenCount; i++) sizes.push(3);
    sizes.push(1);
    var W = [];
    var B = [];
    for (var layer = 0; layer < sizes.length - 1; layer++) {
      var rows = [];
      var bias = [];
      var scale = layer === 0 ? 0.8 : 0.62;
      for (var row = 0; row < sizes[layer + 1]; row++) {
        var weights = [];
        for (var col = 0; col < sizes[layer]; col++) weights.push(signedRandom(0.12, scale));
        rows.push(weights);
        bias.push(signedRandom(0.02, 0.22));
      }
      W.push(rows);
      B.push(bias);
    }
    state.linearLab.deep.sizes = sizes;
    state.linearLab.deep.W = W;
    state.linearLab.deep.B = B;
  }

  function deepForward(input) {
    var current = input.slice();
    var model = state.linearLab.deep;
    for (var layer = 0; layer < model.W.length; layer++) {
      var next = [];
      for (var row = 0; row < model.W[layer].length; row++) {
        var sum = model.B[layer][row];
        for (var col = 0; col < current.length; col++) sum += model.W[layer][row][col] * current[col];
        next.push(sum);
      }
      current = next;
    }
    return current[0];
  }

  function deepEquivalent() {
    var c = deepForward([0, 0]);
    var ax = deepForward([1, 0]) - c;
    var ay = deepForward([0, 1]) - c;
    return { ax: ax, ay: ay, c: c };
  }

  function drawNetworkGraph(host) {
    if (state.linearLab.mode === 'deep') {
      drawDeepNetworkGraph(host);
      return;
    }
    var eq = shallowEquivalent();
    return renderSharedPlot(host, function () {
      return window.DLPlot.mountFunction2D(host, {
        colors: colors,
        fn: shallowPredict,
        xMin: -1.15,
        xMax: 1.15,
        samples: 180,
        xRange: [-1.2, 1.2],
        yRange: [-1.2, 1.2],
        name: '网络输出',
        color: colors.green,
        width: 4,
        layout: {
          annotations: [window.DLPlot.formulaAnnotation('y = ' + fmt(eq.slope) + 'x ' + signed(eq.intercept))],
        },
      });
    });
  }

  function drawDeepNetworkGraph(host) {
    var plane = deepEquivalent();
    return renderSharedPlot(host, function () {
      return window.DLPlot.mountSurfaceFunction3D(host, {
        colors: colors,
        fn: function (x, y) { return deepForward([x, y]); },
        min: -1,
        max: 1,
        samples: 28,
        zMin: -1.05,
        zMax: 1.05,
        colorscale: [[0, '#e8f7ef'], [1, colors.green]],
        camera: { eye: { x: 1.35, y: 1.35, z: 0.95 } },
        layout: {
          scene: {
            xaxis: { range: [-1.05, 1.05] },
            yaxis: { range: [-1.05, 1.05] },
            zaxis: { range: [-1.05, 1.05] },
          },
        },
        trace: {
          name: 'z = ' + fmt(plane.ax) + 'x ' + signed(plane.ay) + 'y ' + signed(plane.c),
        },
      });
    });
  }

  function drawLinearDeepModel(canvas) {
    resizeCanvas(canvas);
    var ctx = prepareContext(canvas);
    var width = canvas.logicalWidth || canvas.width;
    var height = canvas.logicalHeight || canvas.height;
    var sizes = state.linearLab.deep.sizes.slice();
    var xs = sizes.map(function (_, index) {
      return 62 + index * ((width - 124) / Math.max(1, sizes.length - 1));
    });
    var layers = [];

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#fbfdff';
    ctx.fillRect(0, 0, width, height);

    sizes.forEach(function (size, layer) {
      var gap = Math.min(58, (height - 140) / Math.max(1, size - 1));
      var start = height / 2 - gap * (size - 1) / 2;
      layers.push(Array.from({ length: size }, function (_, index) {
        return { x: xs[layer], y: start + index * gap, layer: layer, index: index };
      }));
    });

    for (var layer = 0; layer < layers.length - 1; layer++) {
      layers[layer].forEach(function (from, col) {
        layers[layer + 1].forEach(function (to, row) {
          var weight = state.linearLab.deep.W[layer][row][col];
          ctx.strokeStyle = weight >= 0 ? 'rgba(39,68,110,0.30)' : 'rgba(196,63,82,0.30)';
          ctx.lineWidth = 0.9 + Math.min(2.8, Math.abs(weight) * 1.5);
          ctx.beginPath();
          ctx.moveTo(from.x + 17, from.y);
          ctx.lineTo(to.x - 17, to.y);
          ctx.stroke();
        });
      });
    }

    layers.forEach(function (nodes, layer) {
      nodes.forEach(function (node) {
        var isOutput = layer === sizes.length - 1;
        var isInput = layer === 0;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = isInput ? colors.blue : (isOutput ? colors.red : colors.green);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = '900 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(layerNodeLabel(layer, node.index, sizes), node.x, node.y);
      });
      ctx.fillStyle = colors.axis;
      ctx.font = '900 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      var layerName = layer === 0 ? '输入' : (layer === sizes.length - 1 ? '输出' : '线性层 ' + layer);
      ctx.fillText(layerName + ' (' + sizes[layer] + ')', xs[layer], 34);
    });

    ctx.fillStyle = colors.axis;
    ctx.font = '800 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('每层都是线性运算：a = W a + b，没有 tanh / ReLU', width / 2, height - 18);
  }

  function layerNodeLabel(layer, index, sizes) {
    if (layer === 0) return sizes[0] === 1 ? 'x' : (index === 0 ? 'x' : 'y');
    if (layer === sizes.length - 1) return sizes[0] === 1 ? 'y' : 'z';
    return 'h' + layer + '.' + (index + 1);
  }

  function networkSizes() {
    if (state.linearLab.mode === 'shallow') return [1, state.linearLab.shallow.neurons.length, 1];
    return state.linearLab.deep.sizes.slice();
  }

  function edgeWeight(layer, row, col) {
    if (state.linearLab.mode === 'shallow') {
      var neuron = state.linearLab.shallow.neurons[layer === 0 ? row : col];
      return layer === 0 ? neuron.w : neuron.v;
    }
    return state.linearLab.deep.W[layer][row][col];
  }

  function drawNetworkModel(canvas) {
    resizeCanvas(canvas);
    var ctx = prepareContext(canvas);
    var width = canvas.logicalWidth || canvas.width;
    var height = canvas.logicalHeight || canvas.height;
    var sizes = networkSizes();
    var xs = sizes.map(function (_, index) {
      return 62 + index * ((width - 124) / Math.max(1, sizes.length - 1));
    });
    var layers = [];
    state.linearLab.modelNodes = [];

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#fbfdff';
    ctx.fillRect(0, 0, width, height);

    sizes.forEach(function (size, layer) {
      var gap = Math.min(58, (height - 140) / Math.max(1, size - 1));
      var start = height / 2 - gap * (size - 1) / 2;
      layers.push(Array.from({ length: size }, function (_, index) {
        return { x: xs[layer], y: start + index * gap, layer: layer, index: index };
      }));
    });

    for (var layer = 0; layer < layers.length - 1; layer++) {
      layers[layer].forEach(function (from, col) {
        layers[layer + 1].forEach(function (to, row) {
          var weight = edgeWeight(layer, row, col);
          ctx.strokeStyle = weight >= 0 ? 'rgba(39,68,110,0.30)' : 'rgba(196,63,82,0.30)';
          ctx.lineWidth = 0.9 + Math.min(2.8, Math.abs(weight) * 1.5);
          ctx.beginPath();
          ctx.moveTo(from.x + 17, from.y);
          ctx.lineTo(to.x - 17, to.y);
          ctx.stroke();
        });
      });
    }

    layers.forEach(function (nodes, layer) {
      nodes.forEach(function (node) {
        var label = layerNodeLabel(layer, node.index, sizes);
        var isOutput = layer === sizes.length - 1;
        var isInput = layer === 0;
        var selected = state.linearLab.selectedNode
          && state.linearLab.selectedNode.layer === layer
          && state.linearLab.selectedNode.index === node.index;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = isInput ? colors.blue : (isOutput ? colors.red : colors.green);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        if (selected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 24, 0, Math.PI * 2);
          ctx.strokeStyle = colors.orange;
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        ctx.fillStyle = '#fff';
        ctx.font = '900 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, node.x, node.y);
        state.linearLab.modelNodes.push({
          x: node.x,
          y: node.y,
          layer: layer,
          index: node.index,
          label: label,
        });
      });
      ctx.fillStyle = colors.axis;
      ctx.font = '900 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      var layerName = layer === 0 ? '输入' : (layer === sizes.length - 1 ? '输出' : '线性层 ' + layer);
      ctx.fillText(layerName + ' (' + sizes[layer] + ')', xs[layer], 34);
    });

    ctx.fillStyle = colors.axis;
    ctx.font = '800 12px monospace';
    ctx.textAlign = 'center';
    var caption = state.linearLab.mode === 'shallow'
      ? '没有激活函数：h = wx + b，y = Σvh + c'
      : '每层都是线性运算：a = W a + b，没有 tanh / ReLU';
    ctx.fillText(caption, width / 2, height - 18);
    renderNetworkInspector();
  }

  function nodeInfo(node) {
    var sizes = networkSizes();
    if (state.linearLab.mode === 'shallow') {
      if (node.layer === 0) {
        return {
          title: '输入节点 x',
          body: '这里直接接收横轴上的输入值。',
          code: 'a0 = x',
        };
      }
      if (node.layer === 1) {
        var neuron = state.linearLab.shallow.neurons[node.index];
        return {
          title: '线性神经元 ' + (node.index + 1),
          body: '它只做加权和加偏置，然后直接送往输出层。',
          code: 'h' + (node.index + 1) + ' = ' + fmt(neuron.w) + 'x ' + signed(neuron.b) + '\ny += ' + fmt(neuron.v) + 'h' + (node.index + 1),
        };
      }
      var eq = shallowEquivalent();
      return {
        title: '输出节点 y',
        body: '所有线性神经元的输出再次线性相加，所以可以合并成一条直线。',
        code: 'y = Σ(vh) ' + signed(state.linearLab.shallow.outputBias) + '\ny = ' + fmt(eq.slope) + 'x ' + signed(eq.intercept),
      };
    }

    if (node.layer === 0) {
      return {
        title: '输入节点 ' + node.label,
        body: '多层阶段使用两个输入坐标，左侧图像对应 z = f(x, y)。',
        code: node.label + ' 是输入坐标，不做矩阵运算',
      };
    }
    var modelLayer = node.layer - 1;
    var weights = state.linearLab.deep.W[modelLayer][node.index];
    var bias = state.linearLab.deep.B[modelLayer][node.index];
    var terms = weights.map(function (weight, index) {
      return fmt(weight) + '·a' + modelLayer + '.' + (index + 1);
    }).join(' + ');
    var plane = deepEquivalent();
    var isOutput = node.layer === sizes.length - 1;
    return {
      title: isOutput ? '输出节点 z' : '线性层 ' + node.layer + ' / 神经元 ' + (node.index + 1),
      body: isOutput ? '输出仍然只是上一层的线性组合。所有层合起来还是一个平面。' : '这一层没有激活函数，因此 z 和 a 是同一个线性结果。',
      code: node.label + ' = ' + terms + ' ' + signed(bias) + (isOutput ? '\n等价平面: z = ' + fmt(plane.ax) + 'x ' + signed(plane.ay) + 'y ' + signed(plane.c) : '\nactivation = identity'),
    };
  }

  function renderNetworkInspector() {
    var panel = $('#networkInspector');
    if (!panel || !state.linearLab.selectedNode) {
      if (panel) {
        panel.classList.remove('is-visible');
        panel.innerHTML = '';
      }
      return;
    }
    var info = nodeInfo(state.linearLab.selectedNode);
    panel.innerHTML = '<strong>' + info.title + '</strong><p>' + info.body + '</p><code>' + info.code + '</code>';
    panel.classList.add('is-visible');
    positionNetworkInspector(panel, state.linearLab.selectedNode);
  }

  function positionNetworkInspector(panel, node) {
    var canvas = $('#networkModelCanvas');
    if (!canvas) return;
    var panelBox = canvas.parentElement.getBoundingClientRect();
    var canvasBox = canvas.getBoundingClientRect();
    var canvasWidth = canvas.logicalWidth || canvas.width || 1;
    var canvasHeight = canvas.logicalHeight || canvas.height || 1;
    var nodeX = canvasBox.left - panelBox.left + node.x * (canvasBox.width / canvasWidth);
    var nodeY = canvasBox.top - panelBox.top + node.y * (canvasBox.height / canvasHeight);
    var popupWidth = Math.min(420, panelBox.width - 24);
    panel.style.width = popupWidth + 'px';
    var popupHeight = panel.scrollHeight || 180;
    var left = nodeX + 32;
    var top = nodeY - popupHeight / 2;
    if (left + popupWidth > panelBox.width - 12) left = nodeX - popupWidth - 32;
    left = clamp(left, 12, Math.max(12, panelBox.width - popupWidth - 12));
    top = clamp(top, 12, Math.max(12, panelBox.height - popupHeight - 12));
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
  }

  function nearestNetworkNode(event) {
    var canvas = $('#networkModelCanvas');
    if (!canvas) return null;
    var rect = canvas.getBoundingClientRect();
    var x = (event.clientX - rect.left) * (canvas.logicalWidth || rect.width) / rect.width;
    var y = (event.clientY - rect.top) * (canvas.logicalHeight || rect.height) / rect.height;
    var closest = null;
    var distance = 28;
    state.linearLab.modelNodes.forEach(function (node) {
      var d = Math.hypot(node.x - x, node.y - y);
      if (d < distance) {
        distance = d;
        closest = node;
      }
    });
    return closest;
  }

  function updateNetworkText() {
    var readout = $('#networkReadout');
    var message = $('#networkStageMessage');
    var addNeuron = $('#addNeuronBtn');
    if (!readout || !message) return;
    var eq = shallowEquivalent();
    var count = state.linearLab.shallow.neurons.length;
    readout.textContent = '当前等价函数：y = ' + fmt(eq.slope) + 'x ' + signed(eq.intercept) + '。隐藏神经元数量：' + count + ' / 3。';
    message.textContent = count < 3
      ? '点击“添加神经元”会加入一组随机 w、b、v。线可能旋转或平移，但仍然是一条直线。'
      : '已经有 3 个线性神经元了。它们叠加后仍然只是一条直线。继续往下观察二维输入时会发生什么。';
    if (addNeuron) addNeuron.disabled = count >= 3;
  }

  function updateLinearDeepText() {
    var readout = $('#linearDeepReadout');
    var message = $('#linearDeepStageMessage');
    var addLayer = $('#addDeepLayerBtn');
    var removeLayer = $('#removeDeepLayerBtn');
    if (!readout || !message) return;
    var plane = deepEquivalent();
    readout.textContent = '当前等价平面：z = ' + fmt(plane.ax) + 'x ' + signed(plane.ay) + 'y ' + signed(plane.c) + '。隐藏层数：' + state.linearLab.deep.layerCount + ' / 5。';
    message.textContent = state.linearLab.deep.layerCount < 5
      ? '每层固定 3 个神经元。继续添加层数，左侧仍然只能画出一张平面。'
      : '已经加到 5 层了。没有激活函数时，这个 MLP 依然只是一个线性变换。';
    if (addLayer) addLayer.disabled = state.linearLab.deep.layerCount >= 5;
    if (removeLayer) removeLayer.disabled = state.linearLab.deep.layerCount <= 1;
  }

  function syncNetworkControls() {
    var graphTitle = $('#graphTitle');
    var graphHint = $('#graphHint');
    var copy = $('#networkLabCopy');
    var modelHint = $('#modelHint');

    if (graphTitle) graphTitle.textContent = '二维函数图像';
    if (graphHint) graphHint.textContent = '一维输入 x，一维输出 y';
    if (modelHint) modelHint.textContent = '悬浮节点查看 w、b、v';
    if (copy) {
      copy.textContent = '先从一个最简单的网络开始：x 进入一个线性神经元，再输出 y。左侧会画出它对应的函数图像。';
    }
    updateNetworkText();
  }

  function drawNetworkLab() {
    var graph = $('#networkGraphPlot');
    var model = $('#networkModelCanvas');
    if (graph) drawNetworkGraph(graph);
    if (model) drawNetworkModel(model);
    updateNetworkText();
  }

  function drawLinearDeepLab() {
    var graph = $('#linearDeepGraphPlot');
    var model = $('#linearDeepModelCanvas');
    if (graph) drawDeepNetworkGraph(graph);
    if (model) drawLinearDeepModel(model);
    updateLinearDeepText();
  }

  function relu(value) {
    return Math.max(0, value);
  }

  function sigmoid(value) {
    if (value < -40) return 0;
    if (value > 40) return 1;
    return 1 / (1 + Math.exp(-value));
  }

  function activeReluNeurons() {
    return state.reluLab.neurons.slice(0, state.reluLab.count);
  }

  function reluKink(neuron) {
    return -neuron.b / neuron.w;
  }

  function reluPredict(x) {
    var y = state.reluLab.outputBias + state.reluLab.baseSlope * x;
    activeReluNeurons().forEach(function (neuron) {
      y += neuron.v * relu(neuron.w * x + neuron.b);
    });
    return y;
  }

  function drawReluGraph(host) {
    var series = [];
    activeReluNeurons().forEach(function (neuron) {
      var x = reluKink(neuron);
      if (x < -1.18 || x > 1.18) return;
      series.push({
        name: '折点',
        x: [x, x],
        y: [-1.1, 1.1],
        color: 'rgba(196, 63, 82, 0.52)',
        width: 1.6,
        line: { dash: 'dash' },
        hovertemplate: '折点 x = %{x:.3f}<extra></extra>',
      });
    });
    series.push({ name: '网络输出', fn: reluPredict, samples: 220, color: colors.orange, width: 4 });
    return renderSharedPlot(host, function () {
      return window.DLPlot.mount2D(host, {
        colors: colors,
        xRange: [-1.2, 1.2],
        yRange: [-1.2, 1.2],
        series: series,
        layout: {
          annotations: [window.DLPlot.formulaAnnotation(state.reluLab.count + ' neurons with ReLU · piecewise linear')],
        },
      });
    });
  }

  function drawReluModel(canvas) {
    resizeCanvas(canvas);
    var ctx = prepareContext(canvas);
    var width = canvas.logicalWidth || canvas.width;
    var height = canvas.logicalHeight || canvas.height;
    var sizes = [1, state.reluLab.count, 1];
    var xs = sizes.map(function (_, index) {
      return 64 + index * ((width - 128) / 2);
    });
    var layers = [];
    state.reluLab.modelNodes = [];

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#fbfdff';
    ctx.fillRect(0, 0, width, height);

    sizes.forEach(function (size, layer) {
      var gap = Math.min(58, (height - 140) / Math.max(1, size - 1));
      var start = height / 2 - gap * (size - 1) / 2;
      layers.push(Array.from({ length: size }, function (_, index) {
        return { x: xs[layer], y: start + index * gap, layer: layer, index: index };
      }));
    });

    layers[0].forEach(function (from) {
      layers[1].forEach(function (to, row) {
        var neuron = state.reluLab.neurons[row];
        ctx.strokeStyle = neuron.w >= 0 ? 'rgba(39,68,110,0.30)' : 'rgba(196,63,82,0.30)';
        ctx.lineWidth = 0.9 + Math.min(2.8, Math.abs(neuron.w) * 1.4);
        ctx.beginPath();
        ctx.moveTo(from.x + 17, from.y);
        ctx.lineTo(to.x - 17, to.y);
        ctx.stroke();
      });
    });
    layers[1].forEach(function (from, col) {
      var neuron = state.reluLab.neurons[col];
      var to = layers[2][0];
      ctx.strokeStyle = neuron.v >= 0 ? 'rgba(39,68,110,0.30)' : 'rgba(196,63,82,0.30)';
      ctx.lineWidth = 0.9 + Math.min(2.8, Math.abs(neuron.v) * 1.4);
      ctx.beginPath();
      ctx.moveTo(from.x + 17, from.y);
      ctx.lineTo(to.x - 17, to.y);
      ctx.stroke();
    });

    layers.forEach(function (nodes, layer) {
      nodes.forEach(function (node) {
        var selected = state.reluLab.selectedNode
          && state.reluLab.selectedNode.layer === node.layer
          && state.reluLab.selectedNode.index === node.index;
        var label = layer === 0 ? 'x' : (layer === 2 ? 'y' : 'H' + (node.index + 1));
        ctx.beginPath();
        ctx.arc(node.x, node.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = layer === 0 ? colors.blue : (layer === 2 ? colors.red : colors.orange);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        if (selected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 24, 0, Math.PI * 2);
          ctx.strokeStyle = colors.green;
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        ctx.fillStyle = '#fff';
        ctx.font = '900 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, node.x, node.y);
        state.reluLab.modelNodes.push({ x: node.x, y: node.y, layer: layer, index: node.index, label: label });
      });
      ctx.fillStyle = colors.axis;
      ctx.font = '900 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(layer === 0 ? '输入' : (layer === 2 ? '输出' : '隐藏层 (' + state.reluLab.count + ')'), xs[layer], 34);
    });

    ctx.fillStyle = colors.axis;
    ctx.font = '800 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('h = ReLU(wx + b)，y = Σvh + c', width / 2, height - 18);
    renderReluInspector();
  }

  function reluNodeInfo(node) {
    if (node.layer === 0) {
      return { title: '输入节点 x', body: '输入值沿着每条边送入隐藏层中的神经元。', code: 'a0 = x' };
    }
    if (node.layer === 1) {
      var neuron = state.reluLab.neurons[node.index];
      return {
        title: '隐藏层神经元 ' + (node.index + 1),
        body: '这个神经元先做线性计算，再经过 ReLU。折点出现在 wx + b = 0 的位置。',
        code: 'h' + (node.index + 1) + ' = ReLU(' + fmt(neuron.w) + 'x ' + signed(neuron.b) + ')<br>折点 x = ' + fmt(reluKink(neuron)) + '<br>y += ' + fmt(neuron.v) + 'h' + (node.index + 1),
      };
    }
    return {
      title: '输出节点 y',
      body: '多个隐藏层神经元的输出相加后形成分段线性曲线，折点会叠加。',
      code: 'y = ' + fmt(state.reluLab.baseSlope) + 'x + Σ(vh) ' + signed(state.reluLab.outputBias),
    };
  }

  function renderReluInspector() {
    var panel = $('#reluInspector');
    if (!panel || !state.reluLab.selectedNode) {
      if (panel) {
        panel.classList.remove('is-visible');
        panel.innerHTML = '';
      }
      return;
    }
    var info = reluNodeInfo(state.reluLab.selectedNode);
    panel.innerHTML = '<strong>' + info.title + '</strong><p>' + info.body + '</p><code>' + info.code + '</code>';
    panel.classList.add('is-visible');
    positionReluInspector(panel, state.reluLab.selectedNode);
  }

  function positionReluInspector(panel, node) {
    var canvas = $('#reluModelCanvas');
    if (!canvas) return;
    var panelBox = canvas.parentElement.getBoundingClientRect();
    var canvasBox = canvas.getBoundingClientRect();
    var canvasWidth = canvas.logicalWidth || canvas.width || 1;
    var canvasHeight = canvas.logicalHeight || canvas.height || 1;
    var nodeX = canvasBox.left - panelBox.left + node.x * (canvasBox.width / canvasWidth);
    var nodeY = canvasBox.top - panelBox.top + node.y * (canvasBox.height / canvasHeight);
    var popupWidth = Math.min(430, panelBox.width - 24);
    panel.style.width = popupWidth + 'px';
    var popupHeight = panel.scrollHeight || 180;
    var left = nodeX + 32;
    var top = nodeY - popupHeight / 2;
    if (left + popupWidth > panelBox.width - 12) left = nodeX - popupWidth - 32;
    left = clamp(left, 12, Math.max(12, panelBox.width - popupWidth - 12));
    top = clamp(top, 12, Math.max(12, panelBox.height - popupHeight - 12));
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
  }

  function nearestReluNode(event) {
    var canvas = $('#reluModelCanvas');
    if (!canvas) return null;
    var rect = canvas.getBoundingClientRect();
    var x = (event.clientX - rect.left) * (canvas.logicalWidth || rect.width) / rect.width;
    var y = (event.clientY - rect.top) * (canvas.logicalHeight || rect.height) / rect.height;
    var closest = null;
    var distance = 28;
    state.reluLab.modelNodes.forEach(function (node) {
      var d = Math.hypot(node.x - x, node.y - y);
      if (d < distance) {
        distance = d;
        closest = node;
      }
    });
    return closest;
  }

  function updateReluText() {
    var readout = $('#reluReadout');
    var message = $('#reluStageMessage');
    var add = $('#addReluNeuronBtn');
    if (readout) readout.textContent = '当前隐藏层有 ' + state.reluLab.count + ' 个带有 ReLU 的神经元，最多 5 个。每个神经元贡献一个折点。';
    if (message) {
      message.textContent = state.reluLab.count < 5
        ? '继续向隐藏层添加带有 ReLU 的神经元，左侧曲线会多一个折点，整体越来越弯。'
        : '隐藏层已经有 5 个带有 ReLU 的神经元了。曲线已经由多段线性片段拼起来，可以继续观察更多神经元会发生什么。';
    }
    if (add) add.disabled = state.reluLab.count >= 5;
  }

  function drawReluLab() {
    var graph = $('#reluGraphPlot');
    var model = $('#reluModelCanvas');
    if (graph) drawReluGraph(graph);
    if (model) drawReluModel(model);
    updateReluText();
  }

  function renderReluApproxCue() {
    var cue = $('#reluApproxCue');
    if (!cue || !$('#reluNetworkLab') || state.reluLab.approxRevealed) return;
    if (state.reluLab.count < 5) {
      clearScrollCue(cue);
      return;
    }
    renderScrollCue(cue, {
      controls: 'approxPanel',
      label: '下方有曲线逼近实验，滚动或点击查看',
      onConfirm: revealApproximation,
    });
  }

  function targetFunction(x) {
    return 0.48 * Math.sin(3.15 * x) + 0.2 * Math.cos(6.1 * x) - 0.13 * x;
  }

  function approximationKnots(count) {
    var min = -1.15;
    var max = 1.15;
    var knots = [];
    for (var i = 0; i < count + 2; i++) {
      var x = min + (i / (count + 1)) * (max - min);
      knots.push({ x: x, y: targetFunction(x) });
    }
    return knots;
  }

  function approximateTarget(x, count) {
    var knots = approximationKnots(count);
    for (var i = 0; i < knots.length - 1; i++) {
      if (x >= knots[i].x && x <= knots[i + 1].x) {
        var ratio = (x - knots[i].x) / (knots[i + 1].x - knots[i].x);
        return knots[i].y + ratio * (knots[i + 1].y - knots[i].y);
      }
    }
    return x < knots[0].x ? knots[0].y : knots[knots.length - 1].y;
  }

  function drawApproximation(host) {
    var knots = approximationKnots(state.reluLab.approxCount);
    return renderSharedPlot(host, function () {
      return window.DLPlot.mount2D(host, {
        colors: colors,
        xRange: [-1.2, 1.2],
        yRange: [-1.2, 1.2],
        showLegend: true,
        series: [
        {
          name: '目标函数',
          fn: targetFunction,
          samples: 260,
          color: 'rgba(104,119,143,0.72)',
          width: 3,
          line: { dash: 'dash' },
        },
        {
          name: '分段线性逼近',
          fn: function (x) { return approximateTarget(x, state.reluLab.approxCount); },
          samples: 260,
          color: colors.orange,
          width: 4,
        },
        {
          name: '折点',
          mode: 'markers',
          x: knots.slice(1, -1).map(function (knot) { return knot.x; }),
          y: knots.slice(1, -1).map(function (knot) { return knot.y; }),
          color: colors.red,
          marker: { size: 8, line: { color: '#fff', width: 2 } },
        },
        ],
        layout: {
          annotations: [window.DLPlot.formulaAnnotation(state.reluLab.approxCount + ' ReLU breakpoints')],
          legend: { orientation: 'h', x: 1, xanchor: 'right', y: 1.08, yanchor: 'bottom' },
          margin: { l: 52, r: 20, t: 54, b: 46 },
        },
      });
    });
  }

  function updateApproxText() {
    var readout = $('#approxReadout');
    var add = $('#addApproxNeuronBtn');
    if (readout) {
      readout.textContent = state.reluLab.approxCount < 12
        ? '当前使用 ' + state.reluLab.approxCount + ' 个折点。继续增加，橙色曲线会更贴近灰色目标。'
        : '已经使用 12 个折点。橙色曲线已经明显贴近目标函数，可以进入最后一幕。';
    }
    if (add) add.disabled = state.reluLab.approxCount >= 12;
  }

  function drawActivation(host, type) {
    var yMin = type === 'sigmoid' ? -0.08 : -0.85;
    var yMax = type === 'sigmoid' ? 1.08 : 3.1;
    var fn = function (x) {
      if (type === 'relu') return relu(x);
      if (type === 'sigmoid') return sigmoid(x);
      return x * sigmoid(x);
    };
    var color = type === 'sigmoid' ? colors.green : (type === 'silu' ? colors.orange : colors.red);
    return renderSharedPlot(host, function () {
      return window.DLPlot.mountFunction2D(host, {
        colors: colors,
        fn: fn,
        xMin: -3,
        xMax: 3,
        samples: 220,
        xRange: [-3, 3],
        yRange: [yMin, yMax],
        name: type,
        color: color,
        width: 4,
        layout: { margin: { l: 42, r: 12, t: 12, b: 38 } },
      });
    });
  }

  function drawCanvas(canvas) {
    var type = canvas.getAttribute('data-viz');
    if (type === 'networkModel') drawNetworkModel(canvas);
    if (type === 'linearDeepModel') drawLinearDeepModel(canvas);
    if (type === 'reluModel') drawReluModel(canvas);
  }

  function drawPlot(host) {
    var type = host.getAttribute('data-plot');
    if (type === 'line2d' || type === 'parabola2d' || type === 'fold2d') return draw2D(host, type);
    if (type === 'plane3d' || type === 'bowl3d' || type === 'fold3d') return draw3D(host, type);
    if (type === 'networkGraph') return drawNetworkGraph(host);
    if (type === 'linearDeepGraph') return drawDeepNetworkGraph(host);
    if (type === 'reluGraph') return drawReluGraph(host);
    if (type === 'approximation') return drawApproximation(host);
    if (type === 'activation-relu') return drawActivation(host, 'relu');
    if (type === 'activation-sigmoid') return drawActivation(host, 'sigmoid');
    if (type === 'activation-silu') return drawActivation(host, 'silu');
    return Promise.resolve();
  }

  function drawAll() {
    $$('canvas[data-viz]').forEach(drawCanvas);
    $$('[data-plot]').forEach(drawPlot);
  }

  function setFeedback(id, text, kind) {
    var feedback = $('#' + id);
    if (!feedback) return;
    feedback.textContent = text;
    var callout = feedback.closest('.edu-callout');
    if (!callout) return;
    callout.classList.remove('edu-callout--blue', 'edu-callout--green', 'edu-callout--red');
    callout.classList.add(kind === 'good' ? 'edu-callout--green' : (kind === 'bad' ? 'edu-callout--red' : 'edu-callout--blue'));
    var label = callout.querySelector('.edu-callout-label');
    if (label) label.textContent = kind === 'good' ? '判断正确' : (kind === 'bad' ? '再观察一次' : '判断提示');
  }

  function updateBadge(name, status) {
    var badge = $('[data-step-badge="' + name + '"]');
    if (!badge) return;
    badge.classList.toggle('is-current', status === 'current');
    badge.classList.toggle('is-done', status === 'done');
  }

  function lockGroup(stage) {
    $$('[data-stage="' + stage + '"]').forEach(function (card) {
      card.setAttribute('data-answer-locked', 'true');
      var trigger = card.querySelector('[data-choice-trigger]');
      if (trigger) trigger.disabled = true;
    });
  }

  function reveal3D() {
    var quiz = $('#quiz3d');
    quiz.classList.remove('af-quiz--locked');
    quiz.setAttribute('aria-hidden', 'false');
    updateBadge('definition', 'done');
    updateBadge('two', 'done');
    updateBadge('three', 'current');
    window.requestAnimationFrame(function () {
      drawAll();
      quiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function revealNetworkLab() {
    var lab = $('#linearNetworkLab');
    if (!lab) return;
    lab.hidden = false;
    updateBadge('three', 'done');
    updateBadge('network', 'current');
    syncNetworkControls();
    window.requestAnimationFrame(function () {
      drawNetworkLab();
      lab.scrollIntoView({ behavior: 'smooth', block: 'start' });
      renderLinearDeepCue();
    });
  }

  function renderLinearDeepCue() {
    var cue = $('#linearDeepCue');
    if (!cue || state.linearLab.deepRevealed) return;
    if (state.linearLab.shallow.neurons.length < 3) {
      clearScrollCue(cue);
      return;
    }
    renderScrollCue(cue, {
      controls: 'linearDeepLab',
      label: '下方有三维输出平面实验，滚动或点击查看',
      onConfirm: revealLinearDeepLab,
    });
  }

  function revealLinearDeepLab() {
    var lab = $('#linearDeepLab');
    var cue = $('#linearDeepCue');
    if (!lab) return;
    state.linearLab.deepRevealed = true;
    state.linearLab.deep.layerCount = 1;
    state.linearLab.selectedNode = null;
    buildDeepModel();
    lab.hidden = false;
    clearScrollCue(cue);
    window.requestAnimationFrame(function () {
      drawLinearDeepLab();
      lab.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function finishNetworkLab() {
    var finish = $('#finishPanel');
    if (!finish) return;
    finish.hidden = false;
    updateBadge('network', 'done');
    updateBadge('summary', 'current');
    window.setTimeout(function () {
      drawNetworkLab();
      finish.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 180);
  }

  function updateReluIntro() {
    var x = state.reluIntro.value;
    var weighted = x * 2;
    var output = Math.max(0, weighted);
    var inputValue = $('#reluInputValue');
    var inputNode = $('#reluInputNode');
    var outputNode = $('#reluOutputNode');
    var linearFormula = $('#reluLinearFormula');
    var activationFormula = $('#reluActivationFormula');
    var flow = $('#reluIntroFlow');
    var label = $('#reluObservationLabel');
    var text = $('#reluObservationText');
    var next = $('#reluIntroNext');

    if (inputValue) inputValue.value = fmt(x);
    if (inputNode) inputNode.textContent = fmt(x);
    if (outputNode) outputNode.textContent = fmt(output);
    if (linearFormula) linearFormula.textContent = 'z = x × w = ' + fmt(x) + ' × 2 = ' + fmt(weighted);
    if (activationFormula) activationFormula.textContent = 'y = ReLU(z) = max(0, ' + fmt(weighted) + ') = ' + fmt(output);
    if (flow) flow.classList.toggle('is-suppressed', weighted < 0);

    if (weighted < 0) {
      state.reluIntro.exploredNegative = true;
      if (label) label.textContent = '负数被抑制了';
      if (text) text.textContent = '输入 x = ' + fmt(x) + '，加权结果已经变成 ' + fmt(weighted) + '，但 ReLU 把它截成了 0。继续在负数区域拖动时，2x 会变化，输出 y 却始终停在 0。';
    } else if (weighted === 0) {
      if (label) label.textContent = '这里就是折点';
      if (text) text.textContent = '当加权结果恰好为 0，ReLU 的两段规则在这里相接：左边所有负数都被压成 0，右边的正数按原值通过。';
    } else {
      if (label) label.textContent = '正数正常通过';
      if (text) text.textContent = '输入 x = ' + fmt(x) + '，乘以固定权重 2 后得到 ' + fmt(weighted) + '；因为它是正数，ReLU 让它直接通过。请把输入拖到负数区域继续观察。';
    }

    if (next && state.reluIntro.exploredNegative) next.hidden = false;
  }

  function revealReluIntro() {
    var lab = $('#reluIntroLab');
    if (!lab) return;
    lab.hidden = false;
    if (state.reluIntro.touched) updateReluIntro();
    window.setTimeout(function () {
      lab.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }

  function revealReluLab() {
    var lab = $('#reluNetworkLab');
    if (!lab) return;
    lab.hidden = false;
    updateBadge('summary', 'done');
    updateBadge('relu', 'current');
    state.reluLab.count = 1;
    state.reluLab.approxRevealed = false;
    state.reluLab.selectedNode = null;
    updateReluText();
    renderReluApproxCue();
    window.requestAnimationFrame(function () {
      drawReluLab();
      lab.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function revealApproximation() {
    var panel = $('#approxPanel');
    var cue = $('#reluApproxCue');
    if (!panel) return;
    state.reluLab.approxRevealed = true;
    clearScrollCue(cue);
    panel.hidden = false;
    state.reluLab.approxCount = 2;
    updateBadge('relu', 'done');
    updateBadge('approx', 'current');
    updateApproxText();
    window.requestAnimationFrame(function () {
      drawPlot($('#approxPlot'));
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function renderActivationVideos() {
    var host = $('#activationVideoPreview');
    if (!host || !window.DLModuleUI) return;
    host.innerHTML = window.DLModuleUI.renderRelatedVideos(recommendedVideos, {
      showHeader: false,
      ariaLabel: '激活函数推荐视频'
    });
  }

  function revealActivations() {
    var panel = $('#activationPanel');
    if (!panel) return;
    panel.hidden = false;
    updateBadge('approx', 'done');
    updateBadge('activations', 'current');
    renderActivationVideos();
    window.requestAnimationFrame(function () {
      $$('[data-plot^="activation-"]').forEach(drawPlot);
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function handleChoice(card) {
    var stage = card.getAttribute('data-stage');
    var isCorrect = card.getAttribute('data-correct') === 'true';
    $$('[data-stage="' + stage + '"]').forEach(function (item) {
      item.classList.remove('is-wrong');
      var itemTrigger = item.querySelector('[data-choice-trigger]');
      if (itemTrigger) itemTrigger.setAttribute('aria-pressed', 'false');
    });
    var trigger = card.querySelector('[data-choice-trigger]');
    if (trigger) trigger.setAttribute('aria-pressed', 'true');

    if (!isCorrect) {
      card.classList.add('is-wrong');
      if (stage === '2d') {
        setFeedback('feedback2d', '还不是。它的形状已经弯了或折了，所以不是这一关要找的线性函数。', 'bad');
      } else {
        setFeedback('feedback3d', '还不是。三维里的线性形状应该是一整张平面，而不是弯曲或折起来的表面。', 'bad');
      }
      return;
    }

    card.classList.add('is-correct');
    lockGroup(stage);
    if (stage === '2d') {
      state.passed2d = true;
      setFeedback('feedback2d', '选对了。二维里线性的图像是一条直线；现在进入三维。', 'good');
      window.setTimeout(reveal3D, 650);
      return;
    }

    state.passed3d = true;
    setFeedback('feedback3d', '选对了。三维里线性的图像是一张平面。接下来看看只堆线性神经元会怎样。', 'good');
    window.setTimeout(revealNetworkLab, 500);
  }

  function bindChoices() {
    $$('.af-choice-card').forEach(function (card) {
      card.addEventListener('click', function (event) {
        if (event.target.closest('[data-panel-interactive]')) return;
        handleChoice(card);
      });
    });
  }

  function bindNetworkLab() {
    var addNeuron = $('#addNeuronBtn');
    var addLayer = $('#addDeepLayerBtn');
    var removeLayer = $('#removeDeepLayerBtn');
    var reroll = $('#rerollDeepNetworkBtn');
    var modelCanvas = $('#networkModelCanvas');

    if (addNeuron) {
      addNeuron.addEventListener('click', function () {
        if (state.linearLab.shallow.neurons.length >= 3) return;
        state.linearLab.shallow.neurons.push(makeShallowNeuron());
        state.linearLab.selectedNode = null;
        syncNetworkControls();
        drawNetworkLab();
        renderLinearDeepCue();
      });
    }

    if (addLayer) {
      addLayer.addEventListener('click', function () {
        if (!state.linearLab.deepRevealed || state.linearLab.deep.layerCount >= 5) return;
        state.linearLab.deep.layerCount++;
        state.linearLab.selectedNode = null;
        buildDeepModel();
        drawLinearDeepLab();
        if (state.linearLab.deep.layerCount >= 5) window.setTimeout(finishNetworkLab, 520);
      });
    }

    if (removeLayer) {
      removeLayer.addEventListener('click', function () {
        if (!state.linearLab.deepRevealed || state.linearLab.deep.layerCount <= 1) return;
        state.linearLab.deep.layerCount--;
        state.linearLab.selectedNode = null;
        buildDeepModel();
        drawLinearDeepLab();
      });
    }

    if (reroll) {
      reroll.addEventListener('click', function () {
        state.linearLab.selectedNode = null;
        buildDeepModel();
        drawLinearDeepLab();
      });
    }

    if (modelCanvas) {
      modelCanvas.addEventListener('mousemove', function (event) {
        var node = nearestNetworkNode(event);
        if (state.linearLab.selectedNode
          && node
          && state.linearLab.selectedNode.layer === node.layer
          && state.linearLab.selectedNode.index === node.index) {
          positionNetworkInspector($('#networkInspector'), node);
          return;
        }
        state.linearLab.selectedNode = node;
        drawNetworkModel(modelCanvas);
      });
      modelCanvas.addEventListener('mouseleave', function () {
        state.linearLab.selectedNode = null;
        drawNetworkModel(modelCanvas);
      });
    }

  }

  function bindReluLab() {
    var startRelu = $('#startReluBtn');
    var reluInput = $('#reluInputRange');
    var continueRelu = $('#continueReluNetworkBtn');
    var addRelu = $('#addReluNeuronBtn');
    var resetRelu = $('#resetReluBtn');
    var reluModel = $('#reluModelCanvas');
    var addApprox = $('#addApproxNeuronBtn');
    var resetApprox = $('#resetApproxBtn');

    if (startRelu) {
      startRelu.addEventListener('click', revealReluIntro);
    }

    if (reluInput) {
      reluInput.addEventListener('input', function () {
        state.reluIntro.touched = true;
        state.reluIntro.value = Number(reluInput.value);
        reluInput.classList.remove('is-unset');
        reluInput.closest('.edu-control').classList.remove('is-unset');
        reluInput.removeAttribute('aria-valuetext');
        updateReluIntro();
      });
    }

    if (continueRelu) {
      continueRelu.addEventListener('click', revealReluLab);
    }

    if (addRelu) {
      addRelu.addEventListener('click', function () {
        if (state.reluLab.count >= 5) return;
        state.reluLab.count++;
        state.reluLab.selectedNode = null;
        drawReluLab();
        renderReluApproxCue();
      });
    }

    if (resetRelu) {
      resetRelu.addEventListener('click', function () {
        state.reluLab.count = 1;
        state.reluLab.approxRevealed = false;
        state.reluLab.selectedNode = null;
        drawReluLab();
        renderReluApproxCue();
      });
    }

    if (reluModel) {
      reluModel.addEventListener('mousemove', function (event) {
        var node = nearestReluNode(event);
        if (state.reluLab.selectedNode
          && node
          && state.reluLab.selectedNode.layer === node.layer
          && state.reluLab.selectedNode.index === node.index) {
          positionReluInspector($('#reluInspector'), node);
          return;
        }
        state.reluLab.selectedNode = node;
        drawReluModel(reluModel);
      });
      reluModel.addEventListener('mouseleave', function () {
        state.reluLab.selectedNode = null;
        drawReluModel(reluModel);
      });
    }

    if (addApprox) {
      addApprox.addEventListener('click', function () {
        if (state.reluLab.approxCount >= 12) return;
        state.reluLab.approxCount = Math.min(12, state.reluLab.approxCount + 2);
        updateApproxText();
        drawPlot($('#approxPlot'));
        if (state.reluLab.approxCount >= 12) window.setTimeout(revealActivations, 620);
      });
    }

    if (resetApprox) {
      resetApprox.addEventListener('click', function () {
        state.reluLab.approxCount = 2;
        updateApproxText();
        drawPlot($('#approxPlot'));
      });
    }
  }

  function bindResize() {
    var canvases = $$('canvas[data-viz]');
    window.DLCanvas.observe(canvases, function () {
      canvases.forEach(drawCanvas);
    });
  }

  bindChoices();
  bindScrollCues();
  initLinearLab();
  bindNetworkLab();
  bindReluLab();
  bindResize();
  window.requestAnimationFrame(drawAll);
})();

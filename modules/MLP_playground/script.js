(function () {
  'use strict';

  var trainers = [];
  var progression = {
    unlockedDim: 1,
    completed: {},
  };
  var activeScrollCueCleanup = null;

  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }

  function sigmoid(value) {
    if (value < -40) return 0;
    if (value > 40) return 1;
    return 1 / (1 + Math.exp(-value));
  }

  function randn() {
    var u = 0;
    var v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function dimensionCopy(dim) {
    if (dim === 1) return '在数轴上寻找分类切点';
    if (dim === 2) return '在平面上学习分类曲线';
    return '在空间中学习分类曲面';
  }

  function viewCopy(dim) {
    if (dim === 1) return '拖动平移 · 滚轮缩放';
    if (dim === 2) return '拖动平移 · 滚轮缩放';
    return '拖动旋转 · 滚轮缩放';
  }

  function coordinateName(index) {
    return ['x', 'y', 'z'][index] || 'x' + (index + 1);
  }

  function createLab(dim) {
    var isOneDimensional = dim === 1;
    var presetOptions = dim === 3
      ? [
          { value: 'blobs', label: '两团高斯' },
          { value: 'linear', label: '线性可分' },
          { value: 'circle', label: '内外球壳' },
          { value: 'xor', label: '八区异或' },
          { value: 'spiral3d', label: '双螺旋' },
          { value: 'slabs3d', label: '分层薄片' },
          { value: 'shell3d', label: '破碎球壳' },
        ]
      : [
          { value: 'blobs', label: '两团高斯' },
          { value: 'linear', label: '线性可分' },
          { value: 'circle', label: '内外区域' },
          { value: 'xor', label: '交叉区域' },
        ];
    var initialPreset = dim === 3 ? 'spiral3d' : 'linear';
    var initialPresetLabel = presetOptions.find(function (option) { return option.value === initialPreset; }).label;
    var presetOptionsHtml = presetOptions.map(function (option) {
      return '<button class="edu-selectbox-option" type="button" role="option" aria-selected="' + (option.value === initialPreset ? 'true' : 'false') + '" data-value="' + option.value + '">' + option.label + '</button>';
    }).join('');
    var toolbarHtml = isOneDimensional
      ? '<section class="z06-toolbar z06-dimension-toolbar z06-dimension-toolbar--simple" aria-label="1D 数据设置">' +
          '<div class="z06-preset-buttons" role="group" aria-label="1D 数据形状">' +
            '<button class="edu-btn is-active" data-role="preset-button" data-preset="linear" type="button">线性可分</button>' +
            '<button class="edu-btn" data-role="preset-button" data-preset="circle" type="button">内外交叉</button>' +
          '</div>' +
          '<p class="z06-toolbar-note">1D 先固定为 140 个样本、0.10 噪声，只观察边界和网络计算。</p>' +
        '</section>'
      : '<section class="z06-toolbar z06-dimension-toolbar" aria-label="' + dim + 'D 数据设置">' +
          '<div class="z06-control edu-control"><span class="edu-label" id="preset-label-' + dim + '">数据形状</span>' +
            '<div class="edu-selectbox" data-dl-selectbox data-role="preset-selectbox">' +
              '<button class="edu-selectbox-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="preset-menu-' + dim + '" aria-labelledby="preset-label-' + dim + ' preset-value-' + dim + '"><span id="preset-value-' + dim + '" data-selectbox-value>' + initialPresetLabel + '</span></button>' +
              '<div class="edu-selectbox-menu" id="preset-menu-' + dim + '" role="listbox" aria-labelledby="preset-label-' + dim + '" hidden>' + presetOptionsHtml + '</div>' +
              '<input data-role="preset" type="hidden" value="' + initialPreset + '">' +
            '</div>' +
          '</div>' +
          '<label class="z06-control edu-control" for="sample-count-' + dim + '"><span class="edu-control-head">样本数 <output class="edu-control-value" data-role="sample-count-value" for="sample-count-' + dim + '">140.00</output></span><input class="edu-range" id="sample-count-' + dim + '" data-role="sample-count" type="range" min="40" max="260" step="20" value="140" data-dl-range data-range-digits="2"></label>' +
          '<label class="z06-control edu-control" for="noise-' + dim + '"><span class="edu-control-head">噪声 <output class="edu-control-value" data-role="noise-value" for="noise-' + dim + '">0.12</output></span><input class="edu-range" id="noise-' + dim + '" data-role="noise" type="range" min="0" max="0.35" step="0.01" value="0.12" data-dl-range data-range-digits="2"></label>' +
          '<p class="z06-toolbar-note">本栏只影响当前 ' + dim + 'D 实验。改变设置会重新生成当前维度的数据。</p>' +
        '</section>';
    var modelToolsHtml = isOneDimensional
      ? '<div class="z06-model-tools z06-model-tools--locked">' +
          '<p class="z06-fixed-model">1 个隐藏层 · 3 个神经元</p>' +
        '</div>'
      : '<div class="z06-model-tools">' +
          '<div class="z06-layer-actions"><button class="edu-btn" data-role="add-layer" type="button">添加层</button><button class="edu-btn" data-role="remove-layer" type="button">删除层</button></div>' +
          '<label class="z06-unit-control edu-control" for="units-' + dim + '"><span class="edu-control-head">选中隐藏层神经元 <output class="edu-control-value" data-role="unit-value" for="units-' + dim + '">6.00</output></span><input class="edu-range" id="units-' + dim + '" data-role="units" type="range" min="2" max="12" step="1" value="6" data-dl-range data-range-digits="2"></label>' +
          (dim === 3 ? '<div class="z06-network-switches"><label class="edu-switch"><input data-role="bias-toggle" type="checkbox" checked><span>偏置</span></label><label class="edu-switch"><input data-role="activation-toggle" type="checkbox" checked><span>激活函数</span></label></div>' : '') +
        '</div>';
    var section = document.createElement('article');
    section.id = 'z06-dimension-' + dim;
    section.className = 'z06-dimension';
    if (isOneDimensional) section.classList.add('is-before-training');
    if (dim === 2) section.classList.add('is-2d-stage-0');
    section.innerHTML =
      '<header class="z06-dimension-head">' +
        '<div class="z06-dimension-title"><h2>' + dim + 'D</h2><span>' + dimensionCopy(dim) + '</span></div>' +
        '<div class="z06-metrics">' +
          '<div class="z06-metric"><span>Epoch</span><strong data-role="epoch">0</strong></div>' +
          '<div class="z06-metric"><span>Loss</span><strong data-role="loss">--</strong></div>' +
          '<div class="z06-metric"><span>Accuracy</span><strong data-role="accuracy">--</strong></div>' +
          '<button class="edu-btn edu-btn--primary" data-role="train" type="button">开始训练</button>' +
        '</div>' +
      '</header>' +
      (dim === 2 ? '<div class="edu-callout edu-callout--orange z06-stage-hint" data-role="stage-hint" aria-live="polite"><strong class="edu-callout-label" data-role="stage-hint-label">操作提示</strong><span class="edu-callout-text" data-role="stage-hint-text"></span></div>' : '') +
      toolbarHtml +
      '<div class="z06-lab">' +
        '<section class="z06-panel">' +
          '<div class="z06-panel-head"><h3>空间与分类边界</h3><span>' + viewCopy(dim) + '</span></div>' +
          '<div class="z06-canvas-box"><canvas data-role="space" width="720" height="440"></canvas></div>' +
          '<div class="z06-panel-foot">' +
            '<div class="z06-legend">' +
              '<span><i class="z06-dot blue"></i>类别 0</span>' +
              '<span><i class="z06-dot red"></i>类别 1</span>' +
              '<span><i class="z06-dot wrong"></i>分错样本</span>' +
            '</div>' +
            '<span class="z06-readout" data-role="readout">点击一个样本</span>' +
          '</div>' +
        '</section>' +
        '<section class="z06-panel">' +
          '<div class="z06-panel-head"><h3>MLP 结构与计算</h3><span data-role="architecture">' + dim + ' → ' + (isOneDimensional ? '3' : '6') + ' → 1</span></div>' +
          modelToolsHtml +
          '<div class="z06-canvas-box"><canvas data-role="model" width="720" height="440"></canvas></div><aside class="z06-inspector" data-role="inspector"></aside>' +
          '<div class="z06-panel-foot">' +
            '<div class="z06-sample-info">' +
              '<div><span>选中样本</span><strong data-role="sample">未选中</strong></div>' +
              '<div><span>蓝类置信度</span><strong data-role="blue">--</strong></div>' +
              '<div><span>红类置信度</span><strong data-role="red">--</strong></div>' +
            '</div>' +
          '</div>' +
        '</section>' +
      '</div>';
    if (window.DLModuleUI) {
      window.DLModuleUI.bindRanges(section);
      window.DLModuleUI.bindSelectboxes(section);
    }
    document.getElementById('labs').appendChild(section);
    return section;
  }

  function Trainer(dim) {
    this.dim = dim;
    this.root = createLab(dim);
    this.spaceCanvas = this.root.querySelector('[data-role="space"]');
    this.modelCanvas = this.root.querySelector('[data-role="model"]');
    this.modelPanel = this.modelCanvas.closest('.z06-panel');
    this.data = [];
    this.twoDimensionalStage = dim === 2 ? 0 : null;
    this.settings = dim === 1
      ? { preset: 'linear', sampleCount: 140, noise: 0.1 }
      : (dim === 2 ? { preset: 'linear', sampleCount: 140, noise: 0.1 } : { preset: 'spiral3d', sampleCount: 140, noise: 0.12 });
    this.useBias = true;
    this.useActivation = true;
    this.model = null;
    this.hidden = dim < 3 ? [3] : [6];
    this.selectedHidden = 0;
    this.selectedNode = null;
    this.modelPointer = { x: 0, y: 0 };
    this.modelNodes = [];
    this.selected = null;
    this.epoch = 0;
    this.loss = NaN;
    this.accuracy = NaN;
    this.running = false;
    this.view = { zoom: 1, panX: 0, panY: 0, rotX: -0.68, rotY: 0.72, dragging: false, moved: false, lastX: 0, lastY: 0 };
    this.bind();
    if (this.dim === 2) this.updateTwoDimensionalHint();
    this.generate();
    this.observeSize();
  }

  Trainer.prototype.find = function (role) {
    return this.root.querySelector('[data-role="' + role + '"]');
  };

  Trainer.prototype.setTrainButtonLoading = function (loading) {
    var button = this.find('train');
    button.classList.toggle('is-loading', loading);
    button.classList.toggle('edu-btn--primary', !loading);
    button.disabled = loading;
    if (loading) {
      button.setAttribute('aria-busy', 'true');
      button.textContent = '训练中';
      return;
    }
    button.removeAttribute('aria-busy');
  };

  Trainer.prototype.resetTrainButton = function (label) {
    this.running = false;
    this.setTrainButtonLoading(false);
    this.find('train').textContent = label || '开始训练';
  };

  Trainer.prototype.resizeCanvas = function (canvas) {
    return window.DLCanvas.resize(canvas);
  };

  Trainer.prototype.prepareContext = function (canvas) {
    return window.DLCanvas.context(canvas);
  };

  Trainer.prototype.observeSize = function () {
    var self = this;
    this.resizeObserver = window.DLCanvas.observe([this.spaceCanvas, this.modelCanvas], function () {
      var changed = self.resizeCanvas(self.spaceCanvas);
      changed = self.resizeCanvas(self.modelCanvas) || changed;
      if (changed) self.draw();
    });
  };

  Trainer.prototype.bind = function () {
    var self = this;
    if (this.dim === 1) {
      this.root.querySelectorAll('[data-role="preset-button"]').forEach(function (button) {
        button.addEventListener('click', function () {
          self.settings.preset = button.getAttribute('data-preset');
          self.root.querySelectorAll('[data-role="preset-button"]').forEach(function (item) {
            item.classList.toggle('is-active', item === button);
          });
          self.generate({ keepOneDimensionalControls: true });
        });
      });
    } else {
      this.find('preset').addEventListener('change', function (event) {
        self.settings.preset = event.target.value;
        self.generate();
      });
      this.find('sample-count').addEventListener('input', function (event) {
        self.settings.sampleCount = parseInt(event.target.value, 10);
        self.find('sample-count-value').textContent = self.settings.sampleCount.toFixed(2);
      });
      this.find('sample-count').addEventListener('change', function () {
        self.generate();
      });
      this.find('noise').addEventListener('input', function (event) {
        self.settings.noise = parseFloat(event.target.value);
        self.find('noise-value').textContent = self.settings.noise.toFixed(2);
      });
      this.find('noise').addEventListener('change', function () {
        self.generate();
      });
    }
    if (this.dim === 3) {
      this.find('bias-toggle').addEventListener('change', function (event) {
        self.resetTrainButton('开始训练');
        self.useBias = event.target.checked;
        self.initModel();
        self.draw();
      });
      this.find('activation-toggle').addEventListener('change', function (event) {
        self.resetTrainButton('开始训练');
        self.useActivation = event.target.checked;
        self.initModel();
        self.draw();
      });
    }
    this.find('train').addEventListener('click', function () {
      if (self.running) return;
      if (self.find('train').textContent === '重新训练') {
        if (self.dim === 1) self.setOneDimensionalTrainingState(false);
        self.initModel();
        self.draw();
      }
      self.running = true;
      self.setTrainButtonLoading(true);
      requestAnimationFrame(function () { self.loop(); });
    });
    if (this.dim !== 1) {
      this.find('add-layer').addEventListener('click', function () {
        if (self.hidden.length >= 4) return;
        self.resetTrainButton('开始训练');
        self.hidden.push(6);
        self.selectedHidden = self.hidden.length - 1;
        self.selectedNode = null;
        self.initModel();
        self.draw();
      });
      this.find('remove-layer').addEventListener('click', function () {
        if (!self.hidden.length) return;
        self.resetTrainButton('开始训练');
        self.hidden.splice(self.selectedHidden, 1);
        self.selectedHidden = clamp(self.selectedHidden, 0, Math.max(0, self.hidden.length - 1));
        self.selectedNode = null;
        self.initModel();
        self.draw();
      });
      this.find('units').addEventListener('input', function (event) {
        if (!self.hidden.length) return;
        self.resetTrainButton('开始训练');
        self.hidden[self.selectedHidden] = parseInt(event.target.value, 10);
        self.selectedNode = null;
        self.initModel();
        self.draw();
      });
    }
    this.modelCanvas.addEventListener('mousemove', function (event) {
      self.modelPointer.x = event.clientX;
      self.modelPointer.y = event.clientY;
      var node = self.nearestModelNode(event);
      if (node === self.selectedNode) {
        if (node) self.positionInspector(self.find('inspector'), node);
        return;
      }
      self.selectedNode = node;
      self.drawModel();
    });
    this.modelCanvas.addEventListener('mouseleave', function () {
      self.selectedNode = null;
      self.drawModel();
    });

    this.spaceCanvas.addEventListener('click', function (event) {
      if (self.view.moved) {
        self.view.moved = false;
        return;
      }
      var point = self.nearestPoint(event);
      if (!point) return;
      self.selected = point;
      self.selectedNode = null;
      self.draw();
    });

    window.DLPlot.bindPanZoom(this.spaceCanvas, this.view, {
      enabled: function () { return self.dim !== 3; },
      zoomMin: 0.5,
      zoomMax: 3.5,
      zoomInFactor: 1.09,
      zoomOutFactor: 0.92,
      onChange: function () { self.drawSpace(); },
    });
    window.DLPlot.bindRotateZoom(this.spaceCanvas, this.view, {
      enabled: function () { return self.dim === 3; },
      zoomMin: 0.5,
      zoomMax: 3.5,
      zoomInFactor: 1.09,
      zoomOutFactor: 0.92,
      onChange: function () { self.drawSpace(); },
    });
  };

  Trainer.prototype.generate = function (options) {
    options = options || {};
    this.resetTrainButton('开始训练');
    if (this.dim === 1) this.setOneDimensionalTrainingState(!!options.keepOneDimensionalControls && this.root.classList.contains('is-trained'));
    this.syncControls();
    this.data = [];
    this.selected = null;
    for (var i = 0; i < this.settings.sampleCount; i++) this.data.push(this.makePoint(i));
    this.initModel();
    this.draw();
  };

  Trainer.prototype.syncControls = function () {
    var preset = this.find('preset');
    var presetSelectbox = this.find('preset-selectbox');
    if (preset && presetSelectbox) {
      preset.value = this.settings.preset;
      var selectedOption = null;
      presetSelectbox.querySelectorAll('.edu-selectbox-option').forEach(function (option) {
        var selected = option.getAttribute('data-value') === preset.value;
        option.setAttribute('aria-selected', selected ? 'true' : 'false');
        if (selected) selectedOption = option;
      });
      if (selectedOption) presetSelectbox.querySelector('[data-selectbox-value]').textContent = selectedOption.textContent.trim();
    }
    var count = this.find('sample-count');
    if (count) count.value = this.settings.sampleCount;
    var countValue = this.find('sample-count-value');
    if (countValue) countValue.textContent = this.settings.sampleCount.toFixed(2);
    var noise = this.find('noise');
    if (noise) noise.value = this.settings.noise;
    var noiseValue = this.find('noise-value');
    if (noiseValue) noiseValue.textContent = this.settings.noise.toFixed(2);
  };

  Trainer.prototype.setOneDimensionalTrainingState = function (trained) {
    this.root.classList.toggle('is-before-training', !trained);
    this.root.classList.toggle('is-trained', trained);
  };

  Trainer.prototype.setTwoDimensionalStage = function (stage) {
    this.twoDimensionalStage = stage;
    this.root.classList.toggle('is-2d-stage-0', stage === 0);
    this.root.classList.toggle('is-2d-stage-1', stage === 1);
    this.root.classList.toggle('is-2d-stage-2', stage === 2);
    this.root.classList.toggle('is-2d-stage-3', stage === 3);
    this.updateTwoDimensionalHint();
  };

  Trainer.prototype.updateTwoDimensionalHint = function (text, tone) {
    if (this.dim !== 2) return;
    var hint = this.find('stage-hint');
    if (!hint) return;
    var messages = [
      '先看最简单的二维任务：线性可分。这里暂时固定网络，只需要点击开始训练。',
      '现在数据变成内外区域。只开放网络形状，请尝试调整层数或神经元，让准确率超过 90%。',
      '现在进入 XOR 区域。继续只调网络形状，让准确率超过 95%。达标后才开放完整数据设置。',
      '二维挑战已通过。现在可以自由调整数据形状、样本数、噪声和网络结构，也可以继续进入 3D。'
    ];
    var resolvedTone = tone || (this.twoDimensionalStage === 3 ? 'green' : 'orange');
    var labels = { orange: '操作提示', green: '达标提示', red: '未达标提示', blue: '观察提示' };
    hint.classList.remove('edu-callout--orange', 'edu-callout--blue', 'edu-callout--green', 'edu-callout--red');
    hint.classList.add('edu-callout--' + resolvedTone);
    hint.querySelector('[data-role="stage-hint-label"]').textContent = labels[resolvedTone];
    hint.querySelector('[data-role="stage-hint-text"]').textContent = text || messages[this.twoDimensionalStage] || '';
  };

  Trainer.prototype.advanceTwoDimensionalStage = function () {
    if (this.twoDimensionalStage === 0) {
      this.setTwoDimensionalStage(1);
      this.settings.preset = 'circle';
      this.hidden = [3];
      this.selectedHidden = 0;
      this.selectedNode = null;
      this.generate();
      return;
    }
    if (this.twoDimensionalStage === 1) {
      if (this.accuracy < 0.9) {
        this.updateTwoDimensionalHint('还没有超过 90%。可以增加隐藏层，或调高隐藏层神经元数，再重新训练。', 'red');
        return;
      }
      this.setTwoDimensionalStage(2);
      this.settings.preset = 'xor';
      this.selectedNode = null;
      this.generate();
      return;
    }
    if (this.twoDimensionalStage === 2) {
      if (this.accuracy < 0.95) {
        this.updateTwoDimensionalHint('XOR 还没有超过 95%。继续调整网络形状，再重新训练一次。', 'red');
        return;
      }
      this.setTwoDimensionalStage(3);
      this.updateTwoDimensionalHint('通过！二维里的线性、内外区域、XOR 都已经完成。完整控制栏已经开放。', 'green');
      handleDimensionComplete(this);
      return;
    }
  };

  Trainer.prototype.makePoint = function (index) {
    var label = index < this.settings.sampleCount / 2 ? 0 : 1;
    var x = [];
    var a;
    var r;
    var j;

    if (this.settings.preset === 'linear') {
      for (j = 0; j < this.dim; j++) x.push(-0.95 + Math.random() * 1.9);
      var score = x.reduce(function (sum, value, i) { return sum + value * (1 - i * 0.18); }, 0);
      label = score + randn() * this.settings.noise > 0 ? 1 : 0;
    } else if (this.settings.preset === 'xor') {
      for (j = 0; j < this.dim; j++) x.push(-0.9 + Math.random() * 1.8);
      if (this.dim === 1) label = Math.abs(x[0]) > 0.45 ? 1 : 0;
      if (this.dim === 2) label = x[0] * x[1] > 0 ? 1 : 0;
      if (this.dim === 3) label = x[0] * x[1] * x[2] > 0 ? 1 : 0;
    } else if (this.settings.preset === 'spiral3d' && this.dim === 3) {
      var t = Math.random() * Math.PI * 3.4 + label * Math.PI;
      var radius = 0.18 + t / (Math.PI * 3.4) * 0.72;
      x = [
        Math.cos(t) * radius + randn() * (0.05 + this.settings.noise * 0.12),
        Math.sin(t) * radius + randn() * (0.05 + this.settings.noise * 0.12),
        (t / (Math.PI * 3.4) - 0.5) * 1.45 + randn() * (0.06 + this.settings.noise * 0.12),
      ];
    } else if (this.settings.preset === 'slabs3d' && this.dim === 3) {
      x = [-0.95 + Math.random() * 1.9, -0.95 + Math.random() * 1.9, -0.95 + Math.random() * 1.9];
      var slab = Math.sin(x[0] * 4.2) + Math.cos(x[1] * 3.6) + x[2] * 1.25;
      label = slab + randn() * (0.35 + this.settings.noise * 0.8) > 0 ? 1 : 0;
    } else if (this.settings.preset === 'shell3d' && this.dim === 3) {
      a = Math.random() * Math.PI * 2;
      var polar = Math.acos(2 * Math.random() - 1);
      r = label ? 0.74 : 0.38;
      if (Math.random() < 0.32) r = label ? 0.42 : 0.68;
      r += randn() * (0.045 + this.settings.noise * 0.16);
      x = [Math.sin(polar) * Math.cos(a) * r, Math.sin(polar) * Math.sin(a) * r, Math.cos(polar) * r];
      if (x[0] + x[1] * 0.5 > 0.45 && Math.random() < 0.45) label = 1 - label;
    } else if (this.settings.preset === 'circle') {
      if (this.dim === 1) {
        x = [-0.95 + Math.random() * 1.9];
        label = Math.abs(x[0]) > 0.48 ? 1 : 0;
      } else if (this.dim === 2) {
        a = Math.random() * Math.PI * 2;
        r = label ? 0.7 : 0.28;
        r += randn() * (0.07 + this.settings.noise * 0.25);
        x = [Math.cos(a) * r, Math.sin(a) * r];
      } else {
        a = Math.random() * Math.PI * 2;
        var b = Math.acos(2 * Math.random() - 1);
        r = (label ? 0.72 : 0.28) + randn() * (0.07 + this.settings.noise * 0.2);
        x = [Math.sin(b) * Math.cos(a) * r, Math.sin(b) * Math.sin(a) * r, Math.cos(b) * r];
      }
    } else {
      for (j = 0; j < this.dim; j++) {
        var center = label ? 0.36 + j * 0.04 : -0.36 + j * 0.04;
        x.push(center + randn() * (0.18 + this.settings.noise));
      }
    }

    var noise = this.settings.noise;
    x = x.map(function (value) {
      return clamp(value + randn() * noise * 0.08, -1.15, 1.15);
    });
    return { x: x, y: label, screen: null };
  };

  Trainer.prototype.initModel = function () {
    var sizes = this.architecture();
    var W = [];
    var B = [];
    for (var l = 0; l < sizes.length - 1; l++) {
      var layer = [];
      var bias = [];
      var scale = Math.sqrt(2 / (sizes[l] + sizes[l + 1]));
      for (var row = 0; row < sizes[l + 1]; row++) {
        var weights = [];
        for (var col = 0; col < sizes[l]; col++) weights.push(randn() * scale);
        layer.push(weights);
        bias.push(0);
      }
      W.push(layer);
      B.push(bias);
    }
    this.model = { W: W, B: B, sizes: sizes };
    this.epoch = 0;
    this.loss = NaN;
    this.accuracy = NaN;
  };

  Trainer.prototype.architecture = function () {
    return [this.dim].concat(this.hidden).concat([1]);
  };

  Trainer.prototype.forward = function (input) {
    var acts = [input.slice()];
    var zs = [];
    var current = input.slice();
    for (var l = 0; l < this.model.W.length; l++) {
      var z = [];
      for (var row = 0; row < this.model.W[l].length; row++) {
        var sum = this.useBias ? this.model.B[l][row] : 0;
        for (var col = 0; col < current.length; col++) sum += this.model.W[l][row][col] * current[col];
        z.push(sum);
      }
      zs.push(z);
      var next = z.map(function (value) {
        if (l === this.model.W.length - 1) return sigmoid(value);
        return this.useActivation ? Math.tanh(value) : value;
      }, this);
      current = next;
      acts.push(current);
    }
    return { p: current[0], acts: acts, zs: zs };
  };

  Trainer.prototype.predict = function (input) {
    return this.forward(input).p;
  };

  Trainer.prototype.trainEpoch = function () {
    var self = this;
    var gradsW = this.model.W.map(function (layer) {
      return layer.map(function (row) { return row.map(function () { return 0; }); });
    });
    var gradsB = this.model.B.map(function (bias) {
      return bias.map(function () { return 0; });
    });
    var loss = 0;
    var correct = 0;

    this.data.forEach(function (sample) {
      var out = self.forward(sample.x);
      var p = clamp(out.p, 1e-6, 1 - 1e-6);
      loss += -(sample.y * Math.log(p) + (1 - sample.y) * Math.log(1 - p));
      if ((p >= 0.5 ? 1 : 0) === sample.y) correct++;

      var deltas = new Array(this.model.W.length);
      deltas[deltas.length - 1] = [p - sample.y];
      for (var layer = this.model.W.length - 1; layer >= 0; layer--) {
        var delta = deltas[layer];
        var previousActs = out.acts[layer];
        for (var neuron = 0; neuron < delta.length; neuron++) {
          if (this.useBias) gradsB[layer][neuron] += delta[neuron];
          for (var input = 0; input < previousActs.length; input++) {
            gradsW[layer][neuron][input] += delta[neuron] * previousActs[input];
          }
        }
        if (layer > 0) {
          var previousDelta = [];
          for (var previous = 0; previous < this.model.sizes[layer]; previous++) {
            var propagated = 0;
            for (var next = 0; next < delta.length; next++) {
              propagated += this.model.W[layer][next][previous] * delta[next];
            }
            var activation = out.acts[layer][previous];
            previousDelta.push(propagated * (this.useActivation ? (1 - activation * activation) : 1));
          }
          deltas[layer - 1] = previousDelta;
        }
      }
    }, this);

    var rate = 0.07 / this.data.length;
    for (var l = 0; l < this.model.W.length; l++) {
      for (var row = 0; row < this.model.W[l].length; row++) {
        if (this.useBias) this.model.B[l][row] -= rate * gradsB[l][row];
        for (var col = 0; col < this.model.W[l][row].length; col++) {
          this.model.W[l][row][col] -= rate * gradsW[l][row][col];
        }
      }
    }
    this.epoch++;
    this.loss = loss / this.data.length;
    this.accuracy = correct / this.data.length;
  };

  Trainer.prototype.loop = function () {
    if (!this.running) return;
    for (var i = 0; i < 6; i++) this.trainEpoch();
    this.draw();
    if (this.epoch >= 1500 || (this.accuracy > 0.985 && this.epoch > 60)) {
      this.running = false;
      this.setTrainButtonLoading(false);
      this.find('train').textContent = '重新训练';
      if (this.dim === 1) this.setOneDimensionalTrainingState(true);
      if (this.dim === 2) this.advanceTwoDimensionalStage();
      else handleDimensionComplete(this);
      return;
    }
    var self = this;
    requestAnimationFrame(function () { self.loop(); });
  };

  Trainer.prototype.draw = function () {
    this.resizeCanvas(this.spaceCanvas);
    this.resizeCanvas(this.modelCanvas);
    this.drawSpace();
    this.drawModel();
    this.updateText();
  };

  Trainer.prototype.updateText = function () {
    var architecture = this.architecture();
    this.find('epoch').textContent = String(this.epoch);
    this.find('loss').textContent = Number.isFinite(this.loss) ? this.loss.toFixed(3) : '--';
    this.find('accuracy').textContent = Number.isFinite(this.accuracy) ? (this.accuracy * 100).toFixed(1) + '%' : '--';
    this.find('architecture').textContent = architecture.join(' → ');
    if (this.dim !== 1) {
      this.find('unit-value').textContent = this.hidden.length ? this.hidden[this.selectedHidden].toFixed(2) : '无';
      this.find('units').disabled = !this.hidden.length;
      this.find('remove-layer').disabled = !this.hidden.length;
      if (this.hidden.length) this.find('units').value = this.hidden[this.selectedHidden];
    }
    if (!this.selected) {
      this.find('sample').textContent = '未选中';
      this.find('blue').textContent = '--';
      this.find('red').textContent = '--';
      this.find('readout').textContent = '点击一个样本';
      return;
    }
    var p = this.predict(this.selected.x);
    this.find('sample').textContent = this.selected.x.map(function (value, index) {
      return coordinateName(index) + '=' + value.toFixed(2);
    }).join(', ');
    this.find('blue').textContent = ((1 - p) * 100).toFixed(1) + '%';
    this.find('red').textContent = (p * 100).toFixed(1) + '%';
    this.find('readout').textContent = '预测类别 ' + (p >= 0.5 ? '1' : '0');
  };

  Trainer.prototype.project = function (point) {
    var canvas = this.spaceCanvas;
    if (this.dim < 3) {
      return window.DLPlot.project2D(canvas, point[0], this.dim === 1 ? 0 : point[1], {
        scaleFactor: 0.36,
        zoom: this.view.zoom,
        panX: this.view.panX,
        panY: this.view.panY,
      });
    }
    return window.DLPlot.project3D(canvas, point, this.view, { scaleFactor: 0.36 });
  };

  Trainer.prototype.drawSpace = function () {
    var ctx = this.prepareContext(this.spaceCanvas);
    var width = this.spaceCanvas.logicalWidth || this.spaceCanvas.width;
    var height = this.spaceCanvas.logicalHeight || this.spaceCanvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#fbfdff';
    ctx.fillRect(0, 0, width, height);
    if (this.dim === 1) this.draw1D(ctx);
    if (this.dim === 2) this.draw2D(ctx);
    if (this.dim === 3) this.draw3D(ctx);
  };

  Trainer.prototype.draw1D = function (ctx) {
    var width = this.spaceCanvas.logicalWidth || this.spaceCanvas.width;
    var height = this.spaceCanvas.logicalHeight || this.spaceCanvas.height;
    var y = height / 2 + this.view.panY;
    var scale = Math.min(width, height) * 0.36 * this.view.zoom;
    var axisStart = this.project([-1.2]);
    var axisEnd = this.project([1.2]);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#9fb0c8';
    ctx.beginPath();
    ctx.moveTo(axisStart.x, y);
    ctx.lineTo(axisEnd.x, y);
    ctx.stroke();
    this.draw1DTicks(ctx, y);
    var previousProbability = this.predict([-1.2]);
    var boundaries = [];
    for (var i = -120; i < 120; i++) {
      var value = i / 100;
      var probability = this.predict([value]);
      ctx.strokeStyle = probability >= 0.5 ? 'rgba(196,63,82,0.18)' : 'rgba(39,68,110,0.16)';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(width / 2 + this.view.panX + value * scale, y - 48);
      ctx.lineTo(width / 2 + this.view.panX + (value + 0.01) * scale, y - 48);
      ctx.stroke();
      if ((previousProbability - 0.5) * (probability - 0.5) < 0) {
        var ratio = (0.5 - previousProbability) / (probability - previousProbability);
        boundaries.push(value - 0.01 + ratio * 0.01);
      }
      previousProbability = probability;
    }
    boundaries.forEach(function (boundary) {
      var boundaryX = width / 2 + this.view.panX + boundary * scale;
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(boundaryX, y - 105); ctx.lineTo(boundaryX, y + 105); ctx.stroke();
      ctx.strokeStyle = '#f07e47';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(boundaryX, y - 105); ctx.lineTo(boundaryX, y + 105); ctx.stroke();
    }, this);
    this.drawPoints(ctx);
  };

  Trainer.prototype.draw1DTicks = function (ctx, axisY) {
    for (var value = -1; value <= 1.001; value += 0.25) {
      var point = this.project([value]);
      var major = Math.abs(value * 2 - Math.round(value * 2)) < 0.01;
      ctx.strokeStyle = major ? '#68778f' : '#9fb0c8';
      ctx.lineWidth = major ? 1.6 : 1;
      ctx.beginPath(); ctx.moveTo(point.x, axisY - (major ? 8 : 5)); ctx.lineTo(point.x, axisY + (major ? 8 : 5)); ctx.stroke();
      if (major) {
        ctx.fillStyle = '#68778f'; ctx.font = '800 10px monospace'; ctx.textAlign = 'center';
        ctx.fillText(value.toFixed(value === 0 ? 0 : 1), point.x, axisY + 24);
      }
    }
    var end = this.project([1.15]);
    ctx.fillStyle = '#27446e'; ctx.font = '900 13px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('x', end.x + 7, axisY + 4);
  };

  Trainer.prototype.draw2D = function (ctx) {
    var width = this.spaceCanvas.logicalWidth || this.spaceCanvas.width;
    var height = this.spaceCanvas.logicalHeight || this.spaceCanvas.height;
    var grid = 46;
    var min = -1.2;
    var max = 1.2;
    var values = [];
    for (var sampleRow = 0; sampleRow <= grid; sampleRow++) {
      values[sampleRow] = [];
      for (var sampleCol = 0; sampleCol <= grid; sampleCol++) {
        values[sampleRow][sampleCol] = this.predict([
          min + sampleCol / grid * (max - min),
          min + sampleRow / grid * (max - min),
        ]);
      }
    }
    for (var row = 0; row < grid; row++) {
      for (var col = 0; col < grid; col++) {
        var x = min + col / grid * (max - min);
        var y = min + row / grid * (max - min);
        var a = this.project([x, y]);
        var b = this.project([x + (max - min) / grid, y + (max - min) / grid]);
        ctx.fillStyle = values[row][col] >= 0.5 ? 'rgba(196,63,82,0.09)' : 'rgba(39,68,110,0.08)';
        ctx.fillRect(a.x, b.y, b.x - a.x + 1, a.y - b.y + 1);
      }
    }
    ctx.strokeStyle = '#dfe6f1';
    ctx.lineWidth = 1;
    for (var i = -10; i <= 10; i++) {
      var vertical = this.project([i / 10, 0]).x;
      var horizontal = this.project([0, i / 10]).y;
      ctx.beginPath(); ctx.moveTo(vertical, 0); ctx.lineTo(vertical, height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, horizontal); ctx.lineTo(width, horizontal); ctx.stroke();
    }
    this.draw2DAxes(ctx);
    this.drawBoundary2D(ctx, values, grid, min, max);
    this.drawPoints(ctx);
  };

  Trainer.prototype.draw2DAxes = function (ctx) {
    var self = this;
    window.DLPlot.drawAxes2D(ctx, this.spaceCanvas, {
      clear: false,
      grid: false,
      ticks: true,
      tickLabels: true,
      tickMin: -1,
      tickMax: 1,
      tickStep: 0.25,
      majorStep: 0.5,
      axisRange: 1.2,
      colors: {
        blue: '#27446e',
        axis: '#68778f',
        tick: '#9fb0c8',
      },
      project: function (x, y) { return self.project([x, y]); },
    });
  };

  Trainer.prototype.drawBoundary2D = function (ctx, values, grid, min, max) {
    var self = this;
    var step = (max - min) / grid;
    var segments = [];
    function crossing(ax, ay, av, bx, by, bv) {
      if ((av - 0.5) * (bv - 0.5) >= 0) return null;
      var ratio = (0.5 - av) / (bv - av);
      return self.project([ax + (bx - ax) * ratio, ay + (by - ay) * ratio]);
    }
    for (var row = 0; row < grid; row++) {
      for (var col = 0; col < grid; col++) {
        var x = min + col * step;
        var y = min + row * step;
        var hits = [
          crossing(x, y, values[row][col], x + step, y, values[row][col + 1]),
          crossing(x + step, y, values[row][col + 1], x + step, y + step, values[row + 1][col + 1]),
          crossing(x + step, y + step, values[row + 1][col + 1], x, y + step, values[row + 1][col]),
          crossing(x, y + step, values[row + 1][col], x, y, values[row][col]),
        ].filter(Boolean);
        if (hits.length === 2) segments.push([hits[0], hits[1]]);
        if (hits.length === 4) {
          segments.push([hits[0], hits[1]]);
          segments.push([hits[2], hits[3]]);
        }
      }
    }
    function strokeSegments(color, lineWidth) {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      segments.forEach(function (segment) {
        ctx.moveTo(segment[0].x, segment[0].y);
        ctx.lineTo(segment[1].x, segment[1].y);
      });
      ctx.stroke();
    }
    strokeSegments('rgba(255,255,255,0.9)', 7);
    strokeSegments('#f07e47', 3.5);
  };

  Trainer.prototype.draw3D = function (ctx) {
    var axes = [
      [[-1, -1, -1], [1.1, -1, -1], 'x'],
      [[-1, -1, -1], [-1, 1.1, -1], 'y'],
      [[-1, -1, -1], [-1, -1, 1.1], 'z'],
    ];
    axes.forEach(function (axis) {
      this.draw3DAxis(ctx, axis[0], axis[1], axis[2]);
    }, this);
    ctx.fillStyle = 'rgba(240,126,71,0.5)';
    for (var ix = 0; ix <= 18; ix++) {
      for (var iy = 0; iy <= 18; iy++) {
        var x = -1 + ix / 9;
        var y = -1 + iy / 9;
        var previous = this.predict([x, y, -1]) - 0.5;
        for (var iz = 1; iz <= 18; iz++) {
          var z = -1 + iz / 9;
          var current = this.predict([x, y, z]) - 0.5;
          if (previous * current < 0) {
            var hit = this.project([x, y, z]);
            ctx.beginPath(); ctx.arc(hit.x, hit.y, 2.2, 0, Math.PI * 2); ctx.fill();
            break;
          }
          previous = current;
        }
      }
    }
    this.drawPoints(ctx);
  };

  Trainer.prototype.draw3DAxis = function (ctx, start, end, label) {
    var self = this;
    window.DLPlot.drawAxis3D(ctx, {
      project: function (point) { return self.project(point); },
      start: start,
      end: end,
      label: label,
      tickStep: 0.25,
      majorStep: 0.5,
      tickLabels: true,
      colors: {
        blue: '#27446e',
        axis: '#68778f',
        tick: '#9fb0c8',
      },
    });
  };

  Trainer.prototype.drawPoints = function (ctx) {
    var self = this;
    var points = this.data.map(function (sample, index) {
      var projected = self.project(sample.x);
      if (self.dim === 1) projected.y += (index % 5 - 2) * 8;
      sample.screen = projected;
      return sample;
    });
    if (this.dim === 3) points.sort(function (a, b) { return a.screen.depth - b.screen.depth; });
    points.forEach(function (sample) {
      var wrong = self.epoch > 0 && (self.predict(sample.x) >= 0.5 ? 1 : 0) !== sample.y;
      ctx.beginPath();
      ctx.arc(sample.screen.x, sample.screen.y, wrong ? 8.5 : 7, 0, Math.PI * 2);
      ctx.fillStyle = sample.y ? '#c43f52' : '#27446e';
      ctx.fill();
      ctx.lineWidth = wrong ? 3.5 : 2;
      ctx.strokeStyle = wrong ? '#f07e47' : '#fff';
      ctx.stroke();
      if (sample === self.selected) {
        ctx.beginPath();
        ctx.arc(sample.screen.x, sample.screen.y, 13, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#21324a';
        ctx.stroke();
      }
    });
  };

  Trainer.prototype.drawModel = function () {
    var canvas = this.modelCanvas;
    var ctx = this.prepareContext(canvas);
    var width = canvas.logicalWidth || canvas.width;
    var height = canvas.logicalHeight || canvas.height;
    var sizes = this.architecture();
    var xs = sizes.map(function (_, index) {
      return 70 + index * ((width - 140) / Math.max(1, sizes.length - 1));
    });
    var layers = [];
    var out = this.selected ? this.forward(this.selected.x) : null;
    this.modelNodes = [];
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#fbfdff';
    ctx.fillRect(0, 0, width, height);

    sizes.forEach(function (size, layer) {
      var shown = Math.min(size, 12);
      var gap = Math.min(42, (height - 125) / Math.max(1, shown - 1));
      var start = height / 2 - gap * (size - 1) / 2;
      layers.push(Array.from({ length: shown }, function (_, i) {
        return { x: xs[layer], y: start + i * gap };
      }));
    });

    for (var l = 0; l < layers.length - 1; l++) {
      layers[l].forEach(function (a, col) {
        layers[l + 1].forEach(function (b, row) {
          var weight = this.model.W[l][row][col];
          ctx.strokeStyle = weight >= 0 ? 'rgba(39,68,110,0.30)' : 'rgba(196,63,82,0.30)';
          ctx.lineWidth = 0.8 + Math.min(2.8, Math.abs(weight) * 1.8);
          ctx.beginPath(); ctx.moveTo(a.x + 17, a.y); ctx.lineTo(b.x - 17, b.y); ctx.stroke();
        }, this);
      }, this);
    }

    layers.forEach(function (nodes, layer) {
      nodes.forEach(function (node, index) {
        var value = out ? out.acts[layer][index] : NaN;
        var selectedNode = this.selectedNode && this.selectedNode.layer === layer && this.selectedNode.index === index;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 18, 0, Math.PI * 2);
        if (!Number.isFinite(value)) ctx.fillStyle = layer === 0 ? '#27446e' : (layer === layers.length - 1 ? '#c43f52' : '#228d5c');
        else if (layer === layers.length - 1) ctx.fillStyle = 'rgba(196,63,82,' + (0.35 + value * 0.65).toFixed(2) + ')';
        else ctx.fillStyle = value >= 0 ? '#228d5c' : '#c07100';
        ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
        if (selectedNode) {
          ctx.beginPath(); ctx.arc(node.x, node.y, 24, 0, Math.PI * 2);
          ctx.strokeStyle = '#f07e47'; ctx.lineWidth = 3; ctx.stroke();
        }
        ctx.fillStyle = '#fff'; ctx.font = '900 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        var label = layer === 0 ? coordinateName(index) : (layer === layers.length - 1 ? 'p' : 'h' + layer + '.' + (index + 1));
        ctx.fillText(label, node.x, node.y);
        this.modelNodes.push({ x: node.x, y: node.y, layer: layer, index: index, label: label });
        if (Number.isFinite(value)) {
          ctx.fillStyle = '#21324a'; ctx.font = '900 10px monospace';
          ctx.fillText(value.toFixed(2), node.x + (layer === 0 ? -40 : 40), node.y);
        }
      }, this);
      ctx.fillStyle = '#68778f'; ctx.font = '900 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(layer === 0 ? '输入 (' + sizes[layer] + ')' : (layer === layers.length - 1 ? '输出 (1)' : '隐藏 ' + layer + ' (' + sizes[layer] + ')'), xs[layer], 35);
    }, this);

    ctx.fillStyle = '#68778f'; ctx.font = '800 12px monospace'; ctx.textAlign = 'center';
    ctx.fillText(out ? '悬浮神经元查看它所在整层的矩阵计算 · p(red)=' + out.p.toFixed(3) : '先点击左侧样本，再悬浮右侧神经元查看矩阵计算', width / 2, height - 20);
    this.renderInspector();
  };

  Trainer.prototype.matrixHtml = function (values, focusedRow) {
    var cols = Math.max.apply(null, values.map(function (row) { return row.length; }));
    var cells = values.map(function (row, rowIndex) {
      return row.map(function (value) {
        return '<span class="' + (rowIndex === focusedRow ? 'is-focus' : '') + '">' + value.toFixed(2) + '</span>';
      }).join('');
    }).join('');
    return '<div class="z06-matrix" style="--matrix-cols:' + cols + '">' + cells + '</div>';
  };

  Trainer.prototype.vectorHtml = function (values, focusedRow) {
    return this.matrixHtml(values.map(function (value) { return [value]; }), focusedRow);
  };

  Trainer.prototype.renderInspector = function () {
    var panel = this.find('inspector');
    if (!this.selected || !this.selectedNode) {
      panel.classList.remove('is-visible');
      panel.innerHTML = '';
      return;
    }
    var output = this.forward(this.selected.x);
    var node = this.selectedNode;
    if (node.layer === 0) {
      panel.innerHTML = '<strong>输入层 a⁰</strong><p>输入层直接承载空间坐标，不进行矩阵运算。</p>' +
        '<div class="z06-matrix-equation"><div class="z06-matrix-part"><b>坐标向量</b>' + this.vectorHtml(this.selected.x, node.index) + '</div></div>';
    } else {
      var modelLayer = node.layer - 1;
      var previous = output.acts[modelLayer];
      var weights = this.model.W[modelLayer];
      var bias = this.model.B[modelLayer];
      var zVector = output.zs[modelLayer];
      var activationVector = output.acts[node.layer];
      var activationName = node.layer === this.architecture().length - 1 ? 'sigmoid' : (this.useActivation ? 'tanh' : 'identity');
      var visibleBias = this.useBias ? bias : bias.map(function () { return 0; });
      panel.innerHTML = '<strong>第 ' + node.layer + ' 层矩阵计算</strong>' +
        '<p>悬浮节点 <b>' + node.label + '</b> 对应橙色矩阵行；整层同时完成一次矩阵运算。</p>' +
        '<div class="z06-matrix-equation">' +
          '<div class="z06-matrix-part"><b>W' + node.layer + '</b>' + this.matrixHtml(weights, node.index) + '</div>' +
          '<i>×</i>' +
          '<div class="z06-matrix-part"><b>a' + modelLayer + '</b>' + this.vectorHtml(previous, -1) + '</div>' +
          '<i>+</i>' +
          '<div class="z06-matrix-part"><b>' + (this.useBias ? 'b' + node.layer : '0') + '</b>' + this.vectorHtml(visibleBias, node.index) + '</div>' +
          '<i>=</i>' +
          '<div class="z06-matrix-part"><b>z' + node.layer + '</b>' + this.vectorHtml(zVector, node.index) + '</div>' +
        '</div>' +
        '<div class="z06-activation-line"><b>a' + node.layer + ' = ' + activationName + '(z' + node.layer + ')</b>' +
          this.vectorHtml(activationVector, node.index) + '</div>';
    }
    document.querySelectorAll('.z06-inspector.is-visible').forEach(function (otherPanel) {
      if (otherPanel !== panel) otherPanel.classList.remove('is-visible');
    });
    panel.classList.add('is-visible');
    this.positionInspector(panel, node);
  };

  Trainer.prototype.positionInspector = function (panel, node) {
    var panelRect = this.modelPanel.getBoundingClientRect();
    var canvasRect = this.modelCanvas.getBoundingClientRect();
    var canvasWidth = this.modelCanvas.logicalWidth || this.modelCanvas.width || 1;
    var canvasHeight = this.modelCanvas.logicalHeight || this.modelCanvas.height || 1;
    var nodeX = canvasRect.left - panelRect.left + node.x * (canvasRect.width / canvasWidth);
    var nodeY = canvasRect.top - panelRect.top + node.y * (canvasRect.height / canvasHeight);
    var gap = 34;
    var margin = 12;
    var desiredWidth = Math.min(720, panelRect.width - margin * 2);
    panel.style.width = desiredWidth + 'px';
    panel.style.maxHeight = 'none';
    var desiredHeight = panel.scrollHeight || 320;
    var spaces = [
      { side: 'right', width: Math.max(0, panelRect.width - nodeX - gap - margin), height: panelRect.height - margin * 2 },
      { side: 'left', width: Math.max(0, nodeX - gap - margin), height: panelRect.height - margin * 2 },
      { side: 'bottom', width: panelRect.width - margin * 2, height: Math.max(0, panelRect.height - nodeY - gap - margin) },
      { side: 'top', width: panelRect.width - margin * 2, height: Math.max(0, nodeY - gap - margin) },
    ].map(function (space) {
      space.fits = space.width >= Math.min(desiredWidth, 360) && space.height >= Math.min(desiredHeight, 180);
      space.score = space.width * space.height + (space.fits ? 1000000 : 0);
      return space;
    }).sort(function (a, b) {
      return b.score - a.score;
    });
    var best = spaces[0];
    var sidePlacement = best.side === 'left' || best.side === 'right';
    var popupWidth = sidePlacement
      ? Math.max(Math.min(320, desiredWidth), Math.min(desiredWidth, Math.max(best.width, 320)))
      : desiredWidth;
    panel.style.width = popupWidth + 'px';
    var popupHeight = panel.scrollHeight || desiredHeight;
    var left;
    var top;
    if (best.side === 'right') {
      left = nodeX + gap;
      top = nodeY - popupHeight / 2;
    } else if (best.side === 'left') {
      left = nodeX - popupWidth - gap;
      top = nodeY - popupHeight / 2;
    } else if (best.side === 'bottom') {
      left = nodeX - popupWidth / 2;
      top = nodeY + gap;
    } else {
      left = nodeX - popupWidth / 2;
      top = nodeY - popupHeight - gap;
    }
    if (best.side === 'left' || best.side === 'right') {
      top = clamp(top, margin, Math.max(margin, panelRect.height - popupHeight - margin));
    } else {
      left = clamp(left, margin, Math.max(margin, panelRect.width - popupWidth - margin));
    }
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
  };

  Trainer.prototype.nearestModelNode = function (event) {
    var rect = this.modelCanvas.getBoundingClientRect();
    var x = (event.clientX - rect.left) * (this.modelCanvas.logicalWidth || rect.width) / rect.width;
    var y = (event.clientY - rect.top) * (this.modelCanvas.logicalHeight || rect.height) / rect.height;
    var closest = null;
    var distance = 26;
    this.modelNodes.forEach(function (node) {
      var d = Math.hypot(node.x - x, node.y - y);
      if (d < distance) {
        distance = d;
        closest = node;
      }
    });
    return closest;
  };

  Trainer.prototype.nearestPoint = function (event) {
    var rect = this.spaceCanvas.getBoundingClientRect();
    var x = (event.clientX - rect.left) * (this.spaceCanvas.logicalWidth || rect.width) / rect.width;
    var y = (event.clientY - rect.top) * (this.spaceCanvas.logicalHeight || rect.height) / rect.height;
    var closest = null;
    var distance = 20;
    this.data.forEach(function (sample) {
      if (!sample.screen) return;
      var d = Math.hypot(sample.screen.x - x, sample.screen.y - y);
      if (d < distance) {
        distance = d;
        closest = sample;
      }
    });
    return closest;
  };

  function setProgressiveVisibility() {
    trainers.forEach(function (trainer) {
      var visible = trainer.dim <= progression.unlockedDim;
      trainer.root.classList.toggle('is-locked', !visible);
      trainer.root.setAttribute('aria-hidden', visible ? 'false' : 'true');
    });
  }

  function revealDimension(dim) {
    progression.unlockedDim = Math.max(progression.unlockedDim, dim);
    setProgressiveVisibility();
    var trainer = trainers.find(function (item) { return item.dim === dim; });
    if (!trainer) return;
    trainer.root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.requestAnimationFrame(function () {
      trainer.draw();
    });
  }

  function clearContinueCues() {
    if (activeScrollCueCleanup) {
      var cleanup = activeScrollCueCleanup;
      activeScrollCueCleanup = null;
      cleanup();
    }
  }

  function showScrollContinueCue(trainer, options) {
    clearContinueCues();
    var runway = document.createElement('div');
    runway.className = 'flow-scroll-runway';
    runway.setAttribute('aria-hidden', 'true');
    runway.innerHTML = '<span class="flow-scroll-sentinel"></span>';

    var cue = document.createElement('button');
    cue.className = 'flow-scroll-indicator';
    cue.type = 'button';
    cue.hidden = true;
    cue.setAttribute('aria-controls', options.controls || ('z06-dimension-' + options.nextDim));
    cue.innerHTML =
      '<span class="flow-scroll-indicator-mark" aria-hidden="true"></span>' +
      '<strong>下方有新内容</strong>' +
      '<small>滚动或点击查看</small>';

    var armed = false;
    var showTimer = 0;
    var startScrollY = 0;

    function cleanup() {
      window.clearTimeout(showTimer);
      window.removeEventListener('scroll', handleScroll);
      cue.remove();
      runway.remove();
    }

    function confirm() {
      if (!armed) return;
      armed = false;
      activeScrollCueCleanup = null;
      cleanup();
      options.onClick();
    }

    function handleScroll() {
      if (window.scrollY > startScrollY + 16) confirm();
    }

    cue.addEventListener('click', confirm);
    trainer.root.insertAdjacentElement('afterend', runway);
    document.body.appendChild(cue);
    activeScrollCueCleanup = cleanup;
    showTimer = window.setTimeout(function () {
      armed = true;
      cue.hidden = false;
      startScrollY = window.scrollY;
      window.addEventListener('scroll', handleScroll, { passive: true });
    }, options.delay || 420);
  }

  function handleDimensionComplete(trainer) {
    if (progression.completed[trainer.dim]) return;
    progression.completed[trainer.dim] = true;
    if (trainer.dim === 1) {
      showScrollContinueCue(trainer, {
        nextDim: 2,
        delay: 900,
        onClick: function () { revealDimension(2); },
      });
      return;
    }
    if (trainer.dim === 2) {
      showScrollContinueCue(trainer, {
        nextDim: 3,
        onClick: function () { revealDimension(3); },
      });
      return;
    }
    showScrollContinueCue(trainer, {
      controls: 'mlpConclusion',
      onClick: showMlpConclusion,
    });
  }

  function showMlpConclusion() {
    var existing = document.getElementById('mlpConclusion');
    if (existing) {
      existing.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    var conclusion = document.createElement('section');
    conclusion.id = 'mlpConclusion';
    conclusion.className = 'edu-content-block z07-mlp-conclusion';
    conclusion.setAttribute('aria-labelledby', 'mlpRelatedResourcesTitle');
    conclusion.innerHTML = [
      '<header class="edu-content-head">',
      '  <h3 class="edu-content-title" id="mlpRelatedResourcesTitle">推荐资源</h3>',
      '  <p class="edu-content-subtitle">继续观看与当前主题直接相关的视频，巩固刚才完成的学习内容。</p>',
      '</header>',
      '<div class="edu-content-body">',
      '  <div id="mlpRelatedVideos"></div>',
      '  <nav class="edu-resource-actions" aria-label="学习导航">',
      '    <a class="edu-btn" href="../CourseMap/">返回课程目录</a>',
      '    <a class="edu-btn edu-btn--primary" href="../Loss-Guide-2/" data-next-lesson>学习下一个</a>',
      '  </nav>',
      '</div>'
    ].join('');
    var videoHost = conclusion.querySelector('#mlpRelatedVideos');
    if (videoHost && window.DLModuleUI && window.DLModuleUI.renderRelatedVideos) {
      videoHost.innerHTML = window.DLModuleUI.renderRelatedVideos([
        {
          title: '三分钟动画讲解：多层感知机 MLP',
          embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1yuhezAEUh&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="多层感知机动画讲解"></iframe>'
        },
        {
          title: '多层感知机模型：从感知机到激活函数与反向传播',
          embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1xP4y1M7xm&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="多层感知机模型课程"></iframe>'
        },
        {
          title: '用 PyTorch 与 NumPy 手写 MLP 完成 MNIST 分类',
          embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1s5NEzWEXT&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="MLP 实作与 MNIST 分类"></iframe>'
        },
        {
          title: '多层感知器：权重运算与实现思路',
          embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1bV411f7oG&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="多层感知器讲解"></iframe>'
        }
      ], {
        showHeader: false,
        ariaLabel: 'MLP 相关视频推荐'
      });
    }
    document.getElementById('labs').insertAdjacentElement('afterend', conclusion);
    conclusion.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  [1, 2, 3].forEach(function (dim) {
    trainers.push(new Trainer(dim));
  });
  setProgressiveVisibility();
  window.addEventListener('resize', function () {
    trainers.forEach(function (trainer) {
      if (!trainer.root.classList.contains('is-locked')) trainer.draw();
    });
  });
})();

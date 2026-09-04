(function () {
  'use strict';

  var weather = [
    { key: 'sunny', label: '晴天', icon: '☀️', className: 'is-sunny' },
    { key: 'cloudy', label: '阴天', icon: '☁️', className: 'is-cloudy' },
    { key: 'rainy', label: '下雨', icon: '🌧️', className: 'is-rainy' },
  ];

  var forecasts = [
    { provider: '天气预报 A', probabilities: [0.70, 0.20, 0.10] },
    { provider: '天气预报 B', probabilities: [0.20, 0.30, 0.50] },
    { provider: '天气预报 C', probabilities: [0.05, 0.05, 0.90] },
  ];

  var recommendedVideos = [
    {
      title: '什么是信息量、信息熵、交叉熵与KL散度，及其相互之间的关系',
      embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=114867675665413&bvid=BV1mkgwzZEN9&cid=31104109705&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
    },
    {
      title: '概率背后的关键方程',
      embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=113059343368578&bvid=BV1sRHwe8ERa&cid=25682248852&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
    },
    {
      title: '【深度学习】15分钟搞定交叉熵损失 熵和香农熵 | 信息论｜最大似然 | 梯度特性',
      embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=114675626875309&bvid=BV12VMzzxExF&cid=30475028383&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
    },
    {
      title: '“交叉熵”如何做损失函数？打包理解“信息量”、“比特”、“熵”、“KL散度”、“交叉熵”',
      embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=418995116&bvid=BV15V411W7VB&cid=363160429&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
    },
  ];

  var state = {
    currentAct: 1,
    act1Solved: false,
    sigmoidChoiceSolved: false,
    sigmoidJudgementSolved: false,
    binaryTarget: 1,
    bcePhase: 'rain',
    act2Solved: false,
    bceRainSolved: false,
    act3Solved: false,
    independentLogits: [1.8, 1.1, 0.7],
    act4Solved: false,
    ceNegativeSolved: false,
    pairing: { pedestrian: '', traffic: '', bbox: '' },
    pairStep: 0,
    cues: {},
    activeFlowCue: null,
  };

  var pairOrder = ['pedestrian', 'traffic', 'bbox'];

  var liveAnimation = {
    running: true,
    startedAt: 0,
    pausedAt: 0,
    frameId: 0,
    inputValues: [],
    previousRaw: null,
  };

  var sigmoidChart = null;
  var lossDesignChart = null;
  var sigmoidQuestionApi = null;
  var ceNegativeQuestionApi = null;
  var pairQuestionApis = {};
  var SIGMOID_FEEDBACK_ENDPOINT = 'http://127.0.0.1:59414/loss/sigmoid-transform-feedback';
  var CE_SIGN_FEEDBACK_ENDPOINT = 'http://127.0.0.1:59414/loss/cross-entropy-sign-feedback';
  var LOSS_DESIGN_ENDPOINT = 'http://127.0.0.1:59414/loss/probability-design';

  function $(id) {
    return document.getElementById(id);
  }

  function all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function sigmoid(value) {
    return 1 / (1 + Math.exp(-value));
  }

  function sampleSigmoidRange(minimum, maximum, pointCount) {
    var zValues = [];
    var functionValues = [];
    var derivativeValues = [];
    var count = Math.max(120, pointCount || 600);
    for (var index = 0; index <= count; index += 1) {
      var z = minimum + (maximum - minimum) * index / count;
      var value = Math.max(Number.MIN_VALUE, Math.min(1 - Number.EPSILON, sigmoid(z)));
      zValues.push(z);
      functionValues.push(value);
      derivativeValues.push(value * (1 - value));
    }
    return { x: zValues, sigmoid: functionValues, derivative: derivativeValues };
  }

  function softmax(values) {
    var maxValue = Math.max.apply(null, values);
    var exps = values.map(function (value) { return Math.exp(value - maxValue); });
    var sum = exps.reduce(function (total, value) { return total + value; }, 0) || 1;
    return exps.map(function (value) { return value / sum; });
  }

  function resetPlotToggles(chartId) {
    all('[data-plot-trace-toggle][data-chart-id="' + chartId + '"]').forEach(function (input) {
      input.checked = true;
    });
  }

  function togglePlotTrace(input) {
    var host = $(input.getAttribute('data-chart-id'));
    var traceIndex = Number(input.getAttribute('data-trace-index'));
    if (!host || !window.Plotly || !host.data || !host.data[traceIndex]) return;
    window.Plotly.restyle(host, { visible: input.checked }, [traceIndex]);
  }

  function formulaTokenExplanation(token) {
    var explanations = {
      L: 'L：损失值，用来衡量预测与真实答案之间的差异',
      p: 'p：模型分给目标事件或真实类别的概率',
      y: 'y：目标值，可取 0 到 1；硬标签通常取 0 或 1',
      z: 'z：模型尚未经过概率转换的原始分数（logit）',
      e: 'e：自然常数，约等于 2.71828',
      log: 'log：自然对数；概率越接近 0，负对数惩罚越大',
      ln: 'ln：自然对数，与这里的 log 含义相同',
      exp: 'exp：指数函数，exp(z) 等于 e 的 z 次方',
      sigma: 'sigma：这里表示 Sigmoid 函数',
      'σ': 'σ：Sigmoid 函数，把实数映射到 0～1',
      'Σ': 'Σ：求和符号，把所有类别对应的项加起来',
      '′': '′：导数符号，表示函数随输入变化的速度',
      '∂': '∂：偏导数符号，只考察一个变量变化时的影响',
      '∞': '∞：无穷大，表示没有有限边界',
      '∈': '∈：属于，表示左侧元素属于右侧集合',
      'ℝ': 'ℝ：全体实数组成的集合，从负无穷到正无穷',
      '≈': '≈：约等于，表示数值非常接近但不一定完全相等',
      '⇒': '⇒：推出或代入后得到右侧结果',
      '→': '→：从左侧表示变换到右侧结果',
      '^': '^：幂运算，右侧数字或字母是指数',
      '/': '/：除法，左侧是分子，右侧是分母',
      '*': '*：乘法，把左右两项相乘',
      '×': '×：乘法，把左右两项相乘',
      '−': '−：负号或减号；具体含义由它所在的位置决定',
      '-': '−：负号或减号；具体含义由它所在的位置决定',
      '=': '=：等号，表示左右两边数值相同',
      '+': '+：加号，把左右两项相加',
      '_': '_：下标标记，用来区分类别、样本或位置',
      '≤': '≤：小于或等于',
      '≥': '≥：大于或等于',
      '≠': '≠：不等于',
      '√': '√：开方符号',
    };
    if (explanations[token]) return explanations[token];
    if (/^[A-Za-zα-ωΑ-Ω]$/.test(token)) return token + '：当前公式中的变量或参数';
    if (/^[₀-₉]+$/.test(token)) return token + '：下标，用来区分不同类别或位置';
    if (/^[⁰-⁹]+$/.test(token)) return token + '：上标，表示幂或指数';
    return token + '：当前公式中的数学符号';
  }

  function renderExplainedFormula(target, expression) {
    if (!target) return;
    var source = String(expression || '');
    var pattern = /log|ln|exp|sigma|[A-Za-zα-ωΑ-Ω]|[σΣ′∂∞∈ℝ≈⇒→^\/×*−=+_≤≥≠√\-]|[₀-₉]+|[⁰-⁹]+/g;
    var cursor = 0;
    var match;
    target.textContent = '';
    while ((match = pattern.exec(source))) {
      if (match.index > cursor) target.appendChild(document.createTextNode(source.slice(cursor, match.index)));
      var term = document.createElement('span');
      term.className = 'edu-formula-term';
      term.tabIndex = 0;
      term.textContent = match[0];
      term.setAttribute('data-tooltip', formulaTokenExplanation(match[0]));
      term.setAttribute('aria-label', formulaTokenExplanation(match[0]));
      target.appendChild(term);
      cursor = match.index + match[0].length;
    }
    if (cursor < source.length) target.appendChild(document.createTextNode(source.slice(cursor)));
  }

  function explainFormulaTree(root) {
    all('.edu-formula', root || document).forEach(function (formula) {
      if (formula.hasAttribute('data-no-formula-explanations')) return;
      formula.querySelectorAll('[aria-hidden="true"]').forEach(function (element) {
        element.removeAttribute('aria-hidden');
      });
      var walker = document.createTreeWalker(formula, window.NodeFilter.SHOW_TEXT);
      var textNodes = [];
      var node;
      while ((node = walker.nextNode())) {
        if (!node.nodeValue.trim()) continue;
        if (node.parentElement && node.parentElement.closest('.edu-formula-term')) continue;
        textNodes.push(node);
      }
      textNodes.forEach(function (textNode) {
        var holder = document.createElement('span');
        renderExplainedFormula(holder, textNode.nodeValue);
        var fragment = document.createDocumentFragment();
        while (holder.firstChild) fragment.appendChild(holder.firstChild);
        textNode.parentNode.replaceChild(fragment, textNode);
      });
    });
  }

  function percent(value, digits) {
    return (value * 100).toFixed(digits == null ? 1 : digits) + '%';
  }

  function showStage(number) {
    var stage = $('act' + number);
    if (!stage) return;
    var flowArea = $('act' + number + 'Flow');
    state.currentAct = number;
    if (flowArea) {
      flowArea.hidden = false;
      flowArea.setAttribute('aria-hidden', 'false');
    }
    stage.hidden = false;
    stage.classList.remove('is-locked');
    stage.classList.add('is-revealing');
    stage.setAttribute('aria-hidden', 'false');
    all('[data-progress]').forEach(function (item) {
      var step = Number(item.getAttribute('data-progress'));
      item.classList.toggle('is-current', step === number);
      item.classList.toggle('is-done', step < number);
      if (step === number) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
      if (step <= number) item.removeAttribute('aria-disabled');
      else item.setAttribute('aria-disabled', 'true');
    });
    window.requestAnimationFrame(function () {
      stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
      drawAll();
    });
  }

  function createCue(key, host, title, body, targetNumber, onClick) {
    if (state.cues[key] || !host) return;
    var area = $('act' + targetNumber + 'Flow');
    var indicator = $('flowScrollIndicator');
    if (!area || !indicator) return;
    area.hidden = false;
    area.setAttribute('aria-hidden', 'false');
    var runway = area.querySelector('.flow-scroll-runway');
    if (runway) runway.hidden = false;
    $('flowScrollTitle').textContent = title || '下方有新内容';
    $('flowScrollBody').textContent = '滚动或点击查看';
    indicator.setAttribute('aria-controls', 'act' + targetNumber);
    indicator.hidden = false;
    state.cues[key] = true;
    state.activeFlowCue = {
      key: key,
      area: area,
      runway: runway,
      onConfirm: onClick,
      description: body,
    };
  }

  function confirmFlowCue() {
    var cue = state.activeFlowCue;
    if (!cue) return;
    $('flowScrollIndicator').hidden = true;
    if (cue.runway) cue.runway.hidden = true;
    state.cues[cue.key] = null;
    state.activeFlowCue = null;
    cue.onConfirm();
  }

  function handleFlowWheel(event) {
    if (event.deltaY > 0 && state.activeFlowCue) confirmFlowCue();
  }

  function formatAnimatedNumber(value) {
    var magnitude = Math.abs(value);
    if (magnitude >= 1000) return (value >= 0 ? '+' : '') + value.toExponential(2);
    if (magnitude >= 100) return (value >= 0 ? '+' : '') + value.toFixed(0);
    return (value >= 0 ? '+' : '') + value.toFixed(2);
  }

  function formatSigmoidValue(value) {
    if (value < 0.000001) return '<0.000001';
    if (value > 0.999999) return '>0.999999';
    return value.toFixed(6);
  }

  function exponentialExcursion(sign, progress) {
    var arc = Math.sin(Math.PI * progress);
    var exponential = (Math.exp(arc * 8) - 1) / (Math.exp(8) - 1);
    return sign * (10 + exponential * (80000 - 10));
  }

  function scheduledRawValue(elapsed) {
    var time = elapsed % 15000;
    if (time < 5000) return -10 + time / 5000 * 20;
    if (time < 7500) return exponentialExcursion(1, (time - 5000) / 2500);
    if (time < 12500) return 10 - (time - 7500) / 5000 * 20;
    return exponentialExcursion(-1, (time - 12500) / 2500);
  }

  function renderNeuronStructure() {
    var host = $('neuronGraphMount');
    if (!host || !window.DLModuleUI) return;

    host.innerHTML = window.DLModuleUI.renderNetworkGraph({
      ariaLabel: '多个动态天气输入汇入一个神经元，中间用省略号表示未画出的输入',
      markerId: 'weatherInputArrow',
      inputTitle: '天气',
      factors: [
        { label: '湿度', value: '65%', weight: 0.8, weightLabel: '' },
        { label: '气压', value: '1013', weight: 0.8, weightLabel: '' },
      ],
      unitTitle: 'Σ',
      unitLabel: '汇总天气信号',
      outputValue: '',
    });

    all('.dl-network-weight', host).forEach(function (weight) {
      var container = weight.closest('foreignObject');
      if (container) container.remove();
    });

    var outputNode = host.querySelector('.dl-network-node--output');
    if (outputNode) {
      var outputContainer = outputNode.closest('foreignObject');
      if (outputContainer) outputContainer.remove();
    }

    var svg = host.querySelector('.dl-network-svg');
    var lines = host.querySelectorAll('.dl-network-line');
    var inputNodes = host.querySelectorAll('.dl-network-node--input');
    var inputContainers = Array.prototype.map.call(inputNodes, function (node) {
      return node.closest('foreignObject');
    });
    var inputYs = [58, 182];

    inputContainers.forEach(function (container, index) {
      if (container) container.setAttribute('y', String(inputYs[index] - 34));
      if (lines[index]) lines[index].setAttribute('y1', String(inputYs[index]));
    });
    if (lines.length) lines[lines.length - 1].remove();

    if (svg) {
      svg.setAttribute('viewBox', '0 0 470 240');
      var ellipsis = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      ellipsis.setAttribute('class', 'wp-network-ellipsis');
      ellipsis.setAttribute('x', '63');
      ellipsis.setAttribute('y', '126');
      ellipsis.setAttribute('text-anchor', 'middle');
      ellipsis.textContent = '⋮';
      svg.appendChild(ellipsis);
    }

    all('.dl-network-node--input', host).forEach(function (node, index) {
      var title = node.querySelector('strong');
      var label = node.querySelector('span');
      var names = ['湿度', '气压'];
      if (title) title.textContent = names[index];
      if (label) label.hidden = true;
    });

    liveAnimation.inputValues = all('.dl-network-node--input b', host);
  }

  function updateLiveAnimation(elapsed) {
    var raw = scheduledRawValue(elapsed);
    var offset = 2.8 * Math.sin(elapsed / 3000 * Math.PI * 2);
    var inputOne = raw / 3.6 + offset;
    var inputTwo = -raw / 2.7 + offset * (1.8 / 1.35);
    var probability = sigmoid(raw);

    if (liveAnimation.inputValues[0]) {
      liveAnimation.inputValues[0].textContent = Math.round(clamp(66 + inputOne * 1.4, 18, 98)) + '%';
    }
    if (liveAnimation.inputValues[1]) {
      liveAnimation.inputValues[1].textContent = Math.round(clamp(1013 - inputTwo * 0.7, 970, 1045));
    }
    $('animatedRawValue').textContent = formatAnimatedNumber(raw);
    $('animatedSigmoidValue').textContent = formatSigmoidValue(probability);

    var signal = clamp(Math.log10(Math.abs(raw) + 1) / 5, 0.12, 1);
    var rawOutput = $('animatedRawValue').parentElement;
    var loopTime = elapsed % 15000;
    var sizeProgress;
    if (loopTime < 6250) {
      sizeProgress = (loopTime + 1250) / 7500;
    }
    else if (loopTime < 13750) {
      sizeProgress = 1 - (loopTime - 6250) / 7500;
    }
    else {
      sizeProgress = (loopTime - 13750) / 7500;
    }
    var scale = 0.88 + sizeProgress * 0.28;
    rawOutput.style.setProperty('--signal-strength', signal.toFixed(3));
    rawOutput.style.setProperty('--demo-scale', scale.toFixed(3));
    if (liveAnimation.previousRaw !== null) {
      rawOutput.classList.toggle('is-increasing', raw > liveAnimation.previousRaw);
      rawOutput.classList.toggle('is-decreasing', raw < liveAnimation.previousRaw);
    }
    liveAnimation.previousRaw = raw;
    $('mysteryModule').style.setProperty('--signal-strength', signal.toFixed(3));
  }

  function animationFrame(timestamp) {
    if (!liveAnimation.running) return;
    if (!liveAnimation.startedAt) liveAnimation.startedAt = timestamp;
    updateLiveAnimation(timestamp - liveAnimation.startedAt);
    liveAnimation.frameId = window.requestAnimationFrame(animationFrame);
  }

  function startLiveAnimation() {
    if (liveAnimation.frameId) window.cancelAnimationFrame(liveAnimation.frameId);
    liveAnimation.running = true;
    liveAnimation.startedAt = 0;
    liveAnimation.previousRaw = null;
    liveAnimation.frameId = window.requestAnimationFrame(animationFrame);
    $('animationToggle').textContent = 'Ⅱ';
    $('animationToggle').setAttribute('aria-label', '暂停动画');
    $('animationToggle').setAttribute('title', '暂停动画');
  }

  function toggleLiveAnimation() {
    if (liveAnimation.running) {
      liveAnimation.running = false;
      liveAnimation.pausedAt = performance.now();
      if (liveAnimation.frameId) window.cancelAnimationFrame(liveAnimation.frameId);
      liveAnimation.frameId = 0;
      $('animationToggle').textContent = '▶';
      $('animationToggle').setAttribute('aria-label', '继续动画');
      $('animationToggle').setAttribute('title', '继续动画');
      return;
    }
    startLiveAnimation();
  }

  function renderSigmoidChart() {
    var host = $('sigmoidEchart');
    if (!host || sigmoidChart) return;
    if (!window.DLPlot) {
      host.classList.add('is-unavailable');
      host.textContent = '曲线组件暂时不可用。Sigmoid 的范围是 0～1，导数最大值为 0.25。';
      return;
    }

    var initialRange = [-8, 8];
    var sampled = sampleSigmoidRange(initialRange[0], initialRange[1], 600);

    sigmoidChart = true;
    resetPlotToggles('sigmoidEchart');
    window.DLPlot.mount2D(host, {
      xTitle: '模型原始分数（logit）',
      yTitle: '函数值',
      xRange: initialRange,
      yRange: [-0.08, 1.08],
      showLegend: false,
      series: [
        {
          name: 'Sigmoid σ(z)',
          x: sampled.x,
          y: sampled.sigmoid,
          color: '#228d5c',
          width: 4,
          hovertemplate: 'z = %{x:.1f}<br>σ(z) = %{y:.16f}<br>定义域：z ∈ ℝ；函数值始终小于 1<extra></extra>',
        },
        {
          name: '导数 σ′(z)',
          x: sampled.x,
          y: sampled.derivative,
          color: '#f07e47',
          width: 3,
          line: { dash: 'dash' },
          hovertemplate: 'z = %{x:.1f}<br>σ′(z) = %{y:.4f}<extra></extra>',
        },
        {
          name: '上限 y = 1（渐近线）',
          x: initialRange,
          y: [1, 1],
          color: '#68778f',
          width: 2,
          line: { dash: 'dot' },
          hovertemplate: 'y = 1 是上限，Sigmoid 只能无限接近<extra></extra>',
        },
      ],
      layout: {
        margin: { l: 56, r: 24, t: 42, b: 48 },
        legend: { orientation: 'h', x: 0, y: 1.12 },
        xaxis: { range: initialRange, autorange: false },
        yaxis: { range: [-0.08, 1.08], autorange: false },
      },
    }).then(function () {
      if (!host.on || !window.Plotly) return;
      host.on('plotly_relayout', function (event) {
        var left = Number(event['xaxis.range[0]']);
        var right = Number(event['xaxis.range[1]']);
        if (!Number.isFinite(left) || !Number.isFinite(right) || left === right) return;
        var minimum = Math.min(left, right);
        var maximum = Math.max(left, right);
        var current = sampleSigmoidRange(minimum, maximum, 600);
        window.Plotly.restyle(host, { x: [current.x, current.x], y: [current.sigmoid, current.derivative] }, [0, 1]);
        window.Plotly.restyle(host, { x: [[minimum, maximum]], y: [[1, 1]] }, [2]);
      });
    }).catch(function () {
      sigmoidChart = null;
      host.classList.add('is-unavailable');
      host.textContent = '曲线组件暂时不可用。Sigmoid 的范围是 0～1，导数最大值为 0.25。';
    });
  }

  function revealSigmoid() {
    if (state.act1Solved) return;
    state.act1Solved = true;
    $('mysteryModule').classList.add('is-revealed');
    $('sigmoidExplanation').hidden = false;
    window.requestAnimationFrame(function () {
      renderSigmoidChart();
      $('sigmoidExplanation').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    mountSigmoidChecks();
  }

  function unlockLossDesign() {
    if (!state.sigmoidChoiceSolved || !state.sigmoidJudgementSolved) return;
    createCue('act1', $('act1Cue'), '继续学习二分类损失', '已经用 Sigmoid 得到下雨概率，接下来学习怎样衡量二分类预测的好坏。', 2, function () {
      showStage(2);
    });
  }

  function mountSigmoidChecks() {
    if (!window.DLModuleUI || !$('sigmoidChoiceQuestion') || !$('sigmoidJudgementQuestion')) return;
    state.sigmoidChoiceSolved = false;
    state.sigmoidJudgementSolved = false;
    var stack = $('sigmoidQuestionStack');
    var secondCard = $('sigmoidJudgementCard');
    stack.classList.remove('has-second');
    secondCard.hidden = true;
    var checks = sigmoidCheckOptions();

    window.DLModuleUI.mountQuestion('#sigmoidChoiceQuestion', Object.assign({}, checks[0], {
      onCheck: function (result, question) {
        if (!result || !result.ok || state.sigmoidChoiceSolved) return;
        state.sigmoidChoiceSolved = true;
        question.querySelectorAll('.dl-question-option').forEach(function (option) { option.disabled = true; });
        stack.classList.add('has-second');
        secondCard.hidden = false;
        window.requestAnimationFrame(function () {
          secondCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      },
    }));

    window.DLModuleUI.mountQuestion('#sigmoidJudgementQuestion', Object.assign({}, checks[1], {
      onCheck: function (result, question) {
        if (!result || !result.ok || state.sigmoidJudgementSolved) return;
        state.sigmoidJudgementSolved = true;
        question.querySelectorAll('.dl-question-option').forEach(function (option) { option.disabled = true; });
        unlockLossDesign();
      },
    }));
  }

  function sigmoidCheckOptions() {
    return [
      {
        type: 'choice',
        typeLabel: '单选题',
        title: 'Sigmoid 在哪里变化最快？',
        options: [
          { key: 'A', value: 'middle', label: 'z = 0 附近' },
          { key: 'B', value: 'ends', label: '曲线两端' },
          { key: 'C', value: 'same', label: '处处一样快' },
        ],
        answer: 'middle',
        feedback: { correct: '看导数曲线：峰值就在 z=0。', wrong: '再看橙色导数曲线的最高点。' },
      },
      {
        type: 'judgement',
        typeLabel: '单选题',
        title: '当原始分数足够大或足够小时，Sigmoid 的输出会真正等于 1 或 0。',
        options: [
          { key: '对', value: 'true', label: '正确' },
          { key: '错', value: 'false', label: '错误' },
        ],
        answer: 'false',
        feedback: { correct: '不会。只要原始分数仍是有限值，Sigmoid 的输出就只会接近 0 或 1，不会真正取到端点。', wrong: '再观察曲线：Sigmoid 会不断接近 0 或 1，但有限的原始分数不会让它真正到达端点。' },
      },
    ];
  }

  function setSigmoidQuestionFeedback(tone, text) {
    if (!sigmoidQuestionApi) return;
    var mappedTone = tone === 'correct' ? 'correct' : ((tone === 'wrong' || tone === 'warn') ? 'wrong' : 'hint');
    sigmoidQuestionApi.streamFeedback(text || '', mappedTone);
  }

  function renderSigmoidQuestionFeedback(result) {
    var feedback = window.DLModuleUI.shortAnswerFeedback(
      result,
      '再观察一下：这里需要解决的是怎样把任意实数转换到 0～1 之间。'
    );
    setSigmoidQuestionFeedback(feedback.tone, feedback.message);
  }

  async function postJsonWithTimeout(url, payload, timeoutMs) {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeoutId = window.setTimeout(function () {
      if (controller) controller.abort();
    }, timeoutMs || 12000);
    try {
      var response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller ? controller.signal : undefined,
      });
      var data = await response.json().catch(function () { return {}; });
      return { response: response, data: data };
    }
    catch (error) {
      if (error && error.name === 'AbortError') {
        throw window.DLModuleUI.createUserFacingError('分析超时，请稍后再试。', 'AI_REQUEST_TIMEOUT');
      }
      throw error;
    }
    finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function submitSigmoidGuess(answer) {
    var input = sigmoidQuestionApi && sigmoidQuestionApi.root.querySelector('[data-role="question-answer"]');
    var button = sigmoidQuestionApi && sigmoidQuestionApi.submit;
    if (!input || !button || !answer) return;
    button.disabled = true;
    input.disabled = true;
    button.classList.add('is-loading');
    button.setAttribute('aria-busy', 'true');
    button.textContent = '判断中';
    setSigmoidQuestionFeedback('', '正在分析你的猜想，请稍候。');
    try {
      var result = await postJsonWithTimeout(SIGMOID_FEEDBACK_ENDPOINT, { answer: answer }, 12000);
      var response = result.response;
      var data = result.data;
      renderSigmoidQuestionFeedback(window.DLModuleUI.requireServiceResult(response, data));
      button.classList.remove('is-loading');
      button.removeAttribute('aria-busy');
      button.textContent = '已提交';
      revealSigmoid();
    }
    catch (error) {
      input.disabled = false;
      button.disabled = false;
      button.classList.remove('is-loading');
      button.removeAttribute('aria-busy');
      button.textContent = '提交';
      setSigmoidQuestionFeedback('wrong', window.DLModuleUI.friendlyErrorMessage(error));
    }
  }

  function mountSigmoidQuestion() {
    var host = $('sigmoidQuestion');
    if (!host || !window.DLModuleUI) return;
    sigmoidQuestionApi = window.DLModuleUI.mountQuestion('#sigmoidQuestion', {
      type: 'short',
      title: '模型输出的原始分数可以是任意实数。怎样把它转换成一个 0～1 之间的概率？请写下你的想法。',
      submitText: '提交',
      feedback: {
        empty: '先写下一个转换思路，不要求知道函数名字。',
        sample: '正在分析你的转换思路，请稍候。',
      },
      onCheck: function (result) {
        if (!result || result.empty || !result.answer[0]) return;
        submitSigmoidGuess(String(result.answer[0]).trim());
      },
    });
    var input = sigmoidQuestionApi.root.querySelector('[data-role="question-answer"]');
    if (input) window.DLModuleUI.bindInputHint(input);
  }

  function evaluateDesignedLoss(design, p) {
    var a = Number(design.scale) || 1;
    var power = Number(design.power) || 2;
    if (design.family === 'negative_log') return { loss: -a * Math.log(p), derivative: -a / p };
    if (design.family === 'quadratic') return { loss: a * Math.pow(1 - p, power), derivative: -a * power * Math.pow(1 - p, power - 1) };
    if (design.family === 'inverse') return { loss: a * (Math.pow(p, -power) - 1), derivative: -a * power * Math.pow(p, -power - 1) };
    return { loss: a * (1 - p), derivative: -a };
  }

  function renderLossDesign(design) {
    var exact = design.is_negative_log === true;
    var meaningful = design.is_meaningful !== false;
    var showUserCurve = meaningful && !exact;
    all('[data-user-loss-toggle], [data-user-derivative-toggle]').forEach(function (label) {
      label.hidden = !showUserCurve;
    });
    resetPlotToggles('lossDesignChart');
    $('userLossFormulaBlock').hidden = !showUserCurve;
    renderExplainedFormula($('userLossFormula'), design.formula);
    renderExplainedFormula($('userLossDerivative'), design.derivative);
    $('lossDesignResult').hidden = false;
    var referenceLoss = [];
    var referenceDerivative = [];
    var userLoss = [];
    var userDerivative = [];
    var probabilitySamples = [];
    for (var logIndex = 0; logIndex <= 320; logIndex += 1) {
      probabilitySamples.push(Math.pow(10, -6 + 6 * logIndex / 320));
    }
    for (var linearIndex = 1; linearIndex <= 500; linearIndex += 1) {
      probabilitySamples.push(linearIndex / 500);
    }
    probabilitySamples.sort(function (left, right) { return left - right; });
    probabilitySamples = probabilitySamples.filter(function (value, index, values) {
      return index === 0 || Math.abs(value - values[index - 1]) > 1e-12;
    });

    probabilitySamples.forEach(function (p) {
      var candidate = evaluateDesignedLoss(design, p);
      referenceLoss.push([p, -Math.log(p)]);
      referenceDerivative.push([p, -1 / p]);
      if (showUserCurve) {
        userLoss.push([p, candidate.loss]);
        userDerivative.push([p, candidate.derivative]);
      }
    });
    if (lossDesignChart && window.DLPlot) {
      window.DLPlot.purge($('lossDesignChart'));
    }
    var combinedSeries = [
      { name: '负对数损失 −log(p)', x: referenceLoss.map(function (point) { return point[0]; }), y: referenceLoss.map(function (point) { return point[1]; }), color: '#c43f52', width: 4, hovertemplate: 'p = %{x:.6f}<br>−log(p) = %{y:.6f}<extra></extra>' },
      { name: '负对数损失的导数 −1/p', x: referenceDerivative.map(function (point) { return point[0]; }), y: referenceDerivative.map(function (point) { return point[1]; }), color: '#f07e47', width: 3, line: { dash: 'dash' }, hovertemplate: 'p = %{x:.6f}<br>−1/p = %{y:.6f}<extra></extra>' },
    ];
    if (showUserCurve) {
      combinedSeries.push({ name: '你的损失函数', x: userLoss.map(function (point) { return point[0]; }), y: userLoss.map(function (point) { return point[1]; }), color: '#27446e', width: 3 });
      combinedSeries.push({ name: '你的损失函数的导数', x: userDerivative.map(function (point) { return point[0]; }), y: userDerivative.map(function (point) { return point[1]; }), color: '#228d5c', width: 2, line: { dash: 'dash' } });
    }
    lossDesignChart = true;
    window.DLPlot.mount2D($('lossDesignChart'), {
      xTitle: '真实类别的预测概率',
      yTitle: '数值（上方为损失，下方为导数）',
      xRange: [0, 1],
      yRange: [-15, 15],
      showLegend: false,
      series: combinedSeries,
      layout: {
        margin: { l: 72, r: 24, t: 32, b: 52 },
        xaxis: { range: [0, 1], autorange: false },
        yaxis: { range: [-15, 15], autorange: false },
      },
    }).catch(function () {
      lossDesignChart = null;
      $('lossDesignChart').textContent = '损失与导数曲线暂时不可用。';
    });
    $('lossDesignFeedback').className = 'edu-status wp-feedback ' + (meaningful ? 'is-success' : 'is-warning');
    window.DLModuleUI.streamText($('lossDesignFeedback'), design.explanation, { interval: 24 });
    window.requestAnimationFrame(function () { $('lossDesignResult').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  }

  function checkBceRainAnswer() {
    var input = $('bceRainInput');
    var button = $('bceRainCheck');
    var feedback = $('bceRainFeedback');
    if (!input || !button || !feedback || state.bceRainSolved) return;
    var value = String(input.value || '')
      .toLowerCase()
      .replace(/[\s()]/g, '')
      .replace(/[−–—]/g, '-');
    if (value === 'p') {
      state.bceRainSolved = true;
      input.value = 'p';
      input.disabled = true;
      input.removeAttribute('aria-invalid');
      button.disabled = true;
      button.textContent = '正确';
      feedback.hidden = true;
      $('bceCombinedReveal').hidden = false;
      createCue('act2', $('act2Cue'), '继续学习多个互斥类别', '已经得到二分类交叉熵（BCE）。接下来比较多个互斥类别为什么不能分别使用 Sigmoid。', 3, function () { showStage(3); });
      window.requestAnimationFrame(function () {
        $('bceCombinedReveal').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
      return;
    }
    input.setAttribute('aria-invalid', 'true');
    feedback.className = 'edu-status wp-bce-fill-feedback is-warning';
    feedback.textContent = '再想想：p 就是模型预测“下雨”的概率。';
    feedback.hidden = false;
  }

  function bindBceRainQuestion() {
    var input = $('bceRainInput');
    var button = $('bceRainCheck');
    if (!input || !button) return;
    button.addEventListener('click', checkBceRainAnswer);
    input.addEventListener('input', function () {
      input.removeAttribute('aria-invalid');
      $('bceRainFeedback').hidden = true;
    });
    input.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      checkBceRainAnswer();
    });
  }

  async function generateLossCurve() {
    var answer = $('lossIdeaInput').value.trim();
    if (!answer) { $('lossDesignFeedback').textContent = '先写下一个想法或公式。'; return; }
    var button = $('generateLossCurve');
    button.disabled = true;
    button.textContent = '正在生成曲线…';
    $('lossDesignFeedback').className = 'edu-status wp-feedback';
    $('lossDesignFeedback').textContent = '正在把你的想法转换成可绘制的公式。';
    try {
      var response = await fetch(LOSS_DESIGN_ENDPOINT, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answer: answer }),
      });
      var data = await response.json().catch(function () { return {}; });
      renderLossDesign(window.DLModuleUI.requireServiceResult(response, data));
    }
    catch (error) {
      $('lossDesignFeedback').className = 'edu-status wp-feedback is-danger';
      window.DLModuleUI.streamText(
        $('lossDesignFeedback'),
        window.DLModuleUI.friendlyErrorMessage(error),
        { interval: 24 }
      );
    }
    finally {
      button.disabled = false;
      button.textContent = '查看损失曲线';
    }
  }

  function probabilityBar(item, probability) {
    return [
      '<div class="wp-probability-row ', item.className, '">',
      '  <span>', item.icon, ' ', item.label, '</span>',
      '  <div><i style="width:', percent(probability, 2), '"></i></div>',
      '  <strong>', percent(probability, 1), '</strong>',
      '</div>',
    ].join('');
  }

  function renderIndependentSigmoids() {
    var probabilities = state.independentLogits.map(sigmoid);
    $('independentSigmoidBars').innerHTML = probabilities.map(function (value, index) {
      return probabilityBar(weather[index], value);
    }).join('');
    var total = probabilities.reduce(function (sum, value) { return sum + value; }, 0);
    var totalHost = $('independentSigmoidTotal');
    totalHost.querySelector('strong').textContent = percent(total, 1);
    totalHost.classList.toggle('is-invalid', Math.abs(total - 1) > 0.005);
    renderSoftmaxPreview();
  }

  function renderSoftmaxPreview() {
    var host = $('softmaxPreview');
    if (!host) return;
    var probabilities = softmax(state.independentLogits);
    host.innerHTML = [
      '<div class="wp-softmax-head">',
      '  <span>同一组原始分数（logit）使用 Softmax</span>',
      '</div>',
      '<div class="wp-probability-bars">',
      probabilities.map(function (value, index) {
        return probabilityBar(weather[index], value);
      }).join(''),
      '</div>',
      '<div class="wp-softmax-total"><span>概率总和</span><strong>100.0%</strong><small>晴、阴、雨共享这一份 100%</small></div>',
    ].join('');
  }

  function handleMutualAnswer(result) {
    if (!result || !result.ok || state.act3Solved) return;
    state.act3Solved = true;
    $('mutualReveal').hidden = false;
    renderSoftmaxPreview();
    createCue('act3', $('act3Cue'), '继续学习多分类损失', 'Softmax 已经把晴、阴、雨变成总和为 100% 的概率分布，接下来学习怎样计算多分类预测损失。', 4, function () { showStage(4); });
    window.requestAnimationFrame(function () {
      $('mutualReveal').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  function mountMutualQuestion() {
    if (!window.DLModuleUI || !$('mutualQuestion')) return;
    var probabilities = state.independentLogits.map(sigmoid);
    var total = probabilities.reduce(function (sum, value) { return sum + value; }, 0);
    window.DLModuleUI.mountQuestion('#mutualQuestion', {
      type: 'choice',
      typeLabel: '单选题',
      title: '三个天气类别分别使用 Sigmoid 后，概率合计为 ' + percent(total, 1) + '。这能表示晴、阴、雨三选一的结果吗？',
      options: [
        { key: 'A', value: 'no', label: '不能。总和超过 100%，不是有效的三选一概率分布' },
        { key: 'B', value: 'yes', label: '能。只要每一项都在 0～1 之间就可以' },
      ],
      answer: 'no',
      feedback: {
        correct: '正确。三选一的概率和必须是 100%，而这组是 ' + percent(total, 1) + '。',
        wrong: '不对。每项在 0～1 之间还不够，三项总和也必须是 100%。',
      },
      onCheck: handleMutualAnswer,
    });
  }

  function renderForecastCards() {
    var host = $('forecastCards');
    if (!host || host.children.length) return;
    host.innerHTML = forecasts.map(function (forecast, forecastIndex) {
      return [
        '<button class="edu-choice-card wp-forecast-card" type="button" data-forecast="', forecastIndex, '">',
        '  <div class="wp-forecast-card-head"><strong>', forecast.provider, '</strong><span class="wp-forecast-loss" hidden></span></div>',
        '  <div class="wp-probability-bars">',
        forecast.probabilities.map(function (value, weatherIndex) {
          return probabilityBar(weather[weatherIndex], value);
        }).join(''),
        '  </div>',
      '  <span>概率总和为 100%</span>',
        '</button>',
      ].join('');
    }).join('');
  }

  function chooseForecast(button) {
    if (state.act4Solved) return;
    var forecastIndex = Number(button.getAttribute('data-forecast'));
    var rainProbability = forecasts[forecastIndex].probabilities[2];
    all('[data-forecast]').forEach(function (item) { item.classList.remove('is-wrong'); });

    if (rainProbability === 0.9) {
      state.act4Solved = true;
      button.classList.add('is-correct');
      all('[data-forecast]').forEach(function (item) { item.disabled = true; });
      $('forecastFeedback').className = 'edu-status wp-feedback wp-forecast-feedback is-success';
      $('forecastFeedback').textContent = '正确。真实类别是“下雨”，给“下雨”最高概率的预测应得到最小的多分类交叉熵损失。';
      all('[data-forecast]').forEach(function (item) {
        var itemIndex = Number(item.getAttribute('data-forecast'));
        var itemRainProbability = forecasts[itemIndex].probabilities[2];
        var lossLabel = item.querySelector('.wp-forecast-loss');
        if (!lossLabel) return;
        lossLabel.textContent = '−log(' + itemRainProbability.toFixed(2) + ') = ' + (-Math.log(itemRainProbability)).toFixed(3);
        lossLabel.hidden = false;
      });
      $('ceReveal').hidden = false;
      window.requestAnimationFrame(function () {
        $('ceReveal').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
      return;
    }

    button.classList.add('is-wrong');
    $('forecastFeedback').className = 'edu-status wp-feedback wp-forecast-feedback is-warning';
    $('forecastFeedback').textContent = forecasts[forecastIndex].provider + '只给真实类别“下雨” ' + percent(rainProbability, 0) + '。再比较哪家预测给真实类别的概率最高。';
  }

  async function submitCeNegativeAnswer(answer) {
    var input = ceNegativeQuestionApi && ceNegativeQuestionApi.root.querySelector('[data-role="question-answer"]');
    var button = ceNegativeQuestionApi && ceNegativeQuestionApi.submit;
    if (!input || !button || !answer || state.ceNegativeSolved) return;

    input.disabled = true;
    button.disabled = true;
    button.classList.add('is-loading');
    button.setAttribute('aria-busy', 'true');
    button.textContent = '判断中';
    ceNegativeQuestionApi.streamFeedback('正在分析你的解释，请稍候。', 'hint');
    unlockAct5AfterCeQuestion();

    try {
      var result = await postJsonWithTimeout(CE_SIGN_FEEDBACK_ENDPOINT, { answer: answer }, 30000);
      var response = result.response;
      var data = result.data;
      var resultFeedback = window.DLModuleUI.shortAnswerFeedback(
        window.DLModuleUI.requireServiceResult(response, data),
        '请同时说明 log(p) 的正负和最小化损失时概率应变化的方向。'
      );
      ceNegativeQuestionApi.streamFeedback(resultFeedback.message, resultFeedback.tone);
      button.classList.remove('is-loading');
      button.removeAttribute('aria-busy');
      button.textContent = '已提交';
    }
    catch (error) {
      button.classList.remove('is-loading');
      button.removeAttribute('aria-busy');
      button.textContent = '已提交';
      ceNegativeQuestionApi.streamFeedback(window.DLModuleUI.friendlyErrorMessage(error), 'wrong');
    }
  }

  function unlockAct5AfterCeQuestion() {
    if (!state.act4Solved || state.ceNegativeSolved) return;
    state.ceNegativeSolved = true;
    createCue('act4', $('act4Cue'), '继续选择输出层', '已经比较了 Sigmoid、Softmax 及其损失函数，接下来根据不同任务选择合适的输出方式。', 5, function () {
      showStage(5);
    });
  }

  function mountCeNegativeQuestion() {
    if (!window.DLModuleUI || !$('ceNegativeQuestion')) return;
    ceNegativeQuestionApi = window.DLModuleUI.mountQuestion('#ceNegativeQuestion', {
      type: 'short',
      typeLabel: '简答题',
      title: '为什么交叉熵公式前要加负号？请结合概率在 0～1 之间时 log(p) 的正负，以及概率越接近 1 时损失应如何变化来解释。',
      answerLabel: '写下负号的作用',
      rows: 3,
      submitText: '提交解释',
      feedback: {
        empty: '先写下你的解释。',
        sample: '正在分析你的解释，请稍候。',
      },
      onCheck: function (result) {
        if (!result || result.empty || !result.answer[0]) return;
        submitCeNegativeAnswer(String(result.answer[0]).trim());
      },
    });
  }

  function handlePairingAnswer(group, result, question) {
    if (!result || result.empty || !result.answer.length) return;
    state.pairing[group] = result.answer.slice();
    if (!result.ok || group !== pairOrder[state.pairStep]) return;
    question.querySelectorAll('.dl-question-option').forEach(function (button) { button.disabled = true; });
    state.pairStep += 1;
    if (state.pairStep >= pairOrder.length) {
      window.setTimeout(finishPairing, 520);
      return;
    }
    window.setTimeout(renderPairingStep, 520);
  }

  function mountPairingQuestions() {
    var questions = {
      pedestrian: {
        target: '#pairQuestionPedestrian',
        type: 'multiple',
        typeLabel: '多选题',
        title: '只判断图片中有没有行人时，下面哪些输出层和损失函数搭配可以完成这个二分类任务？',
        options: [
          { key: 'A', value: 'one-sigmoid', label: '输出 1 个值，接 Sigmoid，使用 BCE' },
          { key: 'B', value: 'one-softmax', label: '输出 1 个值，接 Softmax，使用交叉熵' },
          { key: 'C', value: 'two-sigmoid', label: '输出 2 个值，分别接 Sigmoid，使用 BCE' },
          { key: 'D', value: 'two-softmax', label: '输出 2 个值，接 Softmax，使用交叉熵' },
        ],
        answer: ['one-sigmoid', 'two-sigmoid', 'two-softmax'],
        correct: '正确。A 最简洁；C 也能训练，但两个概率互不约束；D 用两个互斥类别表示“有”和“没有”。单个值做 Softmax 永远等于 1，所以 B 不行。',
        wrong: '再检查一下：A、C、D 都能完成二分类；只有“单个输出接 Softmax”无法区分有或没有。',
      },
      traffic: {
        target: '#pairQuestionTraffic',
        type: 'choice',
        typeLabel: '单选题',
        title: '需要从红、黄、绿三个互斥类别中判断红绿灯状态时，哪种输出层和损失函数搭配最合适？',
        options: [
          { key: 'A', value: 'traffic-one-sigmoid', label: '输出 1 个值，接 Sigmoid，使用 BCE' },
          { key: 'B', value: 'traffic-three-sigmoid', label: '输出 3 个值，分别接 Sigmoid，使用 BCE' },
          { key: 'C', value: 'traffic-three-softmax', label: '输出 3 个值，接 Softmax，使用交叉熵' },
          { key: 'D', value: 'traffic-regression', label: '输出 4 个连续数值，使用回归损失' },
        ],
        answer: 'traffic-three-softmax',
        correct: '正确。红、黄、绿互斥，3 个输出经过 Softmax 后共享 100% 概率，再用多分类交叉熵训练。',
        wrong: '再想想：三个状态只会出现一个，应让三个类别概率相加等于 100%。',
      },
      bbox: {
        target: '#pairQuestionBbox',
        type: 'choice',
        typeLabel: '单选题',
        title: '目标检测不仅要判断有没有行人，还要画出行人框。一个框既要确定放在哪里，也要确定覆盖多大范围。哪种设计最合适？',
        options: [
          { key: 'A', value: 'bbox-four', label: '输出中心 x、y 和宽高 w、h 四个连续数值，使用回归损失' },
          { key: 'B', value: 'bbox-four-class', label: '输出 x、y、w、h 四个值，接 Softmax，使用交叉熵' },
          { key: 'C', value: 'bbox-center-score', label: '输出中心 x、y 和“有行人”的置信度，分别使用回归损失和 BCE' },
          { key: 'D', value: 'bbox-score-class', label: '输出“有行人”的置信度和行人类别概率，使用 BCE 与交叉熵' },
        ],
        answer: 'bbox-four',
        correct: '正确。x、y 表示边框中心的位置，w、h 表示边框的宽和高；这四个量都是连续数值，要用回归损失学习。',
        wrong: '再想想：边框必须同时给出位置和大小，而且坐标与尺寸是连续数值，不能当作互斥类别。',
      },
    };
    pairOrder.forEach(function (group) {
      var config = questions[group];
      pairQuestionApis[group] = window.DLModuleUI.mountQuestion(config.target, {
        type: config.type,
        typeLabel: config.typeLabel,
        title: config.title,
        options: config.options,
        answer: config.answer,
        feedback: { correct: config.correct, wrong: config.wrong },
        onCheck: function (result, question) { handlePairingAnswer(group, result, question); },
      });
    });
  }

  function resetPairing() {
    state.pairing.pedestrian = '';
    state.pairing.traffic = '';
    state.pairing.bbox = '';
    state.pairStep = 0;
    pairOrder.forEach(function (group) {
      var api = pairQuestionApis[group];
      if (!api) return;
      api.resetQuestion();
      api.root.querySelectorAll('.dl-question-option').forEach(function (button) { button.disabled = false; });
    });
    $('resourcesPanel').hidden = true;
    $('resourcesPanel').setAttribute('aria-hidden', 'true');
    $('pairingWorkbench').hidden = false;
    renderPairingStep();
  }

  function renderPairingStep() {
    var activeGroup = pairOrder[state.pairStep];
    all('[data-pair-question]').forEach(function (question) {
      question.hidden = question.getAttribute('data-pair-question') !== activeGroup;
    });
  }

  function finishPairing() {
    all('[data-pair-question]').forEach(function (question) { question.hidden = true; });
    $('pairingWorkbench').hidden = true;
    $('resourcesPanel').hidden = false;
    $('resourcesPanel').setAttribute('aria-hidden', 'false');
    $('resourcesPanel').classList.add('is-revealing');
    renderRelatedVideos();
    all('[data-progress]').forEach(function (item) {
      var step = Number(item.getAttribute('data-progress'));
      item.classList.toggle('is-current', false);
      item.classList.toggle('is-done', step <= 5);
    });
    window.requestAnimationFrame(function () {
      $('resourcesPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  function renderRelatedVideos() {
    var host = $('relatedVideos');
    if (!host || host.children.length || !window.DLModuleUI) return;
    host.innerHTML = window.DLModuleUI.renderRelatedVideos(recommendedVideos, {
      showHeader: false,
      ariaLabel: '结尾推荐视频',
    });
  }

  function bindEvents() {
    $('flowScrollIndicator').addEventListener('click', confirmFlowCue);
    window.addEventListener('wheel', handleFlowWheel, { passive: true });
    $('animationToggle').addEventListener('click', toggleLiveAnimation);
    $('generateLossCurve').addEventListener('click', generateLossCurve);
    $('forecastCards').addEventListener('click', function (event) {
      var button = event.target.closest('[data-forecast]');
      if (button) chooseForecast(button);
    });
    all('[data-plot-trace-toggle]').forEach(function (input) {
      input.addEventListener('change', function () { togglePlotTrace(input); });
    });
    $('resetPairing').addEventListener('click', resetPairing);
  }

  function drawAll() {}

  function init() {
    window.DLModuleUI.bindInputHints(document);
    explainFormulaTree(document);
    renderNeuronStructure();
    mountSigmoidQuestion();
    mountMutualQuestion();
    bindBceRainQuestion();
    mountCeNegativeQuestion();
    renderIndependentSigmoids();
    renderForecastCards();
    mountPairingQuestions();
    renderPairingStep();
    bindEvents();
    startLiveAnimation();
    drawAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  }
  else {
    init();
  }
})();

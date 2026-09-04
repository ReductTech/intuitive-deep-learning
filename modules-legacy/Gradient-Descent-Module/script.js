(function () {
  'use strict';

  var GRADIENT_FEEDBACK_ENDPOINT = 'http://127.0.0.1:59414/gradient/oscillation-feedback';
  var EXACT_LOSS_THRESHOLD = 0.005;
  var CLOSE_LOSS_THRESHOLD = 0.5;

  var state = {
    h1: 3,
    h2: 1,
    target: 10,
    v1: -1,
    v2: -1,
    initialV1: -1,
    initialV2: -1,
    slidersUnlocked: false,
    sliderHintDismissed: false,
    impactQuestionRevealed: false
  };

  var autoDemo = {
    step: 0,
    v1: state.initialV1,
    v2: state.initialV2,
    stepRatio: 1,
    questionSolved: false,
    history: []
  };

  var fullState = {
    x1: 1,
    x2: 2,
    w11: 1,
    w21: 1,
    w12: 1,
    w22: 0,
    v1: 1,
    v2: 1,
    target: null,
    rate: 0.1,
    decay: 0.5,
    lossHistory: []
  };

  var recommendedVideos = [
    {
      title: '【梯度下降】3D可视化讲解通俗易懂',
      embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=891549064&bvid=BV18P4y1j7uH&cid=437149663&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
    },
    {
      title: '不至于吧，梯度下降简单得有点离谱了啊！',
      embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=1205349176&bvid=BV19f421Q7CL&cid=1569512599&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
    },
    {
      title: '梯度下降法：还在盲人下山？一集视频讲透底层逻辑！',
      embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=115694389697492&bvid=BV14kmxBiEja&cid=34635778203&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
    },
      {
      title: '如何理解“梯度下降法”？什么是“反向传播”？通过一个视频，一步一步全部搞明白',
      embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=504221815&bvid=BV1Zg411T71b&cid=371000112&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
    }
  ];

  function $(id) {
    return document.getElementById(id);
  }

  var directionQuestion;
  var impactQuestion;
  var lossDerivativeQuestion;
  var v1DerivativeQuestion;
  var v2DerivativeQuestion;
  var oscillationQuestion;
  var gradientScrollArmed = false;

  function setHidden(element, hidden) {
    element.hidden = hidden;
    element.setAttribute('aria-hidden', hidden ? 'true' : 'false');
  }

  function revealElement(element, block) {
    setHidden(element, false);
    element.classList.add('is-revealing');
    window.requestAnimationFrame(function () {
      element.scrollIntoView({ behavior: 'smooth', block: block || 'start' });
    });
  }

  function armGradientScrollCue() {
    if (gradientScrollArmed || !$('gradientNextTeaser').hidden) return;
    gradientScrollArmed = true;
    $('gradientScrollIndicator').hidden = false;
  }

  function confirmGradientScrollCue() {
    if (!gradientScrollArmed || !$('gradientNextTeaser').hidden) return;
    gradientScrollArmed = false;
    $('gradientScrollIndicator').hidden = true;
    resetFullNetwork();
    revealElement($('gradientNextTeaser'));
    window.requestAnimationFrame(renderFullLossHistory);
  }

  function resetGradientScrollCue() {
    gradientScrollArmed = false;
    $('gradientScrollIndicator').hidden = true;
  }

  function updateProgress(currentId) {
    var order = ['progressTune', 'progressObserve', 'progressExplain', 'progressTrain'];
    var currentIndex = order.indexOf(currentId);
    order.forEach(function (id, index) {
      var item = $(id);
      if (!item) return;
      item.classList.toggle('is-done', index < currentIndex);
      item.classList.toggle('is-current', index === currentIndex);
      if (index === currentIndex) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
      if (index > currentIndex) item.setAttribute('aria-disabled', 'true');
      else item.removeAttribute('aria-disabled');
    });
  }

  function setLossTone(tile, success) {
    tile.classList.toggle('edu-value-tile--orange', !success);
    tile.classList.toggle('edu-value-tile--success', success);
    tile.classList.toggle('is-low', success);
  }

  function setButtonLoading(button, loading) {
    button.classList.toggle('is-loading', loading);
    if (loading) button.setAttribute('aria-busy', 'true');
    else button.removeAttribute('aria-busy');
  }

  function startButtonHint(button) {
    window.DLModuleUI.startButtonHint(button);
  }

  function stopButtonHint(button) {
    window.DLModuleUI.stopButtonHint(button);
  }

  function resetStepRatioControl() {
    var range = $('stepRatio');
    range.value = '0.1';
    range.classList.add('is-unset');
    range.setAttribute('aria-valuetext', '尚未选择');
    $('rateControl').classList.add('is-unset');
    window.DLModuleUI.updateRange(range, false);
  }

  function format(value) {
    return Number(value).toFixed(2);
  }

  function weightFormat(value) {
    return Number(value).toFixed(1);
  }

  function compact(value) {
    var rounded = Math.round(value * 100) / 100;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  }

  function rateText(value) {
    if (value >= 0.01) return Number(value).toFixed(2);
    return Number(value).toPrecision(2);
  }

  function renderGradientVideos() {
    var host = $('gradientVideoPreview');
    if (!host || !window.DLModuleUI) return;
    host.innerHTML = window.DLModuleUI.renderRelatedVideos(recommendedVideos, {
      showHeader: false,
      ariaLabel: '推荐资源横向列表'
    });
  }

  function prediction() {
    return state.v1 * state.h1 + state.v2 * state.h2;
  }

  function lossValue(output) {
    return Math.abs(output - state.target);
  }

  function isCloseLoss(loss) {
    return loss < CLOSE_LOSS_THRESHOLD;
  }

  function isExactLoss(loss) {
    return loss < EXACT_LOSS_THRESHOLD;
  }

  function compareSymbol(error) {
    var loss = Math.abs(error);
    if (loss < EXACT_LOSS_THRESHOLD) return '=';
    if (isCloseLoss(loss)) return '≈';
    return error > 0 ? '>' : '<';
  }

  function updateEdge(edge, weight) {
    if (!edge) return;
    edge.style.strokeWidth = (2 + Math.min(5, Math.abs(weight) * 1.3)).toFixed(1);
    edge.style.opacity = String(0.5 + Math.min(0.5, Math.abs(weight) / 3));
  }

  function setWeightSliderHint(active) {
    ['v1Range', 'v2Range'].forEach(function (id) {
      $(id).closest('.gd-inline-weight').classList.toggle('is-attention', active);
    });
  }

  function dismissWeightSliderHint() {
    if (state.sliderHintDismissed) return;
    state.sliderHintDismissed = true;
    setWeightSliderHint(false);
  }

  function unlockWeightSliders() {
    if (state.slidersUnlocked) return;
    state.slidersUnlocked = true;
    $('v1Range').disabled = false;
    $('v2Range').disabled = false;
    if (!state.sliderHintDismissed) setWeightSliderHint(true);
  }

  function revealImpactQuestion() {
    if (state.impactQuestionRevealed) return;
    state.impactQuestionRevealed = true;
    updateProgress('progressObserve');
    revealElement($('impactQuestionStage'));
  }

  function render() {
    var output = prediction();
    var error = output - state.target;
    var loss = lossValue(output);
    var close = isCloseLoss(loss);

    $('v1Value').textContent = weightFormat(state.v1);
    $('v2Value').textContent = weightFormat(state.v2);
    $('networkOutputValue').textContent = format(output);
    $('lossValue').textContent = format(loss);
    updateEdge($('v1Edge'), state.v1);
    updateEdge($('v2Edge'), state.v2);

    var outputNode = document.querySelector('.gd-node--output');
    var lossCard = document.querySelector('.gd-score--loss');
    outputNode.classList.toggle('is-close', close);
    setLossTone(lossCard, close);
    $('networkCompareSymbol').textContent = compareSymbol(error);
    $('networkCompareSymbol').classList.toggle('is-equal', close);

    var modelFeedback = $('modelFeedback');
    if (close) {
      if (modelFeedback) {
        modelFeedback.textContent = loss < EXACT_LOSS_THRESHOLD ? '输出命中真实值。' : '输出已经足够接近真实值。';
        modelFeedback.className = 'edu-notice-strip edu-notice-strip--green';
      }
      if (state.slidersUnlocked) revealImpactQuestion();
    } else if (modelFeedback) {
      modelFeedback.textContent = '当前输出与真实值相差 ' + format(Math.abs(error)) + '。';
      modelFeedback.className = 'edu-notice-strip edu-notice-strip--blue';
    }
  }

  function bindRange(id, key) {
    var input = $(id);
    input.addEventListener('input', function () {
      dismissWeightSliderHint();
      state[key] = Number(input.value);
      render();
    });
  }

  function autoMetrics(v1, v2) {
    var output = v1 * state.h1 + v2 * state.h2;
    return {
      output: output,
      error: output - state.target,
      loss: Math.abs(output - state.target)
    };
  }

  function renderAutoNetwork(v1, v2) {
    var source = $('networkSvg');
    var clone = source.cloneNode(true);
    var output = v1 * state.h1 + v2 * state.h2;
    var error = output - state.target;
    var loss = Math.abs(output - state.target);

    clone.querySelector('#v1Value').textContent = weightFormat(v1);
    clone.querySelector('#v2Value').textContent = weightFormat(v2);
    clone.querySelector('#v1Range').value = String(v1);
    clone.querySelector('#v2Range').value = String(v2);
    clone.querySelector('#v1Range').disabled = true;
    clone.querySelector('#v2Range').disabled = true;
    clone.querySelector('#networkOutputValue').textContent = format(output);
    clone.querySelector('#networkCompareSymbol').textContent = compareSymbol(error);
    clone.querySelector('#networkCompareSymbol').classList.toggle('is-equal', isCloseLoss(loss));
    clone.querySelector('.gd-node--output').classList.toggle('is-close', isCloseLoss(loss));

    updateEdge(clone.querySelector('#v1Edge'), v1);
    updateEdge(clone.querySelector('#v2Edge'), v2);
    clone.querySelectorAll('[id]').forEach(function (element) {
      element.removeAttribute('id');
    });
    clone.querySelectorAll('label[for]').forEach(function (element) {
      element.removeAttribute('for');
    });
    $('autoNetworkHost').replaceChildren(clone);
  }

  function renderAutoLossHistory() {
    var host = $('autoLossHistoryPlot');
    if (!host || $('autoUpdate').hidden || $('autoLossHistoryPanel').hidden || !window.DLPlot) return;
    var losses = [autoMetrics(state.initialV1, state.initialV2).loss].concat(autoDemo.history.map(function (entry) {
      return entry.loss;
    }));
    var steps = losses.map(function (_, index) { return index; });
    window.DLPlot.mountTrainingHistory(host, {
      epochs: steps,
      loss: losses,
      showAccuracy: false,
      showLegend: false,
      lossName: 'L1 loss',
      lossTitle: 'L1 loss',
      xTitle: '更新次数',
      lossMode: 'lines+markers',
      lossMarker: { size: 9, color: '#f07e47', line: { color: '#ffffff', width: 2 } },
      xRange: [0, Math.max(5, autoDemo.step + 1)],
      lossRange: [0, Math.max(1, Math.max.apply(null, losses) * 1.12)],
      layout: { margin: { l: 58, r: 24, t: 20, b: 50 } },
      config: { scrollZoom: false }
    }).catch(function (error) {
      console.error(error);
    });
  }

  function renderAutoDemo() {
    var metrics = autoMetrics(autoDemo.v1, autoDemo.v2);
    renderAutoNetwork(autoDemo.v1, autoDemo.v2);
    renderAutoLossHistory();
    if (autoDemo.step > 0 || $('guidedUpdate').classList.contains('is-solved')) {
      updateGuidedRulePreview();
    }

    if (isExactLoss(metrics.loss)) {
      $('autoDemoCard').classList.remove('is-practicing');
      $('rateLabel').textContent = '学习率';
      $('executeAutoUpdateBtn').textContent = 'Loss 已到 0';
      $('executeAutoUpdateBtn').disabled = true;
      $('rateControl').classList.remove('is-attention');
      setHidden($('learningReveal'), false);
      armGradientScrollCue();
      return;
    }

    $('oscillationCue').hidden = !(autoDemo.step >= 3 && !autoDemo.questionSolved);

    if (autoDemo.step >= 5 && !autoDemo.questionSolved) {
      $('executeAutoUpdateBtn').hidden = true;
      $('guidedUpdate').hidden = false;
      setHidden($('oscillationForm'), false);
      $('learningInteraction').classList.add('has-question');
      return;
    }

    if (autoDemo.questionSolved) {
      $('rateControl').hidden = false;
      $('oscillationCue').hidden = true;
    }
  }

  function resetAutoDemo() {
    autoDemo.step = 0;
    autoDemo.v1 = state.initialV1;
    autoDemo.v2 = state.initialV2;
    autoDemo.stepRatio = 1;
    autoDemo.questionSolved = false;
    autoDemo.history = [];
    $('autoDemoActions').appendChild($('executeAutoUpdateBtn'));
    $('autoToolbar').hidden = true;
    $('executeAutoUpdateBtn').disabled = false;
    $('executeAutoUpdateBtn').hidden = true;
    $('executeAutoUpdateBtn').textContent = '执行一次参数更新';
    stopButtonHint($('executeAutoUpdateBtn'));
    $('rateControl').hidden = true;
    $('rateControl').classList.remove('is-attention');
    $('rateLabel').textContent = '步长比例';
    resetStepRatioControl();
    $('guidedUpdate').hidden = false;
    $('guidedUpdate').classList.remove('is-solved');
    $('guidedRuleLabel').textContent = '更新规则';
    $('guidedRuleText').hidden = false;
    $('guidedRuleResult').hidden = true;
    $('learningInteraction').classList.remove('has-question');
    $('autoDemoCard').classList.remove('is-practicing');
    $('autoDemoCard').classList.remove('is-solved');
    setHidden($('autoLossHistoryPanel'), true);
    if (window.DLPlot) window.DLPlot.purge($('autoLossHistoryPlot'));
    setHidden($('lossDerivativeForm'), false);
    setHidden($('v1DerivativeForm'), true);
    setHidden($('v2DerivativeForm'), true);
    [lossDerivativeQuestion, v1DerivativeQuestion, v2DerivativeQuestion].forEach(function (question) {
      question.resetQuestion();
      question.root.querySelector('[data-role="question-answer"]').disabled = false;
      question.submit.disabled = false;
    });
    setHidden($('oscillationForm'), true);
    oscillationQuestion.resetQuestion();
    oscillationQuestion.root.querySelector('[data-role="question-answer"]').disabled = false;
    oscillationQuestion.submit.disabled = false;
    oscillationQuestion.submit.hidden = false;
    setButtonLoading(oscillationQuestion.submit, false);
    oscillationQuestion.submit.textContent = '提交回答';
    $('tryLearningRateBtn').hidden = true;
    $('oscillationCue').hidden = true;
    $('learningReveal').hidden = true;
    resetGradientScrollCue();
    setHidden($('gradientNextTeaser'), true);
    renderAutoDemo();
  }

  function updateGuidedRulePreview() {
    var metrics = autoMetrics(autoDemo.v1, autoDemo.v2);
    var signal = metrics.error < 0 ? -1 : metrics.error > 0 ? 1 : 0;
    var gradientV1 = signal * state.h1;
    var gradientV2 = signal * state.h2;
    var ratio = autoDemo.questionSolved ? autoDemo.stepRatio : 1;
    $('confirmV1Old').textContent = compact(autoDemo.v1);
    $('confirmSignal1').textContent = compact(signal * ratio);
    $('confirmH1').textContent = compact(state.h1);
    $('confirmV1New').textContent = compact(autoDemo.v1 - gradientV1 * ratio);
    $('confirmV2Old').textContent = compact(autoDemo.v2);
    $('confirmSignal2').textContent = compact(signal * ratio);
    $('confirmH2').textContent = compact(state.h2);
    $('confirmV2New').textContent = compact(autoDemo.v2 - gradientV2 * ratio);
  }

  function advanceAutoDemo(ratioOverride) {
    var before = autoMetrics(autoDemo.v1, autoDemo.v2);
    if (isExactLoss(before.loss)) return;
    var ratio = typeof ratioOverride === 'number' ? ratioOverride : autoDemo.stepRatio;
    var errorDirection = before.error === 0 ? 0 : before.error > 0 ? 1 : -1;
    var gradientV1 = errorDirection * state.h1;
    var gradientV2 = errorDirection * state.h2;
    var deltaV1 = -gradientV1 * ratio;
    var deltaV2 = -gradientV2 * ratio;
    var beforeV1 = autoDemo.v1;
    var beforeV2 = autoDemo.v2;

    autoDemo.v1 += deltaV1;
    autoDemo.v2 += deltaV2;
    autoDemo.step += 1;

    var after = autoMetrics(autoDemo.v1, autoDemo.v2);
    autoDemo.history.push({
      beforeV1: beforeV1,
      beforeV2: beforeV2,
      beforeOutput: before.output,
      beforeLoss: before.loss,
      beforeError: before.error,
      gradientV1: gradientV1,
      gradientV2: gradientV2,
      deltaV1: deltaV1,
      deltaV2: deltaV2,
      ratio: ratio,
      v1: autoDemo.v1,
      v2: autoDemo.v2,
      output: after.output,
      error: after.error,
      loss: after.loss
    });
    renderAutoDemo();
  }

  function nearlyEqual(value, expected) {
    return Number.isFinite(value) && Math.abs(value - expected) < 0.001;
  }

  function lockQuestion(question) {
    question.root.querySelectorAll('button, input, textarea').forEach(function (control) {
      control.disabled = true;
    });
  }

  function revealQuestion(hostId, question) {
    setHidden($(hostId), false);
    window.requestAnimationFrame(function () {
      var input = question.root.querySelector('[data-role="question-answer"]');
      if (input) input.focus();
    });
  }

  function advanceGuidedQuestion(currentHostId, nextHostId, nextQuestion) {
    setHidden($(currentHostId), true);
    revealQuestion(nextHostId, nextQuestion);
  }

  function completeGuidedUpdate() {
    updateGuidedRulePreview();
    $('guidedUpdate').classList.add('is-solved');
    $('guidedRuleLabel').textContent = '代入结果';
    $('guidedRuleText').hidden = true;
    $('guidedRuleResult').hidden = false;
    $('autoDemoCard').classList.add('is-solved');
    setHidden($('autoLossHistoryPanel'), false);
    renderAutoLossHistory();
    $('executeAutoUpdateBtn').hidden = false;
    $('executeAutoUpdateBtn').disabled = false;
    $('executeAutoUpdateBtn').textContent = '执行一次参数更新';
    startButtonHint($('executeAutoUpdateBtn'));
  }

  function showTryLearningRateAction() {
    oscillationQuestion.root.querySelector('[data-role="question-answer"]').disabled = true;
    oscillationQuestion.submit.hidden = true;
    $('tryLearningRateBtn').setAttribute('data-dl-button-hint', '');
    $('tryLearningRateBtn').hidden = false;
    startButtonHint($('tryLearningRateBtn'));
  }

  function startLearningRatePractice() {
    stopButtonHint($('tryLearningRateBtn'));
    autoDemo.questionSolved = true;
    autoDemo.stepRatio = 0.1;
    resetStepRatioControl();
    setHidden($('oscillationForm'), true);
    $('learningInteraction').classList.remove('has-question');
    $('rateControl').hidden = false;
    $('rateControl').classList.remove('is-attention');
    $('guidedUpdate').hidden = false;
    $('autoToolbarActions').appendChild($('executeAutoUpdateBtn'));
    $('autoToolbar').hidden = false;
    $('executeAutoUpdateBtn').hidden = false;
    $('executeAutoUpdateBtn').disabled = false;
    $('executeAutoUpdateBtn').setAttribute('data-dl-button-hint', '');
    startButtonHint($('executeAutoUpdateBtn'));
    $('autoDemoCard').classList.add('is-practicing');
    renderAutoDemo();
    window.requestAnimationFrame(function () {
      $('autoUpdate').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function executeAutoUpdate() {
    var button = $('executeAutoUpdateBtn');
    stopButtonHint(button);
    button.disabled = true;
    setButtonLoading(button, true);
    $('autoNetworkHost').classList.add('is-updating');
    window.setTimeout(function () {
      advanceAutoDemo();
      $('autoNetworkHost').classList.remove('is-updating');
      setButtonLoading(button, false);
      if (!button.hidden && !isExactLoss(autoMetrics(autoDemo.v1, autoDemo.v2).loss) && !(autoDemo.step >= 5 && !autoDemo.questionSolved)) {
        button.disabled = false;
      }
    }, 550);
  }

  function fullForward() {
    var h1 = fullState.w11 * fullState.x1 + fullState.w21 * fullState.x2;
    var h2 = fullState.w12 * fullState.x1 + fullState.w22 * fullState.x2;
    var output = fullState.v1 * h1 + fullState.v2 * h2;
    return {
      h1: h1,
      h2: h2,
      output: output,
      loss: fullState.target === null ? null : Math.abs(output - fullState.target)
    };
  }

  function simulateFullTraining(target, rate, decay, maxSteps) {
    var sim = {
      x1: 1,
      x2: 2,
      w11: 1,
      w21: 1,
      w12: 1,
      w22: 0,
      v1: 1,
      v2: 1
    };
    function forward() {
      var h1 = sim.w11 * sim.x1 + sim.w21 * sim.x2;
      var h2 = sim.w12 * sim.x1 + sim.w22 * sim.x2;
      var output = sim.v1 * h1 + sim.v2 * h2;
      return { h1: h1, h2: h2, output: output, loss: Math.abs(output - target) };
    }
    var currentRate = rate;
    var result = forward();
    for (var step = 0; step < maxSteps && result.loss >= 0.5; step += 1) {
      var signal = result.output > target ? 1 : -1;
      var gradients = {
        v1: signal * result.h1,
        v2: signal * result.h2,
        w11: signal * sim.v1 * sim.x1,
        w21: signal * sim.v1 * sim.x2,
        w12: signal * sim.v2 * sim.x1,
        w22: signal * sim.v2 * sim.x2
      };
      Object.keys(gradients).forEach(function (key) {
        sim[key] -= currentRate * gradients[key];
      });
      currentRate *= decay;
      result = forward();
    }
    return result.loss;
  }

  function chooseFullLearningSchedule(target) {
    var best = { loss: Infinity, rate: 0.1, decay: 0.5 };
    var rates = [];
    var decays = [0.45, 0.52, 0.6, 0.68, 0.75, 0.82, 0.9];
    for (var exponent = -3; exponent <= 0.15; exponent += 0.12) {
      rates.push(Math.pow(10, exponent));
    }
    rates.push(0.05, 0.1, 0.2, 0.35, 0.55, 0.8, 1.1, 1.5);
    rates.forEach(function (rate) {
      decays.forEach(function (decay) {
        var loss = simulateFullTraining(target, rate, decay, 6);
        if (loss < best.loss) {
          best = { loss: loss, rate: rate, decay: decay };
        }
      });
    });
    return best;
  }

  function resetFullParameters() {
    fullState.w11 = 1;
    fullState.w21 = 1;
    fullState.w12 = 1;
    fullState.w22 = 0;
    fullState.v1 = 1;
    fullState.v2 = 1;
  }

  function renderFullLossHistory() {
    var history = fullState.lossHistory;
    var host = $('fullLossHistoryPlot');
    if (!host || !window.DLPlot || $('gradientNextTeaser').hidden) return;
    var steps = history.map(function (_, index) { return index; });
    var maxLoss = history.length ? Math.max.apply(null, history) : 1;
    window.DLPlot.mountTrainingHistory(host, {
      epochs: steps,
      loss: history,
      showAccuracy: false,
      showLegend: false,
      lossName: 'Loss',
      lossTitle: 'Loss',
      xTitle: '训练次数',
      lossMode: 'lines+markers',
      lossMarker: { size: 7, color: '#f07e47', line: { color: '#ffffff', width: 2 } },
      xRange: [0, Math.max(4, history.length)],
      lossRange: [0, Math.max(1, maxLoss * 1.08)],
      layout: { margin: { l: 42, r: 12, t: 10, b: 36 } },
      config: { scrollZoom: false }
    }).catch(function (error) {
      console.error(error);
    });
  }

  function renderFullNetwork() {
    var forward = fullForward();
    var rate = fullState.rate;
    $('fullH1').textContent = format(forward.h1);
    $('fullH2').textContent = format(forward.h2);
    $('fullOutputNode').textContent = format(forward.output);
    $('fullTargetNode').textContent = fullState.target === null ? '—' : format(fullState.target);
    $('fullRateValue').textContent = rateText(rate);
    $('fullDecayValue').textContent = Number(fullState.decay).toFixed(2);
    renderFullLossHistory();
    $('fullCompare').textContent = fullState.target === null ? '?' : compareSymbol(forward.output - fullState.target);
    $('fullCompare').classList.toggle('is-equal', forward.loss !== null && isCloseLoss(forward.loss));
    $('fullNetworkHost').querySelector('.gd-node--output').classList.toggle('is-close', forward.loss !== null && isCloseLoss(forward.loss));

    [
      ['fullW11', 'w₁₁', fullState.w11],
      ['fullW21', 'w₂₁', fullState.w21],
      ['fullW12', 'w₁₂', fullState.w12],
      ['fullW22', 'w₂₂', fullState.w22],
      ['fullV1', 'v₁', fullState.v1],
      ['fullV2', 'v₂', fullState.v2]
    ].forEach(function (item) {
      $(item[0]).textContent = item[1] + ' = ' + format(item[2]);
    });

    updateEdge($('fullW11Edge'), fullState.w11);
    updateEdge($('fullW21Edge'), fullState.w21);
    updateEdge($('fullW12Edge'), fullState.w12);
    updateEdge($('fullW22Edge'), fullState.w22);
    updateEdge($('fullV1Edge'), fullState.v1);
    updateEdge($('fullV2Edge'), fullState.v2);
  }

  function resetFullNetwork() {
    updateProgress('progressTrain');
    resetFullParameters();
    fullState.target = null;
    fullState.rate = 0.1;
    fullState.decay = 0.5;
    fullState.lossHistory = [];
    $('fullTargetInput').value = '';
    $('trainFullNetworkBtn').disabled = true;
    $('trainFullNetworkBtn').textContent = '训练一次';
    $('fullConclusion').hidden = true;
    renderFullNetwork();
  }

  function updateFullTargetFromInput() {
    var rawTarget = $('fullTargetInput').value.trim();
    var target = Number(rawTarget);
    if (!rawTarget || !Number.isFinite(target)) {
      fullState.target = null;
      fullState.lossHistory = [];
      renderFullNetwork();
      $('trainFullNetworkBtn').disabled = true;
      $('trainFullNetworkBtn').textContent = '训练一次';
      return;
    }
    resetFullParameters();
    fullState.target = target;
    var schedule = chooseFullLearningSchedule(target);
    fullState.rate = schedule.rate;
    fullState.decay = schedule.decay;
    var forward = fullForward();
    fullState.lossHistory = [forward.loss];
    renderFullNetwork();
    $('trainFullNetworkBtn').disabled = isCloseLoss(forward.loss);
    $('trainFullNetworkBtn').textContent = '训练一次';
  }

  function trainFullNetworkOnce() {
    if (fullState.target === null) return;
    var before = fullForward();
    if (isCloseLoss(before.loss)) return;
    var signal = before.output > fullState.target ? 1 : -1;
    var rate = fullState.rate;
    var gradients = {
      v1: signal * before.h1,
      v2: signal * before.h2,
      w11: signal * fullState.v1 * fullState.x1,
      w21: signal * fullState.v1 * fullState.x2,
      w12: signal * fullState.v2 * fullState.x1,
      w22: signal * fullState.v2 * fullState.x2
    };

    $('trainFullNetworkBtn').disabled = true;
    setButtonLoading($('trainFullNetworkBtn'), true);
    $('fullNetworkHost').classList.add('is-backprop');
    window.setTimeout(function () {
      Object.keys(gradients).forEach(function (key) {
        fullState[key] -= rate * gradients[key];
      });
      fullState.rate *= fullState.decay;
      var after = fullForward();
      fullState.lossHistory.push(after.loss);
      renderFullNetwork();
      $('fullNetworkHost').classList.remove('is-backprop');
      setButtonLoading($('trainFullNetworkBtn'), false);
      setHidden($('fullConclusion'), false);
      if (isCloseLoss(after.loss)) {
        $('trainFullNetworkBtn').disabled = true;
        $('trainFullNetworkBtn').textContent = '训练完成';
      } else {
        $('trainFullNetworkBtn').disabled = false;
      }
    }, 520);
  }

  function derivativeValidator(expectedValue) {
    return function (answer) {
      return nearlyEqual(Number(answer[0]), expectedValue())
        ? { ok: true, message: '正确。继续完成下一步。' }
        : { ok: false, message: '再想一下，并结合上面的已知公式判断。' };
    };
  }

  function addDerivativeHint(question, text) {
    var hint = document.createElement('p');
    var label = document.createElement('strong');
    var message = document.createElement('span');
    hint.className = 'gd-derivative-hint';
    label.textContent = '提示';
    message.textContent = text;
    hint.appendChild(label);
    hint.appendChild(message);
    question.root.querySelector('.dl-question-feedback').before(hint);
  }

  async function submitOscillationAnswer(answer) {
    var submit = oscillationQuestion.submit;
    if (!answer) return;
    submit.disabled = true;
    submit.textContent = '正在分析...';
    setButtonLoading(submit, true);
    oscillationQuestion.streamFeedback('正在分析你的回答，请稍候。', 'hint');
    try {
      var response = await fetch(GRADIENT_FEEDBACK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: answer })
      });
      var data = await response.json().catch(function () { return {}; });
      var result = window.DLModuleUI.requireServiceResult(response, data);
      var feedback = window.DLModuleUI.shortAnswerFeedback(result);
      oscillationQuestion.streamFeedback(feedback.message, feedback.tone);
      showTryLearningRateAction();
    } catch (error) {
      oscillationQuestion.streamFeedback(window.DLModuleUI.friendlyErrorMessage(error), 'wrong');
      showTryLearningRateAction();
    } finally {
      setButtonLoading(submit, false);
      if (!submit.hidden) {
        submit.disabled = false;
        submit.textContent = '提交回答';
      }
    }
  }

  directionQuestion = window.DLModuleUI.mountQuestion('#directionQuestion', {
    type: 'choice',
    title: '现在输出值 y 比真实值 GT 小。为了让 y 变大、Loss 变小，权重大体上应该变大还是变小？',
    options: [
      { key: 'A', value: 'up', label: '变大' },
      { key: 'B', value: 'down', label: '变小' }
    ],
    answer: 'up',
    feedback: {
      correct: '对。把输出层权重整体往上调，y 会更接近 GT。',
      wrong: '当前 y = -4，小于 GT = 10。再判断输出需要往哪个方向移动。'
    },
    onCheck: function (result) {
      if (!result.ok) return;
      lockQuestion(directionQuestion);
      unlockWeightSliders();
      $('v1Range').focus({ preventScroll: true });
    }
  });

  impactQuestion = window.DLModuleUI.mountQuestion('#impactQuestion', {
    type: 'choice',
    title: '哪个权重调一点，对输出 y 的影响更大？',
    options: [
      { key: 'A', value: 'v1', label: 'v₁' },
      { key: 'B', value: 'v2', label: 'v₂' }
    ],
    answer: 'v1',
    feedback: {
      correct: '对。v₁ 前面乘的是 h₁ = 3；同样调整一点，v₁ 对 y 的影响更大。',
      wrong: '观察隐藏层输出 h₁ = 3、h₂ = 1，比较两个权重前面乘的数。'
    },
    onCheck: function (result) {
      if (!result.ok || !$('autoUpdate').hidden) return;
      lockQuestion(impactQuestion);
      updateProgress('progressExplain');
      revealElement($('autoUpdate'));
      resetAutoDemo();
    }
  });

  lossDerivativeQuestion = window.DLModuleUI.mountQuestion('#lossDerivativeForm', {
    type: 'fill',
    title: '当前预测值 y < 真实值 GT，L1 Loss 对 y 的偏导是 {{blank}}',
    blanks: [{ label: 'L1 Loss 对 y 的偏导', chars: 5 }],
    validator: derivativeValidator(function () {
      var error = autoMetrics(state.initialV1, state.initialV2).error;
      return error < 0 ? -1 : error > 0 ? 1 : 0;
    }),
    onCheck: function (result) {
      if (!result.ok) return;
      lockQuestion(lossDerivativeQuestion);
      advanceGuidedQuestion('lossDerivativeForm', 'v1DerivativeForm', v1DerivativeQuestion);
    }
  });

  addDerivativeHint(lossDerivativeQuestion, '固定 GT。当前 y < GT；y 每增加 1，Loss 会怎样变化？');

  v1DerivativeQuestion = window.DLModuleUI.mountQuestion('#v1DerivativeForm', {
    type: 'fill',
    title: 'y 对 v₁ 的偏导是 {{blank}}',
    blanks: [{ label: 'y 对 v₁ 的偏导', chars: 5 }],
    validator: derivativeValidator(function () { return state.h1; }),
    onCheck: function (result) {
      if (!result.ok) return;
      lockQuestion(v1DerivativeQuestion);
      advanceGuidedQuestion('v1DerivativeForm', 'v2DerivativeForm', v2DerivativeQuestion);
    }
  });

  addDerivativeHint(v1DerivativeQuestion, '由 y = v₁×h₁ + v₂×h₂，只看 v₁ 前面的系数 h₁。');

  v2DerivativeQuestion = window.DLModuleUI.mountQuestion('#v2DerivativeForm', {
    type: 'fill',
    title: 'y 对 v₂ 的偏导是 {{blank}}',
    blanks: [{ label: 'y 对 v₂ 的偏导', chars: 5 }],
    validator: derivativeValidator(function () { return state.h2; }),
    onCheck: function (result) {
      if (!result.ok) return;
      lockQuestion(v2DerivativeQuestion);
      setHidden($('v2DerivativeForm'), true);
      completeGuidedUpdate();
    }
  });

  addDerivativeHint(v2DerivativeQuestion, '由 y = v₁×h₁ + v₂×h₂，只看 v₂ 前面的系数 h₂。');

  oscillationQuestion = window.DLModuleUI.mountQuestion('#oscillationQuestionMount', {
    type: 'short',
    title: '预测值在真实值两侧持续震荡，如何优化更新以提升稳定性？',
    rows: 4,
    answerLabel: '震荡现象的优化方法',
    submitText: '提交回答',
    validator: function () { return { ok: true, tone: 'hint', message: '正在分析你的回答...' }; },
    onCheck: function (result) {
      if (!result.empty) submitOscillationAnswer(result.answer[0].trim());
    }
  });

  $('stepRatio').addEventListener('input', function (event) {
    autoDemo.stepRatio = Number(event.target.value);
    window.DLModuleUI.updateRange(event.target, true);
    $('rateControl').classList.remove('is-attention');
    updateGuidedRulePreview();
  });

  $('tryLearningRateBtn').addEventListener('click', startLearningRatePractice);

  bindRange('v1Range', 'v1');
  bindRange('v2Range', 'v2');

  $('v1Range').value = String(state.v1);
  $('v2Range').value = String(state.v2);

  $('resetWeightsBtn').addEventListener('click', function () {
    state.v1 = state.initialV1;
    state.v2 = state.initialV2;
    $('v1Range').value = String(state.initialV1);
    $('v2Range').value = String(state.initialV2);
    render();
  });

  $('executeAutoUpdateBtn').addEventListener('click', executeAutoUpdate);

  $('fullTargetInput').addEventListener('input', updateFullTargetFromInput);

  $('trainFullNetworkBtn').addEventListener('click', trainFullNetworkOnce);

  window.DLModuleUI.bindInputHints($('gradientNextTeaser'));

  $('gradientScrollIndicator').addEventListener('click', confirmGradientScrollCue);
  window.addEventListener('wheel', function (event) {
    if (event.deltaY > 0) confirmGradientScrollCue();
  }, { passive: true });

  updateProgress('progressTune');
  renderGradientVideos();
  render();
})();

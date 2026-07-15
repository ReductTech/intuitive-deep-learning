(function () {
  'use strict';

  var canvas = document.getElementById('drawCanvas');
  var ctx = canvas.getContext('2d');
  var CLASSIFICATION_SCENARIO_ENDPOINT = 'http://127.0.0.1:59414/classification/scenario';
  var scenario = {
    subject: '网球',
    normalizedSubject: '网球',
    taskQuestion: '能不能判断一个人是否喜欢网球？',
    positiveLabel: '喜欢网球',
    negativeLabel: '不喜欢网球',
    xAxis: '接触频率',
    yAxis: '兴趣强度',
    boundaryNote: '下面这张图可以理解为一次关于网球兴趣的调研：横轴是接触频率，纵轴是兴趣强度。你画出的线，就是一个人工设计的判断规则。'
  };
  var levels = [
    { name: '第一关 · 网球兴趣调研', description: '第一关：每个点是一位学习者，位置由接触频率和兴趣强度决定。红点表示喜欢网球，蓝点表示不喜欢网球。', target: 0.85, type: 'easy' },
    { name: '第二关 · 噪声样本浮现', description: '第二关：刚才那批数据还在，但现在又出现了一些边界更模糊的样本。请在新的散点分布上重新画一次边界。', target: 0.80, type: 'woven' },
    { name: '第三关 · 非线性结构', description: '第三关：同一类评价出现在对角区域，单条简单边界已经很吃力。这正是 MLP 要处理的问题。', target: 0.75, type: 'xor' },
  ];
  var state = { level: 0, points: [], baseSurvey: [], path: [], drawing: false, scored: false, passed: false, score: NaN, flip: false, noiseAnimation: 0 };
  var introDone = false;
  var exampleSuggestions = [
    '网球', '游泳', '王者荣耀', '牛肉拉面', '露营', '摄影',
    '烘焙', '羽毛球', '科幻电影', '咖啡', '旅行', '吉他',
    '跑步', '宠物猫', '火锅', '登山', '动漫', '编程'
  ];
  var activeSuggestionIndex = 0;
  var suggestionTimer = null;

  function stopSuggestionRotation() {
    if (suggestionTimer == null) return;
    window.clearInterval(suggestionTimer);
    suggestionTimer = null;
  }

  function startSuggestionRotation() {
    var input = document.getElementById('exampleInput');
    if (!input) return;
    input.placeholder = exampleSuggestions[activeSuggestionIndex];
    suggestionTimer = window.setInterval(function () {
      activeSuggestionIndex = (activeSuggestionIndex + 1) % exampleSuggestions.length;
      input.placeholder = exampleSuggestions[activeSuggestionIndex];
    }, 1800);
    input.addEventListener('input', stopSuggestionRotation, { once: true });
  }

  function randn() {
    var u = 0;
    var v = 0;
    while (!u) u = Math.random();
    while (!v) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function revealChallenge() {
    var challenge = document.getElementById('challengeSection');
    if (!challenge || challenge.classList.contains('is-visible')) return;
    challenge.classList.add('is-visible');
    challenge.setAttribute('aria-hidden', 'false');
    resize();
    generatePoints();
    window.setTimeout(function () {
      challenge.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 180);
  }

  function typeParagraph(target, text, done) {
    var p = document.createElement('p');
    target.appendChild(p);
    var index = 0;
    function tick() {
      p.textContent = text.slice(0, index);
      index++;
      if (index <= text.length) {
        window.setTimeout(tick, 14 + Math.random() * 18);
        return;
      }
      if (done) window.setTimeout(done, 150);
    }
    tick();
  }

  function textValue(value, fallback) {
    var text = String(value == null ? '' : value).trim();
    return text || fallback;
  }

  function applyScenario(rawResult, subject) {
    var result = rawResult && typeof rawResult === 'object' ? rawResult : {};
    var featureX = result.feature_x || result.featureX || {};
    var featureY = result.feature_y || result.featureY || {};
    scenario = {
      subject: subject,
      normalizedSubject: textValue(result.normalized_subject || result.normalizedSubject, subject),
      taskQuestion: textValue(result.task_question || result.taskQuestion, '能不能判断样本是否属于正类？'),
      positiveLabel: textValue(result.positive_label || result.positiveLabel, '正类'),
      negativeLabel: textValue(result.negative_label || result.negativeLabel, '负类'),
      xAxis: textValue(featureX.axis_label || featureX.axisLabel || featureX.name, '特征 A'),
      yAxis: textValue(featureY.axis_label || featureY.axisLabel || featureY.name, '特征 B'),
      boundaryNote: textValue(result.boundary_note || result.boundaryNote, '')
    };

    levels[0].name = textValue(result.first_level_name || result.firstLevelName, '第一关 · ' + scenario.normalizedSubject + '分类调研');
    levels[0].description = textValue(
      result.first_level_description || result.firstLevelDescription,
      '第一关：每个点都是一个样本，位置由' + scenario.xAxis + '和' + scenario.yAxis + '决定。红点表示' + scenario.positiveLabel + '，蓝点表示' + scenario.negativeLabel + '。'
    );
    levels[1].description = textValue(
      result.second_level_description || result.secondLevelDescription,
      '第二关：刚才那批数据还在，但现在又出现了一些更接近真实情况的模糊样本。请在新的散点分布上重新画一次边界。'
    );
    levels[2].description = textValue(
      result.third_level_description || result.thirdLevelDescription,
      '第三关：同一类样本出现在对角区域，单条简单边界已经很吃力。这正是 MLP 要处理的问题。'
    );

    var boundaryNote = document.getElementById('boundaryNote');
    if (boundaryNote) {
      boundaryNote.querySelector('.edu-callout-text').textContent = scenario.boundaryNote ||
        '下面这张图可以理解为一次关于“' + scenario.normalizedSubject + '”的调研：横轴是' + scenario.xAxis + '，纵轴是' + scenario.yAxis + '。你画出的线，就是一个人工设计的判断规则。';
    }
    updateUi();

    var lines = Array.isArray(result.intro_lines || result.introLines)
      ? (result.intro_lines || result.introLines).map(function (line) { return String(line || '').trim(); }).filter(Boolean)
      : [];
    if (lines.length < 4) {
      lines = [
        '你写的是“' + subject + '”。我会围绕它生成一个二分类问题。',
        '现在问题变成：' + scenario.taskQuestion,
        '先取两个可量化特征：' + scenario.xAxis + '，以及' + scenario.yAxis + '。',
        '能画出一条边界分开两类点，就是分类模型要学习的事。'
      ];
    }
    return lines.slice(0, 4);
  }

  async function requestClassificationScenario(subject) {
    var response = await fetch(CLASSIFICATION_SCENARIO_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: subject })
    });
    var data = await response.json().catch(function () { return {}; });
    return window.DLModuleUI.requireServiceResult(response, data);
  }

  function playLines(output, thinking, lines) {
    thinking.classList.add('is-done');
    thinking.querySelector('span').textContent = '分析完成，正在整理结果';
    function next(lineIndex) {
      if (lineIndex >= lines.length) {
        thinking.querySelector('span').textContent = '第一张散点图已准备好';
        revealChallenge();
        return;
      }
      typeParagraph(output, lines[lineIndex], function () {
        next(lineIndex + 1);
      });
    }
    next(0);
  }

  async function runIntroStream(event) {
    event.preventDefault();
    if (introDone) {
      revealChallenge();
      return;
    }
    var input = document.getElementById('exampleInput');
    var button = document.getElementById('exampleSubmit');
    var panel = document.getElementById('streamPanel');
    var output = document.getElementById('streamOutput');
    var thinking = document.getElementById('thinkingLine');
    var example = input.value.trim() || input.placeholder;
    stopSuggestionRotation();
    introDone = true;
    button.disabled = true;
    button.classList.remove('edu-btn--primary');
    button.classList.add('is-loading');
    button.setAttribute('aria-busy', 'true');
    input.disabled = true;
    panel.classList.add('is-visible');
    output.textContent = '';
    thinking.classList.remove('is-done');
    thinking.querySelector('span').textContent = '正在把“' + example + '”转成分类问题';
    var statusTimer = window.setTimeout(function () {
      thinking.querySelector('span').textContent = '正在分析你的输入，请稍候';
    }, 520);

    try {
      var result = await requestClassificationScenario(example);
      window.clearTimeout(statusTimer);
      button.classList.remove('is-loading');
      button.classList.add('edu-btn--primary');
      button.removeAttribute('aria-busy');
      playLines(output, thinking, applyScenario(result, example));
    } catch (error) {
      window.clearTimeout(statusTimer);
      introDone = false;
      button.classList.remove('is-loading');
      button.classList.add('edu-btn--primary');
      button.removeAttribute('aria-busy');
      button.disabled = false;
      input.disabled = false;
      thinking.classList.add('is-done');
      thinking.querySelector('span').textContent = '本次分析未完成';
      typeParagraph(output, window.DLModuleUI.friendlyErrorMessage(error));
    }
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    canvas.logicalWidth = rect.width;
    canvas.logicalHeight = rect.height;
    canvas.ratio = ratio;
    draw();
  }

  function point(x, y, label) {
    return { x: x, y: y, label: label, wrong: false, alpha: 1, noise: false, revealDelay: 0 };
  }

  function clonePoint(sample) {
    var copied = point(sample.x, sample.y, sample.label);
    copied.alpha = sample.alpha == null ? 1 : sample.alpha;
    copied.noise = !!sample.noise;
    copied.revealDelay = sample.revealDelay || 0;
    return copied;
  }

  function createEasySurvey(width, height, marginX) {
    var samples = [];
    for (var i = 0; i < 70; i++) {
      var ex0 = Math.random() < 0.08;
      var ex1 = Math.random() < 0.08;
      var lowX = marginX + (width - marginX * 2) * (0.26 + randn() * 0.12);
      var highX = marginX + (width - marginX * 2) * (0.74 + randn() * 0.12);
      samples.push(point(
        ex0 ? highX : lowX,
        (ex0 ? height * 0.36 : height * 0.68) + randn() * height * 0.075,
        0
      ));
      samples.push(point(
        ex1 ? lowX : highX,
        (ex1 ? height * 0.66 : height * 0.32) + randn() * height * 0.075,
        1
      ));
    }
    return samples;
  }

  function addNoisySurveySamples(width, height, marginX) {
    var noise = [];
    for (var i = 0; i < 42; i++) {
      var label = i % 2;
      var x = marginX + Math.random() * (width - marginX * 2);
      var expectedY = label ? height * 0.78 - (x / width) * height * 0.48 : height * 0.42 + (x / width) * height * 0.32;
      var wave = Math.sin(x / width * Math.PI * 2.2 + (label ? 0.7 : 0)) * height * 0.045;
      var y = expectedY + wave + randn() * height * 0.105;
      if (Math.random() < 0.28) y = height * 0.5 + randn() * height * 0.13;
      var sample = point(x, y, label);
      sample.alpha = 0;
      sample.noise = true;
      sample.revealDelay = i * 35 + Math.random() * 160;
      noise.push(sample);
    }
    state.points = state.points.concat(noise);
    animateNoisePoints(performance.now());
  }

  function animateNoisePoints(startTime) {
    if (state.noiseAnimation) cancelAnimationFrame(state.noiseAnimation);
    function frame(now) {
      var active = false;
      state.points.forEach(function (sample) {
        if (!sample.noise || sample.alpha >= 1) return;
        var progress = (now - startTime - sample.revealDelay) / 520;
        sample.alpha = Math.max(0, Math.min(1, progress));
        if (sample.alpha < 1) active = true;
      });
      draw();
      if (active) state.noiseAnimation = requestAnimationFrame(frame);
      else state.noiseAnimation = 0;
    }
    state.noiseAnimation = requestAnimationFrame(frame);
  }

  function generatePoints() {
    if (state.noiseAnimation) {
      cancelAnimationFrame(state.noiseAnimation);
      state.noiseAnimation = 0;
    }
    state.points = [];
    state.path = [];
    state.scored = false;
    state.passed = false;
    state.score = NaN;
    var width = canvas.logicalWidth || 800;
    var height = canvas.logicalHeight || 460;
    var marginX = width * 0.12;
    var marginY = height * 0.12;
    var i;
    if (levels[state.level].type === 'easy') {
      state.points = createEasySurvey(width, height, marginX);
      state.baseSurvey = state.points.map(clonePoint);
    } else if (levels[state.level].type === 'woven') {
      if (!state.baseSurvey.length) state.baseSurvey = createEasySurvey(width, height, marginX);
      state.points = state.baseSurvey.map(clonePoint);
      addNoisySurveySamples(width, height, marginX);
    } else {
      var centers = [
        [width * 0.32, height * 0.32, 0],
        [width * 0.68, height * 0.68, 0],
        [width * 0.68, height * 0.32, 1],
        [width * 0.32, height * 0.68, 1],
      ];
      centers.forEach(function (center) {
        for (i = 0; i < 38; i++) {
          state.points.push(point(
            center[0] + randn() * width * 0.085,
            center[1] + randn() * height * 0.085,
            center[2]
          ));
        }
      });
    }
    state.points.forEach(function (p) {
      p.x = Math.max(marginX, Math.min(width - marginX, p.x));
      p.y = Math.max(marginY, Math.min(height - marginY, p.y));
    });
    updateUi();
    draw();
  }

  function eventPoint(event) {
    var rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function boundarySide(target) {
    var bestDistance = Infinity;
    var bestSide = 0;
    for (var i = 1; i < state.path.length; i++) {
      var a = state.path[i - 1];
      var b = state.path[i];
      var dx = b.x - a.x;
      var dy = b.y - a.y;
      var lengthSquared = dx * dx + dy * dy || 1;
      var t = Math.max(0, Math.min(1, ((target.x - a.x) * dx + (target.y - a.y) * dy) / lengthSquared));
      var nearestX = a.x + dx * t;
      var nearestY = a.y + dy * t;
      var distance = Math.hypot(target.x - nearestX, target.y - nearestY);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestSide = dx * (target.y - a.y) - dy * (target.x - a.x);
      }
    }
    return bestSide >= 0 ? 1 : 0;
  }

  function scoreBoundary() {
    var width = canvas.logicalWidth || 800;
    var height = canvas.logicalHeight || 460;
    var xs = state.path.map(function (p) { return p.x; });
    var ys = state.path.map(function (p) { return p.y; });
    var spansHorizontal = Math.min.apply(null, xs) < width * 0.18 && Math.max.apply(null, xs) > width * 0.82;
    var spansVertical = Math.min.apply(null, ys) < height * 0.18 && Math.max.apply(null, ys) > height * 0.82;
    if (state.path.length < 8 || (!spansHorizontal && !spansVertical)) {
      var invalidFeedback = document.getElementById('scoreFeedback');
      invalidFeedback.classList.remove('edu-callout--orange', 'edu-callout--green');
      invalidFeedback.classList.add('edu-callout--red');
      document.getElementById('scoreMessageLabel').textContent = '未达标提示';
      document.getElementById('scoreMessage').textContent = '边界需要横跨画布：可以从左画到右，也可以从上画到下。';
      state.path = [];
      draw();
      return;
    }
    var correctNormal = 0;
    state.points.forEach(function (p) {
      var predicted = boundarySide(p);
      if (predicted === p.label) correctNormal++;
    });
    var flip = correctNormal < state.points.length / 2;
    state.flip = flip;
    var correct = 0;
    state.points.forEach(function (p) {
      var predicted = boundarySide(p);
      if (flip) predicted = 1 - predicted;
      p.wrong = predicted !== p.label;
      if (!p.wrong) correct++;
    });
    state.score = correct / state.points.length;
    state.scored = true;
    state.passed = state.score >= levels[state.level].target;
    updateUi();
    draw();
    if (state.passed) window.setTimeout(advance, 1150);
  }

  function advance() {
    if (!state.passed) return;
    if (state.level < levels.length - 1) {
      state.level++;
      generatePoints();
      return;
    }
    var transition = document.getElementById('mlpTransition');
    transition.hidden = false;
    transition.setAttribute('aria-hidden', 'false');
    transition.classList.add('is-revealing');
    transition.addEventListener('animationend', function () {
      transition.classList.remove('is-revealing');
    }, { once: true });
    transition.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function updateUi() {
    var level = levels[state.level];
    document.getElementById('levelName').textContent = level.name;
    document.getElementById('levelDescription').textContent = level.description;
    document.getElementById('targetValue').textContent = Math.round(level.target * 100) + '%';
    document.getElementById('scoreValue').textContent = Number.isFinite(state.score) ? Math.round(state.score * 100) + '%' : '--';
    document.getElementById('scoreRing').style.setProperty('--score', Number.isFinite(state.score) ? state.score * 360 + 'deg' : '0deg');
    document.getElementById('scoreRing').classList.toggle('is-pass', state.passed);
    document.getElementById('canvasPrompt').classList.toggle('is-hidden', state.path.length > 0);
    var idleMessage = state.level === 1
      ? '新增的噪声样本已经浮现。请不要沿用刚才的线，在新的分布上重新画一次。'
      : '观察“' + scenario.negativeLabel + '”和“' + scenario.positiveLabel + '”两类样本，画一条边界把它们分开。';
    var passMessage = state.level === 0
      ? '通过！现在加入一些更接近真实调研的噪声样本。'
      : (state.level === 2 ? '通过！你已经亲手完成三种难度的分类边界。' : '通过！下一种分布即将出现。');
    var feedbackTone = state.passed ? 'green' : (state.scored ? 'red' : 'orange');
    var scoreFeedback = document.getElementById('scoreFeedback');
    scoreFeedback.classList.remove('edu-callout--orange', 'edu-callout--green', 'edu-callout--red');
    scoreFeedback.classList.add('edu-callout--' + feedbackTone);
    document.getElementById('scoreMessageLabel').textContent = state.passed
      ? '达标提示'
      : (state.scored ? '未达标提示' : '操作提示');
    document.getElementById('scoreMessage').textContent = state.passed
      ? passMessage
      : (state.scored ? '还差一点。观察带橙色外圈的错分点，再画一次。' : idleMessage);
    document.querySelectorAll('[data-level-dot]').forEach(function (dot, index) {
      dot.classList.toggle('is-active', index === state.level);
      dot.classList.toggle('is-done', index < state.level || (index === state.level && state.passed));
    });
  }

  function draw() {
    var ratio = canvas.ratio || 1;
    var width = canvas.logicalWidth || canvas.width;
    var height = canvas.logicalHeight || canvas.height;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#fbfdff';
    ctx.fillRect(0, 0, width, height);
    if (state.scored && state.path.length > 1) drawPredictionRegions(width, height);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (var x = 40; x < width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (var y = 40; y < height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
    drawAxisLabels(width, height);

    if (state.path.length > 1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = 9;
      strokePath();
      ctx.strokeStyle = state.passed ? '#228d5c' : '#f07e47';
      ctx.lineWidth = 5;
      strokePath();
    }
    state.points.forEach(function (p) {
      ctx.save();
      ctx.globalAlpha = p.alpha == null ? 1 : p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.wrong ? 8.5 : 6.5, 0, Math.PI * 2);
      ctx.fillStyle = p.label ? '#c43f52' : '#27446e';
      ctx.fill();
      ctx.lineWidth = p.wrong ? 3.5 : 2;
      ctx.strokeStyle = p.wrong ? '#f07e47' : (p.noise ? 'rgba(255,255,255,0.72)' : '#fff');
      ctx.stroke();
      ctx.restore();
    });
    drawLegend(width);
  }

  function drawAxisLabels(width, height) {
    ctx.save();
    ctx.fillStyle = 'rgba(39,68,110,0.72)';
    ctx.font = '800 12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('横轴：' + scenario.xAxis + ' ↑', width - 14, height - 10);
    ctx.translate(14, 18);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'right';
    ctx.fillText('纵轴：' + scenario.yAxis + ' ↑', 0, 0);
    ctx.restore();
  }

  function drawLegend(width) {
    var maxText = Math.max(scenario.negativeLabel.length, scenario.positiveLabel.length);
    var boxWidth = Math.min(width - 28, Math.max(210, maxText * 14 + 58));
    var x = 14;
    var y = 12;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.strokeStyle = 'rgba(159,176,200,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, boxWidth, 62, 8);
    else ctx.rect(x, y, boxWidth, 62);
    ctx.fill();
    ctx.stroke();
    ctx.font = '800 12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#27446e';
    ctx.beginPath();
    ctx.arc(x + 18, y + 21, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(scenario.negativeLabel, x + 30, y + 21);
    ctx.fillStyle = '#c43f52';
    ctx.beginPath();
    ctx.arc(x + 18, y + 43, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(scenario.positiveLabel, x + 30, y + 43);
    ctx.restore();
  }

  function drawPredictionRegions(width, height) {
    var cell = 16;
    for (var y = 0; y < height; y += cell) {
      for (var x = 0; x < width; x += cell) {
        var side = boundarySide({ x: x + cell / 2, y: y + cell / 2 });
        if (state.flip) side = 1 - side;
        ctx.fillStyle = side ? 'rgba(196,63,82,0.09)' : 'rgba(39,68,110,0.09)';
        ctx.fillRect(x, y, cell + 1, cell + 1);
      }
    }
  }

  function strokePath() {
    ctx.beginPath();
    state.path.forEach(function (p, index) {
      if (!index) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
  }

  canvas.addEventListener('pointerdown', function (event) {
    state.drawing = true;
    state.path = [eventPoint(event)];
    state.scored = false;
    state.passed = false;
    state.points.forEach(function (p) { p.wrong = false; });
    canvas.setPointerCapture(event.pointerId);
    updateUi();
    draw();
  });
  canvas.addEventListener('pointermove', function (event) {
    if (!state.drawing) return;
    var p = eventPoint(event);
    var last = state.path[state.path.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) > 3) state.path.push(p);
    draw();
  });
  canvas.addEventListener('pointerup', function () {
    if (!state.drawing) return;
    state.drawing = false;
    scoreBoundary();
  });
  document.getElementById('clearBoundaryBtn').addEventListener('click', function () {
    state.path = [];
    state.scored = false;
    state.passed = false;
    state.score = NaN;
    state.points.forEach(function (p) { p.wrong = false; });
    updateUi();
    draw();
  });
  document.getElementById('newPointsBtn').addEventListener('click', generatePoints);
  document.getElementById('exampleForm').addEventListener('submit', runIntroStream);
  startSuggestionRotation();
  document.getElementById('openMlpBtn').addEventListener('click', function () {
    var content = document.getElementById('mlpContent');
    content.classList.add('is-visible');
    content.setAttribute('aria-hidden', 'false');
    content.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.requestAnimationFrame(function () {
      window.dispatchEvent(new Event('resize'));
    });
  });
  window.addEventListener('resize', resize);
  resize();
  generatePoints();
})();

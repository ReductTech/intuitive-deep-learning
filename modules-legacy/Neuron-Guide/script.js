(function () {
  'use strict';

  var DECISION_INTAKE_ENDPOINT = 'http://127.0.0.1:59414/decision/intake';
  var EXTRA_FACTORS_ENDPOINT = 'http://127.0.0.1:59414/decision/extra-factors';
  var form = document.querySelector('#decisionForm');
  var input = document.querySelector('#decisionInput');
  var decisionStream = document.querySelector('.ng-decision-stream');
  var analyzeButton = document.querySelector('#analyzeButton');
  var analyzeButtonText = analyzeButton.querySelector('span');
  var analysis = document.querySelector('#analysisScene');
  var currentDecisionCallout = document.querySelector('#currentDecisionCallout');
  var decisionText = document.querySelector('#decisionText');
  var aiStatus = document.querySelector('#aiStatus');
  var aiStatusLabel = document.querySelector('#aiStatusLabel');
  var aiStatusText = document.querySelector('#aiStatusText');
  var factorStack = document.querySelector('#factorStack');
  var theoryPanel = document.querySelector('#theoryPanel');
  var completionScene = document.querySelector('#completionScene');
  var resourceScene = document.querySelector('#resourceScene');
  var modelViewerMount = document.querySelector('#modelViewerMount');
  var relatedVideosMount = document.querySelector('#relatedVideosMount');
  var progressItems = Array.from(document.querySelectorAll('.edu-progress-item'));
  var DEFAULT_DECISION_PLACEHOLDER = '选择一件正在犹豫的事';
  var rangeFlowArmed = false;
  var completionFlowArmed = false;
  var rangeFlowIndicator = null;
  var completionFlowIndicator = null;
  var analysisRequestSerial = 0;

var decisionChoices = [
  [
    '读研', '换工作', '开始健身', '搬去新城市', '学习新技能', '尝试创业',
    '考公务员', '考编', '申请留学', 'Gap 一年', '辞职休息', '开始自由职业',
    '转行', '做副业', '远程办公', '学习 AI', '学习编程', '学习设计',
    '学习摄影', '学习外语', '考一个证书', '读 MBA', '参加训练营',
    '坚持阅读', '每天写作', '开始做自媒体', '成为博主', '开发一个 App',
    '做一个独立产品', '参加黑客松'
  ],
  [
    '接下这个 offer', '选这门课', '回复这条消息', '今天出门', '主动表白', '结束一段关系',
    '给 TA 打电话', '约朋友见面', '主动道歉', '拒绝这次邀请', '接受这次合作',
    '提出加薪', '申请晋升', '找领导沟通', '参加这场面试', '加入这个团队',
    '退出这个项目', '发那条朋友圈', '发那封邮件', '开始聊天', '约 TA 吃饭',
    '答应聚会', '取消计划', '大胆表达想法', '主动认识新朋友', '联系老朋友',
    '接受邀请', '说出真心话', '继续坚持', '放弃这件事'
  ],
  [
    '养一只宠物', '独自旅行', '买一台新电脑', '报名考证', '开始存钱', '开始投资',
    '买基金', '买股票', '买黄金', '买一辆车', '买相机', '换手机',
    '换平板', '装修房间', '搬出去住', '租房', '买房', '剪短头发',
    '染头发', '尝试新穿搭', '学习做饭', '学乐器', '学画画', '学游泳',
    '开始跑步', '练瑜伽', '每天早起', '戒熬夜', '戒奶茶', '少刷短视频'
  ],
  [
    '去旅行', '去露营', '去看海', '去爬山', '去徒步', '去看演唱会',
    '去音乐节', '去电影院', '去迪士尼', '体验潜水', '体验滑雪', '体验蹦极',
    '坐热气球', '报名马拉松', '参加比赛', '参加志愿活动', '去咖啡馆办公',
    '换一家餐厅', '尝试新菜', '去图书馆学习', '去博物馆', '去美术馆',
    '周末宅家', '来一场 City Walk', '来一次说走就走的旅行', '拍一组照片',
    '写一篇游记', '尝试露营', '去泡温泉', '看日出'
  ],
  [
    '相信直觉', '听朋友建议', '听家人建议', '自己做决定', '随机决定', '大胆一点',
    '稳一点', '现在就开始', '明天再决定', '坚持到底', '及时止损', '放慢节奏',
    '重新开始', '放下过去', '接受改变', '勇敢尝试', '保持现状', '挑战自己',
    '奖励自己', '休息一天', '开启新计划', '制定目标', '整理人生', '开始记账',
    '坚持 30 天', '每天进步一点', '不再拖延', '勇敢说不', '相信未来', '给自己一次机会'
  ]
];

  function createChoiceGroup(choices, rowIndex, duplicate) {
    var group = document.createElement('div');
    group.className = 'ng-choice-group';
    if (duplicate) group.setAttribute('aria-hidden', 'true');
    choices.forEach(function (choice, choiceIndex) {
      var chip = document.createElement('button');
      chip.className = 'ng-choice-chip';
      chip.type = 'button';
      chip.dataset.decision = choice;
      chip.dataset.tone = String((rowIndex + choiceIndex) % 4);
      chip.setAttribute('aria-pressed', 'false');
      chip.textContent = choice;
      if (duplicate) chip.tabIndex = -1;
      group.appendChild(chip);
    });
    return group;
  }

  function renderDecisionChoices() {
    decisionChoices.forEach(function (choices, rowIndex) {
      var row = document.createElement('div');
      var track = document.createElement('div');
      row.className = 'ng-marquee-row ' + (rowIndex % 2 === 0 ? 'ng-marquee-row--right' : 'ng-marquee-row--left');
      track.className = 'ng-marquee-track';
      track.style.animationDuration = Math.round(Math.max(90, choices.length * 3.2) + rowIndex * 4) + 's';
      track.appendChild(createChoiceGroup(choices, rowIndex, false));
      track.appendChild(createChoiceGroup(choices, rowIndex, true));
      row.appendChild(track);
      decisionStream.appendChild(row);
    });
  }

  renderDecisionChoices();

  var state = {
    decision: '',
    positiveLabel: '',
    negativeLabel: '',
    factors: [],
    factor: null,
    importance: 5,
    value: null,
    touchedImportance: false,
    touchedValue: false,
    multiValues: {},
    multiTouched: {},
    rangeQuestionCompleted: false,
    multiQuestionAnswered: false,
    biasLessonStep: 0,
    moreFactorsRevealed: false,
    extraFactorsStatus: 'idle',
    extraFactorsError: '',
    extraFactorsPayload: null,
    completed: false
  };

  var recommendedVideos = [
    {
      title: '什么是神经元，它们是如何工作的？',
      embed: '<iframe title="什么是神经元，它们是如何工作的？" src="//player.bilibili.com/player.html?isOutside=true&aid=480613389&bvid=BV1FT41127Qg&cid=972217281&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
    },
    {
      title: '【数学】神经网络：从一个神经元到万能逼近',
      embed: '<iframe title="神经网络：从一个神经元到万能逼近" src="//player.bilibili.com/player.html?isOutside=true&aid=116418058131506&bvid=BV1BPdqB6E9H&cid=37571920704&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
    }
  ];

  function escapeText(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeDecision(value) {
    var target = String(value || '').trim().replace(/[？?。.\s]+$/g, '');
    target = target.replace(/^(是否要|要不要|该不该|能不能|可不可以)/, '').trim();
    return '是否要' + (target || '读研');
  }

  function clamp(min, max, value) {
    var number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.max(min, Math.min(max, number));
  }

  function asSliderValue(value) {
    var normalized = Number(value);
    if (!Number.isFinite(normalized)) return 5;
    return clamp(0, 10, Math.round(clamp(0, 1, normalized) * 10));
  }

  function sliderTo01(value) {
    return clamp(0, 10, value) / 10;
  }

  function scrollToScene(scene) {
    window.requestAnimationFrame(function () {
      scene.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function updateProgress(step) {
    var order = ['decision', 'signal', 'model', 'complete'];
    var current = Math.max(0, order.indexOf(step));
    progressItems.forEach(function (item) {
      var index = order.indexOf(item.dataset.step);
      item.classList.toggle('is-done', index < current);
      item.classList.toggle('is-current', index === current);
      if (index === current) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
  }

  function setStatus(tone, label, text, options) {
    options = options || {};
    aiStatus.hidden = false;
    aiStatus.className = 'edu-callout edu-callout--' + tone + (options.stream ? ' edu-callout--stream' : '') + ' ng-opening-status';
    aiStatusLabel.textContent = label;
    aiStatusText.textContent = text;

    if (options.labelKey) aiStatusLabel.setAttribute('data-i18n', options.labelKey);
    else aiStatusLabel.setAttribute('data-i18n-ignore', 'true');
    if (options.textKey) {
      aiStatusText.setAttribute('data-i18n', options.textKey);
      aiStatusText.removeAttribute('data-i18n-ignore');
    } else {
      aiStatusText.removeAttribute('data-i18n');
      aiStatusText.setAttribute('data-i18n-ignore', 'true');
    }

    if (options.stream) {
      window.DLModuleUI.streamText(aiStatusText, text, { interval: 24 });
    }
  }

  function normalizeFactor(cause, index) {
    if (!cause || typeof cause !== 'object') return null;
    var name = String(cause.name || '').trim();
    if (!name) return null;
    return {
      id: 'factor-' + index,
      index: index,
      name: name,
      valueTransform: (cause.value_transform || cause.valueTransform) === 'inverse' ? 'inverse' : 'direct',
      valueName: String(cause.value_label || cause.valueLabel || name).trim() || name,
      valueQuestion: String(cause.value_question || cause.valueQuestion || '').trim(),
      explanation: String(cause.explanation || '').trim(),
      suggestedImportance: asSliderValue(
        cause.suggested_importance == null ? cause.importance : cause.suggested_importance
      )
    };
  }

  async function requestDecisionIntake(decision) {
    var response = await fetch(DECISION_INTAKE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: decision })
    });
    var data = await response.json().catch(function () { return {}; });
    return window.DLModuleUI.requireServiceResult(response, data);
  }

  async function requestExtraFactors(payload) {
    var response = await fetch(EXTRA_FACTORS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    var data = await response.json().catch(function () { return {}; });
    return window.DLModuleUI.requireServiceResult(response, data);
  }

  function startExtraFactorsRequest(payload, requestSerial) {
    state.extraFactorsStatus = 'loading';
    state.extraFactorsError = '';
    state.extraFactorsPayload = payload;
    if (state.rangeQuestionCompleted) renderTheory();

    requestExtraFactors(payload).then(function (result) {
      if (requestSerial !== analysisRequestSerial) return;
      var extras = (Array.isArray(result.factors) ? result.factors : [])
        .map(function (factor, index) { return normalizeFactor(factor, index + 1); })
        .filter(Boolean)
        .slice(0, 2);
      if (extras.length !== 2) {
        throw window.DLModuleUI.createUserFacingError('没有生成两个可用的补充信号。');
      }
      state.factors = [state.factor].concat(extras);
      state.extraFactorsStatus = 'ready';
      state.extraFactorsError = '';
      if (state.rangeQuestionCompleted) renderTheory();
    }).catch(function (error) {
      if (requestSerial !== analysisRequestSerial) return;
      state.extraFactorsStatus = 'error';
      state.extraFactorsError = window.DLModuleUI.friendlyErrorMessage(error);
      if (state.rangeQuestionCompleted) renderTheory();
      console.error(error);
    });
  }

  function targetLabel() {
    return state.positiveLabel || state.decision.replace(/^(是否要|要不要)/, '').replace(/[？?。.\s]+$/g, '') || state.decision;
  }

  function valueQuestion(factor) {
    return factor.valueQuestion || '你的「' + factor.valueName + '」现在有多强？';
  }

  function factorValue(factor) {
    if (factor.index === 0) {
      return { importance: state.importance, value: state.value };
    }
    return state.multiValues[factor.id] || { importance: factor.suggestedImportance, value: null };
  }

  function effectiveInput01(factor, value) {
    var raw = sliderTo01(value);
    return factor.valueTransform === 'inverse' ? 1 - raw : raw;
  }

  function effectiveWeight01(value) {
    return sliderTo01(value);
  }

  function factorContribution(factor) {
    var values = factorValue(factor);
    return effectiveWeight01(values.importance) * effectiveInput01(factor, values.value);
  }

  function renderSegmentScale() {
    return '<span class="edu-range-scale ng-segment-scale" aria-hidden="true">'
      + Array.from({ length: 11 }, function (_, index) { return '<span>' + index + '</span>'; }).join('')
      + '</span>';
  }

  function renderRange(kind, question, value, factorId, touched) {
    var id = 'range-' + factorId + '-' + kind;
    var safeValue = value == null ? 5 : clamp(0, 10, value);
    return [
      '<label class="edu-control ng-range-group' + (touched ? '' : ' is-unset') + '" for="' + id + '">',
      '  <span class="edu-control-head ng-range-head">',
      '    <span class="edu-label" data-i18n-ignore="true">' + escapeText(question) + '</span>',
      '    <output class="edu-control-value ng-range-value" for="' + id + '" data-range-output data-i18n-ignore="true">' + (touched ? safeValue + ' / 10' : '') + '</output>',
      '  </span>',
      '  <input class="edu-range' + (touched ? '' : ' is-unset') + '" id="' + id + '" type="range" min="0" max="10" step="1" value="' + safeValue + '" data-kind="' + kind + '" data-factor-id="' + factorId + '"' + (touched ? '' : ' aria-valuetext="尚未输入"') + '>',
      renderSegmentScale(),
      '</label>'
    ].join('');
  }

  function renderFactorCard(factor, includeBothRanges) {
    var values = factorValue(factor);
    var isPrimary = factor.index === 0 && !includeBothRanges;
    var touched = factor.index === 0
      ? { value: state.touchedValue }
      : (state.multiTouched[factor.id] || { value: false });
    var modelImportance = [
      '<div class="ng-model-importance">',
      '  <div class="ng-model-importance-copy">',
      '    <span class="ng-model-importance-kicker">分析建议的重要性</span>',
      '    <p>' + (factor.explanation ? escapeText(factor.explanation) + ' ' : '') + '根据这个决定的上下文，建议的重要程度为 <strong>' + values.importance + ' 分</strong>（满分 10 分）。</p>',
      '  </div>',
      '  <div class="edu-control ng-model-range" aria-label="建议的重要程度为 ' + values.importance + ' 分，此滑杆不可调整">',
      '    <div class="ng-model-range-head"><span>AI 建议权重 w <small class="ng-readonly-note">已设定 · 不可调整</small></span><output><strong>' + values.importance + '</strong> / 10</output></div>',
      '    <input class="edu-range ng-readonly-range" type="range" min="0" max="10" step="1" value="' + values.importance + '" style="--ng-weight-percent: ' + (values.importance * 10) + '%" tabindex="-1" aria-disabled="true" disabled>',
      renderSegmentScale(),
      '  </div>',
      isPrimary && !state.touchedImportance ? '  <button class="edu-btn edu-btn--primary ng-accept-importance" type="button" data-accept-importance>好的</button>' : '',
      '</div>'
    ].join('');
    return [
      '<article class="edu-card ng-factor-card">',
      '  <div class="ng-factor-heading">',
      '    <div class="ng-factor-heading-copy">',
      '      <h3 class="edu-panel-title" data-i18n-ignore="true">' + escapeText(factor.name) + '</h3>',
      '    </div>',
      '    <span class="edu-badge ng-factor-index" data-i18n-ignore="true">' + String(factor.index + 1).padStart(2, '0') + '</span>',
      '  </div>',
      modelImportance,
      (isPrimary && state.touchedImportance) || includeBothRanges ? renderRange('value', valueQuestion(factor), values.value, factor.id, touched.value) : '',
      '</article>'
    ].join('');
  }

  function renderPrimaryFactor() {
    factorStack.innerHTML = renderFactorCard(state.factor, false);
  }

  function singleScores() {
    var rawInput = state.value;
    var rawWeight = state.importance;
    var normalizedInput = sliderTo01(rawInput);
    var inputScore = effectiveInput01(state.factor, rawInput);
    var weightScore = effectiveWeight01(rawWeight);
    return {
      rawInput: rawInput,
      rawWeight: rawWeight,
      normalizedInput: normalizedInput,
      inverse: state.factor.valueTransform === 'inverse',
      input: inputScore,
      weight: weightScore,
      output: inputScore * weightScore
    };
  }

  function renderFormula(scores) {
    var rawNormalizedText = Number(scores.normalizedInput.toFixed(2)).toString();
    var inputExpression = scores.inverse ? '1 - ' + rawNormalizedText : scores.input.toFixed(2);
    var weightExpression = scores.weight.toFixed(2);
    var substitutionInput = scores.inverse ? '(' + inputExpression + ')' : inputExpression;
    var substitutionWeight = weightExpression;
    var factorName = escapeText(state.factor && state.factor.name ? state.factor.name : '当前因素');
    var instruction = scores.inverse
      ? '我们把“' + factorName + '”的重要性作为权重 w = ' + weightExpression + '；由于这个因素需要反向理解，只把你的回答转换为输入 x = ' + inputExpression + '，再代入公式。'
      : '我们把“' + factorName + '”的重要性作为权重 w = ' + scores.weight.toFixed(2) + '，把你的回答作为输入 x = ' + inputExpression + '，再代入公式。';
    var inputTooltip = scores.inverse
      ? '原始输入：' + scores.rawInput + ' ÷ 10 = ' + scores.normalizedInput.toFixed(2) + '；反向转换：x = 1 - ' + scores.normalizedInput.toFixed(2) + ' = ' + scores.input.toFixed(2)
      : '输入归一化：x = ' + scores.rawInput + ' ÷ 10 = ' + scores.input.toFixed(2);
    var weightTooltip = '权重归一化：w = ' + scores.rawWeight + ' ÷ 10 = ' + scores.weight.toFixed(2);
    var outputTooltip = '输出计算：y = ' + scores.input.toFixed(2) + ' × ' + scores.weight.toFixed(2) + ' = ' + scores.output.toFixed(2);
    return [
      '<div class="edu-formula-block ng-formula-wrap">',
      '  <div class="edu-formula ng-formula-equation" aria-label="输出 y 等于输入 x 乘以权重 w">',
      '    <span class="ng-formula-symbols">',
      '      <span class="edu-formula-term" tabindex="0" data-tooltip="输入经过权重后留下的影响" aria-label="输出">y</span>',
      '      <span> = </span>',
      '      <span class="edu-formula-term" tabindex="0" data-tooltip="归一化后的输入信号" aria-label="输入">x</span>',
      '      <span> × </span>',
      '      <span class="edu-formula-term" tabindex="0" data-tooltip="归一化后的重要性" aria-label="权重">w</span>',
      '    </span>',
      '    <span class="ng-formula-instruction">' + instruction + '</span>',
      '    <span class="ng-formula-substitution">',
      '      <span class="edu-formula-term" tabindex="0" data-tooltip="输出 y：输入与权重相乘后的结果" aria-label="输出 y">y</span>',
      '      <span> = </span>',
      '      <span class="edu-formula-term" tabindex="0" data-tooltip="' + inputTooltip + '" aria-label="输入 ' + inputExpression + '">' + substitutionInput + '</span>',
      '      <span> × </span>',
      '      <span class="edu-formula-term" tabindex="0" data-tooltip="' + weightTooltip + '" aria-label="权重 ' + weightExpression + '">' + substitutionWeight + '</span>',
      '      <span> = </span>',
      '      <strong class="edu-formula-term ng-formula-result" tabindex="0" data-tooltip="' + outputTooltip + '" aria-label="输出结果 ' + scores.output.toFixed(2) + '">' + scores.output.toFixed(2) + '</strong>',
      '    </span>',
      '  </div>',
      '</div>'
    ].join('');
  }

  function renderNetwork(factors, outputValue, markerId) {
    var singleFactor = factors.length === 1;
    var networkFactors = factors.map(function (factor) {
      var values = factorValue(factor);
      var inputValue = effectiveInput01(factor, values.value);
      var weightValue = effectiveWeight01(values.importance);
      return {
        factor: factor,
        input: inputValue,
        inputLabel: inputValue.toFixed(2),
        weight: weightValue,
        weightLabel: weightValue.toFixed(2),
        contributionLabel: (inputValue * weightValue).toFixed(2)
      };
    });
    var symbolicFormula = 'y = ' + networkFactors.map(function (_, index) {
      return 'x' + (index + 1) + ' × w' + (index + 1);
    }).join(' + ');
    var substitutedFormula = '= ' + networkFactors.map(function (item) {
      return item.inputLabel + ' × ' + item.weightLabel;
    }).join(' + ');
    var contributionFormula = networkFactors.length > 1
      ? '= ' + networkFactors.map(function (item) { return item.contributionLabel; }).join(' + ')
      : '';
    return '<div class="ng-network-wrap' + (singleFactor ? ' ng-network-wrap--single' : '') + '">' + window.DLModuleUI.renderNetworkGraph({
      markerId: markerId,
      externalLabels: true,
      externalLabelPosition: singleFactor ? 'top' : 'side',
      viewBoxTop: singleFactor ? 34 : 14,
      viewBoxHeight: singleFactor ? 162 : 214,
      compactNodes: true,
      factors: networkFactors.map(function (item) {
        var factor = item.factor;
        return {
          label: factor.valueName,
          value: item.inputLabel,
          weight: item.weight,
          weightLabel: item.weightLabel,
          tooltip: '输入 ' + factor.valueName + '，进入神经元的数值为 ' + item.inputLabel,
          tooltipTitle: factor.valueName,
          tooltipValue: item.inputLabel,
          tooltipValueLabel: '进入神经元的数值',
          tooltipDetail: '这是当前输入经过方向转换后，真正进入加权求和的信号强度。'
        };
      }),
      unitTitle: '神经元',
      unitLabel: '加权求和',
      unitTooltip: '神经元按照 y = Σ(xi × wi) 对当前输入执行加权求和。',
      unitTooltipKicker: '计算过程',
      unitTooltipTitle: '神经元 · 加权求和',
      unitTooltipValue: outputValue.toFixed(2),
      unitTooltipFormula: symbolicFormula,
      unitTooltipSubstitution: substitutedFormula,
      unitTooltipCalculation: contributionFormula,
      unitTooltipDetail: '每个输入先乘以自己的权重，再把所有乘积相加，得到输出 y。',
      outputTitle: '输出',
      outputLabel: '判断分数',
      outputValue: outputValue.toFixed(2),
      outputTooltip: '输出 y，加权求和后的判断分数为 ' + outputValue.toFixed(2),
      outputTooltipTitle: '加权求和结果',
      outputTooltipValue: outputValue.toFixed(2),
      outputTooltipValueLabel: '当前输出 y',
      outputTooltipDetail: '所有输入分别乘以权重后相加，得到当前神经元的输出。',
      ariaLabel: '输入信号经过各自权重进入神经元，再产生一个判断输出'
    }) + '</div>';
  }

  function visibleFactors() {
    return state.factors.slice(0, 3);
  }

  function extraFactorsCompleted() {
    var extras = visibleFactors().slice(1);
    return extras.length > 0 && extras.every(function (factor) {
      var touched = state.multiTouched[factor.id];
      return touched && touched.value;
    });
  }

  function multiOutputScore() {
    var factors = visibleFactors();
    if (!factors.length) return 0;
    return factors.reduce(function (sum, factor) {
      return sum + factorContribution(factor);
    }, 0);
  }

  function decisionTendency(score, threshold) {
    var activeThreshold = threshold == null ? 0.5 : threshold;
    if (score > activeThreshold) {
      return {
        text: '您的选择更倾向于“' + (state.positiveLabel || targetLabel()) + '”',
        tone: 'positive'
      };
    }
    if (score < activeThreshold) {
      return {
        text: '您的选择更倾向于“' + (state.negativeLabel || ('不' + targetLabel())) + '”',
        tone: 'negative'
      };
    }
    return { text: '您的选择暂时没有明显偏向', tone: 'neutral' };
  }

  function renderTendencyHighlight(tendency) {
    return '<strong class="ng-tendency-highlight ng-tendency-highlight--' + tendency.tone + '">'
      + escapeText(tendency.text)
      + '</strong>';
  }

  function removeFlowIndicator(indicator) {
    if (indicator && indicator.parentNode) indicator.remove();
  }

  function clearRangeFlow() {
    rangeFlowArmed = false;
    removeFlowIndicator(rangeFlowIndicator);
    rangeFlowIndicator = null;
  }

  function clearCompletionFlow() {
    completionFlowArmed = false;
    removeFlowIndicator(completionFlowIndicator);
    completionFlowIndicator = null;
  }

  function createFlowIndicator(controlsId, onActivate) {
    var indicator = document.createElement('button');
    indicator.className = 'flow-scroll-indicator';
    indicator.type = 'button';
    indicator.setAttribute('aria-controls', controlsId);
    indicator.setAttribute('data-neuron-flow-indicator', '');
    indicator.innerHTML = [
      '<span class="flow-scroll-indicator-mark" aria-hidden="true"></span>',
      '<strong>下方有新内容</strong>',
      '<small>滚动或点击查看</small>'
    ].join('');
    indicator.addEventListener('click', onActivate, { once: true });
    document.body.appendChild(indicator);
    return indicator;
  }

  function revealMoreFactors() {
    if (state.moreFactorsRevealed) return;
    clearRangeFlow();
    state.moreFactorsRevealed = true;
    state.factors.slice(1, 3).forEach(function (factor) {
      state.multiValues[factor.id] = {
        importance: factor.suggestedImportance,
        value: null
      };
      state.multiTouched[factor.id] = { value: false };
    });
    renderTheory();
    window.requestAnimationFrame(function () {
      var section = theoryPanel.querySelector('#moreFactorsSection');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function handleRangeFlowWheel(event) {
    if (event.deltaY <= 0) return;
    if (rangeFlowArmed) revealMoreFactors();
    else if (completionFlowArmed) revealCompletion();
  }

  function showRangeLessonConclusion() {
    var mount = theoryPanel.querySelector('#rangeQuestionMount');
    if (!mount) return;
    var questionRoot = mount.querySelector('.dl-question');
    var scores = singleScores();
    var tendency = decisionTendency(scores.output);
    if (!mount.querySelector('.ng-range-conclusion')) {
      (questionRoot || mount).insertAdjacentHTML('beforeend', [
        '<div class="edu-callout edu-callout--orange ng-range-conclusion">',
        '  <strong class="edu-callout-label">思考提示</strong>',
        '  <span class="edu-callout-text">在当前只有一个输入、输出落在 0 到 1 的示例中，我们暂时用 0.5 作为倾向变化的分界。当前输出为 <strong>' + scores.output.toFixed(2) + '</strong>，根据目前的数值来看，' + renderTendencyHighlight(tendency) + '。<strong>不过，真实决策通常由多个因素共同影响，不能只凭一个信号下结论。</strong></span>',
        '</div>'
      ].join(''));
    }

    var previousAsyncStatus = mount.querySelector('.ng-extra-factors-status');
    if (previousAsyncStatus) previousAsyncStatus.remove();
    if (!visibleFactors().slice(1).length) {
      if (state.extraFactorsStatus === 'loading') {
        mount.insertAdjacentHTML('beforeend', [
          '<div class="edu-callout edu-callout--blue ng-extra-factors-status" role="status">',
          '  <strong class="edu-callout-label">正在准备更多信号</strong>',
          '  <span class="edu-callout-text">你已经完成第一个信号，另外两个输入信号还在生成中。</span>',
          '</div>'
        ].join(''));
      } else if (state.extraFactorsStatus === 'error') {
        mount.insertAdjacentHTML('beforeend', [
          '<div class="edu-callout edu-callout--red ng-extra-factors-status">',
          '  <strong class="edu-callout-label">补充信号暂时没有生成</strong>',
          '  <span class="edu-callout-text">' + escapeText(state.extraFactorsError || '请稍后重试。') + '</span>',
          '  <button class="edu-btn ng-retry-extra-factors" type="button" data-retry-extra-factors>重新生成</button>',
          '</div>'
        ].join(''));
      }
      return;
    }
    if (state.moreFactorsRevealed) return;
    if (!rangeFlowIndicator || !document.body.contains(rangeFlowIndicator)) {
      rangeFlowIndicator = createFlowIndicator('moreFactorsSection', revealMoreFactors);
    }
    rangeFlowArmed = true;
  }

  function mountRangeQuestion() {
    var question = window.DLModuleUI.mountQuestion('#rangeQuestionMount', {
      type: 'fill',
      title: '在当前只有一个输入，且 y = x × w 时，输出的取值范围是 {{blank:0}} 到 {{blank:1}}。',
      blanks: [
        { label: '输出范围下限', placeholder: '下限', chars: 5 },
        { label: '输出范围上限', placeholder: '上限', chars: 5 }
      ],
      submitText: '检查答案',
      validator: function (answers) {
        return String(answers[0]).trim() !== ''
          && String(answers[1]).trim() !== ''
          && Number(answers[0]) === 0
          && Number(answers[1]) === 1;
      },
      feedback: {
        empty: '先填写范围的下限和上限。',
        correct: '回答正确。当前只有一个输入，且 x、w 都在 0 到 1 之间，所以 y = x × w 也在 0 到 1 之间。',
        wrong: '这里只考虑一个输入：已知 x 和 w 都在 0 到 1 之间，乘积 y = x × w 的取值范围是什么？'
      },
      onCheck: function (result) {
        if (!result.ok) return;
        state.rangeQuestionCompleted = true;
        showRangeLessonConclusion();
      }
    });
    if (state.rangeQuestionCompleted && question) {
      var fields = question.root.querySelectorAll('[data-role="question-answer"]');
      if (fields[0]) fields[0].value = '0';
      if (fields[1]) fields[1].value = '1';
      question.check();
      showRangeLessonConclusion();
    }
  }

  function mountMultiQuestion() {
    var mount = theoryPanel.querySelector('#multiQuestionMount');
    if (!mount) return;
    var positiveLabel = state.positiveLabel || targetLabel();
    var question = window.DLModuleUI.mountQuestion(mount, {
      type: 'fill',
      title: '三个加权输入的总分范围是 0～3。若取中点为分界，总分 w₁x₁ + w₂x₂ + w₃x₃ 大于 {{blank:0}} 时，更倾向于“' + positiveLabel + '”。',
      blanks: [
        { label: '三个输入的倾向分界', placeholder: '填写数值', chars: 5 }
      ],
      submitText: '检查答案',
      validator: function (answers) {
        return String(answers[0]).trim() !== '' && Number(answers[0]) === 1.5;
      },
      feedback: {
        empty: '先填写 0～3 的中点。',
        correct: '正确：3 ÷ 2 = 1.5。三个输入的加权总分范围是 0～3，1.5 正好把这个范围分成两半；总分超过 1.5 时，模型就更倾向于“' + positiveLabel + '”。',
        wrong: '再想一下：这里要找的是 0～3 的中点，而不是直接取最大值或某一个输入的值。把总范围 3 平分成两半，分界点应为 3 ÷ 2 = 1.5。'
      },
      onCheck: function (result, questionRoot) {
        if (!result.ok) return;
        if (!state.multiQuestionAnswered) state.biasLessonStep = 0;
        state.multiQuestionAnswered = true;
        renderBiasLesson(questionRoot);
      }
    });
    if (state.multiQuestionAnswered && question) {
      var answerField = question.root.querySelector('[data-role="question-answer"]');
      if (answerField) answerField.value = '1.5';
      question.check();
      renderBiasLesson(question.root);
      if (state.biasLessonStep >= 2) armCompletionFlow(mount);
    }
  }

  function renderBiasLesson(questionRoot) {
    if (!questionRoot) return;
    var previous = questionRoot.querySelector('.ng-bias-lesson');
    if (previous) previous.remove();
    var threshold = 1.5;
    var score = multiOutputScore();
    var centeredScore = score - threshold;
    if (Math.abs(centeredScore) < 0.005) centeredScore = 0;
    var centeredLabel = centeredScore < 0
      ? '−' + Math.abs(centeredScore).toFixed(2)
      : centeredScore.toFixed(2);
    var tendency = decisionTendency(score, threshold);
    var shifted = state.biasLessonStep >= 1;
    var revealed = state.biasLessonStep >= 2;
    var equationHtml = shifted
      ? [
          '<span data-bias-lhs>w₁x₁ + w₂x₂ + w₃x₃</span>',
          '<button class="ng-bias-term' + (revealed ? ' is-bias-revealed' : ' is-ready') + '" type="button" data-bias-term aria-label="' + (revealed ? '偏置 b，等于负 1.5' : '点击负 1.5 认识偏置') + '">',
          '  <span class="ng-bias-leading-plus" aria-hidden="true">+</span>',
          '  <span class="ng-bias-original"><span class="ng-bias-minus">−</span><span data-bias-threshold>1.5</span></span>',
          '  <span class="ng-bias-symbol" aria-hidden="true">b</span>',
          '</button>',
          '<span data-bias-comparison>&gt;</span>',
          '<span data-bias-zero>0</span>'
        ].join('')
      : [
          '<span data-bias-lhs>w₁x₁ + w₂x₂ + w₃x₃</span>',
          '<span data-bias-comparison>&gt;</span>',
          '<span data-bias-threshold>1.5</span>'
        ].join('');

    questionRoot.insertAdjacentHTML('beforeend', [
      '<section class="ng-bias-lesson" aria-label="从判断门槛推导偏置">',
      '  <div class="edu-formula-block ng-bias-animation-card">',
      '    <div class="edu-formula ng-bias-animated-equation" data-bias-equation aria-live="polite">' + equationHtml + '</div>',
      shifted ? '' : '    <button class="edu-btn edu-btn--primary ng-bias-shift-button" type="button" data-bias-shift>把 1.5 移到左边</button>',
      '    <span class="ng-bias-click-hint" data-bias-click-hint' + (shifted && !revealed ? '' : ' hidden') + '>点击 −1.5，改写成 b</span>',
      '  </div>',
      '  <div class="ng-bias-reveal' + (revealed ? ' is-visible' : '') + '" data-bias-reveal' + (revealed ? '' : ' hidden') + '>',
      '    <div class="edu-notice-strip edu-notice-strip--blue ng-bias-notice">',
      '      <strong>这就是偏置 b。</strong>',
      '      <span>这里的 b = −1.5，把“总分是否超过 1.5”改写成“加上偏置后是否超过 0”。这样只看输出的正负，就能判断倾向。</span>',
      '    </div>',
      '    <div class="edu-callout edu-callout--orange ng-multi-tendency">',
      '      <strong class="edu-callout-label">当前结果</strong>',
      '      <span class="edu-callout-text">z = ' + score.toFixed(2) + ' + (−1.50) = <strong>' + centeredLabel + '</strong>，' + renderTendencyHighlight(tendency) + '。</span>',
      '    </div>',
      '  </div>',
      '</section>'
    ].join(''));
    bindBiasLessonInteractions(questionRoot);
  }

  function bindBiasLessonInteractions(questionRoot) {
    var shiftButton = questionRoot.querySelector('[data-bias-shift]');
    if (shiftButton) {
      shiftButton.addEventListener('click', function () {
        animateBiasThreshold(questionRoot, shiftButton);
      }, { once: true });
    }
    var biasTerm = questionRoot.querySelector('[data-bias-term]');
    if (biasTerm && state.biasLessonStep === 1) {
      biasTerm.addEventListener('click', function () {
        revealBiasTerm(questionRoot, biasTerm);
      }, { once: true });
    }
  }

  function animateBiasThreshold(questionRoot, shiftButton) {
    var equation = questionRoot.querySelector('[data-bias-equation]');
    var lhs = equation && equation.querySelector('[data-bias-lhs]');
    var comparison = equation && equation.querySelector('[data-bias-comparison]');
    var thresholdNode = equation && equation.querySelector('[data-bias-threshold]');
    if (!equation || !lhs || !comparison || !thresholdNode) return;
    shiftButton.disabled = true;
    var startRect = thresholdNode.getBoundingClientRect();
    var biasTerm = document.createElement('button');
    var leadingPlus = document.createElement('span');
    var original = document.createElement('span');
    var minus = document.createElement('span');
    var symbol = document.createElement('span');
    var zero = document.createElement('span');
    biasTerm.className = 'ng-bias-term';
    biasTerm.type = 'button';
    biasTerm.disabled = true;
    biasTerm.setAttribute('data-bias-term', '');
    biasTerm.setAttribute('aria-label', '点击负 1.5 认识偏置');
    leadingPlus.className = 'ng-bias-leading-plus';
    leadingPlus.setAttribute('aria-hidden', 'true');
    leadingPlus.textContent = '+';
    original.className = 'ng-bias-original';
    minus.className = 'ng-bias-minus';
    minus.textContent = '−';
    symbol.className = 'ng-bias-symbol';
    symbol.setAttribute('aria-hidden', 'true');
    symbol.textContent = 'b';
    zero.setAttribute('data-bias-zero', '');
    zero.textContent = '0';
    original.appendChild(minus);
    original.appendChild(thresholdNode);
    biasTerm.appendChild(leadingPlus);
    biasTerm.appendChild(original);
    biasTerm.appendChild(symbol);
    equation.replaceChildren(lhs, biasTerm, comparison, zero);
    var endRect = thresholdNode.getBoundingClientRect();
    thresholdNode.style.transition = 'none';
    thresholdNode.style.transform = 'translate(' + Math.round(startRect.left - endRect.left) + 'px, ' + Math.round(startRect.top - endRect.top) + 'px)';
    thresholdNode.style.opacity = '0.55';
    thresholdNode.getBoundingClientRect();
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var duration = reduceMotion ? 0 : 680;
    window.requestAnimationFrame(function () {
      thresholdNode.style.transition = 'transform ' + duration + 'ms cubic-bezier(0.22, 0.8, 0.22, 1), opacity ' + duration + 'ms ease';
      thresholdNode.style.transform = 'translate(0, 0)';
      thresholdNode.style.opacity = '1';
    });
    window.setTimeout(function () {
      state.biasLessonStep = 1;
      thresholdNode.removeAttribute('style');
      biasTerm.disabled = false;
      biasTerm.classList.add('is-ready');
      shiftButton.remove();
      var hint = questionRoot.querySelector('[data-bias-click-hint]');
      if (hint) hint.hidden = false;
      biasTerm.addEventListener('click', function () {
        revealBiasTerm(questionRoot, biasTerm);
      }, { once: true });
    }, duration + 40);
  }

  function revealBiasTerm(questionRoot, biasTerm) {
    if (!biasTerm || state.biasLessonStep >= 2) return;
    state.biasLessonStep = 2;
    biasTerm.classList.remove('is-ready');
    biasTerm.classList.add('is-bias-revealed');
    biasTerm.setAttribute('aria-label', '偏置 b，等于负 1.5');
    var hint = questionRoot.querySelector('[data-bias-click-hint]');
    if (hint) hint.hidden = true;
    var reveal = questionRoot.querySelector('[data-bias-reveal]');
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(function () {
      if (!reveal) return;
      reveal.hidden = false;
      window.requestAnimationFrame(function () { reveal.classList.add('is-visible'); });
      var mount = theoryPanel.querySelector('#multiQuestionMount');
      armCompletionFlow(mount);
    }, reduceMotion ? 0 : 660);
  }

  function armCompletionFlow(mount) {
    if (!mount || state.completed) return;
    clearRangeFlow();
    if (!completionFlowIndicator || !document.body.contains(completionFlowIndicator)) {
      completionFlowIndicator = createFlowIndicator('completionScene', revealCompletion);
    }
    completionFlowArmed = true;
  }

  function renderTheory() {
    if (!state.touchedValue) {
      theoryPanel.hidden = true;
      theoryPanel.innerHTML = '';
      return;
    }

    var factors = visibleFactors();
    var extras = factors.slice(1);
    var scores = singleScores();
    var html = [
      '<div class="edu-callout edu-callout--green">',
      '  <strong class="edu-callout-label" data-i18n="neuron.model.observation.label">观察结果</strong>',
      '  <span class="edu-callout-text" data-i18n="neuron.model.observation.body">信号强度是输入，重要性是权重。两者相乘后，得到这个信号对判断的实际影响。</span>',
      '</div>',
      renderFormula(scores),
      '<p class="ng-visual-transition">把这次计算画成一条信号流，就能更直观地看到输入如何带着权重进入神经元，并形成输出。</p>',
      renderNetwork([state.factor], scores.output, 'ngSingleArrow'),
      '<div class="ng-range-checkpoint" id="rangeQuestionMount"></div>'
    ];

    if (state.moreFactorsRevealed && extras.length) {
      var firstExtraTouched = state.multiTouched[extras[0].id];
      var firstExtraCompleted = firstExtraTouched && firstExtraTouched.value;
      var stagedExtras = extras.slice(0, firstExtraCompleted ? 2 : 1);
      html.push(
        '<section class="ng-more-factors-section" id="moreFactorsSection">',
        '  <h3 class="edu-panel-title" data-i18n="neuron.more.title">同一个决定，还有其他输入</h3>',
        '  <p class="edu-panel-description ng-section-copy">AI 已经给出每个因素的建议权重；你只需要填写自己当前的真实强度。</p>',
        '  <div class="ng-extra-factor-grid">' + stagedExtras.map(function (factor) { return renderFactorCard(factor, true); }).join('') + '</div>',
        '</section>'
      );
    }

    if (extraFactorsCompleted()) {
      html.push(
        '<div class="edu-callout edu-callout--blue">',
        '  <strong class="edu-callout-label" data-i18n="neuron.multi.label">多个输入</strong>',
        '  <span class="edu-callout-text" data-i18n-ignore="true">每个输入使用 AI 建议的权重。神经元把三个加权信号相加，得到 y = x₁w₁ + x₂w₂ + x₃w₃。</span>',
        '</div>',
        renderNetwork(factors, multiOutputScore(), 'ngMultiArrow'),
        '<div class="ng-question-wrap" id="multiQuestionMount"></div>'
      );
    }

    theoryPanel.innerHTML = html.join('');
    theoryPanel.hidden = false;
    mountRangeQuestion();
    if (extraFactorsCompleted()) mountMultiQuestion();
  }

  function resetAnalysis() {
    clearRangeFlow();
    clearCompletionFlow();
    state.factor = null;
    state.factors = [];
    state.negativeLabel = '';
    state.touchedImportance = false;
    state.touchedValue = false;
    state.multiValues = {};
    state.multiTouched = {};
    state.rangeQuestionCompleted = false;
    state.multiQuestionAnswered = false;
    state.biasLessonStep = 0;
    state.moreFactorsRevealed = false;
    state.extraFactorsStatus = 'idle';
    state.extraFactorsError = '';
    state.extraFactorsPayload = null;
    state.completed = false;
    factorStack.innerHTML = '';
    theoryPanel.innerHTML = '';
    theoryPanel.hidden = true;
    currentDecisionCallout.hidden = true;
    completionScene.hidden = true;
    resourceScene.hidden = true;
  }

  window.addEventListener('wheel', handleRangeFlowWheel, { passive: true });

  function renderLoadingScene() {
    resetAnalysis();
    analysis.hidden = true;
    updateProgress('signal');
    setStatus('blue', '正在分析', '正在把你的决定拆成可以量化的输入信号。', {
      labelKey: 'neuron.analysis.status.loadingLabel',
      textKey: 'neuron.analysis.status.loading',
      stream: true
    });
  }

  decisionStream.addEventListener('click', function (event) {
    var choice = event.target.closest('[data-decision]');
    if (!choice) return;
    input.value = choice.dataset.decision;
    decisionStream.querySelectorAll('.ng-choice-chip').forEach(function (chip) {
      chip.classList.toggle('is-selected', chip.dataset.decision === choice.dataset.decision);
      chip.setAttribute('aria-pressed', chip.dataset.decision === choice.dataset.decision ? 'true' : 'false');
    });
    input.closest('.ng-input-row').classList.add('is-confirmed');
  });

  decisionStream.addEventListener('pointerover', function (event) {
    var choice = event.target.closest('[data-decision]');
    if (!choice) return;
    input.placeholder = choice.dataset.decision;
    input.closest('.ng-input-row').classList.add('is-previewing');
  });

  decisionStream.addEventListener('pointerout', function (event) {
    var choice = event.target.closest('[data-decision]');
    if (!choice) return;
    var nextChoice = event.relatedTarget && event.relatedTarget.closest
      ? event.relatedTarget.closest('[data-decision]')
      : null;
    input.placeholder = nextChoice ? nextChoice.dataset.decision : DEFAULT_DECISION_PLACEHOLDER;
    input.closest('.ng-input-row').classList.toggle('is-previewing', Boolean(nextChoice));
  });

  input.addEventListener('input', function () {
    var value = input.value.trim();
    decisionStream.querySelectorAll('.ng-choice-chip').forEach(function (chip) {
      var selected = value !== '' && chip.dataset.decision === value;
      chip.classList.toggle('is-selected', selected);
      chip.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
    input.closest('.ng-input-row').classList.toggle('is-confirmed', value !== '');
  });

  function revealCompletion() {
    if (state.completed) return;
    clearCompletionFlow();
    state.completed = true;
    updateProgress('complete');
    document.addEventListener('dl:model-viewer-error', function () {
      var fallback = modelViewerMount.querySelector('.dl-model-fallback');
      if (fallback) fallback.textContent = '3D 查看组件加载失败，请刷新页面重试。';
    }, { once: true });
    window.DLModuleUI.ensureModelViewer();
    modelViewerMount.innerHTML = window.DLModuleUI.renderModelViewer({
      src: new URL('./multipolar_neuron.glb', document.baseURI).href,
      alt: '生物学上的多极神经元 3D 模型',
      posterText: '正在加载 3D 神经元...',
      title: '从汇总信号，到人工神经元',
      paragraphs: [
        '刚才你让多个输入进入同一个汇总结构，每个输入都有自己的权重，最后得到一个加权总分。',
        '你还把 1.5 的判断门槛移进公式，得到偏置 b = −1.5，让带偏置的输出能够统一使用 0 作为分界。激活函数会在下一课继续展开。'
      ],
      emphasis: '神经元不是凭空做决定，它只是把输入、权重和规则组织在一起。'
    });
    var modelViewer = modelViewerMount.querySelector('model-viewer');
    if (modelViewer) {
      modelViewer.addEventListener('error', function () {
        var fallback = modelViewer.querySelector('.dl-model-fallback');
        if (fallback) fallback.textContent = '3D 神经元文件加载失败，请刷新页面重试。';
      }, { once: true });
    }
    relatedVideosMount.innerHTML = window.DLModuleUI.renderRelatedVideos(recommendedVideos, {
      showHeader: false,
      ariaLabel: '神经元相关推荐'
    });
    completionScene.hidden = false;
    resourceScene.hidden = false;
    renderTheory();
    scrollToScene(completionScene);
  }

  factorStack.addEventListener('input', function (event) {
    var range = event.target.closest('.edu-range');
    if (!range) return;
    var group = range.closest('.ng-range-group');
    group.classList.remove('is-unset');
    range.classList.remove('is-unset');
    range.removeAttribute('aria-valuetext');
    var output = group.querySelector('[data-range-output]');
    if (output) output.value = range.value + ' / 10';
  });

  factorStack.addEventListener('click', function (event) {
    if (!event.target.closest('[data-accept-importance]') || !state.factor) return;
    state.touchedImportance = true;
    renderPrimaryFactor();
    var valueRange = factorStack.querySelector('.edu-range[data-kind="value"]');
    if (valueRange) valueRange.focus();
  });

  factorStack.addEventListener('change', function (event) {
    var range = event.target.closest('.edu-range');
    if (!range || !state.factor) return;
    if (range.dataset.kind === 'importance') {
      state.importance = Number(range.value);
      state.touchedImportance = true;
    } else {
      state.value = Number(range.value);
      state.touchedValue = true;
      updateProgress('model');
      setStatus('green', '已完成第一个信号', '现在可以看到输入、权重和输出之间的关系。', {
        labelKey: 'neuron.analysis.status.firstDoneLabel',
        textKey: 'neuron.analysis.status.firstDone'
      });
    }
    renderPrimaryFactor();
    renderTheory();
  });

  theoryPanel.addEventListener('click', function (event) {
    if (!event.target.closest('[data-retry-extra-factors]') || !state.extraFactorsPayload) return;
    startExtraFactorsRequest(state.extraFactorsPayload, analysisRequestSerial);
  });

  theoryPanel.addEventListener('input', function (event) {
    var range = event.target.closest('.edu-range');
    if (!range) return;
    var group = range.closest('.ng-range-group');
    group.classList.remove('is-unset');
    range.classList.remove('is-unset');
    range.removeAttribute('aria-valuetext');
    var output = group.querySelector('[data-range-output]');
    if (output) output.value = range.value + ' / 10';
  });

  theoryPanel.addEventListener('change', function (event) {
    var range = event.target.closest('.edu-range[data-factor-id]');
    if (!range || range.dataset.factorId === 'factor-0') return;
    var factorId = range.dataset.factorId;
    var factor = state.factors.find(function (item) { return item.id === factorId; });
    if (!state.multiValues[factorId]) {
      state.multiValues[factorId] = {
        importance: factor ? factor.suggestedImportance : 5,
        value: null
      };
    }
    if (!state.multiTouched[factorId]) state.multiTouched[factorId] = { value: false };
    state.multiValues[factorId][range.dataset.kind] = Number(range.value);
    state.multiTouched[factorId][range.dataset.kind] = true;
    renderTheory();
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    var rawDecision = normalizeDecision(input.value);
    var requestSerial = ++analysisRequestSerial;
    analyzeButton.disabled = true;
    analyzeButton.classList.add('is-loading');
    analyzeButton.setAttribute('aria-busy', 'true');
    analyzeButtonText.setAttribute('data-i18n', 'neuron.opening.form.loading');
    analyzeButtonText.textContent = '拆解中';
    renderLoadingScene();

    try {
      var result = await requestDecisionIntake(rawDecision);
      if (result.status && result.status !== 'ok') {
        throw window.DLModuleUI.createUserFacingError(
          result.reason || '这个输入暂时无法转换成明确的单一决策，请换一种说法。',
          result.status === 'refuse' ? 'INPUT_REFUSED' : 'INPUT_UNCLEAR'
        );
      }
      var primaryFactor = normalizeFactor(result.primary_factor || result.primaryFactor, 0);
      if (!primaryFactor) throw window.DLModuleUI.createUserFacingError('没有生成可用的输入信号，请换一种说法后重试。');
      if (!result.decision) throw window.DLModuleUI.createUserFacingError('没有形成明确的单一决策，请换一种说法后重试。');

      state.decision = result.decision;
      state.positiveLabel = result.positive_label || result.positiveLabel || '';
      state.negativeLabel = result.negative_label || result.negativeLabel || ('不' + state.positiveLabel);
      state.factors = [primaryFactor];
      state.factor = primaryFactor;
      state.importance = primaryFactor.suggestedImportance;
      state.value = null;
      decisionText.textContent = state.decision;
      analysis.hidden = false;
      currentDecisionCallout.hidden = false;
      setStatus('orange', '先从一个输入信号开始', '看看这个因素为什么会影响你的决定，再根据自己的真实情况完成评分。', {
        stream: true
      });
      renderPrimaryFactor();
      scrollToScene(analysis);
      startExtraFactorsRequest({
        decision: state.decision,
        positive_label: state.positiveLabel,
        negative_label: state.negativeLabel,
        primary_factor_name: state.factor.name
      }, requestSerial);
    } catch (error) {
      setStatus('red', '暂时无法继续', window.DLModuleUI.friendlyErrorMessage(error), {
        labelKey: 'neuron.analysis.status.errorLabel'
      });
      console.error(error);
    } finally {
      analyzeButton.disabled = false;
      analyzeButton.classList.remove('is-loading');
      analyzeButton.removeAttribute('aria-busy');
      analyzeButtonText.setAttribute('data-i18n', 'neuron.opening.form.submit');
      analyzeButtonText.textContent = '开始拆解决定';
    }
  });

})();

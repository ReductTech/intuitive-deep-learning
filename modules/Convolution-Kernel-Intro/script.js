(function () {
  'use strict';

  var BOARD_SIZE = 15;
  var IMAGE_PADDING = 2;
  var IMAGE_SIZE = BOARD_SIZE + IMAGE_PADDING * 2;
  var EMPTY = 0;
  var HUMAN = 1;
  var AI = 2;
  var OUT = 3;
  var FEEDBACK_ENDPOINT = 'http://127.0.0.1:59414/kernel/gomoku-win-feedback';
  var calcHideTimer = 0;
  var mnistHideTimer = 0;
  var scrollAnimationFrame = 0;
  var scrollInteractionArmed = false;
  var winQuestion = null;
  var kernelEffectQuestion = null;
  var strategyTipIndex = 0;
  var strategyTipTimer = 0;
  var DIRECTIONS = [
    { dr: 0, dc: 1, label: '横向' },
    { dr: 1, dc: 0, label: '竖向' },
    { dr: 1, dc: 1, label: '左上到右下斜线' },
    { dr: 1, dc: -1, label: '右上到左下斜线' },
  ];
  var PATTERNS = {
    win: { label: '成五', score: 120000 },
    openFour: { label: '活四', score: 76000 },
    rushFour: { label: '冲四', score: 33000 },
    gapFour: { label: '跳四', score: 24000 },
    openThree: { label: '活三', score: 9800 },
    jumpThree: { label: '跳三', score: 4300 },
    sleepThree: { label: '眠三', score: 1800 },
    openTwo: { label: '活二', score: 740 },
    sleepTwo: { label: '眠二', score: 260 },
    seed: { label: '落点', score: 60 },
  };
  var GT_WIN_JUDGEMENT = [
    '棋盘可以表示成二维数组或矩阵。',
    '每个格子存储空、黑子、白子这样的状态。',
    '每次落子后，沿横向、竖向、两条斜线四个方向检查。',
    '在同一方向上把正反两边连续同色棋子加起来，再加当前棋子。',
    '连续同色棋子数量达到 5，就判定对应玩家获胜。',
  ];
  var STRATEGY_TIPS = [
    '越靠近棋盘中心，棋子通常越容易向多个方向延伸。',
    '计算机看到的棋盘，本质上是一张由数字组成的表格。',
    '别只盯着自己的棋，也要看看对手下一步最想下在哪里。',
    '连续三颗棋子已经值得警惕，再不阻止可能就晚了。',
    '程序判断胜负时，会分别检查横向、竖向和两条斜线。',
    '一条很长的棋路，不一定比两条同时发展的棋路更危险。',
    '有时最好的进攻，就是下在对手最需要的位置上。',
    '计算机不需要理解“棋”，它只需要找到连续出现的相同数字。',
    '棋子之间隔着一个空位，也可能隐藏着危险。',
    '同时影响两个方向的位置，往往比普通位置更有价值。',
    '扫描棋盘时，一个小窗口可以逐格移动，寻找特定的排列。',
    '发现对手已经连成四颗时，必须立刻阻止。',
    '边缘位置可以发展的方向较少，开局不要太早走到角落。',
    '胜负往往不取决于最后一步，而取决于几步前漏掉的威胁。',
    '只要检测到五个相同的数字连成一线，程序就能宣布胜负。',
  ];
  var MNIST_SAMPLES = [
    'dataset/mnist/0/60003.png', 'dataset/mnist/0/60010.png', 'dataset/mnist/0/60013.png', 'dataset/mnist/0/60025.png', 'dataset/mnist/0/60028.png',
    'dataset/mnist/1/60002.png', 'dataset/mnist/1/60005.png', 'dataset/mnist/1/60014.png', 'dataset/mnist/1/60029.png', 'dataset/mnist/1/60031.png',
    'dataset/mnist/2/60001.png', 'dataset/mnist/2/60035.png', 'dataset/mnist/2/60038.png', 'dataset/mnist/2/60043.png', 'dataset/mnist/2/60047.png',
    'dataset/mnist/3/60018.png', 'dataset/mnist/3/60030.png', 'dataset/mnist/3/60032.png', 'dataset/mnist/3/60044.png', 'dataset/mnist/3/60051.png',
    'dataset/mnist/4/60004.png', 'dataset/mnist/4/60006.png', 'dataset/mnist/4/60019.png', 'dataset/mnist/4/60024.png', 'dataset/mnist/4/60027.png',
    'dataset/mnist/5/60008.png', 'dataset/mnist/5/60015.png', 'dataset/mnist/5/60023.png', 'dataset/mnist/5/60045.png', 'dataset/mnist/5/60052.png',
    'dataset/mnist/6/60011.png', 'dataset/mnist/6/60021.png', 'dataset/mnist/6/60022.png', 'dataset/mnist/6/60050.png', 'dataset/mnist/6/60054.png',
    'dataset/mnist/7/60000.png', 'dataset/mnist/7/60017.png', 'dataset/mnist/7/60026.png', 'dataset/mnist/7/60034.png', 'dataset/mnist/7/60036.png',
    'dataset/mnist/8/60061.png', 'dataset/mnist/8/60084.png', 'dataset/mnist/8/60110.png', 'dataset/mnist/8/60128.png', 'dataset/mnist/8/60134.png',
    'dataset/mnist/9/60007.png', 'dataset/mnist/9/60009.png', 'dataset/mnist/9/60012.png', 'dataset/mnist/9/60016.png', 'dataset/mnist/9/60020.png',
  ];
  var MNIST_KERNELS = {
    vertical: { label: '竖线', matrix: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]] },
    horizontal: { label: '横线', matrix: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]] },
    edge: { label: '边缘', matrix: [[0, -1, 0], [-1, 4, -1], [0, -1, 0]] },
  };
  var canvas = document.getElementById('boardCanvas');
  var state = {
    board: createBoard(),
    current: 'human',
    thinking: false,
    gameOver: false,
    winner: EMPTY,
    winLine: [],
    lastMove: null,
    hover: null,
    moveHistory: [],
    pendingDecision: null,
    aiTimer: 0,
    drawRequiresReset: false,
    answerPassed: false,
    activeLayer: 'winner',
    baseKernel: mainDiagonalKernel(),
    currentKernel: mainDiagonalKernel(),
    designKernel: zeroKernel(),
    scanPosition: { row: 0, col: 0 },
    draggingKernel: false,
    bestActivation: -Infinity,
    foundMaxActivation: false,
    kernelPhase: 'scanOriginal',
    imageTransform: 'none',
    continueCueShown: false,
    kernelQuestionPassed: false,
    mnistStarted: false,
    mnistSample: null,
    mnistPixels: [],
    mnistKernelKey: 'user',
    mnistCustomKernel: [[0, 0, 0], [0, 1, 0], [0, 0, 0]],
    mnistKernelUnlocked: false,
    mnistStep: 0,
    mnistTimer: 0,
    mnistFeatureValues: [],
  };

  function $(id) {
    return document.getElementById(id);
  }

  function createBoard() {
    return Array.from({ length: BOARD_SIZE }, function () {
      return Array.from({ length: BOARD_SIZE }, function () { return EMPTY; });
    });
  }

  function zeroKernel() {
    return Array.from({ length: 5 }, function () {
      return [0, 0, 0, 0, 0];
    });
  }

  function mainDiagonalKernel() {
    return Array.from({ length: 5 }, function (_, row) {
      return Array.from({ length: 5 }, function (_, col) { return row === col ? 1 : 0; });
    });
  }

  function antiDiagonalKernel() {
    return Array.from({ length: 5 }, function (_, row) {
      return Array.from({ length: 5 }, function (_, col) { return row + col === 4 ? 1 : 0; });
    });
  }

  function horizontalKernel() {
    return Array.from({ length: 5 }, function (_, row) {
      return Array.from({ length: 5 }, function () { return row === 2 ? 1 : 0; });
    });
  }

  function verticalKernel() {
    return Array.from({ length: 5 }, function () {
      return Array.from({ length: 5 }, function (_, col) { return col === 2 ? 1 : 0; });
    });
  }

  function cloneMatrix(matrix) {
    return matrix.map(function (row) { return row.slice(); });
  }

  function flipHorizontal(matrix) {
    return matrix.map(function (row) { return row.slice().reverse(); });
  }

  function rotateClockwise(matrix) {
    return matrix[0].map(function (_, col) {
      return matrix.map(function (row) { return row[col]; }).reverse();
    });
  }

  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }

  function inBounds(row, col) {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
  }

  function playerName(player) {
    if (player === HUMAN) return '你';
    if (player === AI) return 'AI';
    return '无';
  }

  function coordinate(row, col) {
    return String(col + 1).padStart(2, '0') + ',' + String(row + 1).padStart(2, '0');
  }

  function boardMetrics() {
    var size = window.DLCanvas.size(canvas);
    var side = Math.min(size.width, size.height);
    var pad = side * 0.065;
    var cell = (side - pad * 2) / (BOARD_SIZE - 1);
    return {
      width: size.width,
      height: size.height,
      side: side,
      cell: cell,
      left: (size.width - side) / 2 + pad,
      top: (size.height - side) / 2 + pad,
    };
  }

  function cellPoint(row, col, metrics) {
    metrics = metrics || boardMetrics();
    return {
      x: metrics.left + col * metrics.cell,
      y: metrics.top + row * metrics.cell,
    };
  }

  function pointToCell(event) {
    var point = window.DLCanvas.pointer(canvas, event);
    var metrics = boardMetrics();
    var col = Math.round((point.x - metrics.left) / metrics.cell);
    var row = Math.round((point.y - metrics.top) / metrics.cell);
    if (!inBounds(row, col)) return null;
    var snapped = cellPoint(row, col, metrics);
    if (Math.hypot(snapped.x - point.x, snapped.y - point.y) > metrics.cell * 0.46) return null;
    return { row: row, col: col };
  }

  function clearAiTimer() {
    if (state.aiTimer) {
      window.clearTimeout(state.aiTimer);
      state.aiTimer = 0;
    }
  }

  function resetGame() {
    clearAiTimer();
    state.board = createBoard();
    state.current = 'human';
    state.thinking = false;
    state.gameOver = false;
    state.winner = EMPTY;
    state.winLine = [];
    state.lastMove = null;
    state.hover = null;
    state.moveHistory = [];
    state.pendingDecision = null;
    state.drawRequiresReset = false;
    state.answerPassed = false;
    state.mnistStarted = false;
    $('reflectionPanel').hidden = true;
    $('matrixStage').hidden = true;
    $('mnistStage').hidden = true;
    $('mnistStage').setAttribute('aria-hidden', 'true');
    resetScrollFlow();
    stopMnistAnimation();
    if (winQuestion) winQuestion.resetQuestion();
    $('undoBtn').disabled = false;
    $('demoWinBtn').disabled = false;
    $('resetBtn').classList.remove('dl-button-hint');
    $('resetBtn').removeAttribute('data-dl-button-hint');
    setProgress('game');
    renderGame();
  }

  function undoPair() {
    if (state.thinking || state.drawRequiresReset) return;
    clearAiTimer();
    if (!state.moveHistory.length) return;
    state.gameOver = false;
    state.winner = EMPTY;
    state.winLine = [];
    state.drawRequiresReset = false;
    state.answerPassed = false;
    state.mnistStarted = false;
    $('reflectionPanel').hidden = true;
    $('matrixStage').hidden = true;
    $('mnistStage').hidden = true;
    $('mnistStage').setAttribute('aria-hidden', 'true');
    resetScrollFlow();
    stopMnistAnimation();
    if (winQuestion) winQuestion.resetQuestion();
    var removed = 0;
    while (state.moveHistory.length && removed < 2) {
      var move = state.moveHistory.pop();
      state.board[move.row][move.col] = EMPTY;
      removed += 1;
      if (move.player === HUMAN && removed > 1) break;
    }
    state.lastMove = state.moveHistory[state.moveHistory.length - 1] || null;
    state.current = 'human';
    setProgress('game');
    renderGame();
  }

  function placeStone(row, col, player) {
    if (!inBounds(row, col) || state.board[row][col] !== EMPTY) return false;
    state.board[row][col] = player;
    state.lastMove = { row: row, col: col, player: player };
    state.moveHistory.push(state.lastMove);
    var line = findWinLine(row, col, player);
    if (line.length >= 5) {
      state.gameOver = true;
      state.winner = player;
      state.winLine = line;
      state.current = 'done';
      state.thinking = false;
      revealReflection();
    } else if (state.moveHistory.length >= BOARD_SIZE * BOARD_SIZE) {
      state.gameOver = true;
      state.winner = EMPTY;
      state.winLine = [];
      state.current = 'done';
      state.thinking = false;
      state.drawRequiresReset = true;
      $('reflectionPanel').hidden = true;
      if (winQuestion) winQuestion.resetQuestion();
      $('resetBtn').classList.add('dl-button-hint');
      $('resetBtn').setAttribute('data-dl-button-hint', '');
    }
    return true;
  }

  function revealReflection() {
    window.setTimeout(function () {
      if (!state.gameOver || state.winner === EMPTY) return;
      $('reflectionPanel').hidden = false;
      $('winSummary').textContent = buildWinSummary();
      setProgress('answer');
      renderGame();
      $('reflectionPanel').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 340);
  }

  function buildWinSummary() {
    if (state.winner === HUMAN) return '恭喜！您获胜了。';
    if (state.winner === AI) return '这局惜败，别灰心，再试一次！';
    return '平局了，重新开局再试一次吧！';
  }

  function findWinLine(row, col, player) {
    var best = [];
    DIRECTIONS.forEach(function (dir) {
      var line = [{ row: row, col: col }];
      var step;
      for (step = 1; step < BOARD_SIZE; step += 1) {
        var r1 = row + dir.dr * step;
        var c1 = col + dir.dc * step;
        if (!inBounds(r1, c1) || state.board[r1][c1] !== player) break;
        line.push({ row: r1, col: c1 });
      }
      for (step = 1; step < BOARD_SIZE; step += 1) {
        var r2 = row - dir.dr * step;
        var c2 = col - dir.dc * step;
        if (!inBounds(r2, c2) || state.board[r2][c2] !== player) break;
        line.unshift({ row: r2, col: c2 });
      }
      if (line.length > best.length) best = line;
    });
    return best.length >= 5 ? best : [];
  }

  function scheduleAiMove() {
    if (state.gameOver) return;
    state.current = 'ai';
    state.thinking = true;
    state.pendingDecision = computeAiDecision();
    renderGame();
    state.aiTimer = window.setTimeout(function () {
      state.aiTimer = 0;
      playAiMove();
    }, 420);
  }

  function playAiMove() {
    if (state.gameOver || state.current !== 'ai' || !state.pendingDecision) return;
    var move = state.pendingDecision.choice;
    state.pendingDecision = null;
    placeStone(move.row, move.col, AI);
    if (!state.gameOver) {
      state.current = 'human';
      state.thinking = false;
    }
    renderGame();
  }

  function handleHumanMove(row, col) {
    if (state.gameOver || state.thinking || state.current !== 'human') return;
    if (!placeStone(row, col, HUMAN)) return;
    state.hover = null;
    renderGame();
    if (!state.gameOver) scheduleAiMove();
  }

  function candidateMoves() {
    if (!state.moveHistory.length) {
      var center = Math.floor(BOARD_SIZE / 2);
      return [{ row: center, col: center }];
    }
    var seen = {};
    var moves = [];
    state.moveHistory.forEach(function (move) {
      for (var dr = -2; dr <= 2; dr += 1) {
        for (var dc = -2; dc <= 2; dc += 1) {
          var row = move.row + dr;
          var col = move.col + dc;
          var key = row + ':' + col;
          if (!inBounds(row, col) || state.board[row][col] !== EMPTY || seen[key]) continue;
          seen[key] = true;
          moves.push({ row: row, col: col });
        }
      }
    });
    return moves;
  }

  function computeAiDecision() {
    var candidates = candidateMoves().map(function (move) {
      return scoreCandidate(move.row, move.col);
    }).sort(function (a, b) {
      return b.score - a.score;
    });
    var top = candidates[0];
    var forced = top.attack.best.key === 'win' || top.defend.best.key === 'win' || top.score > 260000;
    var pool = forced ? [top] : candidates.filter(function (item, index) {
      return index < 3 && item.score >= top.score * 0.88;
    });
    return { choice: pool[Math.floor(Math.random() * pool.length)] || top };
  }

  function scoreCandidate(row, col) {
    var attack = evaluateMove(row, col, AI);
    var defend = evaluateMove(row, col, HUMAN);
    var center = (BOARD_SIZE - 1) / 2;
    var centerScore = Math.max(0, 13 - Math.hypot(row - center, col - center)) * 18;
    var score = attack.score * 1.08 + defend.score * 1.04 + centerScore + localDensity(row, col) * 34;
    if (attack.best.key === 'win') score = 520000 + attack.score;
    else if (defend.best.key === 'win') score = 480000 + defend.score;
    else {
      if (defend.best.key === 'openFour' || defend.best.key === 'rushFour' || defend.best.key === 'gapFour') score += 94000;
      if (attack.best.key === 'openFour' || attack.best.key === 'rushFour' || attack.best.key === 'gapFour') score += 72000;
      if (defend.features.openThree >= 2) score += 24000;
      if (attack.features.openThree >= 2) score += 20000;
    }
    return { row: row, col: col, score: score + Math.random() * 70, attack: attack, defend: defend };
  }

  function localDensity(row, col) {
    var total = 0;
    for (var dr = -2; dr <= 2; dr += 1) {
      for (var dc = -2; dc <= 2; dc += 1) {
        if (dr === 0 && dc === 0) continue;
        var r = row + dr;
        var c = col + dc;
        if (inBounds(r, c) && state.board[r][c] !== EMPTY) total += 1;
      }
    }
    return total;
  }

  function evaluateMove(row, col, player) {
    var features = {};
    Object.keys(PATTERNS).forEach(function (key) { features[key] = 0; });
    var best = { key: 'seed', score: PATTERNS.seed.score };
    var score = 0;
    DIRECTIONS.forEach(function (dir) {
      var line = scanDirection(row, col, player, dir);
      features[line.key] += 1;
      score += line.score;
      if (line.score > best.score) best = line;
    });
    if (features.openThree >= 2) score += 17000;
    if (features.rushFour + features.gapFour >= 2) score += 26000;
    return { score: score, features: features, best: best };
  }

  function scanDirection(row, col, player, dir) {
    function valueAt(offset) {
      var r = row + dir.dr * offset;
      var c = col + dir.dc * offset;
      if (!inBounds(r, c)) return OUT;
      if (offset === 0) return player;
      return state.board[r][c];
    }
    var left = 0;
    var right = 0;
    while (valueAt(-left - 1) === player) left += 1;
    while (valueAt(right + 1) === player) right += 1;
    var total = left + right + 1;
    var openEnds = 0;
    if (valueAt(-left - 1) === EMPTY) openEnds += 1;
    if (valueAt(right + 1) === EMPTY) openEnds += 1;
    var window = strongestWindow(row, col, player, dir);
    var key = 'seed';
    if (total >= 5 || window.self >= 5) key = 'win';
    else if (total === 4 && openEnds === 2) key = 'openFour';
    else if (total === 4 && openEnds === 1) key = 'rushFour';
    else if (window.self === 4) key = 'gapFour';
    else if (total === 3 && openEnds === 2) key = 'openThree';
    else if (window.self === 3 && window.empty === 2) key = 'jumpThree';
    else if (total === 3 && openEnds === 1) key = 'sleepThree';
    else if (total === 2 && openEnds === 2) key = 'openTwo';
    else if (total === 2 && openEnds === 1) key = 'sleepTwo';
    return { key: key, score: PATTERNS[key].score };
  }

  function strongestWindow(row, col, player, dir) {
    var best = { self: 0, empty: 0 };
    for (var start = -4; start <= 0; start += 1) {
      var blocked = false;
      var self = 0;
      var empty = 0;
      for (var offset = start; offset < start + 5; offset += 1) {
        var r = row + dir.dr * offset;
        var c = col + dir.dc * offset;
        var value = !inBounds(r, c) ? OUT : (offset === 0 ? player : state.board[r][c]);
        if (value === player) self += 1;
        else if (value === EMPTY) empty += 1;
        else blocked = true;
      }
      if (!blocked && (self > best.self || (self === best.self && empty > best.empty))) {
        best = { self: self, empty: empty };
      }
    }
    return best;
  }

  function useDemoWin() {
    clearAiTimer();
    state.board = createBoard();
    state.moveHistory = [];
    var black = [
      [4, 3], [5, 4], [6, 5], [7, 6], [8, 7],
      [5, 8], [7, 4], [8, 5], [9, 5],
    ];
    var white = [
      [4, 6], [5, 6], [6, 7], [7, 8], [8, 8],
      [9, 6], [6, 3], [10, 5],
    ];
    black.forEach(function (cell) {
      state.board[cell[0]][cell[1]] = HUMAN;
      state.moveHistory.push({ row: cell[0], col: cell[1], player: HUMAN });
    });
    white.forEach(function (cell) {
      state.board[cell[0]][cell[1]] = AI;
      state.moveHistory.push({ row: cell[0], col: cell[1], player: AI });
    });
    state.lastMove = { row: 8, col: 7, player: HUMAN };
    state.gameOver = true;
    state.winner = HUMAN;
    state.winLine = black.slice(0, 5).map(function (cell) { return { row: cell[0], col: cell[1] }; });
    state.current = 'done';
    state.thinking = false;
    state.drawRequiresReset = false;
    state.answerPassed = false;
    state.pendingDecision = null;
    state.hover = null;
    $('reflectionPanel').hidden = true;
    $('matrixStage').hidden = true;
    $('mnistStage').hidden = true;
    $('mnistStage').setAttribute('aria-hidden', 'true');
    resetScrollFlow();
    stopMnistAnimation();
    if (winQuestion) winQuestion.resetQuestion();
    renderGame();
    revealReflection();
  }

  function showStrategyTip(index) {
    strategyTipIndex = (index + STRATEGY_TIPS.length) % STRATEGY_TIPS.length;
    var text = $('strategyTipText');
    text.classList.add('is-changing');
    window.setTimeout(function () {
      text.setAttribute('data-i18n', 'kernel.game.strategy.tip' + String(strategyTipIndex + 1).padStart(2, '0'));
      text.textContent = STRATEGY_TIPS[strategyTipIndex];
      text.classList.remove('is-changing');
    }, 140);
  }

  function startStrategyTips() {
    showStrategyTip(0);
    if (strategyTipTimer) window.clearInterval(strategyTipTimer);
    strategyTipTimer = window.setInterval(function () {
      showStrategyTip(strategyTipIndex + 1);
    }, 4200);
  }

  function renderGame() {
    drawBoard();
    $('moveCount').textContent = String(state.moveHistory.length);
    canvas.parentElement.classList.toggle('is-waiting', state.thinking);
    if (state.gameOver) {
      $('turnLabel').textContent = '本局结束';
      $('gameResult').textContent = state.winner === EMPTY ? '平局，请重新开局' : playerName(state.winner) + '连成五子';
      $('undoBtn').disabled = state.drawRequiresReset;
      $('demoWinBtn').disabled = state.drawRequiresReset;
    } else if (state.thinking) {
      $('turnLabel').textContent = 'AI 思考';
      $('gameResult').textContent = 'AI 正在落子';
    } else {
      $('turnLabel').textContent = '轮到你';
      $('gameResult').textContent = state.moveHistory.length ? '继续对弈' : '先落下一颗黑子';
    }
  }

  function drawBoard() {
    var ctx = window.DLCanvas.prepare(canvas);
    var metrics = boardMetrics();
    ctx.clearRect(0, 0, metrics.width, metrics.height);
    drawBoardSurface(ctx, metrics);
    drawGrid(ctx, metrics);
    drawStars(ctx, metrics);
    drawStones(ctx, metrics);
    drawHover(ctx, metrics);
  }

  function drawBoardSurface(ctx, metrics) {
    ctx.fillStyle = '#e7c889';
    ctx.fillRect(0, 0, metrics.width, metrics.height);
    var gradient = ctx.createLinearGradient(0, 0, metrics.width, metrics.height);
    gradient.addColorStop(0, 'rgba(255,255,255,0.22)');
    gradient.addColorStop(0.52, 'rgba(255,255,255,0.03)');
    gradient.addColorStop(1, 'rgba(39,68,110,0.12)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, metrics.width, metrics.height);
  }

  function drawGrid(ctx, metrics) {
    ctx.strokeStyle = 'rgba(68, 46, 26, 0.78)';
    ctx.lineWidth = Math.max(1, metrics.cell * 0.028);
    for (var i = 0; i < BOARD_SIZE; i += 1) {
      var start = cellPoint(i, 0, metrics);
      var end = cellPoint(i, BOARD_SIZE - 1, metrics);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      start = cellPoint(0, i, metrics);
      end = cellPoint(BOARD_SIZE - 1, i, metrics);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  }

  function drawStars(ctx, metrics) {
    [3, 7, 11].forEach(function (row) {
      [3, 7, 11].forEach(function (col) {
        var point = cellPoint(row, col, metrics);
        ctx.beginPath();
        ctx.arc(point.x, point.y, metrics.cell * 0.105, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(68, 46, 26, 0.82)';
        ctx.fill();
      });
    });
  }

  function drawStones(ctx, metrics) {
    var winKeys = {};
    state.winLine.forEach(function (cell) {
      winKeys[cell.row + ':' + cell.col] = true;
    });
    for (var row = 0; row < BOARD_SIZE; row += 1) {
      for (var col = 0; col < BOARD_SIZE; col += 1) {
        var value = state.board[row][col];
        if (value !== EMPTY) drawStone(ctx, metrics, row, col, value, !!winKeys[row + ':' + col]);
      }
    }
  }

  function drawStone(ctx, metrics, row, col, player, isWin) {
    var point = cellPoint(row, col, metrics);
    var radius = metrics.cell * 0.42;
    ctx.save();
    ctx.shadowColor = 'rgba(33,50,74,0.28)';
    ctx.shadowBlur = metrics.cell * 0.15;
    ctx.shadowOffsetY = metrics.cell * 0.08;
    var fill = ctx.createRadialGradient(point.x - radius * 0.28, point.y - radius * 0.36, radius * 0.12, point.x, point.y, radius);
    if (player === HUMAN) {
      fill.addColorStop(0, '#525a68');
      fill.addColorStop(0.42, '#1a1f27');
      fill.addColorStop(1, '#05070a');
    } else {
      fill.addColorStop(0, '#ffffff');
      fill.addColorStop(0.58, '#edf2f7');
      fill.addColorStop(1, '#aeb8c7');
    }
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = Math.max(1.4, metrics.cell * 0.04);
    ctx.strokeStyle = player === HUMAN ? 'rgba(255,255,255,0.16)' : 'rgba(39,68,110,0.28)';
    ctx.stroke();
    if (state.lastMove && state.lastMove.row === row && state.lastMove.col === col) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = player === HUMAN ? '#f07e47' : '#228d5c';
      ctx.fill();
    }
    if (isWin) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius * 1.2, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(2, metrics.cell * 0.06);
      ctx.strokeStyle = '#f07e47';
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawHover(ctx, metrics) {
    if (!state.hover || state.current !== 'human' || state.thinking || state.gameOver) return;
    if (state.board[state.hover.row][state.hover.col] !== EMPTY) return;
    var point = cellPoint(state.hover.row, state.hover.col, metrics);
    ctx.beginPath();
    ctx.arc(point.x, point.y, metrics.cell * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(23,27,34,0.22)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(23,27,34,0.48)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  async function submitWinAnswer(checkResult) {
    if (!state.gameOver) return;
    var answer = String(checkResult && checkResult.answer && checkResult.answer[0] || '').trim();
    if (!answer) {
      return;
    }
    var submit = winQuestion && winQuestion.submit;
    if (submit) {
      submit.disabled = true;
      submit.classList.add('is-loading');
      submit.setAttribute('aria-busy', 'true');
    }
    if (winQuestion) winQuestion.streamFeedback('正在分析你的解释，请稍候。', 'hint');
    try {
      var response = await fetch(FEEDBACK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: answer,
          board_size: BOARD_SIZE,
          winner: playerName(state.winner),
          win_direction: winDirectionLabel(),
          win_line: state.winLine.map(function (cell) { return [cell.row, cell.col]; }),
          ground_truth: GT_WIN_JUDGEMENT,
        }),
      });
      var data = await response.json().catch(function () { return {}; });
      var apiResult = window.DLModuleUI.requireServiceResult(response, data);
      var feedback = window.DLModuleUI.shortAnswerFeedback(apiResult);
      state.answerPassed = true;
      if (winQuestion) winQuestion.streamFeedback(feedback.message, feedback.tone, { onComplete: showMatrixStage });
    } catch (error) {
      if (winQuestion) winQuestion.streamFeedback(window.DLModuleUI.friendlyErrorMessage(error), 'wrong');
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.classList.remove('is-loading');
        submit.setAttribute('aria-busy', 'false');
      }
    }
  }

  function mountWinQuestion() {
    winQuestion = window.DLModuleUI.mountQuestion('#winQuestionMount', {
      type: 'short',
      title: '请用自己的话解释计算机判断五子棋胜负的过程。',
      rows: 3,
      answerLabel: '胜负判断解释',
      submitText: '提交评估',
      feedback: { sample: '正在分析你的解释，请稍候。' },
      validator: function () {
        return { ok: true, tone: 'hint', message: '正在分析你的解释，请稍候。' };
      },
      onCheck: submitWinAnswer,
    });
    var answerField = winQuestion && winQuestion.root.querySelector('[data-role="question-answer"]');
    if (answerField) {
      answerField.classList.add('edu-textarea');
      answerField.setAttribute('data-dl-input-hint', '');
    }
  }

  function showMatrixStage() {
    if (!state.answerPassed) return;
    prepareKernelExperiment();
    $('matrixStage').hidden = false;
    setProgress('matrix');
    renderMatrixStage();
    $('matrixStage').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function prepareKernelExperiment() {
    state.activeLayer = 'winner';
    state.baseKernel = kernelForWinDirection();
    state.currentKernel = cloneMatrix(state.baseKernel);
    state.designKernel = zeroKernel();
    state.scanPosition = { row: 0, col: 0 };
    state.draggingKernel = false;
    state.bestActivation = -Infinity;
    state.foundMaxActivation = false;
    state.kernelPhase = 'scanOriginal';
    state.imageTransform = 'none';
    state.continueCueShown = false;
    state.kernelQuestionPassed = false;
    $('kernelEffectQuestion').hidden = true;
    if (kernelEffectQuestion) {
      kernelEffectQuestion.resetQuestion();
      kernelEffectQuestion.root.querySelectorAll('.dl-question-option').forEach(function (button) {
        button.disabled = false;
      });
    }
    resetScrollFlow();
  }

  function renderMatrixStage() {
    renderLayerButtons();
    renderBinaryGrid();
    renderOperatorPanels();
    renderKernelGrid('kernelGrid', state.currentKernel, false);
    renderKernelGrid('patchGrid', currentPatchMatrix(), false, true);
    renderDesignGrid();
    updateOperatorReadout();
  }

  function renderLayerButtons() {
    $('layerSwitch').hidden = state.kernelPhase !== 'complete';
    document.querySelectorAll('[data-layer]').forEach(function (button) {
      button.classList.toggle('is-active', button.getAttribute('data-layer') === state.activeLayer);
    });
  }

  function renderOperatorPanels() {
    var designing = state.kernelPhase === 'designOpposite';
    var usingDesignedKernel = state.kernelPhase === 'scanOpposite' || state.kernelPhase === 'complete';
    var hasDesignInput = state.designKernel.some(function (row) {
      return row.some(function (value) { return value === 1; });
    });
    $('designExplain').hidden = !designing;
    $('searchCallout').hidden = designing;
    $('patchPanel').hidden = designing;
    $('operatorWorkspace').classList.toggle('is-designing', designing);
    $('presetKernelPanel').hidden = designing || usingDesignedKernel;
    $('designKernelPanel').hidden = !(designing || usingDesignedKernel);
    $('designKernelPanel').classList.toggle('is-designing-only', designing);
    $('designKernelPanel').classList.toggle('has-input', hasDesignInput);
    $('designKernelTask').hidden = !designing;
    $('designedKernelTitle').hidden = designing;
    $('designGrid').setAttribute('aria-label', designing ? '可编辑的五乘五算子' : '已设计的五乘五算子');
    if (designing) $('designGrid').setAttribute('aria-describedby', 'designKernelHint');
    else $('designGrid').removeAttribute('aria-describedby');
    $('designKernelHint').textContent = '悬浮方格会临时切换 0/1（1 会变 0），点击才会保存。观察左侧图像，想一想算子应该怎样排列。';
    $('activationValue').closest('.ck-activation-row').hidden = designing;
    $('operatorReadout').hidden = designing;
    $('tryPatternBtn').hidden = true;
    $('calcPopover').hidden = true;
  }

  function renderBinaryGrid() {
    var host = $('binaryGrid');
    host.replaceChildren();
    var designing = state.kernelPhase === 'designOpposite';
    host.classList.toggle('is-locked', designing);
    var player = state.activeLayer === 'winner' ? state.winner : loser();
    var winKeys = {};
    state.winLine.forEach(function (cell) { winKeys[cell.row + ':' + cell.col] = true; });
    var top = state.scanPosition.row;
    var left = state.scanPosition.col;
    for (var row = 0; row < IMAGE_SIZE; row += 1) {
      for (var col = 0; col < IMAGE_SIZE; col += 1) {
        var source = displayToBoardCell(row, col);
        var onBoard = inBounds(source.row, source.col);
        var value = onBoard && state.board[source.row][source.col] === player ? 1 : 0;
        var localRow = row - top;
        var localCol = col - left;
        var inWindow = localRow >= 0 && localRow < 5 && localCol >= 0 && localCol < 5;
        var kernelHit = !designing && inWindow && value && state.currentKernel[localRow][localCol] === 1;
        var cell = document.createElement('span');
        cell.className = 'ck-binary-cell' +
          (value ? ' is-one' : '') +
          (!designing && inWindow ? ' is-window' : '') +
          (!designing && inWindow && localRow === 2 && localCol === 2 ? ' is-window-center' : '') +
          (kernelHit ? ' is-kernel-hit' : '') +
          (value && onBoard && winKeys[source.row + ':' + source.col] ? ' is-win' : '') +
          (!onBoard ? ' is-padding' : '');
        cell.dataset.row = String(row);
        cell.dataset.col = String(col);
        cell.textContent = String(value);
        host.appendChild(cell);
      }
    }
  }

  function renderKernelGrid(id, matrix, editable, hitByKernel) {
    var host = $(id);
    host.replaceChildren();
    host.classList.toggle('ck-kernel-grid--input', id === 'patchGrid');
    host.classList.toggle('ck-kernel-grid--editable', editable && state.kernelPhase === 'designOpposite');
    matrix.forEach(function (row, rowIndex) {
      row.forEach(function (value, colIndex) {
        var cell = document.createElement('button');
        if (!editable) {
          cell = document.createElement('span');
        }
        cell.className = 'ck-kernel-cell' + (value ? ' is-one' : '');
        if (hitByKernel && value && state.currentKernel[rowIndex][colIndex]) cell.classList.add('is-hit');
        cell.textContent = String(value);
        if (editable) {
          cell.type = 'button';
          cell.disabled = state.kernelPhase !== 'designOpposite';
          cell.setAttribute('aria-label', '第 ' + (rowIndex + 1) + ' 行第 ' + (colIndex + 1) + ' 列，当前为 ' + value + '，点击切换为 ' + (value ? 0 : 1));
          var isHovered = false;
          var isFocused = false;
          var syncPreview = function () {
            var previewing = state.kernelPhase === 'designOpposite' && (isHovered || isFocused);
            cell.textContent = String(previewing ? (value ? 0 : 1) : value);
            cell.classList.toggle('is-preview-one', previewing && value === 0);
            cell.classList.toggle('is-preview-zero', previewing && value === 1);
          };
          cell.addEventListener('mouseenter', function () { isHovered = true; syncPreview(); });
          cell.addEventListener('mouseleave', function () { isHovered = false; syncPreview(); });
          cell.addEventListener('focus', function () { isFocused = true; syncPreview(); });
          cell.addEventListener('blur', function () { isFocused = false; syncPreview(); });
          cell.addEventListener('click', function () {
            if (state.kernelPhase !== 'designOpposite') return;
            state.designKernel[rowIndex][colIndex] = state.designKernel[rowIndex][colIndex] ? 0 : 1;
            state.currentKernel = cloneMatrix(state.designKernel);
            if (matrixEquals(state.designKernel, targetOppositeKernel())) {
              state.kernelPhase = 'scanOpposite';
              state.scanPosition = { row: 0, col: 0 };
              state.bestActivation = -Infinity;
              state.foundMaxActivation = false;
            } else if (state.kernelPhase !== 'complete') {
              state.kernelPhase = 'designOpposite';
            }
            renderDesignGrid();
            renderMatrixStage();
          });
        }
        host.appendChild(cell);
      });
    });
  }

  function renderDesignGrid() {
    renderKernelGrid('designGrid', state.designKernel, true);
  }

  function currentPatchMatrix() {
    var topLeft = state.scanPosition || { row: 0, col: 0 };
    var player = state.activeLayer === 'winner' ? state.winner : loser();
    return Array.from({ length: 5 }, function (_, row) {
      return Array.from({ length: 5 }, function (_, col) {
        var displayRow = topLeft.row + row;
        var displayCol = topLeft.col + col;
        var source = displayToBoardCell(displayRow, displayCol);
        return inBounds(source.row, source.col) && state.board[source.row][source.col] === player ? 1 : 0;
      });
    });
  }

  function dotProduct(a, b) {
    var sum = 0;
    for (var row = 0; row < 5; row += 1) {
      for (var col = 0; col < 5; col += 1) sum += a[row][col] * b[row][col];
    }
    return sum;
  }

  function activationAt(top, left, kernel) {
    var player = state.activeLayer === 'winner' ? state.winner : loser();
    var sum = 0;
    for (var row = 0; row < 5; row += 1) {
      for (var col = 0; col < 5; col += 1) {
        var source = displayToBoardCell(top + row, left + col);
        var input = inBounds(source.row, source.col) && state.board[source.row][source.col] === player ? 1 : 0;
        sum += input * kernel[row][col];
      }
    }
    return sum;
  }

  function maxActivation() {
    var max = -Infinity;
    for (var row = 0; row <= IMAGE_SIZE - 5; row += 1) {
      for (var col = 0; col <= IMAGE_SIZE - 5; col += 1) {
        max = Math.max(max, activationAt(row, col, state.currentKernel));
      }
    }
    return Number.isFinite(max) ? max : 0;
  }

  function updateOperatorReadout() {
    var patch = currentPatchMatrix();
    var sum = dotProduct(state.currentKernel, patch);
    var max = maxActivation();
    var canScan = state.kernelPhase !== 'designOpposite';
    if (canScan && sum > state.bestActivation) state.bestActivation = sum;
    var readout = $('operatorReadout');
    $('activationValue').textContent = String(sum);
    renderMultiplyGrid(state.currentKernel, patch, sum);
    readout.classList.toggle('is-correct', canScan && state.foundMaxActivation);
    setOperatorReadoutTone(canScan && state.foundMaxActivation);
    if (state.kernelPhase === 'scanOriginal') {
      if (sum === max && max > 0) {
        state.foundMaxActivation = true;
        readout.classList.add('is-correct');
        setOperatorReadoutTone(true);
        $('tryPatternBtn').hidden = false;
        readout.textContent = '找到了。激活值达到 ' + max + '。';
      } else {
        $('tryPatternBtn').hidden = true;
        readout.textContent = '拖动橙色窗口，继续寻找激活值更高的位置。';
      }
      return;
    }
    $('tryPatternBtn').hidden = true;
    if (state.kernelPhase === 'designOpposite') {
      readout.textContent = '观察图像中 1 的排列，再调整 5 × 5 小矩阵。';
      return;
    }
    if (state.kernelPhase === 'scanOpposite') {
      if (sum === max && max > 0) {
        state.foundMaxActivation = true;
        state.kernelPhase = 'complete';
        readout.classList.add('is-correct');
        setOperatorReadoutTone(true);
        readout.textContent = '完成。新算子也找到了最大激活值 ' + max + '。现在可以切换赢家图和输家图。';
        showLayerSwitchAndContinueCue();
      } else {
        readout.textContent = '反向算子已经生效。继续拖动，寻找激活值最大的区域。';
      }
      return;
    }
    readout.textContent = state.kernelQuestionPassed
      ? '你已经完成这一幕。可以切换赢家图和输家图，再向下进入下一幕。'
      : '你已经完成算子实验。请回答下方的单选题，再进入下一幕。';
  }

  function setOperatorReadoutTone(correct) {
    var readout = $('operatorReadout');
    readout.classList.toggle('edu-notice-strip--green', !!correct);
    readout.classList.toggle('edu-notice-strip--orange', !correct);
  }

  function renderMultiplyGrid(kernel, patch, sum) {
    var host = $('multiplyGrid');
    host.replaceChildren();
    for (var row = 0; row < 5; row += 1) {
      for (var col = 0; col < 5; col += 1) {
        var product = kernel[row][col] * patch[row][col];
        var cell = document.createElement('span');
        var value = document.createElement('b');
        var factors = document.createElement('em');
        cell.className = 'ck-multiply-cell' + (product ? ' is-active' : '');
        value.textContent = String(product);
        factors.textContent = kernel[row][col] + '×' + patch[row][col];
        cell.appendChild(value);
        cell.appendChild(factors);
        host.appendChild(cell);
      }
    }
    $('sumLine').textContent = 'Σ Mij × Xij = ' + sum;
  }

  function matrixEquals(a, b) {
    for (var row = 0; row < 5; row += 1) {
      for (var col = 0; col < 5; col += 1) {
        if (a[row][col] !== b[row][col]) return false;
      }
    }
    return true;
  }

  function loser() {
    if (state.winner === HUMAN) return AI;
    if (state.winner === AI) return HUMAN;
    return EMPTY;
  }

  function winDirection() {
    if (state.winLine.length < 2) return { dr: 0, dc: 1 };
    var first = state.winLine[0];
    var second = state.winLine[1];
    return {
      dr: Math.sign(second.row - first.row),
      dc: Math.sign(second.col - first.col),
    };
  }

  function winDirectionLabel() {
    var dir = winDirection();
    if (dir.dr === 0) return '横向';
    if (dir.dc === 0) return '竖向';
    if (dir.dr === dir.dc) return '左上到右下斜线';
    return '右上到左下斜线';
  }

  function kernelForWinDirection() {
    var dir = winDirection();
    if (dir.dr === 0) return horizontalKernel();
    if (dir.dc === 0) return verticalKernel();
    if (dir.dr === dir.dc) return mainDiagonalKernel();
    return antiDiagonalKernel();
  }

  function targetOppositeKernel() {
    var dir = winDirection();
    if (dir.dr === 0 || dir.dc === 0) return rotateClockwise(state.baseKernel);
    return flipHorizontal(state.baseKernel);
  }

  function transformForWinDirection() {
    var dir = winDirection();
    return dir.dr === 0 || dir.dc === 0 ? 'rotate' : 'flip';
  }

  function transformActionText() {
    return transformForWinDirection() === 'rotate' ? '旋转一次' : '左右翻转';
  }

  function displayToBoardCell(row, col) {
    var innerRow = row - IMAGE_PADDING;
    var innerCol = col - IMAGE_PADDING;
    if (state.imageTransform === 'flip') {
      return { row: innerRow, col: BOARD_SIZE - 1 - innerCol };
    }
    if (state.imageTransform === 'rotate') {
      return { row: BOARD_SIZE - 1 - innerCol, col: innerRow };
    }
    return { row: innerRow, col: innerCol };
  }

  function enterDesignPhase() {
    if (state.kernelPhase !== 'scanOriginal') return;
    state.kernelPhase = 'designOpposite';
    state.imageTransform = transformForWinDirection();
    state.currentKernel = cloneMatrix(state.designKernel);
    state.scanPosition = { row: 0, col: 0 };
    state.bestActivation = -Infinity;
    state.foundMaxActivation = false;
    setProgress('operator');
    renderMatrixStage();
  }

  function showCalcPopover() {
    var button = $('calcProcessBtn');
    var popover = $('calcPopover');
    var card = button.closest('.ck-operator-card');
    if (calcHideTimer) window.clearTimeout(calcHideTimer);
    calcHideTimer = 0;
    popover.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    positionCalcPopover();
    if (card) card.classList.add('is-showing-popover');
  }

  function hideCalcPopover() {
    var button = $('calcProcessBtn');
    var popover = $('calcPopover');
    var card = button.closest('.ck-operator-card');
    popover.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    if (card) card.classList.remove('is-showing-popover');
  }

  function scheduleHideCalcPopover() {
    if (calcHideTimer) window.clearTimeout(calcHideTimer);
    calcHideTimer = window.setTimeout(hideCalcPopover, 120);
  }

  function toggleCalcPopover() {
    if ($('calcPopover').hidden) showCalcPopover();
    else hideCalcPopover();
  }

  function positionCalcPopover() {
    var button = $('calcProcessBtn');
    var popover = $('calcPopover');
    var card = button.closest('.ck-operator-card');
    if (popover.hidden || !card) return;
    popover.style.left = '0px';
    popover.style.top = '0px';
    var cardRect = card.getBoundingClientRect();
    var buttonRect = button.getBoundingClientRect();
    var gap = 8;
    popover.style.maxHeight = Math.max(180, cardRect.height - gap * 2) + 'px';
    var popRect = popover.getBoundingClientRect();
    var left = buttonRect.right - cardRect.left - popRect.width;
    var top = buttonRect.bottom - cardRect.top + gap;
    left = clamp(left, gap, Math.max(gap, cardRect.width - popRect.width - gap));
    if (top + popRect.height > cardRect.height - gap) {
      top = buttonRect.top - cardRect.top - popRect.height - gap;
    }
    top = clamp(top, gap, Math.max(gap, cardRect.height - popRect.height - gap));
    popover.style.left = left + 'px';
    popover.style.top = top + 'px';
  }

  function showLayerSwitchAndContinueCue() {
    renderLayerButtons();
    $('kernelEffectQuestion').hidden = false;
    window.requestAnimationFrame(function () {
      $('kernelEffectQuestion').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function mountKernelEffectQuestion() {
    kernelEffectQuestion = window.DLModuleUI.mountQuestion('#kernelEffectQuestionMount', {
      type: 'choice',
      typeLabel: '单选题',
      title: '不同的算子，有什么不同的效果？',
      options: [
        { key: 'A', value: 'brightness-only', label: '只改变输出数值的范围。' },
        { key: 'B', value: 'position-only', label: '让同一特征出现在不同位置。' },
        { key: 'C', value: 'spatial-pattern', label: '突出不同方向或形状的特征。' },
        { key: 'D', value: 'same-sum', label: '权重总和相同，效果就相同。' },
      ],
      answer: 'spatial-pattern',
      feedback: {
        correct: '正确。不同算子会突出不同的局部特征。',
        wrong: '再想想：算子的排列不同，关注的局部特征也不同。',
      },
      onCheck: function (result) {
        if (!result.ok || state.kernelQuestionPassed) return;
        state.kernelQuestionPassed = true;
        kernelEffectQuestion.root.querySelectorAll('.dl-question-option').forEach(function (button) {
          button.disabled = true;
        });
        if (!state.continueCueShown) window.setTimeout(armScrollFlow, 320);
      },
    });
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
    if (scrollAnimationFrame) window.cancelAnimationFrame(scrollAnimationFrame);
    var startedAt = window.performance.now();
    function step(now) {
      var progress = Math.min(1, (now - startedAt) / duration);
      window.scrollTo(0, startY + (targetY - startY) * easeInOutCubic(progress));
      if (progress < 1) scrollAnimationFrame = window.requestAnimationFrame(step);
      else scrollAnimationFrame = 0;
    }
    scrollAnimationFrame = window.requestAnimationFrame(step);
  }

  function armScrollFlow() {
    state.continueCueShown = true;
    scrollInteractionArmed = true;
    $('scrollFlowArea').hidden = false;
    $('scrollFlowArea').setAttribute('aria-hidden', 'false');
    $('scrollIndicator').hidden = false;
  }

  function resetScrollFlow() {
    scrollInteractionArmed = false;
    state.continueCueShown = false;
    $('scrollIndicator').hidden = true;
    $('scrollFlowArea').hidden = true;
    $('scrollFlowArea').setAttribute('aria-hidden', 'true');
    $('mnistStage').classList.remove('is-revealing');
  }

  function confirmScrollFlow() {
    if (!scrollInteractionArmed || !$('mnistStage').hidden) return;
    scrollInteractionArmed = false;
    $('scrollIndicator').hidden = true;
    showMnistStage();
  }

  function handleScrollFlowWheel(event) {
    if (event.deltaY > 0) confirmScrollFlow();
  }

  function setProgress(current) {
    var order = ['game', 'answer', 'matrix', 'operator', 'mnist'];
    var currentIndex = order.indexOf(current);
    document.querySelectorAll('[data-progress]').forEach(function (item) {
      var key = item.getAttribute('data-progress');
      var index = order.indexOf(key);
      item.classList.toggle('is-current', key === current);
      item.classList.toggle('is-done', index >= 0 && currentIndex >= 0 && index < currentIndex);
      if (key === current) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
  }

  function setScanFromGridEvent(event) {
    var grid = $('binaryGrid');
    var rect = grid.getBoundingClientRect();
    var x = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 0.9999);
    var y = clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 0.9999);
    var col = Math.floor(x * IMAGE_SIZE);
    var row = Math.floor(y * IMAGE_SIZE);
    state.scanPosition = {
      row: clamp(row - 2, 0, IMAGE_SIZE - 5),
      col: clamp(col - 2, 0, IMAGE_SIZE - 5),
    };
    renderMatrixStage();
  }

  function showMnistStage() {
    hideRelatedResources();
    $('mnistStage').hidden = false;
    $('mnistStage').setAttribute('aria-hidden', 'false');
    $('mnistStage').classList.add('is-revealing');
    $('mnistStage').addEventListener('animationend', function () {
      $('mnistStage').classList.remove('is-revealing');
    }, { once: true });
    setProgress('mnist');
    if (!state.mnistStarted) {
      state.mnistStarted = true;
      state.mnistKernelKey = 'user';
      state.mnistKernelUnlocked = false;
      $('mnistKernelTabs').hidden = true;
      chooseRandomDigit();
    } else {
      replayConvolution();
    }
    window.requestAnimationFrame(function () { scrollToElement($('mnistStage'), 520); });
  }

  function chooseRandomDigit() {
    var next = MNIST_SAMPLES[Math.floor(Math.random() * MNIST_SAMPLES.length)];
    if (MNIST_SAMPLES.length > 1 && next === state.mnistSample) return chooseRandomDigit();
    loadMnistSample(next);
  }

  function loadMnistSample(path) {
    stopMnistAnimation();
    hideRelatedResources();
    state.mnistSample = path;
    $('digitLabel').textContent = path.split('/')[2] || '-';
    $('convStatusText').textContent = '正在加载数字';
    var image = new Image();
    image.onload = function () {
      state.mnistPixels = imageToMnistPixels(image);
      prepareMnistFeatureMap();
      replayConvolution();
    };
    image.onerror = function () {
      $('convStatusText').textContent = '图片加载失败';
    };
    image.src = '../../' + path;
  }

  function imageToMnistPixels(image) {
    var scratch = document.createElement('canvas');
    scratch.width = 28;
    scratch.height = 28;
    var ctx = scratch.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 28, 28);
    ctx.drawImage(image, 0, 0, 28, 28);
    var data = ctx.getImageData(0, 0, 28, 28).data;
    var pixels = [];
    for (var row = 0; row < 28; row += 1) {
      var line = [];
      for (var col = 0; col < 28; col += 1) {
        var index = (row * 28 + col) * 4;
        line.push(data[index] / 255);
      }
      pixels.push(line);
    }
    return pixels;
  }

  function prepareMnistFeatureMap() {
    hideRelatedResources();
    state.mnistStep = 0;
    state.mnistFeatureValues = [];
    var kernel = currentMnistKernel();
    var outputSize = 28 - kernel.length + 1;
    for (var row = 0; row < outputSize; row += 1) {
      for (var col = 0; col < outputSize; col += 1) {
        state.mnistFeatureValues.push(convolveMnistAt(row, col, kernel));
      }
    }
    updateMnistKernelTabs();
    renderFeatureMapSkeleton();
    drawDigitCanvas(0, 0);
    $('convPosition').textContent = '00,00';
    $('convValue').textContent = '0.00';
  }

  function convolveMnistAt(top, left, kernel) {
    var sum = 0;
    for (var row = 0; row < kernel.length; row += 1) {
      for (var col = 0; col < kernel.length; col += 1) {
        sum += state.mnistPixels[top + row][left + col] * kernel[row][col];
      }
    }
    return sum;
  }

  function currentMnistKernel() {
    if (state.mnistKernelKey === 'user') return cloneMatrix(state.designKernel);
    if (state.mnistKernelKey === 'custom') return cloneMatrix(state.mnistCustomKernel);
    return cloneMatrix(MNIST_KERNELS[state.mnistKernelKey].matrix);
  }

  function updateMnistKernelTabs() {
    $('mnistKernelTabs').hidden = !state.mnistKernelUnlocked;
    document.querySelectorAll('[data-mnist-kernel]').forEach(function (button) {
      button.classList.toggle('is-active', button.getAttribute('data-mnist-kernel') === state.mnistKernelKey);
    });
    var labels = { user: '你设计的 5 x 5 核', custom: '自定义核' };
    $('mnistHint').textContent = '正在使用：' + (labels[state.mnistKernelKey] || MNIST_KERNELS[state.mnistKernelKey].label) + '。滑动窗口会逐像素生成右侧特征图。';
  }

  function renderFeatureMapSkeleton() {
    var host = $('featureMap');
    host.replaceChildren();
    host.classList.remove('is-interactive');
    var outputSize = outputFeatureSize();
    host.style.gridTemplateColumns = 'repeat(' + outputSize + ', minmax(0, 1fr))';
    for (var index = 0; index < outputSize * outputSize; index += 1) {
      var row = Math.floor(index / outputSize);
      var col = index % outputSize;
      var cell = document.createElement('button');
      cell.type = 'button';
      cell.disabled = true;
      cell.className = 'ck-feature-pixel';
      cell.dataset.index = String(index);
      cell.setAttribute('aria-label', '第 ' + (col + 1) + ' 列，第 ' + (row + 1) + ' 行；扫描完成后可查看响应');
      host.appendChild(cell);
    }
  }

  function replayConvolution() {
    if (!state.mnistPixels.length) return;
    stopMnistAnimation();
    prepareMnistFeatureMap();
    $('convStatusText').textContent = '滑动窗口正在扫描';
    stepConvolution();
  }

  function stepConvolution() {
    var outputSize = outputFeatureSize();
    if (state.mnistStep >= outputSize * outputSize) {
      enableFeatureMapInteraction();
      $('convStatusText').textContent = '扫描完成，点击特征图方格查看对应响应';
      if (!state.mnistKernelUnlocked) {
        state.mnistKernelUnlocked = true;
        updateMnistKernelTabs();
        $('convStatusText').textContent = '第一次扫描完成，可以切换卷积核，也可以点击方格查看响应';
      }
      stopMnistAnimation();
      revealRelatedResources();
      return;
    }
    var index = state.mnistStep;
    var row = Math.floor(index / outputSize);
    var col = index % outputSize;
    var value = state.mnistFeatureValues[index];
    showMnistResponse(index, row, col, value);
    state.mnistStep += 1;
    state.mnistTimer = window.setTimeout(stepConvolution, 16);
  }

  function stopMnistAnimation() {
    if (state.mnistTimer) {
      window.clearTimeout(state.mnistTimer);
      state.mnistTimer = 0;
    }
  }

  function paintFeaturePixel(index, value) {
    var cell = $('featureMap').children[index];
    if (!cell) return;
    document.querySelectorAll('.ck-feature-pixel.is-current').forEach(function (item) {
      item.classList.remove('is-current');
    });
    cell.classList.add('is-current');
    cell.style.background = featureColor(value);
    cell.title = '响应强度 ' + Math.abs(value).toFixed(3);
  }

  function showMnistResponse(index, row, col, value) {
    drawDigitCanvas(row, col);
    paintFeaturePixel(index, value);
    $('convPosition').textContent = String(col + 1).padStart(2, '0') + ',' + String(row + 1).padStart(2, '0');
    $('convValue').textContent = Math.abs(value).toFixed(2);
  }

  function enableFeatureMapInteraction() {
    var outputSize = outputFeatureSize();
    $('featureMap').classList.add('is-interactive');
    Array.prototype.forEach.call($('featureMap').children, function (cell, index) {
      var row = Math.floor(index / outputSize);
      var col = index % outputSize;
      var value = state.mnistFeatureValues[index];
      cell.disabled = false;
      cell.setAttribute('aria-label', '第 ' + (col + 1) + ' 列，第 ' + (row + 1) + ' 行，响应强度 ' + Math.abs(value).toFixed(2));
    });
  }

  function featureColor(value) {
    var maxAbs = state.mnistFeatureValues.reduce(function (max, item) {
      return Math.max(max, Math.abs(item));
    }, 0) || 1;
    var alpha = clamp(Math.abs(value) / maxAbs, 0.08, 1);
    return 'rgba(39, 68, 110, ' + alpha.toFixed(3) + ')';
  }

  function drawDigitCanvas(windowRow, windowCol) {
    var digitCanvas = $('digitCanvas');
    var ctx = digitCanvas.getContext('2d');
    var scale = digitCanvas.width / 28;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#101623';
    ctx.fillRect(0, 0, digitCanvas.width, digitCanvas.height);
    for (var row = 0; row < 28; row += 1) {
      for (var col = 0; col < 28; col += 1) {
        var value = state.mnistPixels[row] ? state.mnistPixels[row][col] : 0;
        var shade = Math.round(value * 255);
        ctx.fillStyle = 'rgb(' + shade + ',' + shade + ',' + shade + ')';
        ctx.fillRect(col * scale, row * scale, scale, scale);
      }
    }
    ctx.strokeStyle = '#f07e47';
    ctx.lineWidth = Math.max(2, scale * 0.25);
    var kernelSize = currentMnistKernel().length;
    ctx.strokeRect(windowCol * scale + 1, windowRow * scale + 1, scale * kernelSize - 2, scale * kernelSize - 2);
  }

  function outputFeatureSize() {
    return 28 - currentMnistKernel().length + 1;
  }

  function hideRelatedResources() {
    var section = $('relatedResources');
    if (!section) return;
    section.hidden = true;
    section.classList.remove('is-revealing');
  }

  function revealRelatedResources() {
    var section = $('relatedResources');
    if (!section || !section.hidden) return;
    section.hidden = false;
    section.classList.add('is-revealing');
    section.addEventListener('animationend', function () {
      section.classList.remove('is-revealing');
    }, { once: true });
  }

  function renderRelatedVideoBar() {
    var host = $('kernelRelatedVideos');
    if (!host || !window.DLModuleUI) return;
    host.innerHTML = window.DLModuleUI.renderRelatedVideos([
      {
        title: '从“卷积”、到“图像卷积操作”、再到“卷积神经网络”，“卷积”意义的3次改变',
        embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=418492547&bvid=BV1VV411478E&cid=353587154&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
      },
      {
        title: '【官方双语】那么……什么是卷积？',
        embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=391585555&bvid=BV1Vd4y1e7pj&cid=931763043&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
      },
      {
        title: '所有的卷积神经网络动画都是错的！除了这个动画',
        embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=486552336&bvid=BV16N411y7cV&cid=1140750257&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
      },
    ], {
      showHeader: false,
      ariaLabel: '卷积核入门推荐视频',
    });
  }

  function showMnistKernelPopover(button) {
    if (mnistHideTimer) window.clearTimeout(mnistHideTimer);
    mnistHideTimer = 0;
    var key = button.getAttribute('data-mnist-kernel') || 'user';
    var popover = $('mnistKernelPopover');
    popover.replaceChildren();
    if (key === 'custom') renderCustomKernelEditor(popover);
    else renderKernelPreview(popover, key);
    popover.hidden = false;
    positionInsideCard(button, popover, button.closest('.ck-mnist-card'));
  }

  function hideMnistKernelPopover() {
    $('mnistKernelPopover').hidden = true;
  }

  function scheduleHideMnistKernelPopover() {
    if (mnistHideTimer) window.clearTimeout(mnistHideTimer);
    mnistHideTimer = window.setTimeout(hideMnistKernelPopover, 140);
  }

  function renderKernelPreview(host, key) {
    var title = document.createElement('h4');
    var kernel = key === 'user' ? cloneMatrix(state.designKernel) : cloneMatrix(MNIST_KERNELS[key].matrix);
    title.textContent = key === 'user' ? '你刚刚设计的 5 x 5 核' : MNIST_KERNELS[key].label + '卷积核';
    host.appendChild(title);
    host.appendChild(kernelPreviewGrid(kernel));
  }

  function renderCustomKernelEditor(host) {
    var title = document.createElement('h4');
    var controls = document.createElement('div');
    var control = document.createElement('div');
    var sizeLabel = document.createElement('span');
    var selectbox = document.createElement('div');
    var trigger = document.createElement('button');
    var valueNode = document.createElement('span');
    var menu = document.createElement('div');
    var hiddenInput = document.createElement('input');
    title.textContent = '自定义卷积核';
    controls.className = 'ck-custom-controls';
    control.className = 'edu-control';
    sizeLabel.className = 'edu-label';
    sizeLabel.id = 'customKernelSizeLabel';
    sizeLabel.textContent = '核大小';
    selectbox.className = 'edu-selectbox';
    selectbox.setAttribute('data-dl-selectbox', '');
    trigger.className = 'edu-selectbox-trigger';
    trigger.type = 'button';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', 'customKernelSizeMenu');
    trigger.setAttribute('aria-labelledby', 'customKernelSizeLabel customKernelSizeValue');
    valueNode.id = 'customKernelSizeValue';
    valueNode.setAttribute('data-selectbox-value', '');
    valueNode.textContent = state.mnistCustomKernel.length + ' × ' + state.mnistCustomKernel.length;
    trigger.appendChild(valueNode);
    menu.className = 'edu-selectbox-menu';
    menu.id = 'customKernelSizeMenu';
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-labelledby', 'customKernelSizeLabel');
    menu.hidden = true;
    [3, 5].forEach(function (size) {
      var option = document.createElement('button');
      option.className = 'edu-selectbox-option';
      option.type = 'button';
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', state.mnistCustomKernel.length === size ? 'true' : 'false');
      option.setAttribute('data-value', String(size));
      option.textContent = size + ' × ' + size;
      menu.appendChild(option);
    });
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'customKernelSize';
    hiddenInput.value = String(state.mnistCustomKernel.length);
    hiddenInput.addEventListener('change', function () {
      resizeCustomKernel(Number(hiddenInput.value));
      showMnistKernelPopover(document.querySelector('[data-mnist-kernel="custom"]'));
      if (state.mnistKernelKey === 'custom' && state.mnistPixels.length) replayConvolution();
    });
    selectbox.appendChild(trigger);
    selectbox.appendChild(menu);
    selectbox.appendChild(hiddenInput);
    control.appendChild(sizeLabel);
    control.appendChild(selectbox);
    controls.appendChild(control);
    host.appendChild(title);
    host.appendChild(controls);
    host.appendChild(customKernelGrid());
    window.DLModuleUI.bindSelectbox(selectbox);
  }

  function kernelPreviewGrid(kernel) {
    var grid = document.createElement('div');
    grid.className = 'ck-conv-kernel ck-conv-kernel--popover';
    grid.style.gridTemplateColumns = 'repeat(' + kernel.length + ', minmax(0, 1fr))';
    kernel.forEach(function (row) {
      row.forEach(function (value) {
        var cell = document.createElement('span');
        cell.className = value > 0 ? 'is-positive' : value < 0 ? 'is-negative' : '';
        cell.textContent = String(value);
        grid.appendChild(cell);
      });
    });
    return grid;
  }

  function customKernelGrid() {
    var grid = document.createElement('div');
    grid.className = 'ck-custom-kernel-grid';
    grid.style.gridTemplateColumns = 'repeat(' + state.mnistCustomKernel.length + ', minmax(0, 1fr))';
    state.mnistCustomKernel.forEach(function (row, rowIndex) {
      row.forEach(function (value, colIndex) {
        var input = document.createElement('input');
        input.type = 'number';
        input.step = '1';
        input.min = '-9';
        input.max = '9';
        input.value = String(value);
        input.addEventListener('input', function () {
          state.mnistCustomKernel[rowIndex][colIndex] = Number(input.value) || 0;
          if (state.mnistKernelKey === 'custom' && state.mnistPixels.length) replayConvolution();
        });
        grid.appendChild(input);
      });
    });
    return grid;
  }

  function resizeCustomKernel(size) {
    var old = state.mnistCustomKernel;
    var next = Array.from({ length: size }, function (_, row) {
      return Array.from({ length: size }, function (_, col) {
        return old[row] && Number.isFinite(old[row][col]) ? old[row][col] : 0;
      });
    });
    var center = Math.floor(size / 2);
    if (!next.some(function (row) { return row.some(function (value) { return value !== 0; }); })) next[center][center] = 1;
    state.mnistCustomKernel = next;
  }

  function positionInsideCard(button, popover, card) {
    if (!card) return;
    popover.style.left = '0px';
    popover.style.top = '0px';
    var cardRect = card.getBoundingClientRect();
    var buttonRect = button.getBoundingClientRect();
    var popRect = popover.getBoundingClientRect();
    var gap = 8;
    var left = buttonRect.right - cardRect.left - popRect.width;
    var top = buttonRect.bottom - cardRect.top + gap;
    left = clamp(left, gap, Math.max(gap, cardRect.width - popRect.width - gap));
    if (top + popRect.height > cardRect.height - gap) top = buttonRect.top - cardRect.top - popRect.height - gap;
    top = clamp(top, gap, Math.max(gap, cardRect.height - popRect.height - gap));
    popover.style.left = left + 'px';
    popover.style.top = top + 'px';
  }

  canvas.addEventListener('pointermove', function (event) {
    var cell = pointToCell(event);
    state.hover = cell && state.board[cell.row][cell.col] === EMPTY ? cell : null;
    drawBoard();
  });

  canvas.addEventListener('pointerleave', function () {
    state.hover = null;
    drawBoard();
  });

  canvas.addEventListener('pointerdown', function (event) {
    var cell = pointToCell(event);
    if (!cell) return;
    event.preventDefault();
    handleHumanMove(cell.row, cell.col);
  });

  $('resetBtn').addEventListener('click', resetGame);
  $('undoBtn').addEventListener('click', undoPair);
  $('demoWinBtn').addEventListener('click', useDemoWin);
  $('tryPatternBtn').addEventListener('click', enterDesignPhase);
  $('calcProcessBtn').addEventListener('click', toggleCalcPopover);
  $('calcProcessBtn').addEventListener('mouseenter', showCalcPopover);
  $('calcProcessBtn').addEventListener('focus', showCalcPopover);
  $('calcProcessBtn').addEventListener('mouseleave', scheduleHideCalcPopover);
  $('calcProcessBtn').addEventListener('blur', hideCalcPopover);
  $('calcPopover').addEventListener('mouseenter', showCalcPopover);
  $('calcPopover').addEventListener('mouseleave', scheduleHideCalcPopover);
  window.addEventListener('resize', positionCalcPopover);
  $('randomDigitBtn').addEventListener('click', chooseRandomDigit);
  $('replayConvBtn').addEventListener('click', replayConvolution);
  $('featureMap').addEventListener('click', function (event) {
    var cell = event.target.closest('.ck-feature-pixel');
    if (!cell || cell.disabled || !$('featureMap').contains(cell)) return;
    var index = Number(cell.dataset.index);
    var outputSize = outputFeatureSize();
    if (!Number.isInteger(index) || index < 0 || index >= state.mnistFeatureValues.length) return;
    var row = Math.floor(index / outputSize);
    var col = index % outputSize;
    showMnistResponse(index, row, col, state.mnistFeatureValues[index]);
    $('convStatusText').textContent = '已选中第 ' + (col + 1) + ' 列、第 ' + (row + 1) + ' 行的响应';
  });
  document.querySelectorAll('[data-mnist-kernel]').forEach(function (button) {
    button.addEventListener('click', function () {
      state.mnistKernelKey = button.getAttribute('data-mnist-kernel') || 'vertical';
      if (state.mnistPixels.length) replayConvolution();
      else updateMnistKernelTabs();
    });
    button.addEventListener('mouseenter', function () { showMnistKernelPopover(button); });
    button.addEventListener('focus', function () { showMnistKernelPopover(button); });
    button.addEventListener('mouseleave', scheduleHideMnistKernelPopover);
    button.addEventListener('blur', scheduleHideMnistKernelPopover);
  });
  $('mnistKernelPopover').addEventListener('mouseenter', function () {
    if (mnistHideTimer) window.clearTimeout(mnistHideTimer);
    mnistHideTimer = 0;
  });
  $('mnistKernelPopover').addEventListener('mouseleave', scheduleHideMnistKernelPopover);
  $('scrollIndicator').addEventListener('click', confirmScrollFlow);
  window.addEventListener('wheel', handleScrollFlowWheel, { passive: true });
  $('binaryGrid').addEventListener('pointerdown', function (event) {
    if (state.kernelPhase === 'designOpposite') return;
    state.draggingKernel = true;
    $('binaryGrid').classList.add('is-dragging');
    $('binaryGrid').setPointerCapture(event.pointerId);
    setScanFromGridEvent(event);
  });
  $('binaryGrid').addEventListener('pointermove', function (event) {
    if (!state.draggingKernel) return;
    setScanFromGridEvent(event);
  });
  $('binaryGrid').addEventListener('pointerup', function (event) {
    state.draggingKernel = false;
    $('binaryGrid').classList.remove('is-dragging');
    if ($('binaryGrid').hasPointerCapture && $('binaryGrid').hasPointerCapture(event.pointerId)) {
      $('binaryGrid').releasePointerCapture(event.pointerId);
    }
  });
  $('binaryGrid').addEventListener('pointercancel', function () {
    state.draggingKernel = false;
    $('binaryGrid').classList.remove('is-dragging');
  });
  document.querySelectorAll('[data-layer]').forEach(function (button) {
    button.addEventListener('click', function () {
      if (state.kernelPhase !== 'complete') return;
      state.activeLayer = button.getAttribute('data-layer') || 'winner';
      renderMatrixStage();
    });
  });

  window.DLCanvas.observe(canvas, function () {
    drawBoard();
  });

  mountWinQuestion();
  mountKernelEffectQuestion();
  window.DLModuleUI.bindInputHints(document);
  startStrategyTips();
  renderRelatedVideoBar();
  resetGame();
})();

(function (global) {
  'use strict';

  var game = global.Act3DisguiseGame = global.Act3DisguiseGame || {};

  function similarityColor(progress) {
    if (progress >= 66) return 0x55b86a;
    if (progress >= 33) return 0xd6a33d;
    return 0xc9483c;
  }

  function clampSimilarityPercent(percent) {
    var value = Number(percent);
    if (!Number.isFinite(value)) value = 60;
    return Math.max(40, Math.min(60, value));
  }

  function disguiseProgress(percent) {
    return (60 - clampSimilarityPercent(percent)) / 20 * 100;
  }

  function createSimilarityMeter(scene, x, y, width) {
    var meter = scene.add.container(x, y);
    var height = 22;
    var state = {
      displayProgress: 0,
      targetProgress: 0,
      tween: null,
      hasValue: false
    };
    var bg = scene.add.graphics();
    var hud = scene.add.graphics();
    var transition = scene.add.graphics();
    var fill = scene.add.graphics();
    var frame = scene.add.graphics();
    var leftLabel = scene.add.text(-width / 2 - 18, 0, '本色不改', {
      fontFamily: 'STKaiti, KaiTi, SimSun, Microsoft YaHei, serif',
      fontSize: '24px',
      color: '#f0b1a9',
      fontStyle: 'bold',
      stroke: '#071006',
      strokeThickness: 3
    }).setOrigin(1, 0.5);
    var rightLabel = scene.add.text(width / 2 + 18, 0, '改头换面', {
      fontFamily: 'STKaiti, KaiTi, SimSun, Microsoft YaHei, serif',
      fontSize: '24px',
      color: '#bfe6bd',
      fontStyle: 'bold',
      stroke: '#160706',
      strokeThickness: 3
    }).setOrigin(0, 0.5);
    var caption = scene.add.text(0, -31, '乔装效果', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '17px',
      color: '#d7bd8f',
      fontStyle: 'bold',
      stroke: '#120b05',
      strokeThickness: 3
    }).setOrigin(0.5);
    var pendingText = scene.add.text(0, 0, '识别中', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '18px',
      color: '#ffe0a3',
      fontStyle: 'bold',
      stroke: '#120b05',
      strokeThickness: 3
    }).setOrigin(0.5).setVisible(false);

    function ratio(progress) {
      return Math.max(0, Math.min(1, progress / 100));
    }

    function roundedBar(graphics, startX, barWidth, color, alpha) {
      if (barWidth <= 0.5) return;
      graphics.fillStyle(color, alpha);
      graphics.fillRoundedRect(startX, -height / 2, barWidth, height, height / 2);
    }

    function redraw(displayProgress, previousProgress) {
      var displayRatio = ratio(displayProgress);
      var fillWidth = width * displayRatio;
      var left = -width / 2;

      bg.clear();
      bg.fillStyle(0x0c0906, 0.94);
      bg.fillRoundedRect(left, -height / 2, width, height, height / 2);

      transition.clear();

      fill.clear();
      roundedBar(fill, left, fillWidth, similarityColor(displayProgress), 0.98);

      frame.clear();
      frame.lineStyle(3, 0xd8a65c, 0.84);
      frame.strokeRoundedRect(left, -height / 2, width, height, height / 2);
    }

    hud.fillStyle(0x080604, 0.82);
    hud.lineStyle(2, 0xa77f49, 0.56);
    hud.fillRoundedRect(-width / 2 - 154, -52, width + 308, 86, 8);
    hud.strokeRoundedRect(-width / 2 - 154, -52, width + 308, 86, 8);
    meter.add([hud, bg, transition, fill, frame, leftLabel, rightLabel, caption, pendingText]);
    redraw(state.displayProgress);
    leftLabel.setVisible(false);
    rightLabel.setVisible(false);
    pendingText.setText('等待识别').setVisible(true);
    meter.setVisible(true);

    return {
      node: meter,
      reset: function () {
        if (state.tween) state.tween.stop();
        state.displayProgress = 0;
        state.targetProgress = 0;
        state.hasValue = false;
        redraw(state.displayProgress);
        leftLabel.setVisible(false);
        rightLabel.setVisible(false);
        pendingText.setText('等待识别').setVisible(true);
        meter.setVisible(true);
      },
      setPending: function () {
        if (state.tween) state.tween.stop();
        meter.setVisible(true);
        if (!state.hasValue) {
          transition.clear();
          fill.clear();
          leftLabel.setVisible(false);
          rightLabel.setVisible(false);
        }
        pendingText.setText('识别中').setVisible(true);
      },
      setUnavailable: function () {
        if (state.tween) state.tween.stop();
        meter.setVisible(true);
        transition.clear();
        fill.clear();
        leftLabel.setVisible(false);
        rightLabel.setVisible(false);
        pendingText.setText('暂未连接识别').setVisible(true);
      },
      setValue: function (percent) {
        var from = state.displayProgress;
        var to = disguiseProgress(percent);
        state.hasValue = true;
        state.targetProgress = to;
        if (state.tween) state.tween.stop();
        meter.setVisible(true);
        leftLabel.setVisible(true);
        rightLabel.setVisible(true);
        pendingText.setVisible(false);
        redraw(from, to);
        state.tween = scene.tweens.addCounter({
          from: from,
          to: to,
          duration: 520,
          ease: 'Sine.easeOut',
          onUpdate: function (tween) {
            state.displayProgress = tween.getValue();
            redraw(state.displayProgress, to);
          },
          onComplete: function () {
            state.displayProgress = to;
            redraw(to);
          }
        });
      }
    };
  }

  game.ui = game.ui || {};
  game.ui.meter = {
    similarityColor: similarityColor,
    clampSimilarityPercent: clampSimilarityPercent,
    disguiseProgress: disguiseProgress,
    createSimilarityMeter: createSimilarityMeter
  };
}(window));

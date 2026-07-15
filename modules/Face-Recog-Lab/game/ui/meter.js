(function (global) {
  'use strict';

  var game = global.Act3DisguiseGame = global.Act3DisguiseGame || {};

  function similarityColor(percent) {
    if (percent >= 50) return 0xc9483c;
    if (percent >= 47) return 0xd7a23f;
    return 0x55b86a;
  }

  function clampSimilarityPercent(percent) {
    var value = Number(percent);
    if (!Number.isFinite(value)) value = 60;
    return Math.max(40, Math.min(60, value));
  }

  function createSimilarityMeter(scene, x, y, width) {
    var meter = scene.add.container(x, y);
    var height = 22;
    var state = {
      displayPercent: 60,
      targetPercent: 60,
      tween: null,
      hasValue: false
    };
    var bg = scene.add.graphics();
    var transition = scene.add.graphics();
    var fill = scene.add.graphics();
    var frame = scene.add.graphics();
    var leftLabel = scene.add.text(-width / 2 - 18, 0, '改头换面', {
      fontFamily: 'STKaiti, KaiTi, SimSun, Microsoft YaHei, serif',
      fontSize: '24px',
      color: '#bfe6bd',
      fontStyle: 'bold',
      stroke: '#071006',
      strokeThickness: 3
    }).setOrigin(1, 0.5);
    var rightLabel = scene.add.text(width / 2 + 18, 0, '本色不改', {
      fontFamily: 'STKaiti, KaiTi, SimSun, Microsoft YaHei, serif',
      fontSize: '24px',
      color: '#f0b1a9',
      fontStyle: 'bold',
      stroke: '#160706',
      strokeThickness: 3
    }).setOrigin(0, 0.5);
    var caption = scene.add.text(0, -28, '识别风险', {
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

    function ratio(percent) {
      return (clampSimilarityPercent(percent) - 40) / 20;
    }

    function roundedBar(graphics, startX, barWidth, color, alpha) {
      if (barWidth <= 0.5) return;
      graphics.fillStyle(color, alpha);
      graphics.fillRoundedRect(startX, -height / 2, barWidth, height, height / 2);
    }

    function redraw(displayPercent, previousPercent) {
      var displayRatio = ratio(displayPercent);
      var previousRatio = typeof previousPercent === 'number' ? ratio(previousPercent) : displayRatio;
      var fillWidth = width * displayRatio;
      var previousWidth = width * previousRatio;
      var left = -width / 2;
      var color = similarityColor(displayPercent);

      bg.clear();
      bg.fillStyle(0x0c0906, 0.72);
      bg.fillRoundedRect(left, -height / 2, width, height, height / 2);
      bg.fillGradientStyle(0x4a2a1c, 0x4a2a1c, 0x142514, 0x142514, 0.92, 0.92, 0.92, 0.92);
      bg.fillRoundedRect(left, -height / 2, width, height, height / 2);

      transition.clear();
      if (previousWidth > fillWidth) {
        roundedBar(transition, left + fillWidth, previousWidth - fillWidth, color, 0.32);
      } else if (fillWidth > previousWidth) {
        roundedBar(transition, left + previousWidth, fillWidth - previousWidth, color, 0.28);
      }

      fill.clear();
      roundedBar(fill, left, fillWidth, color, 0.96);
      fill.fillStyle(0xffffff, 0.18);
      fill.fillRoundedRect(left + 4, -height / 2 + 4, Math.max(0, fillWidth - 8), 4, 2);

      frame.clear();
      frame.lineStyle(3, 0xd8a65c, 0.84);
      frame.strokeRoundedRect(left, -height / 2, width, height, height / 2);
      frame.lineStyle(3, 0xf4ce80, 0.78);
      frame.beginPath();
      frame.moveTo(left + width * 0.5, -height / 2 - 7);
      frame.lineTo(left + width * 0.5, height / 2 + 7);
      frame.strokePath();
    }

    meter.add([bg, transition, fill, frame, leftLabel, rightLabel, caption, pendingText]);
    redraw(state.displayPercent);
    meter.setVisible(false);

    return {
      node: meter,
      reset: function () {
        if (state.tween) state.tween.stop();
        state.displayPercent = 60;
        state.targetPercent = 60;
        state.hasValue = false;
        pendingText.setVisible(false);
        meter.setVisible(false);
      },
      setPending: function () {
        if (!state.hasValue) {
          meter.setVisible(false);
          return;
        }
        if (state.tween) state.tween.stop();
        meter.setVisible(true);
        transition.clear();
        fill.clear();
        leftLabel.setVisible(false);
        rightLabel.setVisible(false);
        pendingText.setVisible(true);
      },
      setValue: function (percent) {
        var from = state.displayPercent;
        var to = clampSimilarityPercent(percent);
        state.hasValue = true;
        state.targetPercent = to;
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
            state.displayPercent = tween.getValue();
            redraw(state.displayPercent, to);
          },
          onComplete: function () {
            state.displayPercent = to;
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
    createSimilarityMeter: createSimilarityMeter
  };
}(window));

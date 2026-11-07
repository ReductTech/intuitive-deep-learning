(function (global) {
  'use strict';
  const game = global.Act3DisguiseGame = global.Act3DisguiseGame || {};
  game.ui = game.ui || {};

  // ui/dialogue
  {
  let constants = game.constants;
  let SCENE_WIDTH = constants.SCENE_WIDTH;
  let SCENE_HEIGHT = constants.SCENE_HEIGHT;
  let UI_DEPTH = constants.UI_DEPTH;

  let lifecycle = game.systems.lifecycle;

  function isAdvanceKey(event) {
    return event && !event.repeat && (event.code === 'Space' || event.key === ' ' || event.keyCode === 32);
  }

  function wait(scene, duration) {
    return lifecycle.promise(scene, function (resolve) {
      var timer = scene.time.delayedCall(duration, resolve);
      return function () { timer.remove(false); };
    });
  }

  async function showDialogueLines(scene, lines) {
    for (var line of lines) await scene.dialogue.show(line.speaker, line.text, line.duration);
  }

  function waitForAdvance(scene, targets) {
    return lifecycle.promise(scene, function (resolve) {
      function handleKey(event) {
        if (!isAdvanceKey(event)) return;
        event.preventDefault();
        resolve();
      }
      scene.input.on('pointerdown', resolve);
      (targets || []).forEach(function (target) { target.on('pointerdown', resolve); });
      if (scene.input.keyboard) scene.input.keyboard.on('keydown', handleKey);
      return function () {
        scene.input.off('pointerdown', resolve);
        (targets || []).forEach(function (target) { target.off('pointerdown', resolve); });
        if (scene.input.keyboard) scene.input.keyboard.off('keydown', handleKey);
      };
    });
  }

  function speakerColor(speaker) {
    if (speaker === '林墨') return '#86b7d9';
    if (speaker === '晚宁') return '#8fc6a1';
    if (String(speaker || '').indexOf('日本') >= 0) return '#d3867c';
    return '#f7d68a';
  }

  function createDialogueBox(scene) {
    var box = scene.add.container(0, 0).setDepth(UI_DEPTH + 240).setVisible(false);
    var advanceZone = scene.add.zone(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, SCENE_WIDTH, SCENE_HEIGHT)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    advanceZone.input.enabled = false;
    var panel = scene.add.rectangle(SCENE_WIDTH / 2, SCENE_HEIGHT - 118, SCENE_WIDTH - 144, 150, 0x17110b, 0.92);
    panel.setStrokeStyle(4, 0xd8a65c, 0.92);
    var nameText = scene.add.text(104, SCENE_HEIGHT - 176, '', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '24px',
      color: '#f7d68a',
      fontStyle: 'bold'
    });
    var lineText = scene.add.text(104, SCENE_HEIGHT - 132, '', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '28px',
      color: '#fff4df',
      wordWrap: { width: SCENE_WIDTH - 208 }
    });
    var continueText = scene.add.text(SCENE_WIDTH - 198, SCENE_HEIGHT - 82, '空格 · 左键', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '18px',
      color: '#f7d68a'
    }).setOrigin(0.5).setVisible(false);
    box.add([advanceZone, panel, nameText, lineText, continueText]);

    return {
      show: function (speaker, line) {
        nameText.setText(speaker);
        nameText.setColor(speakerColor(speaker));
        lineText.setText('');
        continueText.setVisible(false);
        box.setVisible(true);
        var index = 0;
        return lifecycle.promise(scene, function (resolve, reject) {
          var typingComplete = false;
          function skipTyping(event) {
            if (typingComplete || (event && event.repeat)) return;
            if (event && event.preventDefault) event.preventDefault();
            index = line.length;
            lineText.setText(line);
          }
          function handleTypingKey(event) { if (isAdvanceKey(event)) skipTyping(event); }
          function detachTyping() {
            advanceZone.off('pointerdown', skipTyping);
            if (scene.input.keyboard) scene.input.keyboard.off('keydown', handleTypingKey);
          }
          advanceZone.input.enabled = true;
          advanceZone.once('pointerdown', skipTyping);
          if (scene.input.keyboard) scene.input.keyboard.on('keydown', handleTypingKey);
          var timer = scene.time.addEvent({
            delay: 22, loop: true,
            callback: function () {
              index = Math.min(line.length, index + 2);
              lineText.setText(line.slice(0, index));
              if (index < line.length) return;
              typingComplete = true;
              timer.remove(false);
              detachTyping();
              continueText.setVisible(true);
              scene.tweens.add({ targets: continueText, alpha: 0.46, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
              waitForAdvance(scene, [advanceZone]).then(resolve, reject);
            }
          });
          return function () {
            timer.remove(false);
            detachTyping();
            if (advanceZone.input) advanceZone.input.enabled = false;
            scene.tweens.killTweensOf(continueText);
            continueText.setAlpha(1);
          };
        });
      },
      hide: function () {
        advanceZone.input.enabled = false;
        box.setVisible(false);
      }
    };
  }

  game.ui.dialogue = {
    wait: wait,
    showDialogueLines: showDialogueLines,
    waitForAdvance: waitForAdvance,
    createDialogueBox: createDialogueBox
  };
  }

  // ui/meter
  {

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

  game.ui.meter = {
    similarityColor: similarityColor,
    clampSimilarityPercent: clampSimilarityPercent,
    disguiseProgress: disguiseProgress,
    createSimilarityMeter: createSimilarityMeter
  };
  }

  // ui/buttons
  {
  let SCENE_WIDTH = game.constants.SCENE_WIDTH;
  let SCENE_HEIGHT = game.constants.SCENE_HEIGHT;
  let assets = game.assets;
  let DISGUISE_TEMPLATES = assets.DISGUISE_TEMPLATES;
  let DISGUISE_TOOL_ICONS = assets.DISGUISE_TOOL_ICONS;
  let renderer = game.disguise.renderer;
  let fitImageToBox = renderer.fitImageToBox;
  let smoothTexture = renderer.smoothTexture;
  let fitDisguisePortrait = renderer.fitDisguisePortrait;

  function createTemplateCard(scene, x, y, templateKey, onClick) {
    var template = DISGUISE_TEMPLATES[templateKey];
    smoothTexture(scene, template.textureKey);
    var card = scene.add.container(x, y).setSize(252, 336).setInteractive({ useHandCursor: true });
    var bg = scene.add.rectangle(0, 0, 252, 336, 0x100b07, 0.92);
    bg.setStrokeStyle(3, 0xd8a65c, 0.82);
    var imageFrame = scene.add.rectangle(0, -24, 214, 232, 0x000000, 0.22);
    imageFrame.setStrokeStyle(2, 0xf0bd6b, 0.72);
    var image = scene.add.image(0, -24, template.textureKey);
    fitImageToBox(image, 198, 216);
    var label = scene.add.text(0, 128, template.label, {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '28px',
      color: '#ffe6ae',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    card.add([bg, imageFrame, image, label]);
    card.on('pointerdown', function () {
      onClick(templateKey);
    });
    return {
      card: card,
      setSelected: function (selected) {
        bg.setStrokeStyle(selected ? 5 : 3, selected ? 0xffdf8f : 0xd8a65c, selected ? 1 : 0.82);
        card.setScale(selected ? 1.04 : 1);
      }
    };
  }

  function addDisguiseFrame(scene, layer) {
    var graphics = scene.add.graphics();
    graphics.lineStyle(2, 0x9f8055, 0.34);
    graphics.strokeRect(18, 18, SCENE_WIDTH - 36, SCENE_HEIGHT - 36);
    graphics.lineStyle(3, 0xd7b474, 0.28);
    [
      { x: 28, y: 28, sx: 1, sy: 1 },
      { x: SCENE_WIDTH - 28, y: 28, sx: -1, sy: 1 },
      { x: 28, y: SCENE_HEIGHT - 28, sx: 1, sy: -1 },
      { x: SCENE_WIDTH - 28, y: SCENE_HEIGHT - 28, sx: -1, sy: -1 }
    ].forEach(function (corner) {
      graphics.beginPath();
      graphics.moveTo(corner.x, corner.y + corner.sy * 42);
      graphics.lineTo(corner.x, corner.y);
      graphics.lineTo(corner.x + corner.sx * 42, corner.y);
      graphics.strokePath();
      graphics.beginPath();
      graphics.moveTo(corner.x + corner.sx * 12, corner.y + corner.sy * 52);
      graphics.lineTo(corner.x + corner.sx * 12, corner.y + corner.sy * 12);
      graphics.lineTo(corner.x + corner.sx * 52, corner.y + corner.sy * 12);
      graphics.strokePath();
    });
    layer.add(graphics);
    return graphics;
  }

  function createDisguiseTitle(scene, y, text) {
    var group = scene.add.container(SCENE_WIDTH / 2, y);
    var leftLine = scene.add.rectangle(-330, 9, 180, 3, 0x9f8055, 0.42);
    var rightLine = scene.add.rectangle(330, 9, 180, 3, 0x9f8055, 0.42);
    var leftDot = scene.add.rectangle(-220, 9, 14, 14, 0xc79c5b, 0.72).setRotation(Math.PI / 4);
    var rightDot = scene.add.rectangle(220, 9, 14, 14, 0xc79c5b, 0.72).setRotation(Math.PI / 4);
    var title = scene.add.text(0, 0, text, {
      fontFamily: 'STKaiti, KaiTi, SimSun, Microsoft YaHei, serif',
      fontSize: '54px',
      color: '#f4dca8',
      fontStyle: 'bold',
      stroke: '#2a1709',
      strokeThickness: 5,
      shadow: { offsetX: 0, offsetY: 2, color: '#120b05', blur: 8, fill: true }
    }).setOrigin(0.5);
    group.add([leftLine, rightLine, leftDot, rightDot, title]);
    return group;
  }

  function createDisguiseBottomShell(scene) {
    var shell = scene.add.container(0, 0);
    var shadow = scene.add.rectangle(SCENE_WIDTH / 2, 882, SCENE_WIDTH + 120, 410, 0x000000, 0.5);
    var panel = scene.add.graphics();
    panel.fillStyle(0x130e09, 0.96);
    panel.lineStyle(2, 0xb78a4e, 0.78);
    panel.fillRoundedRect(74, 700, SCENE_WIDTH - 148, 190, 8);
    panel.strokeRoundedRect(74, 700, SCENE_WIDTH - 148, 190, 8);
    panel.fillStyle(0x21180f, 0.98);
    panel.fillRect(74, 700, 154, 190);
    panel.lineStyle(2, 0x8b6b43, 0.62);
    panel.beginPath();
    panel.moveTo(228, 716);
    panel.lineTo(228, 874);
    panel.strokePath();
    panel.fillStyle(0x120d08, 0.98);
    panel.lineStyle(3, 0xb78a4e, 0.84);
    panel.fillRect(346, 914, 756, 120);
    panel.strokeRect(346, 914, 756, 120);
    panel.fillStyle(0xd0a15a, 0.9);
    panel.fillTriangle(346, 914, 372, 914, 346, 940);
    panel.fillTriangle(1102, 914, 1076, 914, 1102, 940);
    var glow = scene.add.rectangle(SCENE_WIDTH / 2, 898, SCENE_WIDTH - 300, 2, 0xe7ba6e, 0.3);
    shell.add([shadow, panel, glow]);
    return shell;
  }

  function createIconToolButton(scene, x, y, iconKey, label, onClick) {
    var shortcutByTool = { moustache: '1', mole: '2', makeup: '3', skinTone: '4', reshape: '5' };
    var button = scene.add.container(x, y).setSize(136, 72).setInteractive({ useHandCursor: true });
    var halo = scene.add.rectangle(0, 0, 140, 76, 0xffc873, 0);
    var bg = scene.add.rectangle(0, 0, 132, 68, 0x17120d, 0.98);
    bg.setStrokeStyle(2, 0x8f7654, 0.72);
    var activeBar = scene.add.rectangle(0, 32, 126, 4, 0xffca77, 0);
    var iconPlate = scene.add.rectangle(-40, 0, 42, 42, 0x2d2923, 0.9);
    iconPlate.setStrokeStyle(1, 0xf2cf8c, 0.2);
    var icon = scene.add.image(-40, 0, DISGUISE_TOOL_ICONS[iconKey].textureKey).setDisplaySize(28, 28);
    icon.setTint(0xf4d89b);
    var text = scene.add.text(-10, 1, label, {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '18px',
      color: '#d7bd8f',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    var keyText = scene.add.text(54, -26, shortcutByTool[iconKey] || '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#9f8b6c',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    button.add([halo, bg, activeBar, iconPlate, icon, text, keyText]);
    button.on('pointerdown', onClick);
    button.on('pointerover', function () {
      if (!button.isActiveTool) bg.setFillStyle(0x251d14, 0.98);
    });
    button.on('pointerout', function () {
      if (!button.isActiveTool) bg.setFillStyle(0x17120d, 0.98);
    });
    button.setActiveStyle = function (active) {
      button.isActiveTool = active;
      halo.setAlpha(active ? 0.18 : 0);
      bg.setFillStyle(active ? 0x3a2c1d : 0x17120d, 0.98);
      bg.setStrokeStyle(active ? 3 : 2, active ? 0xffca77 : 0x8f7654, active ? 1 : 0.72);
      activeBar.setAlpha(active ? 1 : 0);
      iconPlate.setFillStyle(active ? 0x594025 : 0x2d2923, active ? 0.96 : 0.9);
      icon.setTint(active ? 0xffe2a8 : 0xf4d89b);
      text.setColor(active ? '#ffe2a8' : '#d7bd8f');
    };
    button.setActiveStyle(false);
    return button;
  }

  function createDisguiseActionButton(scene, x, y, width, label, primary, onClick) {
    var height = width < 200 ? 50 : 78;
    var radius = height / 2 - 1;
    var labelLength = Array.from(String(label || '')).length || 1;
    var fontSize = width < 200 ? 23 : Math.min(38, Math.floor((width - 30) / labelLength));
    var button = scene.add.container(x, y).setSize(width, height).setInteractive({ useHandCursor: true });
    var bg = scene.add.graphics();
    bg.fillStyle(primary ? 0xc79a57 : 0x24211c, 0.96);
    bg.lineStyle(primary ? 4 : 3, primary ? 0xffdf9e : 0x8d806f, primary ? 0.94 : 0.68);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
    var shine = scene.add.graphics();
    shine.fillStyle(primary ? 0xfff1c6 : 0xffffff, primary ? 0.32 : 0.12);
    shine.fillRoundedRect(-width / 2 + 18, -height / 2 + 14, width - 36, 3, 2);
    var text = scene.add.text(0, 0, label, {
      fontFamily: 'STKaiti, KaiTi, SimSun, Microsoft YaHei, serif',
      fontSize: fontSize + 'px',
      color: primary ? '#241407' : '#f2d5a1',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    button.add([bg, shine, text]);
    button.on('pointerdown', onClick);
    return button;
  }

  function createDisguiseOption(scene, x, y, width, label, onClick) {
    var button = scene.add.container(x, y).setSize(width, 46).setInteractive({ useHandCursor: true });
    var bg = scene.add.graphics();
    bg.fillStyle(0x211711, 0.9);
    bg.lineStyle(2, 0xb58b52, 0.62);
    bg.fillRoundedRect(-width / 2, -23, width, 46, 8);
    bg.strokeRoundedRect(-width / 2, -23, width, 46, 8);
    var text = scene.add.text(0, 0, label, {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '20px',
      color: '#ffe6ae',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    button.add([bg, text]);
    button.on('pointerdown', onClick);
    return button;
  }

  function createDisguiseSwatch(scene, x, y, fill, label, selected, onClick) {
    var button = scene.add.container(x, y).setSize(70, 74).setInteractive({ useHandCursor: true });
    var ring = scene.add.circle(0, -8, 28, 0x17100b, 0.92);
    ring.setStrokeStyle(selected ? 4 : 2, selected ? 0xffd47e : 0x746454, selected ? 0.96 : 0.7);
    var swatch = scene.add.circle(0, -8, 21, fill, 0.98);
    var check = scene.add.text(20, 14, selected ? '✓' : '', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '21px',
      color: '#2a1608',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    var checkBg = scene.add.circle(20, 14, 13, 0xf6daa0, selected ? 0.95 : 0);
    var text = scene.add.text(0, 36, label, {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '14px',
      color: '#d9bd8f',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    button.add([ring, swatch, checkBg, check, text]);
    button.on('pointerdown', onClick);
    return button;
  }

  game.ui.buttons = {
    createTemplateCard: createTemplateCard,
    addDisguiseFrame: addDisguiseFrame,
    createDisguiseTitle: createDisguiseTitle,
    createDisguiseBottomShell: createDisguiseBottomShell,
    createIconToolButton: createIconToolButton,
    createDisguiseActionButton: createDisguiseActionButton,
    createDisguiseOption: createDisguiseOption,
    createDisguiseSwatch: createDisguiseSwatch
  };
  }
}(window));

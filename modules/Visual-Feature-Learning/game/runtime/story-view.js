(function (global) {
  'use strict';
  const game = global.Act3DisguiseGame = global.Act3DisguiseGame || {};
  game.cutscene = game.cutscene || {};

  // cutscene/presentation
  {
  let constants = game.constants;
  let dialogue = game.ui.dialogue;
  let buttons = game.ui.buttons;
  let SCENE_WIDTH = constants.SCENE_WIDTH;
  let SCENE_HEIGHT = constants.SCENE_HEIGHT;
  let UI_DEPTH = constants.UI_DEPTH;
  let wait = dialogue.wait;
  let createDisguiseActionButton = buttons.createDisguiseActionButton;

  async function showOutcomeTitle(scene, passed) {
    var color = passed ? 0xf1c46f : 0xc84b43;
    var titleText = passed ? '恭喜任务成功' : '被捕了';
    var subtitleText = passed ? 'MISSION COMPLETE' : 'MISSION FAILED';
    var overlay = scene.add.container(0, 0).setDepth(UI_DEPTH + 280).setAlpha(0);
    var dim = scene.add.rectangle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, SCENE_WIDTH, 440, 0x050403, 0.9);
    var topLine = scene.add.rectangle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2 - 220, SCENE_WIDTH, 3, color, 0.7);
    var bottomLine = scene.add.rectangle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2 + 220, SCENE_WIDTH, 3, color, 0.7);
    var title = scene.add.text(SCENE_WIDTH / 2, SCENE_HEIGHT / 2 - 74, titleText, {
      fontFamily: 'STKaiti, KaiTi, Microsoft YaHei, serif',
      fontSize: passed ? '78px' : '92px',
      color: passed ? '#f7d58d' : '#d66057',
      fontStyle: 'bold',
      stroke: '#100906',
      strokeThickness: 8
    }).setOrigin(0.5);
    var subtitle = scene.add.text(SCENE_WIDTH / 2, SCENE_HEIGHT / 2 + 24, subtitleText, {
      fontFamily: 'Arial, Microsoft YaHei, sans-serif',
      fontSize: '25px',
      color: '#e8dfd2',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    overlay.add([dim, topLine, bottomLine, title, subtitle]);
    await game.systems.lifecycle.promise(scene, function (resolve) {
      scene.tweens.add({ targets: overlay, alpha: 1, duration: 280, ease: 'Sine.easeOut', onComplete: resolve });
    });
    return game.systems.lifecycle.promise(scene, function (resolve) {
      var buttons = [];
      var settled = false;
      function choose(action) {
        if (settled) return;
        settled = true;
        buttons.forEach(function (button) { button.disableInteractive(); });
        scene.tweens.add({
          targets: overlay,
          alpha: 0,
          duration: 320,
          ease: 'Sine.easeIn',
          onComplete: function () {
            overlay.destroy(true);
            resolve(action);
          }
        });
      }
      if (passed) {
        buttons.push(createDisguiseActionButton(scene, SCENE_WIDTH / 2, 704, 340, '查看推荐视频', true, function () { choose('finish'); }));
      } else {
        buttons.push(createDisguiseActionButton(scene, SCENE_WIDTH / 2, 704, 310, '返回检查点重试', true, function () { choose('checkpoint'); }));
      }
      overlay.add(buttons);
    });
  }

  function showRelatedVideos() {
    global.dispatchEvent(new CustomEvent('face-recog:act3-complete'));
  }

  async function showKnockCascade(scene) {
    var layer = scene.add.container(0, 0).setDepth(UI_DEPTH + 220);
    var doorwayX = SCENE_WIDTH / 2;
    var screenMiddleY = SCENE_HEIGHT / 2;
    var firstKnock = scene.add.text(doorwayX, SCENE_HEIGHT + 110, '咚', {
      fontFamily: 'STKaiti, KaiTi, SimSun, Microsoft YaHei, serif',
      fontSize: '92px',
      color: '#f4efe6',
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0).setScale(0.82);
    var secondKnock = scene.add.text(doorwayX, SCENE_HEIGHT + 140, '咚咚', {
      fontFamily: 'STKaiti, KaiTi, SimSun, Microsoft YaHei, serif',
      fontSize: '112px',
      color: '#f4efe6',
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0).setScale(0.86);
    layer.add([firstKnock, secondKnock]);

    function tossFromDoor(target, delay, peakX, peakY, landingX, spin, riseDuration, fallDuration) {
      return game.systems.lifecycle.promise(scene, function (resolve) {
        scene.tweens.add({
          targets: target,
          delay: delay,
          alpha: 1,
          x: peakX,
          y: peakY,
          angle: spin * 0.42,
          scaleX: 1.04,
          scaleY: 1.04,
          duration: riseDuration,
          ease: 'Sine.easeOut',
          onComplete: function () {
            scene.tweens.add({
              targets: target,
              alpha: 0,
              x: landingX,
              y: SCENE_HEIGHT + 150,
              angle: spin,
              scaleX: 0.9,
              scaleY: 1.1,
              duration: fallDuration,
              ease: 'Quad.easeIn',
              onComplete: resolve
            });
          }
        });
      });
    }

    await Promise.all([
      tossFromDoor(firstKnock, 0, doorwayX - 74, screenMiddleY + 24, doorwayX - 150, -22, 500, 470),
      tossFromDoor(secondKnock, 300, doorwayX + 82, screenMiddleY - 26, doorwayX + 168, 18, 530, 500)
    ]);
    return layer;
  }

  function showMovementHint(scene) {
    if (scene.movementHint) scene.movementHint.destroy(true);
    var hint = scene.add.container(SCENE_WIDTH / 2, 86).setDepth(UI_DEPTH + 30).setAlpha(0);
    var bg = scene.add.rectangle(0, 0, 430, 58, 0x100c08, 0.9).setStrokeStyle(2, 0xd8a65c, 0.82);
    var text = scene.add.text(0, 0, 'WASD 移动  ·  前往梳妆台', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '22px',
      color: '#ffe0a3',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    hint.add([bg, text]);
    scene.movementHint = hint;
    scene.tweens.add({ targets: hint, alpha: 1, y: 104, duration: 300, ease: 'Cubic.easeOut' });
  }

  function hideMovementHint(scene) {
    if (!scene.movementHint) return;
    scene.movementHint.destroy(true);
    scene.movementHint = null;
  }

  async function showInspectionAlert(scene) {
    var layer = scene.add.container(0, 0).setDepth(UI_DEPTH + 210);
    var flash = scene.add.rectangle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, SCENE_WIDTH, SCENE_HEIGHT, 0x000000, 1);
    layer.add(flash);
    for (var index = 0; index < 2; index += 1) {
      flash.setFillStyle(0xffffff, 1);
      await wait(scene, 90);
      flash.setFillStyle(0x000000, 1);
      await wait(scene, 130);
    }
    var calls = [
      { text: '砰！', x: 430, y: 344, size: 64, rotation: -0.18 },
      { text: '开门！', x: 720, y: 460, size: 72, rotation: 0.13 },
      { text: '全街检查！', x: 1015, y: 584, size: 76, rotation: -0.11 },
      { text: '里面的人，站好！', x: 724, y: 736, size: 82, rotation: 0.07 }
    ];
    for (var callIndex = 0; callIndex < calls.length; callIndex += 1) {
      var call = calls[callIndex];
      var callText = scene.add.text(call.x, call.y - 34, call.text, {
        fontFamily: 'STKaiti, KaiTi, Microsoft YaHei, serif',
        fontSize: call.size + 'px',
        color: '#f3eee5',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 8
      }).setOrigin(0.5).setRotation(call.rotation).setScale(0.42).setAlpha(0);
      layer.add(callText);
      await game.systems.lifecycle.promise(scene, function (resolve) {
        scene.tweens.add({
          targets: callText,
          alpha: 1,
          scaleX: 1,
          scaleY: 1,
          y: callText.y + 34,
          duration: 210,
          ease: 'Back.easeOut',
          onComplete: resolve
        });
      });
      await wait(scene, callIndex === calls.length - 1 ? 120 : 90);
    }
    var subtitle = scene.add.text(SCENE_WIDTH / 2, 890, '门外的脚步声逼近', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '25px',
      color: '#c8c1b7'
    }).setOrigin(0.5).setAlpha(0);
    layer.add(subtitle);
    await game.systems.lifecycle.promise(scene, function (resolve) {
      scene.tweens.add({ targets: subtitle, alpha: 1, duration: 180, onComplete: resolve });
    });
    await wait(scene, 1050);
    await game.systems.lifecycle.promise(scene, function (resolve) {
      scene.tweens.add({ targets: layer, alpha: 0, duration: 280, onComplete: resolve });
    });
    layer.destroy(true);
  }

  async function showWantedPoster(scene) {
    scene.dialogue.hide();
    var overlay = scene.add.container(0, 0).setDepth(UI_DEPTH + 260);
    var blocker = scene.add.zone(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, SCENE_WIDTH, SCENE_HEIGHT)
      .setOrigin(0.5)
      .setInteractive();
    var shade = scene.add.rectangle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, SCENE_WIDTH, SCENE_HEIGHT, 0x080604, 1);
    var poster = scene.add.image(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, 'wantedPoster')
      .setDisplaySize(SCENE_HEIGHT * 0.75, SCENE_HEIGHT);
    overlay.add([shade, blocker, poster]);
    await game.systems.lifecycle.promise(scene, function (resolve) {
      var answerButton = createDisguiseActionButton(
        scene,
        SCENE_WIDTH - 150,
        SCENE_HEIGHT / 2,
        240,
        '没见过',
        true,
        resolve
      );
      overlay.add(answerButton);
    });
    overlay.destroy(true);
  }

  function fadeToBlack(scene, duration) {
    if (scene.fadeOverlay) {
      scene.fadeOverlay.destroy();
    }
    var fade = scene.add.rectangle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, SCENE_WIDTH, SCENE_HEIGHT, 0x000000, 1)
      .setDepth(UI_DEPTH + 50)
      .setAlpha(0);
    scene.fadeOverlay = fade;
    if (duration <= 0) {
      fade.setAlpha(1);
      return Promise.resolve(fade);
    }
    return game.systems.lifecycle.promise(scene, function (resolve) {
      scene.tweens.add({
        targets: fade,
        alpha: 1,
        duration: duration,
        ease: 'Sine.easeInOut',
        onComplete: function () {
          resolve(fade);
        }
      });
    });
  }

  function fadeFromBlack(scene, duration) {
    var fade = scene.fadeOverlay;
    if (!fade) return Promise.resolve();
    return game.systems.lifecycle.promise(scene, function (resolve) {
      scene.tweens.add({
        targets: fade,
        alpha: 0,
        duration: duration,
        ease: 'Sine.easeInOut',
        onComplete: function () {
          fade.destroy();
          if (scene.fadeOverlay === fade) {
            scene.fadeOverlay = null;
          }
          resolve();
        }
      });
    });
  }


  game.cutscene.presentation = { showRelatedVideos: showRelatedVideos, showOutcomeTitle: showOutcomeTitle, showKnockCascade: showKnockCascade, showMovementHint: showMovementHint, hideMovementHint: hideMovementHint, showInspectionAlert: showInspectionAlert, showWantedPoster: showWantedPoster, fadeToBlack: fadeToBlack, fadeFromBlack: fadeFromBlack };
  }

  // cutscene/teaching
  {
  let constants = game.constants;
  let assets = game.assets;
  let renderer = game.disguise.renderer;
  let similarity = game.systems.similarity;
  let buttons = game.ui.buttons;
  let SCENE_WIDTH = constants.SCENE_WIDTH;
  let SCENE_HEIGHT = constants.SCENE_HEIGHT;
  let UI_DEPTH = constants.UI_DEPTH;
  let DISGUISE_PASS_THRESHOLD = constants.DISGUISE_PASS_THRESHOLD;
  let DISGUISE_TEMPLATES = assets.DISGUISE_TEMPLATES;
  let drawFaceCanvas = renderer.drawFaceCanvas;
  let requestDisguiseSimilarity = similarity.requestDisguiseSimilarity;
  let createDisguiseActionButton = buttons.createDisguiseActionButton;

  let fadeToBlack = game.cutscene.presentation.fadeToBlack;
  let fadeFromBlack = game.cutscene.presentation.fadeFromBlack;

  function refreshTeachingTexture(scene, key, textureKey, marks) {
    if (scene.textures.exists(key)) {
      scene.textures.remove(key);
    }
    scene.textures.addCanvas(key, drawFaceCanvas(scene, textureKey, marks));
    return key;
  }

  function addTeachingArrow(graphics, fromX, fromY, toX, toY) {
    var angle = Math.atan2(toY - fromY, toX - fromX);
    graphics.lineStyle(4, 0xf0bd6b, 0.95);
    graphics.beginPath();
    graphics.moveTo(fromX, fromY);
    graphics.lineTo(toX, toY);
    graphics.strokePath();
    graphics.fillStyle(0xf0bd6b, 0.95);
    graphics.fillTriangle(
      toX,
      toY,
      toX - Math.cos(angle - 0.45) * 22,
      toY - Math.sin(angle - 0.45) * 22,
      toX - Math.cos(angle + 0.45) * 22,
      toY - Math.sin(angle + 0.45) * 22
    );
  }

  function createTeachingConfirmButton(scene, ui) {
    return game.systems.lifecycle.promise(scene, function (resolve) {
      var button = createDisguiseActionButton(scene, SCENE_WIDTH / 2, 1008, 210, '确定', true, function () {
        button.destroy();
        resolve();
      });
      ui.add(button);
    });
  }

  function addTeachingBox(graphics, x, y, width, height, fillAlpha) {
    graphics.fillStyle(0x0d0a06, fillAlpha == null ? 0.82 : fillAlpha);
    graphics.lineStyle(3, 0xb98942, 0.72);
    graphics.fillRoundedRect(x, y, width, height, 8);
    graphics.strokeRoundedRect(x, y, width, height, 8);
  }

  function addEmbeddingBar(scene, ui, x, y, width, height, color, label) {
    var container = scene.add.container(0, 0);
    var labelText = scene.add.text(x + width / 2, y - 26, label, {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '18px',
      color: '#f7d68a',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    var bg = scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0x111111, 0.82)
      .setStrokeStyle(2, 0xd8a65c, 0.65);
    container.add([labelText, bg]);
    var cells = 12;
    for (var i = 0; i < cells; i += 1) {
      var cell = scene.add.rectangle(
        x + (i + 0.5) * width / cells,
        y + height / 2,
        width / cells - 3,
        height - 4,
        color,
        0.42 + (i % 4) * 0.11
      ).setStrokeStyle(1, 0xffffff, 0.18);
      container.add(cell);
    }
    var ellipsis = scene.add.text(x + width / 2, y + height / 2 - 1, '...', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(ellipsis);
    ui.add(container);
    return container;
  }

  function addTeachingNetwork(scene, ui, x, y) {
    var container = scene.add.container(0, 0);
    var panel = scene.add.rectangle(x, y, 210, 260, 0x100c07, 0.86).setStrokeStyle(3, 0xb98942, 0.78);
    var title = scene.add.text(x, y - 98, '共享网络', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '22px',
      color: '#ffe0a3',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    var sub = scene.add.text(x, y - 68, '参数共享', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '16px',
      color: '#d6bd89'
    }).setOrigin(0.5);
    container.add([panel, title, sub]);
    for (var i = 0; i < 6; i += 1) {
      var h = 92 - i * 9;
      var layer = scene.add.rectangle(x - 64 + i * 25, y + 28, 16, h, 0x6b522e, 0.72 - i * 0.06)
        .setStrokeStyle(2, 0xe1b665, 0.38);
      container.add(layer);
    }
    var backbone = scene.add.text(x, y + 102, 'CNN Backbone', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '17px',
      color: '#fff4df',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(backbone);
    ui.add(container);
    return container;
  }

  function addThresholdPanel(scene, ui, percent, passed) {
    var panel = scene.add.container(0, 0);
    var graphics = scene.add.graphics();
    addTeachingBox(graphics, 164, 740, 1120, 126, 0.72);
    var threshold = DISGUISE_PASS_THRESHOLD;
    var valueX = 288 + Math.max(0, Math.min(1, percent / 100)) * 420;
    var thresholdX = 288 + (threshold / 100) * 420;
    var lineY = 810;
    graphics.lineStyle(8, 0x296f2e, 0.9);
    graphics.beginPath();
    graphics.moveTo(288, lineY);
    graphics.lineTo(708, lineY);
    graphics.strokePath();
    graphics.lineStyle(8, 0xb92e2e, 0.9);
    graphics.beginPath();
    graphics.moveTo(thresholdX, lineY);
    graphics.lineTo(708, lineY);
    graphics.strokePath();
    graphics.lineStyle(3, 0xf1d28c, 0.9);
    graphics.beginPath();
    graphics.moveTo(thresholdX, lineY - 26);
    graphics.lineTo(thresholdX, lineY + 26);
    graphics.strokePath();
    graphics.fillStyle(passed ? 0x72d476 : 0xff7770, 0.98);
    graphics.fillTriangle(valueX, lineY - 24, valueX - 11, lineY - 4, valueX + 11, lineY - 4);
    var thresholdText = scene.add.text(thresholdX, lineY - 46, '阈值 ' + (threshold / 100).toFixed(1), {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '18px',
      color: '#f7d68a',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    var leftText = scene.add.text(286, lineY + 34, '0', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '18px',
      color: '#dff4d6'
    }).setOrigin(0.5);
    var rightText = scene.add.text(708, lineY + 34, '1', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '18px',
      color: '#ffd0ca'
    }).setOrigin(0.5);
    var verdictIcon = scene.add.circle(814, 803, 35, passed ? 0x14351c : 0x461615, 0.96).setStrokeStyle(5, passed ? 0x6ed56f : 0xff7770, 0.92);
    var verdictGlyph = scene.add.text(814, 800, passed ? '✓' : '!', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '42px',
      color: passed ? '#8df28f' : '#ffb0a2',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    var verdictText = scene.add.text(870, 780, passed
      ? '相关度低于阈值'
      : '相关度高于阈值', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '24px',
      color: passed ? '#8df28f' : '#ffb0a2',
      fontStyle: 'bold'
    });
    var verdictSub = scene.add.text(870, 818, passed
      ? '判定结果：乔装有效，放行'
      : '判定结果：高度相似，被识破', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '22px',
      color: '#fff4df'
    });
    panel.add([graphics, thresholdText, leftText, rightText, verdictIcon, verdictGlyph, verdictText, verdictSub]);
    ui.add(panel);
    return panel;
  }

  function addTeachingImageZoom(scene, ui, images) {
    var zoom = scene.add.container(0, 0).setDepth(100).setVisible(false);
    var shade = scene.add.rectangle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, SCENE_WIDTH, SCENE_HEIGHT, 0x000000, 0.92)
      .setInteractive({ useHandCursor: true });
    var frame = scene.add.rectangle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, 680, 680, 0x100c07, 1)
      .setStrokeStyle(4, 0xd8a65c, 0.95);
    var preview = scene.add.image(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, images[0].texture.key)
      .setDisplaySize(640, 640)
      .setInteractive({ useHandCursor: true });
    var closeBg = scene.add.circle(SCENE_WIDTH / 2 + 332, SCENE_HEIGHT / 2 - 332, 27, 0x24170d, 1)
      .setStrokeStyle(2, 0xf1c46f, 0.9)
      .setInteractive({ useHandCursor: true });
    var closeText = scene.add.text(closeBg.x, closeBg.y - 2, '×', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '36px',
      color: '#ffe0a3'
    }).setOrigin(0.5);
    function closeZoom() {
      zoom.setVisible(false);
    }
    shade.on('pointerdown', closeZoom);
    preview.on('pointerdown', closeZoom);
    closeBg.on('pointerdown', closeZoom);
    zoom.add([shade, frame, preview, closeBg, closeText]);
    ui.add(zoom);
    images.forEach(function (image) {
      image.setInteractive({ useHandCursor: true });
      image.on('pointerdown', function () {
        preview.setTexture(image.texture.key);
        zoom.setVisible(true);
      });
    });
  }

  async function runDisguiseTeaching(scene) {
    await fadeToBlack(scene, 500);
    var marks = scene.disguiseMarks || [];
    var faceTexture = scene.disguiseFaceTexture || DISGUISE_TEMPLATES.normal.textureKey;
    var result = scene.disguiseSimilarityPromise
      ? await scene.disguiseSimilarityPromise
      : scene.disguiseSimilarity;
    scene.disguiseSimilarityPromise = null;
    if (!result) {
      result = await requestDisguiseSimilarity(scene, faceTexture, marks);
      scene.disguiseSimilarity = result;
    }
    var percent = Number(result.similarityPercent);
    if (!Number.isFinite(percent)) throw new Error('Invalid disguise similarity');
    var passed = percent < DISGUISE_PASS_THRESHOLD;

    var anchorKey = refreshTeachingTexture(scene, 'act3-teach-anchor', 'anchorFace', []);
    var disguiseKey = refreshTeachingTexture(scene, 'act3-teach-disguise', faceTexture, marks);
    var ui = scene.add.container(0, 0).setDepth(UI_DEPTH + 200);
    var bg = scene.add.rectangle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, SCENE_WIDTH, SCENE_HEIGHT, 0x050403, 0.97);
    var title = scene.add.text(SCENE_WIDTH / 2, 72, '人脸识别排查', {
      fontFamily: 'STKaiti, KaiTi, SimSun, Microsoft YaHei, serif',
      fontSize: '50px',
      color: '#ffe0a3',
      fontStyle: 'bold',
      stroke: '#2a1709',
      strokeThickness: 5
    }).setOrigin(0.5);
    ui.add([bg, title]);

    var top = scene.add.image(190, 276, anchorKey).setDisplaySize(224, 224);
    var bottom = scene.add.image(190, 560, disguiseKey).setDisplaySize(224, 224);
    var topLabel = scene.add.text(190, 144, '原始身份', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '24px',
      color: '#f7d68a',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    var bottomLabel = scene.add.text(190, 428, '乔装后', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '24px',
      color: '#f7d68a',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    var graphics = scene.add.graphics();
    addTeachingArrow(graphics, 300, 276, 382, 390);
    addTeachingArrow(graphics, 300, 560, 382, 470);
    addTeachingArrow(graphics, 506, 430, 590, 324);
    addTeachingArrow(graphics, 506, 430, 590, 540);
    addTeachingArrow(graphics, 840, 324, 948, 324);
    addTeachingArrow(graphics, 840, 540, 948, 540);
    addTeachingArrow(graphics, 1108, 324, 1172, 400);
    addTeachingArrow(graphics, 1108, 540, 1172, 462);
    addTeachingNetwork(scene, ui, 444, 430);
    var embeddingTitle = scene.add.text(715, 160, '得到两个 Embedding 向量', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '22px',
      color: '#f7d68a',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    addEmbeddingBar(scene, ui, 590, 300, 250, 34, 0x2f73d9, 'Embedding A');
    addEmbeddingBar(scene, ui, 590, 516, 250, 34, 0x49a340, 'Embedding B');
    var normTitle = scene.add.text(1028, 160, 'L2 归一化', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '22px',
      color: '#f7d68a',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    addEmbeddingBar(scene, ui, 948, 300, 160, 34, 0x347df0, '归一化 A');
    addEmbeddingBar(scene, ui, 948, 516, 160, 34, 0x58b64c, '归一化 B');
    var formulaBox = scene.add.graphics();
    addTeachingBox(formulaBox, 1170, 260, 150, 218, 0.78);
    var formulaTitle = scene.add.text(1245, 288, '身份相关度', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '20px',
      color: '#ffe0a3',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    var formula = scene.add.text(1245, 358, 'max(0, A·B)', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '19px',
      color: '#fff4df',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    var scoreValue = scene.add.text(1245, 416, (percent / 100).toFixed(3), {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '38px',
      color: passed ? '#8df28f' : '#ffb0a2',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    addThresholdPanel(scene, ui, percent, passed);

    ui.add([
      top, bottom, topLabel, bottomLabel,
      graphics, embeddingTitle, normTitle, formulaBox, formulaTitle, formula,
      scoreValue
    ]);
    addTeachingImageZoom(scene, ui, [top, bottom]);
    await createTeachingConfirmButton(scene, ui);
    ui.destroy();
    await fadeFromBlack(scene, 450);
    return { passed: passed, similarityPercent: percent };
  }



  game.cutscene.teaching = { runDisguiseTeaching: runDisguiseTeaching };
  }
}(window));

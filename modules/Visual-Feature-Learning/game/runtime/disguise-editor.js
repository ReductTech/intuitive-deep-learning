(function (global) {
  'use strict';
  const game = global.Act3DisguiseGame = global.Act3DisguiseGame || {};
  game.disguise = game.disguise || {};

  // disguise/state
  {
  let DISGUISE_TEMPLATES = game.assets.DISGUISE_TEMPLATES;
  let DISGUISE_DOTS = game.assets.DISGUISE_DOTS;
  let BRUSH_KINDS = game.assets.BRUSH_KINDS;
  let MOLE_MIN_SIZE = 6;
  let MOLE_MAX_SIZE = 19;
  let MOLE_DEFAULT_SIZE = MOLE_MAX_SIZE / 2;
  let SKIN_FILTER_PRESETS = [
    { key: 'original', label: '原生' },
    { key: 'clear', label: '清透', defaultStrength: 45 },
    { key: 'cool', label: '冷萃', defaultStrength: 48 },
    { key: 'warmSun', label: '暖阳', defaultStrength: 46 },
    { key: 'film', label: '胶片', defaultStrength: 52 },
    { key: 'blackGold', label: '黑金', defaultStrength: 48 },
    { key: 'roseGlow', label: '霞光', defaultStrength: 44 }
  ];

  function createEditorState() {
    return {
      tool: 'moustache',
      templateKey: 'normal',
      template: DISGUISE_TEMPLATES.normal,
      beardVariant: null,
      selected: false,
      marks: [],
      markData: [],
      similarityTimer: null,
      skinFilterPreviewTimer: null,
      liveStrokePreviewTimer: null,
      similarityRequestId: 0,
      lastSimilarity: null,
      painting: false,
      lastPaint: null,
      activeStrokeMark: null,
      activeStrokeVisual: null,
      reshapeStart: null,
      reshapeCurrent: null,
      previewTextureKey: 'act3-disguise-live-preview',
      previewFlattened: false,
      eyedropper: false,
      guideSeen: { brush: false, mole: false },
      params: {
        moustacheDensity: 3,
        moustacheSize: 1,
        moleTextureKey: DISGUISE_DOTS[0].textureKey,
        moleMaskTextureKey: DISGUISE_DOTS[0].maskTextureKey,
        moleColor: 'rgba(45, 24, 16, 1)',
        moleSize: MOLE_DEFAULT_SIZE,
        moleOpacity: 100,
        brushDiameter: BRUSH_KINDS[0].diameter,
        brushColor: BRUSH_KINDS[0].color,
        brushStrength: BRUSH_KINDS[0].strength,
        brushKind: BRUSH_KINDS[0].key,
        skinFilterKey: 'original',
        skinFilterStrength: 55,
        reshapeRadius: 24,
        reshapeStrength: 0.5
      }
    };
  }
  function resetEditorState(state) {
    var defaults = createEditorState();
    ['tool', 'templateKey', 'template', 'beardVariant', 'selected', 'eyedropper', 'guideSeen', 'params'].forEach(function (key) {
      state[key] = defaults[key];
    });
  }
  game.disguise.state = { create: createEditorState, reset: resetEditorState, skinFilters: SKIN_FILTER_PRESETS,
    moleMinSize: MOLE_MIN_SIZE, moleMaxSize: MOLE_MAX_SIZE, moleDefaultSize: MOLE_DEFAULT_SIZE };
  }

  // disguise/editor
  {
  let constants = game.constants;
  let assets = game.assets;
  let renderer = game.disguise.renderer;
  let brush = game.disguise.brush;
  let buttons = game.ui.buttons;
  let meter = game.ui.meter;
  let similarity = game.systems.similarity;
  let SCENE_WIDTH = constants.SCENE_WIDTH;
  let SCENE_HEIGHT = constants.SCENE_HEIGHT;
  let UI_DEPTH = constants.UI_DEPTH;
  let FACE_SAMPLE_WIDTH = constants.FACE_SAMPLE_WIDTH;
  let FACE_SAMPLE_HEIGHT = constants.FACE_SAMPLE_HEIGHT;
  let EDIT_IMAGE_BOX = constants.EDIT_IMAGE_BOX;
  let DISGUISE_TEMPLATES = assets.DISGUISE_TEMPLATES;
  let DISGUISE_TEMPLATE_ORDER = assets.DISGUISE_TEMPLATE_ORDER;
  let DISGUISE_DOTS = assets.DISGUISE_DOTS;
  let BRUSH_KINDS = assets.BRUSH_KINDS;
  let BRUSH_PALETTE_COLORS = assets.BRUSH_PALETTE_COLORS;
  let smoothDisguiseFaceTextures = renderer.smoothDisguiseFaceTextures;
  let smoothTexture = renderer.smoothTexture;
  let disguiseTextureForState = renderer.disguiseTextureForState;
  let fitDisguisePortrait = renderer.fitDisguisePortrait;
  let containedDrawRect = renderer.containedDrawRect;
  let drawFaceCanvas = renderer.drawFaceCanvas;
  let pointerToImageUv = renderer.pointerToImageUv;
  let createSimilarityMeter = meter.createSimilarityMeter;
  let scheduleSimilarityUpdate = similarity.scheduleSimilarityUpdate;
  let requestDisguiseSimilarity = similarity.requestDisguiseSimilarity;
  let createTemplateCard = buttons.createTemplateCard;
  let addDisguiseFrame = buttons.addDisguiseFrame;
  let createDisguiseTitle = buttons.createDisguiseTitle;
  let createDisguiseBottomShell = buttons.createDisguiseBottomShell;
  let createIconToolButton = buttons.createIconToolButton;
  let createDisguiseActionButton = buttons.createDisguiseActionButton;
  let createDisguiseOption = buttons.createDisguiseOption;
  let createDisguiseSwatch = buttons.createDisguiseSwatch;
  let cloneMarkData = brush.cloneMarkData;
  let cssColorToNumber = brush.cssColorToNumber;
  let addDisguiseMark = brush.addDisguiseMark;
  let brushPointSpacing = brush.brushPointSpacing;
  let brushVisualStyle = brush.brushVisualStyle;
  let createBrushStrokeData = brush.createBrushStrokeData;
  let createBrushStrokeVisual = brush.createBrushStrokeVisual;
  let editorState = game.disguise.state;
  let MOLE_MIN_SIZE = editorState.moleMinSize;
  let MOLE_MAX_SIZE = editorState.moleMaxSize;
  let MOLE_DEFAULT_SIZE = editorState.moleDefaultSize;
  let SKIN_FILTER_PRESETS = editorState.skinFilters;

  function ensureMoleAlphaMask(scene, dot) {
    var maskKey = dot.maskTextureKey || dot.textureKey + 'AlphaMask';
    dot.maskTextureKey = maskKey;
    if (scene.textures.exists(maskKey)) return maskKey;
    var source = scene.textures.get(dot.textureKey).getSourceImage();
    if (!source) return dot.textureKey;
    var width = source.naturalWidth || source.width || 1;
    var height = source.naturalHeight || source.height || 1;
    var texture = scene.textures.createCanvas(maskKey, width, height);
    var context = texture && texture.getContext ? texture.getContext() : null;
    if (!context) return dot.textureKey;
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'destination-in';
    context.drawImage(source, 0, 0, width, height);
    context.globalCompositeOperation = 'source-over';
    texture.refresh();
    return maskKey;
  }

  function startInspectionSequence(scene) {
    return game.cutscene.opening.startInspectionSequence(scene);
  }

  function createDisguiseEditor(scene) {
    smoothDisguiseFaceTextures(scene);
    DISGUISE_DOTS.forEach(function (dot) { ensureMoleAlphaMask(scene, dot); });

    var container = scene.add.container(0, 0).setDepth(UI_DEPTH + 100).setVisible(false);
    var roomGhost = scene.add.image(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, 'room');
    roomGhost.setDisplaySize(SCENE_WIDTH, SCENE_HEIGHT);
    roomGhost.setAlpha(0.24);
    var mask = scene.add.rectangle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, SCENE_WIDTH, SCENE_HEIGHT, 0x050403, 0.76);
    var vignette = scene.add.graphics();
    vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.36, 0.36, 0.82, 0.82);
    vignette.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
    var frameLayer = scene.add.container(0, 0);
    addDisguiseFrame(scene, frameLayer);
    var title = createDisguiseTitle(scene, 62, '帮助林墨乔装');
    var cardLayer = scene.add.container(0, 0);
    var editorLayer = scene.add.container(0, 0).setVisible(false);
    var editLayer = scene.add.container(0, 0);
    var toolButtons = {};

    var state = game.disguise.state.create();

    var backButton = scene.add.container(68, 62).setSize(60, 60).setInteractive({ useHandCursor: true });
    var backGlow = scene.add.circle(0, 0, 31, 0xffd083, 0.08);
    var backRing = scene.add.circle(0, 0, 28, 0x17120d, 0.8).setStrokeStyle(3, 0xb59768, 0.6);
    var backText = scene.add.text(0, -2, '↶', {
      fontFamily: 'Georgia, Microsoft YaHei, serif',
      fontSize: '36px',
      color: '#e8c990'
    }).setOrigin(0.5);
    backButton.add([backGlow, backRing, backText]);
    backButton.on('pointerdown', function () {
      if (editorLayer.visible) {
        editorLayer.setVisible(false);
        cardLayer.setVisible(true);
        hideBrushCursor();
      }
    });

    var chooseTitle = scene.add.text(SCENE_WIDTH / 2, 230, '先选一个可疑度最低的身份', {
      fontFamily: 'STKaiti, KaiTi, SimSun, Microsoft YaHei, serif',
      fontSize: '34px',
      color: '#fff0bf',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    var identityDescriptions = {
      normal: '保留原本样貌，\n最容易被排查认出。',
      farmer: '朴素寡言的乡民，\n面部特征更粗粝。',
      trader: '精明干练的南方商人，\n注重仪表与气度。',
      teacher: '沉稳克制的教书先生，\n气质斯文。'
    };
    var templateText = scene.add.text(-124, -92, '身份：不变', {
      fontFamily: 'STKaiti, KaiTi, SimSun, Microsoft YaHei, serif',
      fontSize: '30px',
      color: '#ffe6ae',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    var portraitShadow = scene.add.graphics();
    portraitShadow.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.48, 0.1, 0.1, 0.48);
    portraitShadow.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
    portraitShadow.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.48, 0.48, 0, 0);
    portraitShadow.fillRect(0, 0, 330, SCENE_HEIGHT);
    portraitShadow.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.48, 0.48);
    portraitShadow.fillRect(SCENE_WIDTH - 330, 0, 330, SCENE_HEIGHT);
    portraitShadow.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.72, 0.72, 0, 0);
    portraitShadow.fillRect(0, 0, SCENE_WIDTH, 180);
    portraitShadow.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.76, 0.76);
    portraitShadow.fillRect(0, 690, SCENE_WIDTH, SCENE_HEIGHT - 690);
    var identityPanel = scene.add.graphics();
    identityPanel.fillStyle(0x15100b, 0.86);
    identityPanel.lineStyle(2, 0xb88a4d, 0.78);
    identityPanel.fillRoundedRect(-150, -145, 300, 290, 6);
    identityPanel.strokeRoundedRect(-150, -145, 300, 290, 6);
    identityPanel.lineStyle(1, 0xd2aa67, 0.38);
    identityPanel.strokeRoundedRect(-140, -135, 280, 270, 4);
    var identityRuleLeft = scene.add.rectangle(-94, -48, 82, 2, 0xa47b45, 0.62);
    var identityRuleRight = scene.add.rectangle(94, -48, 82, 2, 0xa47b45, 0.62);
    var identityDiamond = scene.add.rectangle(0, -48, 10, 10, 0xb98b4c, 0.74).setRotation(Math.PI / 4);
    var identityDescription = scene.add.text(-124, -12, identityDescriptions.normal, {
      fontFamily: 'STKaiti, KaiTi, SimSun, Microsoft YaHei, serif',
      fontSize: '18px',
      color: '#cdb48b',
      lineSpacing: 10,
      wordWrap: { width: 248 }
    });
    var identityIcon = scene.add.image(0, 102, 'act3IconIdentity').setDisplaySize(38, 38).setTint(0x9b7747).setAlpha(0.72);
    var identityCard = scene.add.container(218, 402, [
      identityPanel,
      templateText,
      identityRuleLeft,
      identityRuleRight,
      identityDiamond,
      identityDescription,
      identityIcon
    ]).setSize(300, 290).setInteractive();
    var editImage = scene.add.image(SCENE_WIDTH / 2, 440, state.template.textureKey);
    fitDisguisePortrait(editImage);
    var previewOverlay = scene.add.image(editImage.x, editImage.y, state.template.textureKey).setVisible(false);
    fitDisguisePortrait(previewOverlay);
    var hit = scene.add.rectangle(SCENE_WIDTH / 2, 458, 900, 760, 0xffffff, 0.001).setInteractive();
    var brushCursor = scene.add.graphics().setVisible(false);
    var moleCursor = scene.add.image(0, 0, state.params.moleMaskTextureKey).setVisible(false);
    var bottomShell = createDisguiseBottomShell(scene);
    var paramLayer = scene.add.container(0, 0);
    var paletteLayer = scene.add.container(0, 0).setVisible(false);
    var paramTitle = scene.add.text(132, 798, '妆效', {
      fontFamily: 'STKaiti, KaiTi, SimSun, Microsoft YaHei, serif',
      fontSize: '28px',
      color: '#f2d5a1',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    var similarityMeter = createSimilarityMeter(scene, SCENE_WIDTH / 2, 170, 420);
    var paramControls = [];
    var templateCards = {};
    var paletteTarget = 'brush';
    var guideLayer = scene.add.container(0, 0).setVisible(false);
    var guideGestureCursor = null;

    function stopGuideMotion() {
      if (guideGestureCursor) scene.tweens.killTweensOf(guideGestureCursor);
    }

    function finishGuide() {
      stopGuideMotion();
      guideLayer.setVisible(false);
    }

    function showToolGesture(tool) {
      if ((tool !== 'brush' && tool !== 'mole') || state.guideSeen[tool] || !guideGestureCursor) return;
      state.guideSeen[tool] = true;
      stopGuideMotion();
      guideLayer.setVisible(true);
      if (tool === 'brush') {
        guideGestureCursor
          .setTexture('act3GuidePencil')
          .setScale(1)
          .setDisplaySize(58, 58)
          .setRotation(-0.55)
          .setPosition(675, 390)
          .setAlpha(0.96);
        scene.tweens.add({
          targets: guideGestureCursor,
          x: 825,
          y: 470,
          duration: 720,
          repeat: 2,
          repeatDelay: 160,
          ease: 'Sine.easeInOut',
          onComplete: finishGuide
        });
      } else {
        guideGestureCursor
          .setTexture('act3GuideHand')
          .setScale(1)
          .setDisplaySize(52, 70)
          .setRotation(-0.12)
          .setPosition(755, 380)
          .setAlpha(0.96);
        scene.tweens.add({
          targets: guideGestureCursor,
          y: 416,
          alpha: 0.72,
          duration: 360,
          repeat: 2,
          yoyo: true,
          repeatDelay: 120,
          ease: 'Sine.easeInOut',
          onComplete: finishGuide
        });
      }
    }

    function clearMarks() {
      similarity.cancelSimilarityUpdate(state);
      if (state.skinFilterPreviewTimer) {
        state.skinFilterPreviewTimer.remove(false);
        state.skinFilterPreviewTimer = null;
      }
      if (state.liveStrokePreviewTimer) {
        state.liveStrokePreviewTimer.remove(false);
        state.liveStrokePreviewTimer = null;
      }
      state.marks.forEach(function (mark) { mark.destroy(); });
      state.marks = [];
      state.markData = [];
      state.lastSimilarity = null;
      state.painting = false;
      state.lastPaint = null;
      state.activeStrokeMark = null;
      state.activeStrokeVisual = null;
      state.reshapeStart = null;
      state.reshapeCurrent = null;
      state.previewFlattened = false;
      state.params.skinFilterKey = 'original';
      if (scene.textures.exists(state.previewTextureKey)) {
        previewOverlay.setVisible(false).setTexture(disguiseTextureForState(state));
        scene.textures.remove(state.previewTextureKey);
      }
    }

    function addParamButton(x, y, label, onClick, width) {
      var button = createDisguiseOption(scene, x, y, width || 106, label, onClick);
      paramLayer.add(button);
      paramControls.push(button);
      return button;
    }

    function addSwatchButton(x, y, fill, label, selected, onClick) {
      var button = createDisguiseSwatch(scene, x, y, fill, label, selected, onClick);
      paramLayer.add(button);
      paramControls.push(button);
      return button;
    }

    function addToolDivider() {
      var divider = scene.add.container(0, 0);
      var line = scene.add.rectangle(520, 764, 2, 86, 0xb28a55, 0.58);
      var label = scene.add.text(544, 716, '妆效目的', {
        fontFamily: 'Microsoft YaHei, sans-serif',
        fontSize: '14px',
        color: '#bfa77d',
        fontStyle: 'bold'
      });
      divider.add([line, label]);
      paramLayer.add(divider);
      paramControls.push(divider);
      return divider;
    }

    function addParamLabel(x, y, label) {
      var text = scene.add.text(x, y, label, {
        fontFamily: 'Microsoft YaHei, sans-serif',
        fontSize: '14px',
        color: '#bfa77d',
        fontStyle: 'bold'
      });
      paramLayer.add(text);
      paramControls.push(text);
      return text;
    }

    function showEffectBurst(x, y, fill) {
      var burst = scene.add.container(0, 0);
      for (var index = 0; index < 6; index += 1) {
        var angle = index * Math.PI / 3;
        var dot = scene.add.circle(x, y, index % 2 ? 3 : 5, fill, 0.9);
        burst.add(dot);
        scene.tweens.add({
          targets: dot,
          x: x + Math.cos(angle) * 34,
          y: y + Math.sin(angle) * 22,
          alpha: 0,
          scaleX: 0.35,
          scaleY: 0.35,
          duration: 340,
          ease: 'Cubic.easeOut'
        });
      }
      paramLayer.add(burst);
      scene.time.delayedCall(360, function () { burst.destroy(true); });
    }

    function addEffectButton(x, y, item) {
      var selected = state.params.brushKind === item.key;
      var button = addParamButton(x, y, (selected ? '✓ ' : '') + item.label, function () {
        finishActiveStroke();
        state.params.brushKind = item.key;
        state.params.brushColor = item.color;
        state.params.brushDiameter = item.diameter;
        state.params.brushStrength = item.strength;
        state.eyedropper = false;
        updateParamPanel();
        showEffectBurst(x, y, item.fill);
      });
      var swatch = scene.add.circle(x - 40, y - 18, 6, item.fill, 0.96)
        .setStrokeStyle(selected ? 2 : 1, selected ? 0xffe1a0 : 0x6f5b45, 0.9);
      paramLayer.add(swatch);
      paramControls.push(swatch);
      if (selected) {
        scene.tweens.add({
          targets: button,
          scaleX: 1.035,
          scaleY: 1.035,
          duration: 560,
          yoyo: true,
          ease: 'Sine.easeInOut'
        });
      }
      return button;
    }

    function addDotButton(x, y, dot) {
      var selected = state.params.moleTextureKey === dot.textureKey;
      var button = scene.add.container(x, y).setSize(72, 74).setInteractive({ useHandCursor: true });
      var ring = scene.add.circle(0, -8, 30, 0x17100b, 0.94);
      ring.setStrokeStyle(selected ? 4 : 2, selected ? 0xffd47e : 0x746454, selected ? 0.96 : 0.68);
      var preview = scene.add.image(0, -8, dot.maskTextureKey || dot.textureKey)
        .setDisplaySize(42, 42)
        .setTint(cssColorToNumber(state.params.moleColor, 0x2d1810))
        .setAlpha(selected ? 1 : 0.82);
      var text = scene.add.text(0, 36, dot.textureKey.replace('act3Dot', ''), {
        fontFamily: 'Microsoft YaHei, sans-serif',
        fontSize: '14px',
        color: selected ? '#ffe6ae' : '#d9bd8f',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      button.add([ring, preview, text]);
      button.on('pointerdown', function () {
        state.params.moleTextureKey = dot.textureKey;
        state.params.moleMaskTextureKey = dot.maskTextureKey || dot.textureKey;
        updateParamPanel();
        refreshBrushCursor();
      });
      paramLayer.add(button);
      paramControls.push(button);
      return button;
    }

    function addParamSlider(x, y, width, label, min, max, value, onChange) {
      var containerSlider = scene.add.container(x, y);
      var titleText = scene.add.text(0, -24, label, {
        fontFamily: 'Microsoft YaHei, sans-serif',
        fontSize: '16px',
        color: '#f2d5a1',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);
      var track = scene.add.rectangle(width / 2, 8, width, 8, 0x49321e, 0.95).setStrokeStyle(2, 0xa98350, 0.7);
      var fill = scene.add.rectangle(0, 8, 1, 8, 0xd29a49, 0.95).setOrigin(0, 0.5);
      var knob = scene.add.circle(0, 8, 16, 0xf4d08c, 0.98).setStrokeStyle(3, 0x402715, 0.92).setInteractive({ draggable: true, useHandCursor: true });
      function setFromValue(nextValue, notify) {
        var clamped = Math.max(min, Math.min(max, nextValue));
        var t = (clamped - min) / (max - min);
        knob.x = t * width;
        fill.width = Math.max(1, t * width);
        if (notify) onChange(clamped);
      }

      function setFromPointer(pointer) {
        var localX = Phaser.Math.Clamp(pointer.x - x, 0, width);
        setFromValue(min + (localX / width) * (max - min), true);
      }

      knob.on('drag', function (pointer) { setFromPointer(pointer); });
      track.setInteractive({ useHandCursor: true });
      track.on('pointerdown', setFromPointer);
      fill.setInteractive({ useHandCursor: true });
      fill.on('pointerdown', setFromPointer);
      setFromValue(value, false);
      containerSlider.add([titleText, track, fill, knob]);
      paramLayer.add(containerSlider);
      paramControls.push(containerSlider);
      return containerSlider;
    }

    function clearParamControls() {
      paramControls.forEach(function (item) {
        scene.tweens.killTweensOf(item);
        item.destroy();
      });
      paramControls = [];
    }

    function syncToolButtonStyles() {
      Object.keys(toolButtons).forEach(function (tool) {
        if (toolButtons[tool].setActiveStyle) {
          toolButtons[tool].setActiveStyle(tool === state.tool);
        }
      });
    }

    function applyFaceTexture() {
      if (state.markData.length) {
        refreshCompositePreview();
        return;
      }
      var textureKey = disguiseTextureForState(state);
      smoothTexture(scene, textureKey);
      editImage.setTexture(textureKey);
      fitDisguisePortrait(editImage);
      previewOverlay.setVisible(false).setTexture(textureKey);
    }

    function renderCompositePreview() {
      var baseTextureKey = disguiseTextureForState(state);
      var sourceImage = scene.textures.get(baseTextureKey).getSourceImage();
      var previewScale = Math.min(1, 1024 / Math.max(1, sourceImage.width || 1), 1024 / Math.max(1, sourceImage.height || 1));
      var previewWidth = Math.max(1, Math.round((sourceImage.width || 1) * previewScale));
      var previewHeight = Math.max(1, Math.round((sourceImage.height || 1) * previewScale));
      var rendered = drawFaceCanvas(scene, baseTextureKey, state.markData, previewWidth, previewHeight);
      var baseRendered = drawFaceCanvas(scene, baseTextureKey, [], previewWidth, previewHeight);
      var sourceRect = containedDrawRect(sourceImage, rendered.width, rendered.height);
      var previewCanvas = document.createElement('canvas');
      var baseCanvas = document.createElement('canvas');
      previewCanvas.width = Math.max(1, Math.round(sourceRect.width));
      previewCanvas.height = Math.max(1, Math.round(sourceRect.height));
      baseCanvas.width = previewCanvas.width;
      baseCanvas.height = previewCanvas.height;
      var previewContext = previewCanvas.getContext('2d');
      var baseContext = baseCanvas.getContext('2d');
      if (!previewContext || !baseContext) return;
      previewContext.drawImage(
        rendered,
        sourceRect.x,
        sourceRect.y,
        sourceRect.width,
        sourceRect.height,
        0,
        0,
        previewCanvas.width,
        previewCanvas.height
      );
      baseContext.drawImage(
        baseRendered,
        sourceRect.x,
        sourceRect.y,
        sourceRect.width,
        sourceRect.height,
        0,
        0,
        baseCanvas.width,
        baseCanvas.height
      );
      var previewPixels = previewContext.getImageData(0, 0, previewCanvas.width, previewCanvas.height);
      var basePixels = baseContext.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
      for (var pixel = 0; pixel < previewPixels.data.length; pixel += 4) {
        var changed = Math.abs(previewPixels.data[pixel] - basePixels.data[pixel]) > 1 ||
          Math.abs(previewPixels.data[pixel + 1] - basePixels.data[pixel + 1]) > 1 ||
          Math.abs(previewPixels.data[pixel + 2] - basePixels.data[pixel + 2]) > 1 ||
          Math.abs(previewPixels.data[pixel + 3] - basePixels.data[pixel + 3]) > 1;
        if (!changed) previewPixels.data[pixel + 3] = 0;
      }
      previewContext.putImageData(previewPixels, 0, 0);

      editImage.setTexture(baseTextureKey);
      fitDisguisePortrait(editImage);
      if (scene.textures.exists(state.previewTextureKey)) {
        var previewTexture = scene.textures.get(state.previewTextureKey);
        var textureCanvas = previewTexture.getSourceImage();
        if (textureCanvas.width !== previewCanvas.width || textureCanvas.height !== previewCanvas.height) {
          textureCanvas.width = previewCanvas.width;
          textureCanvas.height = previewCanvas.height;
        }
        var textureContext = textureCanvas.getContext('2d');
        textureContext.clearRect(0, 0, textureCanvas.width, textureCanvas.height);
        textureContext.drawImage(previewCanvas, 0, 0);
        previewTexture.refresh();
      } else {
        scene.textures.addCanvas(state.previewTextureKey, previewCanvas);
        smoothTexture(scene, state.previewTextureKey);
      }
      previewOverlay.setTexture(state.previewTextureKey).setVisible(true);
      fitDisguisePortrait(previewOverlay);
      state.previewFlattened = true;
    }

    function refreshCompositePreview() {
      if (state.liveStrokePreviewTimer) {
        state.liveStrokePreviewTimer.remove(false);
        state.liveStrokePreviewTimer = null;
      }
      renderCompositePreview();
      editLayer.removeAll(true);
      state.marks = [];
      state.activeStrokeMark = null;
      state.activeStrokeVisual = null;
    }

    function scheduleLiveStrokePreview() {
      if (state.liveStrokePreviewTimer) return;
      state.liveStrokePreviewTimer = scene.time.delayedCall(45, function () {
        state.liveStrokePreviewTimer = null;
        if (state.painting && state.activeStrokeMark) renderCompositePreview();
      });
    }

    var cursor = game.disguise.cursor.create(scene, state, editorLayer, editImage, brushCursor, moleCursor);
    var shouldShowBrushCursor = cursor.visible;
    var drawBrushCursor = cursor.draw;
    var hideBrushCursor = cursor.hide;
    var refreshBrushCursor = cursor.refresh;

    function setBrushDiameter(value) {
      var maxDiameter = state.params.brushKind === 'shapeBrow' ? 112 : 56;
      state.params.brushDiameter = Math.max(12, Math.min(maxDiameter, value));
      refreshBrushCursor();
    }

    function setBrushStrength(value) {
      var maxStrength = state.params.brushKind === 'pixelate' ? 10 : state.params.brushKind === 'blurBrush' ? 8 : 5;
      state.params.brushStrength = Math.max(1, Math.min(maxStrength, value));
    }

    function setReshapeRadius(value) {
      state.params.reshapeRadius = Math.max(12, Math.min(36, value));
      refreshBrushCursor();
    }

    function setReshapeStrength(value) {
      state.params.reshapeStrength = Math.max(0.25, Math.min(1, value));
    }

    function addBrushSliders(x, y) {
      var maxDiameter = state.params.brushKind === 'shapeBrow' ? 112 : 56;
      var strengthLabel = state.params.brushKind === 'pixelate'
        ? '像素程度'
        : state.params.brushKind === 'blurBrush' ? '去皱程度' : '力度';
      var maxStrength = state.params.brushKind === 'pixelate' ? 10 : state.params.brushKind === 'blurBrush' ? 8 : 5;
      addParamSlider(x, y, 360, '范围', 12, maxDiameter, state.params.brushDiameter || 24, setBrushDiameter);
      addParamSlider(x + 498, y, 360, strengthLabel, 1, maxStrength, state.params.brushStrength || 3, setBrushStrength);
    }

    function setMoleSize(value) {
      state.params.moleSize = Math.max(MOLE_MIN_SIZE, Math.min(MOLE_MAX_SIZE, value));
      refreshBrushCursor();
    }

    function setMoleOpacity(value) {
      state.params.moleOpacity = Math.max(20, Math.min(100, value));
      refreshBrushCursor();
    }

    function closePalette() {
      paletteLayer.removeAll(true);
      paletteLayer.setVisible(false);
    }

    function setPaletteColor(cssColor) {
      if (paletteTarget === 'mole') {
        var fill = cssColorToNumber(cssColor, 0x2d1810);
        state.params.moleColor = 'rgb(' + ((fill >> 16) & 255) + ', ' + ((fill >> 8) & 255) + ', ' + (fill & 255) + ')';
      } else {
        state.params.brushColor = cssColor;
      }
      closePalette();
      updateParamPanel();
      refreshBrushCursor();
    }

    function createPaletteSwatch(x, y, fill, cssColor) {
      var swatch = scene.add.circle(x, y, 22, fill, 0.98).setStrokeStyle(3, 0xf0c47a, 0.72).setInteractive({ useHandCursor: true });
      swatch.on('pointerdown', function () { setPaletteColor(cssColor); });
      paletteLayer.add(swatch);
      return swatch;
    }

    function openPalette(target) {
      paletteTarget = target === 'mole' ? 'mole' : 'brush';
      closePalette();
      var panel = scene.add.graphics();
      panel.fillStyle(0x120c08, 0.96);
      panel.lineStyle(3, 0xc89a58, 0.92);
      panel.fillRoundedRect(410, 610, 620, 246, 18);
      panel.strokeRoundedRect(410, 610, 620, 246, 18);
      var titleText = scene.add.text(438, 638, '调色盘', {
        fontFamily: 'Microsoft YaHei, sans-serif',
        fontSize: '24px',
        color: '#ffe0a3',
        fontStyle: 'bold'
      });
      var close = createDisguiseOption(scene, 968, 642, 74, '关闭', closePalette);
      var eyedrop = createDisguiseOption(scene, 914, 814, 132, '吸色笔', function () {
        state.eyedropper = true;
        closePalette();
      });
      paletteLayer.add([panel, titleText, close, eyedrop]);
      BRUSH_PALETTE_COLORS.forEach(function (item, index) {
        createPaletteSwatch(466 + index * 64, 706, item.fill, item.css);
      });
      var gradient = scene.add.graphics();
      for (var i = 0; i < 14; i += 1) {
        var color = Phaser.Display.Color.HSLToColor(i / 14, 0.58, 0.42).color;
        gradient.fillStyle(color, 0.96);
        gradient.fillRect(448 + i * 34, 766, 34, 34);
        var cell = scene.add.rectangle(465 + i * 34, 783, 34, 34, color, 0.001).setInteractive({ useHandCursor: true });
        cell.on('pointerdown', function (pointer, localX, localY, event) {
          var indexX = Math.max(0, Math.min(13, Math.floor((this.x - 448) / 34)));
          var chosen = Phaser.Display.Color.HSLToColor(indexX / 14, 0.58, 0.42);
          setPaletteColor('rgba(' + chosen.r + ', ' + chosen.g + ', ' + chosen.b + ', 1)');
          if (event) event.stopPropagation();
        });
        paletteLayer.add(cell);
      }
      paletteLayer.add(gradient);
      paletteLayer.setVisible(true);
    }

    function setBeardVariant(variant) {
      state.beardVariant = variant;
      applyFaceTexture();
      updateParamPanel();
      scheduleSimilarityUpdate(scene, state, similarityMeter);
    }

    function scheduleSkinFilterPreview() {
      if (state.skinFilterPreviewTimer) state.skinFilterPreviewTimer.remove(false);
      state.skinFilterPreviewTimer = scene.time.delayedCall(40, function () {
        state.skinFilterPreviewTimer = null;
        if (state.markData.length) refreshCompositePreview();
        else applyFaceTexture();
      });
      scheduleSimilarityUpdate(scene, state, similarityMeter);
    }

    function syncSkinFilterMark() {
      state.markData = state.markData.filter(function (mark) { return mark.tool !== 'skinFilter'; });
      if (state.params.skinFilterKey !== 'original') {
        state.markData.unshift({
          tool: 'skinFilter',
          filter: state.params.skinFilterKey,
          strength: state.params.skinFilterStrength
        });
      }
      scheduleSkinFilterPreview();
    }

    function setSkinFilter(filterKey) {
      var nextKey = filterKey || 'original';
      if (nextKey !== state.params.skinFilterKey) {
        var preset = SKIN_FILTER_PRESETS.find(function (item) { return item.key === nextKey; });
        if (preset && preset.defaultStrength) state.params.skinFilterStrength = preset.defaultStrength;
      }
      state.params.skinFilterKey = nextKey;
      syncSkinFilterMark();
      updateParamPanel();
    }

    function setSkinFilterStrength(value) {
      state.params.skinFilterStrength = Math.max(10, Math.min(100, value));
      syncSkinFilterMark();
    }

    function updateParamPanel() {
      clearParamControls();
      if (state.tool === 'moustache') {
        paramTitle.setText('胡子');
        addParamButton(408, 798, state.beardVariant ? '无' : '✓ 无', function () {
          setBeardVariant(null);
        });
        addParamButton(548, 798, state.beardVariant === 'h1' ? '✓ 胡子A' : '胡子A', function () {
          setBeardVariant('h1');
        });
        addParamButton(688, 798, state.beardVariant === 'h2' ? '✓ 胡子B' : '胡子B', function () {
          setBeardVariant('h2');
        });
      } else if (state.tool === 'mole') {
        paramTitle.setText('痣饰');
        DISGUISE_DOTS.forEach(function (dot, index) {
          addDotButton(342 + index * 78, 758, dot);
        });
        addSwatchButton(850, 758, cssColorToNumber(state.params.moleColor, 0x2d1810), '颜色', true, function () {
          openPalette('mole');
        });
        addParamSlider(342, 850, 360, '大小', MOLE_MIN_SIZE, MOLE_MAX_SIZE, state.params.moleSize || MOLE_DEFAULT_SIZE, setMoleSize);
        addParamSlider(840, 850, 360, '不透明度', 20, 100, state.params.moleOpacity || 100, setMoleOpacity);
      } else if (state.tool === 'skinTone') {
        paramTitle.setText('滤镜');
        SKIN_FILTER_PRESETS.forEach(function (preset, index) {
          addParamButton(300 + index * 100, 790, (state.params.skinFilterKey === preset.key ? '✓ ' : '') + preset.label, function () {
            setSkinFilter(preset.key);
          }, 88);
        });
        if (state.params.skinFilterKey !== 'original') {
          addParamSlider(1025, 806, 300, '滤镜强度', 10, 100, state.params.skinFilterStrength || 55, setSkinFilterStrength);
        }
      } else if (state.tool === 'reshape') {
        paramTitle.setText('塑形');
        addParamSlider(342, 806, 360, '范围', 12, 36, state.params.reshapeRadius || 24, setReshapeRadius);
        addParamSlider(840, 806, 360, '力度', 0.25, 1, state.params.reshapeStrength || 0.5, setReshapeStrength);
      } else {
        paramTitle.setText('妆容');
        var colorFill = cssColorToNumber(state.params.brushColor, 0x4a2416);
        addParamLabel(324, 716, '取色');
        addSwatchButton(350, 770, colorFill, '颜色', true, function () { openPalette('brush'); });
        addParamButton(450, 770, state.eyedropper ? '吸色中' : '吸色笔', function () {
          state.eyedropper = true;
          closePalette();
          updateParamPanel();
        });
        addToolDivider();
        BRUSH_KINDS.forEach(function (item, index) {
          addEffectButton(604 + index * 126, 770, item);
        });
        addBrushSliders(342, 850);
      }
      syncToolButtonStyles();
      refreshBrushCursor();
    }

    function revealParamPanel() {
      scene.tweens.killTweensOf(paramLayer);
      scene.tweens.killTweensOf(paramTitle);
      paramLayer.setAlpha(0).setY(12);
      paramTitle.setAlpha(0).setY(810);
      scene.tweens.add({
        targets: paramLayer,
        alpha: 1,
        y: 0,
        duration: 190,
        ease: 'Back.easeOut'
      });
      scene.tweens.add({
        targets: paramTitle,
        alpha: 1,
        y: 798,
        duration: 190,
        ease: 'Back.easeOut'
      });
    }

    function selectTool(tool) {
      finishGuide();
      state.tool = tool;
      updateParamPanel();
      revealParamPanel();
      if (tool === 'moustache' || tool === 'skinTone') {
        hideBrushCursor();
      }
      showToolGesture(tool);
    }

    function selectTemplate(templateKey) {
      var template = DISGUISE_TEMPLATES[templateKey] || DISGUISE_TEMPLATES.normal;
      state.templateKey = templateKey;
      state.template = template;
      state.beardVariant = null;
      state.selected = true;
      clearMarks();
      applyFaceTexture();
      Object.keys(templateCards).forEach(function (key) {
        templateCards[key].setSelected(key === templateKey);
      });
      cardLayer.setVisible(false);
      editorLayer.setVisible(true);
      templateText.setText('身份：' + template.label);
      identityDescription.setText(identityDescriptions[templateKey] || identityDescriptions.normal);
      similarityMeter.reset();
      selectTool('moustache');
      scheduleSimilarityUpdate(scene, state, similarityMeter);
    }

    function sampleFaceColor(pointer) {
      var uv = pointerToImageUv(editImage, pointer);
      if (!uv) return;
      var canvas = drawFaceCanvas(scene, disguiseTextureForState(state), state.markData);
      var context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;
      var image = scene.textures.get(disguiseTextureForState(state)).getSourceImage();
      var imageRect = containedDrawRect(image, FACE_SAMPLE_WIDTH, FACE_SAMPLE_HEIGHT);
      var sx = Math.max(0, Math.min(FACE_SAMPLE_WIDTH - 1, Math.round(imageRect.x + uv.u * imageRect.width)));
      var sy = Math.max(0, Math.min(FACE_SAMPLE_HEIGHT - 1, Math.round(imageRect.y + uv.v * imageRect.height)));
      var pixel = context.getImageData(sx, sy, 1, 1).data;
      var sampledColor = 'rgba(' + pixel[0] + ', ' + pixel[1] + ', ' + pixel[2] + ', 1)';
      if (paletteTarget === 'mole') state.params.moleColor = sampledColor;
      else state.params.brushColor = sampledColor;
      state.eyedropper = false;
      updateParamPanel();
    }

    function paintAtPointer(pointer, force) {
      if (!state.selected || state.tool === 'moustache') return;
      if (state.tool === 'reshape' || state.tool === 'skinTone') return;
      if (state.eyedropper) {
        sampleFaceColor(pointer);
        state.painting = false;
        return;
      }
      var uv = pointerToImageUv(editImage, pointer);
      if (!uv) return;
      if (state.tool === 'brush' || state.tool === 'mole') {
        finishGuide();
      }
      if (state.tool === 'mole') {
        if (!force) return;
        addDisguiseMark(scene, editLayer, state, pointer.x, pointer.y, uv, editImage);
        refreshCompositePreview();
        scheduleSimilarityUpdate(scene, state, similarityMeter);
        return;
      }
      var spacing = Math.max(2.5, (state.params.brushDiameter || 24) * brushPointSpacing(state.params.brushKind));
      if (!force && state.lastPaint) {
        var dx = pointer.x - state.lastPaint.x;
        var dy = pointer.y - state.lastPaint.y;
        if (Math.sqrt(dx * dx + dy * dy) < spacing) return;
      }
      if (!state.activeStrokeMark) {
        state.activeStrokeMark = createBrushStrokeData(uv, editImage, state.params);
        state.activeStrokeMark.screenPoints = [{ x: pointer.x, y: pointer.y }];
        state.activeStrokeVisual = createBrushStrokeVisual(scene, state.activeStrokeMark);
        state.activeStrokeVisual.setVisible(false);
        editLayer.add(state.activeStrokeVisual);
        state.marks.push(state.activeStrokeVisual);
        state.markData.push(state.activeStrokeMark);
      } else {
        state.activeStrokeMark.points.push({ u: uv.u, v: uv.v });
        state.activeStrokeMark.screenPoints.push({ x: pointer.x, y: pointer.y });
      }
      state.lastPaint = { x: pointer.x, y: pointer.y };
      scheduleLiveStrokePreview();
    }

    function finishActiveStroke() {
      if (state.reshapeStart) {
        var reshapeStart = state.reshapeStart;
        var reshapeCurrent = state.reshapeCurrent;
        state.reshapeStart = null;
        state.reshapeCurrent = null;
        state.painting = false;
        if (reshapeCurrent) {
          var reshapeDx = reshapeCurrent.x - reshapeStart.x;
          var reshapeDy = reshapeCurrent.y - reshapeStart.y;
          if (Math.sqrt(reshapeDx * reshapeDx + reshapeDy * reshapeDy) >= 4) {
            similarityMeter.setPending();
            state.markData.push({
              tool: 'reshape',
              fromU: reshapeStart.u,
              fromV: reshapeStart.v,
              toU: reshapeCurrent.u,
              toV: reshapeCurrent.v,
              radius: state.params.reshapeRadius || 24,
              strength: state.params.reshapeStrength || 0.5,
              displayWidth: editImage.displayWidth,
              displayHeight: editImage.displayHeight
            });
            refreshCompositePreview();
            var pulse = scene.add.circle(reshapeCurrent.x, reshapeCurrent.y, 18, 0xffd98a, 0.10)
              .setStrokeStyle(4, 0xffd98a, 0.9);
            editorLayer.add(pulse);
            scene.tweens.add({
              targets: pulse,
              scaleX: 2.2,
              scaleY: 2.2,
              alpha: 0,
              duration: 300,
              ease: 'Cubic.easeOut',
              onComplete: function () { pulse.destroy(); }
            });
            scheduleSimilarityUpdate(scene, state, similarityMeter);
          }
        }
        hideBrushCursor();
        return;
      }
      if (state.activeStrokeMark) {
        scheduleSimilarityUpdate(scene, state, similarityMeter);
        refreshCompositePreview();
      }
      state.painting = false;
      state.lastPaint = null;
      state.activeStrokeMark = null;
      state.activeStrokeVisual = null;
    }

    hit.on('pointerover', function (pointer) {
      if (scene.game && scene.game.canvas) {
        scene.game.canvas.style.cursor = shouldShowBrushCursor() ? 'none' : '';
      }
      drawBrushCursor(pointer);
    });
    hit.on('pointermove', function (pointer) {
      if (scene.game && scene.game.canvas) {
        scene.game.canvas.style.cursor = shouldShowBrushCursor() ? 'none' : '';
      }
      if (state.tool === 'reshape' && state.painting && state.reshapeStart) {
        var reshapeUv = pointerToImageUv(editImage, pointer);
        if (reshapeUv) {
          state.reshapeCurrent = { u: reshapeUv.u, v: reshapeUv.v, x: pointer.x, y: pointer.y };
        }
      }
      drawBrushCursor(pointer);
      if (state.painting) {
        paintAtPointer(pointer, false);
      }
    });
    hit.on('pointerout', function () {
      finishActiveStroke();
      hideBrushCursor();
    });
    hit.on('pointerdown', function (pointer) {
      if (!state.selected) return;
      if (state.tool === 'moustache' || state.tool === 'skinTone') return;
      if (state.tool === 'reshape') {
        var reshapeUv = pointerToImageUv(editImage, pointer);
        if (!reshapeUv) return;
        state.painting = true;
        state.reshapeStart = { u: reshapeUv.u, v: reshapeUv.v, x: pointer.x, y: pointer.y };
        state.reshapeCurrent = { u: reshapeUv.u, v: reshapeUv.v, x: pointer.x, y: pointer.y };
        drawBrushCursor(pointer);
        return;
      }
      similarityMeter.setPending();
      state.painting = true;
      state.lastPaint = null;
      paintAtPointer(pointer, true);
    });
    scene.input.on('pointerup', function () {
      finishActiveStroke();
    });

    DISGUISE_TEMPLATE_ORDER.forEach(function (templateKey, index) {
      var card = createTemplateCard(scene, 258 + index * 310, 532, templateKey, selectTemplate);
      templateCards[templateKey] = card;
      cardLayer.add(card.card);
    });
    cardLayer.add(chooseTitle);

    var identityButton = createDisguiseOption(scene, 190, 62, 126, '换身份', function () {
      editorLayer.setVisible(false);
      cardLayer.setVisible(true);
      hideBrushCursor();
    });
    var moustacheButton = createIconToolButton(scene, 422, 974, 'moustache', '胡子', function () {
      selectTool('moustache');
    });
    var moleButton = createIconToolButton(scene, 573, 974, 'mole', '痣', function () {
      selectTool('mole');
    });
    var brushButton = createIconToolButton(scene, 724, 974, 'makeup', '妆效', function () {
      selectTool('brush');
    });
    var skinToneButton = createIconToolButton(scene, 875, 974, 'skinTone', '滤镜', function () {
      selectTool('skinTone');
    });
    var reshapeButton = createIconToolButton(scene, 1026, 974, 'reshape', '塑形', function () {
      selectTool('reshape');
    });
    var reshapeIconCover = scene.add.rectangle(-40, 0, 36, 36, 0x2d2923, 0.96);
    var reshapeArrow = scene.add.text(-40, -2, '↔', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '30px',
      color: '#f4d89b',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    reshapeButton.add([reshapeIconCover, reshapeArrow]);
    toolButtons.moustache = moustacheButton;
    toolButtons.mole = moleButton;
    toolButtons.brush = brushButton;
    toolButtons.skinTone = skinToneButton;
    toolButtons.reshape = reshapeButton;

    if (scene.input.keyboard) {
      scene.input.keyboard.on('keydown', function (event) {
        if (!container.visible || !editorLayer.visible || !event) return;
        if (event.key === '1') selectTool('moustache');
        else if (event.key === '2') selectTool('mole');
        else if (event.key === '3') selectTool('brush');
        else if (event.key === '4') selectTool('skinTone');
        else if (event.key === '5') selectTool('reshape');
      });
    }

    guideGestureCursor = scene.add.image(640, 390, 'act3GuidePencil').setVisible(true);
    guideLayer.add(guideGestureCursor);

    var clearButton = createDisguiseActionButton(scene, 1162, 62, 118, '清除', false, function () {
      clearMarks();
      state.beardVariant = null;
      applyFaceTexture();
      updateParamPanel();
      scheduleSimilarityUpdate(scene, state, similarityMeter);
    });
    var finishButton = createDisguiseActionButton(scene, 1302, 62, 138, '化好了', true, function () {
      if (scene.inspectionRunning) return;
      scene.inspectionRunning = true;
      finishActiveStroke();
      similarity.cancelSimilarityUpdate(state);
      scene.disguiseMarks = state.markData.map(cloneMarkData);
      scene.disguiseTemplateKey = state.templateKey;
      scene.disguiseFaceTexture = disguiseTextureForState(state);
      scene.disguiseActorKey = state.template.actorKey;
      scene.disguiseSimilarity = null;
      // One immutable snapshot is used by both the request and the teaching view.
      scene.disguiseSimilarityPromise = requestDisguiseSimilarity(scene, scene.disguiseFaceTexture, scene.disguiseMarks)
        .then(function (result) { scene.disguiseSimilarity = result; return result; })
        .catch(function (error) {
          if (!game.systems.lifecycle.isCancelled(error)) console.warn('Disguise similarity unavailable', error);
          return null;
        });
      hideBrushCursor();
      finishGuide();
      container.setVisible(false);
      startInspectionSequence(scene);
    });

    container.add([
      roomGhost,
      mask,
      vignette,
      editorLayer,
      frameLayer,
      title,
      backButton,
      cardLayer
    ]);
    editorLayer.add([
      editImage,
      previewOverlay,
      portraitShadow,
      editLayer,
      hit,
      brushCursor,
      moleCursor,
      bottomShell,
      identityButton,
      identityCard,
      paramLayer,
      paramTitle,
      similarityMeter.node,
      moustacheButton,
      moleButton,
      brushButton,
      skinToneButton,
      reshapeButton,
      clearButton,
      finishButton,
      paletteLayer,
      guideLayer
    ]);

    scene.events.once('shutdown', function () {
      similarity.cancelSimilarityUpdate(state);
      if (state.skinFilterPreviewTimer) state.skinFilterPreviewTimer.remove(false);
      if (state.liveStrokePreviewTimer) state.liveStrokePreviewTimer.remove(false);
      if (scene.game && scene.game.canvas) scene.game.canvas.style.cursor = '';
    });

    return {
      show: function () {
        container.setVisible(true);
        cardLayer.setVisible(!state.selected);
        editorLayer.setVisible(state.selected);
        if (state.selected) {
          scheduleSimilarityUpdate(scene, state, similarityMeter);
        }
      },
      showUnavailable: function () {
        container.setVisible(true);
        cardLayer.setVisible(false);
        editorLayer.setVisible(true);
        similarityMeter.setUnavailable();
      },
      hide: function () {
        finishActiveStroke();
        similarity.cancelSimilarityUpdate(state);
        container.setVisible(false);
        hideBrushCursor();
      },
      reset: function () {
        clearMarks();
        editorState.reset(state);
        templateText.setText('身份：不变');
        identityDescription.setText(identityDescriptions.normal);
        stopGuideMotion();
        guideLayer.setVisible(false);
        applyFaceTexture();
        Object.keys(templateCards).forEach(function (key) {
          templateCards[key].setSelected(false);
        });
        cardLayer.setVisible(true);
        editorLayer.setVisible(false);
        similarityMeter.reset();
        updateParamPanel();
      },
      marks: function () {
        return state.markData.map(function (mark) {
          return cloneMarkData(mark);
        });
      }
    };
  }

  game.disguise.editor = {
    createDisguiseEditor: createDisguiseEditor
  };
  }
}(window));

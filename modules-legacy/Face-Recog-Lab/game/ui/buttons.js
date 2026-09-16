(function (global) {
  'use strict';

  var game = global.Act3DisguiseGame = global.Act3DisguiseGame || {};
  var SCENE_WIDTH = game.constants.SCENE_WIDTH;
  var SCENE_HEIGHT = game.constants.SCENE_HEIGHT;
  var assets = game.assets;
  var DISGUISE_TEMPLATES = assets.DISGUISE_TEMPLATES;
  var DISGUISE_TOOL_ICONS = assets.DISGUISE_TOOL_ICONS;
  var renderer = game.disguise.renderer;
  var fitImageToBox = renderer.fitImageToBox;
  var smoothTexture = renderer.smoothTexture;
  var fitDisguisePortrait = renderer.fitDisguisePortrait;

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

  game.ui = game.ui || {};
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
}(window));

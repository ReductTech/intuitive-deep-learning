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
    var shadow = scene.add.rectangle(SCENE_WIDTH / 2, 892, SCENE_WIDTH + 120, 388, 0x000000, 0.34);
    var panel = scene.add.graphics();
    panel.fillStyle(0x100b07, 0.95);
    panel.lineStyle(2, 0xb28a55, 0.52);
    panel.fillRoundedRect(118, 700, SCENE_WIDTH - 236, 196, 18);
    panel.strokeRoundedRect(118, 700, SCENE_WIDTH - 236, 196, 18);
    panel.fillStyle(0x201812, 0.94);
    panel.lineStyle(3, 0xb28a55, 0.5);
    panel.fillRoundedRect(280, 906, SCENE_WIDTH - 560, 154, 28);
    panel.strokeRoundedRect(280, 906, SCENE_WIDTH - 560, 154, 28);
    panel.lineStyle(2, 0x8b6b43, 0.42);
    panel.beginPath();
    panel.moveTo(286, 718);
    panel.lineTo(286, 878);
    panel.strokePath();
    var glow = scene.add.rectangle(SCENE_WIDTH / 2, 900, SCENE_WIDTH - 340, 3, 0xe7ba6e, 0.22);
    shell.add([shadow, panel, glow]);
    return shell;
  }

  function createIconToolButton(scene, x, y, iconKey, label, onClick) {
    var button = scene.add.container(x, y).setSize(124, 142).setInteractive({ useHandCursor: true });
    var halo = scene.add.circle(0, -14, 56, 0xffc873, 0);
    var bg = scene.add.circle(0, -14, 48, 0x17120d, 0.94);
    bg.setStrokeStyle(3, 0x8f7654, 0.66);
    var inner = scene.add.circle(0, -14, 39, 0x2d2923, 0.78);
    inner.setStrokeStyle(1, 0xf2cf8c, 0.12);
    var icon = scene.add.image(0, -14, DISGUISE_TOOL_ICONS[iconKey].textureKey).setDisplaySize(42, 42);
    icon.setTint(0xf4d89b);
    var text = scene.add.text(0, 54, label, {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '20px',
      color: '#d7bd8f',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    var dot = scene.add.circle(0, 82, 5, 0xffcf78, 0).setStrokeStyle(2, 0xffe0a4, 0);
    button.add([halo, bg, inner, icon, text, dot]);
    button.on('pointerdown', onClick);
    button.setActiveStyle = function (active) {
      halo.setAlpha(active ? 0.28 : 0);
      bg.setFillStyle(active ? 0x3a2c1d : 0x17120d, active ? 0.98 : 0.94);
      bg.setStrokeStyle(active ? 4 : 3, active ? 0xffca77 : 0x8f7654, active ? 1 : 0.66);
      inner.setFillStyle(active ? 0x493722 : 0x2d2923, active ? 0.88 : 0.78);
      icon.setTint(active ? 0xffe2a8 : 0xf4d89b);
      text.setColor(active ? '#ffe2a8' : '#d7bd8f');
      dot.setAlpha(active ? 1 : 0);
      dot.setStrokeStyle(2, 0xffe0a4, active ? 0.72 : 0);
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
    bg.fillRoundedRect(-width / 2, -23, width, 46, 16);
    bg.strokeRoundedRect(-width / 2, -23, width, 46, 16);
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

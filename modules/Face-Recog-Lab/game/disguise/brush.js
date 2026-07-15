(function (global) {
  'use strict';

  var game = global.Act3DisguiseGame = global.Act3DisguiseGame || {};
  var EDIT_IMAGE_BOX = game.constants.EDIT_IMAGE_BOX;
  var DISGUISE_DOTS = game.assets.DISGUISE_DOTS;

  function cloneMarkData(mark) {
    return JSON.parse(JSON.stringify(mark));
  }

  function cssColorToNumber(color, fallback) {
    if (!color || typeof color !== 'string') return fallback;
    if (color.charAt(0) === '#') {
      return parseInt(color.slice(1), 16);
    }
    var match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return fallback;
    return (Number(match[1]) << 16) + (Number(match[2]) << 8) + Number(match[3]);
  }

  function addDisguiseMark(scene, layer, state, x, y, uv, image) {
    var markData = createMarkData(state.tool, uv, image, state.params);
    var mark;
    if (state.tool === 'mole') {
      mark = createMoleVisual(scene, x, y, markData);
    } else if (state.tool === 'brush') {
      mark = createBrushVisual(scene, x, y, markData);
    } else if (state.tool === 'makeup') {
      mark = createMakeupVisual(scene, x, y, markData);
    } else if (state.tool === 'lipstick') {
      mark = createLipstickVisual(scene, x, y, markData);
    } else if (state.tool === 'eyebrow') {
      mark = createEyebrowVisual(scene, x, y, markData);
    } else {
      mark = createMoustacheVisual(scene, x, y, markData);
    }
    layer.add(mark);
    state.marks.push(mark);
    state.markData.push(markData);
  }

  function normalizeBrushKind(brushKind) {
    if (brushKind === 'browPencil' || brushKind === 'eyeliner') return 'shapeBrow';
    if (brushKind === 'powderPuff') return 'blush';
    if (brushKind === 'makeupBrush') return 'contour';
    return brushKind || 'shapeBrow';
  }

  function brushPointSpacing(brushKind) {
    brushKind = normalizeBrushKind(brushKind);
    if (brushKind === 'shapeBrow') return 0.10;
    if (brushKind === 'blush') return 0.30;
    if (brushKind === 'complexion') return 0.24;
    return 0.16;
  }

  function brushVisualStyle(markData) {
    var brushKind = normalizeBrushKind(markData.brush);
    var radius = markData.radius || 28;
    var strength = Math.max(1, Math.min(5, markData.strength || 3));
    if (brushKind === 'shapeBrow') {
      return { kind: brushKind, width: Math.max(2, radius * 0.20), alpha: 0.28 + strength * 0.09 };
    }
    if (brushKind === 'blush') {
      return { kind: brushKind, width: Math.max(22, radius * 2.25), alpha: 0.09 + strength * 0.035 };
    }
    if (brushKind === 'complexion') {
      return { kind: brushKind, width: Math.max(28, radius * 2.55), alpha: 0.055 + strength * 0.022 };
    }
    return { kind: 'contour', width: Math.max(24, radius * 2.05), alpha: 0.075 + strength * 0.03 };
  }

  function createBrushStrokeData(uv, image, params) {
    params = params || {};
    var brushMaxDiameter = normalizeBrushKind(params.brushKind) === 'shapeBrow' ? 112 : 56;
    var brushDiameter = Math.max(12, Math.min(brushMaxDiameter, params.brushDiameter || 24));
    return {
      tool: 'brush',
      brush: normalizeBrushKind(params.brushKind),
      color: params.brushColor || 'rgba(72, 36, 22, 0.58)',
      radius: brushDiameter / 2,
      strength: params.brushStrength || 3,
      displayWidth: image && image.displayWidth ? image.displayWidth : EDIT_IMAGE_BOX,
      displayHeight: image && image.displayHeight ? image.displayHeight : EDIT_IMAGE_BOX,
      seed: Date.now() + Math.floor(uv.u * 100000) + Math.floor(uv.v * 1000000),
      points: [{ u: Math.max(0, Math.min(1, uv.u)), v: Math.max(0, Math.min(1, uv.v)) }],
      screenPoints: []
    };
  }

  function createBrushStrokeVisual(scene, markData) {
    var graphics = scene.add.graphics();
    redrawBrushStrokeVisual(graphics, markData);
    return graphics;
  }

  function redrawBrushStrokeVisual(graphics, markData) {
    var points = markData.screenPoints || [];
    var fill = cssColorToNumber(markData.color, 0x482416);
    var style = brushVisualStyle(markData);
    graphics.clear();
    if (!points.length) return;
    if (style.kind === 'blush') {
      forEachScreenStrokeSample(points, Math.max(5, style.width * 0.46), function (x, y, sampleIndex) {
        var radius = style.width * (0.43 + seededRandom(markData.seed + sampleIndex * 7) * 0.08);
        graphics.fillStyle(fill, style.alpha * 0.16);
        graphics.fillCircle(x, y, radius);
        graphics.fillStyle(fill, style.alpha * 0.24);
        graphics.fillCircle(x, y, radius * 0.64);
        graphics.fillStyle(fill, style.alpha * 0.30);
        graphics.fillCircle(x, y, radius * 0.30);
      });
      return;
    }
    if (style.kind === 'complexion') {
      forEachScreenStrokeSample(points, Math.max(6, style.width * 0.36), function (x, y) {
        graphics.fillStyle(fill, style.alpha * 0.12);
        graphics.fillEllipse(x, y, style.width, style.width * 0.82);
        graphics.fillStyle(fill, style.alpha * 0.18);
        graphics.fillEllipse(x, y, style.width * 0.56, style.width * 0.46);
      });
      return;
    }
    if (style.kind === 'contour') {
      forEachScreenStrokeSample(points, Math.max(4, style.width * 0.24), function (x, y, sampleIndex) {
        var drift = (seededRandom(markData.seed + sampleIndex * 11) - 0.5) * style.width * 0.18;
        graphics.fillStyle(fill, style.alpha * 0.10);
        graphics.fillEllipse(x + drift, y, style.width, style.width * 0.38);
        graphics.fillStyle(fill, style.alpha * 0.16);
        graphics.fillEllipse(x, y, style.width * 0.52, style.width * 0.20);
      });
      return;
    }
    strokeGraphicsPath(graphics, jitterScreenPoints(points, markData.seed, 1.2), fill, style.width, style.alpha);
    strokeGraphicsPath(graphics, jitterScreenPoints(points, markData.seed + 17, 2.4), fill, Math.max(1, style.width * 0.62), style.alpha * 0.52);
    strokeGraphicsPath(graphics, jitterScreenPoints(points, markData.seed + 31, 3.5), fill, Math.max(0.8, style.width * 0.36), style.alpha * 0.32);
  }

  function strokeGraphicsPath(graphics, points, color, width, alpha) {
    if (!points.length) return;
    graphics.lineStyle(width, color, alpha);
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    if (points.length === 1) {
      graphics.lineTo(points[0].x + 0.01, points[0].y + 0.01);
    } else {
      for (var i = 1; i < points.length; i += 1) {
        var previous = points[i - 1];
        var current = points[i];
        graphics.lineTo((previous.x + current.x) / 2, (previous.y + current.y) / 2);
      }
      var last = points[points.length - 1];
      graphics.lineTo(last.x, last.y);
    }
    graphics.strokePath();
  }

  function forEachScreenStrokeSample(points, spacing, callback) {
    var sampleIndex = 0;
    if (!points || points.length === 0) return;
    if (points.length === 1) {
      callback(points[0].x, points[0].y, sampleIndex);
      return;
    }
    for (var i = 1; i < points.length; i += 1) {
      var previous = points[i - 1];
      var current = points[i];
      var dx = current.x - previous.x;
      var dy = current.y - previous.y;
      var distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      var steps = Math.max(1, Math.ceil(distance / spacing));
      for (var step = 0; step <= steps; step += 1) {
        var t = step / steps;
        callback(previous.x + dx * t, previous.y + dy * t, sampleIndex);
        sampleIndex += 1;
      }
    }
  }

  function jitterScreenPoints(points, seed, amount) {
    return points.map(function (point, index) {
      return {
        x: point.x + (seededRandom(seed + index * 13) - 0.5) * amount,
        y: point.y + (seededRandom(seed + index * 13 + 1) - 0.5) * amount
      };
    });
  }

  function seededRandom(seed) {
    var value = Math.sin(seed * 999.91) * 10000;
    return value - Math.floor(value);
  }

  function createMarkData(tool, uv, image, params) {
    params = params || {};
    var data = {
      tool: tool,
      u: Math.max(0, Math.min(1, uv.u)),
      v: Math.max(0, Math.min(1, uv.v)),
      displayWidth: image && image.displayWidth ? image.displayWidth : EDIT_IMAGE_BOX,
      displayHeight: image && image.displayHeight ? image.displayHeight : EDIT_IMAGE_BOX,
      seed: Date.now() + Math.floor(uv.u * 100000) + Math.floor(uv.v * 1000000)
    };
    var displayScale = Math.max(0.8, Math.min(1.75, ((data.displayWidth + data.displayHeight) / 2) / 536));
    var brushMaxDiameter = normalizeBrushKind(params.brushKind) === 'shapeBrow' ? 112 : 56;
    var brushDiameter = Math.max(12, Math.min(brushMaxDiameter, params.brushDiameter || 24));
    if (tool === 'moustache') {
      var density = params.moustacheDensity || 3;
      var size = params.moustacheSize || 1;
      var hairCount = 8 + density * 7;
      data.density = density;
      data.size = size;
      data.hairs = [];
      for (var i = 0; i < hairCount; i += 1) {
        var r1 = seededRandom(data.seed + i * 3 + 1);
        var r2 = seededRandom(data.seed + i * 3 + 2);
        var r3 = seededRandom(data.seed + i * 3 + 3);
        var side = i % 2 === 0 ? -1 : 1;
        data.hairs.push({
          dx: (side * (8 + r1 * (26 + density * 3)) + (r2 - 0.5) * 10) * size * displayScale,
          dy: ((r2 - 0.5) * (18 + density * 2) + (r3 - 0.5) * 9) * size * displayScale,
          length: (8 + r3 * (14 + density * 2.2)) * size * displayScale,
          width: (1.0 + r1 * 1.8) * size * displayScale,
          angle: side * (0.05 + r2 * 0.44) + (r3 - 0.5) * 0.12,
          alpha: 0.34 + Math.min(0.58, density * 0.06 + r3 * 0.36)
        });
      }
    } else if (tool === 'mole') {
      data.textureKey = params.moleTextureKey || DISGUISE_DOTS[0].textureKey;
      data.maskTextureKey = params.moleMaskTextureKey || data.textureKey;
      data.color = params.moleColor || 'rgba(45, 24, 16, 1)';
      data.size = Math.max(6, Math.min(19, params.moleSize || 9.5));
      data.opacity = Math.max(20, Math.min(100, params.moleOpacity || 100));
    } else if (tool === 'brush') {
      var brushStrength = params.brushStrength || 3;
      data.brush = normalizeBrushKind(params.brushKind);
      data.color = params.brushColor || 'rgba(72, 36, 22, 0.58)';
      data.radius = brushDiameter / 2;
      data.rotation = 0;
      data.strength = brushStrength;
    } else if (tool === 'makeup') {
      var strength = params.makeupStrength || 2;
      data.brush = 'round';
      data.color = params.makeupColor || 'rgba(150, 78, 54, 0.24)';
      data.radius = brushDiameter / 2;
      data.rotation = 0;
      data.strength = strength;
    } else if (tool === 'lipstick') {
      data.color = params.lipstickColor || 'rgba(128, 36, 30, 0.42)';
      data.width = brushDiameter * 0.9;
      data.height = Math.max(8, brushDiameter * 0.22);
      data.rotation = (seededRandom(data.seed + 9) - 0.5) * 0.18;
    } else if (tool === 'eyebrow') {
      data.shape = 'straight';
      data.width = brushDiameter * 0.88;
      data.height = Math.max(7, brushDiameter * 0.18);
      data.thickness = Math.max(3.2, brushDiameter * 0.08);
      data.rotation = (seededRandom(data.seed + 13) - 0.5) * 0.28;
    }
    return data;
  }

  function createMoustacheVisual(scene, x, y, markData) {
    var container = scene.add.container(x, y);
    (markData.hairs || []).forEach(function (hair) {
      var stroke = scene.add.rectangle(hair.dx, hair.dy, hair.length, hair.width, 0x17100b, hair.alpha || 0.75);
      stroke.setRotation(hair.angle || 0);
      stroke.setOrigin(0.5);
      container.add(stroke);
    });
    return container;
  }

  function createMoleVisual(scene, x, y, markData) {
    var size = markData.size || 9.5;
    return scene.add.image(x, y, markData.maskTextureKey || markData.textureKey || DISGUISE_DOTS[0].textureKey)
      .setDisplaySize(size, size)
      .setTint(cssColorToNumber(markData.color, 0x2d1810))
      .setAlpha(Math.max(0.2, Math.min(1, (markData.opacity || 100) / 100)));
  }

  function createBrushVisual(scene, x, y, markData) {
    var container = scene.add.container(x, y);
    var radius = markData.radius || 28;
    var fill = cssColorToNumber(markData.color, 0x482416);
    var style = brushVisualStyle(markData);
    if (style.kind === 'shapeBrow') {
      for (var hair = 0; hair < 7; hair += 1) {
        var piece = scene.add.rectangle(
          (hair - 3) * radius * 0.22,
          (seededRandom(markData.seed + hair * 3) - 0.5) * radius * 0.34,
          radius * 0.68,
          Math.max(1.2, style.width * 0.42),
          fill,
          style.alpha * (0.46 + seededRandom(markData.seed + hair * 3 + 1) * 0.34)
        ).setRotation(-0.18 + hair * 0.045);
        container.add(piece);
      }
    } else if (style.kind === 'blush') {
      container.add([
        scene.add.circle(0, 0, style.width * 0.50, fill, style.alpha * 0.13),
        scene.add.circle(0, 0, style.width * 0.31, fill, style.alpha * 0.23),
        scene.add.circle(0, 0, style.width * 0.14, fill, style.alpha * 0.30)
      ]);
    } else if (style.kind === 'complexion') {
      container.add([
        scene.add.ellipse(0, 0, style.width, style.width * 0.82, fill, style.alpha * 0.12),
        scene.add.ellipse(0, 0, style.width * 0.56, style.width * 0.46, fill, style.alpha * 0.18)
      ]);
    } else {
      container.add([
        scene.add.ellipse(0, 0, style.width, style.width * 0.38, fill, style.alpha * 0.10),
        scene.add.ellipse(0, 0, style.width * 0.52, style.width * 0.20, fill, style.alpha * 0.16)
      ]);
    }
    return container;
  }

  function createMakeupVisual(scene, x, y, markData) {
    var container = scene.add.container(x, y);
    var radius = markData.radius || 34;
    var fill = cssColorToNumber(markData.color, 0x965236);
    var widthScale = 1;
    var heightScale = 1;
    var outer = scene.add.ellipse(0, 0, radius * 2 * widthScale, radius * 2 * heightScale, fill, 0.07);
    var mid = scene.add.ellipse(0, 0, radius * 1.35 * widthScale, radius * 1.35 * heightScale, fill, 0.11);
    var inner = scene.add.ellipse(0, 0, radius * 0.66 * widthScale, radius * 0.66 * heightScale, fill, 0.16);
    outer.setRotation(markData.rotation || 0);
    mid.setRotation(markData.rotation || 0);
    inner.setRotation(markData.rotation || 0);
    container.add([outer, mid, inner]);
    return container;
  }

  function createLipstickVisual(scene, x, y, markData) {
    var container = scene.add.container(x, y);
    var fill = cssColorToNumber(markData.color, 0x80241e);
    var width = markData.width || 40;
    var height = markData.height || 10;
    var upper = scene.add.ellipse(0, -height * 0.2, width, height, fill, 0.42);
    var lower = scene.add.ellipse(0, height * 0.35, width * 1.15, height * 0.86, fill, 0.38);
    upper.setRotation(markData.rotation || 0);
    lower.setRotation(markData.rotation || 0);
    container.add([upper, lower]);
    return container;
  }

  function createEyebrowVisual(scene, x, y, markData) {
    var container = scene.add.container(x, y);
    var width = markData.width || 44;
    var height = markData.height || 8;
    var thickness = markData.thickness || 4;
    var graphics = scene.add.graphics();
    var segments = 10;
    graphics.lineStyle(thickness, 0x160f0a, 0.88);
    graphics.beginPath();
    for (var i = 0; i <= segments; i += 1) {
      var t = i / segments;
      var px = -width * 0.5 + width * t;
      var py;
      if (markData.shape === 'arch') {
        py = height * 0.16 - Math.sin(t * Math.PI) * height * 1.02 + t * height * -0.08;
      } else if (markData.shape === 'thick') {
        py = -height * 0.12 - Math.sin(t * Math.PI) * height * 0.36 + t * height * 0.08;
      } else {
        py = -height * 0.18 * t;
      }
      if (i === 0) {
        graphics.moveTo(px, py);
      } else {
        graphics.lineTo(px, py);
      }
    }
    graphics.strokePath();
    graphics.setRotation(markData.rotation || 0);
    container.add(graphics);
    return container;
  }

  game.disguise = game.disguise || {};
  game.disguise.brush = {
    cloneMarkData: cloneMarkData,
    cssColorToNumber: cssColorToNumber,
    addDisguiseMark: addDisguiseMark,
    brushPointSpacing: brushPointSpacing,
    normalizeBrushKind: normalizeBrushKind,
    brushVisualStyle: brushVisualStyle,
    createBrushStrokeData: createBrushStrokeData,
    createBrushStrokeVisual: createBrushStrokeVisual,
    redrawBrushStrokeVisual: redrawBrushStrokeVisual,
    strokeGraphicsPath: strokeGraphicsPath,
    forEachScreenStrokeSample: forEachScreenStrokeSample,
    jitterScreenPoints: jitterScreenPoints,
    seededRandom: seededRandom,
    createMarkData: createMarkData,
    createMoustacheVisual: createMoustacheVisual,
    createMoleVisual: createMoleVisual,
    createBrushVisual: createBrushVisual,
    createMakeupVisual: createMakeupVisual,
    createLipstickVisual: createLipstickVisual,
    createEyebrowVisual: createEyebrowVisual
  };
}(window));

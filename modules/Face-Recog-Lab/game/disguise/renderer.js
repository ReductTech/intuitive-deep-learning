(function (global) {
  'use strict';

  var game = global.Act3DisguiseGame = global.Act3DisguiseGame || {};
  var constants = game.constants;
  var assets = game.assets;
  var brush = game.disguise.brush;
  var FACE_SAMPLE_WIDTH = constants.FACE_SAMPLE_WIDTH;
  var FACE_SAMPLE_HEIGHT = constants.FACE_SAMPLE_HEIGHT;
  var EDIT_IMAGE_BOX = constants.EDIT_IMAGE_BOX;
  var SCENE_WIDTH = constants.SCENE_WIDTH;
  var DISGUISE_TEMPLATES = assets.DISGUISE_TEMPLATES;
  var brushVisualStyle = brush.brushVisualStyle;
  var brushPointSpacing = brush.brushPointSpacing;
  var seededRandom = brush.seededRandom;
  var cssColorToNumber = brush.cssColorToNumber;

  function brushColorWithAlpha(color, alpha) {
    var value = cssColorToNumber(color, 0x482416);
    var alphaMatch = typeof color === 'string' ? color.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\s*\)/) : null;
    var sourceAlpha = alphaMatch ? Number(alphaMatch[1]) : 1;
    if (!Number.isFinite(sourceAlpha)) sourceAlpha = 1;
    var combinedAlpha = Math.max(0, Math.min(1, alpha * sourceAlpha));
    return 'rgba(' + ((value >> 16) & 255) + ', ' + ((value >> 8) & 255) + ', ' + (value & 255) + ', ' + combinedAlpha + ')';
  }

  function fitImageToBox(image, maxWidth, maxHeight) {
    var width = image.width || 1;
    var height = image.height || 1;
    var scale = Math.min(maxWidth / width, maxHeight / height);
    image.setDisplaySize(width * scale, height * scale);
  }

  function smoothTexture(scene, textureKey) {
    var texture = scene.textures.get(textureKey);
    if (
      texture &&
      texture.setFilter &&
      window.Phaser &&
      Phaser.Textures &&
      Phaser.Textures.FilterMode
    ) {
      texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
  }

  function smoothDisguiseFaceTextures(scene) {
    smoothTexture(scene, 'anchorFace');
    Object.keys(DISGUISE_TEMPLATES).forEach(function (templateKey) {
      var template = DISGUISE_TEMPLATES[templateKey];
      smoothTexture(scene, template.textureKey);
      Object.keys(template.beard || {}).forEach(function (variantKey) {
        smoothTexture(scene, template.beard[variantKey].textureKey);
      });
    });
  }

  function disguiseTextureForState(state) {
    var template = state.template || DISGUISE_TEMPLATES.normal;
    var variant = state.beardVariant && template.beard ? template.beard[state.beardVariant] : null;
    return variant ? variant.textureKey : template.textureKey;
  }

  function fitDisguisePortrait(image) {
    var width = image.width || 1;
    var height = image.height || 1;
    var targetHeight = 1060;
    var scale = targetHeight / height;
    image.setDisplaySize(width * scale, targetHeight);
    image.setPosition(SCENE_WIDTH / 2, 520);
  }

  function containedDrawRect(image, width, height) {
    var sourceWidth = image && image.width ? image.width : 1;
    var sourceHeight = image && image.height ? image.height : 1;
    var scale = Math.min(width / sourceWidth, height / sourceHeight);
    var drawWidth = sourceWidth * scale;
    var drawHeight = sourceHeight * scale;
    return {
      x: (width - drawWidth) / 2,
      y: (height - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight
    };
  }

  function drawFaceCanvas(scene, textureKey, marks, outputWidth, outputHeight) {
    var image = scene.textures.get(textureKey).getSourceImage();
    var canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(outputWidth || FACE_SAMPLE_WIDTH));
    canvas.height = Math.max(1, Math.round(outputHeight || FACE_SAMPLE_HEIGHT));
    var context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context || !image) return canvas;

    context.fillStyle = '#050403';
    context.fillRect(0, 0, canvas.width, canvas.height);
    var imageRect = containedDrawRect(image, canvas.width, canvas.height);
    context.drawImage(image, imageRect.x, imageRect.y, imageRect.width, imageRect.height);
    var orderedMarks = (marks || []).slice().sort(function (left, right) {
      if (left.tool === 'skinFilter' && right.tool !== 'skinFilter') return -1;
      if (right.tool === 'skinFilter' && left.tool !== 'skinFilter') return 1;
      return 0;
    });
    orderedMarks.forEach(function (mark) {
      drawMarkOnCanvas(scene, context, imageRect, mark);
    });
    return canvas;
  }

  function markCanvasPoint(imageRect, mark, dot) {
    var displayWidth = mark.displayWidth || EDIT_IMAGE_BOX;
    var displayHeight = mark.displayHeight || EDIT_IMAGE_BOX;
    var sx = imageRect.width / displayWidth;
    var sy = imageRect.height / displayHeight;
    return {
      x: imageRect.x + mark.u * imageRect.width + (dot.dx || 0) * sx,
      y: imageRect.y + mark.v * imageRect.height + (dot.dy || 0) * sy,
      sx: sx,
      sy: sy
    };
  }

  function bilinearSample(data, width, height, x, y, output, outputIndex) {
    x = Math.max(0, Math.min(width - 1, x));
    y = Math.max(0, Math.min(height - 1, y));
    var x0 = Math.floor(x);
    var y0 = Math.floor(y);
    var x1 = Math.min(width - 1, x0 + 1);
    var y1 = Math.min(height - 1, y0 + 1);
    var tx = x - x0;
    var ty = y - y0;
    var topLeft = (y0 * width + x0) * 4;
    var topRight = (y0 * width + x1) * 4;
    var bottomLeft = (y1 * width + x0) * 4;
    var bottomRight = (y1 * width + x1) * 4;
    for (var channel = 0; channel < 4; channel += 1) {
      var top = data[topLeft + channel] * (1 - tx) + data[topRight + channel] * tx;
      var bottom = data[bottomLeft + channel] * (1 - tx) + data[bottomRight + channel] * tx;
      output[outputIndex + channel] = Math.round(top * (1 - ty) + bottom * ty);
    }
  }

  function applyReshapeMark(context, imageRect, mark) {
    var canvasWidth = context.canvas.width;
    var canvasHeight = context.canvas.height;
    var sourceImage = context.getImageData(0, 0, canvasWidth, canvasHeight);
    var outputImage = context.createImageData(canvasWidth, canvasHeight);
    outputImage.data.set(sourceImage.data);

    var fromX = imageRect.x + Math.max(0, Math.min(1, mark.fromU)) * imageRect.width;
    var fromY = imageRect.y + Math.max(0, Math.min(1, mark.fromV)) * imageRect.height;
    var rawDx = (Math.max(0, Math.min(1, mark.toU)) - Math.max(0, Math.min(1, mark.fromU))) * imageRect.width;
    var rawDy = (Math.max(0, Math.min(1, mark.toV)) - Math.max(0, Math.min(1, mark.fromV))) * imageRect.height;
    var displayWidth = Math.max(1, mark.displayWidth || EDIT_IMAGE_BOX);
    var displayHeight = Math.max(1, mark.displayHeight || EDIT_IMAGE_BOX);
    var radius = Math.max(4, (mark.radius || 80) * Math.min(imageRect.width / displayWidth, imageRect.height / displayHeight));
    var strength = Math.max(0.25, Math.min(1, Number(mark.strength) || 0.5));
    var strengthScale = 0.10 + strength * 0.07;
    var dx = rawDx * strengthScale;
    var dy = rawDy * strengthScale;
    var displacement = Math.sqrt(dx * dx + dy * dy);
    var maxDisplacement = radius * 0.38;
    if (displacement > maxDisplacement && displacement > 0) {
      dx *= maxDisplacement / displacement;
      dy *= maxDisplacement / displacement;
    }
    if (Math.abs(dx) + Math.abs(dy) < 0.25) return;

    var targetX = fromX + dx;
    var targetY = fromY + dy;
    var minX = Math.max(Math.floor(imageRect.x), Math.floor(targetX - radius));
    var maxX = Math.min(Math.ceil(imageRect.x + imageRect.width) - 1, Math.ceil(targetX + radius));
    var minY = Math.max(Math.floor(imageRect.y), Math.floor(targetY - radius));
    var maxY = Math.min(Math.ceil(imageRect.y + imageRect.height) - 1, Math.ceil(targetY + radius));

    for (var y = minY; y <= maxY; y += 1) {
      for (var x = minX; x <= maxX; x += 1) {
        var distanceX = x - targetX;
        var distanceY = y - targetY;
        var normalizedDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY) / radius;
        if (normalizedDistance >= 1) continue;
        var falloff = 1 - normalizedDistance;
        falloff = falloff * falloff * (3 - 2 * falloff);
        var sourceX = x - dx * falloff;
        var sourceY = y - dy * falloff;
        bilinearSample(
          sourceImage.data,
          canvasWidth,
          canvasHeight,
          sourceX,
          sourceY,
          outputImage.data,
          (y * canvasWidth + x) * 4
        );
      }
    }
    context.putImageData(outputImage, 0, 0);
  }

  function applySkinFilter(context, imageRect, mark) {
    var filterKey = mark.filter || 'original';
    var strength = Math.max(0, Math.min(1, (Number(mark.strength) || 55) / 100));
    if (filterKey === 'original' || strength <= 0) return;
    var filterCanvas = document.createElement('canvas');
    filterCanvas.width = context.canvas.width;
    filterCanvas.height = context.canvas.height;
    var filterContext = filterCanvas.getContext('2d');
    if (!filterContext) return;
    filterContext.drawImage(context.canvas, 0, 0);
    context.save();
    context.beginPath();
    context.rect(imageRect.x, imageRect.y, imageRect.width, imageRect.height);
    context.clip();
    if (filterKey === 'clear') {
      context.filter = 'brightness(' + (1 + strength * 0.10).toFixed(2) + ') contrast(' + (1 + strength * 0.10).toFixed(2) + ') saturate(' + (1 + strength * 0.12).toFixed(2) + ')';
    } else if (filterKey === 'cool') {
      context.filter = 'brightness(' + (1 + strength * 0.06).toFixed(2) + ') contrast(' + (1 + strength * 0.12).toFixed(2) + ') saturate(' + (0.96 + strength * 0.06).toFixed(2) + ')';
    } else if (filterKey === 'warmSun') {
      context.filter = 'sepia(' + (strength * 0.28).toFixed(2) + ') saturate(' + (1 + strength * 0.18).toFixed(2) + ') brightness(' + (1 + strength * 0.03).toFixed(2) + ')';
    } else if (filterKey === 'film') {
      context.filter = 'sepia(' + (strength * 0.36).toFixed(2) + ') contrast(' + (1 + strength * 0.18).toFixed(2) + ') saturate(' + (1 - strength * 0.16).toFixed(2) + ')';
    } else if (filterKey === 'blackGold') {
      context.filter = 'grayscale(' + (strength * 0.72).toFixed(2) + ') sepia(' + (strength * 0.42).toFixed(2) + ') contrast(' + (1 + strength * 0.28).toFixed(2) + ') brightness(' + (1 - strength * 0.10).toFixed(2) + ')';
    } else if (filterKey === 'roseGlow') {
      context.filter = 'brightness(' + (1 + strength * 0.06).toFixed(2) + ') saturate(' + (1 + strength * 0.20).toFixed(2) + ') sepia(' + (strength * 0.12).toFixed(2) + ')';
    }
    context.globalAlpha = 0.3 + strength * 0.68;
    context.drawImage(filterCanvas, 0, 0);
    context.filter = 'none';
    var tint = filterKey === 'cool' ? '#b8d7ff' : filterKey === 'warmSun' ? '#efad68' : filterKey === 'roseGlow' ? '#e99b9e' : null;
    if (tint) {
      context.globalCompositeOperation = 'soft-light';
      context.globalAlpha = 0.05 + strength * 0.16;
      context.fillStyle = tint;
      context.fillRect(imageRect.x, imageRect.y, imageRect.width, imageRect.height);
    }
    context.restore();
  }

  function drawMarkOnCanvas(scene, context, imageRect, mark) {
    if (mark.tool === 'skinFilter') {
      applySkinFilter(context, imageRect, mark);
      return;
    }
    if (mark.tool === 'reshape') {
      applyReshapeMark(context, imageRect, mark);
      return;
    }
    if (mark.tool === 'mole') {
      var mole = markCanvasPoint(imageRect, mark, { dx: 0, dy: 0 });
      var size = Math.max(2, (mark.size || 9.5) * Math.min(mole.sx, mole.sy));
      var sourceImage = mark.textureKey && scene.textures.exists(mark.textureKey)
        ? scene.textures.get(mark.textureKey).getSourceImage()
        : null;
      context.save();
      context.globalAlpha = Math.max(0.2, Math.min(1, (mark.opacity || 100) / 100));
      if (sourceImage) {
        var alphaMask = document.createElement('canvas');
        alphaMask.width = sourceImage.width || 1;
        alphaMask.height = sourceImage.height || 1;
        var alphaContext = alphaMask.getContext('2d');
        if (alphaContext) {
          alphaContext.fillStyle = mark.color || 'rgba(45, 24, 16, 1)';
          alphaContext.fillRect(0, 0, alphaMask.width, alphaMask.height);
          alphaContext.globalCompositeOperation = 'destination-in';
          alphaContext.drawImage(sourceImage, 0, 0, alphaMask.width, alphaMask.height);
          context.drawImage(alphaMask, mole.x - size / 2, mole.y - size / 2, size, size);
        }
      }
      context.restore();
      return;
    }

    if (mark.tool === 'brush') {
      var brushStyle = brushVisualStyle(mark);
      var scaledStyleWidth = brushStyle.width * Math.min(imageRect.width / (mark.displayWidth || EDIT_IMAGE_BOX), imageRect.height / (mark.displayHeight || EDIT_IMAGE_BOX));
      var points = mark.points || [{ u: mark.u || 0.5, v: mark.v || 0.5 }];
      var solidColor = brushColorWithAlpha(mark.color, 1);
      if (brushStyle.kind === 'pixelate') {
        var pixelCanvas = document.createElement('canvas');
        var blockSize = Math.max(5, Math.round(4 + (mark.strength || 3) * 1.8));
        pixelCanvas.width = Math.max(1, Math.ceil(context.canvas.width / blockSize));
        pixelCanvas.height = Math.max(1, Math.ceil(context.canvas.height / blockSize));
        var pixelContext = pixelCanvas.getContext('2d');
        if (pixelContext) {
          pixelContext.imageSmoothingEnabled = false;
          pixelContext.drawImage(context.canvas, 0, 0, pixelCanvas.width, pixelCanvas.height);
          context.save();
          context.beginPath();
          forEachCanvasStrokeSample(imageRect, points, Math.max(5, scaledStyleWidth * 0.24), function (px, py) {
            var pixelRadius = Math.max(8, scaledStyleWidth * 0.5);
            context.moveTo(px + pixelRadius, py);
            context.arc(px, py, pixelRadius, 0, Math.PI * 2);
          });
          context.clip();
          context.imageSmoothingEnabled = false;
          context.drawImage(pixelCanvas, 0, 0, pixelCanvas.width, pixelCanvas.height, 0, 0, context.canvas.width, context.canvas.height);
          context.restore();
        }
        return;
      }
      if (brushStyle.kind === 'blurBrush') {
        var blurCanvas = document.createElement('canvas');
        blurCanvas.width = context.canvas.width;
        blurCanvas.height = context.canvas.height;
        var blurContext = blurCanvas.getContext('2d');
        if (blurContext) {
          blurContext.drawImage(context.canvas, 0, 0);
          context.save();
          context.beginPath();
          forEachCanvasStrokeSample(imageRect, points, Math.max(5, scaledStyleWidth * 0.25), function (px, py) {
            var blurRadius = Math.max(8, scaledStyleWidth * 0.5);
            context.moveTo(px + blurRadius, py);
            context.arc(px, py, blurRadius, 0, Math.PI * 2);
          });
          context.clip();
          context.filter = 'blur(' + Math.max(1.5, Math.min(9, 1 + (mark.strength || 3) * 0.85)).toFixed(1) + 'px)';
          context.globalAlpha = Math.min(0.82, 0.28 + (mark.strength || 3) * 0.065);
          context.drawImage(blurCanvas, 0, 0);
          context.restore();
        }
        return;
      }
      context.save();
      context.globalCompositeOperation = 'multiply';
      context.fillStyle = solidColor;
      context.strokeStyle = solidColor;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      if (brushStyle.kind === 'blush') {
        forEachCanvasStrokeSample(imageRect, points, Math.max(4, scaledStyleWidth * 0.46), function (px, py, sampleIndex) {
          var blushRadius = Math.max(5, scaledStyleWidth * (0.42 + seededRandom(mark.seed + sampleIndex * 5) * 0.08));
          var gradient = context.createRadialGradient(px, py, 0, px, py, blushRadius);
          gradient.addColorStop(0, brushColorWithAlpha(mark.color, 0.82));
          gradient.addColorStop(0.46, brushColorWithAlpha(mark.color, 0.36));
          gradient.addColorStop(1, brushColorWithAlpha(mark.color, 0));
          context.globalAlpha = brushStyle.alpha;
          context.fillStyle = gradient;
          context.beginPath();
          context.arc(px, py, blushRadius, 0, Math.PI * 2);
          context.fill();
        });
      } else if (brushStyle.kind === 'contour') {
        forEachCanvasStrokeSample(imageRect, points, Math.max(4, scaledStyleWidth * 0.24), function (px, py, sampleIndex, angle) {
          var contourRadius = Math.max(5, scaledStyleWidth * 0.5);
          context.save();
          context.translate(px, py);
          context.rotate(angle || 0);
          var gradient = context.createRadialGradient(0, 0, 0, 0, 0, contourRadius);
          gradient.addColorStop(0, brushColorWithAlpha(mark.color, 0.72));
          gradient.addColorStop(0.55, brushColorWithAlpha(mark.color, 0.24));
          gradient.addColorStop(1, brushColorWithAlpha(mark.color, 0));
          context.globalAlpha = brushStyle.alpha * (0.88 + seededRandom(mark.seed + sampleIndex * 7) * 0.12);
          context.fillStyle = gradient;
          context.beginPath();
          context.ellipse(0, 0, contourRadius, contourRadius * 0.38, 0, 0, Math.PI * 2);
          context.fill();
          context.restore();
        });
      } else {
        drawCanvasStrokePath(context, imageRect, jitterStrokePoints(points, mark.seed, 0.002), scaledStyleWidth, brushStyle.alpha);
        drawCanvasStrokePath(context, imageRect, jitterStrokePoints(points, mark.seed + 17, 0.004), Math.max(1, scaledStyleWidth * 0.62), brushStyle.alpha * 0.52);
        drawCanvasStrokePath(context, imageRect, jitterStrokePoints(points, mark.seed + 31, 0.006), Math.max(0.8, scaledStyleWidth * 0.36), brushStyle.alpha * 0.32);
      }
      context.restore();
      return;
    }

    function forEachCanvasStrokeSample(rect, strokePoints, spacing, callback) {
      var sampleIndex = 0;
      if (!strokePoints || strokePoints.length === 0) return;
      if (strokePoints.length === 1) {
        callback(rect.x + strokePoints[0].u * rect.width, rect.y + strokePoints[0].v * rect.height, sampleIndex, 0);
        return;
      }
      for (var i = 1; i < strokePoints.length; i += 1) {
        var previous = strokePoints[i - 1];
        var current = strokePoints[i];
        var ax = rect.x + previous.u * rect.width;
        var ay = rect.y + previous.v * rect.height;
        var bx = rect.x + current.u * rect.width;
        var by = rect.y + current.v * rect.height;
        var dx = bx - ax;
        var dy = by - ay;
        var distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        var steps = Math.max(1, Math.ceil(distance / spacing));
        for (var step = 0; step <= steps; step += 1) {
          var t = step / steps;
          callback(ax + dx * t, ay + dy * t, sampleIndex, Math.atan2(dy, dx));
          sampleIndex += 1;
        }
      }
    }

    function drawCanvasStrokePath(ctx, rect, strokePoints, width, alpha) {
      if (!strokePoints || strokePoints.length === 0) return;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = width;
      ctx.beginPath();
      var first = strokePoints[0];
      ctx.moveTo(rect.x + first.u * rect.width, rect.y + first.v * rect.height);
      if (strokePoints.length === 1) {
        ctx.lineTo(rect.x + first.u * rect.width + 0.01, rect.y + first.v * rect.height + 0.01);
      } else {
        for (var pointIndex = 1; pointIndex < strokePoints.length; pointIndex += 1) {
          var previous = strokePoints[pointIndex - 1];
          var current = strokePoints[pointIndex];
          var midU = (previous.u + current.u) / 2;
          var midV = (previous.v + current.v) / 2;
          ctx.quadraticCurveTo(
            rect.x + previous.u * rect.width,
            rect.y + previous.v * rect.height,
            rect.x + midU * rect.width,
            rect.y + midV * rect.height
          );
        }
        var last = strokePoints[strokePoints.length - 1];
        ctx.lineTo(rect.x + last.u * rect.width, rect.y + last.v * rect.height);
      }
      ctx.stroke();
    }

    function jitterStrokePoints(strokePoints, seed, amount) {
      return strokePoints.map(function (point, index) {
        return {
          u: point.u + (seededRandom(seed + index * 11) - 0.5) * amount,
          v: point.v + (seededRandom(seed + index * 11 + 1) - 0.5) * amount
        };
      });
    }

    if (mark.tool === 'unused-brush-stamp') {
      var brush = markCanvasPoint(imageRect, mark, { dx: 0, dy: 0 });
      var unusedBrushRadius = Math.max(3, (mark.radius || 28) * Math.min(brush.sx, brush.sy));
      context.save();
      context.globalCompositeOperation = 'multiply';
      context.strokeStyle = mark.color || 'rgba(72, 36, 22, 0.58)';
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.globalAlpha = 0.6;
      context.lineWidth = Math.max(1.4, unusedBrushRadius * 0.16);
      context.beginPath();
      context.moveTo(brush.x - unusedBrushRadius * 0.66, brush.y);
      context.quadraticCurveTo(brush.x, brush.y, brush.x + unusedBrushRadius * 0.66, brush.y);
      context.stroke();
      context.restore();
      return;
    }

    if (mark.tool === 'makeup' || mark.tool === 'color') {
      var colorPoint = markCanvasPoint(imageRect, mark, { dx: 0, dy: 0 });
      var makeupRadius = Math.max(10, (mark.radius || 34) * Math.min(colorPoint.sx, colorPoint.sy));
      var rx = makeupRadius;
      var ry = makeupRadius;
      var gradient = context.createRadialGradient(
        colorPoint.x,
        colorPoint.y,
        0,
        colorPoint.x,
        colorPoint.y,
        makeupRadius
      );
      gradient.addColorStop(0, mark.color || 'rgba(138, 72, 48, 0.22)');
      gradient.addColorStop(0.58, 'rgba(132, 66, 45, 0.10)');
      gradient.addColorStop(1, 'rgba(132, 66, 45, 0)');
      context.save();
      context.globalCompositeOperation = 'multiply';
      context.fillStyle = gradient;
      context.beginPath();
      context.ellipse(colorPoint.x, colorPoint.y, rx, ry, mark.rotation || 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
      return;
    }

    if (mark.tool === 'lipstick') {
      var lip = markCanvasPoint(imageRect, mark, { dx: 0, dy: 0 });
      var lipScale = Math.min(lip.sx, lip.sy);
      var lipWidth = (mark.width || 40) * lipScale;
      var lipHeight = (mark.height || 9) * lipScale;
      context.save();
      context.globalCompositeOperation = 'multiply';
      context.fillStyle = mark.color || 'rgba(128, 36, 30, 0.38)';
      context.beginPath();
      context.ellipse(lip.x, lip.y - lipHeight * 0.22, lipWidth * 0.52, lipHeight * 0.52, mark.rotation || 0, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.ellipse(lip.x, lip.y + lipHeight * 0.34, lipWidth * 0.62, lipHeight * 0.44, mark.rotation || 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
      return;
    }

    if (mark.tool === 'eyebrow') {
      var brow = markCanvasPoint(imageRect, mark, { dx: 0, dy: 0 });
      var browScale = Math.min(brow.sx, brow.sy);
      var browWidth = (mark.width || 44) * browScale;
      var browHeight = (mark.height || 8) * browScale;
      var lineWidth = Math.max(2, (mark.thickness || 4.2) * browScale);
      context.save();
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = 'rgba(22, 15, 10, 0.88)';
      context.lineWidth = lineWidth;
      context.translate(brow.x, brow.y);
      context.rotate(mark.rotation || 0);
      for (var browLine = 0; browLine < 3; browLine += 1) {
        var offset = (browLine - 1) * lineWidth * 0.82;
        context.beginPath();
        if (mark.shape === 'arch') {
          context.moveTo(-browWidth * 0.5, browHeight * 0.18 + offset);
          context.quadraticCurveTo(0, -browHeight * 0.85 + offset, browWidth * 0.5, browHeight * 0.12 + offset);
        } else if (mark.shape === 'thick') {
          context.moveTo(-browWidth * 0.55, -browHeight * 0.12 + offset);
          context.quadraticCurveTo(0, -browHeight * 0.42 + offset, browWidth * 0.55, -browHeight * 0.04 + offset);
        } else {
          context.moveTo(-browWidth * 0.5, offset);
          context.lineTo(browWidth * 0.5, -browHeight * 0.18 + offset);
        }
        context.stroke();
      }
      context.restore();
      return;
    }

    context.save();
    context.lineCap = 'round';
    context.lineJoin = 'round';
    (mark.hairs || []).forEach(function (hair) {
      var p = markCanvasPoint(imageRect, mark, hair);
      var length = (hair.length || 18) * p.sx;
      var angle = hair.angle || 0;
      var width = Math.max(1.2, (hair.width || 3) * Math.min(p.sx, p.sy));
      context.strokeStyle = 'rgba(24, 16, 11, ' + (hair.alpha || 0.82) + ')';
      context.lineWidth = width;
      context.beginPath();
      context.moveTo(p.x - Math.cos(angle) * length * 0.5, p.y - Math.sin(angle) * length * 0.5);
      context.lineTo(p.x + Math.cos(angle) * length * 0.5, p.y + Math.sin(angle) * length * 0.5);
      context.stroke();
    });
    context.restore();
  }

  function textureToFaceSample(scene, textureKey, marks) {
    var canvas = drawFaceCanvas(scene, textureKey, marks);
    var context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return [];

    var data = context.getImageData(0, 0, FACE_SAMPLE_WIDTH, FACE_SAMPLE_HEIGHT).data;
    var rows = [];
    for (var row = 0; row < FACE_SAMPLE_HEIGHT; row += 1) {
      var pixels = [];
      for (var col = 0; col < FACE_SAMPLE_WIDTH; col += 1) {
        var index = (row * FACE_SAMPLE_WIDTH + col) * 4;
        pixels.push([
          Number((data[index] / 255).toFixed(4)),
          Number((data[index + 1] / 255).toFixed(4)),
          Number((data[index + 2] / 255).toFixed(4))
        ]);
      }
      rows.push(pixels);
    }
    return rows;
  }

  function pointerToImageUv(image, pointer) {
    var bounds = image.getBounds();
    if (
      pointer.x < bounds.x ||
      pointer.x > bounds.x + bounds.width ||
      pointer.y < bounds.y ||
      pointer.y > bounds.y + bounds.height
    ) {
      return null;
    }
    return {
      u: (pointer.x - bounds.x) / bounds.width,
      v: (pointer.y - bounds.y) / bounds.height
    };
  }

  game.disguise = game.disguise || {};
  game.disguise.renderer = {
    fitImageToBox: fitImageToBox,
    smoothTexture: smoothTexture,
    smoothDisguiseFaceTextures: smoothDisguiseFaceTextures,
    disguiseTextureForState: disguiseTextureForState,
    fitDisguisePortrait: fitDisguisePortrait,
    containedDrawRect: containedDrawRect,
    drawFaceCanvas: drawFaceCanvas,
    markCanvasPoint: markCanvasPoint,
    applyReshapeMark: applyReshapeMark,
    drawMarkOnCanvas: drawMarkOnCanvas,
    textureToFaceSample: textureToFaceSample,
    pointerToImageUv: pointerToImageUv
  };
}(window));

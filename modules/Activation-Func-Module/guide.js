(function () {
  'use strict';

  /* ==================================================================
     Canvas Utilities
     ================================================================== */
  function resizeCanvas(canvas, logicalW, logicalH) {
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    var needResize = canvas.width !== Math.round(logicalW * ratio) ||
                     canvas.height !== Math.round(logicalH * ratio);
    if (needResize) {
      canvas.width = Math.round(logicalW * ratio);
      canvas.height = Math.round(logicalH * ratio);
    }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return ctx;
  }

  function clearCanvas(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fbfdff';
    ctx.fillRect(0, 0, w, h);
  }

  /* ==================================================================
     Shared: coordinate system helper
     ================================================================== */
  function coordSystem(w, h, marginL, marginR, marginT, marginB, xMin, xMax, yMin, yMax) {
    var plotW = w - marginL - marginR;
    var plotH = h - marginT - marginB;
    return {
      toX: function (x) { return marginL + (x - xMin) / (xMax - xMin) * plotW; },
      toY: function (y) { return marginT + (1 - (y - yMin) / (yMax - yMin)) * plotH; },
    };
  }

  function drawAxes(ctx, cs, w, h, xMin, xMax, yMin, yMax, marginT, marginB) {
    ctx.strokeStyle = '#68778f';
    ctx.lineWidth = 1.5;
    var yAxisX = cs.toX(0);
    if (yAxisX > 0 && yAxisX < w) {
      ctx.beginPath(); ctx.moveTo(yAxisX, marginT - 8); ctx.lineTo(yAxisX, h - marginB + 8); ctx.stroke();
    }
    var xAxisY = cs.toY(0);
    if (xAxisY > marginT && xAxisY < h - marginB) {
      ctx.beginPath(); ctx.moveTo(0, xAxisY); ctx.lineTo(w, xAxisY); ctx.stroke();
    }
    ctx.fillStyle = '#68778f';
    ctx.font = '800 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (var v = Math.ceil(xMin); v <= xMax; v++) {
      if (v === 0) continue;
      var tx = cs.toX(v);
      ctx.beginPath(); ctx.moveTo(tx, xAxisY - 4); ctx.lineTo(tx, xAxisY + 4); ctx.stroke();
      ctx.fillText(v, tx, xAxisY + 8);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (var u = Math.ceil(yMin); u <= yMax; u++) {
      if (u === 0) continue;
      var ty = cs.toY(u);
      ctx.beginPath(); ctx.moveTo(yAxisX - 4, ty); ctx.lineTo(yAxisX + 4, ty); ctx.stroke();
      ctx.fillText(u, yAxisX - 8, ty);
    }
    ctx.fillStyle = '#68778f';
    ctx.font = '800 10px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    if (xAxisY > marginT && xAxisY < h - marginB) ctx.fillText('0', yAxisX - 6, xAxisY + 4);
    ctx.fillStyle = '#27446e';
    ctx.font = '900 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('x', w - 14, xAxisY - 6);
    ctx.fillText('y', yAxisX + 6, marginT + 14);
  }

  /* ==================================================================
     Screen 0: Linear Playground
     ================================================================== */
  function drawLinearPlayground(canvas, a, b) {
    var w = 640, h = 320;
    var ctx = resizeCanvas(canvas, w, h);
    clearCanvas(ctx, w, h);
    var xMin = -6, xMax = 6, yMin = -6, yMax = 6;
    var ml = 55, mr = 30, mt = 30, mb = 45;
    var cs = coordSystem(w, h, ml, mr, mt, mb, xMin, xMax, yMin, yMax);
    drawAxes(ctx, cs, w, h, xMin, xMax, yMin, yMax, mt, mb);

    ctx.strokeStyle = '#eef2f7';
    ctx.lineWidth = 0.5;
    for (var gx = Math.ceil(xMin); gx <= xMax; gx++) {
      if (gx === 0) continue;
      var gpx = cs.toX(gx);
      ctx.beginPath(); ctx.moveTo(gpx, mt); ctx.lineTo(gpx, h - mb); ctx.stroke();
    }
    for (var gy = Math.ceil(yMin); gy <= yMax; gy++) {
      if (gy === 0) continue;
      var gpy = cs.toY(gy);
      ctx.beginPath(); ctx.moveTo(ml, gpy); ctx.lineTo(w - mr, gpy); ctx.stroke();
    }

    var steps = 200;
    ctx.strokeStyle = '#f07e47';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    var first = true;
    for (var i = 0; i <= steps; i++) {
      var x = xMin + (xMax - xMin) * i / steps;
      var y = a * x + b;
      if (y < yMin || y > yMax) { first = true; continue; }
      var px = cs.toX(x), py = cs.toY(y);
      if (first) { ctx.moveTo(px, py); first = false; }
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    var labelX = cs.toX(2), labelY = cs.toY(a * 2 + b);
    if (labelY < mt) labelY = mt + 20;
    if (labelY > h - mb) labelY = h - mb - 20;
    ctx.fillStyle = '#f07e47';
    ctx.font = '900 14px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    var formula = 'y = ' + a.toFixed(2) + 'x';
    if (b >= 0) formula += ' + ' + b.toFixed(2);
    else formula += ' - ' + Math.abs(b).toFixed(2);
    ctx.fillText(formula, labelX + 6, labelY - 6);
  }

  /* ==================================================================
     Screen 1: Nesting
     ================================================================== */
  function drawNesting(canvas, a, b) {
    var w = 640, h = 320;
    var ctx = resizeCanvas(canvas, w, h);
    clearCanvas(ctx, w, h);
    var xMin = -6, xMax = 6, yMin = -6, yMax = 6;
    var ml = 55, mr = 30, mt = 30, mb = 50;
    var cs = coordSystem(w, h, ml, mr, mt, mb, xMin, xMax, yMin, yMax);
    drawAxes(ctx, cs, w, h, xMin, xMax, yMin, yMax, mt, mb);

    var steps = 200;
    ctx.strokeStyle = '#3b6fb6';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 3]);
    ctx.lineCap = 'round';
    ctx.beginPath();
    var first = true;
    for (var i = 0; i <= steps; i++) {
      var x = xMin + (xMax - xMin) * i / steps;
      var y = a * x + b;
      if (y < yMin || y > yMax) { first = true; continue; }
      var px = cs.toX(x), py = cs.toY(y);
      if (first) { ctx.moveTo(px, py); first = false; }
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    var a2 = a * a, b2 = a * b + b;
    ctx.strokeStyle = '#f07e47';
    ctx.lineWidth = 3;
    ctx.beginPath();
    first = true;
    for (var j = 0; j <= steps; j++) {
      var x2 = xMin + (xMax - xMin) * j / steps;
      var y2 = a2 * x2 + b2;
      if (y2 < yMin || y2 > yMax) { first = true; continue; }
      var px2 = cs.toX(x2), py2 = cs.toY(y2);
      if (first) { ctx.moveTo(px2, py2); first = false; }
      else ctx.lineTo(px2, py2);
    }
    ctx.stroke();

    ctx.fillStyle = '#3b6fb6';
    ctx.font = '900 12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('f(x) = ax + b', ml + 6, h - mb + 22);
    ctx.fillStyle = '#f07e47';
    ctx.fillText('f(f(x)) = a²x + ab + b', ml + 6, h - mb + 40);

    if (Math.abs(a2 - a) < 0.02 && Math.abs(b2 - b) < 0.02) {
      ctx.fillStyle = '#68778f';
      ctx.font = '800 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('两层完全重合——嵌套没有改变形状', w / 2, h - mb + 22);
    }
  }

  /* ==================================================================
     Screen 2: ReLU Visualization
     ================================================================== */
  function drawReLU(canvas, dragX) {
    var w = 640, h = 300;
    var ctx = resizeCanvas(canvas, w, h);
    clearCanvas(ctx, w, h);
    var xMin = -5, xMax = 5, yMin = -1, yMax = 6;
    var ml = 60, mr = 30, mt = 30, mb = 55;
    var cs = coordSystem(w, h, ml, mr, mt, mb, xMin, xMax, yMin, yMax);
    drawAxes(ctx, cs, w, h, xMin, xMax, yMin, yMax, mt, mb);

    ctx.strokeStyle = '#f07e47';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cs.toX(xMin), cs.toY(0));
    ctx.lineTo(cs.toX(0), cs.toY(0));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cs.toX(0), cs.toY(0));
    ctx.lineTo(cs.toX(xMax), cs.toY(xMax));
    ctx.stroke();

    var foldX = cs.toX(0), foldY = cs.toY(0);
    ctx.fillStyle = '#c43f52';
    ctx.beginPath();
    ctx.arc(foldX, foldY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '900 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('折', foldX, foldY);

    ctx.fillStyle = '#68778f';
    ctx.font = '800 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('x < 0：输出 = 0', cs.toX(-2.5), cs.toY(0.5));
    ctx.fillText('x > 0：输出 = x', cs.toX(2.5), cs.toY(3.2));

    var dragClamped = Math.max(xMin, Math.min(xMax, dragX));
    var dragOut = dragClamped < 0 ? 0 : dragClamped;
    var dpX = cs.toX(dragClamped), dpY = cs.toY(dragOut);

    ctx.fillStyle = '#3b6fb6';
    ctx.beginPath();
    ctx.arc(dpX, cs.toY(0), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3b6fb6';
    ctx.font = '900 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('x=' + dragClamped.toFixed(1), dpX, cs.toY(0) + 12);

    ctx.fillStyle = '#c43f52';
    ctx.beginPath();
    ctx.arc(dpX, dpY, 6, 0, Math.PI * 2);
    ctx.fill();

    if (dragClamped < 0) {
      ctx.strokeStyle = 'rgba(196,63,82,0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(dpX, cs.toY(0));
      ctx.lineTo(dpX, dpY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = '#c43f52';
    ctx.font = '900 13px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('ReLU(' + dragClamped.toFixed(1) + ') = ' + dragOut.toFixed(1), dpX + 12, dpY - 10);

    ctx.fillStyle = '#27446e';
    ctx.font = '900 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('ReLU(x) = max(0, x)', w / 2, mt + 20);
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = '#68778f';
    ctx.font = '800 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('← 在 Canvas 上左右移动鼠标，观察 x < 0 和 x > 0 时输出的变化', w / 2, h - 6);
  }

  /* ==================================================================
     helper: ReLU output
     ================================================================== */
  function neuronOut(x, w, b) { var v = w * x + b; return v > 0 ? v : 0; }

  /* ==================================================================
     helper: compute y range for ReLU network
     ================================================================== */
  function computeYRange(w1, b1, v1, w2, b2, v2, xMin, xMax) {
    var yMin = Infinity, yMax = -Infinity;
    for (var i = 0; i <= 200; i++) {
      var x = xMin + (xMax - xMin) * i / 200;
      var y = v1 * neuronOut(x, w1, b1) + v2 * neuronOut(x, w2, b2);
      if (y < yMin) yMin = y;
      if (y > yMax) yMax = y;
    }
    var pad = Math.max(0.5, (yMax - yMin) * 0.2);
    return { min: yMin - pad, max: yMax + pad };
  }

  /* ==================================================================
     Screen 3: ReLU in 2-neuron network — ANIMATED PIPELINE (FIXED)
     ================================================================== */
  function drawReLUNetworkAnimated(canvas, w1, b1, v1, w2, b2, v2, animT) {
    var W = 720, H = 520;
    var ctx = resizeCanvas(canvas, W, H);
    clearCanvas(ctx, W, H);

    var xMin = -4, xMax = 4;
    // Compute dynamic y-range so curve always fits
    var yRange = computeYRange(w1, b1, v1, w2, b2, v2, xMin, xMax);
    var lyMin = yRange.min, lyMax = yRange.max;

    // ---- Layout ----
    var pipeTop = 6, pipeH = 170, pipeBot = pipeTop + pipeH;
    var curveTop = pipeBot + 12, curveH = H - curveTop - 16;
    var ml = 50, mr = 20;

    // ---- Network Pipeline (top) ----
    drawNetworkPipeline(ctx, W, pipeTop, pipeH, w1, b1, v1, w2, b2, v2, animT);

    // ---- Function Curve (bottom) ----
    var lcs = coordSystem(W, H, ml, mr, curveTop, H - curveTop - curveH, xMin, xMax, lyMin, lyMax);

    // Axes on curve panel
    ctx.strokeStyle = '#68778f';
    ctx.lineWidth = 1.2;
    var lyAxisX = lcs.toX(0);
    var lxAxisY = lcs.toY(0);
    ctx.beginPath(); ctx.moveTo(lyAxisX, curveTop); ctx.lineTo(lyAxisX, H - 10); ctx.stroke();
    if (lxAxisY > curveTop && lxAxisY < H - 10) {
      ctx.beginPath(); ctx.moveTo(0, lxAxisY); ctx.lineTo(W, lxAxisY); ctx.stroke();
    }

    // Grid
    ctx.strokeStyle = '#eef2f7';
    ctx.lineWidth = 0.5;
    for (var gx = -4; gx <= 4; gx++) {
      if (gx === 0) continue;
      var gpx = lcs.toX(gx);
      ctx.beginPath(); ctx.moveTo(gpx, curveTop); ctx.lineTo(gpx, H - 10); ctx.stroke();
    }
    var gyStep = lyMax - lyMin < 5 ? 1 : 2;
    for (var gy = Math.ceil(lyMin / gyStep) * gyStep; gy <= lyMax; gy += gyStep) {
      if (gy === 0) continue;
      var gpy = lcs.toY(gy);
      if (gpy < curveTop || gpy > H - 10) continue;
      ctx.beginPath(); ctx.moveTo(ml, gpy); ctx.lineTo(W - mr, gpy); ctx.stroke();
    }

    // Draw combined output curve
    var steps = 250;
    ctx.strokeStyle = '#f07e47';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    var first = true;
    for (var i = 0; i <= steps; i++) {
      var x = xMin + (xMax - xMin) * i / steps;
      var y = v1 * neuronOut(x, w1, b1) + v2 * neuronOut(x, w2, b2);
      var px = lcs.toX(x), py = lcs.toY(y);
      if (py < curveTop - 5 || py > H - 5) { first = true; continue; }
      if (first) { ctx.moveTo(px, py); first = false; }
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Mark fold points
    [w1, b1, w2, b2].forEach(function (w, idx) {
      var b = idx === 0 ? b1 : (idx === 1 ? b2 : 0);
      if (w === 0) return;
      var foldX = -b / w;
      if (foldX <= xMin || foldX >= xMax) return;
      var fy = v1 * neuronOut(foldX, w1, b1) + v2 * neuronOut(foldX, w2, b2);
      var fpx = lcs.toX(foldX), fpy = lcs.toY(fy);
      ctx.fillStyle = '#c43f52';
      ctx.beginPath();
      ctx.arc(fpx, fpy, 4, 0, Math.PI * 2);
      ctx.fill();
      // Label fold x
      ctx.fillStyle = '#c43f52';
      ctx.font = '800 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('x=' + foldX.toFixed(2), fpx, fpy - 8);
    });

    // Animated sweep point
    if (animT !== undefined) {
      var sweepX = xMin + ((animT % 1) * (xMax - xMin));
      var sweepY = v1 * neuronOut(sweepX, w1, b1) + v2 * neuronOut(sweepX, w2, b2);
      var spx = lcs.toX(sweepX), spy = lcs.toY(sweepY);
      if (spy > curveTop && spy < H - 10) {
        // Glow
        ctx.fillStyle = 'rgba(240,126,71,0.18)';
        ctx.beginPath();
        ctx.arc(spx, spy, 12, 0, Math.PI * 2);
        ctx.fill();
        // Core dot
        ctx.fillStyle = '#f07e47';
        ctx.beginPath();
        ctx.arc(spx, spy, 6, 0, Math.PI * 2);
        ctx.fill();
        // x value label
        ctx.fillStyle = '#27446e';
        ctx.font = '900 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('x=' + sweepX.toFixed(2), spx, spy - 14);
        ctx.fillText('y=' + sweepY.toFixed(2), spx, spy - 26);
      }
    }

    // Title
    ctx.fillStyle = '#27446e';
    ctx.font = '900 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('y = v₁·ReLU(w₁x+b₁) + v₂·ReLU(w₂x+b₂)', W / 2, curveTop - 6);
    ctx.textBaseline = 'alphabetic';

    // Ticks
    ctx.fillStyle = '#68778f';
    ctx.font = '800 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (var v = Math.ceil(xMin); v <= xMax; v++) {
      if (v === 0) continue;
      var tv = lcs.toX(v);
      ctx.fillText(v, tv, lxAxisY + 8);
    }
    ctx.fillStyle = '#68778f';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('0', lyAxisX - 6, lxAxisY + 4);
    ctx.fillStyle = '#27446e';
    ctx.font = '900 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('x', W - mr - 4, lxAxisY - 6);
    ctx.fillText('y', lyAxisX + 6, curveTop + 14);
  }

  /* ==================================================================
     Network Pipeline Diagram (top section of Screen 3)
     ================================================================== */
  function drawNetworkPipeline(ctx, W, topY, pipeH, w1, b1, v1, w2, b2, v2, animT) {
    // Box dimensions
    var bw = 90, bh = 34, br = 8;
    var gap = 16;
    var arrowLen = 22;

    // Two rows: row1 = neuron 1, row2 = neuron 2
    var row1Y = topY + 10;
    var row2Y = topY + pipeH / 2 + 4;
    var rowH = pipeH / 2 - 14;

    // Column positions (shared)
    var colInputX = 36;
    var colWxX = colInputX + 50 + gap;
    var colReLUX = colWxX + bw + gap;
    var colVxX = colReLUX + bw + gap;
    var colMergeX = colVxX + bw + gap;
    var colOutX = colMergeX + 40;

    // Colors
    var c1 = '#3b6fb6', c2 = '#7b4ea5';

    function drawBox(x, y, w, h, r, text, color, alpha) {
      alpha = alpha || 0.18;
      ctx.fillStyle = color.replace(')', ', ' + alpha + ')').replace('rgb', 'rgba');
      if (color === '#f07e47') ctx.fillStyle = 'rgba(240,126,71,' + alpha + ')';
      else if (color === '#228d5c') ctx.fillStyle = 'rgba(34,141,92,' + alpha + ')';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
      else { ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + r, r); ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath(); }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = '800 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x + w / 2, y + h / 2);
    }

    function drawArrow(x1, y1, x2, y2, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      // Head
      var angle = Math.atan2(y2 - y1, x2 - x1);
      var hx = x2 - Math.cos(angle) * 8;
      var hy = y2 - Math.sin(angle) * 8;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(hx - Math.sin(angle) * 5, hy + Math.cos(angle) * 5);
      ctx.lineTo(hx + Math.sin(angle) * 5, hy - Math.cos(angle) * 5);
      ctx.closePath();
      ctx.fill();
    }

    // ---- Row 1 ----
    var r1cy = row1Y + rowH / 2;
    // x node
    var xX1 = colInputX, xY1 = r1cy;
    ctx.fillStyle = '#27446e';
    ctx.beginPath();
    ctx.arc(xX1, xY1, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '900 13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('x', xX1, xY1);

    drawArrow(xX1 + 15, xY1, colWxX, xY1, c1);
    drawBox(colWxX, r1cy - bh / 2, bw, bh, br, 'w₁x+b₁', c1, 0.15);
    drawArrow(colWxX + bw, r1cy, colReLUX, r1cy, c1);
    drawBox(colReLUX, r1cy - bh / 2, bw, bh, br, 'ReLU', '#c43f52', 0.18);
    drawArrow(colReLUX + bw, r1cy, colVxX, r1cy, c1);
    drawBox(colVxX, r1cy - bh / 2, bw, bh, br, '× v₁', c1, 0.15);

    // ---- Row 2 ----
    var r2cy = row2Y + rowH / 2;
    // x node (branch from same input)
    ctx.fillStyle = '#27446e';
    ctx.beginPath();
    ctx.arc(xX1, r2cy, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '900 13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('x', xX1, r2cy);

    // Vertical line connecting two x nodes
    ctx.strokeStyle = '#27446e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xX1, xY1 + 15);
    ctx.lineTo(xX1, r2cy - 15);
    ctx.stroke();

    drawArrow(xX1 + 15, r2cy, colWxX, r2cy, c2);
    drawBox(colWxX, r2cy - bh / 2, bw, bh, br, 'w₂x+b₂', c2, 0.15);
    drawArrow(colWxX + bw, r2cy, colReLUX, r2cy, c2);
    drawBox(colReLUX, r2cy - bh / 2, bw, bh, br, 'ReLU', '#c43f52', 0.18);
    drawArrow(colReLUX + bw, r2cy, colVxX, r2cy, c2);
    drawBox(colVxX, r2cy - bh / 2, bw, bh, br, '× v₂', c2, 0.15);

    // ---- Merge ----
    drawArrow(colVxX + bw, r1cy, colMergeX, r1cy, c1);
    drawArrow(colVxX + bw, r2cy, colMergeX, r2cy, c2);

    // Sum node
    var mergeCY = (r1cy + r2cy) / 2;
    ctx.fillStyle = '#228d5c';
    ctx.beginPath();
    ctx.arc(colMergeX + 20, mergeCY, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '900 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', colMergeX + 20, mergeCY);

    drawArrow(colMergeX + 38, mergeCY, colOutX, mergeCY, '#228d5c');

    // Output node
    ctx.fillStyle = '#f07e47';
    ctx.beginPath();
    ctx.arc(colOutX + 15, mergeCY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '900 13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('y', colOutX + 15, mergeCY);

    // ---- Animated pulse dots (if animT provided) ----
    if (animT !== undefined) {
      var pulsePhase = animT % 1;
      // Compute the x position along each branch path
      var path1Length = (colMergeX + 20) - xX1;
      var path2Length = (colMergeX + 20) - xX1;
      var pos1 = xX1 + pulsePhase * path1Length;
      var pos2 = xX1 + pulsePhase * path2Length;

      // Draw pulses on each path
      [pos1, pos2].forEach(function (pos, pi) {
        var py = pi === 0 ? r1cy : r2cy;
        var pc = pi === 0 ? c1 : c2;
        // Glow
        ctx.fillStyle = pc === '#3b6fb6' ? 'rgba(59,111,182,0.22)' : 'rgba(123,78,165,0.22)';
        ctx.beginPath();
        ctx.arc(pos, py, 8, 0, Math.PI * 2);
        ctx.fill();
        // Pulse
        ctx.fillStyle = pc;
        ctx.beginPath();
        ctx.arc(pos, py, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Pulse on merge→output path
      var outPulseX = colMergeX + 20 + pulsePhase * (colOutX + 15 - colMergeX - 20);
      ctx.fillStyle = 'rgba(240,126,71,0.25)';
      ctx.beginPath();
      ctx.arc(outPulseX, mergeCY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f07e47';
      ctx.beginPath();
      ctx.arc(outPulseX, mergeCY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Labels
    ctx.fillStyle = '#68778f';
    ctx.font = '700 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('神经元 1', colWxX + bw / 2, row2Y - 4);
    ctx.fillText('神经元 2', colWxX + bw / 2, topY + pipeH + 2);

    // Current value readouts below pipeline
    if (animT !== undefined) {
      var sx = -4 + ((animT % 1) * 8);
      var r1 = neuronOut(sx, w1, b1);
      var r2 = neuronOut(sx, w2, b2);
      var ry = v1 * r1 + v2 * r2;
      ctx.fillStyle = '#27446e';
      ctx.font = '800 10px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('x=' + sx.toFixed(2) +
        '  →  r₁=' + r1.toFixed(2) + '  r₂=' + r2.toFixed(2) +
        '  →  y=' + ry.toFixed(3), 20, topY + pipeH - 14);
    }
  }

  /* ==================================================================
     Screen 5: Universal Approximation (FIX 2 + FEATURE 2)
     ================================================================== */
  function drawUniversalApproximation(canvas, neuronCount) {
    var W = 720, H = 460;
    var ctx = resizeCanvas(canvas, W, H);
    clearCanvas(ctx, W, H);

    var xMin = -4, xMax = 4;
    // Target function: mix of sin waves — clearly nonlinear
    function target(x) { return Math.sin(2.2 * x) * 1.2 + Math.cos(3.5 * x + 0.6) * 0.5; }

    // Compute all y values to get range
    var allY = [];
    for (var i = 0; i <= 300; i++) {
      allY.push(target(xMin + (xMax - xMin) * i / 300));
    }
    var tMin = Math.min.apply(null, allY);
    var tMax = Math.max.apply(null, allY);
    var pad = Math.max(0.8, (tMax - tMin) * 0.25);
    var yMin = tMin - pad, yMax = tMax + pad;

    // Build neurons: evenly-spaced fold points
    var neurons = [];
    if (neuronCount > 0) {
      // Place fold points at evenly-spaced x positions
      var margin = 0.3;
      for (var n = 0; n < neuronCount; n++) {
        var foldX = xMin + margin + (xMax - xMin - 2 * margin) * n / Math.max(1, neuronCount - 1);
        // w = 1, b = -foldX so that wx+b=0 at x=foldX
        var w = 1.0;
        var b = -foldX;

        // Estimate slope change at fold point using finite difference
        var eps = 0.02;
        var slopeBefore = (target(foldX) - target(foldX - eps)) / eps;
        var slopeAfter = (target(foldX + eps) - target(foldX)) / eps;
        // The v needed = slopeAfter - slopeBefore (approximately)
        // For ReLU(wx+b) with w=1, the contribution slope is v after the fold point
        var v = slopeAfter;
        if (n > 0) {
          // Accumulated slope from previous neurons
          var prevFoldX = xMin + margin + (xMax - xMin - 2 * margin) * (n - 1) / Math.max(1, neuronCount - 1);
          // At current foldX, compute contribution of all previous neurons
          var accSlope = 0;
          for (var p = 0; p < n; p++) {
            var pw = neurons[p].w, pb = neurons[p].b, pv = neurons[p].v;
            if (pw * foldX + pb > 0) accSlope += pv * pw;
          }
          v = slopeAfter - accSlope;
        } else {
          // First neuron: v = overall slope at foldX (target slope - baseline 0)
          v = slopeAfter;
        }

        neurons.push({ w: w, b: b, v: v });
      }
    }

    function networkOut(x) {
      var s = 0;
      for (var k = 0; k < neurons.length; k++) {
        s += neurons[k].v * neuronOut(x, neurons[k].w, neurons[k].b);
      }
      return s;
    }

    // Layout
    var ml = 55, mr = 20, mt = 30, mb = 55;
    var cs = coordSystem(W, H, ml, mr, mt, mb, xMin, xMax, yMin, yMax);
    drawAxes(ctx, cs, W, H, xMin, xMax, yMin, yMax, mt, mb);

    // Grid
    ctx.strokeStyle = '#eef2f7';
    ctx.lineWidth = 0.5;
    for (var gx = -4; gx <= 4; gx++) {
      if (gx === 0) continue;
      var gpx = cs.toX(gx);
      ctx.beginPath(); ctx.moveTo(gpx, mt); ctx.lineTo(gpx, H - mb); ctx.stroke();
    }

    // Target function (dashed thick gray)
    ctx.strokeStyle = 'rgba(104,119,143,0.55)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    var tf = true;
    for (var i = 0; i <= 300; i++) {
      var tx = xMin + (xMax - xMin) * i / 300;
      var ty = target(tx);
      var tpx = cs.toX(tx), tpy = cs.toY(ty);
      if (tpy < mt || tpy > H - mb) { tf = true; continue; }
      if (tf) { ctx.moveTo(tpx, tpy); tf = false; }
      else ctx.lineTo(tpx, tpy);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Individual neuron contributions (faded)
    if (neurons.length <= 12) {
      var pastelColors = [
        'rgba(59,111,182,0.3)', 'rgba(123,78,165,0.3)', 'rgba(34,141,92,0.3)',
        'rgba(196,63,82,0.3)', 'rgba(192,113,0,0.3)', 'rgba(240,126,71,0.3)',
        'rgba(59,111,182,0.3)', 'rgba(123,78,165,0.3)', 'rgba(34,141,92,0.3)',
        'rgba(196,63,82,0.3)', 'rgba(192,113,0,0.3)', 'rgba(240,126,71,0.3)',
      ];
      neurons.forEach(function (n, ni) {
        ctx.strokeStyle = pastelColors[ni % pastelColors.length];
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        var nf = true;
        for (var i = 0; i <= 200; i++) {
          var x = xMin + (xMax - xMin) * i / 200;
          var y = n.v * neuronOut(x, n.w, n.b);
          var px = cs.toX(x), py = cs.toY(y);
          if (py < mt || py > H - mb) { nf = true; continue; }
          if (nf) { ctx.moveTo(px, py); nf = false; }
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      });
    }

    // Network output (solid orange)
    ctx.strokeStyle = '#f07e47';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    var nf2 = true;
    for (var j = 0; j <= 300; j++) {
      var nx = xMin + (xMax - xMin) * j / 300;
      var ny = networkOut(nx);
      var npx = cs.toX(nx), npy = cs.toY(ny);
      if (npy < mt || npy > H - mb) { nf2 = true; continue; }
      if (nf2) { ctx.moveTo(npx, npy); nf2 = false; }
      else ctx.lineTo(npx, npy);
    }
    ctx.stroke();

    // Mark fold points
    neurons.forEach(function (n) {
      if (n.w === 0) return;
      var fx = -n.b / n.w;
      if (fx <= xMin || fx >= xMax) return;
      var fy = networkOut(fx);
      var fpx = cs.toX(fx), fpy = cs.toY(fy);
      ctx.fillStyle = '#c43f52';
      ctx.beginPath();
      ctx.arc(fpx, fpy, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Legend
    ctx.fillStyle = 'rgba(104,119,143,0.8)';
    ctx.font = '900 12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.setLineDash([6, 4]);
    ctx.fillText('--- 目标函数 f(x)', ml + 4, H - mb + 20);
    ctx.setLineDash([]);
    ctx.fillStyle = '#f07e47';
    ctx.fillText('── 网络近似 ŷ(x)', ml + 4, H - mb + 40);

    // Title
    ctx.fillStyle = '#27446e';
    ctx.font = '900 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('ŷ(x) = Σ vᵢ·ReLU(wᵢx + bᵢ)   —   ' + neuronCount + ' 个神经元', W / 2, mt - 6);
    ctx.textBaseline = 'alphabetic';
  }

  /* ==================================================================
     Landing Page
     ================================================================== */
  function createLanding(shell) {
    var landing = document.createElement('section');
    landing.className = 'af-landing';
    landing.id = 'afLanding';
    landing.innerHTML =
      '<h2>直线能"弯"吗？</h2>' +
      '<p>线性函数像一条拉紧的绳子——可以倾斜、可以平移，但<strong>不会弯</strong>。接下来的几分钟，你将亲眼看到激活函数如何在线性层之间制造<strong>折点</strong>，让函数形状真正丰富起来。</p>' +
      '<form class="af-landing-form" id="afLandingForm">' +
        '<input id="afLandingInput" type="text" value="弯曲" aria-label="描述">' +
        '<button class="edu-btn edu-btn--primary" id="afLandingSubmit" type="submit">开始探索</button>' +
      '</form>';
    var firstScreen = shell.querySelector('.af-screen');
    if (firstScreen) shell.insertBefore(landing, firstScreen);
    else shell.appendChild(landing);
  }

  /* ==================================================================
     Exports
     ================================================================== */
  window.afDraw = {
    linearPlayground: drawLinearPlayground,
    nesting: drawNesting,
    relu: drawReLU,
    reluNetworkAnimated: drawReLUNetworkAnimated,
    universalApproximation: drawUniversalApproximation,
    createLanding: createLanding,
  };
})();

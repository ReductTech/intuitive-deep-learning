import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { IMAGE_SIZE, REGION_BOUNDS, VECTOR_ORDERS, VECTOR_ORDER_LABELS, type DatasetRow, type Feature, type MlpModel, type VectorOrder, argmax, mlpForward, modelFeatureVector } from '../model/manualFeatureMath';

function prepare(canvas: HTMLCanvasElement, width: number, height: number, background = '#fbfdff') {
  const ratio = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext('2d'); if (!ctx) return null;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
  return ctx;
}

function drawVectorTraversal(ctx: CanvasRenderingContext2D, originX: number, originY: number, cell: number, order: VectorOrder) {
  const points = VECTOR_ORDERS[order].map((region) => {
    const row = Math.floor(region / 3), col = region % 3;
    return {
      x: originX + ((REGION_BOUNDS[col] + REGION_BOUNDS[col + 1]) / 2) * cell,
      y: originY + ((REGION_BOUNDS[row] + REGION_BOUNDS[row + 1]) / 2) * cell,
      region,
    };
  });
  const routeColor = '#57b8ff', badgeColor = '#f07842', shorten = Math.max(19, cell * 1.15);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  points.slice(0, -1).forEach((point, index) => {
    const next = points[index + 1], dx = next.x - point.x, dy = next.y - point.y, distance = Math.hypot(dx, dy) || 1;
    const unitX = dx / distance, unitY = dy / distance;
    const startX = point.x + unitX * shorten, startY = point.y + unitY * shorten;
    const endX = next.x - unitX * shorten, endY = next.y - unitY * shorten;
    const rowDistance = Math.abs(Math.floor(point.region / 3) - Math.floor(next.region / 3));
    const colDistance = Math.abs((point.region % 3) - (next.region % 3));
    const isJump = rowDistance + colDistance > 1;

    ctx.setLineDash(isJump ? [Math.max(5, cell * .35), Math.max(5, cell * .35)] : []);
    ctx.strokeStyle = isJump ? 'rgba(87,184,255,.55)' : routeColor;
    ctx.lineWidth = Math.max(4, cell * .28);
    ctx.shadowColor = 'rgba(87,184,255,.48)';
    ctx.shadowBlur = Math.max(7, cell * .5);
    ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke();
    ctx.setLineDash([]); ctx.shadowBlur = 0;

    const arrowSize = Math.max(9, cell * .65);
    ctx.fillStyle = routeColor;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - unitX * arrowSize - unitY * arrowSize * .58, endY - unitY * arrowSize + unitX * arrowSize * .58);
    ctx.lineTo(endX - unitX * arrowSize + unitY * arrowSize * .58, endY - unitY * arrowSize - unitX * arrowSize * .58);
    ctx.closePath(); ctx.fill();
  });

  points.forEach((point, index) => {
    const row = Math.floor(point.region / 3), col = point.region % 3;
    const x = originX + REGION_BOUNDS[col] * cell + Math.max(15, cell * 1.05);
    const y = originY + REGION_BOUNDS[row] * cell + Math.max(15, cell * 1.05);
    const radius = Math.max(10, cell * .72);
    ctx.fillStyle = badgeColor; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.max(11, Math.round(cell * .82))}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(index + 1), x, y + .5);
  });

  ctx.fillStyle = routeColor;
  ctx.font = `850 ${Math.max(12, Math.round(cell * .9))}px system-ui, sans-serif`;
  ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(`路径预览 · ${VECTOR_ORDER_LABELS[order]}`, originX + IMAGE_SIZE * cell, Math.max(22, originY - 8));
  ctx.restore();
}

export function DigitGridCanvas({ pixels, features, activeRegion, highlightCountRegion, flashPixel, revealedRegions = [], previewOrder, label, compact = false, onPointerCell, onPointerEnd }: {
  pixels: number[][]; features?: Feature[]; activeRegion?: number; highlightCountRegion?: number; flashPixel?: [number, number] | null; revealedRegions?: number[]; previewOrder?: VectorOrder | ''; label?: string | number; compact?: boolean;
  onPointerCell?: (row: number, col: number) => void; onPointerEnd?: () => void;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const size = compact ? 320 : 560, ctx = prepare(canvas, size, size, '#0b1020'); if (!ctx) return;
    const margin = Math.max(12, size * .055), cell = (size - margin * 2) / IMAGE_SIZE, originX = (size - cell * IMAGE_SIZE) / 2, originY = originX;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    for (let row = 0; row < IMAGE_SIZE; row += 1) for (let col = 0; col < IMAGE_SIZE; col += 1) {
      if (!pixels[row]?.[col]) continue;
      const isFlash = flashPixel?.[0] === row && flashPixel?.[1] === col;
      ctx.fillStyle = isFlash ? '#e07a3f' : '#f8fbff';
      ctx.fillRect(originX + col * cell, originY + row * cell, Math.ceil(cell), Math.ceil(cell));
      if (isFlash) { ctx.strokeStyle = 'rgba(255,255,255,.96)'; ctx.lineWidth = Math.max(1, cell * .12); ctx.strokeRect(originX + col * cell, originY + row * cell, Math.ceil(cell), Math.ceil(cell)); }
    }
    REGION_BOUNDS.slice(1, -1).forEach((bound) => { const pos = bound * cell; ctx.strokeStyle = 'rgba(224,122,63,.72)'; ctx.lineWidth = Math.max(1, cell * .08); ctx.beginPath(); ctx.moveTo(originX + pos, originY); ctx.lineTo(originX + pos, originY + IMAGE_SIZE * cell); ctx.stroke(); ctx.beginPath(); ctx.moveTo(originX, originY + pos); ctx.lineTo(originX + IMAGE_SIZE * cell, originY + pos); ctx.stroke(); });
    if (activeRegion !== undefined) {
      const row = Math.floor(activeRegion / 3), col = activeRegion % 3;
      const x = originX + REGION_BOUNDS[col] * cell, y = originY + REGION_BOUNDS[row] * cell, w = (REGION_BOUNDS[col + 1] - REGION_BOUNDS[col]) * cell, h = (REGION_BOUNDS[row + 1] - REGION_BOUNDS[row]) * cell;
      ctx.fillStyle = 'rgba(224,122,63,.16)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#e07a3f'; ctx.lineWidth = Math.max(3, cell * .18); ctx.strokeRect(x, y, w, h);
    }
    if (previewOrder) drawVectorTraversal(ctx, originX, originY, cell, previewOrder);
    if (features) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      revealedRegions.forEach((region) => {
        const row = Math.floor(region / 3), col = region % 3;
        const x = originX + ((REGION_BOUNDS[col] + REGION_BOUNDS[col + 1]) / 2) * cell;
        const y = originY + ((REGION_BOUNDS[row] + REGION_BOUNDS[row + 1]) / 2) * cell;
        ctx.font = `950 ${Math.max(17, Math.round(cell * 1.8))}px system-ui, sans-serif`;
        ctx.lineWidth = Math.max(4, cell * .22); ctx.strokeStyle = 'rgba(11,16,32,.9)'; ctx.strokeText(String(features[region]?.count ?? 0), x, y + 1);
        ctx.fillStyle = region === highlightCountRegion ? '#e07a3f' : '#f8fbff'; ctx.fillText(String(features[region]?.count ?? 0), x, y + 1);
      });
    }
    if (label !== undefined && String(label) !== '') { ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = '900 15px system-ui, sans-serif'; ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic'; ctx.fillText(`label: ${label}`, 14, 24); }
    ctx.restore();
  }, [pixels, features, activeRegion, highlightCountRegion, flashPixel, revealedRegions, previewOrder, label, compact]);

  function position(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect(), size = compact ? 320 : 560, margin = Math.max(12, size * .055), cell = (size - margin * 2) / IMAGE_SIZE;
    const x = (event.clientX - rect.left) / rect.width * size, y = (event.clientY - rect.top) / rect.height * size;
    return { col: Math.max(0, Math.min(27, Math.floor((x - margin) / cell))), row: Math.max(0, Math.min(27, Math.floor((y - margin) / cell))) };
  }
  return <canvas ref={ref} aria-label={previewOrder ? `带九宫格的 MNIST 手写数字，正在预览${VECTOR_ORDER_LABELS[previewOrder]}的特征读取路径` : onPointerCell ? '手写数字测试画板' : '带九宫格的 MNIST 手写数字'} onPointerDown={(event) => { if (!onPointerCell) return; event.currentTarget.setPointerCapture(event.pointerId); const p = position(event); onPointerCell(p.row, p.col); }} onPointerMove={(event) => { if (!onPointerCell || !event.currentTarget.hasPointerCapture(event.pointerId)) return; const p = position(event); onPointerCell(p.row, p.col); }} onPointerUp={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); onPointerEnd?.(); }} />;
}

export function RegionZoomCanvas({ pixels, region }: { pixels: number[][]; region: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return; const size = 420, ctx = prepare(canvas, size, size, '#0b1020'); if (!ctx) return;
    const gridRow = Math.floor(region / 3), gridCol = region % 3, top = REGION_BOUNDS[gridRow], bottom = REGION_BOUNDS[gridRow + 1], left = REGION_BOUNDS[gridCol], right = REGION_BOUNDS[gridCol + 1];
    const rows = bottom - top, cols = right - left, padding = Math.max(18, size * .07), cell = Math.min((size - padding * 2) / rows, (size - padding * 2) / cols), ox = (size - cols * cell) / 2, oy = (size - rows * cell) / 2;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    for (let row = top; row < bottom; row += 1) for (let col = left; col < right; col += 1) { ctx.fillStyle = pixels[row]?.[col] ? '#fff' : '#10182b'; ctx.fillRect(ox + (col - left) * cell, oy + (row - top) * cell, cell, cell); ctx.strokeStyle = 'rgba(135,154,181,.3)'; ctx.strokeRect(ox + (col - left) * cell, oy + (row - top) * cell, cell, cell); }
    ctx.strokeStyle = '#e07a3f'; ctx.lineWidth = 3; ctx.strokeRect(ox, oy, cols * cell, rows * cell); ctx.restore();
  }, [pixels, region]);
  return <canvas ref={ref} aria-label="待填写格的像素放大图" />;
}

export function MlpNetworkCanvas({ row, model }: { row: DatasetRow; model: MlpModel | null }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return; const width = 520, height = 320, ctx = prepare(canvas, width, height); if (!ctx) return;
    const usedModel = model; const input = row.features.map((feature) => feature.count); const output = usedModel ? mlpForward(usedModel, modelFeatureVector(row, usedModel)) : { hidden: Array(18).fill(0), probs: Array(10).fill(.1) };
    const xs = [48, width * .49, width - 48], top = 42, bottom = height - 28;
    ctx.fillStyle = '#20324d'; ctx.font = '900 13px system-ui'; ctx.textAlign = 'center'; ['特征', '隐藏层', '输出'].forEach((label, i) => ctx.fillText(label, xs[i], 24));
    input.forEach((_, i) => output.hidden.forEach((__, h) => { if (h % 2 !== i % 2) return; ctx.strokeStyle = 'rgba(47,95,152,.08)'; ctx.beginPath(); ctx.moveTo(xs[0], top + (bottom - top) * i / 8); ctx.lineTo(xs[1], top + (bottom - top) * h / 17); ctx.stroke(); }));
    output.hidden.forEach((_, h) => output.probs.forEach((__, d) => { if (d % 2 !== h % 2) return; ctx.strokeStyle = 'rgba(31,138,104,.08)'; ctx.beginPath(); ctx.moveTo(xs[1], top + (bottom - top) * h / 17); ctx.lineTo(xs[2], top + (bottom - top) * d / 9); ctx.stroke(); }));
    const node = (x: number, y: number, radius: number, fill: string, label = '') => { ctx.fillStyle = fill; ctx.strokeStyle = 'rgba(32,50,77,.25)'; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); if (label) { ctx.fillStyle = '#20324d'; ctx.font = '800 9px system-ui'; ctx.textBaseline = 'middle'; ctx.fillText(label, x, y); } };
    input.forEach((value, i) => node(xs[0], top + (bottom - top) * i / 8, 12, `rgba(47,95,152,${.15 + Math.min(1, value / 60) * .75})`));
    output.hidden.forEach((value, h) => node(xs[1], top + (bottom - top) * h / 17, 10, value >= 0 ? `rgba(31,138,104,${.15 + Math.abs(value) * .72})` : `rgba(216,106,68,${.15 + Math.abs(value) * .72})`));
    const prediction = argmax(output.probs); output.probs.forEach((_, d) => node(xs[2], top + (bottom - top) * d / 9, 10, usedModel && d === prediction ? 'rgba(191,64,88,.9)' : 'rgba(54,67,84,.18)', String(d)));
  }, [row, model]);
  return <canvas ref={ref} aria-label="双层 MLP 网络示意图" />;
}

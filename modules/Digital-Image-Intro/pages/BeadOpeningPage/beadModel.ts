export type RGB = [number, number, number];
export interface BeadGrid { columns: number; rows: number; colors: RGB[]; }

export function photographCanvas(image: HTMLImageElement, width = 384, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('浏览器无法创建 Canvas。');
  const targetRatio = width / height;
  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const sw = sourceRatio > targetRatio ? image.naturalHeight * targetRatio : image.naturalWidth;
  const sh = sourceRatio > targetRatio ? image.naturalHeight : image.naturalWidth / targetRatio;
  context.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2, sw, sh, 0, 0, width, height);
  return canvas;
}

/** Median-cut palette derived from this photograph, shared by all three bead densities. */
export function makePalette(canvas: HTMLCanvasElement, count: number): RGB[] {
  const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
  const pixels: RGB[] = [];
  for (let i = 0; i < data.length; i += 4 * 12) pixels.push([data[i], data[i + 1], data[i + 2]]);
  const spread = (bucket: RGB[]) => [0, 1, 2].map(c => Math.max(...bucket.map(p => p[c])) - Math.min(...bucket.map(p => p[c])));
  const buckets = [pixels];
  while (buckets.length < count) {
    let index = -1;
    let score = -1;
    buckets.forEach((bucket, i) => {
      if (bucket.length < 2) return;
      const s = Math.max(...spread(bucket)) * Math.sqrt(bucket.length);
      if (s > score) { score = s; index = i; }
    });
    if (index < 0) break;
    const bucket = buckets.splice(index, 1)[0];
    const ranges = spread(bucket);
    const channel = ranges.indexOf(Math.max(...ranges));
    bucket.sort((a, b) => a[channel] - b[channel]);
    const middle = Math.floor(bucket.length / 2);
    buckets.push(bucket.slice(0, middle), bucket.slice(middle));
  }
  return buckets.map(bucket => [0, 1, 2].map(c => Math.round(bucket.reduce((sum, p) => sum + p[c], 0) / bucket.length)) as RGB);
}

/** Each bead uses the area-average of its source region, snapped to the finite shared palette. */
export function sampleBeads(canvas: HTMLCanvasElement, columns: number, rows: number, palette: RGB[]): BeadGrid {
  const width = canvas.width;
  const height = canvas.height;
  const data = canvas.getContext('2d')!.getImageData(0, 0, width, height).data;
  const colors: RGB[] = [];
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const x0 = Math.floor(column * width / columns);
    const x1 = Math.floor((column + 1) * width / columns);
    const y0 = Math.floor(row * height / rows);
    const y1 = Math.floor((row + 1) * height / rows);
    const mean = [0, 0, 0];
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const index = (y * width + x) * 4;
      mean.forEach((_, c) => { mean[c] += data[index + c]; });
    }
    const area = (x1 - x0) * (y1 - y0);
    mean.forEach((v, c) => { mean[c] = v / area; });
    let nearest = palette[0];
    let best = Infinity;
    for (const color of palette) {
      const d = 0.3 * (color[0] - mean[0]) ** 2 + 0.59 * (color[1] - mean[1]) ** 2 + 0.11 * (color[2] - mean[2]) ** 2;
      if (d < best) { best = d; nearest = color; }
    }
    colors.push(nearest);
  }
  return { columns, rows, colors };
}

const colorString = (rgb: RGB, scale = 1, addition = 0) => `rgb(${rgb.map(v => Math.max(0, Math.min(255, Math.round(v * scale + addition)))).join(',')})`;

/** All geometry, shading, highlights and bead holes are drawn by H5, never image-generated. */
export function drawBeads(context: CanvasRenderingContext2D, grid: BeadGrid, width: number, height: number, pointer?: { x: number; y: number } | null) {
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#e7ddc9';
  context.fillRect(0, 0, width, height);
  const dx = width / grid.columns;
  const dy = height / grid.rows;
  const radius = Math.min(dx, dy) * 0.485;
  grid.colors.forEach((rgb, index) => {
    const x = (index % grid.columns + 0.5) * dx;
    const y = (Math.floor(index / grid.columns) + 0.5) * dy;
    context.beginPath();
    context.ellipse(x + radius * 0.1, y + radius * 0.2, radius, radius * 0.98, 0, 0, Math.PI * 2);
    context.fillStyle = 'rgba(49,37,22,.26)';
    context.fill();
    const gradient = context.createRadialGradient(x + radius * 0.3, y - radius * 0.45, radius * 0.02, x, y, radius);
    gradient.addColorStop(0, colorString(rgb, 0.84, 74));
    gradient.addColorStop(0.25, colorString(rgb, 1, 14));
    gradient.addColorStop(0.66, colorString(rgb, 0.96));
    gradient.addColorStop(0.90, colorString(rgb, 0.69));
    gradient.addColorStop(1, colorString(rgb, 0.43));
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = gradient;
    context.fill();
    // Small center opening distinguishes cylindrical craft beads from flat colored dots.
    context.beginPath();
    context.arc(x, y + radius * 0.02, radius * 0.10, 0, Math.PI * 2);
    context.fillStyle = colorString(rgb, 0.35);
    context.fill();
    context.beginPath();
    context.arc(x + radius * 0.32, y - radius * 0.43, radius * 0.17, 0, Math.PI * 2);
    context.fillStyle = 'rgba(255,255,255,.78)';
    context.fill();
  });
  if (pointer) {
    const col = Math.min(grid.columns - 1, Math.floor(pointer.x * grid.columns));
    const row = Math.min(grid.rows - 1, Math.floor(pointer.y * grid.rows));
    context.strokeStyle = '#f07e47';
    context.lineWidth = 3;
    context.strokeRect(col * dx + 1, row * dy + 1, dx - 2, dy - 2);
  }
}

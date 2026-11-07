export interface PythonNode {
  id: string; kind: string; inputs: string[]; line: number; shape: number[];
  column: number; endLine: number; endColumn: number; dtype: string;
  inputShapes: number[][]; preview: number[][]; mean: number;
  layer?: { kernel: number; channels: number; filters: number; padding: number };
}
export interface PythonGraph { channels: number; inputShape: number[]; nodes: PythonNode[]; output: string }
export interface PythonOutput { shape: number[]; preview: number[][]; mean: number; elapsed: number }
export interface PythonExecution {
  ok: boolean; graph: PythonGraph | null; result: PythonOutput | null;
  stdout: string; stderr: string; error?: string; line?: number; traceback?: string;
}
export const PYTHON_INITIAL_CODE = `from course_nn import nn

class ResidualBlock(nn.Module):
    def __init__(self, channels=4):
        super().__init__()
        self.conv1 = nn.Conv2d(
            channels, channels, 3, padding=1)
        self.conv2 = nn.Conv2d(
            channels, channels, 3, padding=1)
        self.relu = nn.ReLU()

    def forward(self, x):
        out = self.relu(self.conv1(x))
        out = self.conv2(out)
        return self.relu(out + x)
`;

export const NUMPY_INITIAL_CODE = `import numpy as np
from course_ops import tensor, conv2d, relu

x = tensor(np.arange(64).reshape(1,1,8,8)/64)
w = np.ones((1,1,3,3), dtype=np.float32)/9

def residual_block(x):
    out = conv2d(x, w, padding=1)
    out = relu(out)
    out = conv2d(out, w, padding=1)
    out = out + x
    return relu(out)

y = residual_block(x)
`;

/** CPython lives in a Worker, so stopping user code never blocks the page. */
export class PythonRunner {
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;
  private sequence = 0;
  private rejectReady: ((error: Error) => void) | null = null;
  private initTimer: ReturnType<typeof setTimeout> | undefined;
  private pending = new Map<number, { resolve: (value: PythonExecution) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  private status: (message: string) => void;
  constructor(status: (message: string) => void) { this.status = status; }
  private start(): Promise<void> {
    if (this.ready) return this.ready;
    const offline = (globalThis as { __SHUKU_OFFLINE_PYTHON__?: { worker: string; assets: Record<string, string> } }).__SHUKU_OFFLINE_PYTHON__;
    if ((globalThis as { __SHUKU_OFFLINE__?: boolean }).__SHUKU_OFFLINE__ && !offline) throw new Error('离线包缺少 Python 运行时，请重新下载课件。');
    const offlineUrl = offline ? 'data:text/javascript;charset=utf-8,' + encodeURIComponent(offline.worker) : null;
    const worker = offlineUrl ? new Worker(offlineUrl, { type: 'module' })
      : new Worker(new URL('./python.worker.ts', import.meta.url), { type: 'module' });
    this.worker = worker;
    this.ready = new Promise((resolve, reject) => {
      this.rejectReady = reject;
      this.initTimer = setTimeout(() => this.stop('Python 初始化超时，请检查网络后点击重试。'), 60000);
      worker.onmessage = (event: MessageEvent) => {
        const data = event.data;
        if (data.type === 'status') this.status(data.message);
        if (data.type === 'ready') { clearTimeout(this.initTimer); this.rejectReady = null; resolve(); }
        if (data.type === 'init-error') { reject(new Error(data.error)); this.stop(data.error); }
        if (data.type === 'result') {
          const pending = this.pending.get(data.id);
          if (pending) { clearTimeout(pending.timer); this.pending.delete(data.id); pending.resolve(data.execution); }
        }
      };
      worker.onerror = event => { const error = new Error(event.message || 'Python Worker 加载失败'); reject(error); this.stop(error.message); };
      if (offline) worker.postMessage({ type: 'init', assets: offline.assets });
    });
    return this.ready;
  }
  async run(source: string): Promise<PythonExecution> {
    await this.start();
    if (!this.worker) throw new Error('Python 运行已停止');
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => this.stop('运行超过 8 秒，已停止。请检查循环或缩小计算规模。'), 8000);
      this.pending.set(id, { resolve, reject, timer });
      this.worker!.postMessage({ type: 'run', id, source });
    });
  }
  stop(reason = '运行已停止') {
    clearTimeout(this.initTimer);
    this.rejectReady?.(new Error(reason)); this.rejectReady = null;
    this.worker?.terminate(); this.worker = null; this.ready = null;
    for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(new Error(reason)); }
    this.pending.clear();
  }
}

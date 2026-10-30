"""Real Python/NumPy teaching helpers. This is course_nn, not the PyTorch package."""
import contextlib
import inspect
import io
import json
import math
import sys
import time
import traceback
import types
import numpy as np

_TRACE = []
_INPUT_SHAPE = None
_LAST_TENSOR = None
_FILENAME = "residual_block.py"
_SOURCE_LINES = []


def _location():
    frame = sys._getframe(1)
    while frame:
        if frame.f_code.co_filename == _FILENAME:
            positions = list(frame.f_code.co_positions())
            index = frame.f_lasti // 2
            location = positions[index] if 0 <= index < len(positions) else (frame.f_lineno, frame.f_lineno, 0, 0)
            line, end_line, column, end_column = location
            line, end_line = line or frame.f_lineno, end_line or frame.f_lineno
            def utf16_column(number, byte_offset):
                text = _SOURCE_LINES[number - 1] if 0 < number <= len(_SOURCE_LINES) else ""
                prefix = text.encode("utf-8")[:byte_offset or 0].decode("utf-8", errors="ignore")
                return len(prefix.encode("utf-16-le")) // 2
            return {"line": line, "endLine": end_line,
                    "column": utf16_column(line, column), "endColumn": utf16_column(end_line, end_column)}
        frame = frame.f_back
    return {"line": 1, "endLine": 1, "column": 0, "endColumn": 0}


def _preview(data):
    if data.ndim == 4:
        return data[0, 0, :4, :4].tolist()
    return data.reshape(-1)[:16].reshape(1, -1).tolist()


def _record(kind, inputs, data, layer=None):
    node = {"id": f"n{len(_TRACE) + 1}", "kind": kind,
            "inputs": [x.node for x in inputs if isinstance(x, Tensor) and x.node],
            **_location(), "shape": list(data.shape), "dtype": str(data.dtype),
            "inputShapes": [list(_array(x).shape) for x in inputs],
            "preview": _preview(data), "mean": float(data.mean()) if data.size else 0}
    if layer is not None:
        node["layer"] = layer
    _TRACE.append(node)
    return Tensor(data, node=node["id"])


class Tensor:
    __array_priority__ = 1000

    def __init__(self, data, node=None):
        self.data = np.asarray(data, dtype=np.float32)
        self.node = node

    @property
    def shape(self):
        return self.data.shape

    @property
    def ndim(self):
        return self.data.ndim

    @property
    def dtype(self):
        return self.data.dtype

    def __repr__(self):
        return f"tensor({np.array2string(self.data, precision=4)}, shape={self.shape})"

    def __array__(self, dtype=None, copy=None):
        return np.array(self.data, dtype=dtype, copy=copy) if copy is not None else np.asarray(self.data, dtype=dtype)

    def __len__(self):
        return len(self.data)

    def __getitem__(self, item):
        return _record("Slice", [self], np.asarray(self.data[item]))

    def __add__(self, other):
        return _record("Add", [self, other], self.data + _array(other))

    __radd__ = __add__

    def __sub__(self, other):
        return _record("Subtract", [self, other], self.data - _array(other))

    def __rsub__(self, other):
        return _record("Subtract", [self], _array(other) - self.data)

    def __mul__(self, other):
        return _record("Multiply", [self, other], self.data * _array(other))

    __rmul__ = __mul__

    def __truediv__(self, other):
        return _record("Divide", [self, other], self.data / _array(other))

    def __matmul__(self, other):
        return _record("MatMul", [self, other], self.data @ _array(other))

    def __neg__(self):
        return _record("Negate", [self], -self.data)

    def __bool__(self):
        return bool(self.data)

    def numpy(self):
        return self.data.copy()

    def detach(self):
        return self

    def cpu(self):
        return self

    def item(self):
        return self.data.item()

    def size(self, dim=None):
        return self.shape if dim is None else self.shape[dim]

    def mean(self, dim=None, keepdim=False):
        return _record("Mean", [self], np.asarray(self.data.mean(axis=dim, keepdims=keepdim)))

    def sum(self, dim=None, keepdim=False):
        return _record("Sum", [self], np.asarray(self.data.sum(axis=dim, keepdims=keepdim)))

    def reshape(self, *shape):
        if len(shape) == 1 and isinstance(shape[0], (tuple, list)):
            shape = shape[0]
        return _record("Reshape", [self], self.data.reshape(*shape))

    view = reshape

    def flatten(self, start_dim=0, end_dim=-1):
        end_dim = end_dim % self.ndim
        shape = self.shape[:start_dim] + (math.prod(self.shape[start_dim:end_dim + 1]),) + self.shape[end_dim + 1:]
        return _record("Flatten", [self], self.data.reshape(shape))

    def relu(self):
        return _record("ReLU", [self], np.maximum(self.data, 0))


def _array(value):
    return value.data if isinstance(value, Tensor) else np.asarray(value)


def _input(data):
    global _INPUT_SHAPE
    if _INPUT_SHAPE is None:
        _INPUT_SHAPE = list(np.shape(data))
        return Tensor(data, "input")
    return _record("Input", [], np.asarray(data, dtype=np.float32))


def _pair(value):
    return (value, value) if isinstance(value, int) else tuple(value)


class Module:
    def __init__(self):
        self.training = True

    def forward(self, x):
        raise NotImplementedError("请实现 forward(self, x)")

    def __call__(self, *args, **kwargs):
        global _LAST_TENSOR
        output = self.forward(*args, **kwargs)
        if isinstance(output, Tensor):
            _LAST_TENSOR = output
        return output

    def eval(self):
        self.training = False
        return self

    def train(self, mode=True):
        self.training = mode
        return self

    def __repr__(self):
        children = [f"  ({name}): {value}" for name, value in vars(self).items() if isinstance(value, Module)]
        return f"{type(self).__name__}(\n" + "\n".join(children) + "\n)"


class Conv2d(Module):
    def __init__(self, in_channels, out_channels, kernel_size, stride=1, padding=0, bias=False):
        super().__init__()
        self.in_channels, self.out_channels = in_channels, out_channels
        self.kernel_size, self.stride, self.padding = _pair(kernel_size), _pair(stride), _pair(padding)
        kh, kw = self.kernel_size
        weights = ((np.arange(kh * kw * in_channels * out_channels) % 7) - 2).astype(np.float32) / (kh * kw * in_channels * 3)
        self.weight = Tensor(weights.reshape(kh, kw, in_channels, out_channels).transpose(3, 2, 0, 1))
        self.bias = Tensor(np.zeros(out_channels, dtype=np.float32)) if bias else None

    def forward(self, x):
        data = _array(x)
        if data.ndim != 4 or data.shape[1] != self.in_channels:
            raise ValueError(f"Conv2d 需要 [N, {self.in_channels}, H, W]，实际为 {data.shape}")
        ph, pw = self.padding
        data = np.pad(data, ((0, 0), (0, 0), (ph, ph), (pw, pw)))
        windows = np.lib.stride_tricks.sliding_window_view(data, self.kernel_size, axis=(2, 3))
        sh, sw = self.stride
        windows = windows[:, :, ::sh, ::sw]
        output = np.einsum("ncyxkl,ockl->noyx", windows, self.weight.data, optimize=True)
        if self.bias is not None:
            output += self.bias.data.reshape(1, -1, 1, 1)
        return _record("Conv", [x], output, {"kind": "Conv", "channels": self.in_channels,
                       "filters": self.out_channels, "kernel": self.kernel_size[0], "padding": ph})


class ReLU(Module):
    def __init__(self, inplace=False):
        super().__init__()

    def forward(self, x):
        return _record("ReLU", [x], np.maximum(_array(x), 0))


class Sequential(Module):
    def __init__(self, *modules):
        super().__init__()
        self.modules = list(modules)

    def forward(self, x):
        for module in self.modules:
            x = module(x)
        return x

    def __getitem__(self, index):
        return self.modules[index]


class Flatten(Module):
    def __init__(self, start_dim=1, end_dim=-1):
        super().__init__()
        self.start_dim, self.end_dim = start_dim, end_dim

    def forward(self, x):
        return x.flatten(self.start_dim, self.end_dim)


class Linear(Module):
    def __init__(self, in_features, out_features, bias=True):
        super().__init__()
        self.weight = Tensor(np.arange(in_features * out_features, dtype=np.float32).reshape(out_features, in_features) % 7 / (in_features * 3))
        self.bias = Tensor(np.zeros(out_features)) if bias else None

    def forward(self, x):
        out = _array(x) @ self.weight.data.T
        if self.bias is not None:
            out += self.bias.data
        return _record("Linear", [x], out)


class Identity(Module):
    def forward(self, x):
        return x


class _NoGrad:
    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


_RNG = np.random.default_rng(0)


def _randn(*shape):
    if len(shape) == 1 and isinstance(shape[0], (tuple, list)):
        shape = shape[0]
    return _input(_RNG.standard_normal(shape).astype(np.float32))


def _manual_seed(seed):
    global _RNG
    _RNG = np.random.default_rng(seed)


nn = types.SimpleNamespace(Module=Module, Conv2d=Conv2d, ReLU=ReLU, Sequential=Sequential,
                           ModuleList=list, Flatten=Flatten, Linear=Linear, Identity=Identity)
torch = types.SimpleNamespace(Tensor=Tensor, tensor=lambda data, **kw: _input(np.asarray(data, dtype=np.float32)),
                             randn=_randn, zeros=lambda *shape: _input(np.zeros(shape)), ones=lambda *shape: _input(np.ones(shape)),
                             manual_seed=_manual_seed, relu=lambda x: x.relu(), no_grad=_NoGrad,
                             flatten=lambda x, start_dim=0, end_dim=-1: x.flatten(start_dim, end_dim))
_course = types.ModuleType("course_nn")
_course.__doc__ = "NumPy 教学神经网络接口；不是 PyTorch，未实现训练与自动求导。"
_course.nn, _course.torch, _course.Tensor = nn, torch, Tensor
sys.modules["course_nn"] = _course



def conv2d(x, weight, padding=0, stride=1):
    """NumPy-backed NCHW convolution; the supplied kernel is used as-is."""
    if not isinstance(x, Tensor):
        x = _input(x)
    weights = _array(weight)
    if weights.ndim != 4:
        raise ValueError("卷积核形状应为 [输出通道, 输入通道, 高, 宽]")
    operation = Conv2d(weights.shape[1], weights.shape[0], weights.shape[2:], stride=stride, padding=padding)
    operation.weight = Tensor(weights)
    return operation.forward(x)


def relu(x):
    if not isinstance(x, Tensor):
        x = _input(x)
    return x.relu()


_ops = types.ModuleType("course_ops")
_ops.__doc__ = "基于 NumPy 的简单教学算子；tensor 记录数据来源，conv2d 和 relu 执行真实运算。"
_ops.tensor, _ops.conv2d, _ops.relu = _input, conv2d, relu
sys.modules["course_ops"] = _ops

def _infer_channels(model):
    if isinstance(model, Conv2d):
        return model.in_channels
    for value in vars(model).values():
        if isinstance(value, Conv2d):
            return value.in_channels
        if isinstance(value, Sequential):
            for child in value.modules:
                if isinstance(child, Conv2d):
                    return child.in_channels
    return 4


def _run_student(source):
    global _TRACE, _INPUT_SHAPE, _LAST_TENSOR, _SOURCE_LINES
    _SOURCE_LINES = source.splitlines()
    _TRACE, _INPUT_SHAPE, _LAST_TENSOR = [], None, None
    _manual_seed(0)
    stdout, stderr = io.StringIO(), io.StringIO()
    namespace = {"__name__": "__main__", "nn": nn, "torch": torch, "np": np}
    started = time.perf_counter()
    try:
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            exec(compile(source, _FILENAME, "exec"), namespace)
            output = _LAST_TENSOR
            if output is None:
                candidates = [value for value in namespace.values() if isinstance(value, type)
                              and issubclass(value, Module) and value is not Module and value.__module__ == "__main__"]
                if candidates:
                    model = candidates[-1]()
                    channels = _infer_channels(model)
                    values = ((np.arange(64 * channels) % 29) - 10).astype(np.float32).reshape(1, 8, 8, channels) / 20
                    output = model(_input(values.transpose(0, 3, 1, 2)))
            if output is None:
                output = namespace.get("y", namespace.get("output"))
        graph, result = None, None
        if isinstance(output, (Tensor, np.ndarray)):
            tensor = output if isinstance(output, Tensor) else Tensor(output)
            reachable = []
            by_id = {node["id"]: node for node in _TRACE}
            visited = set()
            def visit(node_id):
                if node_id in visited or node_id not in by_id:
                    return
                node = by_id[node_id]
                for previous in node["inputs"]:
                    visit(previous)
                visited.add(node_id)
                reachable.append(node)
            visit(tensor.node)
            shape = _INPUT_SHAPE or list(tensor.shape)
            graph = {"channels": shape[1] if len(shape) == 4 else 1,
                     "inputShape": shape, "nodes": reachable, "output": tensor.node or "input"}
            data = tensor.data
            preview = data[0, 0, :4, :4].tolist() if data.ndim == 4 else data.reshape(-1)[:16].reshape(1, -1).tolist()
            result = {"shape": list(data.shape), "preview": preview,
                      "mean": float(data.mean()) if data.size else 0, "elapsed": (time.perf_counter() - started) * 1000}
        return json.dumps({"ok": True, "graph": graph, "result": result,
                           "stdout": stdout.getvalue()[:100000], "stderr": stderr.getvalue()[:100000]})
    except BaseException as error:
        line = getattr(error, "lineno", None)
        tb = error.__traceback__
        while tb:
            if tb.tb_frame.f_code.co_filename == _FILENAME:
                line = tb.tb_lineno
            tb = tb.tb_next
        return json.dumps({"ok": False, "graph": None, "result": None,
                           "stdout": stdout.getvalue()[:100000], "stderr": stderr.getvalue()[:100000],
                           "error": f"{type(error).__name__}: {error}", "line": line,
                           "traceback": traceback.format_exc()})

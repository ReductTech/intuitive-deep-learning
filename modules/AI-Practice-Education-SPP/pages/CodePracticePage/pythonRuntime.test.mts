import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadPyodide } from 'pyodide';
import { PYTHON_INITIAL_CODE, NUMPY_INITIAL_CODE } from './pythonRuntime.ts';

const root = new URL('../../../../', import.meta.url);
const python = await loadPyodide({ indexURL: fileURLToPath(new URL('node_modules/pyodide/', root)) });
const wheels = new URL('../../runtime/pyodide/', import.meta.url);
const wheel = (await readdir(wheels)).find(name => name.endsWith('.whl'))!;
await python.loadPackage(fileURLToPath(new URL(wheel, wheels)).replaceAll('\\', '/'));
await python.runPythonAsync(await readFile(new URL('./pythonPrelude.py', import.meta.url), 'utf8'));
const execute = python.globals.get('_run_student');
const run = (source: string) => JSON.parse(execute(source));

test('executes the real residual block and accepts print inside forward', () => {
  const result = run(PYTHON_INITIAL_CODE.replace('        return', '        print("hello", out.shape)\n        return'));
  assert.equal(result.ok, true);
  assert.equal(result.stdout, 'hello (1, 4, 8, 8)\n');
  assert.deepEqual(result.result.shape, [1, 4, 8, 8]);
  assert.ok(Math.abs(result.result.mean - .30003) < .00001);
  assert.deepEqual(result.graph.nodes.map((n: {kind: string}) => n.kind), ['Conv', 'ReLU', 'Conv', 'Add', 'ReLU']);
});

test('regular Python supports imports, comprehensions, loops, functions and NumPy', () => {
  const result = run('import sys, math, json\nimport numpy as np\ndef square(x):\n    return x*x\nfor i in range(3):\n    print(square(i))\nprint(np.arange(5).sum())\nprint(math.sqrt(16))\nprint(sys.version_info.major)\n');
  assert.equal(result.ok, true);
  assert.equal(result.stdout, '0\n1\n4\n10\n4.0\n3\n');
  assert.equal(result.graph, null);
});

test('ordinary Python control flow actually changes the executed graph', () => {
  const source = PYTHON_INITIAL_CODE.replace('        out = self.relu(self.conv1(x))', '        def twice(value):\n            for _ in range(2):\n                value = self.relu(value)\n            return value\n        out = twice(self.conv1(x))');
  const result = run(source);
  assert.equal(result.ok, true);
  assert.equal(result.graph.nodes.filter((n: {kind: string}) => n.kind === 'ReLU').length, 3);
  const noShortcut = run(PYTHON_INITIAL_CODE.replace('out + x', 'out'));
  assert.notEqual(result.result.mean, noShortcut.result.mean);
});

test('reports actual Python exceptions, accurate source lines and printed output before failure', () => {
  const result = run('print("before")\nraise ValueError("real error")\n');
  assert.equal(result.ok, false);
  assert.equal(result.stdout, 'before\n');
  assert.equal(result.line, 2);
  assert.match(result.traceback, /ValueError: real error/);
  assert.match(result.traceback, /residual_block.py/);
  assert.equal(result.graph, null);
  assert.equal(run('if True\n    print(1)').ok, false);
  assert.equal(run('print("recovered")').stdout, 'recovered\n');
});

test('execution source spans distinguish nested operations on the same line', () => {
  const result = run(PYTHON_INITIAL_CODE);
  const lines = PYTHON_INITIAL_CODE.split('\n');
  const spans = result.graph.nodes.map((node: {line: number; column: number; endColumn: number}) => lines[node.line - 1].slice(node.column, node.endColumn));
  assert.deepEqual(spans, ['self.conv1(x)', 'self.relu(self.conv1(x))', 'self.conv2(out)', 'out + x', 'self.relu(out + x)']);
  result.graph.nodes.forEach((node: {inputShapes: number[][]; preview: number[][]; dtype: string}) => {
    assert.ok(node.inputShapes.length > 0);
    assert.equal(node.preview.length, 4);
    assert.equal(node.dtype, 'float32');
  });
});

test('simple NumPy example uses actual supplied weights and one operation per line', () => {
  const original = run(NUMPY_INITIAL_CODE);
  assert.equal(original.ok, true);
  assert.deepEqual(original.graph.nodes.map((node: {kind: string}) => node.kind), ['Conv', 'ReLU', 'Conv', 'Add', 'ReLU']);
  assert.equal(new Set(original.graph.nodes.map((node: {line: number}) => node.line)).size, 5);
  assert.deepEqual(original.result.shape, [1, 1, 8, 8]);
  const zeroWeights = run(NUMPY_INITIAL_CODE.replace('np.ones((1,1,3,3)', 'np.zeros((1,1,3,3)'));
  assert.equal(zeroWeights.ok, true);
  assert.ok(original.result.mean > zeroWeights.result.mean);
  assert.ok(Math.abs(zeroWeights.result.mean - 31.5/64) < 1e-6);
  assert.equal(run(NUMPY_INITIAL_CODE.replace('    return relu(out)', '    print(out.shape)\n    return relu(out)')).stdout, '(1, 1, 8, 8)\n');
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { graphNodes, connectionError, isRes2NetChain, parameterWeights } from './res2netGraph.ts';

test('independent modules and depth keep the ordinary receptive fields', () => {
  assert.deepEqual(graphNodes([1, 2, 3], []).filter(n => n.layer === [1, 2, 3][n.branch] - 1).map(n => n.ranges), [[3], [5], [7]]);
});
test('a nonadjacent connection changes the chosen target only', () => {
  const nodes = graphNodes([1, 1, 1], [{ from: '0:0', to: '2:0' }]);
  assert.deepEqual(nodes.map(n => n.ranges), [[3], [3], [3, 5]]);
});
test('right-to-left chain is valid and learns three scales', () => {
  const edges = [{ from: '2:0', to: '0:0' }, { from: '0:0', to: '1:0' }];
  assert.equal(connectionError([1, 1, 1], [], '2:0', '0:0'), null);
  assert.deepEqual(graphNodes([1, 1, 1], edges).map(n => n.ranges), [[3, 5], [3, 5, 7], [3]]);
  assert.equal(isRes2NetChain([1, 1, 1], edges), true);
});
test('fan-in and fan-out are allowed, but are not mislabeled as Res2Net', () => {
  const fork = [{ from: '0:0', to: '1:0' }, { from: '0:0', to: '2:0' }];
  const join = [{ from: '0:0', to: '2:0' }, { from: '1:0', to: '2:0' }];
  assert.equal(isRes2NetChain([1, 1, 1], fork), false);
  assert.equal(isRes2NetChain([1, 1, 1], join), false);
  assert.deepEqual(graphNodes([1, 1, 1], join)[2].ranges, [3, 5]);
});
test('rejects self, duplicate, missing modules and cycles including base wires', () => {
  const edges = [{ from: '0:0', to: '2:0' }];
  assert.match(connectionError([1, 1, 1], edges, '2:0', '0:0')!, /回路/);
  assert.match(connectionError([1, 1, 1], edges, '0:0', '2:0')!, /已经/);
  assert.match(connectionError([1, 1, 1], [], '0:0', '0:0')!, /自己/);
  assert.match(connectionError([2, 1], [], '0:1', '0:0')!, /回路/);
  assert.match(connectionError([2, 1], [], '0:0', '0:1')!, /已经/);
  assert.match(connectionError([1], [], '0:0', '9:0')!, /模块/);
});
test('a skip can target an individual later convolution inside a branch', () => {
  assert.equal(connectionError([3], [], '0:0', '0:2'), null);
  assert.deepEqual(graphNodes([3], [{ from: '0:0', to: '0:2' }])[2].ranges, [5, 7]);
});

test('parameter counts reflect narrow group convolutions and full-width branches', () => {
  assert.equal(parameterWeights([1], 96, false).total, 101376);
  assert.equal(parameterWeights([1], 96, true).total, 39168);
  assert.equal(parameterWeights([1, 1], 96, true).total, 36864);
  assert.equal(parameterWeights([1, 0], 96, true).total, 27648);
  assert.equal(parameterWeights([1, 0, 0], 96, true).total, 23616);
  assert.equal(parameterWeights([1, 1, 0], 96, true).total, 28800);
  assert.equal(parameterWeights([1, 1, 1], 96, true).total, 33984);
  assert.deepEqual(graphNodes([1, 0, 1], []).map(node => node.id), ['0:0', '2:0']);
  assert.equal(parameterWeights([1, 1], 96, false).total, 193536);
});

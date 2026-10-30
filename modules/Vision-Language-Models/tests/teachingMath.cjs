// node modules/Vision-Language-Models/tests/teachingMath.cjs
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../model/teachingMath.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exported = {};
new Function('exports', compiled)(exported);
const { patchStats, softmax, clipLoss, normalize, dot, ensemble } = exported;
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-10, `${a} != ${b}`);

assert.deepEqual([1, 8, 16, 32].map(p => patchStats(224, p).tokens), [50176, 784, 196, 49]);
assert.equal(patchStats(224, 8).comparisons / patchStats(224, 16).comparisons, 16);
assert.equal(patchStats(224, 16).flattened, 768);
assert.throws(() => patchStats(224, 15));
const large = softmax([10001, 10002, 10003], .05);
close(large.reduce((a, b) => a + b), 1);
assert.ok(large.every(Number.isFinite));
assert.ok(softmax([.9, .1], .05)[0] > softmax([.9, .1], 1)[0]);
assert.throws(() => softmax([1, 2], 0));
const asymmetric = [[.9, .4, .1], [.2, .8, .3], [.1, .6, .7]];
const oracle = rows => rows.reduce((sum, row, i) => sum - Math.log(Math.exp(row[i]) / row.reduce((s, x) => s + Math.exp(x), 0)), 0) / rows.length;
const loss = clipLoss(asymmetric, 1);
close(loss.image, oracle(asymmetric));
close(loss.text, oracle(asymmetric[0].map((_, i) => asymmetric.map(row => row[i]))));
close(loss.total, (loss.image + loss.text) / 2);
close(clipLoss([[0, 0], [0, 0]], 1).total, Math.log(2));
close(Math.hypot(...ensemble([[1, 0], [0, 1]])), 1);
assert.deepEqual(ensemble([[10, 0], [0, 3]]), ensemble([[1, 0], [0, 1]]));
close(dot(normalize([3, 4]), normalize([3, 4])), 1);
const weights = softmax([1, .2, .3].map(x => x / Math.sqrt(2)));
const output = [weights[0] + weights[2] / 2, weights[1] + weights[2] / 2];
close(output[0] + output[1], 1);
console.log('PASS: patch counts, matrix scaling, stable softmax, bidirectional loss, normalized ensemble and attention weighted sum.');

const { scoreGradient, optimizeScores, projectPatch, projectToken, maskedAttention } = exported;
const { initialToyEncoders, trainToyEncoders, toyEncoderLoss, toyEncoderScores } = exported;
const trainedEncoders = trainToyEncoders(initialToyEncoders);
assert.notDeepEqual(trainedEncoders.image, initialToyEncoders.image);
assert.notDeepEqual(trainedEncoders.text, initialToyEncoders.text);
assert.ok(toyEncoderLoss(trainedEncoders).total < toyEncoderLoss(initialToyEncoders).total);
assert.ok(toyEncoderScores(trainedEncoders)[0][0] > toyEncoderScores(initialToyEncoders)[0][0]);
// Numerical derivative independently verifies both directions of the loss gradient.
for (const tau of [.1, .5, 1]) {
  const grad = scoreGradient(asymmetric, tau), epsilon = 1e-6;
  asymmetric.forEach((row,i)=>row.forEach((_,j)=>{
    const plus=asymmetric.map(r=>r.slice()), minus=asymmetric.map(r=>r.slice());
    plus[i][j]+=epsilon; minus[i][j]-=epsilon;
    const numerical=(clipLoss(plus,tau).total-clipLoss(minus,tau).total)/(2*epsilon);
    assert.ok(Math.abs(numerical-grad[i][j])<1e-7);
  }));
  let m=asymmetric;
  for(let i=0;i<20;i++) { const next=optimizeScores(m,tau); assert.ok(clipLoss(next,tau).total<clipLoss(m,tau).total); m=next; }
}
const embeddingMatrix = [[.5,0,.25],[.5,0,.25],[0,.5,.25],[0,.5,.25]];
assert.deepEqual(projectPatch([1,2,3,4], embeddingMatrix), [1.5,3.5,2.5]);
assert.deepEqual(projectPatch([4,3,2,1], embeddingMatrix), [3.5,1.5,2.5]);
assert.throws(() => projectPatch([1,2,3], embeddingMatrix));
assert.throws(() => projectPatch([1,2,3,4], [[1,0],[1],[1,0],[1,0]]));
const projection = [[.6,.3,.1],[.1,.7,.2],[.2,.1,.7],[.4,.4,.2]];
assert.deepEqual(projectToken(projection,[1,0,0]), [.6,.1,.2,.4]);
assert.deepEqual(projectToken(projection,[0,1,0]), [.3,.7,.1,.4]);
assert.equal(projectToken(projection,[.8,.1,.1]).length, 4);
assert.throws(()=>projectToken(projection,[1,0]));
assert.throws(()=>projectToken([[NaN,0,1]],[1,0,0]));
for (let mask=1;mask<8;mask++) {
  const enabled=[0,1,2].map(i=>Boolean(mask&(1<<i)));
  const {weights,output}=maskedAttention([-.4,1.8],enabled);
  close(weights.reduce((s,v)=>s+v,0),1); close(output[0]+output[1],1);
  enabled.forEach((on,i)=>{if(!on)assert.equal(weights[i],0);});
}
assert.throws(()=>maskedAttention([1,0],[false,false,false]));
console.log('PASS: finite-difference gradient, 60 descending optimization steps, Patch projection, all seven attention masks.');

const { teacherForcingLoss } = exported;
close(teacherForcingLoss([.5, .5]), -Math.log(.5));
assert.ok(teacherForcingLoss([.3, .4, .5]) > teacherForcingLoss([.5, .6, .7]));
assert.throws(() => teacherForcingLoss([]));
assert.throws(() => teacherForcingLoss([0, .5]));
console.log('PASS: teacher-forcing loss is finite, validated and decreases as target-token probabilities rise.');

const { connectorTrainingStep } = exported;
const training = connectorTrainingStep();
const scalarLoss = w => -Math.log(softmax([w, 0])[0]);
const difference = (scalarLoss(training.weight+1e-6)-scalarLoss(training.weight-1e-6))/2e-6;
assert.ok(Math.abs(difference-training.gradient)<1e-8);
close(training.nextWeight, training.weight-training.learningRate*training.gradient);
assert.ok(training.after.loss<training.before.loss);
assert.ok(training.after.probabilities[0]>training.before.probabilities[0]);
assert.equal(training.before.loss.toFixed(3), '0.598');
assert.equal(training.after.loss.toFixed(3), '0.503');
assert.equal((training.after.probabilities[0]*100).toFixed(1), '60.5');
assert.throws(()=>connectorTrainingStep(.2, 1, 0));
console.log('PASS: scalar connector forward, CE, independently checked gradient and real parameter update.');

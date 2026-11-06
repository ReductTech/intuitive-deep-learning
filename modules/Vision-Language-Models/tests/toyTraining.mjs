import assert from 'node:assert/strict';
import {
  initialToyEncoders,
  softmax,
  toyEncoderLoss,
  toyEncoderScores,
  trainToyEncoders,
} from '../model/teachingMath.ts';

let state = initialToyEncoders;
let previousLoss = toyEncoderLoss(state).total;
const initialImage = JSON.stringify(state.image);
const initialText = JSON.stringify(state.text);
for (let step = 0; step < 12; step += 1) {
  state = trainToyEncoders(state);
  const nextLoss = toyEncoderLoss(state).total;
  assert.ok(nextLoss < previousLoss, `loss must fall after update ${step + 1}`);
  previousLoss = nextLoss;
  const scores = toyEncoderScores(state);
  assert.ok(scores.flat().every(score => score >= -1 && score <= 1));
  for (const row of scores) {
    const total = softmax(row, .4).reduce((sum, value) => sum + value, 0);
    assert.ok(Math.abs(total - 1) < 1e-12);
  }
}
assert.notEqual(JSON.stringify(state.image), initialImage, 'image encoder weights must update');
assert.notEqual(JSON.stringify(state.text), initialText, 'text encoder weights must update');
assert.ok(previousLoss < toyEncoderLoss(initialToyEncoders).total / 2);
console.log('Toy dual-encoder training: 12 decreasing loss steps, valid similarities and probabilities, both encoders updated.');

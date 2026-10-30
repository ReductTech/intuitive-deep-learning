import assert from 'node:assert/strict';
import {correlate,initialSettings} from '../modules/Creator-Guide/components/disclosure/convolutionExperiment.ts';
assert.deepEqual(correlate(initialSettings),Array.from({length:5},()=>[0,3,3,0,0]));
assert.deepEqual(correlate({...initialSettings,kernel:'horizontal'}),Array.from({length:5},()=>[0,0,0,0,0]));
assert.deepEqual(correlate({...initialSettings,kernel:'horizontal',pattern:'horizontal'}),[[0,0,0,0,0],[3,3,3,3,3],[3,3,3,3,3],[0,0,0,0,0],[0,0,0,0,0]]);
for(const stride of [1,2])for(const padding of [0,1]){
const out=correlate({...initialSettings,stride,padding});assert.equal(out.length,Math.floor((7+padding*2-3)/stride)+1);assert(out.flat().every(Number.isFinite));}
assert(Math.abs(correlate({...initialSettings,kernel:'average'})[1][1]-1/3)<1e-10);
const padded=correlate({...initialSettings,padding:1});assert(padded.flat().some(v=>v<0));
console.log('Verified vertical and horizontal edge responses, orthogonal zero response, mean filter, signed padding response and output dimensions.');

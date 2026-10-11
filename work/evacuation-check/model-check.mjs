import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
const source=fs.readFileSync('modules/Gradient-Descent/model.ts','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const m=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
let s={...m.newGame(),phase:'playing'};
assert.equal(s.scan,false);
assert.equal(m.movePlayer(s,{x:40,z:8}).moves.length,0);
assert.equal(m.movePlayer(s,{x:100,z:0}).moves.length,0);
for(const b of m.BRIDGES){assert.equal(m.landingProblem(b),null);assert.equal(m.terrainHeight(b.x,b.z),.55);assert.ok(Math.abs(m.riverX(b.z)-b.x)<.001);}
assert.ok(m.landingProblem({x:m.riverX(1),z:1}));
for(const [x,z]of [[-11.8,10.8],[-10.5,4.2],[-10.5,-2.4],[-4.3,-5.4],[2.2,-6.8],[8.5,-6.8],[15.2,-6.8],[21,-7.5],[25,-12.5],[29,-18],[30,-20.4]])s=m.movePlayer(s,{x,z});
assert.equal(s.moves.length,11);assert.deepEqual(new Set(s.collected),new Set(['scanner','medicine','compass']));assert.ok(m.canRescue(s));assert.ok(s.health>0&&s.health<80);
let p={...m.START};for(let i=0;i<160&&m.radiation(p)>.43;i++){const d=m.descentDirection(p),q={x:p.x+d.x*.5,z:p.z+d.z*.5};assert.ok(m.radiation(q)<m.radiation(p));p=q;}
assert.ok(m.radiation(p)<.43,'Local downhill information reaches the low-radiation region');
const near={x:m.EXIT.x-2,z:m.EXIT.z},d=m.descentDirection(near);assert.ok(m.radiation({x:near.x+d.x*15,z:near.z+d.z*15})>m.radiation(near),'A large step can overshoot safety');
let lost={...m.newGame(),phase:'playing',health:1};lost=m.movePlayer(lost,{x:m.START.x+1,z:m.START.z});assert.equal(lost.phase,'lost');assert.equal(lost.health,0);assert.equal(m.movePlayer(lost,m.EXIT),lost);
console.log(JSON.stringify({checks:'passed',routeMoves:s.moves.length,remainingHealth:s.health,localDescentRadiation:m.radiation(p)},null,2));

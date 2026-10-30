import assert from 'node:assert/strict';
import test from 'node:test';
import { allocatePaperStacks, PAPER_HEIGHT, paperStackSlots, readerPose } from './paperStacks.ts';
import { projectPaperPage } from './paperPerspective.ts';

test('A4 sheet projection joins the stack and recedes toward the shared camera', () => {
  for (const left of [180,700,1200]) {
    const width=120, frontY=250, vanishingX=769, vanishingY=-430;
    const page=projectPaperPage(width,left,frontY,vanishingX,vanishingY);
    const project=(x:number,y:number)=>{
      const m=page.matrix, denominator=m[3]*x+m[7]*y+m[15];
      return [(m[0]*x+m[4]*y+m[12])/denominator,
        (m[1]*x+m[5]*y+m[13])/denominator];
    };
    const nearLeft=project(0,page.sourceHeight),nearRight=project(width,page.sourceHeight);
    assert.ok(Math.abs(nearLeft[0])+Math.abs(nearLeft[1])<1e-8);
    assert.ok(Math.abs(nearRight[0]-width)+Math.abs(nearRight[1])<1e-8);
    const farLeft=project(0,0),farRight=project(width,0);
    assert.ok(farRight[0]-farLeft[0]<width);
    assert.equal(page.sourceHeight/width,Math.SQRT2);
    for(const [near,far] of [[nearLeft,farLeft],[nearRight,farRight]]) {
      const cross=(far[0]-near[0])*(vanishingY-frontY)
        -(far[1]-near[1])*(vanishingX-left-near[0]);
      assert.ok(Math.abs(cross)<1e-7);
    }
  }
});

test('paper quantity is conserved and total stack height stays linear through 2027', () => {
  for (const count of [0,67,87,143,265,1018,4938,11603,19525,43013]) {
    const stacks=allocatePaperStacks(count);
    assert.equal(stacks.reduce((n,s)=>n+s.papers,0),count);
    assert.ok(Math.abs(stacks.reduce((n,s)=>n+s.height,0)-count*PAPER_HEIGHT)<1e-7);
    assert.ok(stacks.every(s=>s.papers>=0&&s.papers<=s.capacity));
  }
});

test('all anchors remain fixed and every stack grows monotonically with submissions', () => {
  let previous=allocatePaperStacks(0);
  for(let count=1;count<=43013;count+=97) {
    const current=allocatePaperStacks(count);
    current.forEach((s,i)=>{
      assert.deepEqual([s.id,s.x,s.y,s.width,s.layer],[previous[i].id,previous[i].x,previous[i].y,previous[i].width,previous[i].layer]);
      assert.ok(s.height>=previous[i].height);
    });
    previous=current;
  }
  assert.deepEqual(allocatePaperStacks(67),allocatePaperStacks(67));
});

test('overflow extends onto floor only after the desk fills, within the fixed scene', () => {
  assert.ok(allocatePaperStacks(11603).filter(s=>s.surface==='floor').every(s=>s.papers===0));
  assert.ok(allocatePaperStacks(43013).filter(s=>s.surface==='floor').reduce((n,s)=>n+s.papers,0)>20000);
  assert.ok(paperStackSlots.every(s=>s.x>=0&&s.x+s.width<100&&s.y<=100));
  const floor2026=allocatePaperStacks(19525).filter(s=>s.surface==='floor'&&s.papers>0);
  assert.equal(floor2026.length,3);
  assert.ok(floor2026.every(s=>s.y>=90&&s.layer>12));
  assert.ok(paperStackSlots.filter(s=>s.surface==='floor'&&s.y<90).every(s=>s.layer<3));
  assert.equal(readerPose(2013),'focused');
  assert.equal(readerPose(2021),'relaxed');
  assert.equal(readerPose(2027),'defeated');
});

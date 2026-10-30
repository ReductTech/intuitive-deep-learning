from playwright.sync_api import sync_playwright
import math,json
from pathlib import Path
out=Path('work/evacuation-check');out.mkdir(exist_ok=True)
def bounds(page,selector):
 return page.evaluate('''s=>{let e=document.querySelector(s),b=e.getBoundingClientRect();return {width:b.width,height:b.height,outside:[...e.querySelectorAll('*')].filter(o=>{let r=o.getBoundingClientRect();return r.width&&r.height&&(r.left<b.left-.5||r.top<b.top-.5||r.right>b.right+.5||r.bottom>b.bottom+.5)}).map(o=>String(o.className))}}''',selector)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,channel='chrome',args=['--enable-webgl','--ignore-gpu-blocklist'])
 page=browser.new_page(viewport={'width':1640,'height':940},device_scale_factor=1)
 errors=[];responses=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:responses.append((r.url,r.status)) if r.status>=400 else None)
 page.goto('http://localhost:5173/modules/gradient-descent');page.wait_for_selector('.gd-game[data-ready="true"]',timeout=60000)
 stage=page.locator('.gd-game');slide=page.locator('.gd-slide-surface');canvas=page.locator('.gd-render canvas')
 fps=page.evaluate('''()=>new Promise(resolve=>{let times=[],last=performance.now(),n=0;function sample(t){if(n++>10)times.push(t-last);last=t;if(times.length<75)requestAnimationFrame(sample);else{times.sort((a,b)=>a-b);resolve({medianMs:times[37],p95Ms:times[71],meanFps:1000/(times.reduce((a,b)=>a+b,0)/times.length)});}}requestAnimationFrame(sample);})''')
 print('render_performance',fps)
 slide.screenshot(path=str(out/'3d-default.png'));assert bounds(page,'.gd-slide-surface')['outside']==[]
 page.get_by_role('button',name='开始行动',exact=True).click();page.wait_for_timeout(200)
 def pos():return [float(stage.get_attribute('data-x')),float(stage.get_attribute('data-z'))]
 def jump(x,z,snapshot=None,valid=True):
  a,b=pos();dx=x-a;dz=z-b;R=math.hypot(17,27);D=math.hypot(R,40)
  sx=(dx*27/R+dz*17/R)*1600/54;sy=-(dx*17*40/(R*D)-dz*27*40/(R*D))*1600/54
  rect=canvas.bounding_box();cx=rect['x']+800;cy=rect['y']+450
  moves=int(stage.get_attribute('data-moves'))
  page.mouse.move(cx,cy);page.mouse.down();page.mouse.move(cx-sx,cy-sy,steps=12);page.wait_for_timeout(80)
  if snapshot:slide.screenshot(path=str(out/snapshot));assert bounds(page,'.gd-slide-surface')['outside']==[]
  page.mouse.up();page.wait_for_timeout(750)
  if valid:
   assert int(stage.get_attribute('data-moves'))==moves+1,(pos(),x,z,stage.inner_text())
   assert math.dist(pos(),[x,z])<.02,(pos(),x,z)
  else:assert int(stage.get_attribute('data-moves'))==moves
 jump(-11.8,10.8,'3d-aim.png')
 page.get_by_role('button',name='辐射扫描',exact=True).click();page.wait_for_timeout(200);slide.screenshot(path=str(out/'3d-scan.png'));assert bounds(page,'.gd-slide-surface')['outside']==[]
 page.get_by_role('button',name='关闭扫描',exact=True).click()
 for x,z in [(-10.5,4.2),(-10.5,-2.4),(-4.3,-5.4),(2.2,-6.8)]:jump(x,z)
 jump(8.5,-4.5,'3d-blocked.png',False)
 assert '水面无法落脚' in page.locator('.gd-command-message').inner_text()
 jump(8.5,-6.8,'3d-bridge-aim.png');jump(15.2,-6.8);jump(21,-7.5)
 slide.screenshot(path=str(out/'3d-river.png'))
 # Zoom changes only the viewport; it preserves location and the orb at the centre.
 before=pos();page.mouse.move(820,450);page.mouse.wheel(0,-250);page.wait_for_timeout(300);assert pos()==before
 slide.screenshot(path=str(out/'3d-zoom.png'));page.mouse.wheel(0,250);page.wait_for_timeout(300)
 for x,z in [(25,-12.5),(29,-18),(30,-20.4)]:jump(x,z)
 assert not page.get_by_role('button',name='呼叫救援',exact=True).is_disabled()
 slide.screenshot(path=str(out/'3d-exit.png'));page.get_by_role('button',name='呼叫救援',exact=True).click()
 page.wait_for_timeout(2600);slide.screenshot(path=str(out/'3d-rescue.png'))
 page.wait_for_selector('.gd-game[data-phase="won"]',timeout=12000);slide.screenshot(path=str(out/'3d-won.png'))
 assert bounds(page,'.gd-slide-surface')['outside']==[]
 record=page.evaluate("JSON.parse(localStorage.getItem('gradient-descent:evacuation-record:v1'))")
 assert record['completed'] and set(record['collected'])=={'scanner','compass','medicine'}
 page.get_by_role('button',name='再挑战一次',exact=True).click();page.wait_for_timeout(800)
 assert pos()==[-18,13] and int(stage.get_attribute('data-moves'))==0
 stage.focus();page.keyboard.press('ArrowRight');page.keyboard.press('Space');page.wait_for_timeout(800)
 assert int(stage.get_attribute('data-moves'))==1
 print(json.dumps({'guide_bounds':bounds(page,'.gd-slide-surface'),'complete_moves':len(record['moves']),'health':record['health'],'collected':record['collected'],'errors':errors,'http_errors':responses},ensure_ascii=False))
 page.set_viewport_size({'width':2300,'height':1350})
 page.goto('http://localhost:5173/scenedeck/?deck=gradient-descent&slide=evacuation');page.wait_for_selector('.gd-game[data-ready="true"]',timeout=60000)
 page.wait_for_timeout(400);slide=page.locator('.ppt-slide-surface');slide.screenshot(path=str(out/'3d-ppt.png'))
 assert bounds(page,'.ppt-slide-surface')['outside']==[];print('ppt_bounds',bounds(page,'.ppt-slide-surface'))
 assert not errors and not responses
 browser.close()


